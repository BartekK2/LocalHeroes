// PLIK: src/pages/Login_Registration/Login.js
import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from "@mui/material";

// Upewnij się, że ścieżka do AuthContext jest poprawna
// Jeśli Login.js jest w src/pages/Login_Registration/, to ../../API/AuthContext jest poprawne
import { AuthContext } from "../../API/AuthContext";

export default function AuthPage() {
  const { user, login, register } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialAction = queryParams.get("action") || "login";

  const [mode, setMode] = useState(initialAction);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("klient");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user && !isLoggingIn) {
      navigate("/", { replace: true });
    }
  }, [user, navigate, isLoggingIn]);

  useEffect(() => {
    setMode(initialAction);
    setError("");
    setSuccess("");
    setUsername("");
    setPassword("");
    setAccountType("klient");
    setIsLoggingIn(false);
  }, [initialAction]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    
    if (!username || !password) {
      setError("Wypełnij wszystkie pola!");
      return;
    }

    if (mode === "login") {
      setIsLoggingIn(true);
      const result = await login(username, password);
      
      if (result && result.success) {
        setSuccess("Zalogowano pomyślnie! Za chwilę nastąpi przekierowanie...");
        setTimeout(() => {
          navigate("/", { replace: true }); 
        }, 2000); 
      } else {
        setError(result?.msg || "Niepoprawny login lub hasło!");
        setIsLoggingIn(false);
      }

    } else if (mode === "registration") {
      const result = await register(username, password, accountType);
      
      if (result && result.success) {
        setSuccess(`Rejestracja konta typu "${accountType}" udana! Możesz się zalogować.`);
        setTimeout(() => {
            setMode("login");
            setSuccess("");
            setUsername("");
            setPassword("");
            setAccountType("klient");
        }, 2000);
      } else {
        setError(result?.msg || "Użytkownik już istnieje!");
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "registration" : "login");
    setError("");
    setSuccess("");
    setUsername("");
    setPassword("");
    setAccountType("klient");
    setIsLoggingIn(false);
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 2,
      }}
    >
      <Typography variant="h4" fontWeight={600}>
        {mode === "login" ? "Logowanie" : "Rejestracja"}
      </Typography>

      <Button
        onClick={toggleMode}
        variant="text"
        sx={{ mb: 2, textTransform: "none" }}
      >
        {mode === "login"
          ? "Chcesz się zarejestrować? Kliknij tutaj"
          : "Masz już konto? Zaloguj się"}
      </Button>

      <TextField
        label="Nazwa użytkownika"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        fullWidth
        sx={{ maxWidth: 400 }}
      />
      <TextField
        label="Hasło"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        fullWidth
        sx={{ maxWidth: 400 }}
      />

      {mode === "registration" && (
        <FormControl component="fieldset" sx={{ mt: 1 }}>
          <FormLabel component="legend" sx={{ fontSize: '0.9rem' }}>Wybierz typ konta:</FormLabel>
          <RadioGroup
            row
            aria-label="account-type"
            name="account-type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            <FormControlLabel value="klient" control={<Radio />} label="Klient" />
            <FormControlLabel value="biznes" control={<Radio />} label="Biznes (Sklep)" />
          </RadioGroup>
        </FormControl>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      {success && (
        <Typography color="success.main" sx={{ mt: 1, textAlign: 'center' }}>
          {success}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={!!success} 
        sx={{ mt: 2, maxWidth: 400 }}
      >
        {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
      </Button>
    </Box>
  );
}