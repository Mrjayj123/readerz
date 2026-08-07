"""
News integration via public RSS feeds - no API key required.

We only ever surface the headline, publisher-provided summary, and a link to
the original article. We never scrape or reproduce full article bodies;
reading the full piece always happens on the publisher's own site.
"""
import hashlib
import re
import feedparser

FEEDS = {
    "World": "http://feeds.bbci.co.uk/news/world/rss.xml",
    "Technology": "http://feeds.bbci.co.uk/news/technology/rss.xml",
    "Business": "http://feeds.bbci.co.uk/news/business/rss.xml",
    "Science": "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "Culture": "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",
}

_item_cache = {}
_TAG_RE = re.compile(r"<[^>]+>")


def _make_id(link):
    return hashlib.md5(link.encode("utf-8")).hexdigest()[:12]


def _clean(html_text):
    if not html_text:
        return ""
    text = _TAG_RE.sub("", html_text).strip()
    return text


def _image_from_entry(entry):
    media = entry.get("media_content") or entry.get("media_thumbnail")
    if media:
        return media[0].get("url")
    for link in entry.get("links", []):
        if link.get("type", "").startswith("image"):
            return link.get("href")
    return None


def categories():
    return list(FEEDS.keys())


def fetch(category=None, per_feed=12):
    feeds = {category: FEEDS[category]} if category in FEEDS else FEEDS
    items = []
    for cat, url in feeds.items():
        parsed = feedparser.parse(url)
        for entry in parsed.entries[:per_feed]:
            link = entry.get("link", "")
            if not link:
                continue
            item_id = _make_id(link)
            item = {
                "id": item_id,
                "kind": "news",
                "source": "rss",
                "title": entry.get("title", "Untitled"),
                "summary": _clean(entry.get("summary", "")),
                "image_url": _image_from_entry(entry),
                "source_name": parsed.feed.get("title", "News"),
                "category": cat,
                "published": entry.get("published", ""),
                "external_url": link,
            }
            _item_cache[item_id] = item
            items.append(item)
    return items


def get_cached(item_id):
    return _item_cache.get(item_id)
