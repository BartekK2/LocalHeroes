/*
TODO:

dodaj osobno getproduct, będzie łatwiej
*/


const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const HASLO_JWT = "haslo"; // tak, wiem że to powinno być ukryte
app.use(express.json());
app.use(cors());


const db = new Sequelize({ dialect: 'sqlite',  storage: './baza.sqlite', logging: false });


// --- FUNKCJE DO GRID COORDINATES (kwadraciki 1x1 km) ---
// System grid coordinates dzieli powierzchnię na kwadraciki o wymiarach 1x1 km
// Ułatwia to szybkie wyszukiwanie biznesów w promieniu bez konieczności obliczania
// odległości Haversine dla każdego rekordu w bazie danych.
// 
// Na szerokości geograficznej ~52°N (Polska):
// - 1 stopień szerokości ≈ 111 km
// - 1 stopień długości ≈ cos(52°) * 111 ≈ 68.3 km
// Dla kwadracików 1x1 km:
// - Szerokość: 1/111 ≈ 0.009009 stopnia
// - Długość: 1/68.3 ≈ 0.01464 stopnia
//
// Każdy biznes ma automatycznie obliczane grid_x i grid_y przy zapisie (hook beforeSave)
// Użycie: GET /businesses/nearby?lat=52.2297&lng=21.0122&radius=5

const GRID_LAT_STEP = 1 / 111; // ≈ 0.009009 stopnia (1 km)
const GRID_LNG_STEP = 1 / (Math.cos(52 * Math.PI / 180) * 111); // ≈ 0.01464 stopnia (1 km na 52°N)

/**
 * Konwertuje szerokość i długość geograficzną na współrzędne grid (kwadraciki 1x1 km)
 * @param {number} lat - szerokość geograficzna
 * @param {number} lng - długość geograficzna
 * @returns {Object} {grid_x, grid_y} - współrzędne kwadracika
 */
const latLngToGrid = (lat, lng) => {
    // Używamy reference point (np. południk i równoleżnik zerowy lub inny punkt odniesienia)
    // Dla Polski możemy użyć 50°N, 20°E jako punktu startowego
    const REF_LAT = 50.0; // Punkt odniesienia (można dostosować)
    const REF_LNG = 20.0; // Punkt odniesienia (można dostosować)
    
    const grid_y = Math.floor((lat - REF_LAT) / GRID_LAT_STEP);
    const grid_x = Math.floor((lng - REF_LNG) / GRID_LNG_STEP);
    
    return { grid_x, grid_y };
};

/**
 * Konwertuje współrzędne grid z powrotem na środek kwadracika (lat, lng)
 * @param {number} grid_x - współrzędna X kwadracika
 * @param {number} grid_y - współrzędna Y kwadracika
 * @returns {Object} {lat, lng} - środek kwadracika w stopniach
 */
const gridToLatLng = (grid_x, grid_y) => {
    const REF_LAT = 50.0;
    const REF_LNG = 20.0;
    
    const lat = REF_LAT + (grid_y + 0.5) * GRID_LAT_STEP;
    const lng = REF_LNG + (grid_x + 0.5) * GRID_LNG_STEP;
    
    return { lat, lng };
};

/**
 * Oblicza przybliżoną odległość w km między dwoma punktami grid
 * Używa formuły Manhattan distance w jednostkach grid (każda jednostka = 1 km)
 * @param {number} grid_x1 - współrzędna X pierwszego punktu
 * @param {number} grid_y1 - współrzędna Y pierwszego punktu
 * @param {number} grid_x2 - współrzędna X drugiego punktu
 * @param {number} grid_y2 - współrzędna Y drugiego punktu
 * @returns {number} przybliżona odległość w km (Manhattan distance)
 */
const gridDistance = (grid_x1, grid_y1, grid_x2, grid_y2) => {
    // Manhattan distance - sumujemy różnice w obu osiach
    // Ponieważ grid ma 1x1 km, Manhattan distance daje dobre przybliżenie
    return Math.abs(grid_x1 - grid_x2) + Math.abs(grid_y1 - grid_y2);
};

