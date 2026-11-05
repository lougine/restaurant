import { useEffect, useState } from 'react';
import '../styles/StaffReservations.css';
import { connectTeamSocket } from '../teamSocket';

const API_ROOT = (process.env.REACT_APP_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const TIMES = ['5:30 pm', '6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm', '8:15 pm'];
const TABLES = [1, 2, 3, 4, 5, 6, 7, 8];

function todayString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function StaffReservationsView() {
  const [date, setDate] = useState(todayString);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState(TIMES[0]);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const selectedReservation = reservations.find((reservation) => reservation._id === selectedReservationId);
  const reservationsAtTime = reservations.filter((reservation) => reservation.timeSlot === selectedTime);

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
      <div className="staff-reservation-filters">
        <label className="staff-reservation-date">Choose date<input type="date" value={date} onChange={(event) => { setDate(event.target.value); setSelectedReservationId(''); }} /></label>
        <fieldset className="staff-reservation-times"><legend>Choose time</legend>{TIMES.map((time) => <button type="button" key={time} className={selectedTime === time ? 'selected' : ''} onClick={() => { setSelectedTime(time); setSelectedReservationId(''); }}>{time}</button>)}</fieldset>
      </div>
    </section>
    <section className="staff-reservation-board">
      <div className="staff-reservation-board-heading"><h2>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h2><span>{reservations.length} reservation{reservations.length === 1 ? '' : 's'}</span></div>
      {error && <p className="staff-data-error" role="alert">{error}</p>}
      {loading ? <p className="staff-reservation-empty">Loading reservations…</p> : <div className="staff-table-view">
        <div className="staff-floor-layout" aria-label={`Table reservations for ${selectedTime}`}>
          <div className="staff-floor-label">Dining room · {selectedTime}</div>
          <div className="staff-floor-tables">{TABLES.map((table) => {
            const reservation = reservationsAtTime.find((item) => Number(item.tableNumber) === table);
            return <button type="button" key={table} className={`staff-floor-table ${reservation ? 'reserved' : ''} ${selectedReservationId === reservation?._id ? 'selected' : ''}`} onClick={() => setSelectedReservationId(reservation?._id || '')} aria-pressed={Boolean(reservation && selectedReservationId === reservation._id)}>
              <span>Table {table}</span><small>{reservation ? 'Reserved' : 'Available'}</small>
            </button>;
          })}</div>
          <div className="staff-floor-legend"><span><i className="reserved" /> Reserved</span><span><i /> Available</span></div>
        </div>
        <aside className="staff-table-details" aria-live="polite">
          {selectedReservation ? <><p className="eyebrow">Reservation details</p><h3>{selectedReservation.name}</h3><p>Table {selectedReservation.tableNumber} · {selectedReservation.guests} guest{selectedReservation.guests === 1 ? '' : 's'}</p><strong>{selectedReservation.timeSlot}</strong>{selectedReservation.phone && <a href={`tel:${selectedReservation.phone}`}>{selectedReservation.phone}</a>}<span className="staff-reservation-status">Confirmed</span></> : <div className="staff-table-hint"><span>◷</span><p>Select a reserved table to see the customer’s details.</p></div>}
        </aside>
      </div>}
      {!loading && !reservations.length && <p className="staff-reservation-empty">No reservations were made for this date.</p>}
    </section>
  </div>;
}
