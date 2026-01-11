import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { dataContext } from '../API/DataContext';
import { AuthContext } from '../API/AuthContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, TextField, Button, Paper, Typography, CircularProgress, List, ListItem, ListItemText, Chip, Divider, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';

const MapboxExample = () => {
  const { fetchNearbyBusinesses, nearbyBusinesses } = useContext(dataContext);
  const { user } = useContext(AuthContext);

  // Determine view based on user role
  const isBusinessUser = user?.role === 'biznes';
  const view = isBusinessUser ? 'bussiness' : 'customer';

  const mapContainerRef = useRef();
  const [viewState, setViewState] = useState({
    lng: 20.0128,
    lat: 50.1043,
    zoom: 15.5,
  });
  const lastFetchedPos = useRef({ lng: 0, lat: 0 });
  const mapRef = useRef(null);
  const [selected, setSelected] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Business user specific state
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [selectedBuildingCoords, setSelectedBuildingCoords] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Highlight state for business list click
  const [highlightedBuildingId, setHighlightedBuildingId] = useState(null);
  const highlightedStateId = useRef(null);

  // State for inline profile view in left panel
  const [selectedBusinessData, setSelectedBusinessData] = useState(null);
  const [businessProfileData, setBusinessProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [claimingRewardId, setClaimingRewardId] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(null);

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Function to save building selection for business users
  const handleSaveBuilding = async () => {
    if (!selectedBuildingId || !user?.token) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const center = mapRef.current ? mapRef.current.getCenter() : null;
      const response = await fetch('http://localhost:5000/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          numer_na_mapie: String(selectedBuildingId),
          szerokosc_geograficzna: selectedBuildingCoords?.lat || center?.lat,
          dlugosc_geograficzna: selectedBuildingCoords?.lng || center?.lng
        })
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await response.json();
        console.error('Failed to save building:', data.message);
        alert('Błąd podczas zapisywania lokalizacji: ' + (data.message || 'Nieznany błąd'));
      }
    } catch (error) {
      console.error('Error saving building:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setIsSaving(false);
    }
  };

  const TOKEN = 'pk.eyJ1IjoiYmFydGVrLWtyb2wyIiwiYSI6ImNtazhneGV0dDFkZDYzZXNjODcyY290NncifQ.47breRLsCjVz1kQhiMIZyw';
  const hoveredStateId = useRef(null);
  const [address, setAddress] = useState('');

  // Memoized handler to avoid dependency issues
  const handleBuildings = useCallback((lat, lng, radius) => {
    fetchNearbyBusinesses(lat, lng, radius);
  }, [fetchNearbyBusinesses]);

  // Handle click on business from list - fly to location and highlight building
  const handleBusinessClick = useCallback((business) => {
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;

    // Reset previous highlight
    if (highlightedStateId.current !== null) {
      try {
        map.setFeatureState(
          { source: 'composite', sourceLayer: 'building', id: highlightedStateId.current },
          { highlight: false }
        );
      } catch (err) {
        console.warn('Error resetting highlight:', err);
      }
    }

    // Fly to business location
    if (business.szerokosc_geograficzna && business.dlugosc_geograficzna) {
      map.flyTo({
        center: [business.dlugosc_geograficzna, business.szerokosc_geograficzna],
        zoom: 17,
        pitch: 45,
        essential: true,
        duration: 1500
      });
    }

    // Highlight building if has numer_na_mapie
    if (business.numer_na_mapie) {
      const buildingId = parseInt(business.numer_na_mapie) || business.numer_na_mapie;
      highlightedStateId.current = buildingId;
      setHighlightedBuildingId(buildingId);

      // Wait for flyTo animation, then set highlight
      setTimeout(() => {
        try {
          map.setFeatureState(
            { source: 'composite', sourceLayer: 'building', id: buildingId },
            { highlight: true }
          );
        } catch (err) {
          console.warn('Error setting highlight:', err);
        }
      }, 1600);
    }

    // Show inline profile in customer view
    if (!isBusinessUser && business.userId) {
      setSelectedBusinessData(business);
      setProfileLoading(true);

      // Fetch full business profile
      fetch(`http://localhost:5000/public/business/${business.userId}`)
        .then(res => res.json())
        .then(data => {
          setBusinessProfileData(data);
          setProfileLoading(false);
        })
        .catch(err => {
          console.error('Error fetching business profile:', err);
          setProfileLoading(false);
        });
    }
  }, [mapLoaded, isBusinessUser]);

  // Handle back button in profile view
  const handleBackToList = useCallback(() => {
    setSelectedBusinessData(null);
    setBusinessProfileData(null);
    setClaimSuccess(null);
  }, []);

  // Handle claiming a reward
  const handleClaimReward = async (reward) => {
    if (!user?.token || claimingRewardId) return;

    setClaimingRewardId(reward.id);
    setClaimSuccess(null);

    try {
      const response = await fetch('http://localhost:5000/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ rewardId: reward.id })
      });

      const data = await response.json();

      if (response.ok) {
        setClaimSuccess(reward.id);
        setTimeout(() => setClaimSuccess(null), 3000);
      } else {
        alert(data.message || 'Nie udało się odebrać nagrody');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Błąd połączenia z serwerem');
    } finally {
      setClaimingRewardId(null);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!address) return;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${TOKEN}&types=address,poi`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 17,
            pitch: 45,
            essential: true
          });
        }
      } else {
        alert("Nie znaleziono takiego adresu.");
      }
    } catch (error) {
      console.error("Błąd szukania:", error);
    }
  };

  // Safe setFeatureState helper
  const safeSetFeatureState = useCallback((id, state) => {
    if (mapRef.current && mapLoaded && id !== undefined && id !== null) {
      try {
        mapRef.current.setFeatureState(
          { source: 'composite', sourceLayer: 'building', id: id },
          state
        );
      } catch (error) {
        console.warn('setFeatureState error:', error);
      }
    }
  }, [mapLoaded]);

  // Sync building highlights with data from context
  useEffect(() => {
    if (!mapLoaded || !nearbyBusinesses || viewRef.current === "bussiness") return;

    nearbyBusinesses.forEach(element => {
      if (element.numer_na_mapie) {
        safeSetFeatureState(element.numer_na_mapie, { select: true });
      }
    });
  }, [nearbyBusinesses, mapLoaded, safeSetFeatureState]);

  useEffect(() => {
    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      style: 'mapbox://styles/bartek-krol2/cmk8fvqpn005l01seba25dwsz',
      center: [20.0128, 50.1043],
      zoom: 15.5,
      pitch: 45,
      bearing: -17.6,
      container: mapContainerRef.current,
      antialias: true
    });

    mapRef.current = map;

    map.on('move', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setViewState({
        lng: center.lng.toFixed(4),
        lat: center.lat.toFixed(4),
        zoom: zoom.toFixed(2)
      });
    });

    map.on('style.load', () => {
      if (!map.getSource('composite')) {
        map.addSource('composite', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8'
        });
      }

      const layers = map.getStyle().layers;
      const labelLayer = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      );
      const labelLayerId = labelLayer ? labelLayer.id : null;

      if (!map.getLayer('interactive-3d-buildings')) {
        map.addLayer(
          {
            id: 'interactive-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'highlight'], false],
                '#f59e0b', // Theme secondary color (amber/orange)
                ['boolean', ['feature-state', 'select'], false],
                '#6366f1', // Theme primary color (indigo)
                '#f5f0e5'
              ],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.9
            }
          },
          labelLayerId
        );
      }

      // Mark map as loaded AFTER layer is added
      setMapLoaded(true);

      map.on('moveend', () => {
        const center = map.getCenter();
        const latDiff = Math.abs(center.lat - lastFetchedPos.current.lat);
        const lngDiff = Math.abs(center.lng - lastFetchedPos.current.lng);

        if (latDiff > 0.01 || lngDiff > 0.01) {
          lastFetchedPos.current = { lng: center.lng, lat: center.lat };
          handleBuildings(center.lat, center.lng, 100);
        }
      });

      map.on('click', 'interactive-3d-buildings', (e) => {
        if (e.features && e.features.length > 0) {
          const clickedId = e.features[0].id;
          if (clickedId !== undefined) {
            // Reset previous selection in business view
            if (viewRef.current === "bussiness" && hoveredStateId.current !== null) {
              try {
                map.setFeatureState(
                  { source: 'composite', sourceLayer: 'building', id: hoveredStateId.current },
                  { select: false }
                );
              } catch (err) {
                console.warn('Error resetting feature state:', err);
              }
            }

            hoveredStateId.current = clickedId;

            if (viewRef.current === "bussiness") {
              try {
                map.setFeatureState(
                  { source: 'composite', sourceLayer: 'building', id: clickedId },
                  { select: true }
                );
                // Store selected building ID and coordinates for saving
                setSelectedBuildingId(clickedId);
                const center = map.getCenter();
                setSelectedBuildingCoords({ lat: center.lat, lng: center.lng });
                setSaveSuccess(false);
              } catch (err) {
                console.warn('Error setting feature state:', err);
              }
            }

            if (viewRef.current === "customer") {
              setSelected(clickedId);
              setPopupVisible(true);
            }
          }
        }
      });

      map.on('mouseenter', 'interactive-3d-buildings', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'interactive-3d-buildings', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      setMapLoaded(false);
      map.remove();
    };
  }, [handleBuildings]);

  const selectedBusiness = nearbyBusinesses.find((b) => String(b.numer_na_mapie) === String(selected));

  return (
    <Box
      sx={{
        position: 'relative',
        height: 'calc(100vh - 64px)',
        width: '100%',
      }}
    >
      {/* Business List / Profile Panel */}
      {!isBusinessUser && nearbyBusinesses.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            top: 80,
            left: 20,
            zIndex: 10,
            width: { xs: '280px', sm: '340px' },
            maxHeight: 'calc(100vh - 180px)',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Profile View */}
          {selectedBusinessData ? (
            <>
              {/* Header with back button */}
              <Box sx={{
                p: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                color: 'white',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <IconButton
                    size="small"
                    onClick={handleBackToList}
                    sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Wróć do listy
                  </Typography>
                </Box>
                {businessProfileData?.business?.kategoria_biznesu && (
                  <Chip
                    label={businessProfileData.business.kategoria_biznesu}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      mb: 1,
                    }}
                  />
                )}
                <Typography variant="h6" fontWeight={700}>
                  {selectedBusinessData.nazwa_firmy}
                </Typography>
                {businessProfileData?.business && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <StarIcon sx={{ fontSize: 16, color: '#fbbf24' }} />
                    <Typography variant="body2">
                      {businessProfileData.business.srednia_ocena?.toFixed(1) || '0.0'}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      ({businessProfileData.business.liczba_opinii || 0} opinii)
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Loading state */}
              {profileLoading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Ładowanie profilu...
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ overflowY: 'auto', flex: 1 }}>
                  {/* Contact Info */}
                  <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <LocationOnIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2">
                        {businessProfileData?.business?.ulica || ''} {businessProfileData?.business?.numer_budynku || ''}, {businessProfileData?.business?.miasto || selectedBusinessData.miasto || ''}
                      </Typography>
                    </Box>
                    {businessProfileData?.business?.numer_kontaktowy_biznes && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <PhoneIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body2">
                          {businessProfileData.business.numer_kontaktowy_biznes}
                        </Typography>
                      </Box>
                    )}
                    {businessProfileData?.business?.link_do_strony_www && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LanguageIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography
                          variant="body2"
                          component="a"
                          href={businessProfileData.business.link_do_strony_www.startsWith('http')
                            ? businessProfileData.business.link_do_strony_www
                            : `https://${businessProfileData.business.link_do_strony_www}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          Strona WWW
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Rewards Section */}
                  <Box sx={{ p: 2, background: 'linear-gradient(180deg, #fafbff 0%, #eef2ff 100%)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <CardGiftcardIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight={600}>
                        Nagrody i promocje
                      </Typography>
                    </Box>

                    {businessProfileData?.rewards?.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Brak aktywnych promocji
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {businessProfileData?.rewards?.map((reward) => (
                          <Box
                            key={reward.id}
                            sx={{
                              backgroundColor: claimSuccess === reward.id ? 'rgba(34, 197, 94, 0.1)' : 'white',
                              p: 1.5,
                              borderRadius: '10px',
                              border: claimSuccess === reward.id
                                ? '1px solid rgba(34, 197, 94, 0.3)'
                                : '1px solid rgba(99, 102, 241, 0.1)',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {reward.typ?.includes('rabat') ? '✂️' : '🎁'} {reward.nazwa}
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="secondary.main">
                                {reward.koszt_punktowy} pkt
                              </Typography>
                            </Box>
                            {reward.opis && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {reward.opis}
                              </Typography>
                            )}
                            {user && user.role === 'klient' && (
                              <Button
                                size="small"
                                variant="contained"
                                fullWidth
                                disabled={claimingRewardId === reward.id || claimSuccess === reward.id}
                                onClick={() => handleClaimReward(reward)}
                                sx={{
                                  mt: 0.5,
                                  py: 0.5,
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: claimSuccess === reward.id
                                    ? '#22c55e'
                                    : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                  },
                                  '&:disabled': {
                                    background: claimSuccess === reward.id ? '#22c55e' : undefined,
                                    color: claimSuccess === reward.id ? 'white' : undefined,
                                  },
                                }}
                              >
                                {claimingRewardId === reward.id ? (
                                  <CircularProgress size={14} color="inherit" />
                                ) : claimSuccess === reward.id ? (
                                  '✓ Odebrano!'
                                ) : (
                                  'Odbierz za punkty'
                                )}
                              </Button>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </>
          ) : (
            /* Business List View */
            <>
              <Box sx={{ p: 2, pb: 1, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <StorefrontIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Lokalne biznesy
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Znaleziono {nearbyBusinesses.length} w pobliżu
                </Typography>
              </Box>

              <List sx={{
                overflowY: 'auto',
                flex: 1,
                py: 0.5,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(99, 102, 241, 0.3)', borderRadius: '3px' },
              }}>
                {nearbyBusinesses.map((business, index) => (
                  <React.Fragment key={business.userId || index}>
                    <ListItem
                      component="div"
                      onClick={() => handleBusinessClick(business)}
                      sx={{
                        cursor: 'pointer',
                        mx: 1,
                        borderRadius: '10px',
                        mb: 0.5,
                        transition: 'all 0.2s ease',
                        backgroundColor: highlightedBuildingId === parseInt(business.numer_na_mapie)
                          ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                        borderLeft: highlightedBuildingId === parseInt(business.numer_na_mapie)
                          ? '3px solid #f59e0b' : '3px solid transparent',
                        '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {business.nazwa_firmy || 'Biznes'}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {business.kategoria_biznesu && (
                                <Chip label={business.kategoria_biznesu} size="small"
                                  sx={{ fontSize: '0.7rem', height: '20px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'primary.main' }} />
                              )}
                              {business.distance_km && (
                                <Typography variant="caption" color="text.secondary">{business.distance_km} km</Typography>
                              )}
                            </Box>
                            {business.miasto && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {business.ulica ? `${business.ulica}, ` : ''}{business.miasto}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < nearbyBusinesses.length - 1 && <Divider variant="middle" sx={{ mx: 2 }} />}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
        </Paper>
      )}
      <Paper
        component="form"
        onSubmit={handleSearch}
        elevation={0}
        sx={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 0.75,
          pl: 2,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          width: { xs: 'calc(100% - 40px)', sm: '400px', md: '500px' },
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(99, 102, 241, 0.15)',
          },
          '&:focus-within': {
            boxShadow: '0 12px 40px rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary', ml: 0.5 }} />
        <TextField
          placeholder="Szukaj lokalizacji (np. Pałac Kultury)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          variant="standard"
          fullWidth
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '0.95rem',
            }
          }}
          sx={{
            '& .MuiInputBase-root': {
              padding: 0,
            }
          }}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{
            minWidth: 'auto',
            px: 2.5,
            py: 1,
            borderRadius: '12px',
            fontWeight: 600,
          }}
        >
          Szukaj
        </Button>
      </Paper>

      {/* Coordinates Display */}
      <Paper
        elevation={0}
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          zIndex: 10,
          px: 2,
          py: 1.5,
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Współrzędne
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
          {viewState.lat}°N, {viewState.lng}°E
        </Typography>
      </Paper>

      {/* Save Button for Business Users */}
      {isBusinessUser && (
        <Paper
          elevation={0}
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 10,
            p: 2,
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            minWidth: '200px',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Tryb biznesowy
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {selectedBuildingId
              ? `Wybrany budynek: #${selectedBuildingId}`
              : 'Kliknij na budynek, aby go wybrać'
            }
          </Typography>
          <Button
            variant="contained"
            color={saveSuccess ? 'success' : 'primary'}
            fullWidth
            disabled={!selectedBuildingId || isSaving}
            onClick={handleSaveBuilding}
            startIcon={
              isSaving ? <CircularProgress size={18} color="inherit" /> :
                saveSuccess ? <CheckCircleIcon /> : <SaveIcon />
            }
            sx={{
              borderRadius: '10px',
              py: 1.2,
              fontWeight: 600,
              transition: 'all 0.3s ease',
            }}
          >
            {isSaving ? 'Zapisywanie...' : saveSuccess ? 'Zapisano!' : 'Zapisz lokalizację'}
          </Button>
        </Paper>
      )}

      {/* Map Container */}
      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
        }}
      />
    </Box>
  );
};

export default MapboxExample;