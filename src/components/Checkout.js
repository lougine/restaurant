import { useState } from 'react';
import '../styles/Checkout.css';

const fulfillmentOptions = [
  { id: 'here', label: 'Eat here', description: 'Enjoy your meal at the restaurant' },
  { id: 'delivery', label: 'Delivery', description: 'We will bring it to your address' },
  { id: 'pickup', label: 'Pickup', description: 'Collect your order from  savor' },
];

export function Checkout({ cartTotal, tableNumber, setTableNumber, placeOrder, onClose }) {
  const [fulfillment, setFulfillment] = useState('here');
  const [paymentMethod, setPaymentMethod] = useState('here');
  const [details, setDetails] = useState({ name: '', phone: '', address: '', cardNumber: '', expiry: '', cvc: '' });
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  function updateDetail(event) {
    setDetails((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function locateAddress() {
    if (!window.isSecureContext) {
      setLocationMessage('Location access requires HTTPS or localhost. Enter your delivery address instead.');
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage('Location is not available on this device.');
      return;
    }
    setLocating(true);
    setLocationMessage('Requesting location permission…');
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude, accuracy } = position.coords;
      setDetails((current) => ({ ...current, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
      setLocationMessage(`Location captured (about ${Math.round(accuracy)} m accuracy). Add your apartment or landmark if needed.`);
      setLocating(false);
    }, (error) => {
      const messages = {
        1: 'Location permission was denied. Allow location access in your browser, then try again.',
        2: 'Your device could not determine its location. Turn on device location and try again.',
        3: 'Location detection took too long. Try again or enter your address.',
      };
      setLocationMessage(messages[error.code] || 'We could not access your location. Enter your address instead.');
      setLocating(false);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  function openPickupMaps() {
    const query = encodeURIComponent('Savor restaurant, Zamalek, Cairo, Egypt');
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setOrderError('');
    try {
      await placeOrder({ fulfillment, paymentMethod, tableNumber: fulfillment === 'here' ? tableNumber : '', details });
      onClose();
    } catch (error) {
      setOrderError(error.message || 'Your order could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const requiresName = fulfillment === 'pickup' || fulfillment === 'delivery';
  const requiresPhone = fulfillment === 'delivery';
  const requiresAddress = fulfillment === 'delivery';
  const canSubmit = (!requiresName || details.name.trim()) && (!requiresPhone || details.phone.trim()) && (!requiresAddress || details.address.trim()) && (fulfillment !== 'here' || tableNumber) && (paymentMethod !== 'online' || (details.cardNumber && details.expiry && details.cvc));

  return <div className="checkout-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="checkout-sheet" onSubmit={submit}>
      <div className="checkout-header"><div><h2>Your order</h2><p className="order-ready"><i /> Order ready in 25–35 minutes</p></div><button type="button" className="close-button" onClick={onClose} aria-label="Close checkout">×</button></div>
      <div className="checkout-scroll">
        <button type="button" className="back-to-order" onClick={onClose}>← &nbsp; Back to order</button>
        <section className="checkout-section fulfillment-section"><p className="checkout-kicker">Fulfillment</p><h3>How would you like your order?</h3><div className="fulfillment-grid">{fulfillmentOptions.map((option) => <button type="button" key={option.id} className={`fulfillment-option ${fulfillment === option.id ? 'selected' : ''}`} onClick={() => { setFulfillment(option.id); if (option.id === 'delivery' && !details.address) locateAddress(); }}><strong>{option.label}</strong><span>{option.description}</span></button>)}</div></section>
        {fulfillment === 'here' && <section className="checkout-section"><label className="checkout-label" htmlFor="checkout-table">Table number</label><input id="checkout-table" className="checkout-input" type="number" min="1" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} placeholder="Enter your table number" required /></section>}
        {(requiresName || requiresPhone || requiresAddress) && <section className="checkout-section"><h3>{fulfillment === 'delivery' ? 'Delivery details' : 'Pickup details'}</h3><label className="checkout-label" htmlFor="checkout-name">Full name</label><input id="checkout-name" className="checkout-input" name="name" value={details.name} onChange={updateDetail} placeholder="Your full name" required={requiresName} />{fulfillment === 'pickup' && <button type="button" className="maps-button" onClick={openPickupMaps}>Open pickup location in Maps ↗</button>}{requiresPhone && <><label className="checkout-label" htmlFor="checkout-phone">Phone number</label><input id="checkout-phone" className="checkout-input" name="phone" type="tel" value={details.phone} onChange={updateDetail} placeholder="Your phone number" required /> </>}{requiresAddress && <><label className="checkout-label" htmlFor="checkout-address">Delivery address</label><div className="address-row"><input id="checkout-address" className="checkout-input" name="address" value={details.address} onChange={updateDetail} placeholder="Street, city, or use current location" required /><button type="button" className="location-button" onClick={locateAddress} disabled={locating}>{locating ? 'Locating...' : 'Use my current location'}</button></div>{locationMessage && <p className="location-message" role="status">{locationMessage}</p>}</>}</section>}
        <section className="checkout-section"><h3>How will you pay?</h3><div className="payment-toggle"><button type="button" className={paymentMethod === 'here' ? 'selected' : ''} onClick={() => setPaymentMethod('here')}>Pay here</button><button type="button" className={paymentMethod === 'online' ? 'selected' : ''} onClick={() => setPaymentMethod('online')}>Pay online</button></div>{paymentMethod === 'online' && <div className="visa-form"><div className="visa-heading"><strong>VISA</strong><span>Secure card payment</span></div><label className="checkout-label" htmlFor="card-number">Card number</label><input id="card-number" className="checkout-input" name="cardNumber" inputMode="numeric" value={details.cardNumber} onChange={updateDetail} placeholder="0000 0000 0000 0000" required /><div className="card-row"><div><label className="checkout-label" htmlFor="expiry">Expiry</label><input id="expiry" className="checkout-input" name="expiry" value={details.expiry} onChange={updateDetail} placeholder="MM/YY" required /></div><div><label className="checkout-label" htmlFor="cvc">CVC</label><input id="cvc" className="checkout-input" name="cvc" value={details.cvc} onChange={updateDetail} placeholder="123" required /></div></div></div>}</section>
      </div>
      <div className="checkout-footer">{orderError && <p className="order-submit-error" role="alert">{orderError}</p>}<div><span>Total</span><strong>EGP {Number(cartTotal * 1.1).toFixed(2)}</strong></div><button className="checkout-submit" type="submit" disabled={!canSubmit || submitting}>{submitting ? 'Sending order…' : 'Continue to payment'} <span>→</span></button></div>
    </form>
  </div>;
}
