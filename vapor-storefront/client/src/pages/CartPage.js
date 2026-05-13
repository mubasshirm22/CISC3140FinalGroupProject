import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/CartPage.css';

// Guest cart helpers — stored in localStorage under 'guestCart'
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

  const existing = cart.find(
    i => i.product_id === product.product_id
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveGuestCart(cart);
}

export function removeFromGuestCart(product_id) {
  saveGuestCart(
    getGuestCart().filter(i => i.product_id !== product_id)
  );
}

function CartPage() {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [checkoutMsg, setCheckoutMsg] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [giftCode, setGiftCode] = useState('');

  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {

    if (token) {

      fetch('http://localhost:8080/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(r => r.json())
        .then(data => {
          setItems(Array.isArray(data) ? data : []);
          setLoading(false);
        })
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

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({ product_id })
      });

      setItems(prev =>
        prev.filter(i => i.product_id !== product_id)
      );

    } else {

      removeFromGuestCart(product_id);
      setItems(getGuestCart());

    }

    window.dispatchEvent(new Event('cartUpdated'));
  };

    const handleCheckout = async () => {

    try {

      // user not logged in
      if (!token) {

        navigate('/login');

        return;
      }

      // no items
      if (items.length === 0) {

        setCheckoutMsg(
          'Your cart is empty.'
        );

        return;
      }

      // collect product ids
      const ids = items.map(
        i => i.product_id
      );

      console.log('CHECKOUT ITEMS:', ids);

      // backend request
      const res = await fetch(
        'http://localhost:8080/checkout',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            items: ids
          })
        }
      );

      console.log(
        'CHECKOUT STATUS:',
        res.status
      );

      const data = await res.json();

      console.log(
        'CHECKOUT RESPONSE:',
        data
      );

      // success
      if (res.ok) {

        setItems([]);

        setCheckoutMsg(
          'Payment Successful! Thank you for purchasing from Vapor Store. Enjoy your game.'
        );

        setGiftCode('');

        setShowModal(false);

        // update navbar cart count
        window.dispatchEvent(
          new Event('cartUpdated')
        );

      } else {

        setCheckoutMsg(
          data.error ||
          'Checkout failed.'
        );

      }

    } catch (err) {

      console.error(
        'CHECKOUT ERROR:',
        err
      );

      setCheckoutMsg(
        'Server error during checkout.'
      );
    }
  };
  const generateGiftCode = () => {

    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let code = 'VAPOR-';

    for (let i = 0; i < 4; i++) {
      code += chars[
        Math.floor(Math.random() * chars.length)
      ];
    }

    code += '-';

    for (let i = 0; i < 4; i++) {
      code += chars[
        Math.floor(Math.random() * chars.length)
      ];
    }

    setGiftCode(code);
  };

  const total = items.reduce(
    (sum, i) =>
      sum + Number(i.price) * (i.quantity || 1),
    0
  );

  if (loading) {

    return (
      <div className="cart-page">
        <p className="cart-loading">
          Loading cart...
        </p>
      </div>
    );
  }

  return (

    <div className="cart-page">

      <h2 className="cart-title">
        Your Cart
      </h2>

      {checkoutMsg && (
        <div className="cart-success">
          {checkoutMsg}
        </div>
      )}

      {!token && (
        <div className="guest-banner">

          Browsing as guest —
          <Link to="/login">
            sign in
          </Link>

          to save your cart and checkout

        </div>
      )}

      {items.length === 0 ? (

        <div className="cart-empty">

          <p>Your cart is empty.</p>

          <Link
            to="/"
            className="cart-browse-btn"
          >
            Browse Games
          </Link>

        </div>

      ) : (

        <div className="cart-layout">

          <div className="cart-items-list">

            {items.map(item => (

              <div
                key={item.product_id}
                className="cart-item"
              >

                <div
                  className="cart-item-gradient"
                  style={{
                    background: getGameGradient(item.name)
                  }}
                />

                <div className="cart-item-info">

                  <Link
                    to={`/game/${item.product_id}`}
                    className="cart-item-name"
                  >
                    {item.name}
                  </Link>

                  {item.genre && (
                    <span className="cart-item-genre">
                      {item.genre}
                    </span>
                  )}

                </div>

                <div className="cart-item-right">

                  <span className="cart-item-price">
                    ${Number(item.price).toFixed(2)}
                  </span>

                  <button
                    className="cart-remove-btn"
                    onClick={() =>
                      handleRemove(item.product_id)
                    }
                  >
                    Remove
                  </button>

                </div>

              </div>

            ))}

          </div>

          <div className="cart-summary">

            <div className="cart-summary-title">
              Order Summary
            </div>

            <div className="cart-summary-row">

              <span>
                {items.length} item
                {items.length !== 1 ? 's' : ''}
              </span>

              <span>
                ${total.toFixed(2)}
              </span>

            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total">

              <span>Total</span>

              <span>
                ${total.toFixed(2)}
              </span>

            </div>

            {token ? (

              <button
                className="cart-checkout-btn"
                onClick={() => setShowModal(true)}
              >
                Purchase
              </button>

            ) : (

              <Link
                to="/login"
                className="cart-checkout-btn"
              >
                Sign In to Checkout
              </Link>

            )}

          </div>

        </div>

      )}

      {showModal && (

        <div className="checkout-modal-overlay">

          <div className="checkout-modal">

            <h2>
              Complete Purchase
            </h2>

            <input
              type="text"
              placeholder="Enter Gift Card"
              value={giftCode}
              onChange={(e) =>
                setGiftCode(e.target.value)
              }
              className="gift-input"
            />

            <button
              className="gift-generate-btn"
              onClick={generateGiftCode}
            >
              Generate Gift Card
            </button>

            <button
              className="gift-complete-btn"
              onClick={async () => {

                await handleCheckout();

                setShowModal(false);

              }}
            >
              Complete Purchase
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

// per-game gradient by name keyword
function getGameGradient(name = '') {

  const n = name.toLowerCase();

  if (n.includes('dungeon'))
    return 'linear-gradient(135deg, #1a0533, #3d1a6e)';

  if (n.includes('space'))
    return 'linear-gradient(135deg, #0a1628, #1a3a6e)';

  if (n.includes('twilight'))
    return 'linear-gradient(135deg, #1a0808, #4a1515)';

  if (n.includes('subway'))
    return 'linear-gradient(135deg, #0a1820, #1a3040)';

  if (
    n.includes('cheeze') ||
    n.includes('chopped')
  )
    return 'linear-gradient(135deg, #1a1500, #3d3200)';

  if (n.includes('soundtrack'))
    return 'linear-gradient(135deg, #0a1a1a, #1a3a3a)';

  return 'linear-gradient(135deg, #16202d, #1b2838)';
}

export default CartPage;