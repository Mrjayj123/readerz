import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useReveal } from '../hooks/useReveal';
import Hero from '../components/Hero';
import FeaturedCarousel from '../components/FeaturedCarousel';
import CategoryChips from '../components/CategoryChips';
import ArticleCard from '../components/ArticleCard';
import { useNavigate } from 'react-router-dom';

export default function Landing({ search, onNeedAuth }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState(['For You']);
  const [active, setActive] = useState('For You');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .articles({ category: active, search })
      .then(setArticles)
      .finally(() => setLoading(false));
  }, [active, search, user]);

  useReveal([articles]);

  const featured = articles.filter((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  async function toggleBookmark(id) {
    if (!user) {
      onNeedAuth();
      return;
    }
    const a = articles.find((x) => x.id === id);
    const res = await api.toggleSaved({
      kind: 'article',
      source: 'local',
      external_id: String(id),
      title: a?.title,
      creator: a?.author,
      image_url: a?.img_url,
      url: `/article/${id}`,
    });
    setArticles((prev) =>
      prev.map((x) => (x.id === id ? { ...x, bookmarked: res.saved } : x))
    );
  }

  return (
    <>
      <Hero
        articleCount={articles.length}
        categoryCount={Math.max(categories.length - 1, 0)}
        onStartReading={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })}
        onBrowse={() => gridRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      {!search && active === 'For You' && featured.length > 0 && (
        <section className="section reveal">
          <FeaturedCarousel articles={featured} />
        </section>
      )}

      <section className="section" ref={gridRef}>
        <div className="section__head">
          <h2>{search ? 'Search results' : active === 'For You' ? 'More for you' : active}</h2>
          <CategoryChips categories={categories} active={active} onChange={setActive} />
        </div>

        {loading ? (
          <div className="grid-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : rest.length ? (
          <div className="grid">
            {rest.map((a, i) => (
              <ArticleCard
                key={a.id}
                article={a}
                onToggleBookmark={toggleBookmark}
                style={{ transitionDelay: `${(i % 6) * 60}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h3>Nothing here yet</h3>
            <p>Try another topic or search term.</p>
          </div>
        )}
      </section>

      {!user && (
        <section className="section cta-band reveal">
          <h2>Get a feed that learns what you read</h2>
          <p>Free to join — save articles, pick up where you left off, and unlock full pieces.</p>
          <button className="btn" onClick={() => navigate('/signup')}>Create free account</button>
        </section>
      )}
    </>
  );
}
