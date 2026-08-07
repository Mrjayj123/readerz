from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    saved_items = relationship("SavedItem", back_populates="user", cascade="all, delete-orphan")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(160), nullable=False)
    category = Column(String(80), index=True, nullable=False)
    read_time = Column(String(30), nullable=False)
    excerpt = Column(Text, nullable=False)
    body = Column(Text, nullable=False)  # paragraphs joined by "\n\n"
    img_url = Column(String(500), nullable=False)
    featured = Column(Boolean, default=False)

    @property
    def body_paragraphs(self):
        return [p for p in self.body.split("\n\n") if p.strip()]


class SavedItem(Base):
    """
    A single, unified 'saved for later' table covering local editorial
    articles as well as external books and news items. Rather than a foreign
    key, external content is identified by (kind, source, external_id), since
    it lives on someone else's server, not ours.
    """

    __tablename__ = "saved_items"
    __table_args__ = (
        UniqueConstraint("user_id", "kind", "source", "external_id", name="uq_user_item"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    kind = Column(String(20), nullable=False)      # 'article' | 'book' | 'news'
    source = Column(String(30), nullable=False)     # 'local' | 'gutenberg' | 'openlibrary' | 'rss'
    external_id = Column(String(120), nullable=False)

    title = Column(String(400), nullable=False)
    creator = Column(String(300))                   # author or publisher name
    image_url = Column(String(600))
    url = Column(String(600))                       # internal route or external link

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="saved_items")
