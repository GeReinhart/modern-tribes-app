from html.parser import HTMLParser


class _ContentSummaryParser(HTMLParser):
    _HEADER_TAGS = {'h1', 'h2', 'h3', 'h4', 'h5', 'h6'}

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


def extract_content_summary(html: str) -> str:
    parser = _ContentSummaryParser()
    parser.feed(html)

    if parser._header_parts:
        return ''.join(parser._header_parts).strip()

    plain = ''.join(parser._plain_parts).strip()
    if len(plain) <= 30:
        return plain
    return plain[:30] + '...'
