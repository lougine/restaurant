import './styles/App.css';
import './styles/layout.css';
import { useEffect, useState } from 'react';
import { MenuView, menuItems } from './components/Menu';
import { ReservationsView } from './components/Reservations';
import { StaffReservationsView } from './components/StaffReservations';
import { AboutView } from './components/About';
import { OwnerMenuAdmin } from './components/OwnerMenuAdmin';
import { Footer } from './components/footer';
import { TeamLogin } from './components/TeamLogin';
import { isRestaurantOpen } from './restaurantHours';
import { connectTeamSocket } from './teamSocket';
import './styles/Kitchen.css';
import './styles/Reports.css';

const API_ROOT = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

function todayString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function readSavedTeamUser() {
  try {
    const user = JSON.parse(window.localStorage.getItem('savor-auth-user') || 'null');
    return user && ['kitchen', 'owner'].includes(user.role) ? user : null;
  } catch (error) {
    return null;
  }
}

function App() {
  const [teamUser, setTeamUser] = useState(readSavedTeamUser);
  const [activeView, setActiveView] = useState(() => {
    const savedUser = readSavedTeamUser();
    return savedUser?.role === 'owner' ? 'Reports' : savedUser?.role === 'kitchen' ? 'Kitchen' : 'Menu';
  });
  const [loginOpen, setLoginOpen] = useState(false);
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
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [kitchenReservations, setKitchenReservations] = useState([]);
  const [kitchenReservationsError, setKitchenReservationsError] = useState('');
  const [toast, setToast] = useState('');
  const [restaurantOpen, setRestaurantOpen] = useState(isRestaurantOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const role = teamUser?.role === 'kitchen' ? 'staff' : teamUser?.role || 'customer';
  const isStaff = role === 'staff';
  const isOwner = role === 'owner';
  const activeOrderCount = orders.filter((order) => order.status !== 'served').length;
  const navigation = isOwner ? ['Menu', 'Kitchen', 'Reservations', 'Reports', 'Menu manager', 'About Us'] : isStaff ? ['Kitchen', 'Reservations'] : ['Menu', 'Reservations', 'About Us'];

  useEffect(() => {
    window.localStorage.setItem('savor-cart', JSON.stringify(cart));
    if (tableNumber) window.localStorage.setItem('savor-table-number', tableNumber);
    else window.localStorage.removeItem('savor-table-number');
  }, [cart, tableNumber]);

  useEffect(() => {
    const updateRestaurantStatus = () => setRestaurantOpen(isRestaurantOpen());
    const intervalId = window.setInterval(updateRestaurantStatus, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!teamUser || activeView !== 'Kitchen') return undefined;
    let cancelled = false;
    let socket;
    const token = window.localStorage.getItem('savor-auth-token') || '';
    const loadOrders = async () => {
      try {
        const response = await fetch(`${API_ROOT}/orders`, { headers: { Authorization: `Bearer ${window.localStorage.getItem('savor-auth-token') || ''}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load orders.');
        if (!cancelled) {
          setOrders(result);
          setOrdersError('');
        }
      } catch (error) {
        if (!cancelled) setOrdersError(error.message || 'Could not load orders.');
      }
    };
    const loadTodayReservations = async () => {
      try {
        const response = await fetch(`${API_ROOT}/reservations?date=${todayString()}`, { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load today’s reservations.');
        if (!cancelled) {
          setKitchenReservations(result);
          setKitchenReservationsError('');
        }
      } catch (error) {
        if (!cancelled) setKitchenReservationsError(error.message || 'Could not load today’s reservations.');
      }
    };

    loadOrders();
    loadTodayReservations();
    connectTeamSocket(token).then((connection) => {
      if (cancelled) {
        connection.disconnect();
        return;
      }
      socket = connection;
      socket.on('order:created', (order) => setOrders((current) => current.some((item) => item._id === order._id) ? current : [order, ...current]));
      socket.on('order:updated', (order) => setOrders((current) => current.map((item) => item._id === order._id ? order : item)));
      socket.on('reservation:created', (reservation) => {
        if (reservation.date === todayString()) setKitchenReservations((current) => current.some((item) => item._id === reservation._id) ? current : [...current, reservation].sort((first, second) => first.timeSlot.localeCompare(second.timeSlot)));
      });
      socket.on('connect', () => { loadOrders(); loadTodayReservations(); });
      socket.on('connect_error', (error) => { if (!cancelled) setOrdersError(error.message || 'Live order updates are unavailable.'); });
    }).catch((error) => { if (!cancelled) setOrdersError(error.message || 'Live order updates are unavailable.'); });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [teamUser, activeView]);

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

  async function placeOrder(orderDetails) {
    const response = await fetch(`${API_ROOT}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((item) => ({ name: item.name, price: Number(item.price), quantity: item.quantity })),
        fulfillment: orderDetails.fulfillment === 'here' ? 'table' : orderDetails.fulfillment,
        tableNumber: orderDetails.fulfillment === 'here' ? Number(orderDetails.tableNumber) : undefined,
        customerName: orderDetails.details.name || undefined,
        phone: orderDetails.details.phone || undefined,
        address: orderDetails.details.address || undefined,
        total: Number((cartTotal * 1.1).toFixed(2)),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Your order could not be sent. Please try again.');
    setCart([]);
    setTableNumber('');
    setToast('Order sent to the kitchen');
    window.setTimeout(() => setToast(''), 2600);
  }

  function handleTeamAccess() {
    setMobileMenuOpen(false);
    if (teamUser) {
      window.localStorage.removeItem('savor-auth-token');
      window.localStorage.removeItem('savor-auth-user');
      setTeamUser(null);
      setActiveView('Menu');
      return;
    }
    setLoginOpen(true);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-logo" src="/Logoo.png" alt="Savor Restaurant" /></div>
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen((current) => !current)} aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileMenuOpen}><span /><span /><span /></button>
        <div className={`venue-status ${restaurantOpen ? '' : 'closed'}`}><span className={`status-dot ${restaurantOpen ? '' : 'closed'}`} />{restaurantOpen ? 'Open now' : 'Closed'} <span className="status-time">until 11:00 PM</span></div>
        <nav className={`main-nav ${mobileMenuOpen ? 'mobile-nav-open' : ''}`} aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navigation.map((view) => <button key={view} className={`nav-item ${activeView === view ? 'active' : ''}`} onClick={() => { setActiveView(view); setMobileMenuOpen(false); }}><span className="nav-icon">{view === 'Menu' ? '▦' : view === 'Kitchen' ? '⌁' : view === 'Reservations' ? '◷' : view === 'Menu manager' ? '✎' : '◒'}</span>{view}{view === 'Kitchen' && activeOrderCount > 0 && <span className="nav-badge">{activeOrderCount}</span>}</button>)}
          <button className="team-menu-login" type="button" onClick={handleTeamAccess}>{teamUser ? 'Sign out' : 'Staff / Owner sign in'}</button>
        </nav>
        <div className="header-links">
          <button className="team-login-trigger" type="button" onClick={handleTeamAccess}>{teamUser ? 'Sign out' : 'Team sign in'}</button>
          {!isStaff && <button className="book-table-nav" onClick={() => setActiveView('Reservations')}>Book a table <span>↗</span></button>}
        </div>
      </aside>

      <main className={`content ${activeView === 'Reservations' ? 'content-reservations' : ''}`}>
        <header className="topbar"><div className="mobile-brand"><img className="brand-logo" src="/Logoo.png" alt="Savor Restaurant" /></div><div className="breadcrumbs"> savor <span>/</span> {activeView.toUpperCase()}</div><div className="top-actions">{!isStaff && <button className="cart-top-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}><span aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M3 5h2l2.2 10.5h10.9L21 8H6" /><path d="M9 19h.01M18 19h.01" /></svg></span><b>{cartCount}</b></button>}</div></header>

        {activeView === 'Menu' && <MenuView category={category} setCategory={setCategory} addToCart={addToCart} menuItems={managedMenu} cart={cart} cartCount={cartCount} cartTotal={cartTotal} tableNumber={tableNumber} setTableNumber={setTableNumber} changeQuantity={changeQuantity} placeOrder={placeOrder} cartOpen={cartOpen} setCartOpen={setCartOpen} />}
        {activeView === 'Kitchen' && <KitchenView orders={orders} setOrders={setOrders} error={ordersError} reservations={kitchenReservations} reservationsError={kitchenReservationsError} />}
        {activeView === 'Reservations' && (isStaff || isOwner ? <StaffReservationsView /> : <ReservationsView />)}
        {activeView === 'About Us' && <AboutView onNavigate={setActiveView} />}
        {activeView === 'Reports' && <ReportsView />}
        {activeView === 'Menu manager' && isOwner && <OwnerMenuAdmin items={managedMenu} setItems={setManagedMenu} />}

        <Footer isOpen={restaurantOpen} />
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
      {loginOpen && <TeamLogin onClose={() => setLoginOpen(false)} onAuthenticated={(user) => { setTeamUser(user); setActiveView(user.role === 'owner' ? 'Reports' : 'Kitchen'); setLoginOpen(false); }} />}
    </div>
  );
}

function KitchenView({ orders, setOrders, error, reservations, reservationsError }) {
  const [updateError, setUpdateError] = useState('');
  const columns = [
    { status: 'pending', label: 'New', next: 'preparing', action: 'Mark in progress' },
    { status: 'preparing', label: 'In progress', next: 'ready', action: 'Mark ready' },
    { status: 'ready', label: 'Ready' },
    { status: 'served', label: 'Served' },
  ];

  async function updateStatus(order, status) {
    setUpdateError('');
    try {
      const response = await fetch(`${API_ROOT}/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${window.localStorage.getItem('savor-auth-token') || ''}` },
        body: JSON.stringify({ status }),
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message || 'Order status could not be updated.');
      setOrders((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (statusError) {
      setUpdateError(statusError.message || 'Order status could not be updated.');
    }
  }

  return <div className="kitchen-page">
    <section className="page-heading compact"><div><p className="eyebrow">Service dashboard <span className="live-pill"><i /> Live orders</span></p><h1>Kitchen <em>display.</em></h1><p className="heading-copy">Orders appear here after customers submit them.</p></div><div className="kitchen-summary"><strong>{orders.filter((order) => order.status !== 'served').length || ''}</strong><span>active orders</span></div></section>
    <section className="kitchen-board"><div className="board-top"><h2>Customer orders</h2></div>
      {(error || updateError) && <p className="staff-data-error" role="alert">{updateError || error}</p>}
      <div className="order-columns">{columns.map((column) => {
        const columnOrders = orders.filter((order) => order.status === column.status);
        return <div className="order-column" key={column.status}>
          <div className="column-heading"><span className={`status-marker ${column.status}`} />{column.label}<span>{columnOrders.length}</span></div>
          {columnOrders.map((order) => <article className="order-card" key={order._id}>
            <div className="order-card-top"><strong>#{order._id.slice(-6).toUpperCase()}</strong><span>{new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
            <div className={`order-fulfillment order-fulfillment-${order.fulfillment}`}>
              {order.fulfillment === 'table' ? `For table ${order.tableNumber}` : order.fulfillment === 'delivery' ? `Delivery · ${order.customerName || 'Customer'}` : `Pickup · ${order.customerName || 'Customer'}`}
            </div>
            {order.phone && <p className="order-customer-contact">{order.phone}</p>}
            {order.address && <p className="order-customer-address">{order.address}</p>}
            <p>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}</p>
            <div className="order-card-foot"><strong>EGP {Number(order.total).toFixed(2)}</strong>{column.next ? <button onClick={() => updateStatus(order, column.next)}>{column.action} →</button> : <span className="ready-label">✓ Complete</span>}</div>
          </article>)}
          {!columnOrders.length && <p className="empty-order-column">No orders</p>}
        </div>;
      })}</div>
    </section>
    <section className="kitchen-reservations">
      <div className="kitchen-reservations-heading"><div><p className="eyebrow">Live bookings</p><h2>Today’s reservations</h2></div><span>{reservations.length} reservation{reservations.length === 1 ? '' : 's'}</span></div>
      {reservationsError && <p className="staff-data-error" role="alert">{reservationsError}</p>}
      {reservations.length ? <div className="kitchen-reservation-list">{reservations.map((reservation) => <article className="kitchen-reservation-card" key={reservation._id}>
        <strong>{reservation.timeSlot}</strong><div><b>{reservation.name}</b><span>Table {reservation.tableNumber} · {reservation.guests} guest{reservation.guests === 1 ? '' : 's'}</span>{reservation.phone && <a href={`tel:${reservation.phone}`}>{reservation.phone}</a>}</div>
      </article>)}</div> : <p className="empty-order-column">No reservations for today</p>}
    </section>
  </div>;
}

function ReportsView() { return <div className="reports-page"><section className="page-heading compact"><div><p className="eyebrow">Owner overview <span className="live-pill"><i /> Updated just now</span></p><h1>Good evening, <em>Emma.</em></h1><p className="heading-copy">Here is how  savor is doing today.</p></div><button className="outline-button">↓ Export report</button></section><section className="metric-grid"><div className="metric-card accent"><span>Net sales</span><strong>EGP 4,286.40</strong><small>↑ 12.8% <em>vs. last Tuesday</em></small><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /><i /></div></div><div className="metric-card"><span>Orders</span><strong>86</strong><small>↑ 8.2% <em>vs. last Tuesday</em></small><div className="metric-icon">▦</div></div><div className="metric-card"><span>Avg. order value</span><strong>EGP 49.84</strong><small>↑ 3.4% <em>vs. last Tuesday</em></small><div className="metric-icon">⌁</div></div><div className="metric-card"><span>Table occupancy</span><strong>78%</strong><small>↑ 6.1% <em>vs. last Tuesday</em></small><div className="metric-icon">◷</div></div></section><section className="report-lower"><div className="sales-card"><div className="section-title"><h2>Sales overview</h2><button className="period-button">This week ⌄</button></div><div className="chart"><div className="chart-y"><span>EGP 6k</span><span>EGP 4k</span><span>EGP 2k</span><span>EGP 0</span></div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 650 180" preserveAspectRatio="none" aria-label="Sales chart"><path d="M0 145 C 50 136, 64 104, 108 121 S 167 145, 205 98 S 260 76, 298 111 S 349 125, 390 72 S 442 53, 480 74 S 535 97, 570 36 S 616 61, 650 18" fill="none" stroke="#dd6b45" strokeWidth="3" /><path d="M0 145 C 50 136, 64 104, 108 121 S 167 145, 205 98 S 260 76, 298 111 S 349 125, 390 72 S 442 53, 480 74 S 535 97, 570 36 S 616 61, 650 18 L650 180 L0 180Z" fill="url(#fade)" /><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dd6b45" stopOpacity=".18" /><stop offset="1" stopColor="#dd6b45" stopOpacity="0" /></linearGradient></defs></svg><div className="chart-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div></div><div className="popular-card"><div className="section-title"><h2>Top sellers</h2><button className="text-button">View menu →</button></div>{menuItems.slice(0, 4).map((item, index) => <div className="top-seller" key={item.id}><span className="rank">0{index + 1}</span><div className="mini-food" style={{ backgroundImage: `url(${item.image})` }} /><div><strong>{item.name}</strong><span>{[42, 36, 28, 21][index]} sold this week</span></div><b>EGP {[672, 576, 672, 231][index]}</b></div>)}</div></section></div>; }

export default App;
