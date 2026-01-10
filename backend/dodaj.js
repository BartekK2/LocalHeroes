/* KLIENT ADMINA - DO BACKENDU LOJALNOŚCIOWEGO */
const readline = require('readline-sync');

// Upewnij się, że masz node w wersji 18+ (dla fetch) lub zainstaluj node-fetch
const API_URL = "http://localhost:5000";

let TOKEN = null;
let CURRENT_USER = null; // { role: 'biznes' | 'klient', username: '...' }

async function main() {
    console.log("\n--- PANEL ZARZĄDZANIA LOJALNOŚCIOWEGO ---");
    console.log(`Podłączanie do: ${API_URL}...`);

    // Sprawdzenie czy serwer żyje (np. próbując pobrać biznesy publicznie)
    try {
        await fetch(`${API_URL}/businesses/nearby?lat=52&lng=21`);
        console.log("✅ Serwer aktywny.");
    } catch (e) {
        console.log("❌ BŁĄD: Nie można połączyć z serwerem. Uruchom 'node server.js'!");
        process.exit();
    }

    while (true) {
        const statusAuth = TOKEN ? `ZALOGOWANY JAKO: ${CURRENT_USER.username} (${CURRENT_USER.role})` : "NIEZALOGOWANY";
        console.log(`\nSTATUS: ${statusAuth}`);
        
        const options = [
            'Zarejestruj nowe konto',
            'Zaloguj się',
            'Uzupełnij profil Biznesowy (Lokalizacja GPS)',
            'Dodaj Nagrodę (Wymaga Biznes)',
            'Przeglądaj Biznesy w okolicy',
            'Wyloguj',
            'WYJDŹ'
        ];

        const index = readline.keyInSelect(options, 'Co chcesz zrobic?');

        if (index === -1 || index === 6) {
            console.log("Do widzenia!");
            process.exit();
        }

        try {
            switch (index) {
                case 0: // REJESTRACJA
                    await registerFlow();
                    break;
                case 1: // LOGOWANIE
                    await loginFlow();
                    break;
                case 2: // AKTUALIZACJA PROFILU
                    await updateProfileFlow();
                    break;
                case 3: // DODAJ NAGRODĘ
                    await addRewardFlow();
                    break;
                case 4: // SZUKAJ BIZNESÓW
                    await searchBusinessesFlow();
                    break;
                case 5: // WYLOGUJ
                    TOKEN = null;
                    CURRENT_USER = null;
                    console.log("Wylogowano.");
                    break;
            }
        } catch (error) {
            console.error("Wystąpił błąd w obsłudze:", error.message);
        }
    }
}

// --- LOGIKA AKCJI ---

async function registerFlow() {
    console.log("\n>>> REJESTRACJA <<<");
    const types = ['klient', 'biznes'];
    const typeIdx = readline.keyInSelect(types, 'Wybierz typ konta:');
    if (typeIdx === -1) return;

    const accountType = types[typeIdx];
    const username = readline.question('Login: ');
    const password = readline.question('Haslo: ', { hideEchoBack: true });
    
    let body = { username, password, accountType };

    if (accountType === 'biznes') {
        const nazwa_firmy = readline.question('Nazwa firmy: ');
        body.nazwa_firmy = nazwa_firmy;
    }

    await wyslijNaSerwer('/register', 'POST', body);
}

async function loginFlow() {
    console.log("\n>>> LOGOWANIE <<<");
    const username = readline.question('Login: ');
    const password = readline.question('Haslo: ', { hideEchoBack: true });

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
        TOKEN = data.token;
        CURRENT_USER = { role: data.role, username: data.username };
        console.log("✅ Zalogowano pomyślnie!");
    } else {
        console.log(`❌ Błąd logowania: ${data.message}`);
    }
}

