import React, { useEffect, useRef,useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const TOKEN = 'pk.eyJ1IjoiYmFydGVrLWtyb2wyIiwiYSI6ImNtazhnaTEyZjBycXMzZHNteXN4MmdndDUifQ.8IGuNX51NroF5v7bpNjqsA';
  const hoveredStateId = useRef(null);
    const [address, setAddress] = useState('');
    const handleSearch = async (e) => {
    e.preventDefault(); // Żeby formularz nie przeładował strony
    if (!address) return;

    try {
      // Wysyłamy zapytanie do API Mapboxa
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${TOKEN}&types=address,poi`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // Bierzemy pierwszy wynik (najbardziej trafny)
        const [lng, lat] = data.features[0].center;

        // Przesuwamy mapę w nowe miejsce
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 17, // Zbliżamy mocno, żeby zobaczyć budynki
          pitch: 45, // Zachowujemy kąt 3D
          essential: true
        });
      } else {
        alert("Nie znaleziono takiego adresu.");
      }
    } catch (error) {
      console.error("Błąd szukania:", error);
    }
  };
  useEffect(() => {
    mapboxgl.accessToken = TOKEN;
    mapRef.current = new mapboxgl.Map({
      style: 'mapbox://styles/bartek-krol2/cmk8fvqpn005l01seba25dwsz',
      center: [-74.0066, 40.7135],
      zoom: 15.5,
      pitch: 45,
      bearing: -17.6,
      container: 'map',
      antialias: true
    });

    mapRef.current.on('style.load', () => {
      
      // 1. UPEWNIAMY SIĘ, ŻE MAMY ŹRÓDŁO DANYCH
      if (!mapRef.current.getSource('composite')) {
          mapRef.current.addSource('composite', {
              type: 'vector',
              url: 'mapbox://mapbox.mapbox-streets-v8'
          });
      }

      const layers = mapRef.current.getStyle().layers;

      // 3. DODAJEMY NASZĄ INTERAKTYWNĄ WARSTWĘ
      // Znajdź warstwę tekstową, żeby budynki nie zasłaniały nazw ulic
      const labelLayer = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      );
      const labelLayerId = labelLayer ? labelLayer.id : null;

      if (!mapRef.current.getLayer('interactive-3d-buildings')) {
        console.log("dodaje");
        mapRef.current.addLayer(
          {
            id: 'interactive-3d-buildings',
            source: 'composite', 
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              // === TU JEST MAGIA KOLORÓW ===
              'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'select'], false],
                '#ff0000', // Jeśli zaznaczony -> CZERWONY
                '#f5f0e5'  // Jeśli nie -> SZARY (zmień na jaki chcesz)
              ],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.9
            }
          },
          labelLayerId // Wstawiamy pod napisy
        );
      }

      // 4. OBSŁUGA KLIKNIĘCIA (Zmiana koloru)
      mapRef.current.on('click', 'interactive-3d-buildings', (e) => {
        if (e.features.length > 0) {
          const clickedId = e.features[0].id;

          // Obsługa zmiany stanu tylko jeśli budynek ma ID
          if (clickedId !== undefined) {
              // Jeśli kliknęliśmy w inny budynek niż ten zaznaczony
              if (hoveredStateId.current !== clickedId) {
                
                // A. "Zgaś" poprzedni budynek (jeśli jakiś był)
                if (hoveredStateId.current !== null) {
                  mapRef.current.setFeatureState(
                    { source: 'composite', sourceLayer: 'building', id: hoveredStateId.current },
                    { select: false }
                  );
                }
    
                // B. "Zapal" nowy budynek
                hoveredStateId.current = clickedId;
                mapRef.current.setFeatureState(
                  { source: 'composite', sourceLayer: 'building', id: clickedId },
                  { select: true }
                );
                
                console.log("Zmieniono kolor na czerwony dla ID:", clickedId);
              }
          }
        }
      });

      // Zmiana kursora myszy
      mapRef.current.on('mouseenter', 'interactive-3d-buildings', () => {
        mapRef.current.getCanvas().style.cursor = 'pointer';
      });
      mapRef.current.on('mouseleave', 'interactive-3d-buildings', () => {
        mapRef.current.getCanvas().style.cursor = '';
      });

    });

    return () => mapRef.current.remove();
  }, []);

  return <div>
    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px' }}>
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
        <div id="map" ref={mapContainerRef} style={{ height: '500px' }}></div>
    </div>;
};

export default MapboxExample;