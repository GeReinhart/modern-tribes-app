import React from 'react';

// A grocery item comment is plain text, but a line starting with "* " is meant as a bullet
// point (e.g. a recipe-style sub-list) rather than a literal asterisk, so it's rendered as a
// proper <li> instead of raw text; other lines each keep their own line break.
export function renderCommentContent(comment: string): React.ReactNode {
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} style={{ margin: '4px 0', paddingLeft: '18px' }}>
        {listItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  comment.split('\n').forEach((line, i) => {
    const bulletMatch = line.match(/^\*\s+(.*)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }
    flushList();
    if (line.trim() !== '') blocks.push(<div key={`line-${i}`}>{line}</div>);
  });
  flushList();

  return <>{blocks}</>;
}
