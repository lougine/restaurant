import '../pages/About.css';

export function AboutView() {
  return <div className="about-page">
    <section className="page-heading compact">
      <div>
        <p className="eyebrow">Our kitchen <span className="live-pill"><i /> Since 2018</span></p>
        <h1>Made with care, <em>served with warmth.</em></h1>
        <p className="heading-copy">Ember House is a neighborhood restaurant built around seasonal ingredients, thoughtful cooking, and making every table feel at home.</p>
      </div>
    </section>
    <section className="about-grid">
      <article><span className="about-number">01</span><h2>From the market</h2><p>Our menu follows the best produce we can find, changing with the seasons and the people who grow it.</p></article>
      <article><span className="about-number">02</span><h2>From our kitchen</h2><p>Simple food, carefully made. Every plate is prepared to order by a small team who loves the details.</p></article>
      <article><span className="about-number">03</span><h2>For your table</h2><p>Stay for a while. Whether it is a quick lunch or a long dinner, there is always room for one more.</p></article>
    </section>
  </div>;
}
