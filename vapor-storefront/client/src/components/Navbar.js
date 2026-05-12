import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:8080/cart', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCartCount(data.length);
      })
      .catch(err => console.error("Cart fetch error:", err));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim() === '') return;
    navigate(`/?q=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <nav className="navbar-container">
      <div className="nav-content-wrapper">
        <div className="nav-left">
          <Link to="/" className="brand-logo">VAPOR<span>STORE</span></Link>
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/" className="nav-link">STORE</Link>
        </div>

        <div className="nav-center">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search games..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="search-button">Search</button>
          </form>
        </div>

        <div className="nav-right">
          {user ? (
            <div className="user-logged-in">

              {user.is_admin && (
                <Link to="/admin" className="nav-link">ADMIN</Link>
              )}

              <Link to="/cart" className="nav-link cart-link">
                CART {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
              <span className="welcome-text">{user.display_name}</span>
              <button onClick={handleLogout} className="logout-button">LOGOUT</button>
            </div>
          ) : (
            <div className="auth-group">
              <Link to="/login" className="nav-link">LOGIN</Link>
              <span className="nav-sep">|</span>
              <Link to="/register" className="nav-link">REGISTER</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
