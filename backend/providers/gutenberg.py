"""
Project Gutenberg integration, via the free Gutendex catalog API
(https://gutendex.com - no API key required).

Gutenberg books are in the public domain, so unlike every other provider in
this app, we're allowed to fetch and serve the full text in-app rather than
just a preview and external link.
"""
import re
import httpx

GUTENDEX_BASE = "https://gutendex.com/books"
PAGE_SIZE = 12  # paragraphs per "page" when reading

_text_cache = {}
_meta_cache = {}


def _cover_url(book):
    return book.get("formats", {}).get("image/jpeg")


def _to_search_result(book):
    return {
        "source": "gutenberg",
        "external_id": str(book["id"]),
        "title": book.get("title", "Untitled"),
        "author": ", ".join(a["name"] for a in book.get("authors", [])) or "Unknown author",
        "cover_url": _cover_url(book),
        "description": None,
        "subjects": book.get("subjects", [])[:3],
        "full_text_available": True,
        "external_url": "https://www.gutenberg.org/ebooks/" + str(book["id"]),
    }


def search(query, page=1):
    resp = httpx.get(GUTENDEX_BASE, params={"search": query, "page": page}, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return {
        "count": data.get("count", 0),
        "results": [_to_search_result(b) for b in data.get("results", [])],
    }


def popular(page=1):
    resp = httpx.get(GUTENDEX_BASE, params={"page": page, "languages": "en"}, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return {
        "count": data.get("count", 0),
        "results": [_to_search_result(b) for b in data.get("results", [])],
    }


def get_meta(gutenberg_id):
    if gutenberg_id in _meta_cache:
        return _meta_cache[gutenberg_id]
    resp = httpx.get(GUTENDEX_BASE + "/" + str(gutenberg_id), timeout=10)
    resp.raise_for_status()
    data = resp.json()
    _meta_cache[gutenberg_id] = data
    return data


def _pick_text_url(formats):
    for key, url in formats.items():
        if key.startswith("text/plain"):
            return url
    return None


def _strip_boilerplate(text):
    start = re.search(r"\*\*\*\s*START OF.*?\*\*\*", text, re.IGNORECASE | re.DOTALL)
    if start:
        text = text[start.end():]
    end = re.search(r"\*\*\*\s*END OF.*?\*\*\*", text, re.IGNORECASE | re.DOTALL)
    if end:
        text = text[: end.start()]
    return text.strip()


def _split_paragraphs(text):
    raw = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    return [re.sub(r"\s+", " ", p) for p in raw]


def get_paragraphs(gutenberg_id):
    if gutenberg_id in _text_cache:
        return _text_cache[gutenberg_id]
    meta = get_meta(gutenberg_id)
    url = _pick_text_url(meta.get("formats", {}))
    if not url:
        return []
    resp = httpx.get(url, timeout=25, follow_redirects=True)
    resp.raise_for_status()
    text = _strip_boilerplate(resp.text)
    paragraphs = _split_paragraphs(text)
    _text_cache[gutenberg_id] = paragraphs
    return paragraphs


def get_book_page(gutenberg_id, page=1):
    meta = get_meta(gutenberg_id)
    paragraphs = get_paragraphs(gutenberg_id)
    total_pages = max(1, (len(paragraphs) + PAGE_SIZE - 1) // PAGE_SIZE)
    page = max(1, min(page, total_pages))
    start = (page - 1) * PAGE_SIZE
    chunk = paragraphs[start:start + PAGE_SIZE]
    result = _to_search_result(meta)
    result.update({
        "page": page,
        "total_pages": total_pages,
        "paragraphs": chunk,
    })
    return result
