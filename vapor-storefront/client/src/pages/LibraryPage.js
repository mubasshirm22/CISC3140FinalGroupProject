import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLibrary, getGameThumbnailSrc } from '../services/storefrontService';
import { getGameGradient } from '../services/themeUtils';
import '../style/LibraryPage.css';

function LibraryPage() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const getThumbSrc = (game) =>
    getGameThumbnailSrc(game);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchLibrary(token)
      .then(data => {
        setLibrary(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <div className="library-container">
        <p style={{ textAlign: 'center', padding: '40px', color: '#66c0f4' }}>
          Please <Link to="/login" style={{ color: '#66c0f4' }}>sign in</Link> to view your library.
        </p >
      </div>
    );
  }

  if (loading) {
    return (
      <div className="library-container">
        <p style={{ textAlign: 'center', padding: '40px', color: '#66c0f4' }}>Loading library...</p >
      </div>
    );
  }

  return (
    <div className="library-container">
      <h1 className="library-title">My Library</h1>

      {library.length === 0 ? (
        <p className="library-empty">Your library is empty. <Link to="/" style={{ color: '#66c0f4' }}>Browse games</Link></p >
      ) : (
        <div className="library-grid">
          {library.map(game => (
            <div key={game.product_id} className="library-item">
              {getThumbSrc(game) ? (
                <img src={getThumbSrc(game)} alt={game.name} className="library-img" />
              ) : (
                <div className="library-img-placeholder" style={{ background: getGameGradient(game.name) }}>
                  <span>{game.name}</span>
                </div>
              )}
              <div className="library-info">
                <h3>{game.name}</h3>
                <p>{game.description || 'No description available.'}</p >
                {Array.isArray(game.tags) && game.tags.length > 0 && (
                  <div className="library-tag-row">
                    {game.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="library-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <Link to={`/game/${game.product_id}`} className="library-play-btn">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LibraryPage;