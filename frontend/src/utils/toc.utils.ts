export interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

export const extractAndInjectHeadings = (
    html: string,
    prefix: string,
    depth: number,
): { processedHtml: string; headings: HeadingItem[] } => {
    if (!html) return { processedHtml: html, headings: [] };
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const selector = Array.from({ length: depth }, (_, i) => `h${i + 1}`).join(',');
    const headings: HeadingItem[] = [];
    doc.querySelectorAll(selector).forEach((el, idx) => {
        const id = `${prefix}-h${idx}`;
        el.setAttribute('id', id);
        headings.push({ id, text: el.textContent || '', level: parseInt(el.tagName[1], 10) });
    });
    return { processedHtml: doc.body.innerHTML, headings };
};
