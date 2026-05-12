import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/CartPage.css';

// Guest cart helpers — stored in localStorage under 'guestCart'
export function getGuestCart() {
  try { return JSON.parse(localStorage.getItem('guestCart')) || []; }
  catch { return []; }
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
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetch('http://localhost:8080/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setItems(getGuestCart());
      setLoading(false);
    }
  }, [token]);

  const handleRemove = async (product_id) => {
    if (token) {
      await fetch('http://localhost:8080/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id })
      });
      setItems(prev => prev.filter(i => i.product_id !== product_id));
    } else {
      removeFromGuestCart(product_id);
      setItems(getGuestCart());
    }
    // update navbar count
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleCheckout = async () => {
    if (!token) { navigate('/login'); return; }
    const ids = items.map(i => i.product_id);
    const res = await fetch('http://localhost:8080/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: ids })
    });
    const data = await res.json();
    if (res.ok) {
      setItems([]);
      setCheckoutMsg('Purchase complete! Check your library.');
      window.dispatchEvent(new Event('cartUpdated'));
    } else {
      setCheckoutMsg(data.error || 'Checkout failed.');
    }
  };

  const total = items.reduce((sum, i) => sum + Number(i.price) * (i.quantity || 1), 0);

  if (loading) return <div className="cart-page"><p className="cart-loading">Loading cart...</p></div>;

  return (
    <div className="cart-page">
      <h2 className="cart-title">Your Cart</h2>

      {checkoutMsg && <div className="cart-success">{checkoutMsg}</div>}

      {!token && (
        <div className="guest-banner">
          Browsing as guest — <Link to="/login">sign in</Link> to save your cart and checkout
        </div>
      )}

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <Link to="/" className="cart-browse-btn">Browse Games</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-list">
            {items.map(item => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item-gradient" style={{ background: getGameGradient(item.name) }} />
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
            {token ? (
              <button className="cart-checkout-btn" onClick={handleCheckout}>
                Purchase
              </button>
            ) : (
              <Link to="/login" className="cart-checkout-btn">Sign In to Checkout</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// per-game gradient by name keyword
function getGameGradient(name = '') {
  const n = name.toLowerCase();
  if (n.includes('dungeon')) return 'linear-gradient(135deg, #1a0533, #3d1a6e)';
  if (n.includes('space'))   return 'linear-gradient(135deg, #0a1628, #1a3a6e)';
  if (n.includes('twilight')) return 'linear-gradient(135deg, #1a0808, #4a1515)';
  if (n.includes('subway'))  return 'linear-gradient(135deg, #0a1820, #1a3040)';
  if (n.includes('cheeze') || n.includes('chopped')) return 'linear-gradient(135deg, #1a1500, #3d3200)';
  if (n.includes('soundtrack')) return 'linear-gradient(135deg, #0a1a1a, #1a3a3a)';
  return 'linear-gradient(135deg, #16202d, #1b2838)';
}

export default CartPage;
