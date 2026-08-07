import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import SavedCard from '../components/SavedCard';

function initials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Profile() {
  const { user, ready, logout } = useAuth();
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api.saved().then(setItems);
  }, [user]);

  async function remove(item) {
    await api.toggleSaved({
      kind: item.kind,
      source: item.source,
      external_id: item.external_id,
      title: item.title,
    });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  if (ready && !user) {
    return (
      <section className="section auth-gate">
        <h2>Log in for your personalized profile</h2>
        <p>Track saved articles, reading stats, and pick up where you left off.</p>
        <div className="hero__cta">
          <button className="btn" onClick={() => navigate('/login', { state: { from: '/profile' } })}>Log in</button>
          <button className="btn btn--ghost" onClick={() => navigate('/signup', { state: { from: '/profile' } })}>Sign up</button>
        </div>
      </section>
    );
  }

  if (!user) return null;

  return (
    <section className="section">
      <div className="profile-head">
        <div className="avatar avatar--lg">{initials(user.name)}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-box"><b>{items.length}</b><span>Saved</span></div>
        <div className="stat-box"><b>3</b><span>Day streak</span></div>
        <div className="stat-box"><b>8</b><span>Articles read</span></div>
      </div>

      <div className="section__head">
        <h3>Recently saved</h3>
      </div>
      {items.length ? (
        <div className="grid">
          {items.slice(0, 3).map((item) => (
            <SavedCard key={item.id} item={item} onRemove={remove} />
          ))}
        </div>
      ) : (
        <p className="muted">Nothing saved yet — articles you bookmark will show up here.</p>
      )}

      <button className="btn btn--ghost" style={{ marginTop: '24px' }} onClick={() => { logout(); navigate('/'); }}>
        Log out
      </button>
    </section>
  );
}
