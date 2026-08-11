"""
Google Books integration (https://www.googleapis.com/books/v1 - no API key
required for basic search, though one can be set via GOOGLE_BOOKS_API_KEY to
raise rate limits).

Google Books covers a very large modern + classic catalog, including books
still under copyright. As with Open Library, we only ever return metadata,
a cover image, and a link out to Google's own preview/reader - never full
text in-app for anything that isn't confirmed public domain.
"""
import os
import httpx

SEARCH_URL = "https://www.googleapis.com/books/v1/volumes"
API_KEY = os.environ.get("GOOGLE_BOOKS_API_KEY")


def _cover(image_links):
    if not image_links:
        return None
    return (
        image_links.get("thumbnail")
        or image_links.get("smallThumbnail")
    )


def _external_url(volume_info, item_id):
    return volume_info.get("previewLink") or volume_info.get("infoLink") or (
        "https://books.google.com/books?id=" + item_id
    )


def _to_search_result(item):
    info = item.get("volumeInfo", {})
    return {
        "source": "googlebooks",
        "external_id": item.get("id", ""),
        "title": info.get("title", "Untitled"),
        "author": ", ".join(info.get("authors", [])) or "Unknown author",
        "cover_url": _cover(info.get("imageLinks")),
        "description": info.get("description"),
        "subjects": (info.get("categories") or [])[:3],
        "full_text_available": False,
        "external_url": _external_url(info, item.get("id", "")),
    }


def _params(extra):
    p = dict(extra)
    if API_KEY:
        p["key"] = API_KEY
    return p


def search(query, page=1, page_size=20):
    start_index = (page - 1) * page_size
    resp = httpx.get(
        SEARCH_URL,
        params=_params({
            "q": query,
            "startIndex": start_index,
            "maxResults": page_size,
        }),
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    return {
        "count": data.get("totalItems", 0),
        "results": [_to_search_result(i) for i in data.get("items", [])],
    }


def get_volume(volume_id):
    resp = httpx.get(SEARCH_URL + "/" + volume_id, params=_params({}), timeout=10)
    resp.raise_for_status()
    return _to_search_result(resp.json())