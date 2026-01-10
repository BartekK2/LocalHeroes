import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  useEffect(() => {
    // TO MAKE THE MAP APPEAR YOU MUST
    // ADD YOUR ACCESS TOKEN FROM
    // https://account.mapbox.com
    mapboxgl.accessToken = '';

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
      const layers = mapRef.current.getStyle().layers;
      
      // 1. Szukamy warstwy z etykietami (napisami)
      const labelLayer = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      );

      // 2. Pobieramy jej ID tylko jeśli ją znaleźliśmy
      // Jeśli nie znaleźliśmy (undefined), to null (budynki dodadzą się na wierzch)
      const labelLayerId = labelLayer ? labelLayer.id : null;

      mapRef.current.addLayer(
        {
          id: 'add-3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#aaa',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.6
          }
        },
        // 3. Tutaj przekazujemy ID warstwy pod którą wstawiamy budynki
        // lub null, jeśli nic nie znaleźliśmy.
        labelLayerId 
      );
    });

    return () => mapRef.current.remove();
  }, []);

  return <div id="map" ref={mapContainerRef} style={{ height: '500px' }}></div>;
};

export default MapboxExample;