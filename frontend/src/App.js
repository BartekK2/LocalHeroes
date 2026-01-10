import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './MaterialUICustiomization/theme';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login_Registration/Login';
import "./App.css"

import Navbar from './Navbar/Navbar'

import { AuthProvider } from './API/AuthContext';
import { DataProvider } from './API/DataContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Navbar/>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>

    </ThemeProvider>
  );
}

export default App;