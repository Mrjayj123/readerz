from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
import httpx

import models
import schemas
from database import engine, get_db, Base
from auth import hash_password, verify_password, create_access_token, decode_access_token
from seed import seed_data
from providers import gutenberg, openlibrary, googlebooks, news, standardebooks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Readerz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    seed_data(db)


# ---------- auth helpers ----------
def get_current_user_optional(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        return None
    user = db.query(models.User).filter(models.User.id == payload.get("sub")).first()
    return user


def get_current_user_required(
    user: Optional[models.User] = Depends(get_current_user_optional),
) -> models.User:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def _saved_lookup(db: Session, user: Optional[models.User], kind: str) -> set:
    """Returns the set of (source, external_id) the user has saved for a given kind."""
    if not user:
        return set()
    rows = (
        db.query(models.SavedItem.source, models.SavedItem.external_id)
        .filter(models.SavedItem.user_id == user.id, models.SavedItem.kind == kind)
        .all()
    )
    return {(r[0], r[1]) for r in rows}


# ---------- auth routes ----------
@app.post("/api/auth/register", response_model=schemas.Token)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user = models.User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=user)


@app.post("/api/auth/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id)})
    return schemas.Token(access_token=token, user=user)


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user_required)):
    return user


# ---------- category routes (editorial articles) ----------
@app.get("/api/categories")
def categories(db: Session = Depends(get_db)):
    rows = db.query(models.Article.category).distinct().all()
    cats = sorted({r[0] for r in rows})
    return ["For You", *cats]


# ---------- editorial article routes ----------
def _article_saved_ids(db: Session, user: Optional[models.User]):
    saved = _saved_lookup(db, user, "article")
    return {ext_id for (src, ext_id) in saved if src == "local"}


@app.get("/api/articles", response_model=List[schemas.ArticleListItem])
def list_articles(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    q = db.query(models.Article)
    if category and category != "For You":
        q = q.filter(models.Article.category == category)
    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                models.Article.title.ilike(like),
                models.Article.author.ilike(like),
                models.Article.category.ilike(like),
            )
        )
    articles = q.all()
    saved_ids = _article_saved_ids(db, user)
    out = []
    for a in articles:
        item = schemas.ArticleListItem.model_validate(a)
        item.bookmarked = str(a.id) in saved_ids
        out.append(item)
    return out


