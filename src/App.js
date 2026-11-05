import './App.css';
import './layout.css';
import { useEffect, useState } from 'react';
import { MenuView, menuItems } from './components/Menu';
import { ReservationsView } from './components/Reservations';
import { AboutView } from './components/About';
import { OwnerMenuAdmin } from './components/OwnerMenuAdmin';
import { Footer } from './components/footer';
import './pages/Kitchen.css';
import './pages/Reports.css';

const initialOrders = [
  { id: '#1048', table: 'Table 12', items: '2 × Citrus salmon, 1 × Garden spritz', total: 69, status: 'In progress', time: '2 min ago' },
  { id: '#1047', table: 'Table 04', items: '1 × Wild mushroom rigatoni, 1 × Burrata & peach', total: 40, status: 'Ready', time: '6 min ago' },
  { id: '#1046', table: 'Takeaway', items: '2 × Charred sourdough, 1 × Olive oil cake', total: 27, status: 'New', time: '8 min ago' },
];

function App() {
  const [activeView, setActiveView] = useState('Menu');
  const [role, setRole] = useState('customer');
  const [category, setCategory] = useState('Popular');
  const [managedMenu, setManagedMenu] = useState(menuItems);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('savor-cart') || '[]');
    } catch (error) {
      return [];
    }
  });
  const [tableNumber, setTableNumber] = useState(() => window.localStorage.getItem('savor-table-number') || '');
  const [orders, setOrders] = useState(initialOrders);
  const [toast, setToast] = useState('');
  const [showTopbar, setShowTopbar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isStaff = role === 'staff';
  const isOwner = role === 'owner';
  const navigation = isOwner ? ['Menu', 'Kitchen', 'Reservations', 'Reports', 'Menu manager', 'About Us'] : isStaff ? ['Menu', 'Kitchen', 'Reservations'] : ['Menu', 'Reservations'];

  useEffect(() => {
    window.localStorage.setItem('savor-cart', JSON.stringify(cart));
    if (tableNumber) window.localStorage.setItem('savor-table-number', tableNumber);
    else window.localStorage.removeItem('savor-table-number');
  }, [cart, tableNumber]);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    function handleScroll() {
      const currentScrollY = window.scrollY;
      setShowTopbar(currentScrollY < previousScrollY || currentScrollY < 24);
      previousScrollY = currentScrollY;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  function placeOrder(orderDetails) {
    const orderLabel = orderDetails.fulfillment === 'here'
      ? `Table ${orderDetails.tableNumber}`
      : orderDetails.fulfillment === 'delivery'
        ? `Delivery · ${orderDetails.details.name}`
        : `Pickup · ${orderDetails.details.name}`;
    setOrders((current) => [{ id: '#1049', table: orderLabel, items: cart.map((item) => `${item.quantity} × ${item.name}`).join(', '), total: cartTotal, status: 'New', time: 'Just now' }, ...current]);
    setCart([]);
    setTableNumber('');
    setToast('Order sent to the kitchen');
    window.setTimeout(() => setToast(''), 2600);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>SAVOR</span></div>
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen((current) => !current)} aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen}><span /><span /><span /></button>
        <div className="venue-status"><span className="status-dot" /> Open now <span className="status-time">until 11:00 PM</span></div>
        <nav className={`main-nav ${mobileMenuOpen ? 'mobile-nav-open' : ''}`} aria-label="Customer navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map((view) => <button key={view} className={`nav-item ${activeView === view ? 'active' : ''}`} onClick={() => { setActiveView(view); setMobileMenuOpen(false); }}><span className="nav-icon">{view === 'Menu' ? '▦' : view === 'Kitchen' ? '⌁' : view === 'Reservations' ? '◷' : view === 'Menu manager' ? '✎' : '◒'}</span>{view}{view === 'Kitchen' && <span className="nav-badge">3</span>}</button>)}
        </nav>
        <button className="book-table-nav" onClick={() => setActiveView('Reservations')}>Book a table <span>↗</span></button>
        <div className="sidebar-bottom"><div className="help-box"><span>?</span><div><strong>Need a hand?</strong><small>Visit the help center</small></div></div><div className="user-row"><div className="avatar">{isStaff || isOwner ? 'ET' : 'GU'}</div><div><strong>{isOwner ? 'Owner' : isStaff ? 'Kitchen' : 'Guest'}</strong><small>{isOwner ? 'Owner account' : isStaff ? 'Kitchen account' : 'Customer view'}</small></div><button className="access-button" onClick={() => { setRole(role === 'customer' ? 'staff' : role === 'staff' ? 'owner' : 'customer'); setActiveView(role === 'customer' ? 'Kitchen' : role === 'staff' ? 'Menu manager' : 'Menu'); }}>{role === 'customer' ? 'Staff sign in' : role === 'staff' ? 'Owner sign in' : 'Sign out'}</button></div></div>
      </aside>

      <main className="content">
        <header className={`topbar ${showTopbar ? '' : 'topbar-hidden'}`}><div className="mobile-brand">✦  savor</div><div className="breadcrumbs"> savor <span>/</span> {activeView.toUpperCase()}</div><div className="top-actions"><button className="cart-top-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}><span aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M3 5h2l2.2 10.5h10.9L21 8H6" /><path d="M9 19h.01M18 19h.01" /></svg></span><b>{cartCount}</b></button></div></header>

        {activeView === 'Menu' && <MenuView category={category} setCategory={setCategory} addToCart={addToCart} menuItems={managedMenu} cart={cart} cartCount={cartCount} cartTotal={cartTotal} tableNumber={tableNumber} setTableNumber={setTableNumber} changeQuantity={changeQuantity} placeOrder={placeOrder} cartOpen={cartOpen} setCartOpen={setCartOpen} />}
        {activeView === 'Kitchen' && <KitchenView orders={orders} setOrders={setOrders} />}
        {activeView === 'Reservations' && <ReservationsView />}
        {activeView === 'About Us' && <AboutView />}
        {activeView === 'Reports' && <ReportsView />}
        {activeView === 'Menu manager' && isOwner && <OwnerMenuAdmin items={managedMenu} setItems={setManagedMenu} />}

        <Footer navigation={navigation} onNavigate={setActiveView} />
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function KitchenView({ orders, setOrders }) {
  function updateStatus(id, status) { setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order)); }
  return <div className="kitchen-page"><section className="page-heading compact"><div><p className="eyebrow">Service dashboard <span className="live-pill"><i /> Live updates</span></p><h1>Kitchen <em>display.</em></h1><p className="heading-copy">Keep the pass moving. Orders arrive here the moment guests tap send.</p></div><div className="kitchen-summary"><strong>{orders.filter((order) => order.status !== 'Ready').length}</strong><span>active orders</span></div></section><section className="kitchen-board"><div className="board-top"><h2>Today's queue <span>Tuesday, October 20</span></h2><button className="outline-button">⟳ Refresh</button></div><div className="order-columns">{['New', 'In progress', 'Ready'].map((status) => <div className="order-column" key={status}><div className="column-heading"><span className={`status-marker ${status.toLowerCase().replace(' ', '-')}`} />{status}<span>{orders.filter((order) => order.status === status).length}</span></div>{orders.filter((order) => order.status === status).map((order) => <article className="order-card" key={order.id}><div className="order-card-top"><strong>{order.id}</strong><span>{order.time}</span></div><div className="order-table">{order.table}</div><p>{order.items}</p><div className="order-card-foot"><strong>${order.total.toFixed(2)}</strong>{status !== 'Ready' ? <button onClick={() => updateStatus(order.id, status === 'New' ? 'In progress' : 'Ready')}>{status === 'New' ? 'Start order' : 'Mark ready'} →</button> : <span className="ready-label">✓ Sent to table</span>}</div></article>)}</div>)}</div></section></div>;
}

