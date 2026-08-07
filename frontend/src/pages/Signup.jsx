import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || '/';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-visual">
        <img src="https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=1200&q=80" alt="" />
        <div className="auth-visual__overlay" />
        <div className="auth-visual__quote">
          <p>"Free to join. Takes about a minute, no credit card, ever."</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-mark">R</div>
        <h2>Create your account</h2>
        <p className="auth-sub">Save articles, pick up where you left off, and unlock full pieces.</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="switch-line">
          Already have an account? <Link to="/login" state={location.state}>Log in</Link>
        </p>
        <p className="guest-line" onClick={() => navigate(from)}>Continue without an account</p>
      </div>
    </div>
  );
}
