import { useState } from 'react';
import './Reservations.css';

const times = ['5:30 pm', '6:00 pm', '6:30 pm', '7:00 pm', '7:30 pm', '8:15 pm'];
const tables = [1, 2, 3, 4, 5, 6, 7, 8];

export function ReservationsView() {
  const [selectedTime, setSelectedTime] = useState('7:00 pm');
  const [selectedTable, setSelectedTable] = useState(4);
  const [form, setForm] = useState({ name: '', phone: '', date: '', guests: '2' });
  const [confirmation, setConfirmation] = useState('');

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitReservation(event) {
    event.preventDefault();
    setConfirmation(`Table ${selectedTable} is reserved for ${form.name}.`);
  }

  return <div className="reservations-page">
    <section className="reservation-hero">
      <div className="reservation-intro">
        <p className="eyebrow">Make it a night</p>
        <h1>Your table is<br /><em>waiting.</em></h1>
        <p>Join us for a memorable meal. Choose your party size and a time that works - we'll take care of the rest.</p>
        <div className="reservation-image" />
      </div>
      <form className="reservation-booking-card" onSubmit={submitReservation}>
        <h2>Find a table</h2>
        <div className="booking-fields"><label>Date<input name="date" type="date" value={form.date} onChange={updateForm} required /></label><label>Guests<select name="guests" value={form.guests} onChange={updateForm}><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option><option value="5">5 guests</option><option value="6">6 guests</option></select></label></div>
        <label className="booking-label">Available times</label><div className="time-grid">{times.map((time) => <button type="button" key={time} className={selectedTime === time ? 'selected' : ''} onClick={() => setSelectedTime(time)}>{time}</button>)}</div>
        <label className="booking-label">Choose your table</label><div className="table-picker">{tables.map((table) => <button type="button" key={table} className={`${selectedTable === table ? 'selected' : ''} ${table === 4 || table === 7 ? 'occupied' : ''}`} disabled={table === 4 || table === 7} onClick={() => setSelectedTable(table)}>Table {table}</button>)}</div>
        <div className="booking-contact"><label>Full name<input name="name" value={form.name} onChange={updateForm} placeholder="Your full name" required /></label><label>Phone number<input name="phone" type="tel" value={form.phone} onChange={updateForm} placeholder="Your phone number" required /></label></div>
        <button className="reserve-button" type="submit">Reserve table <span>→</span></button>
        {confirmation ? <p className="reservation-confirmation">✓ {confirmation}</p> : <p className="cancellation-note">Free cancellation up to 2 hours before your booking.</p>}
      </form>
    </section>
  </div>;
}