@app.get("/api/articles/{article_id}", response_model=schemas.ArticleOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    a = db.query(models.Article).filter(models.Article.id == article_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Article not found")
    out = schemas.ArticleOut.model_validate(a)
    out.bookmarked = str(a.id) in _article_saved_ids(db, user)
    if not user:
        out.locked = True
        out.body_paragraphs = out.body_paragraphs[:1]
    return out


# ---------- books: search across providers ----------
@app.get("/api/books/search", response_model=schemas.BookSearchResponse)
def books_search(
    q: str = Query(..., min_length=1),
    source: str = "all",
    page: int = 1,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    results = []
    count = 0
    try:
        if source in ("all", "gutenberg"):
            g = gutenberg.search(q, page=page)
            results += g["results"]
            count += g["count"]
    except httpx.HTTPError:
        pass
    try:
        if source in ("all", "openlibrary"):
            o = openlibrary.search(q, page=page)
            results += o["results"]
            count += o["count"]
    except httpx.HTTPError:
        pass
    try:
        if source in ("all", "googlebooks"):
            gb = googlebooks.search(q, page=page)
            results += gb["results"]
            count += gb["count"]
    except httpx.HTTPError:
        pass
    try:
        if source in ("all", "standardebooks"):
            se = standardebooks.search(q, page=page)
            results += se["results"]
            count += se["count"]
    except httpx.HTTPError:
        pass

    saved = _saved_lookup(db, user, "book")
    for r in results:
        r["saved"] = (r["source"], r["external_id"]) in saved

    return {"count": count, "results": results}


@app.get("/api/books/featured", response_model=schemas.BookSearchResponse)
def books_featured(
    db: Session = Depends(get_db), user: Optional[models.User] = Depends(get_current_user_optional)
):
    try:
        g = gutenberg.popular()
    except httpx.HTTPError:
        g = {"count": 0, "results": []}
    saved = _saved_lookup(db, user, "book")
    for r in g["results"]:
        r["saved"] = (r["source"], r["external_id"]) in saved
    return g


@app.get("/api/books/gutenberg/{gutenberg_id}", response_model=schemas.BookPage)
def gutenberg_book_page(
    gutenberg_id: int,
    page: int = 1,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    try:
        result = gutenberg.get_book_page(gutenberg_id, page=page)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach Project Gutenberg right now")
    if not result.get("paragraphs"):
        raise HTTPException(status_code=404, detail="Book text not available")

    saved = _saved_lookup(db, user, "book")
    result["saved"] = ("gutenberg", str(gutenberg_id)) in saved

    if not user:
        result["locked"] = result["page"] > 1 or result["total_pages"] > 1
        if result["page"] == 1:
            result["paragraphs"] = result["paragraphs"][:6]
    return result


@app.get("/api/books/openlibrary/{work_key}", response_model=schemas.BookResult)
def openlibrary_book_detail(
    work_key: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    try:
        result = openlibrary.get_work(work_key)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach Open Library right now")
    saved = _saved_lookup(db, user, "book")
    result["saved"] = ("openlibrary", work_key) in saved
    return result
@app.get("/api/books/googlebooks/{volume_id}", response_model=schemas.BookResult)
def googlebooks_book_detail(
    volume_id: str,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    try:
        result = googlebooks.get_volume(volume_id)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach Google Books right now")
    saved = _saved_lookup(db, user, "book")
    result["saved"] = ("googlebooks", volume_id) in saved
    return result
@app.get("/api/books/standardebooks/{slug:path}", response_model=schemas.BookPage)
def standardebooks_book_page(
    slug: str,
    page: int = 1,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    try:
        result = standardebooks.get_book_page(slug, page=page)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach Standard Ebooks right now")
    if not result.get("paragraphs"):
        raise HTTPException(status_code=404, detail="Book text not available")

    saved = _saved_lookup(db, user, "book")
    result["saved"] = ("standardebooks", slug) in saved

    if not user:
        result["locked"] = result["page"] > 1 or result["total_pages"] > 1
        if result["page"] == 1:
            result["paragraphs"] = result["paragraphs"][:6]
    return result



# ---------- news ----------
@app.get("/api/news", response_model=List[schemas.NewsItem])
def news_list(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
):
    try:
        items = news.fetch(category=category)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not reach the news feed right now")
    saved = _saved_lookup(db, user, "news")
    for it in items:
        it["saved"] = ("rss", it["id"]) in saved
    return items


@app.get("/api/news/categories")
def news_categories():
    return news.categories()


# ---------- unified saved items ----------
@app.get("/api/saved", response_model=List[schemas.SavedItemOut])
def list_saved(
    kind: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user_required),
):
    q = db.query(models.SavedItem).filter(models.SavedItem.user_id == user.id)
    if kind:
        q = q.filter(models.SavedItem.kind == kind)
    return q.order_by(models.SavedItem.created_at.desc()).all()


@app.post("/api/saved/toggle")
def toggle_saved(
    payload: schemas.SavedToggleIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user_required),
):
    existing = (
        db.query(models.SavedItem)
        .filter(
            models.SavedItem.user_id == user.id,
            models.SavedItem.kind == payload.kind,
            models.SavedItem.source == payload.source,
            models.SavedItem.external_id == payload.external_id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False}

    item = models.SavedItem(
        user_id=user.id,
        kind=payload.kind,
        source=payload.source,
        external_id=payload.external_id,
        title=payload.title,
        creator=payload.creator,
        image_url=payload.image_url,
        url=payload.url,
    )
    db.add(item)
    db.commit()
    return {"saved": True}


@app.get("/api/health")
def health():
    return {"status": "ok"}
