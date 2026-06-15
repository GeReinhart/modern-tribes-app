import json
from datetime import datetime, timezone
from html.parser import HTMLParser
from uuid import UUID


class _TextStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data):
        self._parts.append(data)


def strip_html(html: str) -> str:
    parser = _TextStripper()
    parser.feed(html)
    return " ".join(" ".join(parser._parts).split())


class _ContentSummaryParser(HTMLParser):
    _HEADER_TAGS = {"h1", "h2", "h3", "h4", "h5", "h6"}

    def __init__(self):
        super().__init__()
        self._in_header = False
        self._header_done = False
        self._header_parts: list[str] = []
        self._plain_parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if not self._header_done and tag in self._HEADER_TAGS:
            self._in_header = True

    def handle_endtag(self, tag):
        if self._in_header and tag in self._HEADER_TAGS:
            self._in_header = False
            self._header_done = True

    def handle_data(self, data):
        if self._in_header:
            self._header_parts.append(data)
        self._plain_parts.append(data)


async def update_document_content_with_revision(
    pool, document_id: str, content_html: str, user_id: str
) -> None:
    """Fetch current document, snapshot it into revisions, then update content_html."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT content_html, updated_at, updated_by, revisions FROM documents WHERE id = $1",
            UUID(document_id),
        )
        if not row:
            return

        revisions_raw = row["revisions"]
        current_revisions = (
            json.loads(revisions_raw) if isinstance(revisions_raw, str) else (revisions_raw or [])
        )
        updated_at = row["updated_at"]
        current_revisions.append(
            {
                "content_html": row["content_html"],
                "updated_at": updated_at.isoformat() if hasattr(updated_at, "isoformat") else str(updated_at),
                "updated_by": str(row["updated_by"]) if row["updated_by"] else None,
            }
        )

        await conn.execute(
            "UPDATE documents SET content_html = $1, content_summary = $2, content_text = $3, updated_at = $4, updated_by = $5, revisions = $6::jsonb WHERE id = $7",
            content_html,
            extract_content_summary(content_html),
            strip_html(content_html),
            datetime.now(timezone.utc),
            UUID(user_id),
            json.dumps(current_revisions),
            UUID(document_id),
        )


def extract_content_summary(html: str) -> str:
    parser = _ContentSummaryParser()
    parser.feed(html)

    if parser._header_parts:
        return "".join(parser._header_parts).strip()

    plain = "".join(parser._plain_parts).strip()
    if len(plain) <= 30:
        return plain
    return plain[:30] + "..."
