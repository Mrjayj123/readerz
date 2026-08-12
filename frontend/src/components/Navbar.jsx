import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Navbar({ search, onSearch }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="nav__inner">
        <Link to="/" className="nav__logo">
          Reader<em>z</em>
        </Link>

        <nav className="nav__links">
          <Link to="/" className={isHome ? 'active' : ''}>Home</Link>
          <Link to="/books" className={location.pathname.startsWith('/books') ? 'active' : ''}>Books</Link>
          <Link to="/news" className={location.pathname.startsWith('/news') ? 'active' : ''}>News</Link>
          <Link to="/bookmarks">Saved</Link>
        </nav>

        <div className="nav__actions">
                  <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          </button>
          {isHome && (
            <div className={`nav__search ${searchOpen ? 'open' : ''}`}>
              <button
                className="icon-btn"
                aria-label="Search"
                onClick={() => setSearchOpen((s) => !s)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <input
                placeholder="Search articles, authors, topics"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                onFocus={() => setSearchOpen(true)}
              />
            </div>
          )}

          {user ? (
            <button className="nav__avatar" onClick={() => navigate('/profile')} aria-label="Profile">
              {initials(user.name)}
            </button>
          ) : (
            <button className="btn btn--sm" onClick={() => navigate('/login')}>
              Log in
            </button>
          )}

          <button
            className="nav__burger"
            aria-label="Menu"
            onClick={() => setMenuOpen((s) => !s)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="nav__mobile">
          <Link to="/">Home</Link>
          <Link to="/books">Books</Link>
          <Link to="/news">News</Link>
          <Link to="/bookmarks">Saved</Link>
          <Link to="/profile">{user ? 'Profile' : 'Log in'}</Link>
        </div>
      )}
    </header>
  );
}
