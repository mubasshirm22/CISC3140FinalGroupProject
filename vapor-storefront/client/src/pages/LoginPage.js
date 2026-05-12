import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/Auth.css';

/**
 * LoginPage Component
 * Handles user authentication and synchronizes state with the Navbar.
 */
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * handleLogin
   * Sends credentials to backend and manages local session data.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);

        localStorage.setItem('user', JSON.stringify({
          display_name: data.display_name,
          email: email,
          is_admin: data.is_admin
        }));
        
        window.location.href = "/"; 
      } else {
        alert(data.error || "Authentication failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Auth Error:", err);
      alert("Could not connect to server. Please ensure the backend is running on port 8080.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Sign In</h2>
        <p className="auth-subtitle">Welcome back to Vapor Store</p>
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={isLoading}>
            {isLoading ? "AUTHENTICATING..." : "SIGN IN"}
          </button>
        </form>

        <div className="auth-footer">
          <span>New to Vapor?</span>
          <Link to="/register" className="auth-link">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;