const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
app.use(express.json());
app.use(cors());

const db = new Sequelize({ dialect: 'sqlite', storage: './baza.sqlite', logging: false });

// --- FUNKCJA DO OBLICZANIA ODLEGŁOŚCI HAVERSINE ---
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

const findBusinessesInRadius = async (lat, lng, radiusKm) => {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / 70;

    const candidates = await Business.findAll({
        where: {
            szerokosc_geograficzna: {
                [Op.between]: [lat - latDelta, lat + latDelta],
                [Op.ne]: null
            },
            dlugosc_geograficzna: {
                [Op.between]: [lng - lngDelta, lng + lngDelta],
                [Op.ne]: null
            }
        }
    });

    return candidates
        .map(b => ({
            ...b.toJSON(),
            distance_km: Math.round(haversineDistance(lat, lng, b.szerokosc_geograficzna, b.dlugosc_geograficzna) * 100) / 100
        }))
        .filter(b => b.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);
};

// --- MODELE BAZY DANYCH ---

const User = db.define('User', {
    login: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    accountType: { type: DataTypes.ENUM('klient', 'biznes'), defaultValue: 'klient' }
});

const Customer = db.define('Customer', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: 'Users', key: 'id' }
    },
    imie: { type: DataTypes.STRING },
    nazwisko: { type: DataTypes.STRING },
    numer_telefonu: { type: DataTypes.STRING },
    data_urodzenia: { type: DataTypes.DATEONLY },

    punkty_aktualne: { type: DataTypes.INTEGER, defaultValue: 0 },
    punkty_suma_historyczna: { type: DataTypes.INTEGER, defaultValue: 0 },
    kod_polecenia: { type: DataTypes.STRING, unique: true },
    numer_karty_lojalnosciowej: { type: DataTypes.STRING, unique: true },

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

    miasto: { type: DataTypes.STRING },
    ulica: { type: DataTypes.STRING },
    numer_budynku: { type: DataTypes.STRING },
    kod_pocztowy: { type: DataTypes.STRING },

    szerokosc_geograficzna: { type: DataTypes.FLOAT },
    dlugosc_geograficzna: { type: DataTypes.FLOAT },

    data_rozpoczecia_dzialalnosci: { type: DataTypes.DATEONLY },
    srednia_ocena: { type: DataTypes.FLOAT, defaultValue: 0 },
    liczba_opinii: { type: DataTypes.INTEGER, defaultValue: 0 },
    kategoria_biznesu: { type: DataTypes.STRING },
    numer_kontaktowy_biznes: { type: DataTypes.STRING },
    numer_na_mapie: { type: DataTypes.STRING },
    status_weryfikacji: {
        type: DataTypes.ENUM('oczekujący', 'zweryfikowany', 'odrzucony'),
        defaultValue: 'oczekujący'
    },
    link_do_strony_www: { type: DataTypes.STRING }
});

const Reward = db.define('Reward', {
    businessId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Businesses', key: 'userId' }
    },
    nazwa: { type: DataTypes.STRING, allowNull: false },
    opis: { type: DataTypes.STRING },
    koszt_punktowy: { type: DataTypes.INTEGER, allowNull: false },
    typ: {
        type: DataTypes.ENUM('produkt', 'usługa', 'rabat_procentowy', 'rabat_kwotowy'),
        defaultValue: 'produkt'
    },
    wartosc_rabatu: { type: DataTypes.FLOAT },
    czy_aktywna: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const ClaimedReward = db.define('ClaimedReward', {
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Customers', key: 'userId' }
    },
    rewardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Rewards', key: 'id' }
    },
    kod_unikalny: { type: DataTypes.STRING, unique: true, allowNull: false },
    status: {
        type: DataTypes.ENUM('do_wykorzystania', 'wykorzystany', 'anulowany'),
        defaultValue: 'do_wykorzystania'
    },
    data_odebrania: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
    data_wykorzystania: { type: DataTypes.DATE },
    data_wygasniecia: { type: DataTypes.DATE }
});

// --- RELACJE ---

User.hasOne(Business, { foreignKey: 'userId', onDelete: 'CASCADE' });
Business.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Customer, { foreignKey: 'userId', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'userId' });

Business.hasMany(Reward, { foreignKey: 'businessId', onDelete: 'CASCADE' });
Reward.belongsTo(Business, { foreignKey: 'businessId' });

