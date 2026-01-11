import React, { useState } from 'react';
import axios from 'axios';

const ReceiptScanner = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
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

      return data; // Zwraca obiekt { message, dodano, nowe_saldo }
  };
const uploadReceipt = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    setLoading(true);
    setData(null);

    try {
      const response = await axios.post('http://localhost:3000/process-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Zapisujemy odpowiedź do zmiennej lokalnej, żeby mieć do niej dostęp natychmiast
      const responseData = response.data;

      // Aktualizujemy stan (żeby wyświetlić w UI)
      setData(responseData);
      console.log("Dane z serwera:", responseData);

      try {
          // POPRAWKA: Używamy responseData zamiast data
          // Dodatkowo: lepiej użyć parseFloat i Math.round, chyba że chcesz ucinać końcówki
          const totalValue = responseData.result?.total ? parseInt(responseData.result.total) : 0;
          
          if (totalValue > 0) {
             const result = await addPointsToSelf(totalValue);
             console.log("Gitara, nowe saldo:", result.nowe_saldo);
             alert(`Sukces! Dodano ${totalValue} punktów!`);
          } else {
             console.log("Nie znaleziono kwoty na paragonie lub wynosi 0");
          }

      } catch (error) {
          console.error(error.message);
          alert("Błąd dodawania punktów: " + error.message);
      }
    } catch (err) {
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