import { useNavigate } from 'react-router-dom';

const KIND_LABEL = { article: 'Article', book: 'Book', news: 'News' };

export default function SavedCard({ item, onRemove }) {
  const navigate = useNavigate();
  const isExternal = /^https?:\/\//.test(item.url || '');

  function open() {
    if (isExternal) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if (item.url) {
      navigate(item.url);
    }
  }

  return (
    <article className="article-card reveal is-visible" onClick={open}>
      <div
        className="dogear dogear--saved"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item);
        }}
        title="Remove from saved"
      />
      <div className="article-card__thumb">
        {item.image_url ? (
          <img src={item.image_url} alt="" loading="lazy" />
        ) : (
          <div className="thumb-fallback" />
        )}
      </div>
      <div className="article-card__body">
        <span className="eyebrow">{KIND_LABEL[item.kind] || item.kind}{isExternal ? ' · external' : ''}</span>
        <h4>{item.title}</h4>
        {item.creator && <div className="byline">{item.creator}</div>}
      </div>
    </article>
  );
}