Customer.hasMany(ClaimedReward, { foreignKey: 'customerId', onDelete: 'CASCADE' });
ClaimedReward.belongsTo(Customer, { foreignKey: 'customerId' });

Reward.hasMany(ClaimedReward, { foreignKey: 'rewardId' });
ClaimedReward.belongsTo(Reward, { foreignKey: 'rewardId' });

// --- MIDDLEWARE ---

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);
        req.user = decoded;
        next();
    });
};

const generateUniqueCouponCode = () => {
    const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `KOD-${randomHex}`;
};

// --- ENDPOINTY ---

app.post('/register', async (req, res) => {
    const t = await db.transaction();
    try {
        const { username, password, accountType = 'klient' } = req.body;

        if (!username || !password) {
            await t.rollback();
            return res.status(400).json({ message: "Wymagane pola: username, password" });
        }

        if (accountType !== 'klient' && accountType !== 'biznes') {
            await t.rollback();
            return res.status(400).json({ message: "accountType musi być 'klient' lub 'biznes'" });
        }

        const user = await User.create({
            login: username,
            password: password,
            accountType: accountType
        }, { transaction: t });

        if (accountType === 'klient') {
            await Customer.create({ userId: user.id }, { transaction: t });
        } else if (accountType === 'biznes') {
            await Business.create({
                userId: user.id,
                nazwa_firmy: req.body.nazwa_firmy || 'Nowa Firma'
            }, { transaction: t });
        }

        await t.commit();
        res.json({ message: "OK", userId: user.id, accountType: user.accountType });

    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Użytkownik o takim loginie już istnieje" });
        }
        console.error("Błąd podczas rejestracji:", error);
        res.status(500).json({ message: "Błąd podczas rejestracji" });
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({
            where: { login: req.body.username, password: req.body.password }
        });

        if (!user) {
            return res.status(401).json({ message: "Błąd logowania" });
        }

        const token = jwt.sign({ id: user.id, accountType: user.accountType }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, role: user.accountType, username: user.login });
    } catch (error) {
        console.error("Błąd podczas logowania:", error);
        res.status(500).json({ message: "Błąd podczas logowania" });
    }
});

