import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/GameDetail.css';

function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchGame = async () => {
      try {
        const response = await fetch(`http://localhost:8080/products`);
        if (response.ok) {
          const allProducts = await response.json();
          const found = allProducts.find(p => p.product_id === id);
          setGame(found);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [id, navigate]);

  if (loading) return <div className="steamdb-detail-container">Loading Database Records...</div>;
  if (!game) return <div className="steamdb-detail-container">Error: Product Not Found.</div>;

  return (
    <div className="steamdb-detail-container">
      <div className="db-header">
        <div className="db-header-content">
          <img src={game.image_url} alt="icon" className="db-app-icon" />
          <div className="db-title-area">
            <h1 className="db-app-name">{game.name}</h1>
            <div className="db-app-id">Application ID: {id.substring(0, 8)}...</div>
          </div>
          <div className="db-price-badge">
            <div className="price-label">Store Price</div>
            <div className="price-value">${game.price}</div>
          </div>
        </div>
      </div>

      <div className="db-main-grid">
        <div className="db-info-table">
          <div className="table-section-title">Technical Information</div>
          <div className="db-row">
            <div className="db-cell label">Developer</div>
            <div className="db-cell value">Vapor Interactive</div>
          </div>
          <div className="db-row">
            <div className="db-cell label">Genre</div>
            <div className="db-cell value">{game.genre || 'Action'}</div>
          </div>
          <div className="db-row">
            <div className="db-cell label">Client Profile</div>
            <div className="db-cell value">Windows, macOS, Linux</div>
          </div>

          <div className="table-section-title" style={{ marginTop: '30px' }}>Description</div>
          <div className="db-description-box">
            {game.description || "No database records available for this entry."}
          </div>
        </div>
        <div className="db-sidebar">
        </div>
      </div>
    </div>
  );
}

export default GameDetail;