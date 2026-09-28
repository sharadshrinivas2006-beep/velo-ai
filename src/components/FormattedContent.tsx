import React from 'react';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inOrderedList = false;
  let orderedItems: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2.5 space-y-1.5 pl-5 list-disc text-[#202938]">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushOrderedList = () => {
    if (inOrderedList && orderedItems.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2.5 space-y-1.5 pl-5 list-decimal text-[#202938]">
          {orderedItems}
        </ol>
      );
      orderedItems = [];
      inOrderedList = false;
    }
  };

  const flushTable = () => {
    if (inTable && (tableHeaders.length > 0 || tableRows.length > 0)) {
      elements.push(
        <div key={`tbl-${elements.length}`} className="my-3 overflow-x-auto rounded-lg border border-[#D8E2EA]">
          <table className="w-full text-left text-xs text-[#202938]">
            {tableHeaders.length > 0 && (
              <thead className="bg-[#F8FAFC] text-[#202938] font-semibold border-b border-[#D8E2EA]">
                <tr>
                  {tableHeaders.map((th, i) => (
                    <th key={i} className="px-3.5 py-2.5">
                      {parseInlineStyles(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#D8E2EA]/60 bg-white">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#F8FAFC]/80">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2.5 text-[#202938]">
                      {parseInlineStyles(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const parseInlineStyles = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className="font-semibold text-[#202938]">
            {inner}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        const inner = part.slice(1, -1);
        return (
          <em key={index} className="italic text-[#202938]/90">
            {inner}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const inner = part.slice(1, -1);
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-[#EAF0F5] text-[#202938] font-mono text-[11px]">
            {inner}
          </code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();

    // Table line: | col | col |
    if (rawLine.startsWith('|') && rawLine.endsWith('|')) {
      flushList();
      flushOrderedList();
      const cells = rawLine
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      // Check if it's separator row: | --- | :--- |
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Horizontal Rule: ---
    if (/^---+$/.test(rawLine)) {
      flushList();
      flushOrderedList();
      elements.push(<hr key={`hr-${i}`} className="border-t border-[#D8E2EA] my-4" />);
      continue;
    }

    // Headings: ### or ## or ####
    if (rawLine.startsWith('#')) {
      flushList();
      flushOrderedList();
      const level = rawLine.match(/^#+/)?.[0].length || 1;
      const headingText = rawLine.replace(/^#+\s*/, '').replace(/^[🛡️📈💡🎯✉️📝📱📊⚠️]\s*/, '');

      if (level <= 2) {
        elements.push(
          <h2 key={`h-${i}`} className="text-base font-semibold text-[#202938] mt-4 mb-2 tracking-tight">
            {parseInlineStyles(headingText)}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3 key={`h-${i}`} className="text-sm font-semibold text-[#202938] mt-3 mb-1.5 tracking-tight">
            {parseInlineStyles(headingText)}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={`h-${i}`} className="text-xs font-semibold text-[#202938] mt-2.5 mb-1 uppercase tracking-wider">
            {parseInlineStyles(headingText)}
          </h4>
        );
      }
      continue;
    }

    // Bullet Lists: - or * or •
    if (/^[-*•]\s+/.test(rawLine)) {
      flushOrderedList();
      inList = true;
      const text = rawLine.replace(/^[-*•]\s+/, '');
      listItems.push(
        <li key={`li-${i}`} className="text-xs sm:text-sm leading-relaxed text-[#202938]">
          {parseInlineStyles(text)}
        </li>
      );
      continue;
    }

    // Numbered lists: 1. or 2.
    if (/^\d+\.\s+/.test(rawLine)) {
      flushList();
      inOrderedList = true;
      const text = rawLine.replace(/^\d+\.\s+/, '');
      orderedItems.push(
        <li key={`oli-${i}`} className="text-xs sm:text-sm leading-relaxed text-[#202938]">
          {parseInlineStyles(text)}
        </li>
      );
      continue;
    }

    // Flush any pending lists
    flushList();
    flushOrderedList();

    // Blockquote: > text
    if (rawLine.startsWith('>')) {
      const quoteText = rawLine.replace(/^>\s*/, '');
      elements.push(
        <div
          key={`q-${i}`}
          className="my-2.5 p-3.5 rounded-md bg-[#F8FAFC] border-l-2 border-[#426A8C] text-xs sm:text-sm text-[#202938] leading-relaxed italic"
        >
          {parseInlineStyles(quoteText)}
        </div>
      );
      continue;
    }

    // Empty line
    if (!rawLine) {
      continue;
    }

    // Disclaimer or note paragraph
    if (rawLine.toLowerCase().includes('disclaimer:') || rawLine.toLowerCase().includes('notice:')) {
      elements.push(
        <p key={`p-${i}`} className="my-2 text-[11px] text-[#667085] leading-normal">
          {parseInlineStyles(rawLine)}
        </p>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-xs sm:text-sm text-[#202938] leading-relaxed">
        {parseInlineStyles(rawLine)}
      </p>
    );
  }

  // Flush remaining
  flushList();
  flushOrderedList();
  flushTable();

  return <div className={`space-y-1 text-[#202938] ${className}`}>{elements}</div>;
};
