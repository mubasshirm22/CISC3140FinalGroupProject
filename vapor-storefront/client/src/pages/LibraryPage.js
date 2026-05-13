import React, { useEffect, useState } from "react";
import '../style/Library.css'

function LibraryPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    fetch("https://backend-tender-woodland-6101.fly.dev/library", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setGames(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="library-loading">Loading...</p>;

  if (!localStorage.getItem("token"))
    return <p className="library-login">Sign in to view your library.</p>;

  return (
    <div className="library-page">
      <h1>Your Library</h1>

      {games.length === 0 ? (
        <p>You don’t own any games yet.</p>
      ) : (
        <div className="library-grid">
          {games.map(g => (
            <div key={g.product_id} className="library-item">
              <img src={g.image_url} alt="" className="library-thumb" />
              <h3>{g.name}</h3>
              <p>{g.genre}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LibraryPage;