/**
 * Oblicza odległość Euklidesową w km między dwoma punktami grid
 * @param {number} grid_x1 - współrzędna X pierwszego punktu
 * @param {number} grid_y1 - współrzędna Y pierwszego punktu
 * @param {number} grid_x2 - współrzędna X drugiego punktu
 * @param {number} grid_y2 - współrzędna Y drugiego punktu
 * @returns {number} odległość Euklidesowa w km
 */
const gridDistanceEuclidean = (grid_x1, grid_y1, grid_x2, grid_y2) => {
    const dx = grid_x1 - grid_x2;
    const dy = grid_y1 - grid_y2;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Oblicza odległość Haversine między dwoma punktami lat/lng w km
 * @param {number} lat1 - szerokość geograficzna pierwszego punktu
 * @param {number} lng1 - długość geograficzna pierwszego punktu
 * @param {number} lat2 - szerokość geograficzna drugiego punktu
 * @param {number} lng2 - długość geograficzna drugiego punktu
 * @returns {number} odległość w km
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Promień Ziemi w km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


// --- TABELA DO LOGOWANIA ---
const User = db.define('User', {
    login: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    accountType: { type: DataTypes.ENUM('klient', 'biznes'), defaultValue: 'klient' }
});

// --- TABELA SZCZEGÓŁÓW KLIENTA ---
const Customer = db.define('Customer', {
    // Relacja: każde Id w tej tabeli odpowiada Id z tabeli User
    userId: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, // userId będzie jednocześnie kluczem głównym tutaj
        references: { model: 'Users', key: 'id' } 
    },
    imie: { type: DataTypes.STRING },
    nazwisko: { type: DataTypes.STRING },
    numer_telefonu: { type: DataTypes.STRING },
    data_urodzenia: { type: DataTypes.DATEONLY },
    
    // System lojalnościowy
    punkty_aktualne: { type: DataTypes.INTEGER, defaultValue: 0 },
    punkty_suma_historyczna: { type: DataTypes.INTEGER, defaultValue: 0 },
    kod_polecenia: { type: DataTypes.STRING, unique: true },
    numer_karty_lojalnosciowej: { type: DataTypes.STRING, unique: true },
    id_ulubionego_sklepu: { type: DataTypes.INTEGER },
    
    // Zgody i daty
    status_powiadomien: { type: DataTypes.BOOLEAN, defaultValue: true },
    zgoda_marketingowa: { type: DataTypes.BOOLEAN, defaultValue: false },
    data_utworzenia_profilu: { type: DataTypes.DATE, defaultValue: Sequelize.NOW }
});


const Business = db.define('Business', {
    userId: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        references: { model: 'Users', key: 'id' } 
    },
    nazwa_firmy: { type: DataTypes.STRING, allowNull: false },
    nip: { type: DataTypes.STRING, unique: true },
    regon: { type: DataTypes.STRING },
    
    // Adres
    miasto: { type: DataTypes.STRING },
    ulica: { type: DataTypes.STRING },
    numer_budynku: { type: DataTypes.STRING },
    kod_pocztowy: { type: DataTypes.STRING },
    
    // Lokalizacja GPS (do mapy)
    szerokosc_geograficzna: { type: DataTypes.FLOAT },
    dlugosc_geograficzna: { type: DataTypes.FLOAT },
    
    // Grid coordinates (kwadraciki 1x1 km) - dla łatwego obliczania odległości
    grid_x: { type: DataTypes.INTEGER },
    grid_y: { type: DataTypes.INTEGER },
    
    // Statystyki i info
    data_rozpoczecia_dzialalnosci: { type: DataTypes.DATEONLY },
    srednia_ocena: { type: DataTypes.FLOAT, defaultValue: 0 },
    liczba_opinii: { type: DataTypes.INTEGER, defaultValue: 0 },
    kategoria_biznesu: { type: DataTypes.STRING },
    
    // Operacyjne
    godziny_otwarcia: { type: DataTypes.TEXT }, // Można tu trzymać JSON-a w stringu
    numer_kontaktowy_biznes: { type: DataTypes.STRING },
    czy_oferuje_odbior_paczek: { type: DataTypes.BOOLEAN, defaultValue: false },
    czy_otwarte_w_niedziele_handlowe: { type: DataTypes.BOOLEAN, defaultValue: false },
    
    // Status i linki
    status_weryfikacji: { 
        type: DataTypes.ENUM('oczekujący', 'zweryfikowany', 'odrzucony'), 
        defaultValue: 'oczekujący' 
    },
    link_do_strony_www: { type: DataTypes.STRING }
});