app.get('/businesses/nearby', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const radius = parseFloat(req.query.radius) || 5;

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

// --- ENDPOINTY DLA SYSTEMU NAGRÓD ---

app.post('/rewards', verifyToken, async (req, res) => {
    if (req.user.accountType !== 'biznes') {
        return res.status(403).json({ message: "Tylko firmy mogą dodawać nagrody" });
    }

    try {
        if (!req.body.nazwa || !req.body.koszt) {
            return res.status(400).json({ message: "Wymagane pola: nazwa, koszt" });
        }

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

app.get('/rewards/:id', async (req, res) => {
    try {
        const reward = await Reward.findByPk(req.params.id, {
            include: [{
                model: Business,
                attributes: ['nazwa_firmy', 'miasto', 'ulica', 'numer_budynku', 'kod_pocztowy', 'numer_kontaktowy_biznes', 'status_weryfikacji']
            }]
        });

        if (!reward) {
            return res.status(404).json({ message: "Nagroda nie została znaleziona" });
        }

        res.json(reward);
    } catch (error) {
        console.error("Błąd pobierania nagrody:", error);
        res.status(500).json({ message: "Błąd pobierania nagrody" });
    }
});

app.get('/business/:id/rewards', async (req, res) => {
    try {
        const rewards = await Reward.findAll({
            where: { businessId: parseInt(req.params.id), czy_aktywna: true },
            order: [['koszt_punktowy', 'ASC']]
        });
        res.json(rewards);
    } catch (error) {
        console.error("Błąd pobierania nagród:", error);
        res.status(500).json({ message: "Błąd pobierania nagród" });
    }
});

// Endpoint dla odebranych nagród klienta
app.get('/rewards/my', verifyToken, async (req, res) => {
    if (req.user.accountType !== 'klient') {
        return res.status(403).json({ message: "Tylko klienci mogą przeglądać odebrane nagrody" });
    }

    try {
        const claimedRewards = await ClaimedReward.findAll({
            where: { customerId: req.user.id },
            include: [{
                model: Reward,
                include: [{
                    model: Business,
                    attributes: ['nazwa_firmy', 'miasto', 'ulica']
                }]
            }],
            order: [['data_odebrania', 'DESC']]
        });

        res.json(claimedRewards);
    } catch (error) {
        console.error("Błąd pobierania odebranych nagród:", error);
        res.status(500).json({ message: "Błąd pobierania odebranych nagród" });
    }
});

app.post('/rewards/claim', verifyToken, async (req, res) => {
    if (req.user.accountType !== 'klient') {
        return res.status(403).json({ message: "Tylko klient może odbierać nagrody" });
    }

    const t = await db.transaction();
    try {
        const { rewardId } = req.body;
        const customerId = req.user.id;

        if (!rewardId) {
            await t.rollback();
            return res.status(400).json({ message: "Wymagane pole: rewardId" });
        }

        const customer = await Customer.findByPk(customerId, { transaction: t });
        if (!customer) {
            await t.rollback();
            return res.status(404).json({ message: "Profil klienta nie istnieje" });
        }

        const reward = await Reward.findByPk(rewardId, {
            transaction: t,
            include: [{ model: Business, attributes: ['nazwa_firmy'] }]
        });

        if (!reward || !reward.czy_aktywna) {
            await t.rollback();
            return res.status(404).json({ message: "Nagroda niedostępna" });
        }

        if (customer.punkty_aktualne < reward.koszt_punktowy) {
            await t.rollback();
            return res.status(400).json({
                message: "Masz za mało punktów!",
                wymagane: reward.koszt_punktowy,
                masz: customer.punkty_aktualne
            });
        }

        customer.punkty_aktualne -= reward.koszt_punktowy;
        customer.punkty_suma_historyczna += reward.koszt_punktowy;
        await customer.save({ transaction: t });

        const uniqueCode = generateUniqueCouponCode();

        await ClaimedReward.create({
            customerId: customerId,
            rewardId: rewardId,
            kod_unikalny: uniqueCode,
            status: 'do_wykorzystania',
            data_odebrania: new Date()
        }, { transaction: t });

        await t.commit();

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
        await t.rollback();
        console.error("Błąd transakcji wymiany punktów:", error);
        res.status(500).json({ message: "Błąd transakcji wymiany punktów" });
    }
});

app.get('/rewards/my', verifyToken, async (req, res) => {
    if (req.user.accountType !== 'klient') {
        return res.status(403).json({ message: "Tylko klient może przeglądać swoje nagrody" });
    }

    try {
        const status = req.query.status || 'do_wykorzystania';
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

app.post('/rewards/redeem', verifyToken, async (req, res) => {
    if (req.user.accountType !== 'biznes') {
        return res.status(403).json({ message: "Tylko właściciel sklepu może skasować kupon" });
    }

    try {
        const { kod_kuponu } = req.body;

        if (!kod_kuponu) {
            return res.status(400).json({ message: "Wymagane pole: kod_kuponu" });
        }

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

        if (claimedReward.Reward.businessId !== req.user.id) {
            return res.status(403).json({ message: "Ten kupon nie należy do twojego sklepu" });
        }

        if (claimedReward.status === 'wykorzystany') {
            return res.status(400).json({ message: "Ten kupon został już wykorzystany" });
        }

        if (claimedReward.status === 'anulowany') {
            return res.status(400).json({ message: "Ten kupon został anulowany" });
        }

        if (claimedReward.data_wygasniecia && new Date(claimedReward.data_wygasniecia) < new Date()) {
            return res.status(400).json({ message: "Ten kupon wygasł" });
        }

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

// --- ENDPOINTY PROFILOWE (TUTAJ JEST ICH POPRAWNE MIEJSCE) ---

// 1. Pobierz dane profilowe
app.get('/profile', verifyToken, async (req, res) => {
    try {
        const { id, accountType } = req.user;
        let profileData;

        if (accountType === 'klient') {
            profileData = await Customer.findByPk(id);
        } else if (accountType === 'biznes') {
            profileData = await Business.findByPk(id);
        }

        if (!profileData) {
            return res.status(404).json({ message: "Profil nie znaleziony" });
        }

        res.json(profileData);
    } catch (error) {
        console.error("Błąd pobierania profilu:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// 2. Aktualizuj dane profilowe
app.put('/profile', verifyToken, async (req, res) => {
    try {
        const { id, accountType } = req.user;
        let profile;

        if (accountType === 'klient') {
            profile = await Customer.findByPk(id);
            if (!profile) return res.status(404).json({ message: "Profil nie istnieje" });

            await profile.update({
                imie: req.body.imie,
                nazwisko: req.body.nazwisko,
                numer_telefonu: req.body.numer_telefonu,
                data_urodzenia: req.body.data_urodzenia
            });

        } else if (accountType === 'biznes') {
            profile = await Business.findByPk(id);
            if (!profile) return res.status(404).json({ message: "Profil nie istnieje" });

            await profile.update({
                nazwa_firmy: req.body.nazwa_firmy,
                nip: req.body.nip,
                regon: req.body.regon,
                miasto: req.body.miasto,
                ulica: req.body.ulica,
                numer_budynku: req.body.numer_budynku,
                kod_pocztowy: req.body.kod_pocztowy,
                szerokosc_geograficzna: parseFloat(req.body.szerokosc_geograficzna),
                dlugosc_geograficzna: parseFloat(req.body.dlugosc_geograficzna),
                kategoria_biznesu: req.body.kategoria_biznesu,
                numer_kontaktowy_biznes: req.body.numer_kontaktowy_biznes,
                link_do_strony_www: req.body.link_do_strony_www,
                numer_na_mapie: req.body.numer_na_mapie
                // opis: req.body.opis // Zakomentowane, bo pole "opis" nie istnieje w modelu Business
            });
        }

        res.json({ message: "Profil zaktualizowany", profile });
    } catch (error) {
        console.error("Błąd aktualizacji profilu:", error);
        res.status(500).json({ message: "Błąd serwera podczas aktualizacji" });
    }
});

// --- NOWY ENDPOINT: Publiczne dane firmy + nagrody ---
app.get('/public/business/:id', async (req, res) => {
    try {
        const businessId = parseInt(req.params.id);

        // 1. Pobierz dane firmy
        const business = await Business.findByPk(businessId, {
            attributes: [
                'nazwa_firmy', 'kategoria_biznesu', 'miasto', 'ulica',
                'numer_budynku', 'srednia_ocena', 'liczba_opinii',
                'numer_kontaktowy_biznes', 'link_do_strony_www', 'numer_na_mapie'
            ]
        });

        if (!business) {
            return res.status(404).json({ message: "Firma nie znaleziona" });
        }

        // 2. Pobierz aktywne nagrody dla tej firmy
        const rewards = await Reward.findAll({
            where: {
                businessId: businessId,
                czy_aktywna: true
            },
            attributes: ['id', 'nazwa', 'opis', 'koszt_punktowy', 'typ', 'wartosc_rabatu']
        });

        res.json({ business, rewards });
    } catch (error) {
        console.error("Błąd pobierania wizytówki:", error);
        res.status(500).json({ message: "Błąd serwera" });
    }
});

// --- ENDPOINT: Klient sam sobie dodaje punkty (Self-Service) ---
app.post('/points/self', verifyToken, async (req, res) => {
    // 1. Sprawdzamy czy to klient (biznes nie ma punktów do zbierania)
    if (req.user.accountType !== 'klient') {
        return res.status(403).json({ message: "Tylko klient może mieć punkty." });
    }

    const t = await db.transaction();
    try {
        const userId = req.user.id; // <--- TU JEST KLUCZ: ID bierzemy z tokena
        const pointsToAdd = parseInt(req.body.points);

        if (!pointsToAdd || pointsToAdd <= 0) {
            await t.rollback();
            return res.status(400).json({ message: "Podaj dodatnią liczbę punktów." });
        }

        // 2. Pobieramy profil klienta na podstawie ID z tokena
        const customer = await Customer.findByPk(userId, { transaction: t });

        if (!customer) {
            await t.rollback();
            return res.status(404).json({ message: "Nie znaleziono profilu klienta." });
        }

        // 3. Dodajemy punkty
        customer.punkty_aktualne += pointsToAdd;
        customer.punkty_suma_historyczna += pointsToAdd;

        await customer.save({ transaction: t });
        await t.commit();

        res.json({
            message: "Dodano punkty!",
            dodano: pointsToAdd,
            nowe_saldo: customer.punkty_aktualne
        });

    } catch (error) {
        await t.rollback();
        console.error("Błąd self-points:", error);
        res.status(500).json({ message: "Błąd serwera." });
    }
});


// --- URUCHOMIENIE SERWERA (ZAWSZE NA SAMYM KOŃCU) ---

app.listen(5000, async () => {
    try {
        await db.sync();
        console.log("Serwer: http://localhost:5000");
    } catch (error) {
        console.error("Błąd podczas inicjalizacji bazy:", error.message);
        throw error;
    }
});