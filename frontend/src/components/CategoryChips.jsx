export default function CategoryChips({ categories, active, onChange }) {
  return (
    <div className="chips">
      {categories.map((c) => (
        <button
          key={c}
          className={`chip ${active === c ? 'chip--active' : ''}`}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
