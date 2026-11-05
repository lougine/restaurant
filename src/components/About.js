import '../styles/About.css';

export function AboutView({ onNavigate }) {
  return <div className="about-page">
    <section className="about-hero">
      <div className="about-hero-copy">
        <p className="about-hero-kicker">Our story</p>
        <h1>Food made for<br /><em>gathering.</em></h1>
        <p>Savor began with a simple belief: the best meals are generous, seasonal, and shared. Our kitchen brings the warmth of the Mediterranean to the heart of Zamalek.</p>
        <button className="about-reserve-button" type="button" onClick={() => onNavigate('Reservations')}>Reserve a table <span aria-hidden="true">→</span></button>
      </div>
      <div className="about-hero-gallery" aria-label="Food from the Savor kitchen">
        <img className="about-photo-primary" src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=88" alt="Fresh seasonal salad from the kitchen" />
        <img className="about-photo-secondary" src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=88" alt="A generous Mediterranean meal set out to share" />
      </div>
    </section>
    <section className="about-grid">
      <article><span className="about-number">01</span><h2>From the market</h2><p>Our menu follows the best produce we can find, changing with the seasons and the people who grow it.</p></article>
      <article><span className="about-number">02</span><h2>From our kitchen</h2><p>Simple food, carefully made. Every plate is prepared to order by a small team who loves the details.</p></article>
      <article><span className="about-number">03</span><h2>For your table</h2><p>Stay for a while. Whether it is a quick lunch or a long dinner, there is always room for one more.</p></article>
    </section>
    <section className="about-location" aria-labelledby="about-location-title">
      <div className="about-location-copy">
        <p className="eyebrow">Find us</p>
        <h2 id="about-location-title">In the heart of <em>Zamalek.</em></h2>
        <p><strong>Address:</strong> Zamalek, Cairo, Egypt.</p>
        <p><strong>Directions:</strong> Head to Zamalek Island in central Cairo. The map below is centered on the neighborhood; open directions for a route.</p>
        <p><strong>Phone:</strong> <a href="tel:+201000000000">+20 100 000 0000</a></p>
        <p><strong>Email:</strong> <a href="mailto:hello@savor.example">hello@savor.example</a></p>
        <a className="about-directions-link" href="https://www.google.com/maps/search/?api=1&query=Zamalek%2C+Cairo%2C+Egypt" target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
      </div>
      <div className="about-map-wrap">
        <iframe
          title="Interactive map of Zamalek, Cairo, Egypt"
          src="https://maps.google.com/maps?q=Zamalek%2C%20Cairo%2C%20Egypt&t=&z=14&ie=UTF8&iwloc=&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  </div>;
}
