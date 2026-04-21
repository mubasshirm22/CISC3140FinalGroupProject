import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/HomePage.css';

function HomePage() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8080/products')
      .then(res => res.json())
      .then(data => setGames(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  return (
    <div className="home-container">
      <div className="hero-section">
        <h2 className="hero-title">Featured & Recommended</h2>
      </div>

      <div className="main-content">
        <aside className="sidebar">
          <h4>GIFT CARDS</h4>
          <ul className="sidebar-list">
            <li style={{ color: '#fff', fontWeight: 'bold' }}>New Releases</li>
            <li>Specials</li>
            <li>Free Games</li>
            <li>By Genre</li>
          </ul>
        </aside>

        <section className="game-grid">
          {games.length === 0 ? (
            <p style={{ color: '#66c0f4' }}>Syncing with Database...</p>
          ) : (
            games.map(game => (
              <Link to={`/game/${game.product_id}`} key={game.product_id} className="game-card">
                <img src={game.image_url} alt={game.name} style={{ width: '100%' }} />
                <div style={{ padding: '15px' }}>
                  <div style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '8px' }}>{game.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="discount-tag">-20%</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fff', fontSize: '1rem' }}>${game.price}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default HomePage;