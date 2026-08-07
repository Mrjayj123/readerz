import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FeaturedCarousel({ articles }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    if (paused || articles.length <= 1) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % articles.length);
    }, 4500);
    return () => clearInterval(timer.current);
  }, [paused, articles.length]);

  if (!articles.length) return null;
  const a = articles[index];

  return (
    <div
      className="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => navigate(`/article/${a.id}`)}
    >
      {articles.map((art, i) => (
        <div key={art.id} className={`carousel__slide ${i === index ? 'is-active' : ''}`}>
          <img src={art.img_url} alt="" />
        </div>
      ))}
      <div className="carousel__overlay" />
      <span className="carousel__tag">Featured</span>
      <div className="carousel__info">
        <span className="eyebrow eyebrow--light">{a.category}</span>
        <h3>{a.title}</h3>
        <p>{a.author} · {a.read_time} read</p>
      </div>
      {articles.length > 1 && (
        <div className="carousel__dots" onClick={(e) => e.stopPropagation()}>
          {articles.map((_, i) => (
            <button
              key={i}
              className={i === index ? 'is-active' : ''}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
