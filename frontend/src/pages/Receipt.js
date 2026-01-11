import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import { dataContext } from '../API/DataContext';
import { AuthContext } from '../API/AuthContext';

const ReceiptScanner = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [pointsAdded, setPointsAdded] = useState(null);

  const { refreshPoints } = useContext(dataContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login?action=login');
    }
  }, [user, navigate]);

  const addPointsToSelf = async (amount) => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error("Nie jesteś zalogowany!");
    }

    const response = await fetch('http://localhost:5000/points/self', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ points: amount })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Błąd podczas dodawania punktów");
    }

    return data;
  };

  const uploadReceipt = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    setLoading(true);
    setData(null);
    setPointsAdded(null);

    try {
      const response = await axios.post('http://localhost:3000/process-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const responseData = response.data;
      setData(responseData);

      try {
        const totalValue = responseData.result?.total ? parseInt(responseData.result.total) : 0;

        if (totalValue > 0) {
          const result = await addPointsToSelf(totalValue);
          setPointsAdded(totalValue);

          // Odśwież punkty w navbarze
          if (refreshPoints) {
            refreshPoints();
          }
        }
      } catch (error) {
        console.error(error.message);
      }
    } catch (err) {
      console.error("Błąd szczegółowy:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    uploadReceipt(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadReceipt(e.dataTransfer.files[0]);
    }
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
            <ReceiptLongIcon sx={{ fontSize: 36, color: 'white' }} />
          </Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
            Skanuj paragon
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Prześlij zdjęcie paragonu, aby automatycznie zdobyć punkty
          </Typography>
        </Box>

        {/* Upload Area */}
        <Paper
          component="label"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            p: 4,
            borderRadius: '20px',
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'rgba(99, 102, 241, 0.3)',
            backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'white',
            cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(99, 102, 241, 0.03)',
            },
          }}
        >
          <input
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            accept="image/*"
            style={{ display: 'none' }}
          />

          {loading ? (
            <>
              <CircularProgress size={48} thickness={4} />
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Analizowanie paragonu...
              </Typography>
              <Typography variant="caption" color="text.secondary">
                To może potrwać do 15 sekund
              </Typography>
              <LinearProgress sx={{ width: '100%', borderRadius: 2, mt: 1 }} />
            </>
          ) : (
            <>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Przeciągnij zdjęcie tutaj
              </Typography>
              <Typography variant="body2" color="text.secondary">
                lub kliknij, aby wybrać plik
              </Typography>
              <Chip
                label="JPG, PNG, HEIC"
                size="small"
                sx={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  color: 'primary.main',
                  fontWeight: 500,
                }}
              />
            </>
          )}
        </Paper>

        {/* Success Alert */}
        {pointsAdded && (
          <Alert
            icon={<CheckCircleIcon fontSize="inherit" />}
            severity="success"
            sx={{
              mt: 3,
              borderRadius: '16px',
              '& .MuiAlert-icon': {
                color: '#22c55e',
              },
            }}
          >
            <Typography variant="body1" fontWeight={600}>
              Sukces! Dodano {pointsAdded} punktów
            </Typography>
          </Alert>
        )}

        {/* Results Card */}
        {data && (
          <Card
            elevation={0}
            sx={{
              mt: 3,
              borderRadius: '20px',
              border: '1px solid rgba(99, 102, 241, 0.1)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                p: 2.5,
                color: 'white',
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Wyniki analizy
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Shop */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <StorefrontIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Sklep
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {data.result?.establishment || 'Nie wykryto'}
                  </Typography>
                </Box>
              </Box>

              {/* Total */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LoyaltyIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Suma / Punkty
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="secondary.main">
                    {data.result?.total || '0.00'} zł
                  </Typography>
                </Box>
              </Box>

              {/* Date */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarTodayIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Data zakupu
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {data.result?.date || 'Brak daty'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3 }}
        >
          Twoje dane są bezpieczne i nie są przechowywane na serwerze
        </Typography>
      </Box>
    </Box>
  );
};

export default ReceiptScanner;