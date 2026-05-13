import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { addToGuestCart } from './CartPage';
import { fetchCatalog, fetchSpotlight, getGameThumbnailSrc } from '../services/storefrontService';
import { getGameGradient } from '../services/themeUtils';
import '../style/HomePage.css';

function VaporScoreBar({ score }) {

  const color =
    score >= 75
      ? '#4caf50'
      : score >= 50
      ? '#ffc107'
      : '#f44336';

  const label =
    score >= 75
      ? 'Very Positive'
      : score >= 50
      ? 'Mixed'
      : 'Negative';

  return (
    <div className="vapor-score-wrap">

      <div className="vapor-score-bar-bg">

        <div
          className="vapor-score-bar-fill"
          style={{
            width: `${score}%`,
            background: color
          }}
        />

      </div>

      <span
        className="vapor-score-label"
        style={{ color }}
      >
        {score}% — {label}
      </span>

    </div>
  );
}



function HomePage() {
  const [games, setGames] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [addedId, setAddedId] = useState(null);
  const [spotlightGames, setSpotlightGames] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const isBlockedPlaceholderUrl = (value) => {
    const url = String(value || '').toLowerCase();
    return url.includes('via.placeholder.com') || url.includes('placeholder.com/');
  };

  const getHeroImageSrc = (game) => {
    const appid = game?.steam?.steam_appid || game?.steam_appid;

    const candidates = [
      game?.steam?.capsules?.capsule_lg,
      game?.steam?.header_image,
      game?.header_image,
      (appid ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg` : ''),
      (Array.isArray(game?.screenshots) ? game.screenshots[0] : ''),
      getGameThumbnailSrc(game)
    ];

    return candidates.find((value) => value && !isBlockedPlaceholderUrl(value)) || '';
  };

  const getThumbSrc = (game) =>
    getGameThumbnailSrc(game);


  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const keyword = q || '';
    setSearchTerm(keyword);
    setActiveCategory('All');
    setLoadingCatalog(true);

    fetchCatalog(keyword)
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        setGames(safeData);
        setFiltered(safeData);
      })
      .catch(() => {
        setGames([]);
        setFiltered([]);
      })
      .finally(() => setLoadingCatalog(false));
  }, [location.search]);

  useEffect(() => {
    fetchSpotlight().then((data) => {
      setSpotlightGames(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    if (Array.isArray(games) && games.length > 0) {
      const uniqueTags = new Set();
      games.forEach((game) => {
        if (game.genre) uniqueTags.add(game.genre);
        if (Array.isArray(game.tags)) {
          game.tags.forEach((tag) => uniqueTags.add(tag));
        }
      });
      setCategories(['All', ...Array.from(uniqueTags).sort()]);
    }
  }, [games]);

  useEffect(() => {
    if (activeCategory === 'All') {
      setFiltered(games);
    } else if (activeCategory === 'DLC') {
      setFiltered(
        Array.isArray(games)
          ? games.filter(
              g => g.is_dlc || g.genre === 'DLC'
            )
          : []
      );
    } else {
      setFiltered(
        Array.isArray(games)
          ? games.filter(
              g => g.genre === activeCategory || (Array.isArray(g.tags) && g.tags.includes(activeCategory))
            )
          : []
      );
    }
  }, [activeCategory, games]);

  const handleAddToCart = async (e, game) => {

    e.preventDefault();

    let added = false;

    if (token) {
      const response = await fetch(
        'http://localhost:8080/cart/add',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            product_id: game.product_id
          })
        }
      );

      if (response.ok) {
        added = true;
      } else {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          addToGuestCart(game);
          added = true;
        }
      }

    } else {

      addToGuestCart(game);
      added = true;
    }

    if (!added) {
      return;
    }

    setAddedId(game.product_id);

    window.dispatchEvent(
      new Event('cartUpdated')
    );

    setTimeout(
      () => setAddedId(null),
      1500
    );
  };

  const activeHeroList = spotlightGames;

  useEffect(() => {
    if (activeHeroList.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex(prev => (prev + 1) % activeHeroList.length);
      }, 5500);
      return () => clearInterval(interval);
    }
  }, [activeHeroList]);

  useEffect(() => {
    if (currentHeroIndex >= activeHeroList.length) {
      setCurrentHeroIndex(0);
    }
  }, [activeHeroList.length, currentHeroIndex]);

  const currentFeatured = activeHeroList[currentHeroIndex];

  return (
    <div className="home-container">
      {currentFeatured && (
        <div className="hero-shell">
          <div
            className="hero-section"
            style={{
              background: `${getGameGradient(currentFeatured.title || currentFeatured.name)}, #1b2838`
            }}
          >
            <button
              className="hero-nav-btn prev"
              onClick={() => setCurrentHeroIndex(prev => prev === 0 ? activeHeroList.length - 1 : prev - 1)}
              aria-label="Previous spotlight game"
            >
              ❮
            </button>

            <div className="hero-inner">
              {currentFeatured.product_id ? (
                <Link to={`/game/${currentFeatured.product_id}`} className="hero-full-link">
                  <div className="hero-media-wrap">
                    {getHeroImageSrc(currentFeatured) && (
                      <img
                        className="hero-cover"
                        src={getHeroImageSrc(currentFeatured)}
                        alt={currentFeatured.title || currentFeatured.name}
                      />
                    )}
                  </div>

                  <div className="hero-overlay">
                    <h2 className="hero-game-title">
                      {currentFeatured.title || currentFeatured.name}
                    </h2>

                    {(currentFeatured.short_description || currentFeatured.description) && (
                      <p className="hero-game-desc">
                        {currentFeatured.short_description || currentFeatured.description}
                      </p >
                    )}

                    <div className="hero-meta">
                      {(currentFeatured.tags?.[0] || currentFeatured.genre) && (
                        <span className="hero-genre-tag">
                          {currentFeatured.tags?.[0] || currentFeatured.genre}
                        </span>
                      )}
                      {currentFeatured.price && <span className="hero-price">${currentFeatured.price}</span>}
                    </div>

                    <div className="hero-btn">View Game</div>

                    {/* mini image rail removed as requested */}
                  </div>
                </Link>
              ) : (
                <>
                  <div className="hero-media-wrap">
                    {getHeroImageSrc(currentFeatured) && (
                      <img
                        className="hero-cover"
                        src={getHeroImageSrc(currentFeatured)}
                        alt={currentFeatured.title || currentFeatured.name}
                      />
                    )}
                  </div>

                  <div className="hero-overlay">
                    <h2 className="hero-game-title">
                      {currentFeatured.title || currentFeatured.name}
                    </h2>

                    {(currentFeatured.short_description || currentFeatured.description) && (
                      <p className="hero-game-desc">
                        {currentFeatured.short_description || currentFeatured.description}
                      </p >
                    )}

                    <div className="hero-meta">
                      {(currentFeatured.tags?.[0] || currentFeatured.genre) && (
                        <span className="hero-genre-tag">
                          {currentFeatured.tags?.[0] || currentFeatured.genre}
                        </span>
                      )}
                      {currentFeatured.price && <span className="hero-price">${currentFeatured.price}</span>}
                    </div>

                    {/* mini image rail removed as requested */}
                  </div>
                </>
              )}
            </div>

            <button
              className="hero-nav-btn next"
              onClick={() => setCurrentHeroIndex(prev => (prev + 1) % activeHeroList.length)}
              aria-label="Next spotlight game"
            >
              ❯
            </button>
            {activeHeroList.length > 1 && (
              <div className="hero-indicators">
                {activeHeroList.map((_, index) => (
                  <button
                    key={index}
                    className={`hero-indicator ${index === currentHeroIndex ? 'active' : ''}`}
                    onClick={() => setCurrentHeroIndex(index)}
                    aria-label={`Jump to spotlight game ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="main-content">
        <aside className="sidebar">

          <h4>CATEGORIES</h4>

          <ul className="sidebar-list">

            {categories.map(cat => (

              <li
                key={cat}
                className={
                  activeCategory === cat
                    ? 'sidebar-item active'
                    : 'sidebar-item'
                }

                onClick={() =>
                  setActiveCategory(cat)
                }
              >
                {cat}
              </li>

            ))}

          </ul>

        </aside>

        <section className="game-grid">

          {searchTerm && (
            <p className="search-label">
              Results for "{searchTerm}"
            </p >
          )}

          {loadingCatalog ? (
            <p className="empty-msg">Syncing catalog with Steam data...</p >
          ) : !Array.isArray(filtered) || filtered.length === 0 ? (
            searchTerm ? (
              <p className="empty-msg">
                No games found for "{searchTerm}".
              </p >
            ) : (
              <p className="empty-msg">
                No products available.
              </p >
            )
          ) : (
            <div className="game-grid-list">
              {filtered.map(game => (
                <Link
                  to={`/game/${game.product_id}`}
                  key={game.product_id}
                  className="game-card"
                >


                  <div className="game-card-img-wrap">
                    {getThumbSrc(game) ? (
                      <img
                        src={getThumbSrc(game)}
                        alt={game.name}
                        className="game-card-img"
                      />
                    ) : (
                      <div
                        className="game-card-img-placeholder"
                        style={{
                          background: getGameGradient(game.name)
                        }}
                      >
                        <span className="placeholder-title">
                          {game.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="game-card-body">
                    <span className="game-card-kind">Base Game</span>

                    <div className="game-card-header">

                      <span className="game-card-name">
                        {game.name}
                      </span>

                      {(game.tags?.[0] || game.genre) && (
                        <span className="genre-tag">
                          {game.tags?.[0] || game.genre}
                        </span>
                      )}

                    </div>

                    {game.vapor_score != null && <VaporScoreBar score={game.vapor_score} />}

                    <div className="game-card-footer">

                      <div className="price-group">

                        {game.vapor_score < 60 && (
                          <span className="discount-tag">
                            -20%
                          </span>
                        )}

                        <span className="game-price">
                          ${Number(game.price).toFixed(2)}
                        </span>

                      </div>

                      <button
                        className={`add-cart-btn ${
                          addedId === game.product_id
                            ? 'added'
                            : ''
                        }`}

                        onClick={(e) =>
                          handleAddToCart(e, game)
                        }
                      >
                        {addedId === game.product_id
                          ? '✓ Added'
                          : '+ Cart'}
                      </button>

                    </div>

                  </div>

                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default HomePage;