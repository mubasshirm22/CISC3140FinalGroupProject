import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGameGradient } from '../services/themeUtils';
import { enrichStandaloneGames, getGameThumbnailSrc } from '../services/storefrontService';
import '../style/CartPage.css';

// Guest cart helpers
export function getGuestCart() {
  try {
    return JSON.parse(localStorage.getItem('guestCart')) || [];
  } catch {
    return [];
  }
}

export function saveGuestCart(items) {
  localStorage.setItem('guestCart', JSON.stringify(items));
}

export function addToGuestCart(product) {
  const cart = getGuestCart();
  const existing = cart.find(i => i.product_id === product.product_id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveGuestCart(cart);
}

export function removeFromGuestCart(product_id) {
  saveGuestCart(getGuestCart().filter(i => i.product_id !== product_id));
}

function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [giftCardError, setGiftCardError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const hasStoredUser = Boolean(localStorage.getItem('user'));

  const loadGuestCart = async () => {
    try {
      const enriched = await enrichStandaloneGames(getGuestCart());
      setItems(enriched);
    } catch {
      setItems(getGuestCart());
    } finally {
      setLoading(false);
    }
  };

  const getThumbSrc = (item) => getGameThumbnailSrc(item);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:8080/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (r) => {
          if (!r.ok) {
            if (r.status === 401 || r.status === 403) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setSessionExpired(true);
              await loadGuestCart();
              return;
            }

            throw new Error('Failed to load server cart');
          }

          const data = await r.json();
          const safeData = Array.isArray(data) ? data : [];
          const enriched = await enrichStandaloneGames(safeData);
          setItems(enriched);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setSessionExpired(hasStoredUser);
      loadGuestCart();
    }
  }, [token, hasStoredUser]);

  const handleRemove = async (product_id) => {
    if (token) {
      await fetch('http://localhost:8080/cart/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ product_id })
      });
      setItems(prev => prev.filter(i => i.product_id !== product_id));
    } else {
      removeFromGuestCart(product_id);
      const refreshed = getGuestCart();
      const enriched = await enrichStandaloneGames(refreshed);
      setItems(enriched);
    }
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handlePurchaseClick = () => {
    setCheckoutMsg('');
    setGiftCardError('');
    if (!token) { navigate('/login'); return; }
    if (items.length === 0) { setCheckoutMsg('Your cart is empty.'); return; }
    handleCheckout();
  };

  const handleCheckout = async () => {
    if (!token) { navigate('/login'); return; }

    try {
      setGiftCardError('');

      const checkoutItems = items.map((item) => ({
        product_id: item.product_id,
        quantity: Math.max(1, Number(item.quantity) || 1)
      }));

      const res = await fetch('http://localhost:8080/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: checkoutItems })
      });

      const data = await res.json();
      if (res.ok) {
        setItems([]);
        setCheckoutMsg(`Payment Successful! Thank you for purchasing.`);
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        setGiftCardError(data.error || 'Checkout failed.');
      }
    } catch (err) {
      setGiftCardError('Server error during checkout.');
    }
  };

  const loadOrderHistory = async () => {
    setHistoryLoading(true);
    setShowHistoryModal(true);
    try {
      const res = await fetch('http://localhost:8080/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrderHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("HISTORY ERROR:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const total = items.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0);

  if (loading) {
    return <div className="cart-page"><p className="cart-loading">Loading cart...</p ></div>;
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2 className="cart-title">Your Cart</h2>
        {token && <button className="history-btn" onClick={loadOrderHistory}>Purchase History</button>}
      </div>

      {checkoutMsg && <div className="cart-success">{checkoutMsg}</div>}

      {!token && !sessionExpired && (
        <div className="guest-banner">
          Browsing as guest — <Link to="/login">sign in</Link> to save your cart and checkout
        </div>
      )}

      {!token && sessionExpired && (
        <div className="guest-banner">
          Your login session expired — please <Link to="/login">sign in again</Link>.
        </div>
      )}

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p >
          <Link to="/" className="cart-browse-btn">Browse Games</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-list">
            {items.map(item => (
              <div key={item.product_id} className="cart-item">
                {getThumbSrc(item) ? (
                  < img src={getThumbSrc(item)} alt={item.name} className="cart-item-thumb" />
                ) : (
                  <div className="cart-item-gradient" style={{ background: getGameGradient(item.name) }} />
                )}
                <div className="cart-item-info">
                  <Link to={`/game/${item.product_id}`} className="cart-item-name">{item.name}</Link>
                  {item.genre && <span className="cart-item-genre">{item.genre}</span>}
                </div>
                <div className="cart-item-right">
                  <span className="cart-item-price">${Number(item.price).toFixed(2)}</span>
                  <button className="cart-remove-btn" onClick={() => handleRemove(item.product_id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-title">Order Summary</div>
            <div className="cart-summary-row">
              <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="cart-summary-divider" />
            <div className="cart-summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            {giftCardError && <div className="gift-card-error">{giftCardError}</div>}
            {token ? (
              <button className="cart-checkout-btn" onClick={handlePurchaseClick}>Purchase</button>
            ) : (
              <Link to="/login" className="cart-checkout-btn">Sign In to Checkout</Link>
            )}
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal history-modal">
            <h2>Purchase History</h2>
            {historyLoading ? (
              <p>Loading...</p >
            ) : orderHistory.length === 0 ? (
              <p>No purchase history yet.</p >
            ) : (
              <div className="history-list">
                {orderHistory.map(order => (
                  <div key={order.order_id} className="history-order">
                    <div className="history-header">
                      <div>
                        <div className="history-order-id">Order #{order.order_id}</div>
                        <div className="history-date">{new Date(order.order_date).toLocaleDateString()}</div>
                      </div>
                      <div className="history-total">${Number(order.total_amount).toFixed(2)}</div>
                    </div>
                    <div className="history-items">
                      {(Array.isArray(order.items) ? order.items : []).map(item => (
                        <div key={item.product_id} className="history-item">
                          <span>{item.name}</span>
                          <span>${Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="gift-cancel-btn" onClick={() => setShowHistoryModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;