// Hook do automatycznego obliczania grid coordinates gdy zmieni się lokalizacja GPS
Business.beforeSave((business, options) => {
    if (business.szerokosc_geograficzna != null && business.dlugosc_geograficzna != null) {
        const { grid_x, grid_y } = latLngToGrid(
            business.szerokosc_geograficzna,
            business.dlugosc_geograficzna
        );
        business.grid_x = grid_x;
        business.grid_y = grid_y;
    }
});

// --- MODEL: NAGRODA/RABAT (Definicja tego, co sklep oferuje) ---
const Reward = db.define('Reward', {
    businessId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Businesses', key: 'userId' }
    },
    nazwa: { type: DataTypes.STRING, allowNull: false }, // np. "Darmowa Kawa", "-10% na zakupy"
    opis: { type: DataTypes.STRING },
    koszt_punktowy: { type: DataTypes.INTEGER, allowNull: false }, // Ile punktów to kosztuje
    typ: { 
        type: DataTypes.ENUM('produkt', 'usługa', 'rabat_procentowy', 'rabat_kwotowy'), 
        defaultValue: 'produkt' 
    },
    wartosc_rabatu: { type: DataTypes.FLOAT }, // Dla rabatów: procent (np. 10) lub kwota (np. 20.50)
    czy_aktywna: { type: DataTypes.BOOLEAN, defaultValue: true } // Czy oferta jest aktualna
});

// --- MODEL: ODEBRANA NAGRODA (Kupon w portfelu klienta) ---
const ClaimedReward = db.define('ClaimedReward', {
    // Kto odebrał?
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Customers', key: 'userId' }
    },
    // Co odebrał?
    rewardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Rewards', key: 'id' }
    },
    // Unikalny kod do pokazania przy kasie (np. do QR kodu)
    kod_unikalny: { type: DataTypes.STRING, unique: true, allowNull: false },
    status: { 
        type: DataTypes.ENUM('do_wykorzystania', 'wykorzystany', 'anulowany'), 
        defaultValue: 'do_wykorzystania' 
    },
    data_odebrania: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
    data_wykorzystania: { type: DataTypes.DATE }, // Kiedy skasowano kupon w sklepie
    data_wygasniecia: { type: DataTypes.DATE } // Opcjonalnie: data ważności kuponu
});

// POWIĄZANIE
User.hasOne(Business, { foreignKey: 'userId', onDelete: 'CASCADE' });
Business.belongsTo(User, { foreignKey: 'userId' });
// POWIĄZANIE: User "ma jeden" profil Customer
User.hasOne(Customer, { foreignKey: 'userId', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'userId' });

// --- RELACJE DLA NAGRÓD ---
// Sklep ma wiele nagród w ofercie
Business.hasMany(Reward, { foreignKey: 'businessId', onDelete: 'CASCADE' });
Reward.belongsTo(Business, { foreignKey: 'businessId' });

// Klient ma wiele odebranych nagród (historia + portfel)
Customer.hasMany(ClaimedReward, { foreignKey: 'customerId', onDelete: 'CASCADE' });
ClaimedReward.belongsTo(Customer, { foreignKey: 'customerId' });

