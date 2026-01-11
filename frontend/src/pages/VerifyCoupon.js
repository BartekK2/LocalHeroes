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
    Card,
    CardContent,
    Chip,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PersonIcon from '@mui/icons-material/Person';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { AuthContext } from '../API/AuthContext';

const VerifyCoupon = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [couponData, setCouponData] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Redirect if not business user
    useEffect(() => {
        if (!user) {
            navigate('/login?action=login');
        } else if (user.role !== 'biznes') {
            navigate('/');
        }
    }, [user, navigate]);

    // Check coupon
    const handleCheck = async () => {
        if (!code.trim()) return;

        setChecking(true);
        setError(null);
        setCouponData(null);
        setSuccess(null);

        try {
            const response = await fetch(`http://localhost:5000/coupons/check/${code.trim()}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                setCouponData(data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem');
        } finally {
            setChecking(false);
        }
    };

    // Redeem coupon
    const handleRedeem = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/coupons/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ code: code.trim() })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setCouponData(null);
                setCode('');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

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
                            background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 2,
                            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                        }}
                    >
                        <QrCodeScannerIcon sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                        Weryfikuj kupon
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Sprawdź i zrealizuj kupony klientów
                    </Typography>
                </Box>

                {/* Input Form */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.1)', mb: 3 }}>
                    <TextField
                        fullWidth
                        label="Kod kuponu"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="XXXXXXXXXXXXXXXX"
                        sx={{ mb: 2 }}
                        inputProps={{ style: { fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '0.1em' } }}
                    />

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleCheck}
                        disabled={!code.trim() || checking}
                        sx={{
                            py: 1.5,
                            borderRadius: '12px',
                            fontWeight: 600,
                        }}
                    >
                        {checking ? <CircularProgress size={20} /> : 'Sprawdź kupon'}
                    </Button>
                </Paper>

                {/* Success */}
                {success && (
                    <Alert
                        icon={<CheckCircleIcon />}
                        severity="success"
                        sx={{ mb: 3, borderRadius: '12px' }}
                    >
                        {success}
                    </Alert>
                )}

                {/* Error */}
                {error && (
                    <Alert
                        icon={<ErrorIcon />}
                        severity="error"
                        sx={{ mb: 3, borderRadius: '12px' }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Coupon Details */}
                {couponData && (
                    <Card elevation={0} sx={{ borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.1)', overflow: 'hidden' }}>
                        <Box
                            sx={{
                                background: couponData.valid
                                    ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                                    : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                                p: 2,
                                color: 'white',
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={700}>
                                    {couponData.valid ? '✓ Kupon ważny' : '✗ Kupon nieważny'}
                                </Typography>
                                <Chip
                                    label={couponData.status === 'do_wykorzystania' ? 'Aktywny' : couponData.status}
                                    size="small"
                                    sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                                />
                            </Box>
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <CardGiftcardIcon color="primary" />
                                <Typography variant="h6" fontWeight={600}>
                                    {couponData.kupon.nagroda}
                                </Typography>
                            </Box>

                            {couponData.kupon.opis && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {couponData.kupon.opis}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    Klient: <strong>{couponData.kupon.klient}</strong>
                                </Typography>
                            </Box>

                            <Typography variant="caption" color="text.disabled">
                                Odebrany: {formatDate(couponData.kupon.data_odebrania)}
                            </Typography>

                            {couponData.valid && (
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleRedeem}
                                    disabled={loading}
                                    sx={{
                                        mt: 3,
                                        py: 1.5,
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                        },
                                    }}
                                >
                                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Zrealizuj kupon'}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
};

export default VerifyCoupon;
