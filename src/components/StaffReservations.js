import { useEffect, useState } from 'react';
import '../styles/StaffReservations.css';
import { connectTeamSocket } from '../teamSocket';

const API_ROOT = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

function todayString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function StaffReservationsView() {
  const [date, setDate] = useState(todayString);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let socket;
    const token = window.localStorage.getItem('savor-auth-token') || '';
    const loadReservations = async () => {
      try {
        const response = await fetch(`${API_ROOT}/reservations?date=${encodeURIComponent(date)}`, {
          headers: { Authorization: `Bearer ${window.localStorage.getItem('savor-auth-token') || ''}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load reservations.');
        if (!cancelled) {
          setReservations(result);
          setError('');
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Could not load reservations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    loadReservations();
    connectTeamSocket(token).then((connection) => {
      if (cancelled) {
        connection.disconnect();
        return;
      }
      socket = connection;
      socket.on('reservation:created', (reservation) => {
        if (reservation.date !== date) return;
        setReservations((current) => current.some((item) => item._id === reservation._id)
          ? current
          : [...current, reservation].sort((first, second) => first.timeSlot.localeCompare(second.timeSlot)));
      });
      socket.on('connect', loadReservations);
      socket.on('connect_error', (socketError) => { if (!cancelled) setError(socketError.message || 'Live reservation updates are unavailable.'); });
    }).catch((socketError) => { if (!cancelled) setError(socketError.message || 'Live reservation updates are unavailable.'); });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [date]);

  return <div className="staff-reservations-page">
    <section className="page-heading compact">
      <div>
        <p className="eyebrow">Staff workspace</p>
        <h1>Reservations <em>booked.</em></h1>
        <p className="heading-copy">Every customer reservation for the selected date.</p>
      </div>
      <label className="staff-reservation-date">Choose date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
    </section>
    <section className="staff-reservation-board">
      <div className="staff-reservation-board-heading"><h2>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2><span>{reservations.length} reservation{reservations.length === 1 ? '' : 's'}</span></div>
      {error && <p className="staff-data-error" role="alert">{error}</p>}
      {loading ? <p className="staff-reservation-empty">Loading reservations…</p> : reservations.length ? <div className="staff-reservation-list">
        {reservations.map((reservation) => <article className="staff-reservation-card" key={reservation._id}>
          <div className="staff-reservation-time">{reservation.timeSlot}</div>
          <div className="staff-reservation-details">
            <h3>{reservation.name}</h3>
            <p>Table {reservation.tableNumber} <span>·</span> {reservation.guests} guest{reservation.guests === 1 ? '' : 's'}</p>
            {reservation.phone && <a href={`tel:${reservation.phone}`}>{reservation.phone}</a>}
          </div>
          <span className="staff-reservation-status">Confirmed</span>
        </article>)}
      </div> : <p className="staff-reservation-empty">No reservations were made for this date.</p>}
    </section>
  </div>;
}