function ReportsView() { return <div className="reports-page"><section className="page-heading compact"><div><p className="eyebrow">Owner overview <span className="live-pill"><i /> Updated just now</span></p><h1>Good evening, <em>Emma.</em></h1><p className="heading-copy">Here is how  savor is doing today.</p></div><button className="outline-button">↓ Export report</button></section><section className="metric-grid"><div className="metric-card accent"><span>Net sales</span><strong>$4,286.40</strong><small>↑ 12.8% <em>vs. last Tuesday</em></small><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="metric-card"><span>Orders</span><strong>86</strong><small>↑ 8.2% <em>vs. last Tuesday</em></small><div className="metric-icon">▦</div></div><div className="metric-card"><span>Avg. order value</span><strong>$49.84</strong><small>↑ 3.4% <em>vs. last Tuesday</em></small><div className="metric-icon">⌁</div></div><div className="metric-card"><span>Table occupancy</span><strong>78%</strong><small>↑ 6.1% <em>vs. last Tuesday</em></small><div className="metric-icon">◷</div></div></section><section className="report-lower"><div className="sales-card"><div className="section-title"><h2>Sales overview</h2><button className="period-button">This week ⌄</button></div><div className="chart"><div className="chart-y"><span>$6k</span><span>$4k</span><span>$2k</span><span>$0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 650 180" preserveAspectRatio="none" aria-label="Sales chart"><path d="M0 145 C 50 136, 64 104, 108 121 S 167 145, 205 98 S 260 76, 298 111 S 349 125, 390 72 S 442 53, 480 74 S 535 97, 570 36 S 616 61, 650 18" fill="none" stroke="#dd6b45" strokeWidth="3" /><path d="M0 145 C 50 136, 64 104, 108 121 S 167 145, 205 98 S 260 76, 298 111 S 349 125, 390 72 S 442 53, 480 74 S 535 97, 570 36 S 616 61, 650 18 L650 180 L0 180Z" fill="url(#fade)" /><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dd6b45" stopOpacity=".18" /><stop offset="1" stopColor="#dd6b45" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></div><div className="popular-card"><div className="section-title"><h2>Top sellers</h2><button className="text-button">View menu →</button></div>{menuItems.slice(0, 4).map((item, index) => <div className="top-seller" key={item.id}><span className="rank">0{index + 1}</span><div className="mini-food" style={{ backgroundImage: `url(${item.image})` }} /><div><strong>{item.name}</strong><span>{[42, 36, 28, 21][index]} sold this week</span></div><b>${[672, 576, 672, 231][index]}</b></div>)}</div></section></div>; }

export default App;