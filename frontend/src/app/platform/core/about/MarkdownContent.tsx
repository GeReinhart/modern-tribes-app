import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  content: string;
  fontSize?: string;
}

export const MarkdownContent: React.FC<Props> = ({
  content,
  fontSize = 'var(--font-xs)',
}) => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        fontSize,
        color: theme.colors.text,
        lineHeight: 1.5,
      }}
    >
      <ReactMarkdown
        components={{
          ul: ({ children }) => (
            <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>{children}</ul>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '2px', color: theme.colors.text, display: 'list-item' }}>{children}</li>
          ),
          p: ({ children }) => (
            <p style={{ margin: '0 0 4px', color: theme.colors.text }}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong style={{ color: theme.colors.primary }}>{children}</strong>
          ),
          a: ({ href, children }) => (
            <a href={href} style={{ color: theme.colors.primary }}>{children}</a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
