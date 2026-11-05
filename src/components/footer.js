import './footer.css';

export function Footer({ navigation, onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <strong>savor</strong>
          <p>Good food, warm tables, and service that feels like home.</p>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          {navigation.map((view) => (
            <button key={view} type="button" onClick={() => { onNavigate(view); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{view}</button>
          ))}
        </div>
        <div className="footer-col">
          <h4>Hours</h4>
          <span>Open daily</span>
          <span>Until 11:00 PM</span>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()}  savor. All rights reserved.</div>
    </footer>
  );
}