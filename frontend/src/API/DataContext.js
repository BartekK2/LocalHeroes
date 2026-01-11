import { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';

export const dataContext = createContext();

export const DataProvider = ({ children }) => {
    const API_URL = "http://localhost:5000";

    // Stany do przechowywania danych i statusu żądania
    const [nearbyBusinesses, setNearbyBusinesses] = useState([]);

    // Callback for refreshing points in Navbar
    const pointsRefreshCallbackRef = useRef(null);

    // Function to trigger points refresh
    const refreshPoints = useCallback(() => {
        if (pointsRefreshCallbackRef.current) {
            pointsRefreshCallbackRef.current();
        }
    }, []);

    // Function for Navbar to register its refresh callback
    const setPointsRefreshCallback = useCallback((callback) => {
        pointsRefreshCallbackRef.current = callback;
    }, []);

    async function fetchNearbyBusinesses(lat, lng, radius) {
        console.log("\n>>> SZUKANIE W POBLIŻU <<<");
        try {
            const res = await fetch(`${API_URL}/businesses/nearby?lat=${parseFloat(lat)}&lng=${[parseFloat(lng)]}&radius=${parseFloat(radius)}`);
            const data = await res.json();

            if (!res.ok) {
                console.log("Błąd:", data.message);
                return;
            }

            console.log(`\nZnaleziono ${data.length} firm:`);
            data.forEach(b => {
                console.log(`- [${b.kategoria_biznesu || 'Inne'}] ${b.nazwa_firmy} (${b.miasto}) - ${b.distance_km} km stąd`);
            });
            setNearbyBusinesses(data);

            // Możemy też zwrócić dane, jeśli komponent chce ich użyć od razu w .then()
            return data;

        } catch (e) {
            console.log("Błąd pobierania:", e.message);
        }
    }
    const getPointsBalance = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error("Brak tokena – użytkownik nie jest zalogowany.");
        }

        const response = await fetch('http://localhost:5000/points/balance', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Nie udało się pobrać stanu punktów.");
        }

        // Zwraca np.: { punkty: 150, suma_historyczna: 500 }
        return data;
    };

    return (
        <dataContext.Provider value={{
            fetchNearbyBusinesses, // Funkcja do wywołania
            getPointsBalance,
            nearbyBusinesses,      // Wyniki wyszukiwania
            refreshPoints,         // Trigger points refresh
            setPointsRefreshCallback, // Register refresh callback
        }}>
            {children}
        </dataContext.Provider>
    );
};