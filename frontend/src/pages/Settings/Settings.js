import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../API/AuthContext";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid, // ZMIANA: Używamy zwykłego Grida (działa w każdej wersji MUI)
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  Avatar
} from "@mui/material";

// Import Ikon
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import LanguageIcon from '@mui/icons-material/Language';
import BadgeIcon from '@mui/icons-material/Badge';
import SaveIcon from '@mui/icons-material/Save';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventIcon from '@mui/icons-material/Event';
import NumbersIcon from '@mui/icons-material/Numbers';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function Settings() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  
  const [formData, setFormData] = useState({
    imie: "",
    nazwisko: "",
    numer_telefonu: "",
    data_urodzenia: "",
    nazwa_firmy: "",
    nip: "",
    miasto: "",
    ulica: "",
    numer_budynku: "",
    kod_pocztowy: "",
    szerokosc_geograficzna: "",
    dlugosc_geograficzna: "",
    kategoria_biznesu: "",
    numer_kontaktowy_biznes: "",
    link_do_strony_www: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Błąd pobierania profilu", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setMsg({ type: "", text: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMsg({ type: "success", text: "Dane zostały zapisane pomyślnie!" });
      } else {
        setMsg({ type: "error", text: "Błąd podczas zapisu danych." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Błąd połączenia z serwerem." });
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
    </Box>
  );

  const isBusiness = user?.role === "biznes";

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      
      {/* NAGŁÓWEK */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
            {isBusiness ? <StorefrontIcon fontSize="large" /> : <PersonIcon fontSize="large" />}
        </Avatar>
        <Box>
            <Typography variant="h4" fontWeight="bold">
                {isBusiness ? 'Profil Firmy' : 'Profil Użytkownika'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Zarządzaj swoimi danymi i ustawieniami konta
            </Typography>
        </Box>
      </Box>

      {msg.text && (
        <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }}>
          {msg.text}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Grid container spacing={3}>
          
          {/* --- SEKCJA KLIENTA --- */}
          {!isBusiness && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Dane Osobowe</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth label="Imię" name="imie" 
                    value={formData.imie || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth label="Nazwisko" name="nazwisko" 
                    value={formData.nazwisko || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth label="Telefon" name="numer_telefonu" 
                    value={formData.numer_telefonu || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth type="date" label="Data urodzenia" InputLabelProps={{ shrink: true }} 
                    name="data_urodzenia" value={formData.data_urodzenia || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><EventIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
            </>
          )}

          {/* --- SEKCJA BIZNESOWA --- */}
          {isBusiness && (
            <>
              {/* Informacje o Firmie */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Informacje o Firmie</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth label="Nazwa Firmy" name="nazwa_firmy" 
                    value={formData.nazwa_firmy || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><BusinessIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth label="NIP" name="nip" 
                    value={formData.nip || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><NumbersIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth label="Kategoria" name="kategoria_biznesu" 
                    value={formData.kategoria_biznesu || ""} onChange={handleChange} 
                    placeholder="np. Restauracja, Sklep, Usługi"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth label="Telefon firmowy" name="numer_kontaktowy_biznes" 
                    value={formData.numer_kontaktowy_biznes || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                    fullWidth label="Strona WWW" name="link_do_strony_www" 
                    value={formData.link_do_strony_www || ""} onChange={handleChange} 
                    placeholder="https://..."
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><LanguageIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>

              {/* Adres */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>Adres Siedziby</Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Miasto" name="miasto" value={formData.miasto || ""} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Kod pocztowy" name="kod_pocztowy" value={formData.kod_pocztowy || ""} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField 
                    fullWidth label="Ulica" name="ulica" 
                    value={formData.ulica || ""} onChange={handleChange} 
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><HomeIcon color="action" /></InputAdornment>,
                    }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Nr" name="numer_budynku" value={formData.numer_budynku || ""} onChange={handleChange} />
              </Grid>

              {/* Sekcja Lokalizacji (BEZ INPUTÓW) */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LocationOnIcon color={formData.szerokosc_geograficzna ? "primary" : "disabled"} fontSize="large" />
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Lokalizacja na mapie
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formData.szerokosc_geograficzna && formData.dlugosc_geograficzna 
                                ? "Współrzędne są ustawione. Klienci widzą Twój sklep na mapie." 
                                : "Brak ustawionej lokalizacji. Współrzędne zostaną pobrane automatycznie z mapy."}
                        </Typography>
                    </Box>
                </Paper>
              </Grid>
            </>
          )}

          {/* PRZYCISK ZAPISU */}
          <Grid item xs={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
                variant="contained" 
                size="large" 
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                sx={{ px: 5, py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 'bold' }}
            >
              Zapisz Zmiany
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}