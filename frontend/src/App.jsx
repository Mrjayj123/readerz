import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import ArticlePage from './pages/ArticlePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Bookmarks from './pages/Bookmarks';
import Profile from './pages/Profile';
import Books from './pages/Books';
import BookReader from './pages/BookReader';
import News from './pages/News';
import { ThemeProvider } from './context/ThemeContext';

function Shell() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const bare = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className="app">
      {!bare && <Navbar search={search} onSearch={setSearch} />}
      <main className={bare ? 'main main--bare' : 'main'}>
        <Routes>
          <Route
            path="/"
            element={<Landing search={search} onNeedAuth={() => navigate('/login', { state: { from: '/' } })} />}
          />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/gutenberg/:id" element={<BookReader />} />
          <Route path="/news" element={<News />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {!bare && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </ThemeProvider>
  );
}