export function parseQueryTokens(query: string): string[] {
  return query
    .replace(/[&|!'"()\-:*]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

export function highlightHtml(html: string, query: string): string {
  const tokens = parseQueryTokens(query);
  if (!tokens.length || !html) return html;
  const parts = html.split(/(<[^>]+>)/);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      let text = part;
      for (const token of tokens) {
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
      }
      return text;
    })
    .join('');
}