async function updateProfileFlow() {
    if (!TOKEN) { console.log("Musisz być zalogowany!"); return; }
    if (CURRENT_USER.role !== 'biznes') { console.log("Tylko dla kont biznesowych!"); return; }

    console.log("\n>>> AKTUALIZACJA DANYCH FIRMY <<<");
    console.log("(Wciśnij Enter, aby pominąć pole)");

    const miasto = readline.question('Miasto: ');
    const lat = readline.questionFloat('Szerokosc geo (np. 52.2297): ');
    const lng = readline.questionFloat('Dlugosc geo (np. 21.0122): ');
    const kategoria = readline.question('Kategoria (np. Kawiarnia): ');
    const nr_budynku = readline.question('nr budynku: ');
    const numer_na_mapie = readline.question('nr mapa: ');


    // Pobieramy obecny profil, żeby nie nadpisać reszty nullami (w uproszczeniu wysyłamy to co mamy)
    // Twój backend w PUT /profile robi update.
    
    // Budujemy obiekt tylko z wypełnionymi polami
    const body = {};
    if (miasto) body.miasto = miasto;
    if (!isNaN(lat)) body.szerokosc_geograficzna = lat;
    if (!isNaN(lng)) body.dlugosc_geograficzna = lng;
    if (kategoria) body.kategoria_biznesu = kategoria;
    if (nr_budynku) body.numer_budynku = nr_budynku;
    if (numer_na_mapie) body.numer_na_mapie = numer_na_mapie;
    console.log(numer_na_mapie);



    await wyslijNaSerwer('/profile', 'PUT', body);
}

async function addRewardFlow() {
    if (!TOKEN) { console.log("Musisz być zalogowany!"); return; }
    if (CURRENT_USER.role !== 'biznes') { console.log("Tylko biznes może dodawać nagrody!"); return; }

    console.log("\n>>> DODAWANIE NAGRODY <<<");
    const nazwa = readline.question('Nazwa nagrody: ');
    const opis = readline.question('Opis: ');
    const koszt = readline.questionInt('Koszt w punktach: ');
    
    const types = ['produkt', 'usługa', 'rabat_procentowy', 'rabat_kwotowy'];
    const typeIdx = readline.keyInSelect(types, 'Typ nagrody:');
    if (typeIdx === -1) return;

    let wartosc_rabatu = null;
    if (types[typeIdx].includes('rabat')) {
        wartosc_rabatu = readline.questionFloat('Wartosc rabatu: ');
    }

    const body = {
        nazwa,
        opis,
        koszt,
        typ: types[typeIdx],
        wartosc_rabatu
    };

    await wyslijNaSerwer('/rewards', 'POST', body);
}

async function searchBusinessesFlow() {
    console.log("\n>>> SZUKANIE W POBLIŻU <<<");
    // Domyślnie Warszawa Centrum dla testów, jeśli user nie poda
    const lat = readline.questionFloat('Twoja szerokosc geo (Enter=52.23): ', { defaultInput: 52.23 });
    const lng = readline.questionFloat('Twoja dlugosc geo (Enter=21.01): ', { defaultInput: 21.01 });
    const radius = readline.questionInt('Promien w km (Enter=100): ', { defaultInput: 100 });

    try {
        const res = await fetch(`${API_URL}/businesses/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
        const data = await res.json();
        
        if (!res.ok) {
            console.log("Błąd:", data.message);
            return;
        }

        console.log(`\nZnaleziono ${data.length} firm:`);
        data.forEach(b => {
            console.log(`- [${b.kategoria_biznesu || 'Inne'}] ${b.nazwa_firmy} (${b.miasto}) - ${b.distance_km} km stąd`);
        });

    } catch (e) {
        console.log("Błąd pobierania:", e.message);
    }
}

// --- FUNKCJA POMOCNICZA DO WYSYŁANIA ---

async function wyslijNaSerwer(endpoint, method, body) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Operacja udana!");
            if (method !== 'GET') console.log("Odpowiedź:", JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ Błąd serwera (${response.status}): ${data.message || JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log("❌ Błąd połączenia:", e.message);
    }
}

main();