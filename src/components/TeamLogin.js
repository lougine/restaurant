import { useEffect, useState } from 'react';
import '../styles/TeamLogin.css';

const API_ROOT = (process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:4000/api')).replace(/\/$/, '');

export function TeamLogin({ onClose, onAuthenticated }) {
  const [accountType, setAccountType] = useState('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  async function submitLogin(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(`${API_ROOT}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Email or password is incorrect.');

      const expectedRole = accountType === 'staff' ? 'kitchen' : 'owner';
      if (result.user?.role !== expectedRole) {
        throw new Error(`This account does not have ${accountType === 'staff' ? 'staff' : 'owner'} access.`);
      }

      window.localStorage.setItem('savor-auth-token', result.token);
      window.localStorage.setItem('savor-auth-user', JSON.stringify(result.user));
      onAuthenticated(result.user);
    } catch (loginError) {
      setError(loginError.message || 'Could not connect to the sign-in service.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="team-login-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="team-login-dialog" role="dialog" aria-modal="true" aria-labelledby="team-login-title">
      <button className="team-login-close" type="button" onClick={onClose} aria-label="Close sign in">×</button>
      <p className="eyebrow">Savor team</p>
      <h2 id="team-login-title">Sign in to your workspace.</h2>
      <div className="team-login-roles" role="tablist" aria-label="Account type">
        <button type="button" role="tab" aria-selected={accountType === 'staff'} className={accountType === 'staff' ? 'selected' : ''} onClick={() => { setAccountType('staff'); setError(''); }}>Staff</button>
        <button type="button" role="tab" aria-selected={accountType === 'owner'} className={accountType === 'owner' ? 'selected' : ''} onClick={() => { setAccountType('owner'); setError(''); }}>Owner</button>
      </div>
      <form onSubmit={submitLogin}>
        <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
        {error && <p className="team-login-error" role="alert">{error}</p>}
        <button className="team-login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : `Sign in as ${accountType}`}</button>
      </form>
    </section>
  </div>;
}
