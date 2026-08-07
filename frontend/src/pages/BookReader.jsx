import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function BookReader() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fontScale, setFontScale] = useState(1);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .gutenbergPage(id, page)
      .then(setBook)
      .catch(() => setError('Could not load this book right now. Project Gutenberg may be temporarily unreachable.'))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id, page, user]);

  async function toggleSave() {
    if (!user) {
      navigate('/login', { state: { from: `/books/gutenberg/${id}` } });
      return;
    }
    const res = await api.toggleSaved({
      kind: 'book',
      source: 'gutenberg',
      external_id: String(id),
      title: book.title,
      creator: book.author,
      image_url: book.cover_url,
      url: `/books/gutenberg/${id}`,
    });
    setBook((b) => ({ ...b, saved: res.saved }));
  }

  if (loading && !book) return <div className="reader reader--loading">Loading book…</div>;
  if (error) {
    return (
      <div className="reader">
        <button className="back-link" onClick={() => navigate('/books')}>Back to Books</button>
        <div className="empty"><h3>Something went wrong</h3><p>{error}</p></div>
      </div>
    );
  }
  if (!book) return null;

  return (
    <article className="reader">
      <button className="back-link" onClick={() => navigate('/books')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Books
      </button>

      <div className="reader__head">
        <span className="eyebrow">Public domain · Project Gutenberg</span>
        <h1>{book.title}</h1>
        <div className="reader__meta">
          <div className="byline-row">
            <span>{book.author} · page {book.page} of {book.total_pages}</span>
          </div>
          <div className="reader__tools">
            <button className="icon-btn" onClick={() => setFontScale((s) => Math.max(0.85, s - 0.1))} aria-label="Decrease text size">A-</button>
            <button className="icon-btn" onClick={() => setFontScale((s) => Math.min(1.4, s + 0.1))} aria-label="Increase text size">A+</button>
            <button className={`icon-btn ${book.saved ? 'icon-btn--active' : ''}`} onClick={toggleSave} aria-label="Save">
              <svg viewBox="0 0 24 24" fill={book.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M6 3h12v18l-6-4.5L6 21V3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="reader__body" style={{ fontSize: `${fontScale}em`, opacity: loading ? 0.5 : 1 }}>
        {book.paragraphs.map((p, i) => <p key={i}>{p}</p>)}

        {book.locked ? (
          <div className="lock-card">
            <h3>Log in to keep reading</h3>
            <p>This book continues for {book.total_pages - 1} more page{book.total_pages - 1 === 1 ? '' : 's'} — it's public domain and free, just log in to keep your place.</p>
            <div className="lock-card__actions">
              <button className="btn" onClick={() => navigate('/login', { state: { from: `/books/gutenberg/${id}` } })}>Log in</button>
              <button className="btn btn--ghost" onClick={() => navigate('/signup', { state: { from: `/books/gutenberg/${id}` } })}>Sign up</button>
            </div>
          </div>
        ) : (
          <div className="reader__pagination">
            <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous page</button>
            <span className="muted">Page {book.page} of {book.total_pages}</span>
            <button className="btn" disabled={page >= book.total_pages} onClick={() => setPage((p) => p + 1)}>Next page</button>
          </div>
        )}
      </div>
    </article>
  );
}
