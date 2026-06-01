import React from 'react';
import { loadAllVocab } from '../store';

interface VocabBookProps {
  onBack: () => void;
}

const VocabBook: React.FC<VocabBookProps> = ({ onBack }) => {
  const [search, setSearch] = React.useState('');
  const allVocab = loadAllVocab();

  const flattened = allVocab.flatMap(v =>
    v.items.map(item => ({ ...item, exerciseId: v.exerciseId }))
  );

  const filtered = search
    ? flattened.filter(v =>
        v.expression.toLowerCase().includes(search.toLowerCase()) ||
        v.meaning.includes(search)
      )
    : flattened;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 fade-in relative z-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost text-sm">← 返回</button>
        <div>
          <h2 className="text-xl font-bold text-ink-800 flex items-center gap-2">
            <span>📚</span> 词汇收藏册
          </h2>
          <p className="text-ink-400 text-xs mt-0.5">共 {flattened.length} 条表达</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="搜索表达或中文释义..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/80 border border-ink-200 rounded-xl px-4 py-2.5 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-accent-light focus:ring-1 focus:ring-accent-light/50 transition-all"
        />
      </div>

      {/* Vocab list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-ink-400 text-sm">
            {search ? '没有找到匹配的表达' : '还没有收藏任何词汇\n完成练习后，核心词汇会自动出现在这里'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v, i) => (
            <div key={i} className="vocab-bookmark">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-800 truncate">
                    {v.expression}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">{v.meaning}</div>
                  <div className="text-xs text-ink-400 italic mt-1 truncate">{v.example}</div>
                </div>
                <span className="text-[10px] text-ink-300 bg-ink-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  {v.exerciseId}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VocabBook;
