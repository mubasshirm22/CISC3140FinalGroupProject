import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getGuestCart, saveGuestCart } from './CartPage';
import '../style/Auth.css';

function LoginPage() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {

    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {

      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (response.ok) {

        localStorage.setItem('token', data.token);

        const userProfile = {
          display_name:
            data.display_name ||
            email.split('@')[0].toUpperCase(),

          email: email,

          is_admin: data.is_admin || false
        };

        localStorage.setItem(
          'user',
          JSON.stringify(userProfile)
        );

        // Merge guest cart into database cart
        const guestItems = getGuestCart();

        if (guestItems.length > 0) {

          await Promise.all(
            guestItems.map(item =>
              fetch('http://localhost:8080/cart/add', {
                method: 'POST',

                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${data.token}`
                },

                body: JSON.stringify({
                  product_id: item.product_id
                })
              })
            )
          );

          saveGuestCart([]);
        }

        window.location.href = "/";

      } else {

        setError(
          data.error ||
          'Authentication failed. Please check your credentials.'
        );
      }

    } catch (err) {

      setError(
        'Could not connect to server. Make sure backend is running on port 8080.'
      );

    } finally {

      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">

      <div className="auth-box">

        <h2 className="auth-title">
          Sign In
        </h2>

        <p className="auth-subtitle">
          Welcome back to Vapor Store
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="auth-form"
        >

          <div className="input-group">

            <label>Email Address</label>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />

          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading}
          >

            {isLoading
              ? 'AUTHENTICATING...'
              : 'SIGN IN'}

          </button>

        </form>

        <div className="auth-footer">

          <span>New to Vapor?</span>

          <Link
            to="/register"
            className="auth-link"
          >
            Create an account
          </Link>

        </div>

      </div>

    </div>
  );
}

export default LoginPage;