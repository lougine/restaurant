import { useEffect, useMemo, useState } from 'react';
import '../styles/Menu.css';
import '../styles/MenuReference.css';
import '../styles/MenuSearch.css';
import '../styles/CartOverlay.css';
import { Checkout } from './Checkout';
import blueberryMojitoImage from '../attachments/Blueberry-mojito.png';
import bluePassionMojitoImage from '../attachments/Blue-Passion-mojito.png';
import passionMojitoImage from '../attachments/Passion-mojito.png';

const MENU_API_ROOT = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export const menuItems = [
  { id: 1, name: 'Charred octopus', description: 'White bean purée, preserved lemon, smoked paprika', ingredients: ['Octopus', 'White bean purée', 'Preserved lemon', 'Smoked paprika'], allergens: ['Molluscs'], price: 400, category: 'Appetizers', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=85', tag: "Chef's pick" },
  { id: 2, name: 'Garden mezze', description: 'Whipped feta, seasonal vegetables, warm flatbread', ingredients: ['Whipped feta', 'Seasonal vegetables', 'Warm flatbread'], allergens: ['Milk', 'Wheat (gluten)'], price: 350, category: 'Vegetarian', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85', tag: 'Vegetarian' },
  { id: 3, name: 'Lamb shoulder', description: 'Slow roasted lamb, saffron rice, herb chermoula', ingredients: ['Slow-roasted lamb', 'Saffron rice', 'Herb chermoula'], allergens: [], price: 320, category: 'Mains', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85', tag: 'Signature' },
  { id: 4, name: 'Fire-roasted flatbread', description: 'Tomato, burrata, basil oil, Aleppo pepper', ingredients: ['Flatbread', 'Tomato', 'Burrata', 'Basil oil', 'Aleppo pepper'], allergens: ['Wheat (gluten)', 'Milk'], price: 210, category: 'Appetizers', image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=85', tag: 'Signature' },
  { id: 5, name: 'Citrus salmon', description: 'Roasted salmon, fennel, orange beurre blanc', ingredients: ['Roasted salmon', 'Fennel', 'Orange beurre blanc'], allergens: ['Fish', 'Milk'], price: 280, category: 'Mains', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=85', tag: 'Chef pick' },
  { id: 6, name: 'Olive oil cake', description: 'Whipped mascarpone, lemon curd, rosemary', ingredients: ['Olive oil cake', 'Whipped mascarpone', 'Lemon curd', 'Rosemary'], allergens: ['Wheat (gluten)', 'Eggs', 'Milk'], price: 250, category: 'Dessert', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=85' },
  { id: 7, name: 'Blueberry mojito', description: 'Blueberry, Lime, cane sugar, soda', ingredients: ['Blueberry', 'Lime', 'Cane sugar', 'Soda water'], allergens: [], price: 150, category: 'Drinks', image: blueberryMojitoImage },
  { id: 8, name: 'Passion mojito', description: 'Passion, cange sugar, lime, soda', ingredients: ['Passion', 'Lime', 'Cane sugar', 'Soda water'], allergens: [], price: 150, category: 'Drinks', image: passionMojitoImage },
  { id: 9, name: 'Blue Passion mojito', description: 'Blue passion, lime, cane sugar, soda water', ingredients: ['Blue passion', 'Lime', 'Cane sugar', 'Soda water'], allergens: [], price: 150, category: 'Drinks', image: bluePassionMojitoImage },
];

export function MenuView({ category, setCategory, addToCart, menuItems, cart, cartCount, cartTotal, tableNumber, setTableNumber, changeQuantity, placeOrder, cartOpen, setCartOpen }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [popularity, setPopularity] = useState({});
  const categories = ['All', 'Appetizers', 'Vegetarian', 'Mains', 'Dessert', 'Drinks'];

  useEffect(() => {
    let cancelled = false;
    fetch(`${MENU_API_ROOT}/orders/popular`).then((response) => response.json()).then((result) => {
      if (!cancelled && Array.isArray(result)) setPopularity(Object.fromEntries(result.map((item) => [item.name.trim().toLowerCase(), item.quantity])));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const categoryItems = [...(query || category === 'All' ? menuItems : menuItems.filter((item) => item.category === category))];
    categoryItems.sort((first, second) => (popularity[second.name.trim().toLowerCase()] || 0) - (popularity[first.name.trim().toLowerCase()] || 0));
    return categoryItems.filter((item) => !query || [item.name, item.description, item.category, ...(item.ingredients || []), ...(item.allergens || [])].join(' ').toLowerCase().includes(query));
  }, [category, menuItems, popularity, searchQuery]);

  return <div className="menu-page">
    <section className="menu-hero"><div className="menu-hero-copy"><p className="hero-kicker"><span /> Seasonal menu · Summer 2026</p><h1>Gather around<br /><em>good food.</em></h1><p>Bold Mediterranean flavors, local ingredients, and a little fire.<br />Made to share, remembered long after.</p><div className="hero-actions"><button className="hero-button" onClick={() => document.querySelector('.favorites-heading')?.scrollIntoView({ behavior: 'smooth' })}>Explore the menu <span>→</span></button><span className="open-note"><i /> Open today until  11:00 pm</span></div></div></section>
    <section className="favorites-heading"><div><p className="eyebrow">From our kitchen</p><h1>{category === 'All' ? <>Most <em>ordered</em></> : <>{category} <em>menu</em></>}</h1></div><div className="menu-filter-tools"><label className="menu-search"><span aria-hidden="true">⌕</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search the menu" aria-label="Search the menu" /></label><div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div></section>
    <div className="menu-layout"><section className="menu-section">{visibleItems.length ? <div className="menu-grid">{visibleItems.map((item) => {
      return <article className="menu-card" key={item.id}>
        <div className="menu-card-photo">
          <button className="menu-card-expand" type="button" aria-haspopup="dialog" aria-label={`View details for ${item.name}`} onClick={() => setSelectedItem(item)}>
            <div className={`food-image${['Blueberry mojito', 'Passion mojito', 'Blue Passion mojito'].includes(item.name) ? ' food-image-cutout' : ''}`} style={{ backgroundImage: `url(${item.image})` }}>{item.tag && <span className="food-tag">{item.tag}</span>}</div>
          </button>
          <button className="add-button" type="button" onClick={() => addToCart(item)} aria-label={`Add ${item.name}`}>+</button>
        </div>
        <button className="menu-card-details-button" type="button" aria-haspopup="dialog" onClick={() => setSelectedItem(item)}>
          <span className="food-details"><span><span className="food-card-title">{item.name}</span><span className="food-description">{item.description}</span></span><strong className="food-price">EGP {item.price}</strong></span>
          <span className="menu-card-more">View ingredients &amp; allergens <span aria-hidden="true">↗</span></span>
        </button>
      </article>;
    })}</div> : <p className="menu-search-empty">No menu items match “{searchQuery}”.</p>}</section></div>
    {selectedItem && <MenuItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={addToCart} />}
    {cartOpen && <CartPanel cart={cart} cartCount={cartCount} cartTotal={cartTotal} tableNumber={tableNumber} changeQuantity={changeQuantity} onCheckout={() => setCheckoutOpen(true)} onClose={() => setCartOpen(false)} />}
    {checkoutOpen && <Checkout cartTotal={cartTotal} tableNumber={tableNumber} setTableNumber={setTableNumber} placeOrder={async (orderDetails) => { await placeOrder(orderDetails); setCheckoutOpen(false); }} onClose={() => setCheckoutOpen(false)} />}
  </div>;
}

function MenuItemModal({ item, onClose, onAddToCart }) {
  const ingredients = item.ingredients || item.description.split(',').map((ingredient) => ingredient.trim());
  const allergens = item.allergens || [];

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="menu-item-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="menu-item-modal" role="dialog" aria-modal="true" aria-labelledby="menu-item-modal-title">
      <button className="menu-item-modal-close" type="button" onClick={onClose} aria-label="Close item details">×</button>
      <img className={`menu-item-modal-image${['Blueberry mojito', 'Passion mojito', 'Blue Passion mojito'].includes(item.name) ? ' menu-item-modal-image-cutout' : ''}`} src={item.image} alt={item.name} />
      <div className="menu-item-modal-content">
        <p className="eyebrow">{item.category}{item.tag ? ` · ${item.tag}` : ''}</p>
        <div className="menu-item-modal-title-row"><h2 id="menu-item-modal-title">{item.name}</h2><strong>EGP {item.price}</strong></div>
        <p className="menu-item-modal-description">{item.description}</p>
        <div className="menu-item-information">
          <div><h3>Ingredients</h3><p>{ingredients.length ? ingredients.join(', ') : 'Please ask our team for ingredient details.'}</p></div>
          <div><h3>Allergens</h3><p>{allergens.length ? allergens.join(', ') : 'No listed allergens'}</p></div>
          <p className="allergen-note">Ask our team about allergies and possible cross-contact.</p>
        </div>
        <button className="menu-item-modal-add" type="button" onClick={() => { onAddToCart(item); onClose(); }}>Add to order <span>+</span></button>
      </div>
    </section>
  </div>;
}

function CartPanel({ cart, cartCount, cartTotal, tableNumber, changeQuantity, onCheckout, onClose }) {
  return <div className="cart-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="cart-panel" role="dialog" aria-label="Shopping cart"><div className="cart-heading"><div><p className="eyebrow">Your table</p><h2>Current order <span>{cartCount}</span></h2></div><div className="cart-heading-actions"><span className="table-chip">{tableNumber ? `T–${tableNumber}` : 'Table?'}</span><button className="cart-close-button" onClick={onClose} aria-label="Close cart">×</button></div></div>{cart.length === 0 ? <div className="empty-cart"><span>✦</span><strong>Your order is empty</strong><p>Add something delicious from the menu to get started.</p></div> : <div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><div><strong>{item.name}</strong><small>EGP {item.price} each</small></div><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}>+</button></div></div>)}</div>}<p className="cart-checkout-note">Choose dine-in, pickup, or delivery at checkout.</p><div className="cart-summary"><div><span>Subtotal</span><strong>EGP {cartTotal.toFixed(2)}</strong></div><div><span>Service charge <small>10%</small></span><strong>EGP {(cartTotal * 0.1).toFixed(2)}</strong></div><div className="total-line"><span>Total</span><strong>EGP {(cartTotal * 1.1).toFixed(2)}</strong></div></div><button className="primary-button" disabled={!cart.length} onClick={onCheckout}>Continue to checkout <span>→</span></button><p className="secure-note">⌁ No payment needed yet</p></aside></div>;
}
