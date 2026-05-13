import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGuestCart } from '../pages/CartPage';
import '../style/Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  const refreshCartCount = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:8080/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (r) => {
          if (!r.ok) {
            if (r.status === 401 || r.status === 403) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setCartCount(getGuestCart().length);
              return;
            }

            throw new Error('Failed to refresh cart count');
          }

          const data = await r.json();
          if (Array.isArray(data)) {
            setCartCount(data.length);
          }
        })
        .catch(() => {});
    } else {
      // guest cart count from localStorage
      setCartCount(getGuestCart().length);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      setUser(JSON.parse(userJson));
    } else {
      setUser(null);
      if (!token && userJson) {
        localStorage.removeItem('user');
      }
    }

    refreshCartCount();

    // listen for cart changes from any page
    window.addEventListener('cartUpdated', refreshCartCount);
    return () => window.removeEventListener('cartUpdated', refreshCartCount);
  }, [refreshCartCount]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/?q=${encodeURIComponent(searchInput.trim())}`);
  };

  return (
    <nav className="navbar-container">
      <div className="nav-content-wrapper">
        <div className="nav-left">
          <Link to="/" className="brand-logo">
            <img
              src="https://res.cloudinary.com/dswxezumx/image/upload/v1778625666/vaporstorelogooutlined_wzfssv.png"
              alt="VaporStore"
              className="brand-logo-img"
            />
          </Link>
          <Link to="/" className="nav-link">HOME</Link>
          <Link to="/" className="nav-link">STORE</Link>
          {user && <Link to="/library" className="nav-link">LIBRARY</Link>}
        </div>

        <div className="nav-center">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              className="search-input"
              placeholder="Search games..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
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
              <Link to="/cart" className="nav-link cart-link">
                CART {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>
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