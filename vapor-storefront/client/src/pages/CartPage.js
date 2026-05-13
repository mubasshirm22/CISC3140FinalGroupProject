import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGameGradient } from '../services/themeUtils';
import { enrichStandaloneGames, getGameThumbnailSrc } from '../services/storefrontService';
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
  const [giftCardError, setGiftCardError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [giftCard, setGiftCard] = useState({ number: '', amount: 0 });
  const [enteredCard, setEnteredCard] = useState('');

  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const getThumbSrc = (item) =>
    getGameThumbnailSrc(item);

  useEffect(() => {

    if (token) {

      fetch('http://localhost:8080/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(r => r.json())
        .then(async (data) => {
          const safeData = Array.isArray(data) ? data : [];
          const enriched = await enrichStandaloneGames(safeData);
          setItems(enriched);
          setLoading(false);
        })
        .catch(() => setLoading(false));

    } else {
      enrichStandaloneGames(getGuestCart())
        .then((enriched) => {
          setItems(enriched);
          setLoading(false);
        })
        .catch(() => {
          setItems(getGuestCart());
          setLoading(false);
        });
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
      const refreshed = getGuestCart();
      const enriched = await enrichStandaloneGames(refreshed);
      setItems(enriched);
    }

    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handlePurchaseClick = () => {
    // Clear previous messages
    setCheckoutMsg('');
    setGiftCardError('');

    // user not logged in
    if (!token) {
      navigate('/login');
      return;
    }

    // no items
    if (items.length === 0) {
      setCheckoutMsg('Your cart is empty.');
      return;
    }

    // Check if gift card was generated
    if (!giftCard.number || giftCard.amount === 0) {
      setGiftCardError('Please generate a gift card first.');
      return;
    }

    // Open modal
    setShowModal(true);
  };

  const handleCheckout = async () => {
    if (!token) { navigate('/login'); return; }
    const checkoutItems = items.map(i => ({
      product_id: i.product_id,
      quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1
    }));
    const res = await fetch('http://localhost:8080/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: checkoutItems })
    });
    const data = await res.json();
    if (res.ok) {
      setItems([]);
      setCheckoutMsg('Purchase complete! Redirecting to library...');
      window.dispatchEvent(new Event('cartUpdated'));
      setTimeout(() => navigate('/library'), 2000);
    } else {
      setCheckoutMsg(data.error || 'Checkout failed.');

    try {

      // Clear previous errors
      setGiftCardError('');

      // Check if user entered card number
      if (!enteredCard.trim()) {
        setGiftCardError('Please enter the gift card number.');
        return;
      }

      // Check if entered card matches generated card
      if (enteredCard.trim() !== giftCard.number) {
        setGiftCardError('Invalid gift card number. Please enter the correct card number.');
        return;
      }

      // Calculate total
      const total = items.reduce(
        (sum, i) => sum + Number(i.price) * (i.quantity || 1),
        0
      );

      // Check if gift card balance is sufficient
      if (giftCard.amount < total) {
        setGiftCardError(
          `Insufficient balance. Your gift card has $${giftCard.amount}.00 but cart total is $${total.toFixed(2)}. Please generate another gift card or remove items from cart.`
        );
        return;
      }

      // All checks passed - proceed with checkout
      const ids = items.map(i => i.product_id);

      console.log('CHECKOUT ITEMS:', ids);

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

      console.log('CHECKOUT STATUS:', res.status);

      const data = await res.json();

      console.log('CHECKOUT RESPONSE:', data);

      // success
      if (res.ok) {

        setItems([]);

        setCheckoutMsg(
          `Payment Successful! Used $${total.toFixed(2)} from your gift card. Remaining balance: $${(giftCard.amount - total).toFixed(2)}. Thank you for purchasing from Vapor Store. Enjoy your game.`
        );

        setGiftCard({ number: '', amount: 0 });
        setEnteredCard('');
        setShowModal(false);

        // update navbar cart count
        window.dispatchEvent(
          new Event('cartUpdated')
        );

      } else {

        setGiftCardError(
          data.error ||
          'Checkout failed.'
        );

      }

    } catch (err) {

      console.error(
        'CHECKOUT ERROR:',
        err
      );

      setGiftCardError(
        'Server error during checkout.'
      );
    }
  };

  const loadOrderHistory = async () => {
    setHistoryLoading(true);
    setShowHistoryModal(true);

  if (loading) return <div className="cart-page"><p className="cart-loading">Loading cart...</p ></div>;
    try {
      const res = await fetch('http://localhost:8080/api/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setOrderHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("HISTORY ERROR:", err);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const generateGiftCard = () => {
    // Generate 16-digit card number
    let cardNumber = '';
    for (let i = 0; i < 16; i++) {
      cardNumber += Math.floor(Math.random() * 10);
      // Add dash every 4 digits
      if ((i + 1) % 4 === 0 && i !== 15) {
        cardNumber += '-';
      }
    }

    // Generate random amount between $70-$100
    const amount = Math.floor(Math.random() * 31) + 70; // 70 to 100

    setGiftCard({ number: cardNumber, amount });
    setEnteredCard(''); // Clear entered card
    setGiftCardError(''); // Clear any errors
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

      <div className="cart-header">
        <h2 className="cart-title">
          Your Cart
        </h2>

        {token && (
          <button 
            className="history-btn"
            onClick={loadOrderHistory}
          >
            Purchase History
          </button>
        )}
      </div>

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
          <p>Your cart is empty.</p >
          <Link to="/" className="cart-browse-btn">Browse Games</Link>
        </div>

      ) : (

        <div className="cart-layout">

          <div className="cart-items-list">

            {items.map(item => (
              <div key={item.product_id} className="cart-item">
                {getThumbSrc(item) ? (
                  <img
                    src={getThumbSrc(item)}
                    alt={item.name}
                    className="cart-item-thumb"
                  />
                ) : (
                  <div className="cart-item-gradient" style={{ background: getGameGradient(item.name) }} />
                )}
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

            {giftCardError && !showModal && (
              <div className="gift-card-error">
                {giftCardError}
              </div>
            )}

            {token ? (

              <button
                className="cart-checkout-btn"
                onClick={handlePurchaseClick}
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

      {/* GIFT CARD GENERATION - INLINE ON PAGE */}
      <div className="gift-card-section">
        
        <div className="gift-card-display">
          <label>Generated Gift Card:</label>
          <input
            type="text"
            placeholder="Click 'Generate Gift Card' below"
            value={giftCard.number}
            readOnly
            className="gift-input-display"
          />

          {giftCard.amount > 0 && (
            <div className="gift-amount-inline">
              Balance: ${giftCard.amount}.00
            </div>
          )}
        </div>

        <button
          className="gift-generate-btn-inline"
          onClick={generateGiftCard}
        >
          Generate Gift Card
        </button>

      </div>

      {/* MODAL FOR ENTERING CARD NUMBER */}
      {showModal && (

        <div className="checkout-modal-overlay">

          <div className="checkout-modal">

            <h2>
              Enter Gift Card Number
            </h2>

            <input
              type="text"
              placeholder="Enter the card number above"
              value={enteredCard}
              onChange={(e) => setEnteredCard(e.target.value)}
              className="gift-input"
            />

            {giftCardError && (
              <div className="modal-error">
                {giftCardError}
              </div>
            )}

            <button
              className="gift-complete-btn"
              onClick={handleCheckout}
            >
              Complete Purchase
            </button>

            <button
              className="gift-cancel-btn"
              onClick={() => {
                setShowModal(false);
                setGiftCardError('');
                setEnteredCard('');
              }}
            >
              Cancel
            </button>

          </div>

        </div>

      )}

      {/* PURCHASE HISTORY MODAL */}
      {showHistoryModal && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal history-modal">
            
            <h2>Purchase History</h2>

            {historyLoading ? (
              <p className="loading-text">Loading...</p>
            ) : orderHistory.length === 0 ? (
              <p className="no-history">No purchase history yet.</p>
            ) : (
              <div className="history-list">
                {orderHistory.map(order => (
                  <div key={order.order_id} className="history-order">
                    
                    <div className="history-header">
                      <div>
                        <div className="history-order-id">
                          Order #{order.order_id}
                        </div>
                        <div className="history-date">
                          {new Date(order.order_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="history-total">
                        ${Number(order.total_amount).toFixed(2)}
                      </div>
                    </div>

                    <div className="history-items">
                      {order.items.map(item => (
                        <div key={item.product_id} className="history-item">
                          <span className="history-item-name">{item.name}</span>
                          <span className="history-item-genre">{item.genre}</span>
                          <span className="history-item-price">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}

            <button
              className="gift-cancel-btn"
              onClick={() => setShowHistoryModal(false)}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default CartPage;