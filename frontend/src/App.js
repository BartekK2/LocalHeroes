import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './MaterialUICustiomization/theme';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importy Contextów
import { AuthProvider } from './API/AuthContext';
import { DataProvider } from './API/DataContext';

// Importy Komponentów
import Navbar from './Navbar/Navbar';

// Importy Stron
import Home from './pages/Home/Home';
import Login from './pages/Login_Registration/Login';
import MapboxExample from './pages/Map';
import Settings from './pages/Settings/Settings'; // <--- Dodano import Settings

import "./App.css";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Navbar/>
            <Routes>
              {/* Strona Główna */}
              <Route path="/" element={<Home />} />
              
              {/* Logowanie i Rejestracja */}
              <Route path="/login" element={<Login />} />
              
              {/* Mapa */}
              <Route path="/map" element={<MapboxExample />} />
              
              {/* Ustawienia Profilu (Nowe) */}
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;