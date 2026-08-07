import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function initials(name) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function ArticlePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    setArticle(null);
    api.article(id).then(setArticle).catch(() => navigate('/'));
    window.scrollTo(0, 0);
  }, [id, user]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      setProgress(height > 0 ? (scrolled / height) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function toggleBookmark() {
    if (!user) {
      navigate('/login', { state: { from: `/article/${id}` } });
      return;
    }
    const res = await api.toggleSaved({
      kind: 'article',
      source: 'local',
      external_id: String(article.id),
      title: article.title,
      creator: article.author,
      image_url: article.img_url,
      url: `/article/${article.id}`,
    });
    setArticle((a) => ({ ...a, bookmarked: res.saved }));
  }

  if (!article) {
    return <div className="reader reader--loading">Loading article…</div>;
  }

  return (
    <>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <article className="reader">
        <button className="back-link" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div className="reader__hero">
          <img src={article.img_url} alt="" />
        </div>

        <div className="reader__head">
          <span className="eyebrow">{article.category}</span>
          <h1>{article.title}</h1>
          <div className="reader__meta">
            <div className="byline-row">
              <span className="avatar">{initials(article.author)}</span>
              <span>{article.author} · {article.read_time} read</span>
            </div>
            <div className="reader__tools">
              <button
                className="icon-btn"
                onClick={() => setFontScale((s) => Math.max(0.85, s - 0.1))}
                aria-label="Decrease text size"
              >A-</button>
              <button
                className="icon-btn"
                onClick={() => setFontScale((s) => Math.min(1.4, s + 0.1))}
                aria-label="Increase text size"
              >A+</button>
              <button
                className={`icon-btn ${article.bookmarked ? 'icon-btn--active' : ''}`}
                onClick={toggleBookmark}
                aria-label="Bookmark"
              >
                <svg viewBox="0 0 24 24" fill={article.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                  <path d="M6 3h12v18l-6-4.5L6 21V3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="reader__body" style={{ fontSize: `${fontScale}em` }}>
          <p className="lede">{article.excerpt}</p>
          {article.body_paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}

          {article.locked && (
            <div className="lock-card">
              <h3>Log in to keep reading</h3>
              <p>Create a free account to unlock the rest of this article and save it for later.</p>
              <div className="lock-card__actions">
                <button className="btn" onClick={() => navigate('/login', { state: { from: `/article/${id}` } })}>
                  Log in
                </button>
                <button className="btn btn--ghost" onClick={() => navigate('/signup', { state: { from: `/article/${id}` } })}>
                  Sign up
                </button>
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
