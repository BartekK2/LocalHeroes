import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { dataContext } from '../API/DataContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import Profil from '../components/profil';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const MapboxExample = ({ view = "customer" }) => {
  const { fetchNearbyBusinesses, nearbyBusinesses } = useContext(dataContext);

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

  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const TOKEN = 'pk.eyJ1IjoiYmFydGVrLWtyb2wyIiwiYSI6ImNtazhneGV0dDFkZDYzZXNjODcyY290NncifQ.47breRLsCjVz1kQhiMIZyw';
  const hoveredStateId = useRef(null);
  const [address, setAddress] = useState('');

  // Memoized handler to avoid dependency issues
  const handleBuildings = useCallback((lat, lng, radius) => {
    fetchNearbyBusinesses(lat, lng, radius);
  }, [fetchNearbyBusinesses]);

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
      <Profil
        businessId={selectedBusiness ? selectedBusiness.userId : "0"}
        visible={selectedBusiness && popupVisible}
        onClose={() => setPopupVisible(false)}
      />

      {/* Search Bar Overlay */}
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