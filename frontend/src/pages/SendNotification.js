import { useState, useContext } from "react";
import { AuthContext } from "../API/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Slider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    InputAdornment,
    Avatar
} from "@mui/material";

import CampaignIcon from '@mui/icons-material/Campaign';
import PaymentIcon from '@mui/icons-material/Payment';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function SendNotification() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        tytul: "",
        tresc: "",
        promien_km: 5
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [cardData, setCardData] = useState({
        number: "",
        expiry: "",
        cvv: "",
        name: ""
    });

    // Redirect if not business
    if (!user || user.role !== 'biznes') {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" color="error">
                    Ta strona jest dostępna tylko dla kont biznesowych.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
                    Wróć na stronę główną
                </Button>
            </Box>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSliderChange = (e, newValue) => {
        setFormData((prev) => ({ ...prev, promien_km: newValue }));
    };

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardData((prev) => ({ ...prev, [name]: value }));
    };

    const handleOpenPayment = () => {
        if (!formData.tytul || !formData.tresc) {
            setMsg({ type: "error", text: "Uzupełnij tytuł i treść powiadomienia." });
            return;
        }
        setMsg({ type: "", text: "" });
        setPaymentOpen(true);
    };

    const handleSimulatePayment = async () => {
        // Symulacja przetwarzania płatności
        setLoading(true);

        // Fake delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        setPaymentSuccess(true);

        // Po "udanej płatności" wyślij powiadomienie
        setTimeout(async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/notifications/send", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();

                if (res.ok) {
                    setPaymentOpen(false);
                    setPaymentSuccess(false);
                    setMsg({ type: "success", text: `${data.message} Powiadomienie wygasa za 7 dni.` });
                    setFormData({ tytul: "", tresc: "", promien_km: 5 });
                    setCardData({ number: "", expiry: "", cvv: "", name: "" });
                } else {
                    setMsg({ type: "error", text: data.message || "Błąd wysyłania powiadomienia." });
                    setPaymentOpen(false);
                    setPaymentSuccess(false);
                }
            } catch (err) {
                setMsg({ type: "error", text: "Błąd połączenia z serwerem." });
                setPaymentOpen(false);
                setPaymentSuccess(false);
            } finally {
                setLoading(false);
            }
        }, 1000);
    };

    return (
        <Box sx={{ maxWidth: 700, mx: "auto", p: 3 }} className="fade-in">
            {/* NAGŁÓWEK */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    sx={{
                        width: 64,
                        height: 64,
                        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                >
                    <CampaignIcon fontSize="large" />
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Wyślij Powiadomienie
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Dotrzyj do klientów w Twojej okolicy
                    </Typography>
                </Box>
            </Box>

            {msg.text && (
                <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }}>
                    {msg.text}
                </Alert>
            )}

            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                {/* Tytuł */}
                <TextField
                    fullWidth
                    label="Tytuł powiadomienia"
                    name="tytul"
                    value={formData.tytul}
                    onChange={handleChange}
                    placeholder="np. Super promocja weekendowa!"
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <CampaignIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Treść */}
                <TextField
                    fullWidth
                    label="Treść powiadomienia"
                    name="tresc"
                    value={formData.tresc}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    placeholder="Opisz swoją promocję, event lub ofertę specjalną..."
                    sx={{ mb: 3 }}
                />

                {/* Promień */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Zasięg powiadomienia: {formData.promien_km} km
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Powiadomienie dotrze do wszystkich użytkowników w promieniu {formData.promien_km} km od Twojej lokalizacji.
                    </Typography>
                    <Slider
                        value={formData.promien_km}
                        onChange={handleSliderChange}
                        min={1}
                        max={20}
                        step={1}
                        marks={[
                            { value: 1, label: '1 km' },
                            { value: 5, label: '5 km' },
                            { value: 10, label: '10 km' },
                            { value: 20, label: '20 km' }
                        ]}
                        sx={{
                            '& .MuiSlider-thumb': {
                                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                            },
                            '& .MuiSlider-track': {
                                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                            }
                        }}
                    />
                </Box>

                {/* Cena */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        mb: 3,
                        bgcolor: 'rgba(99, 102, 241, 0.04)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: 3
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">Koszt powiadomienia</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Jednorazowa opłata, ważne przez 7 dni
                            </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                            99 PLN
                        </Typography>
                    </Box>
                </Paper>

                {/* Przycisk */}
                <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleOpenPayment}
                    startIcon={<PaymentIcon />}
                    sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                        }
                    }}
                >
                    Zapłać i wyślij
                </Button>
            </Paper>

            {/* Modal płatności */}
            <Dialog
                open={paymentOpen}
                onClose={() => !loading && setPaymentOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                {paymentSuccess ? (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Płatność przyjęta!
                        </Typography>
                        <Typography color="text.secondary">
                            Wysyłanie powiadomienia...
                        </Typography>
                        <CircularProgress sx={{ mt: 2 }} />
                    </Box>
                ) : (
                    <>
                        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
                            <CreditCardIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h5" fontWeight="bold">
                                Płatność - 99 PLN
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Symulacja bramki płatniczej
                            </Typography>
                        </DialogTitle>

                        <Divider sx={{ my: 2 }} />

                        <DialogContent>
                            <TextField
                                fullWidth
                                label="Numer karty"
                                name="number"
                                value={cardData.number}
                                onChange={handleCardChange}
                                placeholder="1234 5678 9012 3456"
                                sx={{ mb: 2 }}
                            />
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Data ważności"
                                    name="expiry"
                                    value={cardData.expiry}
                                    onChange={handleCardChange}
                                    placeholder="MM/RR"
                                />
                                <TextField
                                    fullWidth
                                    label="CVV"
                                    name="cvv"
                                    value={cardData.cvv}
                                    onChange={handleCardChange}
                                    placeholder="123"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Imię i nazwisko na karcie"
                                name="name"
                                value={cardData.name}
                                onChange={handleCardChange}
                                placeholder="Jan Kowalski"
                            />
                        </DialogContent>

                        <DialogActions sx={{ p: 3, pt: 0 }}>
                            <Button
                                onClick={() => setPaymentOpen(false)}
                                disabled={loading}
                            >
                                Anuluj
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleSimulatePayment}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                                sx={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    }
                                }}
                            >
                                {loading ? 'Przetwarzanie...' : 'Zapłać 99 PLN'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
