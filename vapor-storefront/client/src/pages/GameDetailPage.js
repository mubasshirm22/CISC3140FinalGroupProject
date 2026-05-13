import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { addToGuestCart } from './CartPage';
import { fetchGameById, getGameThumbnailSrc } from '../services/storefrontService';
import { getGameGradient } from '../services/themeUtils';
import '../style/GameDetail.css';

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
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const token = localStorage.getItem('token');

  const screenshots = game && Array.isArray(game.screenshots) && game.screenshots.length > 0
    ? game.screenshots
    : game
      ? getScreenshots(game)
      : [];

  const nextScreenshot = useCallback(() => {
    if (screenshots.length <= 1) {
      return;
    }
    setCurrentShotIndex((prev) => (prev + 1) % screenshots.length);
  }, [screenshots.length]);

  const prevScreenshot = useCallback(() => {
    if (screenshots.length <= 1) {
      return;
    }
    setCurrentShotIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  }, [screenshots.length]);

  useEffect(() => {
    fetchGameById(id)
      .then(data => {
        setGame(data || null);
        setCurrentShotIndex(0);
        setZoomOpen(false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!screenshots.length) {
      return;
    }

    const handleKeydown = (event) => {
      const targetTag = String(event.target?.tagName || '').toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextScreenshot();
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prevScreenshot();
      }

      if (event.key === 'Escape' && zoomOpen) {
        setZoomOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [nextScreenshot, prevScreenshot, screenshots.length, zoomOpen]);

  const handleAddToCart = async () => {
    if (token) {
      const res = await fetch('http://localhost:8080/cart/add', {
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

  if (loading) return <div className="steamdb-detail-container"><p style={{ padding: '40px 20px', color: '#66c0f4' }}>Loading...</p ></div>;
  if (!game)   return <div className="steamdb-detail-container"><p style={{ padding: '40px 20px', color: '#ff6b6b' }}>Game not found.</p ></div>;

  const steamPlatforms = Array.isArray(game.steam?.platforms) && game.steam.platforms.length > 0
    ? game.steam.platforms.join(', ')
    : 'Windows';

  const steamDevelopers = Array.isArray(game.steam?.developers) && game.steam.developers.length > 0
    ? game.steam.developers.join(', ')
    : 'Unknown';

  const steamPublishers = Array.isArray(game.steam?.publishers) && game.steam.publishers.length > 0
    ? game.steam.publishers.join(', ')
    : 'Unknown';

  const steamRating = game.steam?.content_rating || 'Not rated';
  const steamReleaseDate = game.steam?.release_date || 'TBA';
  const technicalType = game.is_dlc
    ? 'Downloadable Content'
    : (Array.isArray(game.steam?.categories) && game.steam.categories.includes('Game') ? 'Full Game' : 'Game');

  const gameTitle = game.title || game.name;
  const gamePrice = Number(game.price || 0).toFixed(2);

  return (
    <div className="steamdb-detail-container">
      <header className="epic-detail-header">
        <h1 className="epic-detail-title">{gameTitle}</h1>
        <div className="epic-detail-tabs" role="tablist" aria-label="Game detail sections">
          <button type="button" className="epic-tab active" role="tab" aria-selected="true">Overview</button>
        </div>
      </header>

      <div className="epic-detail-main-grid">
        <section className="epic-media-column">
          <div className="epic-media-frame">
            <button
              type="button"
              className="db-gallery-nav prev"
              onClick={prevScreenshot}
              aria-label="Previous screenshot"
            >
              ❮
            </button>

            <button
              type="button"
              className="db-gallery-current"
              onClick={() => setZoomOpen(true)}
              aria-label="Open screenshot preview"
            >
              <img
                src={screenshots[currentShotIndex]}
                alt={`Screenshot ${currentShotIndex + 1}`}
                className="db-screenshot-current"
              />
            </button>

            <button
              type="button"
              className="db-gallery-nav next"
              onClick={nextScreenshot}
              aria-label="Next screenshot"
            >
              ❯
            </button>
          </div>

          <div className="epic-screenshot-strip">
            {screenshots.map((src, index) => (
              <button
                type="button"
                key={`${src}-${index}`}
                className={`db-screenshot-thumb ${index === currentShotIndex ? 'active' : ''}`}
                onClick={() => setCurrentShotIndex(index)}
                aria-label={`Show screenshot ${index + 1}`}
              >
                < img src={src} alt={`Screenshot ${index + 1}`} className="db-screenshot" />
              </button>
            ))}
          </div>
        </section>

        <aside className="epic-buy-column">
          <div className="epic-cover-wrap" style={{ background: getGameGradient(gameTitle) }}>
            {getGameThumbnailSrc(game) && (
              <img
                src={getGameThumbnailSrc(game)}
                alt={gameTitle}
                className="db-app-icon"
              />
            )}
          </div>

          <span className="epic-base-tag">Base Game</span>
          <div className="price-value">${gamePrice}</div>

          <button className="epic-primary-btn" onClick={handleAddToCart}>Buy Now</button>

          {!token && (
            <p className="action-guest-note">
              <Link to="/login">Sign in</Link> to checkout
            </p >
          )}

          {cartMsg && <div className="cart-feedback">{cartMsg}</div>}

          <div className="epic-meta-list">
            <div className="epic-meta-row"><span>Developer</span><strong>{steamDevelopers}</strong></div>
            <div className="epic-meta-row"><span>Publisher</span><strong>{steamPublishers}</strong></div>
            <div className="epic-meta-row"><span>Release Date</span><strong>{steamReleaseDate}</strong></div>
            <div className="epic-meta-row"><span>Platform</span><strong>{steamPlatforms}</strong></div>
          </div>
        </aside>
      </div>

      <div className="db-main-grid">
        <section className="epic-info-card">
          <div className="table-section-title">About This Game</div>
          <div className="db-description-box">
            {game.description || 'No description available.'}
          </div>
        </section>

        <section className="epic-info-card">
          <div className="table-section-title">Technical Information</div>
          <div className="db-row">
            <div className="db-cell label">Genre</div>
            <div className="db-cell value">{game.genre || game.tags?.[0] || 'Unknown'}</div>
          </div>
          <div className="db-row">
            <div className="db-cell label">Type</div>
            <div className="db-cell value">{technicalType}</div>
          </div>
          <div className="db-row">
            <div className="db-cell label">Rating</div>
            <div className="db-cell value">{steamRating}</div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <CompatChecker minSpecs={game.min_specs} />
          </div>
        </section>
      </div>

      {zoomOpen && screenshots[currentShotIndex] && (
        <div className="db-lightbox" onClick={() => setZoomOpen(false)} role="presentation">
          <div className="db-lightbox-inner" onClick={(event) => event.stopPropagation()} role="presentation">
            <button
              type="button"
              className="db-lightbox-close"
              onClick={() => setZoomOpen(false)}
              aria-label="Close screenshot viewer"
            >
              ×
            </button>
            <button
              type="button"
              className="db-lightbox-nav prev"
              onClick={prevScreenshot}
              aria-label="Previous screenshot"
            >
              ❮
            </button>
            <img
              src={screenshots[currentShotIndex]}
              alt={`Zoomed screenshot ${currentShotIndex + 1}`}
              className="db-lightbox-image"
            />
            <button
              type="button"
              className="db-lightbox-nav next"
              onClick={nextScreenshot}
              aria-label="Next screenshot"
            >
              ❯
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getScreenshots(game) {
  if (game.image_url) {
    return [game.image_url, game.image_url, game.image_url];
  }

  const baseUrl = 'https://via.placeholder.com/600x400/';
  const colors = {
    'Dungeon Crawler': '1a0533/ffffff?text=Dungeon+Screenshot',
    'Space Adventure': '0a1628/ffffff?text=Space+Screenshot',
    'The Legend of Greg: Twilight Handball': '1a0808/ffffff?text=Twilight+Screenshot',
    'The Legend of Greg: Breath of the Subway': '0a1820/ffffff?text=Subway+Screenshot',
    'The Legend of Greg: Chopped Cheeze of Time': '1a1500/ffffff?text=Cheeze+Screenshot',
    'Soundtrack Collection': '0a1a1a/ffffff?text=Soundtrack+Screenshot'
  };
  const color = colors[game.name] || '16202d/ffffff?text=Game+Screenshot';
  return [
    `${baseUrl}${color}+1`,
    `${baseUrl}${color}+2`,
    `${baseUrl}${color}+3`
  ];
}

export default GameDetail;