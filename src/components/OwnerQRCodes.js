import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import '../styles/OwnerQRCodes.css';

function menuLink(siteAddress) {
  const url = new URL(siteAddress);
  url.search = '';
  url.hash = '';
  url.searchParams.set('menu', '1');
  return url.toString();
}

export function OwnerQRCodes() {
  const [siteAddress, setSiteAddress] = useState(() => window.localStorage.getItem('savor-public-site-address') || `${window.location.origin}/`);
  const [qrCode, setQrCode] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let base;
    try {
      base = new URL(siteAddress.trim());
      if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Enter a valid website address starting with http:// or https://.');
      if (!base.hostname) throw new Error('Enter a valid website address.');
    } catch (addressError) {
      setError(addressError.message || 'Enter a valid website address.');
      setQrCode(null);
      return () => { cancelled = true; };
    }

    setGenerating(true);
    setError('');
    setQrCode(null);
    const url = menuLink(base.toString());
    QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#1d2c24', light: '#ffffff' } }).then((image) => {
      if (!cancelled) setQrCode({ label: 'Full menu', description: 'Scan to open the complete restaurant menu.', url, image });
    }).catch((generationError) => {
      if (!cancelled) setError(generationError.message || 'QR code could not be generated.');
    }).finally(() => {
      if (!cancelled) setGenerating(false);
    });

    return () => { cancelled = true; };
  }, [siteAddress]);

  function updateAddress(event) {
    const value = event.target.value;
    setSiteAddress(value);
    window.localStorage.setItem('savor-public-site-address', value);
  }

  const isLocalAddress = (() => {
    try {
      const hostname = new URL(siteAddress).hostname;
      return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    } catch (addressError) {
      return false;
    }
  })();

  return <div className="owner-qr-page">
    <section className="page-heading compact"><div><p className="eyebrow">Owner workspace</p><h1>Menu <em>QR code.</em></h1><p className="heading-copy">One code opens the full menu for every customer.</p></div></section>
    <section className="qr-setup-card qr-screen-only">
      <label className="qr-site-address">Public website address<input type="url" value={siteAddress} onChange={updateAddress} placeholder="https://your-restaurant.com" autoComplete="url" /></label>
      <div className="qr-setup-actions"><p>Use your deployed website address before printing so guests’ phones can open it.</p><button type="button" className="qr-print-button" onClick={() => window.print()} disabled={!qrCode}>Print QR code</button></div>
      {isLocalAddress && <p className="qr-local-warning" role="status">This is a local address. It works on this computer only; replace it with the public site address after deployment.</p>}
      {error && <p className="qr-error" role="alert">{error}</p>}
      {generating && <p className="qr-generating" role="status">Creating full-menu QR code…</p>}
    </section>
    {!error && qrCode && <section className="qr-card-grid" aria-label="Full restaurant menu QR code">
      <article className="qr-card">
        <h2>{qrCode.label}</h2><p>{qrCode.description}</p><img src={qrCode.image} alt={`${qrCode.label} QR code`} />
        <code>{qrCode.url}</code><a className="qr-download qr-screen-only" href={qrCode.image} download="savor-full-menu-qr.png">Download PNG</a>
      </article>
    </section>}
  </div>;
}
