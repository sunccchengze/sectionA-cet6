import React from 'react';
import type { SectionAData } from '../types';
import { createDefaultStats, loadStats } from '../store';

interface DashboardProps {
  exercises: SectionAData[];
  onSelect: (id: string) => void;
  onViewVocab: () => void;
}

import { loadAllVocab } from '../store';

const Dashboard: React.FC<DashboardProps> = ({ exercises, onSelect, onViewVocab }) => {
  const stats = loadStats() || createDefaultStats();
  const allVocab = loadAllVocab();
  const vocabCount = allVocab.reduce((sum, v) => sum + v.items.length, 0);

  const accuracy = stats.totalAttempts > 0
    ? Math.round((stats.totalCorrect / stats.totalAttempts) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 fade-in relative z-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="text-2xl">📖</span>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-800 tracking-tight">
            CET6 Section A
          </h1>
        </div>
        <p className="text-ink-500 text-sm md:text-base max-w-md mx-auto leading-relaxed">
          阅读选词填空 · 沉浸式词汇推理训练
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="已完成" value={`${stats.totalCompleted}`} icon="✅" />
        <StatCard label="总正确率" value={`${accuracy}%`} icon="🎯" />
        <StatCard label="连续天数" value={`${stats.streakDays}`} icon="🔥" />
        <StatCard label="收藏词汇" value={`${vocabCount}`} icon="⭐" />
      </div>

      {/* Exercise List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-ink-700 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-amber-500 rounded-full" />
          真题训练
        </h2>
        <div className="grid gap-3">
          {exercises.map((ex) => {
            const isCompleted = stats.completedExercises.includes(ex.id);
            const yearShort = ex.id.slice(0, 2);
            const month = ex.id.slice(2, 4);
            const formattedYear = `20${yearShort}年${parseInt(month, 10)}月`;

            return (
              <button
                key={ex.id}
                onClick={() => onSelect(ex.id)}
                className="paper-card p-4 md:p-5 text-left transition-all duration-200 hover:shadow-md group w-full"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-ink-400 bg-ink-100 px-2 py-0.5 rounded-full">
                        {formattedYear}
                      </span>
                      {isCompleted && (
                        <span className="text-xs text-success font-medium">已完成</span>
                      )}
                    </div>
                    <h3 className="text-ink-800 font-semibold group-hover:text-accent transition-colors">
                      {ex.title}
                    </h3>
                    <p className="text-ink-500 text-sm mt-1">{ex.topic}</p>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center text-ink-500 group-hover:bg-accent-light group-hover:text-accent transition-all">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vocab Book Link */}
      <button
        onClick={onViewVocab}
        className="paper-card p-4 md:p-5 text-left transition-all duration-200 hover:shadow-md group w-full"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <div>
            <h3 className="text-ink-800 font-semibold group-hover:text-accent transition-colors">
              词汇收藏册
            </h3>
            <p className="text-ink-500 text-sm mt-0.5">复习已收藏的表达与搭配</p>
          </div>
        </div>
      </button>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-ink-200/50 text-center">
        <p className="text-xs text-ink-400">
          CET6 Section A · 沉浸式阅读训练
        </p>
        <p className="text-xs text-ink-300 mt-1">
          像解谜一样阅读，像推理一样学习
        </p>
      </footer>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div className="paper-card p-3 md:p-4 text-center">
    <div className="text-lg mb-1">{icon}</div>
    <div className="text-xl font-bold text-ink-800">{value}</div>
    <div className="text-xs text-ink-500 mt-0.5">{label}</div>
  </div>
);

export default Dashboard;
