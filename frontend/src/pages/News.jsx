import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useReveal } from '../hooks/useReveal';

function NewsCard({ item, onToggleSave }) {
  return (
    <article
      className="article-card reveal is-visible"
      onClick={() => window.open(item.external_url, '_blank', 'noopener,noreferrer')}
    >
      <div
        className={`dogear ${item.saved ? 'dogear--saved' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(item);
        }}
        title={item.saved ? 'Remove from saved' : 'Save for later'}
      />
      <div className="article-card__thumb">
        {item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : <div className="thumb-fallback" />}
      </div>
      <div className="article-card__body">
        <span className="eyebrow">{item.category}</span>
        <h4>{item.title}</h4>
        <p className="excerpt">{item.summary}</p>
        <div className="byline">{item.source_name} · read full article ↗</div>
      </div>
    </article>
  );
}

export default function News() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.newsCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .news(active)
      .then(setItems)
      .catch(() => setError('Could not reach the news feed right now. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, [active, user]);

  useReveal([items]);

  async function toggleSave(item) {
    if (!user) return;
    const res = await api.toggleSaved({
      kind: 'news',
      source: 'rss',
      external_id: item.id,
      title: item.title,
      creator: item.source_name,
      image_url: item.image_url,
      url: item.external_url,
    });
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, saved: res.saved } : i)));
  }

  return (
    <section className="section">
      <div className="section__head">
        <h2>News</h2>
        <span className="section__count">Headlines &amp; summaries · full articles open on the source site</span>
      </div>

      <div className="chips" style={{ marginBottom: 26 }}>
        <button className={`chip ${active === null ? 'chip--active' : ''}`} onClick={() => setActive(null)}>All</button>
        {categories.map((c) => (
          <button key={c} className={`chip ${active === c ? 'chip--active' : ''}`} onClick={() => setActive(c)}>{c}</button>
        ))}
      </div>

      {error && <div className="empty"><h3>Something went wrong</h3><p>{error}</p></div>}

      {loading ? (
        <div className="grid-skeleton">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} onToggleSave={toggleSave} />
          ))}
          {!items.length && !error && (
            <div className="empty" style={{ gridColumn: '1/-1' }}><h3>Nothing here right now</h3><p>Try another category.</p></div>
          )}
        </div>
      )}
    </section>
  );
}
