import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useReveal } from '../hooks/useReveal';

const SOURCE_LABELS = {
  gutenberg: 'Read in-app · public domain',
  openlibrary: 'Open Library',
  googlebooks: 'Google Books',
};

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
        <span className="eyebrow">{SOURCE_LABELS[book.source] || book.source}</span>
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

function bookKey(b) {
  return `${b.source}-${b.external_id}`;
}

export default function Books() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ---- endless-scroll discovery grid (shown when there's no active search) ----
  const [discover, setDiscover] = useState([]);
  const [discoverPage, setDiscoverPage] = useState(1);
  const [discoverHasMore, setDiscoverHasMore] = useState(true);
  const [discoverInitialLoading, setDiscoverInitialLoading] = useState(true);
  const [discoverLoadingMore, setDiscoverLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const isSearching = query.trim().length > 0;

  useReveal([results, discover]);

  useEffect(() => {
    setDiscover([]);
    setDiscoverPage(1);
    setDiscoverHasMore(true);
    setDiscoverInitialLoading(true);
    api
      .booksFeatured(1)
      .then((d) => {
        setDiscover(d.results);
        setDiscoverHasMore(d.results.length > 0);
      })
      .catch(() => setDiscoverHasMore(false))
      .finally(() => setDiscoverInitialLoading(false));
  }, [user]);

  async function fetchNextDiscoverPage() {
    if (loadingMoreRef.current || !discoverHasMore || isSearching) return;
    loadingMoreRef.current = true;
    setDiscoverLoadingMore(true);
    const nextPage = discoverPage + 1;
    try {
      const d = await api.booksFeatured(nextPage);
      setDiscover((prev) => {
        const seen = new Set(prev.map(bookKey));
        const fresh = d.results.filter((b) => !seen.has(bookKey(b)));
        return [...prev, ...fresh];
      });
      setDiscoverPage(nextPage);
      setDiscoverHasMore(d.results.length > 0);
    } catch {
      setDiscoverHasMore(false);
    } finally {
      setDiscoverLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }

  useEffect(() => {
    if (isSearching) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextDiscoverPage();
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, discoverPage, discoverHasMore]);

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
          ['googlebooks', 'Google Books'],
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

      {isSearching ? (
        loading ? (
          <div className="grid-skeleton">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : (
          <div className="grid">
            {results.map((b) => (
              <BookCard key={bookKey(b)} book={b} onToggleSave={(bk) => toggleSave(bk, results, setResults)} />
            ))}
            {!results.length && <div className="empty" style={{ gridColumn: '1/-1' }}><h3>No results</h3><p>Try a different title or author.</p></div>}
          </div>
        )
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 18 }}>Public-domain titles you can read right now, in full, for free — keep scrolling for more.</p>

          {discoverInitialLoading ? (
            <div className="grid-skeleton">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton-card" />)}
            </div>
          ) : (
            <>
              <div className="grid">
                {discover.map((b) => (
                  <BookCard key={bookKey(b)} book={b} onToggleSave={(bk) => toggleSave(bk, discover, setDiscover)} />
                ))}
              </div>

              {discoverHasMore && (
                <div ref={sentinelRef} className="discover-sentinel">
                  {discoverLoadingMore && (
                    <div className="grid-skeleton" style={{ marginTop: 20 }}>
                      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton-card" />)}
                    </div>
                  )}
                </div>
              )}

              {!discoverHasMore && discover.length > 0 && (
                <p className="muted" style={{ textAlign: 'center', marginTop: 28 }}>You've reached the end — for now.</p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}