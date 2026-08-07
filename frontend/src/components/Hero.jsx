import { useEffect, useRef, useState } from 'react';
import { useCountUp } from '../hooks/useCountUp';

const WORDS = ['culture', 'science', 'fiction', 'business', 'the world'];

export default function Hero({ articleCount, categoryCount, onStartReading, onBrowse }) {
  const [wordIndex, setWordIndex] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--mx', x.toFixed(3));
      el.style.setProperty('--my', y.toFixed(3));
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  const [readersRef, readers] = useCountUp(24800);
  const [articlesRef, articles] = useCountUp(articleCount || 0);
  const [catsRef, cats] = useCountUp(categoryCount || 0);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero__blob hero__blob--a" />
      <div className="hero__blob hero__blob--b" />

      <div className="hero__content">
        <span className="hero__kicker">No account required to start</span>
        <h1>
          Read the stories shaping
          <br />
          <span className="hero__rotator">
            {WORDS.map((w, i) => (
              <span key={w} className={`hero__word ${i === wordIndex ? 'is-active' : ''}`}>
                {w}
              </span>
            ))}
          </span>
        </h1>
        <p className="hero__sub">
          Browse freely as a guest, or log in for a feed picked from what you actually read —
          saved articles, reading streaks, and recommendations that improve over time.
        </p>
        <div className="hero__cta">
          <button className="btn" onClick={onStartReading}>Start reading</button>
          <button className="btn btn--ghost" onClick={onBrowse}>Browse categories</button>
        </div>

        <div className="hero__stats">
          <div className="stat" ref={readersRef}>
            <b>{readers.toLocaleString()}+</b>
            <span>Monthly readers</span>
          </div>
          <div className="stat" ref={articlesRef}>
            <b>{articles}</b>
            <span>Articles live</span>
          </div>
          <div className="stat" ref={catsRef}>
            <b>{cats}</b>
            <span>Categories</span>
          </div>
        </div>
      </div>
    </section>
  );
}
