import React from 'react';
import type { SectionAData } from '../types';

interface ReviewPanelProps {
  data: SectionAData;
  filledBlanks: Record<number, string | null>;
  results: Record<number, boolean>;
  score: number;
  onClose: () => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({
  data,
  filledBlanks,
  results,
  score,
  onClose,
}) => {
  const [tab, setTab] = React.useState<'blanks' | 'distractors' | 'vocab'>('blanks');
  const [expandedBlank, setExpandedBlank] = React.useState<number | null>(null);

  const getScoreEmoji = () => {
    if (score === 10) return { emoji: '🎉', label: '完美通关！', color: 'text-success' };
    if (score >= 7) return { emoji: '✨', label: '表现不错！', color: 'text-accent' };
    if (score >= 4) return { emoji: '💪', label: '继续加油！', color: 'text-ink-700' };
    return { emoji: '📚', label: '需要多多练习', color: 'text-ink-600' };
  };

  const scoreInfo = getScoreEmoji();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 fade-in relative z-10">
      {/* Score Header */}
      <div className="paper-card p-6 md:p-8 mb-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warm-200/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="text-5xl mb-2">{scoreInfo.emoji}</div>
          <h2 className={`text-2xl md:text-3xl font-bold mb-1 ${scoreInfo.color}`}>
            {scoreInfo.label}
          </h2>
          <div className="flex items-baseline justify-center gap-1 my-3">
            <span className="text-5xl font-bold text-accent">{score}</span>
            <span className="text-xl text-ink-400">/10</span>
          </div>
          <p className="text-ink-500 text-sm">{data.title} · {data.topic}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-warm-200/50 rounded-xl p-1">
        {[
          { key: 'blanks', label: '逐题解析', icon: '📝' },
          { key: 'distractors', label: '干扰项', icon: '🔎' },
          { key: 'vocab', label: '词汇本', icon: '📖' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white shadow-sm text-ink-800'
                : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.icon}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'blanks' && (
        <div className="space-y-3">
          {data.blanks.map(blank => {
            const isCorrect = results[blank.number];
            const myAnswer = filledBlanks[blank.number];
            const myWord = myAnswer
              ? data.options.find(o => o.letter === myAnswer)?.word || ''
              : '';
            const isExpanded = expandedBlank === blank.number;

            return (
              <div
                key={blank.number}
                className={`paper-card overflow-hidden transition-all ${
                  !isCorrect ? 'border-l-[3px] border-l-gentle-error' : ''
                }`}
              >
                {/* Header - always visible */}
                <button
                  onClick={() => setExpandedBlank(isExpanded ? null : blank.number)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-warm-100/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isCorrect
                        ? 'bg-success/10 text-success'
                        : 'bg-gentle-error/10 text-gentle-error'
                    }`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-ink-700">
                        第 {blank.number} 空
                      </span>
                      <span className="text-xs text-ink-400 ml-2">{blank.partOfSpeech}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Answer preview */}
                    <div className="text-right">
                      {isCorrect ? (
                        <span className="text-sm text-success font-medium">
                          {blank.answerWord}
                        </span>
                      ) : (
                        <div className="text-right">
                          <div className="text-xs text-gentle-error line-through">{myWord || '未填'}</div>
                          <div className="text-sm text-success font-medium">→ {blank.answerWord}</div>
                        </div>
                      )}
                    </div>

                    {/* Expand arrow */}
                    <svg
                      className={`w-4 h-4 text-ink-300 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-ink-100 pt-3">
                    {/* Context */}
                    <div className="mb-3 text-xs text-ink-500 bg-warm-100 rounded-lg px-3 py-2.5 font-mono leading-relaxed">
                      {blank.position}
                    </div>

                    {/* Explanations */}
                    <div className="space-y-2">
                      <ExplanationSection title="为什么对" icon="💡" content={blank.analysis.why_correct} defaultOpen />
                      <ExplanationSection title="语法线索" icon="📐" content={blank.analysis.grammar_clue} />
                      <ExplanationSection title="上下文线索" icon="🧩" content={blank.analysis.context_clue} />
                      <ExplanationSection title="搭配提示" icon="🔗" content={blank.analysis.collocation} />

                      {blank.analysis.common_mistakes.map((m, i) => (
                        <div key={i} className="text-xs text-ink-500 bg-warm-200/60 rounded-lg px-3 py-2.5 leading-relaxed">
                          <div className="font-medium text-ink-600 mb-0.5">⚠️ 常见误区</div>
                          <div>{m.wrong}：{m.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'distractors' && (
        <div className="space-y-3">
          <div className="text-sm text-ink-500 mb-3 px-1">
            理解干扰项为什么不适合任何空格，能有效提高排除法能力。
          </div>
          {data.distractors.map(d => (
            <div key={d.letter} className="paper-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-ink-100 flex items-center justify-center text-xs font-bold text-ink-500">
                  {d.letter}
                </span>
                <span className="font-semibold text-ink-700">{d.word}</span>
              </div>
              <p className="text-sm text-ink-500 leading-relaxed">{d.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'vocab' && (
        <div className="space-y-2">
          <div className="text-sm text-ink-500 mb-3 px-1">
            本题值得积累的核心表达与高频搭配，建议收藏复习：
          </div>
          {data.vocabulary_collection.map((v, i) => (
            <div key={i} className="vocab-bookmark">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-800">{v.expression}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{v.meaning}</div>
                  <div className="text-xs text-ink-400 italic mt-1">{v.example}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      <div className="mt-8 text-center">
        <button
          onClick={onClose}
          className="btn-warm text-base px-8 py-3"
        >
          返回主页
        </button>
      </div>
    </div>
  );
};

const ExplanationSection: React.FC<{
  title: string; icon: string; content: string; defaultOpen?: boolean;
}> = ({ title, icon, content, defaultOpen }) => (
  <details className="group" open={defaultOpen}>
    <summary className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-ink-600 hover:text-ink-800 transition-colors list-none py-1">
      <span className="text-xs">{icon}</span>
      <span>{title}</span>
      <svg
        className="w-3 h-3 text-ink-300 group-open:rotate-180 transition-transform ml-auto"
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

export default ReviewPanel;
