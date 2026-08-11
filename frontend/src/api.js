const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('readerz_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    let detail = 'Something went wrong';
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  register: (payload) =>
    fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),

  login: (payload) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(handle),

  me: () => fetch(`${BASE}/auth/me`, { headers: { ...authHeaders() } }).then(handle),

  categories: () => fetch(`${BASE}/categories`).then(handle),

  // ---- editorial articles ----
  articles: ({ category, search } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString();
    return fetch(`${BASE}/articles${qs ? `?${qs}` : ''}`, {
      headers: { ...authHeaders() },
    }).then(handle);
  },

  article: (id) =>
    fetch(`${BASE}/articles/${id}`, { headers: { ...authHeaders() } }).then(handle),

  // ---- books (Gutenberg + Open Library) ----
  booksSearch: ({ q, source = 'all' }) => {
    const params = new URLSearchParams({ q, source });
    return fetch(`${BASE}/books/search?${params}`, { headers: { ...authHeaders() } }).then(handle);
  },

  booksFeatured: () =>
    fetch(`${BASE}/books/featured`, { headers: { ...authHeaders() } }).then(handle),

  bookPage: (source, id, page = 1) =>
  fetch(`${BASE}/books/${source}/${id}?page=${page}`, { headers: { ...authHeaders() } }).then(handle),

  openLibraryBook: (workKey) =>
    fetch(`${BASE}/books/openlibrary/${workKey}`, { headers: { ...authHeaders() } }).then(handle),

  // ---- news (RSS) ----
  news: (category) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    return fetch(`${BASE}/news${qs}`, { headers: { ...authHeaders() } }).then(handle);
  },

  newsCategories: () => fetch(`${BASE}/news/categories`).then(handle),

  // ---- unified saved items ----
  saved: (kind) => {
    const qs = kind ? `?kind=${encodeURIComponent(kind)}` : '';
    return fetch(`${BASE}/saved${qs}`, { headers: { ...authHeaders() } }).then(handle);
  },

  toggleSaved: (payload) =>
    fetch(`${BASE}/saved/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(handle),
};
