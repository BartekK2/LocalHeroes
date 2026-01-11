import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    InputAdornment,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AuthContext } from '../API/AuthContext';

const AddReward = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        nazwa: '',
        opis: '',
        koszt: '',
        typ: 'produkt',
        wartosc_rabatu: '',
    });

    // Redirect if not business user
    useEffect(() => {
        if (!user) {
            navigate('/login?action=login');
        } else if (user.role !== 'biznes') {
            navigate('/');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('http://localhost:5000/rewards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    nazwa: formData.nazwa,
                    opis: formData.opis || null,
                    koszt: parseInt(formData.koszt),
                    typ: formData.typ,
                    wartosc_rabatu: formData.wartosc_rabatu ? parseFloat(formData.wartosc_rabatu) : null,
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setFormData({
                    nazwa: '',
                    opis: '',
                    koszt: '',
                    typ: 'produkt',
                    wartosc_rabatu: '',
                });
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setError(data.message || 'Błąd podczas dodawania nagrody');
            }
        } catch (err) {
            console.error('Error adding reward:', err);
            setError('Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    };

    const isRabat = formData.typ === 'rabat_procentowy' || formData.typ === 'rabat_kwotowy';

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)',
                background: 'linear-gradient(180deg, #fafbff 0%, #eef2ff 100%)',
                py: 4,
                px: 2,
            }}
        >
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            width: 72,
                            height: 72,
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
                        }}
                    >
                        <CardGiftcardIcon sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                        Dodaj nagrodę
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Stwórz promocję lub nagrodę dla swoich klientów
                    </Typography>
                </Box>

                {/* Form */}
                <Paper
                    component="form"
                    onSubmit={handleSubmit}
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: '20px',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                    }}
                >
                    {success && (
                        <Alert
                            icon={<CheckCircleIcon />}
                            severity="success"
                            sx={{ mb: 3, borderRadius: '12px' }}
                        >
                            Nagroda została dodana pomyślnie!
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="Nazwa nagrody"
                        name="nazwa"
                        value={formData.nazwa}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2.5 }}
                        placeholder="np. Darmowa kawa, Rabat 20%"
                    />

                    <TextField
                        fullWidth
                        label="Opis (opcjonalnie)"
                        name="opis"
                        value={formData.opis}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        sx={{ mb: 2.5 }}
                        placeholder="Krótki opis nagrody..."
                    />

                    <TextField
                        fullWidth
                        label="Koszt punktowy"
                        name="koszt"
                        type="number"
                        value={formData.koszt}
                        onChange={handleChange}
                        required
                        sx={{ mb: 2.5 }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">pkt</InputAdornment>,
                        }}
                        placeholder="100"
                    />

                    <FormControl fullWidth sx={{ mb: 2.5 }}>
                        <InputLabel>Typ nagrody</InputLabel>
                        <Select
                            name="typ"
                            value={formData.typ}
                            onChange={handleChange}
                            label="Typ nagrody"
                        >
                            <MenuItem value="produkt">🎁 Produkt</MenuItem>
                            <MenuItem value="usługa">⚙️ Usługa</MenuItem>
                            <MenuItem value="rabat_procentowy">✂️ Rabat procentowy</MenuItem>
                            <MenuItem value="rabat_kwotowy">💰 Rabat kwotowy</MenuItem>
                        </Select>
                    </FormControl>

                    {isRabat && (
                        <TextField
                            fullWidth
                            label={formData.typ === 'rabat_procentowy' ? 'Wartość rabatu (%)' : 'Wartość rabatu (zł)'}
                            name="wartosc_rabatu"
                            type="number"
                            value={formData.wartosc_rabatu}
                            onChange={handleChange}
                            sx={{ mb: 2.5 }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {formData.typ === 'rabat_procentowy' ? '%' : 'zł'}
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading || !formData.nazwa || !formData.koszt}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                            },
                        }}
                    >
                        {loading ? 'Dodawanie...' : 'Dodaj nagrodę'}
                    </Button>
                </Paper>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'center', mt: 3 }}
                >
                    Nagrody będą widoczne dla klientów po dodaniu
                </Typography>
            </Box>
        </Box>
    );
};

export default AddReward;
