import '../styles/footer.css';

export function Footer({ isOpen }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>savor</strong>
          <p>Good food, warm tables, and service that feels like home.</p>
        </div>
        <div className="footer-col footer-contact">
          <h4>Visit &amp; Contact</h4>
          <span>Zamalek, Cairo, Egypt</span>
          <a href="tel:+201000000000">+20 100 000 0000</a>
          <a href="mailto:hello@savor.example">hello@savor.example</a>
        </div>
        <div className="footer-col">
          <h4>Hours</h4>
          <span className="footer-hours-status"><i className={`footer-hours-dot ${isOpen ? '' : 'closed'}`} />{isOpen ? 'Open now' : 'Closed'}</span>
          <span>Daily · until 11:00 PM</span>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()}  savor. All rights reserved.</div>
    </footer>
  );
}
