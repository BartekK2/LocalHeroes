import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const hoveredStateId = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.._2cgxFgWPHqBU8tu3KP7kQ';

    mapRef.current = new mapboxgl.Map({
      style: 'mapbox://styles/bartek-krol2/cmk8bc9t0000301r1gcooffpz',
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
                '#aaaaaa'  // Jeśli nie -> SZARY (zmień na jaki chcesz)
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

  return <div id="map" ref={mapContainerRef} style={{ height: '500px' }}></div>;
};

export default MapboxExample;