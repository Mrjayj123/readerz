from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_len(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- editorial articles ----------
class ArticleOut(BaseModel):
    id: int
    title: str
    author: str
    category: str
    read_time: str
    excerpt: str
    img_url: str
    featured: bool
    body_paragraphs: List[str]
    locked: bool = False
    bookmarked: bool = False

    class Config:
        from_attributes = True


class ArticleListItem(BaseModel):
    id: int
    title: str
    author: str
    category: str
    read_time: str
    excerpt: str
    img_url: str
    featured: bool
    bookmarked: bool = False

    class Config:
        from_attributes = True


# ---------- books (Gutenberg / Open Library) ----------
class BookResult(BaseModel):
    source: str
    external_id: str
    title: str
    author: Optional[str] = None
    cover_url: Optional[str] = None
    description: Optional[str] = None
    subjects: List[str] = []
    full_text_available: bool = False
    external_url: Optional[str] = None
    saved: bool = False


class BookSearchResponse(BaseModel):
    count: int
    results: List[BookResult]


class BookPage(BookResult):
    page: int = 1
    total_pages: int = 1
    paragraphs: List[str] = []
    locked: bool = False


# ---------- news (RSS) ----------
class NewsItem(BaseModel):
    id: str
    kind: str = "news"
    source: str = "rss"
    title: str
    summary: str
    image_url: Optional[str] = None
    source_name: str
    category: str
    published: str
    external_url: str
    saved: bool = False


# ---------- unified saved items ----------
class SavedToggleIn(BaseModel):
    kind: str          # 'article' | 'book' | 'news'
    source: str        # 'local' | 'gutenberg' | 'openlibrary' | 'rss'
    external_id: str
    title: str
    creator: Optional[str] = None
    image_url: Optional[str] = None
    url: Optional[str] = None


class SavedItemOut(BaseModel):
    id: int
    kind: str
    source: str
    external_id: str
    title: str
    creator: Optional[str] = None
    image_url: Optional[str] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True
