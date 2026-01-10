import { createContext, useState, useEffect, useContext } from 'react';

export const dataContext = createContext();

export const DataProvider = ({ children }) => {
    const API_URL = "http://localhost:5000";

    // Stany do przechowywania danych i statusu żądania
    const [nearbyBusinesses, setNearbyBusinesses] = useState([]);

    async function fetchNearbyBusinesses(lat,lng,radius) {
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

    return (
        <dataContext.Provider value={{ 
            fetchNearbyBusinesses, // Funkcja do wywołania
            nearbyBusinesses,      // Wyniki wyszukiwania
        }}>
            {children}
        </dataContext.Provider>
    );
};