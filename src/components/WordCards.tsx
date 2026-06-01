import React, { useState } from 'react';
import type { Option } from '../types';

interface WordCardsProps {
  options: Option[];
  cardStatuses: Record<string, string>;
  selectedLetter: string | null;
  onSelect: (letter: string) => void;
  onExclude: (letter: string) => void;
  onUnexclude: (letter: string) => void;
}

const POS_COLORS: Record<string, string> = {
  'n.': 'text-blue-600',
  'v.': 'text-rose-600',
  'adj': 'text-emerald-600',
  'adv': 'text-violet-600',
};

function getPOSColor(pos: string): string {
  const trimmed = pos.trim();
  for (const [key, color] of Object.entries(POS_COLORS)) {
    if (trimmed.startsWith(key)) return color;
  }
  return 'text-ink-500';
}

const WordCards: React.FC<WordCardsProps> = ({
  options,
  cardStatuses,
  selectedLetter,
  onSelect,
  onExclude,
  onUnexclude,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const usedCount = Object.values(cardStatuses).filter(s => s === 'used').length;
  const excludedCount = Object.values(cardStatuses).filter(s => s === 'excluded').length;

  // Sort: normal first, then excluded at bottom
  const sorted = [...options].sort((a, b) => {
    const aStatus = cardStatuses[a.letter] || 'normal';
    const bStatus = cardStatuses[b.letter] || 'normal';
    const order: Record<string, number> = { normal: 0, suspended: 1, excluded: 2, used: 3 };
    return (order[aStatus] || 0) - (order[bStatus] || 0);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-ink-600 flex items-center gap-1.5">
          <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
          备选词汇
        </h3>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <span>已用 {usedCount}/10</span>
          {excludedCount > 0 && <span>已排除 {excludedCount}</span>}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-2 overflow-y-auto pr-1 flex-1 pb-2" style={{ maxHeight: 'calc(100vh - 14rem)' }}>
        {sorted.map((opt) => {
          const status = cardStatuses[opt.letter] || 'normal';
          const isSelected = selectedLetter === opt.letter;
          const isExcluded = status === 'excluded';
          const isUsed = status === 'used';
          const posColor = getPOSColor(opt.pos);

          let cardClass = 'word-card p-2.5 md:p-3 flex items-center gap-2.5 group';
          if (isSelected) cardClass += ' selected';
          if (isExcluded) cardClass += ' excluded';
          if (isUsed) cardClass += ' used';

          return (
            <div
              key={opt.letter}
              className={cardClass}
              onClick={() => {
                if (isExcluded) {
                  onUnexclude(opt.letter);
                } else if (!isUsed) {
                  onSelect(opt.letter);
                }
              }}
              onMouseEnter={() => setHoveredCard(opt.letter)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Letter badge */}
              <div className={`
                flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all
                ${isSelected
                  ? 'bg-accent text-white scale-110'
                  : isExcluded
                  ? 'bg-ink-200 text-ink-400'
                  : isUsed
                  ? 'bg-success/15 text-success'
                  : 'bg-warm-200 text-warm-800'}
              `}>
                {opt.letter}
              </div>

              {/* Word & POS */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-ink-800 text-sm truncate">{opt.word}</div>
                <div className={`text-[11px] ${posColor} mt-0.5 truncate`}>{opt.pos}</div>
              </div>

              {/* Actions */}
              {!isUsed && !isExcluded && (
                <button
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-ink-300 hover:text-gentle-error hover:bg-gentle-error-light transition-all"
                  style={{ opacity: hoveredCard === opt.letter ? 1 : 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExclude(opt.letter);
                  }}
                  title="排除此选项"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}

              {isExcluded && (
                <button
                  className="flex-shrink-0 text-xs text-ink-300 hover:text-ink-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnexclude(opt.letter);
                  }}
                >
                  ↩
                </button>
              )}

              {isUsed && (
                <span className="flex-shrink-0 text-xs text-success font-bold">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div className="mt-2 pt-2 border-t border-ink-200/60 px-1 text-xs text-ink-400 leading-relaxed">
        💡 点词卡选中 → 点空格填入<br />
        或先点空格 → 再选词卡<br />
        悬停词卡可点 <span className="text-gentle-error">✕</span> 排除
      </div>
    </div>
  );
};

export default WordCards;
