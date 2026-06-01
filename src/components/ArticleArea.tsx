import React from 'react';
import type { SectionAData } from '../types';

interface ArticleAreaProps {
  data: SectionAData;
  filledBlanks: Record<number, string | null>;
  focusedBlank: number | null;
  submitted: boolean;
  results: Record<number, boolean>;
  onBlankFocus: (num: number | null) => void;
  onBlankRemove: (num: number) => void;
}

const ArticleArea: React.FC<ArticleAreaProps> = ({
  data,
  filledBlanks,
  focusedBlank,
  submitted,
  results,
  onBlankFocus,
  onBlankRemove,
}) => {
  const paragraphs = data.article.split('\n').filter(p => p.trim().length > 0);

  return (
    <div className="text-[1.0625rem] leading-[2] text-ink-800 font-serif tracking-[0.01em]">
      {paragraphs.map((para, pi) => (
        <p
          key={pi}
          className={`mb-[1.25em] ${pi === 0 ? '' : 'indent-[2em]'}`}
        >
          {renderParagraphText(
            para,
            data.blanks,
            data.options,
            filledBlanks,
            focusedBlank,
            submitted,
            results,
            onBlankFocus,
            onBlankRemove,
          )}
        </p>
      ))}
    </div>
  );
};

function renderParagraphText(
  text: string,
  blanks: { number: number; answer: string; answerWord: string }[],
  options: { letter: string; word: string }[],
  filledBlanks: Record<number, string | null>,
  focusedBlank: number | null,
  submitted: boolean,
  results: Record<number, boolean>,
  onBlankFocus: (num: number | null) => void,
  onBlankRemove: (num: number) => void,
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const blankRegex = /__\((\d+)\)__/g;
  let lastIndex = 0;
  let match;

  while ((match = blankRegex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    const before = text.slice(lastIndex, match.index);

    if (before) {
      parts.push(<span key={`t-${lastIndex}`}>{before}</span>);
    }

    const blank = blanks.find(b => b.number === num);
    const filledLetter = filledBlanks[num] || null;
    const optionWord = filledLetter
      ? options.find(o => o.letter === filledLetter)?.word || ''
      : '';

    const isCorrect = submitted && blank ? results[num] : null;
    const isFocused = focusedBlank === num;

    let slotClass = 'inline-flex items-center justify-center min-w-[70px] md:min-w-[80px] px-2 md:px-3 py-0.5 rounded-md transition-all duration-200 relative ';

    if (submitted && blank) {
      slotClass += isCorrect
        ? 'border-b-2 border-success/40 bg-success/[0.06] text-success font-semibold'
        : 'border-b-2 border-gentle-error/40 bg-gentle-error/[0.06] text-gentle-error font-semibold';
    } else if (filledLetter && isFocused) {
      slotClass += 'border-b-2 border-accent bg-warm-200/50 shadow-[0_0_0_3px_rgba(200,150,50,0.12)]';
    } else if (filledLetter) {
      slotClass += 'border-b-2 border-success/30 bg-success/[0.04] font-semibold';
    } else if (isFocused) {
      slotClass += 'border-b-2 border-accent bg-warm-200/50 shadow-[0_0_0_3px_rgba(200,150,50,0.08)] animate-pulse';
    } else {
      slotClass += 'border-b-2 border-dashed border-ink-300/70 bg-warm-200/20 hover:border-accent/60 hover:bg-warm-200/30 cursor-pointer';
    }

    parts.push(
      <span
        key={`blank-${num}`}
        className={slotClass}
        onClick={(e) => {
          e.stopPropagation();
          if (submitted) {
            onBlankFocus(num);
          } else if (filledLetter) {
            onBlankRemove(num);
          } else {
            onBlankFocus(num);
          }
        }}
        title={!submitted ? '点击选择此空格' : ''}
      >
        {submitted && blank ? (
          <span className="inline-flex flex-col items-center leading-tight">
            <span className="text-[0.85rem]">{optionWord || filledLetter || '?'}</span>
            {!isCorrect && (
              <span className="text-[10px] text-success mt-0.5">→ {blank.answerWord}</span>
            )}
          </span>
        ) : (
          <span className="text-[0.85rem] font-medium text-ink-600">
            {optionWord || (
              <span className="text-ink-400 text-xs">
                {num}
              </span>
            )}
          </span>
        )}
      </span>,
    );

    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) {
    parts.push(<span key={`t-end-${lastIndex}`}>{remaining}</span>);
  }

  return parts;
}

export default ArticleArea;
