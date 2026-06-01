import React from 'react';
import type { Blank } from '../types';

interface BlankAnalysisProps {
  blank: Blank;
  options: { letter: string; word: string; pos: string }[];
  filledLetter: string | null;
  onClose: () => void;
}

const POS_MAP: Record<string, { label: string; emoji: string }> = {
  'noun': { label: '名词', emoji: '📦' },
  'verb': { label: '动词', emoji: '⚡' },
  'adjective': { label: '形容词', emoji: '🎨' },
  'adverb': { label: '副词', emoji: '✨' },
};

function getPOSInfo(pos: string): { label: string; emoji: string } {
  const lower = pos.toLowerCase();
  for (const [key, info] of Object.entries(POS_MAP)) {
    if (lower.includes(key)) return info;
  }
  if (lower.includes('participle')) return { label: '分词', emoji: '🔗' };
  if (lower.includes('gerund')) return { label: '动名词', emoji: '🔄' };
  return { label: pos, emoji: '🏷️' };
}

const BlankAnalysis: React.FC<BlankAnalysisProps> = ({
  blank,
  options,
  filledLetter,
  onClose,
}) => {
  const filledWord = filledLetter
    ? options.find(o => o.letter === filledLetter)
    : null;
  const correctOption = options.find(o => o.letter === blank.answer);
  const posInfo = getPOSInfo(blank.partOfSpeech);

  // Determine needed word type hint
  const typeHint = blank.partOfSpeech.includes('noun')
    ? blank.partOfSpeech.includes('plural') ? '需要复数名词' : '需要名词'
    : blank.partOfSpeech.includes('verb')
    ? blank.partOfSpeech.includes('past') ? '需要过去式/过去分词'
    : blank.partOfSpeech.includes('present') || blank.partOfSpeech.includes('gerund') ? '需要 -ing 形式'
    : '需要动词原形'
    : blank.partOfSpeech.includes('adjective') ? '需要形容词'
    : blank.partOfSpeech.includes('adverb') ? '需要副词'
    : '';

  return (
    <div className="analysis-panel p-4 md:p-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink-700 text-sm flex items-center gap-2">
          <span className="text-base">🔍</span>
          空格 {blank.number} 线索分析
        </h3>
        <button
          onClick={onClose}
          className="text-ink-400 hover:text-ink-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Position */}
      <div className="mb-4">
        <div className="text-xs text-ink-400 mb-1.5 uppercase tracking-wider font-medium">上下文</div>
        <div className="text-sm text-ink-700 bg-white/60 rounded-lg px-3 py-2.5 leading-relaxed font-mono border border-ink-100">
          {blank.position}
        </div>
      </div>

      {/* POS Badge */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 bg-ink-100 rounded-full px-3 py-1.5 text-sm text-ink-700">
          <span>{posInfo.emoji}</span>
          <span>{posInfo.label}</span>
        </div>
        {typeHint && (
          <div className="inline-flex items-center gap-1.5 bg-warm-200/60 rounded-full px-3 py-1.5 text-sm text-warm-800">
            <span>📌</span>
            <span>{typeHint}</span>
          </div>
        )}
      </div>

      {/* Filled word */}
      {filledWord && (
        <div className="mb-4 p-3 bg-warm-100 rounded-lg border border-warm-300/50">
          <div className="text-xs text-ink-400 mb-1">当前填入</div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-accent/15 text-accent flex items-center justify-center text-xs font-bold">
              {filledWord.letter}
            </span>
            <span className="font-semibold text-ink-800">{filledWord.word}</span>
            <span className="text-xs text-ink-400">({filledWord.pos})</span>
          </div>
        </div>
      )}

      {/* Analysis sections */}
      <div className="space-y-1">
        <AnalysisSection
          icon="📐"
          title="语法线索"
          content={blank.analysis.grammar_clue}
          defaultOpen
        />
        <AnalysisSection
          icon="🧩"
          title="上下文线索"
          content={blank.analysis.context_clue}
        />
        <AnalysisSection
          icon="🔗"
          title="搭配提示"
          content={blank.analysis.collocation}
        />
      </div>

      {/* Hint about correct answer */}
      {correctOption && filledLetter !== blank.answer && (
        <div className="mt-4 p-3 bg-amber-soft/60 rounded-lg border border-amber-200/50">
          <div className="text-xs text-warm-700 mb-1">💡 小提示</div>
          <div className="text-sm text-ink-600">
            正确答案的词性是 <span className="font-medium">{correctOption.pos}</span>
            {filledWord && filledWord.pos !== correctOption.pos && (
              <span>，而你选择的是 {filledWord.pos}，词性不匹配哦</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AnalysisSection: React.FC<{
  icon: string; title: string; content: string; defaultOpen?: boolean;
}> = ({ icon, title, content, defaultOpen }) => (
  <details className="group" open={defaultOpen}>
    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-ink-600 hover:text-ink-800 transition-colors list-none py-1">
      <span className="text-xs">{icon}</span>
      <span>{title}</span>
      <svg
        className="w-3 h-3 text-ink-400 group-open:rotate-180 transition-transform ml-auto"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </summary>
    <div className="mt-1 mb-2 pl-6 text-xs text-ink-500 leading-relaxed">
      {content}
    </div>
  </details>
);

export default BlankAnalysis;