// Nagroda ma wiele "odebrań" (przez różnych ludzi)
Reward.hasMany(ClaimedReward, { foreignKey: 'rewardId' });
ClaimedReward.belongsTo(Reward, { foreignKey: 'rewardId' });


const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, HASLO_JWT, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.user = decoded;
        next();
    });
};

/**
 * Generuje unikalny kod kuponu (unikamy kolizji poprzez sprawdzenie w bazie)
 * Format: KOD-XXXX-YYYY (np. KOD-A3F2-7B9C)
 * @returns {Promise<string>} unikalny kod kuponu
 */
const generateUniqueCouponCode = async () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Usunięto 0, O, I, 1 (łatwo pomylić)
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
        // Generuj kod: KOD-XXXX-YYYY
        const part1 = Array.from({ length: 4 }, () => 
            characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');
        const part2 = Array.from({ length: 4 }, () => 
            characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');
        code = `KOD-${part1}-${part2}`;

        // Sprawdź czy kod już istnieje
        const existing = await ClaimedReward.findOne({ where: { kod_unikalny: code } });
        if (!existing) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        // Fallback: użyj timestamp + random jeśli nie udało się wygenerować unikalnego kodu
        code = `KOD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    return code;
};

/**
 * Wyszukuje biznesy w promieniu od danego punktu używając grid coordinates
 * Grid coordinates pozwalają na szybkie wstępne filtrowanie (każdy kwadracik = 1x1 km)
 * @param {number} lat - szerokość geograficzna punktu startowego
 * @param {number} lng - długość geograficzna punktu startowego
 * @param {number} radiusKm - promień w km
 * @returns {Promise<Array>} lista biznesów w promieniu z odległością (distance_km)
 */
const findBusinessesInRadius = async (lat, lng, radiusKm) => {
    const { grid_x: center_x, grid_y: center_y } = latLngToGrid(lat, lng);
    
    // Używamy grid coordinates do szybkiego filtrowania (kwadraciki 1x1 km)
    // Szukamy w kwadracie o boku = 2 * radius (dla pewności)
    const gridRadius = Math.ceil(radiusKm); // promień w jednostkach grid (każda jednostka = 1 km)
    
    const businesses = await Business.findAll({
        where: {
            grid_x: {
                [Op.between]: [center_x - gridRadius, center_x + gridRadius]
            },
            grid_y: {
                [Op.between]: [center_y - gridRadius, center_y + gridRadius]
            },
            szerokosc_geograficzna: { [Op.ne]: null },
            dlugosc_geograficzna: { [Op.ne]: null }
        }
    });
    
    // Filtrujemy dokładniej używając odległości Haversine (dokładniejsza metoda)
    const businessesInRadius = businesses
        .map(business => {
            const distance = haversineDistance(
                lat, lng,
                business.szerokosc_geograficzna,
                business.dlugosc_geograficzna
            );
            return { ...business.toJSON(), distance_km: Math.round(distance * 100) / 100 };
        })
        .filter(business => business.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);
    
    return businessesInRadius;
};

/**
 * Wyszukuje biznesy w konkretnym kwadraciku grid (1x1 km)
 * @param {number} grid_x - współrzędna X kwadracika
 * @param {number} grid_y - współrzędna Y kwadracika
 * @returns {Promise<Array>} lista biznesów w danym kwadraciku
 */
const findBusinessesInGrid = async (grid_x, grid_y) => {
    return await Business.findAll({
        where: {
            grid_x: grid_x,
            grid_y: grid_y,
            szerokosc_geograficzna: { [Op.ne]: null },
            dlugosc_geograficzna: { [Op.ne]: null }
        }
    });
};



app.post('/register', async (req, res) => {
    try {
        // Frontend wysyła 'username', ale model ma 'login', więc mapujemy
        const user = await User.create({
            login: req.body.username,
            password: req.body.password,
            accountType: req.body.accountType || 'klient'
        });
        res.json({ message: "OK" });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Użytkownik o takim loginie już istnieje" });
        }
        res.status(500).json({ message: "Błąd podczas rejestracji" });
    }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ where: { login: req.body.username, password: req.body.password } });
    if (!user) return res.status(401).send("Błąd");
    
    const token = jwt.sign({ id: user.id, accountType: user.accountType }, HASLO_JWT, { expiresIn: '1h' });
    res.json({ token, role: user.accountType, username: user.login });
});

// Endpoint do wyszukiwania biznesów w promieniu od danego punktu
// GET /businesses/nearby?lat=52.2297&lng=21.0122&radius=5
app.get('/businesses/nearby', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius) || 5; // domyślnie 5 km
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ message: "Wymagane parametry: lat i lng" });
        }
        
        const businesses = await findBusinessesInRadius(lat, lng, radius);
        res.json(businesses);
    } catch (error) {
        console.error("Błąd podczas wyszukiwania biznesów:", error);
        res.status(500).json({ message: "Błąd podczas wyszukiwania biznesów" });
    }
});

// Endpoint do aktualizacji grid coordinates dla istniejących biznesów (jeśli nie mają jeszcze ustawionych)
// POST /businesses/update-grid-coordinates
app.post('/businesses/update-grid-coordinates', verifyToken, async (req, res) => {
    try {
        const businesses = await Business.findAll({
            where: {
                szerokosc_geograficzna: { [Op.ne]: null },
                dlugosc_geograficzna: { [Op.ne]: null },
                [Op.or]: [
                    { grid_x: null },
                    { grid_y: null }
                ]
            }
        });
        
        let updated = 0;
        for (const business of businesses) {
            const { grid_x, grid_y } = latLngToGrid(
                business.szerokosc_geograficzna,
                business.dlugosc_geograficzna
            );
            business.grid_x = grid_x;
            business.grid_y = grid_y;
            await business.save();
            updated++;
        }
        
        res.json({ message: `Zaktualizowano grid coordinates dla ${updated} biznesów` });
    } catch (error) {
        console.error("Błąd podczas aktualizacji grid coordinates:", error);
        res.status(500).json({ message: "Błąd podczas aktualizacji grid coordinates" });
    }
});

// ==================== ENDPOINTY DLA SYSTEMU NAGRÓD ====================

// A. Dodawanie nagrody przez biznes
// POST /rewards
app.post('/rewards', verifyToken, async (req, res) => {
    // Sprawdzamy czy to biznes
    if (req.user.accountType !== 'biznes') {
        return res.status(403).json({ message: "Tylko firmy mogą dodawać nagrody" });
    }

    try {
        // Walidacja danych
        if (!req.body.nazwa || !req.body.koszt) {
            return res.status(400).json({ message: "Wymagane pola: nazwa, koszt" });
        }

        // Sprawdź czy biznes istnieje
        const business = await Business.findByPk(req.user.id);
        if (!business) {
            return res.status(404).json({ message: "Profil biznesu nie istnieje" });
        }

        const reward = await Reward.create({
            businessId: req.user.id,
            nazwa: req.body.nazwa,
            opis: req.body.opis || null,
            koszt_punktowy: parseInt(req.body.koszt),
            typ: req.body.typ || 'produkt',
            wartosc_rabatu: req.body.wartosc_rabatu || null,
            czy_aktywna: req.body.czy_aktywna !== undefined ? req.body.czy_aktywna : true
        });

        res.json(reward);
    } catch (error) {
        console.error("Błąd dodawania nagrody:", error);
        res.status(500).json({ message: "Błąd dodawania nagrody" });
    }
});

// B. Lista nagród danego biznesu (publiczny endpoint)
// GET /business/:id/rewards
app.get('/business/:id/rewards', async (req, res) => {
    try {
        const rewards = await Reward.findAll({
            where: { 
                businessId: parseInt(req.params.id),
                czy_aktywna: true
            },
            order: [['koszt_punktowy', 'ASC']]
        });
        res.json(rewards);
    } catch (error) {
        console.error("Błąd pobierania nagród:", error);
        res.status(500).json({ message: "Błąd pobierania nagród" });
    }
});

// C. Odbieranie nagrody przez klienta (wymiana punktów na kupon)
// POST /rewards/claim
app.post('/rewards/claim', verifyToken, async (req, res) => {
    if (req.user.accountType !== 'klient') {
        return res.status(403).json({ message: "Tylko klient może odbierać nagrody" });
    }

    const t = await db.transaction(); // Rozpoczynamy bezpieczną transakcję

    try {
        const { rewardId } = req.body;
        const customerId = req.user.id;

        if (!rewardId) {
            await t.rollback();
            return res.status(400).json({ message: "Wymagane pole: rewardId" });
        }

        // 1. Pobierz dane klienta (sprawdź punkty)
        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            return res.status(404).json({ message: "Profil klienta nie istnieje" });
        }

        // 2. Pobierz nagrodę (sprawdź koszt)
        const reward = await Reward.findByPk(rewardId, { 
            transaction: t,
            include: [{ model: Business, attributes: ['nazwa_firmy'] }]
        });

        if (!reward || !reward.czy_aktywna) {
            await t.rollback();
            return res.status(404).json({ message: "Nagroda niedostępna" });
        }

        // 3. Sprawdź czy stać go na nagrodę
        if (customer.punkty_aktualne < reward.koszt_punktowy) {
            await t.rollback();
            return res.status(400).json({ 
                message: "Masz za mało punktów!",
                wymagane: reward.koszt_punktowy,
                masz: customer.punkty_aktualne
            });
        }

        // 4. ODEJMIJ PUNKTY
        customer.punkty_aktualne -= reward.koszt_punktowy;
        customer.punkty_suma_historyczna += reward.koszt_punktowy; // Historia wydanych punktów
        await customer.save({ transaction: t });

        // 5. STWÓRZ KUPON (ClaimedReward)
        const uniqueCode = await generateUniqueCouponCode();
        
        const claimed = await ClaimedReward.create({
            customerId: customerId,
            rewardId: rewardId,
            kod_unikalny: uniqueCode,
            status: 'do_wykorzystania',
            data_odebrania: new Date()
        }, { transaction: t });

        await t.commit(); // Zatwierdź wszystko
        
        res.json({ 
            message: "Sukces! Nagroda odebrana.", 
            kupon: {
                kod: uniqueCode,
                nagroda: reward.nazwa,
                sklep: reward.Business?.nazwa_firmy || 'Nieznany sklep',
                status: 'do_wykorzystania'
            },
            pozostale_punkty: customer.punkty_aktualne 
        });

    } catch (error) {
        await t.rollback(); // Cofnij zmiany w razie błędu
        console.error("Błąd transakcji wymiany punktów:", error);
        res.status(500).json({ message: "Błąd transakcji wymiany punktów" });
    }
});

// D. Portfel klienta - lista odebranych nagród
// GET /rewards/my
app.get('/rewards/my', verifyToken, async (req, res) => {
    if (req.user.accountType !== 'klient') {
        return res.status(403).json({ message: "Tylko klient może przeglądać swoje nagrody" });
    }

    try {
        const status = req.query.status || 'do_wykorzystania'; // Opcjonalny filtr statusu
        
        const claimedRewards = await ClaimedReward.findAll({
            where: {
                customerId: req.user.id,
                ...(status !== 'wszystkie' && { status: status })
            },
            include: [
                {
                    model: Reward,
                    include: [{ model: Business, attributes: ['nazwa_firmy', 'miasto'] }]
                }
            ],
            order: [['data_odebrania', 'DESC']]
        });

        const formatted = claimedRewards.map(cr => ({
            id: cr.id,
            kod_kuponu: cr.kod_unikalny,
            nagroda: {
                nazwa: cr.Reward.nazwa,
                opis: cr.Reward.opis,
                typ: cr.Reward.typ,
                wartosc_rabatu: cr.Reward.wartosc_rabatu
            },
            sklep: {
                nazwa: cr.Reward.Business.nazwa_firmy,
                miasto: cr.Reward.Business.miasto
            },
            status: cr.status,
            data_odebrania: cr.data_odebrania,
            data_wykorzystania: cr.data_wykorzystania,
            data_wygasniecia: cr.data_wygasniecia
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Błąd pobierania portfela:", error);
        res.status(500).json({ message: "Błąd pobierania portfela" });
    }
});

// E. Skasowanie kuponu przez sprzedawcę (nowy endpoint!)
// POST /rewards/redeem
app.post('/rewards/redeem', verifyToken, async (req, res) => {
    // Sprawdzamy czy to biznes (tylko właściciel sklepu może skasować kupon)
    if (req.user.accountType !== 'biznes') {
        return res.status(403).json({ message: "Tylko właściciel sklepu może skasować kupon" });
    }

    try {
        const { kod_kuponu } = req.body;

        if (!kod_kuponu) {
            return res.status(400).json({ message: "Wymagane pole: kod_kuponu" });
        }

        // Znajdź kupon
        const claimedReward = await ClaimedReward.findOne({
            where: { kod_unikalny: kod_kuponu },
            include: [
                {
                    model: Reward,
                    include: [{ model: Business }]
                }
            ]
        });

        if (!claimedReward) {
            return res.status(404).json({ message: "Kupon nie został znaleziony" });
        }

        // Sprawdź czy kupon należy do nagrody z tego sklepu
        if (claimedReward.Reward.businessId !== req.user.id) {
            return res.status(403).json({ message: "Ten kupon nie należy do twojego sklepu" });
        }

        // Sprawdź status kuponu
        if (claimedReward.status === 'wykorzystany') {
            return res.status(400).json({ message: "Ten kupon został już wykorzystany" });
        }

        if (claimedReward.status === 'anulowany') {
            return res.status(400).json({ message: "Ten kupon został anulowany" });
        }

        // Sprawdź datę wygaśnięcia (jeśli jest ustawiona)
        if (claimedReward.data_wygasniecia && new Date(claimedReward.data_wygasniecia) < new Date()) {
            return res.status(400).json({ message: "Ten kupon wygasł" });
        }

        // Skasuj kupon
        claimedReward.status = 'wykorzystany';
        claimedReward.data_wykorzystania = new Date();
        await claimedReward.save();

        res.json({
            message: "Kupon został pomyślnie wykorzystany",
            kupon: {
                kod: claimedReward.kod_unikalny,
                nagroda: claimedReward.Reward.nazwa,
                data_wykorzystania: claimedReward.data_wykorzystania
            }
        });

    } catch (error) {
        console.error("Błąd kasowania kuponu:", error);
        res.status(500).json({ message: "Błąd kasowania kuponu" });
    }
});





app.listen(5000, async () => {
    try {
        // Synchronizujemy modele z bazą danych
        // UWAGA: SQLite nie obsługuje dodawania kolumny z UNIQUE do istniejącej tabeli
        // Jeśli chcesz dodać kolumnę UNIQUE do istniejącej tabeli, musisz użyć force: true
        // (to usunie wszystkie dane!) lub ręcznej migracji
        await db.sync();
        console.log("Serwer: http://localhost:5000");
    } catch (error) {
        console.error("Błąd podczas inicjalizacji bazy:", error.message);
        // Jeśli błąd związany z UNIQUE constraint, użyj force: true dla developmentu
        if (error.message.includes('UNIQUE') || error.message.includes('Cannot add a UNIQUE column')) {
            console.log("Problem z UNIQUE constraint - odtwarzanie bazy od zera (force: true)...");
            await db.sync({ force: true });
        } else {
            throw error;
        }
        console.log("Serwer: http://localhost:5000");
    }
});