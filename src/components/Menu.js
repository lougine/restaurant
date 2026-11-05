import { useMemo } from 'react';
import './Menu.css';
import './MenuReference.css';
import './CartOverlay.css';
import { useState } from 'react';
import { Checkout } from './Checkout';

export const menuItems = [
  { id: 1, name: 'Charred octopus', description: 'White bean purée, preserved lemon, smoked paprika', price: 24, category: 'Popular', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=85', tag: "Chef's pick" },
  { id: 2, name: 'Garden mezze', description: 'Whipped feta, seasonal vegetables, warm flatbread', price: 18, category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85', tag: 'Vegetarian' },
  { id: 3, name: 'Lamb shoulder', description: 'Slow roasted lamb, saffron rice, herb chermoula', price: 32, category: 'Mains', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85', tag: 'Signature' },
  { id: 4, name: 'Fire-roasted flatbread', description: 'Tomato, burrata, basil oil, Aleppo pepper', price: 21, category: 'Popular', image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=85', tag: 'Popular' },
  { id: 5, name: 'Citrus salmon', description: 'Roasted salmon, fennel, orange beurre blanc', price: 28, category: 'Mains', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=85', tag: 'Chef pick' },
  { id: 6, name: 'Olive oil cake', description: 'Whipped mascarpone, lemon curd, rosemary', price: 11, category: 'Dessert', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=85', tag: 'Popular' },
];

export function MenuView({ category, setCategory, addToCart, cart, cartCount, cartTotal, tableNumber, setTableNumber, changeQuantity, placeOrder, cartOpen, setCartOpen }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const categories = ['Popular', 'Vegetarian', 'Mains', 'Dessert', 'Drinks'];
  const visibleItems = useMemo(() => category === 'Popular' ? menuItems.filter((item) => item.tag === 'Popular' || item.tag === "Chef's pick" || item.tag === 'Signature') : menuItems.filter((item) => item.category === category), [category]);

  return <div className="menu-page">
    <section className="menu-hero"><div className="menu-hero-copy"><p className="hero-kicker"><span /> Seasonal menu · Summer 2025</p><h1>Gather around<br /><em>good food.</em></h1><p>Bold Mediterranean flavors, local ingredients, and a little fire.<br />Made to share, remembered long after.</p><div className="hero-actions"><button className="hero-button" onClick={() => document.querySelector('.favorites-heading')?.scrollIntoView({ behavior: 'smooth' })}>Explore the menu <span>→</span></button><span className="open-note"><i /> Open today until 10:30 pm</span></div></div></section>
    <section className="favorites-heading"><div><p className="eyebrow">From our kitchen</p><h1>Today's <em>favorites</em></h1></div><div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></section>
    <div className="menu-layout"><section className="menu-section"><div className="menu-grid">{visibleItems.map((item) => <article className="menu-card" key={item.id}><div className="food-image" style={{ backgroundImage: `url(${item.image})` }}>{item.tag && <span className="food-tag">{item.tag}</span>}<button className="add-button" onClick={() => addToCart(item)} aria-label={`Add ${item.name}`}>+</button></div><div className="food-details"><div><h3>{item.name}</h3><p>{item.description}</p><small>☆ 4.9 · 128 orders this week</small></div><strong>${item.price}</strong></div></article>)}</div></section></div>
    {cartOpen && <CartPanel cart={cart} cartCount={cartCount} cartTotal={cartTotal} tableNumber={tableNumber} changeQuantity={changeQuantity} onCheckout={() => setCheckoutOpen(true)} onClose={() => setCartOpen(false)} />}
    {checkoutOpen && <Checkout cartTotal={cartTotal} tableNumber={tableNumber} setTableNumber={setTableNumber} placeOrder={(orderDetails) => { placeOrder(orderDetails); setCheckoutOpen(false); }} onClose={() => setCheckoutOpen(false)} />}
  </div>;
}

function CartPanel({ cart, cartCount, cartTotal, tableNumber, changeQuantity, onCheckout, onClose }) {
  return <div className="cart-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="cart-panel" role="dialog" aria-label="Shopping cart"><div className="cart-heading"><div><p className="eyebrow">Your table</p><h2>Current order <span>{cartCount}</span></h2></div><div className="cart-heading-actions"><span className="table-chip">{tableNumber ? `T–${tableNumber}` : 'Table?'}</span><button className="cart-close-button" onClick={onClose} aria-label="Close cart">×</button></div></div>{cart.length === 0 ? <div className="empty-cart"><span>✦</span><strong>Your order is empty</strong><p>Add something delicious from the menu to get started.</p></div> : <div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><div><strong>{item.name}</strong><small>${item.price} each</small></div><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}>+</button></div></div>)}</div>}<p className="cart-checkout-note">Choose dine-in, pickup, or delivery at checkout.</p><div className="cart-summary"><div><span>Subtotal</span><strong>${cartTotal.toFixed(2)}</strong></div><div><span>Service charge <small>10%</small></span><strong>${(cartTotal * 0.1).toFixed(2)}</strong></div><div className="total-line"><span>Total</span><strong>${(cartTotal * 1.1).toFixed(2)}</strong></div></div><button className="primary-button" disabled={!cart.length} onClick={onCheckout}>Continue to checkout <span>→</span></button><p className="secure-note">⌁ No payment needed yet</p></aside></div>;
}
