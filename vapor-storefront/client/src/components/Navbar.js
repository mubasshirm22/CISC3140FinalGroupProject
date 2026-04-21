/* Path: client/src/components/Navbar.js */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) setUser(JSON.parse(userJson));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login"; 
  };

  return (
    <nav className="navbar-container">
      <div className="nav-content-wrapper">
        <div className="nav-left">
          <Link to="/" className="brand-logo">VAPOR<span>STORE</span></Link>
        </div>

        {/* 注意：去掉了 Search Bar 和 Cart Icon，留给对应组员去实现 */}

        <div className="nav-right">
          {user ? (
            <div className="user-logged-in">
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