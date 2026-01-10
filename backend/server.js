const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

// Funkcja pomocnicza do czekania (delay)
const delay = ms => new Promise(res => setTimeout(res, ms));

app.post('/api/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nie przesłano pliku.' });
    }

    console.log("1. Wysyłanie pliku do TabScanner...");
    
    const form = new FormData();
    // Kluczowe: TabScanner wymaga nazwy pola 'file'
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const uploadRes = await axios.post('https://api.tabscanner.com/api/2/process', form, {
      headers: {
        'apikey': process.env.TABSCANNER_API_KEY,
        ...form.getHeaders()
      }
    });

    if (uploadRes.data.status !== 'success' && uploadRes.data.code !== 200) {
        throw new Error(`TabScanner Upload Error: ${uploadRes.data.message}`);
    }

    const token = uploadRes.data.token;
    console.log("2. Otrzymano token:", token);

    // 3. Polling (Odpytywanie o wynik)
    let resultData = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      console.log(`Podejście ${attempts + 1}: Pobieranie wyników...`);
      await delay(3000); // Czekaj 3 sekundy między próbami

      const resultRes = await axios.get(`https://api.tabscanner.com/api/2/result/${token}`, {
        headers: { 'apikey': `KSObVGHxhJKkNOubezHQ6f7fh7fNMkXga3tF4EclD804k5qMw70w1IiBXwn5P7L0 ` }
      });

      // Jeśli status to 200 (Success), mamy dane
      if (resultRes.data.status === 'success' || resultRes.data.code === 200) {
        resultData = resultRes.data;
        break;
      }
      
      attempts++;
    }

    if (!resultData) {
      return res.status(408).json({ error: 'Przekroczono czas oczekiwania na analizę.' });
    }

    res.json(resultData);

  } catch (error) {
    // To wypisze szczegóły błędu w konsoli terminala (tam gdzie działa node)
    console.error("SZCZEGÓŁY BŁĘDU:", error.response?.data || error.message);
    res.status(500).json({ 
        error: 'Błąd serwera', 
        details: error.response?.data || error.message 
    });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));