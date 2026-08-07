import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import SavedCard from '../components/SavedCard';

const FILTERS = [
  { id: null, label: 'All' },
  { id: 'article', label: 'Articles' },
  { id: 'book', label: 'Books' },
  { id: 'news', label: 'News' },
];

export default function Bookmarks() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.saved(filter).then(setItems).finally(() => setLoading(false));
  }, [user, filter]);

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
        <h2>Log in to see your saved items</h2>
        <p>Bookmark any article, book, or news story and it'll show up here, synced to your account.</p>
        <div className="hero__cta">
          <button className="btn" onClick={() => navigate('/login', { state: { from: '/bookmarks' } })}>Log in</button>
          <button className="btn btn--ghost" onClick={() => navigate('/signup', { state: { from: '/bookmarks' } })}>Sign up</button>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="section__head">
        <h2>Your saved items</h2>
        <span className="section__count">{items.length} saved</span>
      </div>
      <div className="chips" style={{ marginBottom: '26px' }}>
        {FILTERS.map((f) => (
          <button
            key={f.label}
            className={`chip ${filter === f.id ? 'chip--active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid-skeleton">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : items.length ? (
        <div className="grid">
          {items.map((item) => (
            <SavedCard key={item.id} item={item} onRemove={remove} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Nothing saved yet</h3>
          <p>Tap the corner fold on any article, book, or news story to save it here.</p>
          <button className="btn btn--ghost" onClick={() => navigate('/')}>Browse articles</button>
        </div>
      )}
    </section>
  );
}
