import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AuthContext } from '../API/AuthContext';

const MyRewards = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Redirect if not customer
    useEffect(() => {
        if (!user) {
            navigate('/login?action=login');
        } else if (user.role !== 'klient') {
            navigate('/');
        }
    }, [user, navigate]);

    // Fetch claimed rewards
    useEffect(() => {
        const fetchRewards = async () => {
            if (!user?.token) {
                console.log('MyRewards: No token, skipping fetch');
                setLoading(false);
                return;
            }

            console.log('MyRewards: Fetching with token');

            try {
                const response = await fetch('http://localhost:5000/rewards/my', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                console.log('MyRewards: Response status:', response.status);

                const text = await response.text();
                console.log('MyRewards: Raw response:', text.substring(0, 200));

                let data;
                try {
                    data = JSON.parse(text);
                } catch (parseErr) {
                    console.error('MyRewards: Failed to parse JSON:', parseErr);
                    setError('Błąd parsowania odpowiedzi serwera');
                    return;
                }

                if (response.ok) {
                    console.log('MyRewards: Success, found', data.length, 'rewards');
                    setRewards(data);
                } else {
                    console.error('MyRewards: Server error:', response.status, data);
                    setError(data.message || 'Nie udało się pobrać nagród');
                }
            } catch (err) {
                console.error('MyRewards: Fetch error:', err);
                setError('Błąd połączenia z serwerem: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRewards();
    }, [user]);

    const getStatusLabel = (status) => {
        switch (status) {
            case 'do_wykorzystania':
                return { label: 'Do wykorzystania', color: 'success' };
            case 'wykorzystany':
                return { label: 'Wykorzystany', color: 'default' };
            case 'anulowany':
                return { label: 'Anulowany', color: 'error' };
            default:
                return { label: status, color: 'default' };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
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
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
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
                        <CardGiftcardIcon sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                        Moje nagrody
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Twoje odebrane kupony i rabaty
                    </Typography>
                </Box>

                {/* Loading */}
                {loading && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Ładowanie nagród...
                        </Typography>
                    </Box>
                )}

                {/* Error */}
                {error && (
                    <Alert severity="error" sx={{ borderRadius: '12px' }}>
                        {error}
                    </Alert>
                )}

                {/* Empty state */}
                {!loading && !error && rewards.length === 0 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: '20px',
                            border: '1px solid rgba(99, 102, 241, 0.1)',
                            textAlign: 'center',
                        }}
                    >
                        <LocalOfferIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Brak odebranych nagród
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Odwiedź mapę i odbieraj nagrody w lokalnych sklepach
                        </Typography>
                    </Paper>
                )}

                {/* Rewards list */}
                {!loading && rewards.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {rewards.map((claimed) => {
                            const status = getStatusLabel(claimed.status);
                            return (
                                <Card
                                    key={claimed.id}
                                    elevation={0}
                                    sx={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(99, 102, 241, 0.1)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            background: claimed.status === 'do_wykorzystania'
                                                ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                                                : 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
                                            p: 2,
                                            color: 'white',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={700}>
                                                    {claimed.Reward?.typ?.includes('rabat') ? '✂️' : '🎁'} {claimed.Reward?.nazwa}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    <StorefrontIcon sx={{ fontSize: 16 }} />
                                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                        {claimed.Reward?.Business?.nazwa_firmy || 'Sklep'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Chip
                                                label={status.label}
                                                size="small"
                                                color={status.color}
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </Box>
                                    </Box>

                                    <CardContent sx={{ p: 2.5 }}>
                                        {/* Unique code */}
                                        <Box
                                            sx={{
                                                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                                                p: 2,
                                                borderRadius: '12px',
                                                textAlign: 'center',
                                                mb: 2,
                                                border: '2px dashed rgba(99, 102, 241, 0.2)',
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                Kod kuponu
                                            </Typography>
                                            <Typography
                                                variant="h5"
                                                fontWeight={700}
                                                color="primary.main"
                                                sx={{ letterSpacing: '0.1em', fontFamily: 'monospace' }}
                                            >
                                                {claimed.kod_unikalny}
                                            </Typography>
                                        </Box>

                                        {/* Description */}
                                        {claimed.Reward?.opis && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                {claimed.Reward.opis}
                                            </Typography>
                                        )}

                                        {/* Meta info */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                <Typography variant="caption" color="text.secondary">
                                                    Odebrano: {formatDate(claimed.data_odebrania)}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={`-${claimed.Reward?.koszt_punktowy} pkt`}
                                                size="small"
                                                sx={{
                                                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MyRewards;
