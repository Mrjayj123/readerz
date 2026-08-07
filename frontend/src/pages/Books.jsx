import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useReveal } from '../hooks/useReveal';

function BookCard({ book, onToggleSave }) {
  const navigate = useNavigate();
  const canReadInApp = book.source === 'gutenberg';

  function open() {
    if (canReadInApp) {
      navigate(`/books/gutenberg/${book.external_id}`);
    } else {
      window.open(book.external_url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <article className="article-card reveal is-visible" onClick={open}>
      <div
        className={`dogear ${book.saved ? 'dogear--saved' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(book);
        }}
        title={book.saved ? 'Remove from saved' : 'Save for later'}
      />
      <div className="article-card__thumb">
        {book.cover_url ? <img src={book.cover_url} alt="" loading="lazy" /> : <div className="thumb-fallback" />}
      </div>
      <div className="article-card__body">
        <span className="eyebrow">{canReadInApp ? 'Read in-app · public domain' : 'Open Library'}</span>
        <h4>{book.title}</h4>
        <p className="excerpt">{book.author}</p>
        {!canReadInApp && (
          <div className="byline">
            {book.full_text_available ? 'Full text on Archive.org' : 'Preview & borrow externally'}
          </div>
        )}
      </div>
    </article>
  );
}

export default function Books() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [results, setResults] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.booksFeatured().then((d) => setFeatured(d.results)).catch(() => {});
  }, [user]);

  useReveal([results, featured]);

  async function runSearch(e) {
    e?.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.booksSearch({ q: query, source });
      setResults(data.results);
    } catch (err) {
      setError('Could not reach the book catalog right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleSave(book, list, setList) {
    if (!user) return;
    const res = await api.toggleSaved({
      kind: 'book',
      source: book.source,
      external_id: book.external_id,
      title: book.title,
      creator: book.author,
      image_url: book.cover_url,
      url: book.source === 'gutenberg' ? `/books/gutenberg/${book.external_id}` : book.external_url,
    });
    setList(list.map((b) =>
      b.source === book.source && b.external_id === book.external_id ? { ...b, saved: res.saved } : b
    ));
  }

  return (
    <section className="section">
      <div className="section__head">
        <h2>Books</h2>
      </div>

      <form className="search-box search-box--page" onSubmit={runSearch} style={{ marginBottom: 18 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          placeholder="Search millions of titles - classics and modern books"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="chips" style={{ marginBottom: 26 }}>
        {[
          ['all', 'All sources'],
          ['gutenberg', 'Read in-app (public domain)'],
          ['openlibrary', 'Open Library'],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`chip ${source === id ? 'chip--active' : ''}`}
            onClick={() => { setSource(id); if (query.trim()) runSearch(); }}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="grid-skeleton">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : query.trim() ? (
        <div className="grid">
          {results.map((b) => (
            <BookCard key={`${b.source}-${b.external_id}`} book={b} onToggleSave={(bk) => toggleSave(bk, results, setResults)} />
          ))}
          {!results.length && <div className="empty" style={{ gridColumn: '1/-1' }}><h3>No results</h3><p>Try a different title or author.</p></div>}
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 18 }}>Popular public-domain titles you can read right now, in full, for free.</p>
          <div className="grid">
            {featured.map((b) => (
              <BookCard key={`${b.source}-${b.external_id}`} book={b} onToggleSave={(bk) => toggleSave(bk, featured, setFeatured)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
