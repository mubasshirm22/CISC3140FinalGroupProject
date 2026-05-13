import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from './components/Navbar';
import HomePage from './pages/homepage';
import GameDetailPage from './pages/GameDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';

import AdminPanel from './pages/AdminPanel';
import AdminProducts from "./pages/admin/AdminProducts";
import AdminEditProduct from "./pages/admin/AdminEditProduct";
import LibraryPage from './pages/LibraryPage';
import { STEAM_FALLBACK_EVENT } from "./services/storefrontService";

import './style/App.css';
import './style/OriginGlobal.css';

function App() {
  const [steamApiFailed, setSteamApiFailed] = useState(false);

  useEffect(() => {
    const handleFallbackStatus = (event) => {
      setSteamApiFailed(Boolean(event?.detail?.active));
    };

    window.addEventListener(STEAM_FALLBACK_EVENT, handleFallbackStatus);

    return () => {
      window.removeEventListener(STEAM_FALLBACK_EVENT, handleFallbackStatus);
    };
  }, []);

  return (
    <Router>
      <div className="app-container">
        {steamApiFailed && (
          <div className="steam-fallback-banner">
            Steam API is temporarily unavailable. Using local data.
          </div>
        )}
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:id" element={<GameDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/library" element={<LibraryPage />} />

          <Route path="/admin" element={<AdminPanel />}>
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/edit/:id" element={<AdminEditProduct />} />
          </Route>

        </Routes>
      </div>
    </Router>
  );
}

export default App;