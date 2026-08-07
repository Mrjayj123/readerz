import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      await login(email, password);
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
        <img src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80" alt="" />
        <div className="auth-visual__overlay" />
        <div className="auth-visual__quote">
          <p>"A feed that gets better the more you read, instead of just louder."</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-mark">R</div>
        <h2>Welcome back</h2>
        <p className="auth-sub">Log in for picks made for you and articles you've saved.</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="switch-line">
          New to Readerz? <Link to="/signup" state={location.state}>Sign up</Link>
        </p>
        <p className="guest-line" onClick={() => navigate(from)}>Continue without an account</p>
      </div>
    </div>
  );
}
