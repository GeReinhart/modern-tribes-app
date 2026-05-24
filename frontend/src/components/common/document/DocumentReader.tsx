import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { DocumentAttachments } from './DocumentAttachments';
import { AttachmentFile } from '@/types/document.types';
import { DocumentPage } from '@/types/document-page.types';
import { extractAndInjectHeadings, HeadingItem } from '@/utils/toc.utils';
import { X } from 'lucide-react';

export interface DocumentReaderProps {
    title: string;
    contentHtml: string;
    attachments: AttachmentFile[];
    pages: DocumentPage[];
    tocDepth: number;
    onClose?: () => void;
}

interface TocItem {
    id: string;
    text: string;
    level: number;
    sectionIndex: number | null;
}

interface ProcessedPage extends DocumentPage {
    processedHtml: string;
    headings: HeadingItem[];
}

const buildReaderContent = (title: string, contentHtml: string, pages: DocumentPage[], depth: number) => {
    const { processedHtml: mainHtml, headings: mainHeadings } = extractAndInjectHeadings(contentHtml, 'doc', depth);
    const processedPages: ProcessedPage[] = pages.map((page, idx) => {
        const { processedHtml, headings } = extractAndInjectHeadings(page.content_html, `page${idx}`, depth);
        return { ...page, processedHtml, headings };
    });
    const tocItems: TocItem[] = [
        { id: 'reader-main', text: title, level: 0, sectionIndex: null },
        ...mainHeadings.map(h => ({ ...h, sectionIndex: null })),
        ...processedPages.flatMap((page, idx) => [
            { id: `reader-page-${idx}`, text: page.title, level: 0, sectionIndex: idx + 1 },
            ...page.headings.map(h => ({ ...h, sectionIndex: null })),
        ]),
    ];
    return { mainHtml, processedPages, tocItems };
};

const scrollToSection = (id: string): void => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const TocEntryItem: React.FC<{ item: TocItem }> = ({ item }) => {
    const { theme } = useTheme();
    const isSection = item.level === 0;
    return (
        <li style={{ paddingLeft: `${item.level * 16}px` }}>
            <button
                type="button"
                onClick={() => scrollToSection(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: '2px 0', color: isSection ? theme.colors.text : theme.colors.primary, fontWeight: isSection ? 600 : 400, cursor: 'pointer', fontSize: 'var(--font-sm)', textAlign: 'left' }}
            >
                {isSection && item.sectionIndex !== null && (
                    <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)', minWidth: '16px' }}>{item.sectionIndex}.</span>
                )}
                {item.text}
            </button>
        </li>
    );
};

const ReaderToc: React.FC<{ items: TocItem[] }> = ({ items }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    return (
        <nav style={{ padding: '16px 24px', backgroundColor: theme.colors.surface, borderRadius: '10px', border: `1px solid ${theme.colors.border}`, marginBottom: '32px' }}>
            <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: theme.colors.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                {t('documentPages.tableOfContents')}
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {items.map((item) => <TocEntryItem key={item.id} item={item} />)}
            </ol>
        </nav>
    );
};

const ReaderPageSection: React.FC<{ page: ProcessedPage; index: number }> = ({ page, index }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const contentStyle: React.CSSProperties = { padding: '24px', backgroundColor: theme.colors.surface, borderRadius: '10px', border: `1px solid ${theme.colors.border}`, marginBottom: '24px' };
    const headerStyle: React.CSSProperties = { fontSize: 'var(--font-lg)', fontWeight: 700, color: theme.colors.text, marginBottom: '16px', paddingBottom: '8px', borderBottom: `2px solid ${theme.colors.primary}30` };
    return (
        <div id={`reader-page-${index}`} style={{ marginBottom: '32px' }}>
            <div style={headerStyle}>
                <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)', fontWeight: 500, marginRight: '8px' }}>{t('documentPages.pageOf', { index: index + 1 })}</span>
                {page.title}
            </div>
            {page.processedHtml && <div className="prose max-w-none" style={contentStyle} dangerouslySetInnerHTML={{ __html: page.processedHtml }} />}
            {page.attachments.length > 0 && <div style={{ marginBottom: '16px' }}><DocumentAttachments attachments={page.attachments} /></div>}
        </div>
    );
};

export const DocumentReader: React.FC<DocumentReaderProps> = ({ title, contentHtml, attachments, pages, tocDepth, onClose }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { mainHtml, processedPages, tocItems } = useMemo(
        () => buildReaderContent(title, contentHtml, pages, tocDepth),
        [title, contentHtml, pages, tocDepth],
    );
    const contentStyle: React.CSSProperties = { padding: '24px', backgroundColor: theme.colors.surface, borderRadius: '10px', border: `1px solid ${theme.colors.border}`, marginBottom: '24px' };
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {onClose && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h1 style={{ color: theme.colors.text, fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>{title}</h1>
                    <button type="button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface, color: theme.colors.secondary, cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                        <X size={14} />{t('documentPages.exitRead')}
                    </button>
                </div>
            )}
            <ReaderToc items={tocItems} />
            <div id="reader-main">
                {mainHtml && <div className="prose max-w-none" style={contentStyle} dangerouslySetInnerHTML={{ __html: mainHtml }} />}
                {attachments.length > 0 && <div style={{ marginBottom: '24px' }}><DocumentAttachments attachments={attachments} /></div>}
            </div>
            {processedPages.map((page, idx) => <ReaderPageSection key={page.id} page={page} index={idx} />)}
        </div>
    );
};
