import { useNavigate } from 'react-router-dom';

export default function ArticleCard({ article, onToggleBookmark, className = '', style }) {
  const navigate = useNavigate();

  return (
    <article
      className={`article-card reveal ${className}`}
      style={style}
      onClick={() => navigate(`/article/${article.id}`)}
    >
      <div
        className={`dogear ${article.bookmarked ? 'dogear--saved' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark(article.id);
        }}
        title={article.bookmarked ? 'Remove bookmark' : 'Save for later'}
      />
      <div className="article-card__thumb">
        <img src={article.img_url} alt="" loading="lazy" />
      </div>
      <div className="article-card__body">
        <span className="eyebrow">{article.category}</span>
        <h4>{article.title}</h4>
        <p className="excerpt">{article.excerpt}</p>
        <div className="byline">{article.author} · {article.read_time} read</div>
      </div>
    </article>
  );
}
