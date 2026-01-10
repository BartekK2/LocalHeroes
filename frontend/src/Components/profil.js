import React, { useState, useEffect } from 'react';
import './profil.css'; // Importuje styl z pliku o nazwie profil.css

const API_URL = "http://localhost:5000";

const Profil = ({ businessId, onClose,visible }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!businessId) return;

    // Reset stanów przy zmianie ID
    setLoading(true);
    setError(null);
    setData(null);

    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/public/business/${businessId}`);
        
        if (!response.ok) {
          throw new Error('Nie udało się pobrać danych firmy');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  // Jeśli brak ID, nie wyświetlamy nic
  if (!businessId) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: visible ? 'flex' : 'none' }}>
      <div className="business-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        {/* --- STAN ŁADOWANIA --- */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Ładowanie profilu...</p>
          </div>
        )}

        {/* --- STAN BŁĘDU --- */}
        {error && (
          <div className="error-state">
            <p>❌ Wystąpił błąd: {error}</p>
          </div>
        )}

        {/* --- TREŚĆ PROFILU --- */}
        {data && !loading && (
          <>
            {/* NAGŁÓWEK */}
            <div className="card-header">
              <span className="category-badge">
                {data.business.kategoria_biznesu || 'Firma'}
              </span>
              <h2>{data.business.nazwa_firmy}</h2>
              <div className="rating-box">
                <span className="star">★</span>
                <span>{data.business.srednia_ocena?.toFixed(1) || '0.0'}</span>
                <span className="reviews-count">({data.business.liczba_opinii} opinii)</span>
              </div>
            </div>

            {/* DANE KONTAKTOWE */}
            <div className="card-body">
              <p className="info-row">
                📍 {data.business.ulica || ''} {data.business.numer_budynku || ''}, {data.business.miasto || ''}
              </p>
              
              {data.business.numer_kontaktowy_biznes && (
                <p className="info-row">📞 {data.business.numer_kontaktowy_biznes}</p>
              )}
              
              {data.business.link_do_strony_www && (
                <p className="info-row">
                  🌐 <a href={data.business.link_do_strony_www.startsWith('http') ? data.business.link_do_strony_www : `https://${data.business.link_do_strony_www}`} target="_blank" rel="noopener noreferrer">
                    Strona internetowa
                  </a>
                </p>
              )}
            </div>

            {/* SEKCJA NAGRÓD */}
            <div className="rewards-section">
              <h3>🎁 Dostępne nagrody i promocje</h3>
              
              <div className="rewards-list">
                {data.rewards.length === 0 ? (
                  <p className="empty-rewards">Brak aktywnych promocji w tym momencie.</p>
                ) : (
                  data.rewards.map((reward) => (
                    <div key={reward.id} className="reward-item">
                      <div className="reward-info">
                        <h4>
                           {reward.typ && reward.typ.includes('rabat') ? '✂️' : '🎁'} {reward.nazwa}
                        </h4>
                        {reward.opis && <p>{reward.opis}</p>}
                      </div>
                      <div className="reward-cost">
                        {reward.koszt_punktowy} pkt
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* STOPKA */}
            <div className="card-footer">
              <button className="action-btn">Zobacz pełny profil</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profil;