import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { addToGuestCart } from './CartPage';
import '../style/HomePage.css';

// per-game gradient by name keyword
function getGameGradient(name = '') {
  const n = name.toLowerCase();
  if (n.includes('dungeon'))   return 'linear-gradient(135deg, #1a0533, #3d1a6e)';
  if (n.includes('space'))     return 'linear-gradient(135deg, #0a1628, #1a3a6e)';
  if (n.includes('twilight'))  return 'linear-gradient(135deg, #1a0808, #4a1515)';
  if (n.includes('subway'))    return 'linear-gradient(135deg, #0a1820, #1a3040)';
  if (n.includes('cheeze') || n.includes('chopped')) return 'linear-gradient(135deg, #1a1500, #3d3200)';
  if (n.includes('soundtrack')) return 'linear-gradient(135deg, #0a1a1a, #1a3a3a)';
  return 'linear-gradient(135deg, #16202d, #1b2838)';
}

function VaporScoreBar({ score }) {
  const color = score >= 75 ? '#4caf50' : score >= 50 ? '#ffc107' : '#f44336';
  const label = score >= 75 ? 'Very Positive' : score >= 50 ? 'Mixed' : 'Negative';
  return (
    <div className="vapor-score-wrap">
      <div className="vapor-score-bar-bg">
        <div className="vapor-score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="vapor-score-label" style={{ color }}>{score}% — {label}</span>
    </div>
  );
}

const CATEGORIES = ['All', 'Action', 'Adventure', 'Roguelike', 'Open World', 'DLC'];

function HomePage() {
  const [games, setGames] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [addedId, setAddedId] = useState(null); // brief "Added!" feedback
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');

    if (q) {
      setSearchTerm(q);
      setActiveCategory('All');
      fetch(`http://localhost:8080/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(data => { setGames(data); setFiltered(data); })
        .catch(err => console.error('Search error:', err));
    } else {
      setSearchTerm('');
      fetch('http://localhost:8080/products')
        .then(r => r.json())
        .then(data => { setGames(data); setFiltered(data); })
        .catch(err => console.error('Fetch error:', err));
    }
  }, [location.search]);

  // apply sidebar filter
  useEffect(() => {
    if (activeCategory === 'All') {
      setFiltered(games);
    } else if (activeCategory === 'DLC') {
      setFiltered(games.filter(g => g.is_dlc || g.genre === 'DLC'));
    } else {
      setFiltered(games.filter(g => g.genre === activeCategory));
    }
  }, [activeCategory, games]);

  const handleAddToCart = async (e, game) => {
    e.preventDefault(); // don't navigate to game detail
    if (token) {
      await fetch('http://localhost:8080/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: game.product_id })
      });
    } else {
      addToGuestCart(game);
    }
    setAddedId(game.product_id);
    window.dispatchEvent(new Event('cartUpdated'));
    setTimeout(() => setAddedId(null), 1500);
  };

  // featured = highest vapor_score game
  const featured = [...games].sort((a, b) => (b.vapor_score || 0) - (a.vapor_score || 0))[0];

  return (
    <div className="home-container">

      {/* hero — shows the top-rated game */}
      {featured && (
        <div className="hero-section" style={{ background: `${getGameGradient(featured.name).replace('linear-gradient', 'linear-gradient')}, #1b2838` }}>
          <div className="hero-inner" style={{ background: getGameGradient(featured.name) }}>
            <div className="hero-overlay">
              <div className="hero-badge">Featured &amp; Recommended</div>
              <h2 className="hero-game-title">{featured.name}</h2>
              <p className="hero-game-desc">{featured.description}</p>
              <div className="hero-meta">
                {featured.genre && <span className="hero-genre-tag">{featured.genre}</span>}
                {featured.vapor_score && <span className="hero-score">⬆ {featured.vapor_score}% Positive</span>}
                <Link to={`/game/${featured.product_id}`} className="hero-btn">View Game</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {/* sidebar */}
        <aside className="sidebar">
          <h4>CATEGORIES</h4>
          <ul className="sidebar-list">
            {CATEGORIES.map(cat => (
              <li
                key={cat}
                className={activeCategory === cat ? 'sidebar-item active' : 'sidebar-item'}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
        </aside>

        {/* game grid */}
        <section className="game-grid">
          {searchTerm && (
            <p className="search-label">Results for "{searchTerm}"</p>
          )}
          {filtered.length === 0 ? (
            searchTerm
              ? <p className="empty-msg">No games found for "{searchTerm}".</p>
              : <p className="empty-msg">Syncing with database...</p>
          ) : (
            filtered.map(game => (
              <Link to={`/game/${game.product_id}`} key={game.product_id} className="game-card">
                {/* gradient image placeholder; replaced by real image_url if available */}
                {game.image_url ? (
                  <img src={game.image_url} alt={game.name} className="game-card-img" />
                ) : (
                  <div className="game-card-img-placeholder" style={{ background: getGameGradient(game.name) }}>
                    <span className="placeholder-title">{game.name}</span>
                  </div>
                )}

                <div className="game-card-body">
                  <div className="game-card-header">
                    <span className="game-card-name">{game.name}</span>
                    {game.genre && <span className="genre-tag">{game.genre}</span>}
                  </div>

                  {game.vapor_score != null && <VaporScoreBar score={game.vapor_score} />}

                  <div className="game-card-footer">
                    <div className="price-group">
                      {game.vapor_score < 60 && <span className="discount-tag">-20%</span>}
                      <span className="game-price">${Number(game.price).toFixed(2)}</span>
                    </div>
                    <button
                      className={`add-cart-btn ${addedId === game.product_id ? 'added' : ''}`}
                      onClick={(e) => handleAddToCart(e, game)}
                    >
                      {addedId === game.product_id ? '✓ Added' : '+ Cart'}
                    </button>
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
