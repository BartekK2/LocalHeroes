// PLIK: src/API/AuthContext.js
import { createContext, useState, useEffect } from 'react';

// Eksportujemy AuthContext jako named export (ważne!)
export const AuthContext = createContext();

// Eksportujemy AuthProvider jako named export (ważne!)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Upewnij się, że port backendu jest poprawny (np. 5000)
    const API_URL = "http://localhost:5000"; 

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedRole = localStorage.getItem('role');
        const savedUsername = localStorage.getItem('username');
        if (savedToken) {
            setUser({ token: savedToken, role: savedRole, username: savedUsername });
        }
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return { success: false, msg: data.message || "Niepoprawny login lub hasło" };
            }
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);
            
            setUser(data);
            return { success: true };
        } catch (e) {
            console.error("Błąd połączenia z serwerem:", e);
            return { success: false, msg: "Błąd połączenia z serwerem" };
        }
    };

    const register = async (username, password, accountType = 'klient') => {
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, accountType })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return { success: false, msg: data.message || "Błąd podczas rejestracji" };
            }
            
            return { success: true, data: data };
        } catch (e) {
            console.error("Błąd połączenia z serwerem:", e);
            return { success: false, msg: "Błąd połączenia z serwerem" };
        }
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};