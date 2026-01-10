import React, { useEffect, useRef, useState, useContext } from 'react';
import mapboxgl from 'mapbox-gl';
import { dataContext } from '../API/DataContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import Profil from '../components/profil';

const MapboxExample = ({ view = "customer" }) => { // Poprawiono destrukturyzację propsów
  const { fetchNearbyBusinesses, nearbyBusinesses } = useContext(dataContext);

  const handleBuildings = (lat, lng, radius) => {
    fetchNearbyBusinesses(lat, lng, radius);
  };

  const mapContainerRef = useRef();
  const [viewState, setViewState] = useState({
    lng: 20.0128,
    lat: 50.1043,
    zoom: 15.5,
  });
  const lastFetchedPos = useRef({ lng: 0, lat: 0 });
  const mapRef = useRef();
  const [selected, setSelected] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);

  // Referencja do aktualnego widoku, aby listener mapy go widział
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const TOKEN = 'pk.eyJ1IjoiYmFydGVrLWtyb2wyIiwiYSI6ImNtazhneGV0dDFkZDYzZXNjODcyY290NncifQ.47breRLsCjVz1kQhiMIZyw';
  const hoveredStateId = useRef(null);
  const [address, setAddress] = useState('');

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
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 17,
          pitch: 45,
          essential: true
        });
      } else {
        alert("Nie znaleziono takiego adresu.");
      }
    } catch (error) {
      console.error("Błąd szukania:", error);
    }
  };

  // Synchronizacja podświetlenia budynków z danymi z kontekstu
  useEffect(() => {
    if (!mapRef.current || !nearbyBusinesses || viewRef.current=="bussiness") return;
    
    // Opcjonalnie: można tu wyczyścić stany przed nałożeniem nowych
    nearbyBusinesses.forEach(element => {
      if (element.numer_na_mapie) {
        mapRef.current?.setFeatureState(
          { source: 'composite', sourceLayer: 'building', id: element.numer_na_mapie },
          { select: true }
        );
      }
    });
  }, [nearbyBusinesses]);

  useEffect(() => {
    mapboxgl.accessToken = TOKEN;
    mapRef.current = new mapboxgl.Map({
      style: 'mapbox://styles/bartek-krol2/cmk8fvqpn005l01seba25dwsz',
      center: [20.0128, 50.1043],
      zoom: 15.5,
      pitch: 45,
      bearing: -17.6,
      container: mapContainerRef.current, // Używamy ref zamiast ID stringa
      antialias: true
    });

    mapRef.current.on('move', () => {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      setViewState({
        lng: center.lng.toFixed(4),
        lat: center.lat.toFixed(4),
        zoom: zoom.toFixed(2)
      });
    });

    mapRef.current.on('style.load', () => {
      if (!mapRef.current.getSource('composite')) {
        mapRef.current.addSource('composite', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8'
        });
      }

      const layers = mapRef.current.getStyle().layers;
      const labelLayer = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      );
      const labelLayerId = labelLayer ? labelLayer.id : null;

      if (!mapRef.current.getLayer('interactive-3d-buildings')) {
        mapRef.current.addLayer(
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
                '#ff0000',
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

      mapRef.current.on('moveend', () => {
        const center = mapRef.current.getCenter();
        const latDiff = Math.abs(center.lat - lastFetchedPos.current.lat);
        const lngDiff = Math.abs(center.lng - lastFetchedPos.current.lng);

        if (latDiff > 0.01 || lngDiff > 0.01) {
          lastFetchedPos.current = { lng: center.lng, lat: center.lat };
          handleBuildings(center.lat, center.lng, 100);
        }
      });

      mapRef.current.on('click', 'interactive-3d-buildings', (e) => {
        if (e.features.length > 0) {
          const clickedId = e.features[0].id;
          if (clickedId !== undefined) {
            // Logika zmiany zaznaczenia wizualnego
            if (viewRef.current=="bussiness" && hoveredStateId.current !== null) {
              mapRef.current?.setFeatureState(
                { source: 'composite', sourceLayer: 'building', id: hoveredStateId.current },
                { select: false }
              );
            }
            
            hoveredStateId.current = clickedId;
            if(viewRef.current=="bussiness"){
              mapRef.current?.setFeatureState(
                { source: 'composite', sourceLayer: 'building', id: clickedId },
                { select: true }
              );
            }

            // KLUCZOWA ZMIANA: używamy viewRef.current
            if (viewRef.current === "customer") {
              setSelected(clickedId);
              setPopupVisible(true);
            }
          }
        }
      });

      mapRef.current.on('mouseenter', 'interactive-3d-buildings', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });
      mapRef.current.on('mouseleave', 'interactive-3d-buildings', () => {
        mapRef.current.getCanvas().style.cursor = '';
      });
    });

    return () => mapRef.current.remove();
  }, []);

  // Znalezienie biznesu na podstawie wybranego ID z mapy
  const selectedBusiness = nearbyBusinesses.find((b) => String(b.numer_na_mapie) === String(selected));

  return (
    <div>
      {viewState.lat}, {viewState.lng}
      {/* Przekazujemy dane do profilu tylko jeśli coś wybrano */}
      <Profil 
        businessId={selectedBusiness ? selectedBusiness.userId : "0" } visible={selectedBusiness && popupVisible} 
        onClose={()=>setPopupVisible(false)}
      />
      
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        <input 
          type="text" 
          placeholder="Wpisz adres (np. Pałac Kultury)" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ padding: '8px', width: '200px' }}
        />
        <button type="submit" style={{ padding: '8px', cursor: 'pointer' }}>
          Szukaj
        </button>
      </form>
      <div id="map" ref={mapContainerRef} style={{ height: '500px', width: '100%' }}></div>
    </div>
  );
};

export default MapboxExample;