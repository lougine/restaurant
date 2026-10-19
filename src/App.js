import './App.css';
import { useMemo, useState } from 'react';

const menuItems = [
  { id: 1, name: 'Charred sourdough', description: 'Cultured butter, smoked sea salt, ember oil', price: 8, category: 'Small plates', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=85', tag: 'Popular' },
  { id: 2, name: 'Burrata & peach', description: 'Heirloom tomato, basil, pistachio, aged balsamic', price: 16, category: 'Small plates', image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=85', tag: 'Seasonal' },
  { id: 3, name: 'Citrus salmon', description: 'Roasted salmon, fennel, orange beurre blanc', price: 28, category: 'Mains', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=85', tag: 'Chef pick' },
  { id: 4, name: 'Wild mushroom rigatoni', description: 'Parmesan cream, thyme, crispy shallot', price: 24, category: 'Mains', image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=85' },
  { id: 5, name: 'Olive oil cake', description: 'Whipped mascarpone, lemon curd, rosemary', price: 11, category: 'Desserts', image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=85' },
  { id: 6, name: 'Garden spritz', description: 'Elderflower, cucumber, mint, sparkling wine', price: 13, category: 'Drinks', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=85' },
];

const initialOrders = [
  { id: '#1048', table: 'Table 12', items: '2 × Citrus salmon, 1 × Garden spritz', total: 69, status: 'In progress', time: '2 min ago' },
  { id: '#1047', table: 'Table 04', items: '1 × Wild mushroom rigatoni, 1 × Burrata & peach', total: 40, status: 'Ready', time: '6 min ago' },
  { id: '#1046', table: 'Takeaway', items: '2 × Charred sourdough, 1 × Olive oil cake', total: 27, status: 'New', time: '8 min ago' },
];

const reservations = [
  { initials: 'SC', name: 'Sofia Chen', detail: '2 guests · 7:00 PM', note: 'Birthday', color: 'rose' },
  { initials: 'JM', name: 'Jordan Miller', detail: '4 guests · 7:30 PM', note: 'Window seat', color: 'gold' },
  { initials: 'AK', name: 'Alex Kim', detail: '2 guests · 8:15 PM', note: '—', color: 'blue' },
];

function App() {
  const [activeView, setActiveView] = useState('Menu');
  const [role, setRole] = useState('customer');
  const [category, setCategory] = useState('All items');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [toast, setToast] = useState('');

  const visibleItems = useMemo(() => category === 'All items' ? menuItems : menuItems.filter((item) => item.category === category), [category]);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isStaff = role === 'staff';
  const navigation = isStaff ? ['Menu', 'Kitchen', 'Reservations', 'Reports'] : ['Menu', 'Reservations'];

  function addToCart(item) {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);
      if (existing) return current.map((cartItem) => cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem);
      return [...current, { ...item, quantity: 1 }];
    });
    setToast(`${item.name} added to order`);
    window.setTimeout(() => setToast(''), 2200);
  }

  function changeQuantity(id, amount) {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  }

  function placeOrder() {
    if (!cart.length) return;
    setOrders((current) => [{ id: '#1049', table: 'QR · Table 08', items: cart.map((item) => `${item.quantity} × ${item.name}`).join(', '), total: cartTotal, status: 'New', time: 'Just now' }, ...current]);
    setCart([]);
    setToast('Order sent to the kitchen');
    setActiveView('Kitchen');
    window.setTimeout(() => setToast(''), 2600);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>EMBER<br /><small>HOUSE</small></span></div>
        <div className="venue-status"><span className="status-dot" /> Open now <span className="status-time">until 11:00 PM</span></div>
        <nav className="main-nav" aria-label="Customer navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map((view) => <button key={view} className={`nav-item ${activeView === view ? 'active' : ''}`} onClick={() => setActiveView(view)}><span className="nav-icon">{view === 'Menu' ? '▦' : view === 'Kitchen' ? '⌁' : view === 'Reservations' ? '◷' : '◒'}</span>{view}{view === 'Kitchen' && <span className="nav-badge">3</span>}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="help-box"><span>?</span><div><strong>Need a hand?</strong><small>Visit the help center</small></div></div><div className="user-row"><div className="avatar">{isStaff ? 'ET' : 'GU'}</div><div><strong>{isStaff ? 'Emma Thompson' : 'Guest'}</strong><small>{isStaff ? 'Owner account' : 'Customer view'}</small></div><button className="access-button" onClick={() => { setRole(isStaff ? 'customer' : 'staff'); setActiveView('Menu'); }}>{isStaff ? 'Sign out' : 'Staff sign in'}</button></div></div>
      </aside>

      <main className="content">
        <header className="topbar"><div className="mobile-brand">✦ EMBER HOUSE</div><div className="breadcrumbs">EMBER HOUSE <span>/</span> {activeView.toUpperCase()}</div><div className="top-actions"><button className="icon-button" aria-label="Notifications">♧<span className="notification-dot" /></button><button className="profile-button"><span className="avatar small">ET</span><span>Emma</span><span>⌄</span></button></div></header>

        {activeView === 'Menu' && <MenuView category={category} setCategory={setCategory} visibleItems={visibleItems} addToCart={addToCart} cart={cart} cartCount={cartCount} cartTotal={cartTotal} changeQuantity={changeQuantity} placeOrder={placeOrder} />}
        {activeView === 'Kitchen' && <KitchenView orders={orders} setOrders={setOrders} />}
        {activeView === 'Reservations' && <ReservationsView />}
        {activeView === 'Reports' && <ReportsView />}
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function MenuView({ category, setCategory, visibleItems, addToCart, cart, cartCount, cartTotal, changeQuantity, placeOrder }) {
  const categories = ['All items', 'Small plates', 'Mains', 'Desserts', 'Drinks'];
  return <>
    <section className="page-heading"><div><p className="eyebrow">Customer view <span className="live-pill"><i /> Live menu</span></p><h1>Good food, <em>made easy.</em></h1><p className="heading-copy">A warm welcome from the kitchen. Browse tonight's menu and send your order straight to the pass.</p></div><button className="outline-button">⌁ Preview QR menu</button></section>
    <div className="menu-layout"><section className="menu-section"><div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="menu-grid">{visibleItems.map((item) => <article className="menu-card" key={item.id}><div className="food-image" style={{ backgroundImage: `url(${item.image})` }}>{item.tag && <span className="food-tag">{item.tag}</span>}<button className="add-button" onClick={() => addToCart(item)} aria-label={`Add ${item.name}`}>+</button></div><div className="food-details"><div><h3>{item.name}</h3><p>{item.description}</p></div><strong>${item.price}</strong></div></article>)}</div></section><CartPanel cart={cart} cartCount={cartCount} cartTotal={cartTotal} changeQuantity={changeQuantity} placeOrder={placeOrder} /></div>
  </>;
}

function CartPanel({ cart, cartCount, cartTotal, changeQuantity, placeOrder }) {
  return <aside className="cart-panel"><div className="cart-heading"><div><p className="eyebrow">Your table</p><h2>Current order <span>{cartCount}</span></h2></div><span className="table-chip">T–08</span></div>{cart.length === 0 ? <div className="empty-cart"><span>✦</span><strong>Your order is empty</strong><p>Add something delicious from the menu to get started.</p></div> : <div className="cart-lines">{cart.map((item) => <div className="cart-line" key={item.id}><div><strong>{item.name}</strong><small>${item.price} each</small></div><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}>+</button></div></div>)}</div>}<div className="cart-summary"><div><span>Subtotal</span><strong>${cartTotal.toFixed(2)}</strong></div><div><span>Service charge <small>10%</small></span><strong>${(cartTotal * 0.1).toFixed(2)}</strong></div><div className="total-line"><span>Total</span><strong>${(cartTotal * 1.1).toFixed(2)}</strong></div></div><button className="primary-button" disabled={!cart.length} onClick={placeOrder}>Send to kitchen <span>→</span></button><p className="secure-note">⌁ No payment needed yet</p></aside>;
}

function KitchenView({ orders, setOrders }) {
  function updateStatus(id, status) { setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order)); }
  return <><section className="page-heading compact"><div><p className="eyebrow">Service dashboard <span className="live-pill"><i /> Live updates</span></p><h1>Kitchen <em>display.</em></h1><p className="heading-copy">Keep the pass moving. Orders arrive here the moment guests tap send.</p></div><div className="kitchen-summary"><strong>{orders.filter((order) => order.status !== 'Ready').length}</strong><span>active orders</span></div></section><section className="kitchen-board"><div className="board-top"><h2>Today's queue <span>Tuesday, October 20</span></h2><button className="outline-button">⟳ Refresh</button></div><div className="order-columns">{['New', 'In progress', 'Ready'].map((status) => <div className="order-column" key={status}><div className="column-heading"><span className={`status-marker ${status.toLowerCase().replace(' ', '-')}`} />{status}<span>{orders.filter((order) => order.status === status).length}</span></div>{orders.filter((order) => order.status === status).map((order) => <article className="order-card" key={order.id}><div className="order-card-top"><strong>{order.id}</strong><span>{order.time}</span></div><div className="order-table">{order.table}</div><p>{order.items}</p><div className="order-card-foot"><strong>${order.total.toFixed(2)}</strong>{status !== 'Ready' ? <button onClick={() => updateStatus(order.id, status === 'New' ? 'In progress' : 'Ready')}>{status === 'New' ? 'Start order' : 'Mark ready'} →</button> : <span className="ready-label">✓ Sent to table</span>}</div></article>)}</div>)}</div></section></>;
}

function ReservationsView() { return <><section className="page-heading compact"><div><p className="eyebrow">Front of house <span className="live-pill"><i /> Today</span></p><h1>Reservations <em>at a glance.</em></h1><p className="heading-copy">A clear view of the room, so every guest feels expected.</p></div><button className="primary-button small-button">+ New reservation</button></section><section className="reservation-layout"><div className="reservation-list"><div className="section-title"><h2>Tonight's bookings</h2><span>12 reservations</span></div>{reservations.map((reservation) => <div className="reservation-row" key={reservation.name}><div className={`avatar ${reservation.color}`}>{reservation.initials}</div><div className="reservation-info"><strong>{reservation.name}</strong><span>{reservation.detail}</span></div><span className="reservation-note">{reservation.note}</span><button className="row-menu">•••</button></div>)}</div><div className="room-card"><div className="section-title"><h2>Room overview</h2><span>6:42 PM</span></div><div className="room-visual"><div className="table-layout">{[1, 2, 3, 4, 5, 6, 7, 8].map((table) => <div key={table} className={`floor-table table-${table} ${table === 4 || table === 7 ? 'occupied' : ''}`}>{table}</div>)}</div></div><div className="room-legend"><span><i className="legend-free" /> Available <strong>4</strong></span><span><i className="legend-occupied" /> Occupied <strong>2</strong></span><span><i className="legend-reserved" /> Reserved <strong>2</strong></span></div></div></section></>; }

function ReportsView() { return <><section className="page-heading compact"><div><p className="eyebrow">Owner overview <span className="live-pill"><i /> Updated just now</span></p><h1>Good evening, <em>Emma.</em></h1><p className="heading-copy">Here is how Ember House is doing today.</p></div><button className="outline-button">↓ Export report</button></section><section className="metric-grid"><div className="metric-card accent"><span>Net sales</span><strong>$4,286.40</strong><small>↑ 12.8% <em>vs. last Tuesday</em></small><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="metric-card"><span>Orders</span><strong>86</strong><small>↑ 8.2% <em>vs. last Tuesday</em></small><div className="metric-icon">▦</div></div><div className="metric-card"><span>Avg. order value</span><strong>$49.84</strong><small>↑ 3.4% <em>vs. last Tuesday</em></small><div className="metric-icon">⌁</div></div><div className="metric-card"><span>Table occupancy</span><strong>78%</strong><small>↑ 6.1% <em>vs. last Tuesday</em></small><div className="metric-icon">◷</div></div></section><section className="report-lower"><div className="sales-card"><div className="section-title"><h2>Sales overview</h2><button className="period-button">This week ⌄</button></div><div className="chart"><div className="chart-y"><span>$6k</span><span>$4k</span><span>$2k</span><span>$0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 650 180" preserveAspectRatio="none" aria-label="Sales chart"><path d="M0 145 C 50 136, 64 104, 108 121 S 167 145, 205 98 S 260 76, 298 111 S 349 125, 390 72 S 442 53, 480 74 S 535 97, 570 36 S 616 61, 650 18" fill="none" stroke="#dd6b45" strokeWidth="3" /><path d="M0 145 C 50 136, 64 104, 108 121 S 167 145, 205 98 S 260 76, 298 111 S 349 125, 390 72 S 442 53, 480 74 S 535 97, 570 36 S 616 61, 650 18 L650 180 L0 180Z" fill="url(#fade)" /><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dd6b45" stopOpacity=".18" /><stop offset="1" stopColor="#dd6b45" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></div><div className="popular-card"><div className="section-title"><h2>Top sellers</h2><button className="text-button">View menu →</button></div>{menuItems.slice(0, 4).map((item, index) => <div className="top-seller" key={item.id}><span className="rank">0{index + 1}</span><div className="mini-food" style={{ backgroundImage: `url(${item.image})` }} /><div><strong>{item.name}</strong><span>{[42, 36, 28, 21][index]} sold this week</span></div><b>${[672, 576, 672, 231][index]}</b></div>)}</div></section></>; }

export default App;
