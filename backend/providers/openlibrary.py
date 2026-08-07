"""
Open Library integration (https://openlibrary.org - no API key required).

Open Library covers a much wider catalog than Gutenberg, including books
still under copyright. We only ever return metadata, a cover image, and a
link out to read/borrow on Open Library or archive.org - never full text
for anything that isn't confirmed public domain.
"""
import httpx

SEARCH_URL = "https://openlibrary.org/search.json"
COVER_URL = "https://covers.openlibrary.org/b/id/{}-M.jpg"


def _cover(cover_i):
    return COVER_URL.format(cover_i) if cover_i else None


def _external_url(doc):
    ia_ids = doc.get("ia") or []
    if ia_ids:
        return "https://archive.org/details/" + ia_ids[0]
    key = doc.get("key", "")
    return "https://openlibrary.org" + key if key else "https://openlibrary.org"


def _to_search_result(doc):
    authors = doc.get("author_name") or []
    return {
        "source": "openlibrary",
        "external_id": doc.get("key", "").replace("/works/", ""),
        "title": doc.get("title", "Untitled"),
        "author": ", ".join(authors) or "Unknown author",
        "cover_url": _cover(doc.get("cover_i")),
        "description": None,
        "subjects": [],
        "first_publish_year": doc.get("first_publish_year"),
        "full_text_available": bool(doc.get("ia")),
        "external_url": _external_url(doc),
    }


def search(query, page=1, limit=20):
    resp = httpx.get(
        SEARCH_URL,
        params={
            "q": query,
            "page": page,
            "limit": limit,
            "fields": "key,title,author_name,cover_i,first_publish_year,ia,has_fulltext",
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        "count": data.get("numFound", 0),
        "results": [_to_search_result(d) for d in data.get("docs", [])],
    }


def get_work(work_key):
    resp = httpx.get("https://openlibrary.org/works/" + work_key + ".json", timeout=10)
    resp.raise_for_status()
    data = resp.json()
    description = data.get("description")
    if isinstance(description, dict):
        description = description.get("value")
    return {
        "source": "openlibrary",
        "external_id": work_key,
        "title": data.get("title", "Untitled"),
        "author": None,
        "cover_url": _cover((data.get("covers") or [None])[0]),
        "description": description,
        "subjects": (data.get("subjects") or [])[:5],
        "full_text_available": False,
        "external_url": "https://openlibrary.org/works/" + work_key,
    }
