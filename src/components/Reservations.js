import { useEffect, useState } from 'react';
import '../styles/Reservations.css';

const API_ROOT = (process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api')).replace(/\/$/, '');
const times = ['5:30 pm', '6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm', '8:15 pm'];
const tables = [1, 2, 3, 4, 5, 6, 7, 8];

function todayString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function validName(name) {
  return name.trim().split(/\s+/).filter((part) => part.length >= 2).length >= 2;
}

function validPhone(phone) {
  return /^\d{11}$/.test(phone);
}

export function ReservationsView() {
  const [selectedTime, setSelectedTime] = useState('7:00 pm');
  const [selectedTable, setSelectedTable] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', date: todayString(), guests: '2' });
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [reservations, setReservations] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAvailabilityLoading(true);
    fetch(`${API_ROOT}/reservations/availability?date=${encodeURIComponent(form.date)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load table availability.');
        return result;
      })
      .then((result) => {
        if (!cancelled) {
          setReservations(result);
          setError('');
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || 'Could not load table availability.');
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });
    return () => { cancelled = true; };
  }, [form.date]);

  function isReserved(table, time = selectedTime) {
    return reservations.some((booking) => booking.timeSlot === time && Number(booking.tableNumber) === table);
  }

  useEffect(() => {
    const selectedIsReserved = reservations.some((booking) => booking.timeSlot === selectedTime && Number(booking.tableNumber) === selectedTable);
    if (selectedIsReserved) {
      const firstFree = tables.find((table) => !reservations.some((booking) => booking.timeSlot === selectedTime && Number(booking.tableNumber) === table));
      setSelectedTable(firstFree ?? null);
    }
  }, [selectedTable, selectedTime, reservations]);

  function updateForm(event) {
    setConfirmation('');
    setError('');
    let { name, value } = event.target;
    if (name === 'phone') value = value.replace(/\D/g, '').slice(0, 11);
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitReservation(event) {
    event.preventDefault();
    setConfirmation('');
    if (!validName(form.name)) {
      setError('Please enter your first and last name.');
      return;
    }
    if (!validPhone(form.phone)) {
      setError('Phone number must be exactly 11 digits.');
      return;
    }
    if (!selectedTable) {
      setError('No tables are available for this time.');
      return;
    }
    if (isReserved(selectedTable)) {
      setError('That table is no longer available for this time.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`${API_ROOT}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone, date: form.date, timeSlot: selectedTime, tableNumber: selectedTable, guests: Number(form.guests) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Your reservation could not be saved.');
      setReservations((current) => [...current, result]);
      setConfirmation(`Table ${selectedTable} is reserved for ${form.name.trim()}.`);
    } catch (submitError) {
      setError(submitError.message || 'Your reservation could not be saved.');
      if (submitError.message?.includes('already booked')) {
        setReservations((current) => [...current, { timeSlot: selectedTime, tableNumber: selectedTable }]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="reservations-page">
    <section className="reservation-hero">
      <div className="reservation-intro">
        <p className="eyebrow">Make it a night</p>
        <h1>Your table is<br /><em>waiting.</em></h1>
        <p>Join us for a memorable meal. Choose your party size and a time that works - we'll take care of the rest.</p>
        <div className="reservation-image" />
      </div>
      <form className="reservation-booking-card" onSubmit={submitReservation} noValidate>
        <h2>Find a table</h2>
        <div className="booking-fields"><label>Date<input name="date" type="date" value={form.date} min={todayString()} onChange={updateForm} required /></label><label>Guests<select name="guests" value={form.guests} onChange={updateForm}><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option><option value="5">5 guests</option><option value="6">6 guests</option></select></label></div>
        <label className="booking-label">Available times</label><div className="time-grid">{times.map((time) => <button type="button" key={time} className={selectedTime === time ? 'selected' : ''} onClick={() => { setConfirmation(''); setError(''); setSelectedTime(time); }}>{time}</button>)}</div>
        <label className="booking-label">Choose your table</label>{availabilityLoading && <p className="availability-note">Checking availability…</p>}<div className="table-picker">{tables.map((table) => { const reserved = isReserved(table); return <button type="button" key={table} className={`${selectedTable === table ? 'selected' : ''} ${reserved ? 'occupied' : ''}`} disabled={reserved || availabilityLoading} onClick={() => { setError(''); setSelectedTable(table); }}>{reserved ? `Reserved · ${table}` : `Table ${table}`}</button>; })}</div>
        <div className="booking-contact"><label>Full name<input name="name" value={form.name} onChange={updateForm} placeholder="First and last name" autoComplete="name" required /></label><label>Phone number<input name="phone" type="tel" inputMode="numeric" value={form.phone} onChange={updateForm} placeholder="11-digit phone number" maxLength={11} autoComplete="tel" required /></label></div>
        <button className="reserve-button" type="submit" disabled={submitting || availabilityLoading}>{submitting ? 'Saving reservation…' : 'Reserve table'} <span>→</span></button>
        {error ? <p className="reservation-error" style={{ color: '#c0392b', margin: '10px 0 0' }}>{error}</p> : confirmation ? <p className="reservation-confirmation">✓ {confirmation}</p> : <p className="cancellation-note">Free cancellation up to 2 hours before your booking.</p>}
        <p className="reservation-cancel-call">For cancellations, please call <a href="tel:+201000000000">+20 100 000 0000</a>.</p>
      </form>
    </section>
  </div>;
}
