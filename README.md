# Readerz

A reading app with a public, no-login feed and a personalized experience for logged-in
users — built as a React (Vite) frontend and a FastAPI + SQLAlchemy backend.

## What's inside

```
readerz/
├── backend/     FastAPI + SQLAlchemy API (SQLite database)
└── frontend/    React (Vite) app, responsive for phone/tablet/laptop
```

### Backend
- **FastAPI** for the API layer, **SQLAlchemy** ORM models (`User`, `Article`, `SavedItem`)
- **SQLite** database file (`readerz.db`), created and seeded automatically on first run
- JWT-based auth (`python-jose`), password hashing (`passlib`)
- Guests can browse and read a preview of every article; logged-in users get full
  article text, personalized greeting, and bookmarking
- **External content providers** (`backend/providers/`) — no API keys required:
  - **Project Gutenberg** via the [Gutendex](https://gutendex.com) API — 70,000+
    public-domain books. Since these are legally public domain, the backend
    fetches and serves the **full text in-app**, paginated (guests get a short
    preview of page 1; logged-in users can page through the whole book).
  - **Open Library** — a much broader book catalog, including in-copyright
    titles. Returns metadata, cover art, and a link to read/borrow on Open
    Library or archive.org — never full text for anything not confirmed public
    domain.
  - **News**, via public RSS feeds (BBC) — headlines, publisher-provided
    summaries, and a link to the original article. Full article bodies are
    never scraped or reproduced; reading the full piece always happens on the
    publisher's site.
- A unified `SavedItem` table lets a user bookmark an editorial article, a
  book, or a news story from one "Saved" screen (`GET/POST /api/saved`,
  `/api/saved/toggle`).

### Frontend
- React 18 + Vite, client-side routing via `react-router-dom`
- Fully responsive — one codebase adapts from phone to tablet to laptop/desktop
  (fluid type, responsive grid, a two-pane auth layout on wider screens, a
  hamburger nav on narrow ones)
- Interactive landing page: rotating headline, mouse-parallax hero, animated
  stat counters, an auto-rotating featured carousel, scroll-reveal article grid
- Custom "dog-ear" bookmark fold, a reading-progress bar and adjustable text
  size on the article page

## Running it locally

You'll need **Python 3.10+** and **Node.js 18+**.

### 1. Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

This starts the API at `http://localhost:8000` and creates `readerz.db` with
8 seeded articles on first run. Interactive API docs are at
`http://localhost:8000/docs`.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

This starts the app at `http://localhost:5173`. The Vite dev server proxies
any `/api/...` request to the backend on port 8000 (see `vite.config.js`), so
just open `http://localhost:5173` in your browser.

## Trying it out

- Browse the home feed, filter by category, and open any article without
  logging in — you'll see a preview with a "Log in to keep reading" prompt.
- Head to **Books** and search for a classic (try "Frankenstein" or "Pride and
  Prejudice") — Gutenberg results open a full in-app reader with pagination;
  Open Library results open a "read/borrow" link on their site.
- Head to **News** for current headlines from BBC's public RSS feeds, grouped
  by category — each card summarizes the story and links out to read the full
  article on the original site.
- Create an account (any email/password, 6+ characters) to unlock full
  articles and book pages, and to bookmark anything — articles, books, or news
  — with the corner-fold icon. Everything you save shows up under **Saved**.

Note: the Books and News features call out to gutendex.com, openlibrary.org,
and BBC's RSS feeds, so they need a machine with normal internet access to
work (they'll simply return empty results if that network is blocked).

## Notes for going further

- **Auth**: tokens are stored in `localStorage` and expire after 7 days
  (see `ACCESS_TOKEN_EXPIRE_MINUTES` in `backend/auth.py`). Change
  `SECRET_KEY` in `backend/auth.py` before deploying anywhere real.
- **Database**: SQLite is great for local dev; swap the `SQLALCHEMY_DATABASE_URL`
  in `backend/database.py` for Postgres/MySQL when you're ready for production
  (SQLAlchemy makes that a one-line change plus a driver install).
- **CORS**: currently wide open (`allow_origins=["*"]`) for local development —
  restrict this to your real frontend domain before deploying.
- **Content**: articles live in `backend/seed.py`. Add more there, or wire up
  an admin endpoint if you'll want to publish through the app itself.
- **External API caching**: Gutenberg book text and metadata are cached
  in-memory per process (see `providers/gutenberg.py`) to avoid re-fetching on
  every page turn. For production, swap that for Redis or a database table so
  the cache survives restarts and is shared across workers.
- **More sources**: `providers/` is intentionally one small file per source —
  adding Google Books, NYT, or Guardian is a matter of writing a similar
  `search()`/`get()` pair and registering it in `main.py`.
