import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { addToGuestCart } from './CartPage';
import '../style/GameDetail.css';

function VaporScoreBar({ score }) {
  const color = score >= 75 ? '#4caf50' : score >= 50 ? '#ffc107' : '#f44336';
  const label = score >= 75 ? 'Very Positive' : score >= 50 ? 'Mixed' : 'Negative';
  return (
    <div className="detail-score-wrap">
      <div className="detail-score-bar-bg">
        <div className="detail-score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="detail-score-text" style={{ color }}>{score}% — {label}</span>
    </div>
  );
}

// PC compatibility checker — compares user input against min_specs from DB
function CompatChecker({ minSpecs }) {
  const [ram, setRam] = useState('');
  const [vram, setVram] = useState('');
  const [cpu, setCpu] = useState('');
  const [result, setResult] = useState(null);

  if (!minSpecs) return null;

  const check = () => {
    const r = Number(ram), v = Number(vram), c = Number(cpu);
    if (!r || !v || !c) { setResult({ status: 'error', msg: 'Fill in all fields.' }); return; }
    const meetsAll = r >= minSpecs.ram_gb && v >= minSpecs.gpu_vram_gb && c >= minSpecs.cpu_ghz;
    const meetsTwo = [r >= minSpecs.ram_gb, v >= minSpecs.gpu_vram_gb, c >= minSpecs.cpu_ghz].filter(Boolean).length >= 2;
    if (meetsAll) {
      setResult({ status: 'ok', msg: 'Your PC meets the minimum requirements.' });
    } else if (meetsTwo) {
      setResult({ status: 'warn', msg: `Might struggle — needs ${minSpecs.ram_gb}GB RAM, ${minSpecs.gpu_vram_gb}GB VRAM, ${minSpecs.cpu_ghz}GHz CPU.` });
    } else {
      setResult({ status: 'bad', msg: `Not compatible — needs ${minSpecs.ram_gb}GB RAM, ${minSpecs.gpu_vram_gb}GB VRAM, ${minSpecs.cpu_ghz}GHz CPU.` });
    }
  };

  return (
    <div className="compat-checker">
      <div className="table-section-title">Check PC Compatibility</div>
      <div className="compat-form">
        <div className="compat-field">
          <label>RAM (GB)</label>
          <select value={ram} onChange={e => setRam(e.target.value)}>
            <option value="">Select</option>
            {[4,8,16,32].map(v => <option key={v} value={v}>{v} GB</option>)}
          </select>
        </div>
        <div className="compat-field">
          <label>GPU VRAM (GB)</label>
          <select value={vram} onChange={e => setVram(e.target.value)}>
            <option value="">Select</option>
            {[2,4,6,8,12,16].map(v => <option key={v} value={v}>{v} GB</option>)}
          </select>
        </div>
        <div className="compat-field">
          <label>CPU Speed (GHz)</label>
          <select value={cpu} onChange={e => setCpu(e.target.value)}>
            <option value="">Select</option>
            {[1.5,2.0,2.5,3.0,3.5,4.0].map(v => <option key={v} value={v}>{v} GHz</option>)}
          </select>
        </div>
        <button className="compat-btn" onClick={check}>Check</button>
      </div>
      {result && (
        <div className={`compat-result compat-${result.status}`}>{result.msg}</div>
      )}
    </div>
  );
}

function GameDetail() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('https://backend-tender-woodland-6101.fly.dev/products')
      .then(r => r.json())
      .then(data => {
        setGame(data.find(p => p.product_id === id) || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (!loading && game) {
    const owned = JSON.parse(localStorage.getItem("owned") || "[]");
    var isOwned = owned.includes(game.product_id);
  }

  const handleAddToCart = async () => {
    if (token) {
      const res = await fetch('https://backend-tender-woodland-6101.fly.dev/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: game.product_id })
      });
      const data = await res.json();
      setCartMsg(data.error || 'Added to cart!');
    } else {
      addToGuestCart(game);
      setCartMsg('Added to cart! Sign in to checkout.');
    }
    window.dispatchEvent(new Event('cartUpdated'));
    setTimeout(() => setCartMsg(''), 2500);
  };

  if (loading) return <div className="steamdb-detail-container"><p style={{ padding: '40px 20px', color: '#66c0f4' }}>Loading...</p></div>;
  if (!game)   return <div className="steamdb-detail-container"><p style={{ padding: '40px 20px', color: '#ff6b6b' }}>Game not found.</p></div>;

  return (
    <div className="steamdb-detail-container">
      {/* header */}
      <div className="db-header">
        <div className="db-header-content">
          <div className="db-app-icon-wrap" style={{ background: getGameGradient(game.name) }}>
            {game.image_url && <img src={game.image_url} alt={game.name} className="db-app-icon" />}
          </div>
          <div className="db-title-area">
            <h1 className="db-app-name">{game.name}</h1>
            {game.genre && <span className="db-genre-badge">{game.genre}</span>}
            {game.vapor_score != null && <VaporScoreBar score={game.vapor_score} />}
          </div>
          <div className="db-price-badge">
            <div className="price-label">Store Price</div>
            <div className="price-value">${Number(game.price).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="db-main-grid">
        {/* left: info + description + compat */}
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
            <div className="db-cell label">Platform</div>
            <div className="db-cell value">Windows, macOS, Linux</div>
          </div>
          <div className="db-row">
            <div className="db-cell label">Type</div>
            <div className="db-cell value">{game.is_dlc ? 'Downloadable Content' : 'Full Game'}</div>
          </div>

          <div className="table-section-title" style={{ marginTop: '28px' }}>Description</div>
          <div className="db-description-box">
            {game.description || 'No description available.'}
          </div>

          {/* PC compatibility — unique feature */}
          <div style={{ marginTop: '28px' }}>
            <CompatChecker minSpecs={game.min_specs} />
          </div>
        </div>

        {/* right: action sidebar */}
        <div className="db-sidebar">
          <div className="db-action-card">
            <div className="action-price">${Number(game.price).toFixed(2)}</div>

            {isOwned ? (
              <button className="db-btn-cart owned" disabled>
                Owned
              </button>
            ) : (
              <button className="db-btn-cart" onClick={handleAddToCart}>
                Add to Cart
              </button>
            )}

            {!token && (
              <p className="action-guest-note">
                <Link to="/login">Sign in</Link> to checkout
              </p>
            )}

            {cartMsg && <div className="cart-feedback">{cartMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default GameDetail;
