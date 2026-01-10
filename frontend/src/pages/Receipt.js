import React, { useState } from 'react';
import axios from 'axios';

const ReceiptScanner = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const uploadReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file); // Klucz musi być 'receipt' - tak jak w server.js

    setLoading(true);
    setData(null);

    try {
      const response = await axios.post('http://localhost:3000/process-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setData(response.data);
      console.log("Dane z serwera:", response.data);
    } catch (err) {
      // Wyświetlamy szczegóły błędu z serwera w konsoli przeglądarki
      console.error("Błąd szczegółowy:", err.response?.data || err.message);
      alert("Błąd serwera: " + (err.response?.data?.details?.message || "Internal Server Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h3>Skanuj paragon</h3>
      <input 
        type="file" 
        onChange={uploadReceipt} 
        disabled={loading} 
        accept="image/*"
      />
      
      {loading && <p>Analizowanie paragonu... to może potrwać do 15 sekund.</p>}

      {data && (
        <div style={{ marginTop: '20px', background: '#f0f0f0', padding: '15px' }}>
          <h4>Wyniki:</h4>
          <p><strong>Sklep:</strong> {data.result?.establishment || 'Nie wykryto'}</p>
          <p><strong>Suma:</strong> {data.result?.total || '0.00'}</p>
          <p><strong>Data:</strong> {data.result?.date || 'Brak'}</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptScanner;