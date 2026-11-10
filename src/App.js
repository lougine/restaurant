import './styles/App.css';
import './styles/layout.css';
import { useEffect, useMemo, useState } from 'react';
import { MenuView, menuItems } from './components/Menu';
import { ReservationsView } from './components/Reservations';
import { StaffReservationsView } from './components/StaffReservations';
import { AboutView } from './components/About';
import { OwnerMenuAdmin } from './components/OwnerMenuAdmin';
import { OwnerQRCodes } from './components/OwnerQRCodes';
import { Footer } from './components/footer';
import { TeamLogin } from './components/TeamLogin';
import { isRestaurantOpen } from './restaurantHours';
import { connectTeamSocket } from './teamSocket';
import './styles/Kitchen.css';
import './styles/Reports.css';

const API_ROOT = (process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api')).replace(/\/$/, '');

function mergeMenuRecords(records) {
  const keyFor = (name) => String(name || '').trim().toLowerCase();
  const bySourceId = new Map(records.filter((item) => item.sourceId !== undefined).map((item) => [Number(item.sourceId), item]));
  const byName = new Map(records.map((item) => [keyFor(item.name), item]));
  const used = new Set();
  const restoredDefaults = menuItems.filter((item) => {
    const saved = bySourceId.get(Number(item.id)) || byName.get(keyFor(item.name));
    return !saved || saved.isAvailable !== false;
  }).map((item) => {
    const saved = bySourceId.get(Number(item.id)) || byName.get(keyFor(item.name));
    if (!saved) return item;
    used.add(saved._id);
    return {
      ...item,
      ...saved,
      id: saved.sourceId ?? item.id ?? saved._id,
      image: saved.imageUrl || saved.image || item.image,
      ingredients: saved.ingredients || item.ingredients || [],
      allergens: saved.allergens || item.allergens || [],
      tag: saved.tag || item.tag,
    };
  });
  const addedItems = records.filter((item) => item.isAvailable !== false && !used.has(item._id) && !menuItems.some((base) => keyFor(base.name) === keyFor(item.name)))
    .map((item) => ({ ...item, id: item.sourceId ?? item._id, image: item.imageUrl || item.image || '' }));
  return [...restoredDefaults, ...addedItems];
}

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

function isMenuQRLink() {
  return new URLSearchParams(window.location.search).get('menu') === '1';
}

function App() {
  const [teamUser, setTeamUser] = useState(() => isMenuQRLink() ? null : readSavedTeamUser());
  const [activeView, setActiveView] = useState(() => {
    if (isMenuQRLink()) return 'Menu';
    const savedUser = readSavedTeamUser();
    return savedUser?.role === 'owner' ? 'Reports' : savedUser?.role === 'kitchen' ? 'Kitchen' : 'Menu';
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const [managedMenu, setManagedMenu] = useState(menuItems);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('savor-cart') || '[]');
    } catch (error) {
      return [];
    }
  });
  const [tableNumber, setTableNumber] = useState(() => new URLSearchParams(window.location.search).get('menu') === '1' ? '' : window.localStorage.getItem('savor-table-number') || '');
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
  const navigation = isOwner ? ['Kitchen', 'Reservations', 'Reports', 'Menu manager', 'QR Code'] : isStaff ? ['Kitchen', 'Reservations'] : ['Menu', 'Reservations', 'About Us'];

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_ROOT}/menu`).then(async (response) => {
      const records = await response.json();
      if (!response.ok) throw new Error('Could not load the menu.');
      if (!cancelled && records.length) setManagedMenu(mergeMenuRecords(records));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
          {navigation.map((view) => <button key={view} className={`nav-item ${activeView === view ? 'active' : ''}`} onClick={() => { setActiveView(view); setMobileMenuOpen(false); }}><span className="nav-icon">{view === 'Menu' ? '▦' : view === 'Kitchen' ? '⌁' : view === 'Reservations' ? '◷' : view === 'Menu manager' ? '✎' : view === 'QR Code' ? '▧' : '◒'}</span>{view}{view === 'Kitchen' && activeOrderCount > 0 && <span className="nav-badge">{activeOrderCount}</span>}</button>)}
          <button className="team-menu-login" type="button" onClick={handleTeamAccess}>{teamUser ? 'Sign out' : 'Staff / Owner sign in'}</button>
        </nav>
        <div className="header-links">
          <button className="team-login-trigger" type="button" onClick={handleTeamAccess}>{teamUser ? 'Sign out' : 'Team sign in'}</button>
          {!isStaff && !isOwner && <button className="book-table-nav" onClick={() => setActiveView('Reservations')}>Book a table <span>↗</span></button>}
        </div>
      </aside>

      <main className={`content ${activeView === 'Reservations' ? 'content-reservations' : ''}`}>
        <header className="topbar"><div className="mobile-brand"><img className="brand-logo" src="/Logoo.png" alt="Savor Restaurant" /></div><div className="breadcrumbs"> savor <span>/</span> {activeView.toUpperCase()}</div><div className="top-actions">{!isStaff && !isOwner && <button className="cart-top-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}><span aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M3 5h2l2.2 10.5h10.9L21 8H6" /><path d="M9 19h.01M18 19h.01" /></svg></span><b>{cartCount}</b></button>}</div></header>

        {activeView === 'Menu' && <MenuView category={category} setCategory={setCategory} addToCart={addToCart} menuItems={managedMenu} cart={cart} cartCount={cartCount} cartTotal={cartTotal} tableNumber={tableNumber} setTableNumber={setTableNumber} changeQuantity={changeQuantity} placeOrder={placeOrder} cartOpen={cartOpen} setCartOpen={setCartOpen} restaurantOpen={restaurantOpen} />}
        {activeView === 'Kitchen' && <KitchenView orders={orders} setOrders={setOrders} error={ordersError} reservations={kitchenReservations} reservationsError={kitchenReservationsError} />}
        {activeView === 'Reservations' && (isStaff || isOwner ? <StaffReservationsView /> : <ReservationsView />)}
        {activeView === 'About Us' && <AboutView onNavigate={setActiveView} />}
        {activeView === 'Reports' && <ReportsView menuItems={managedMenu} />}
        {activeView === 'Menu manager' && isOwner && <OwnerMenuAdmin items={managedMenu} setItems={setManagedMenu} />}
        {activeView === 'QR Code' && isOwner && <OwnerQRCodes />}

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

function ReportsView({ menuItems: availableMenuItems }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItemKey, setSelectedItemKey] = useState('');
  const [reportMode, setReportMode] = useState('day');
  const [reportDate, setReportDate] = useState(todayString);
  const [rangeStart, setRangeStart] = useState(todayString);
  const [rangeEnd, setRangeEnd] = useState(todayString);

  useEffect(() => {
    let cancelled = false;
    let socket;
    const token = window.localStorage.getItem('savor-auth-token') || '';
    const loadOrders = async () => {
      try {
        const response = await fetch(`${API_ROOT}/orders`, { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load sales data.');
        if (!cancelled) { setOrders(result); setError(''); }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Could not load sales data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrders();
    connectTeamSocket(token).then((connection) => {
      if (cancelled) { connection.disconnect(); return; }
      socket = connection;
      socket.on('order:created', (order) => setOrders((current) => current.some((item) => item._id === order._id) ? current : [order, ...current]));
      socket.on('connect', loadOrders);
      socket.on('connect_error', (socketError) => { if (!cancelled) setError(socketError.message || 'Live sales updates are unavailable.'); });
    }).catch((socketError) => { if (!cancelled) setError(socketError.message || 'Live sales updates are unavailable.'); });

    return () => { cancelled = true; socket?.disconnect(); };
  }, []);

  const { firstDay, previousFirstDay, tomorrow, dayKeys, previousOrders, weekOrders } = useMemo(() => {
    const currentDay = new Date();
    currentDay.setHours(0, 0, 0, 0);
    const currentFirstDay = new Date(currentDay);
    currentFirstDay.setDate(currentFirstDay.getDate() - 6);
    const priorFirstDay = new Date(currentFirstDay);
    priorFirstDay.setDate(priorFirstDay.getDate() - 7);
    const nextDay = new Date(currentDay);
    nextDay.setDate(nextDay.getDate() + 1);
    const currentDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(currentFirstDay);
      day.setDate(day.getDate() + index);
      return day;
    });
    const previousPeriod = orders.filter((order) => {
      const created = new Date(order.createdAt);
      return created >= priorFirstDay && created < currentFirstDay;
    });
    const currentPeriod = orders.filter((order) => {
      const created = new Date(order.createdAt);
      return created >= currentFirstDay && created < nextDay;
    });
    return { firstDay: currentFirstDay, previousFirstDay: priorFirstDay, tomorrow: nextDay, dayKeys: currentDays, previousOrders: previousPeriod, weekOrders: currentPeriod };
  }, [orders]);

  const reportStart = useMemo(() => {
    const [year, month, day] = (reportMode === 'day' ? reportDate : rangeStart).split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [reportDate, reportMode, rangeStart]);
  const reportEnd = useMemo(() => {
    const [year, month, day] = (reportMode === 'day' ? reportDate : rangeEnd).split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [rangeEnd, reportDate, reportMode]);
  const reportEndExclusive = new Date(reportEnd);
  reportEndExclusive.setDate(reportEndExclusive.getDate() + 1);
  const periodOrders = orders.filter((order) => {
    const created = new Date(order.createdAt);
    return created >= reportStart && created < reportEndExclusive;
  });
  const periodSales = periodOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const periodItemCount = periodOrders.reduce((sum, order) => sum + order.items.reduce((orderSum, item) => orderSum + Number(item.quantity || 0), 0), 0);
  const periodAverageOrder = periodOrders.length ? periodSales / periodOrders.length : 0;
  const periodFulfillment = { table: 0, pickup: 0, delivery: 0 };
  periodOrders.forEach((order) => { periodFulfillment[order.fulfillment || 'table'] += 1; });
  const reportDays = [];
  for (let date = new Date(reportStart); date <= reportEnd; date.setDate(date.getDate() + 1)) reportDays.push(new Date(date));
  const chartValues = reportMode === 'day' ? Array(24).fill(0) : reportDays.map(() => 0);
  periodOrders.forEach((order) => {
    const created = new Date(order.createdAt);
    if (reportMode === 'day') chartValues[created.getHours()] += Number(order.total || 0);
    else {
      const dayIndex = Math.floor((new Date(created.getFullYear(), created.getMonth(), created.getDate()) - reportStart) / 86_400_000);
      if (dayIndex >= 0 && dayIndex < chartValues.length) chartValues[dayIndex] += Number(order.total || 0);
    }
  });
  const maxChartSales = Math.max(...chartValues, 1);
  const chartPoints = chartValues.map((sales, index) => ({ x: chartValues.length > 1 ? index * (650 / (chartValues.length - 1)) : 325, y: 160 - (sales / maxChartSales) * 135 }));
  const chartLine = chartPoints.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const chartArea = `${chartLine} L650 180 L0 180Z`;
  const dateLabel = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const reportPeriodLabel = reportMode === 'day' ? reportStart.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : `${dateLabel(reportStart)}–${dateLabel(reportEnd)}, ${reportEnd.getFullYear()}`;
  const rangeTickIndexes = [...new Set([0, Math.round((reportDays.length - 1) / 3), Math.round(2 * (reportDays.length - 1) / 3), reportDays.length - 1])];
  const money = (amount) => `EGP ${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const dateRange = (start, end) => `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${new Date(end.getTime() - 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

  const itemDiagnostics = useMemo(() => {
    const keyFor = (name) => name.trim().toLowerCase();
    const diagnostics = new Map();
    availableMenuItems.forEach((item) => diagnostics.set(keyFor(item.name), {
      key: keyFor(item.name), name: item.name, image: item.image || item.imageUrl || '', category: item.category || 'Menu item',
      current: { quantity: 0, revenue: 0, orderIds: new Set(), fulfillment: { table: 0, pickup: 0, delivery: 0 }, daily: Array(7).fill(0) },
      previous: { quantity: 0, revenue: 0, orderIds: new Set(), fulfillment: { table: 0, pickup: 0, delivery: 0 }, daily: Array(7).fill(0) },
    }));
    const currentDayIndexes = new Map(dayKeys.map((day, index) => [`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`, index]));
    const previousDayIndexes = new Map(dayKeys.map((day, index) => {
      const previousDay = new Date(day);
      previousDay.setDate(previousDay.getDate() - 7);
      return [`${previousDay.getFullYear()}-${previousDay.getMonth()}-${previousDay.getDate()}`, index];
    }));

    [...previousOrders, ...weekOrders].forEach((order) => {
      const created = new Date(order.createdAt);
      const isCurrent = created >= firstDay && created < tomorrow;
      const period = isCurrent ? 'current' : 'previous';
      const orderDay = new Date(created);
      orderDay.setHours(0, 0, 0, 0);
      const dayKey = `${orderDay.getFullYear()}-${orderDay.getMonth()}-${orderDay.getDate()}`;
      const dayIndex = (isCurrent ? currentDayIndexes : previousDayIndexes).get(dayKey);
      order.items.forEach((line) => {
        const key = keyFor(line.name);
        if (!diagnostics.has(key)) diagnostics.set(key, {
          key, name: line.name, image: '', category: 'Past menu item',
          current: { quantity: 0, revenue: 0, orderIds: new Set(), fulfillment: { table: 0, pickup: 0, delivery: 0 }, daily: Array(7).fill(0) },
          previous: { quantity: 0, revenue: 0, orderIds: new Set(), fulfillment: { table: 0, pickup: 0, delivery: 0 }, daily: Array(7).fill(0) },
        });
        const stats = diagnostics.get(key)[period];
        const quantity = Number(line.quantity || 0);
        stats.quantity += quantity;
        stats.revenue += Number(line.price || 0) * quantity;
        stats.orderIds.add(order._id);
        stats.fulfillment[order.fulfillment || 'table'] += quantity;
        if (dayIndex !== undefined) stats.daily[dayIndex] += quantity;
      });
    });

    return [...diagnostics.values()].map((item) => ({
      ...item,
      current: { ...item.current, orders: item.current.orderIds.size },
      previous: { ...item.previous, orders: item.previous.orderIds.size },
    })).sort((first, second) => second.current.revenue - first.current.revenue || second.current.quantity - first.current.quantity || first.name.localeCompare(second.name));
  }, [availableMenuItems, dayKeys, firstDay, previousOrders, tomorrow, weekOrders]);

  const selectedItem = itemDiagnostics.find((item) => item.key === selectedItemKey);
  const numberChange = (current, previous) => {
    if (!previous) return current ? { label: 'New this week', direction: 'up' } : { label: 'No orders in either week', direction: 'flat' };
    if (current === previous) return { label: 'No change from last week', direction: 'flat' };
    const percent = Math.round(Math.abs((current - previous) / previous) * 100);
    return current > previous ? { label: `${percent}% more than last week`, direction: 'up' } : { label: `${percent}% less than last week`, direction: 'down' };
  };

  return <div className="reports-page">
    <section className="page-heading compact"><div><p className="eyebrow">Owner overview <span className="live-pill"><i /> Live order data</span></p><h1>Sales <em>reports.</em></h1><p className="heading-copy">Choose one day or a date range for actual order totals.</p></div><div className="reports-date-controls">
      <div className="reports-mode-toggle" role="group" aria-label="Report period"><button type="button" className={reportMode === 'day' ? 'selected' : ''} aria-pressed={reportMode === 'day'} onClick={() => setReportMode('day')}>One day</button><button type="button" className={reportMode === 'range' ? 'selected' : ''} aria-pressed={reportMode === 'range'} onClick={() => setReportMode('range')}>Date range</button></div>
      {reportMode === 'day' ? <label className="reports-date-filter">Report date<input type="date" value={reportDate} max={todayString()} onChange={(event) => event.target.value && setReportDate(event.target.value)} /></label> : <div className="reports-range-filter"><label className="reports-date-filter">From<input type="date" value={rangeStart} min="2000-01-01" max={rangeEnd} onChange={(event) => { const value = event.target.value; if (!value) return; setRangeStart(value); if (value > rangeEnd) setRangeEnd(value); }} /></label><label className="reports-date-filter">To<input type="date" value={rangeEnd} min={rangeStart} max={todayString()} onChange={(event) => { const value = event.target.value; if (!value) return; setRangeEnd(value); if (value < rangeStart) setRangeStart(value); }} /></label></div>}
    </div></section>
    {error && <p className="staff-data-error" role="alert">{error}</p>}
    <section className="metric-grid">
      <div className="metric-card accent"><span>Sales in period</span><strong>{loading ? '—' : money(periodSales)}</strong><small>{reportPeriodLabel}</small><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
      <div className="metric-card"><span>Orders</span><strong>{loading ? '—' : periodOrders.length}</strong><small>Selected period</small><div className="metric-icon">▦</div></div>
      <div className="metric-card"><span>Avg. order value</span><strong>{loading ? '—' : money(periodAverageOrder)}</strong><small>Sales ÷ orders</small><div className="metric-icon">⌁</div></div>
      <div className="metric-card"><span>Items ordered</span><strong>{loading ? '—' : periodItemCount}</strong><small>Selected period</small><div className="metric-icon">◒</div></div>
    </section>
    <section className="report-lower">
      <div className="sales-card"><div className="section-title"><h2>{reportMode === 'day' ? 'Sales by hour' : 'Sales by day'}</h2><span>{reportPeriodLabel}</span></div>
        <div className="chart"><div className="chart-y">{[3, 2, 1, 0].map((step) => <span key={step}>{money(maxChartSales * step / 3)}</span>)}</div><div className="chart-area"><div className="grid-lines"><i /><i /><i /><i /></div>
          <svg viewBox="0 0 650 180" preserveAspectRatio="none" aria-label={reportMode === 'day' ? 'Sales by hour chart' : 'Sales by day chart'}><path d={chartLine} fill="none" stroke="#dd6b45" strokeWidth="3" /><path d={chartArea} fill="url(#salesFade)" /><defs><linearGradient id="salesFade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dd6b45" stopOpacity=".18" /><stop offset="1" stopColor="#dd6b45" stopOpacity="0" /></linearGradient></defs></svg>
          <div className="chart-x">{reportMode === 'day' ? <><span>12 AM</span><span>4 AM</span><span>8 AM</span><span>12 PM</span><span>4 PM</span><span>8 PM</span><span>11 PM</span></> : rangeTickIndexes.map((index) => <span key={index}>{dateLabel(reportDays[index])}</span>)}</div>
        </div></div>
        <div className="daily-fulfillment-summary"><span>Table <strong>{periodFulfillment.table}</strong></span><span>Pickup <strong>{periodFulfillment.pickup}</strong></span><span>Delivery <strong>{periodFulfillment.delivery}</strong></span></div>
      </div>
      <div className="popular-card diagnostics-list"><div className="section-title"><h2>Item diagnostics</h2><span>Click any item</span></div>
        <p className="diagnostics-period">This week {dateRange(firstDay, tomorrow)} · Previous {dateRange(previousFirstDay, firstDay)}</p>
        {loading ? <p className="staff-reservation-empty">Loading customer orders…</p> : itemDiagnostics.length ? itemDiagnostics.map((item, index) => {
          const change = numberChange(item.current.quantity, item.previous.quantity);
          return <button className="diagnostic-item" type="button" key={item.key} onClick={() => setSelectedItemKey(item.key)}>
            <span className="rank">{String(index + 1).padStart(2, '0')}</span><span className="mini-food" style={item.image ? { backgroundImage: `url(${item.image})` } : undefined} />
            <span className="diagnostic-item-info"><strong>{item.name}</strong><small>{item.category} · {item.current.quantity} sold · {money(item.current.revenue)}</small><small className={`diagnostic-change ${change.direction}`}>{change.label}</small></span><span className="diagnostic-chevron">›</span>
          </button>;
        }) : <p className="staff-reservation-empty">No menu items are available to report.</p>}
      </div>
    </section>
    {selectedItem && <ItemDiagnosticsModal item={selectedItem} days={dayKeys} money={money} compare={numberChange} onClose={() => setSelectedItemKey('')} />}
  </div>;
}

function ItemDiagnosticsModal({ item, days, money, compare, onClose }) {
  useEffect(() => {
    function closeOnEscape(event) { if (event.key === 'Escape') onClose(); }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const qtyChange = compare(item.current.quantity, item.previous.quantity);
  const salesChange = compare(item.current.revenue, item.previous.revenue);
  const maxDaily = Math.max(1, ...item.current.daily, ...item.previous.daily);
  const periodRange = (start) => {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  return <div className="diagnostic-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="diagnostic-dialog" role="dialog" aria-modal="true" aria-labelledby="diagnostic-title">
      <button className="diagnostic-close" type="button" onClick={onClose} aria-label="Close item report">×</button>
      <p className="eyebrow">Item sales report · {item.category}</p><h2 id="diagnostic-title">{item.name}</h2>
      <p className={`diagnostic-verdict ${qtyChange.direction}`}>{qtyChange.label}{item.previous.quantity ? ` · ${item.previous.quantity} sold last week` : ''}</p>
      <div className="diagnostic-metrics">
        <div><span>Units sold</span><strong>{item.current.quantity}</strong><small>{item.previous.quantity} last week · {qtyChange.label}</small></div>
        <div><span>Item sales</span><strong>{money(item.current.revenue)}</strong><small>{money(item.previous.revenue)} last week · {salesChange.label}</small></div>
        <div><span>Orders containing item</span><strong>{item.current.orders}</strong><small>{item.previous.orders} last week</small></div>
        <div><span>Average selling price</span><strong>{money(item.current.quantity ? item.current.revenue / item.current.quantity : 0)}</strong><small>Per unit this week</small></div>
      </div>
      <section className="diagnostic-daily"><div className="diagnostic-section-heading"><h3>Units sold each day</h3><span>Previous week · This week</span></div>
        <div className="diagnostic-bars">{days.map((day, index) => <div className="diagnostic-day" key={day.toISOString()}><div className="diagnostic-bar-pair"><i className="previous" style={{ height: `${Math.max(3, item.previous.daily[index] / maxDaily * 100)}%` }} title={`${item.previous.daily[index]} last week`} /><i className="current" style={{ height: `${Math.max(3, item.current.daily[index] / maxDaily * 100)}%` }} title={`${item.current.daily[index]} this week`} /></div><small>{day.toLocaleDateString(undefined, { weekday: 'short' })}</small></div>)}</div>
      </section>
      <section className="diagnostic-fulfillment"><div className="diagnostic-section-heading"><h3>Fulfillment mix this week</h3><span>{periodRange(days[0])}</span></div>
        <div className="fulfillment-stats">{[['Table', 'table'], ['Pickup', 'pickup'], ['Delivery', 'delivery']].map(([label, key]) => <div key={key}><span>{label}</span><strong>{item.current.fulfillment[key]} units</strong></div>)}</div>
      </section>
    </section>
  </div>;
}

export default App;
