const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Klucz API - upewnij się, że jest poprawny
const TABSCANNER_API_KEY = `KSObVGHxhJKkNOubezHQ6f7fh7fNMkXga3tF4EclD804k5qMw70w1IiBXwn5P7L0 `;

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Tworzenie folderu uploads, jeśli nie istnieje
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 3. Konfiguracja Multer (zapis z rozszerzeniem)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage: storage });

// Funkcja pomocnicza do pauzy
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 4. Endpoint główny
app.post('/process-receipt', upload.single('receipt'), async (req, res) => {
    console.log('--- Nowe żądanie odebrane ---');
    
    if (!req.file) {
        console.error('Błąd: Nie przesłano pliku.');
        return res.status(400).json({ error: 'Brak pliku w żądaniu.' });
    }

    const localFilePath = req.file.path;

    try {
        // KROK A: Wysyłka do Tabscanner
        console.log('Wysyłam plik do Tabscanner:', req.file.filename);
        
        const form = new FormData();
        form.append('file', fs.createReadStream(localFilePath));

        const uploadResponse = await axios.post('https://api.tabscanner.com/api/2/process', form, {
            headers: {
                ...form.getHeaders(),
                'apikey': TABSCANNER_API_KEY
            }
        });

        const token = uploadResponse.data.token;
        console.log('Token otrzymany:', token);

        // KROK B: Pobieranie wyniku (Polling)
        let finalData = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            attempts++;
            console.log(`Próba odebrania wyników ${attempts}/${maxAttempts}...`);
            
            // Czekamy 3 sekundy przed każdą próbą (Tabscanner potrzebuje czasu na OCR)
            await delay(3000);

            const resultResponse = await axios.get(`https://api.tabscanner.com/api/result/${token}`, {
                headers: { 'apikey': TABSCANNER_API_KEY }
            });

            if (resultResponse.data.status === 'success' || resultResponse.data.status_code === 3) {
                finalData = resultResponse.data;
                break;
            }
            
            if (resultResponse.data.status === 'failed') {
                throw new Error('Tabscanner oznaczył proces jako nieudany.');
            }
        }

        // KROK C: Czyszczenie i odpowiedź
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

        if (finalData) {
            console.log('Sukces! Zwracam dane do klienta.');
            return res.json(finalData);
        } else {
            return res.status(202).json({ message: 'Proces trwa zbyt długo, użyj tokena.', token });
        }

    } catch (error) {
        // Logowanie błędów na serwerze (tu zobaczysz co jest nie tak)
        console.error('--- BŁĄD PROCESOWANIA ---');
        if (error.response) {
            console.error('Dane z API:', error.response.data);
        } else {
            console.error('Wiadomość:', error.message);
        }

        // Spróbuj usunąć plik nawet w przypadku błędu
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        
        res.status(500).json({ 
            error: 'Błąd wewnętrzny serwera', 
            details: error.response ? error.response.data : error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Serwer działa na http://localhost:${PORT}`);
    console.log(`📁 Folder na pliki: ${uploadDir}`);
});