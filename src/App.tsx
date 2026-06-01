import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sectionAData } from './data';
import {
  saveProgress, loadProgress, clearProgress,
  saveStats, loadStats, createDefaultStats, updateStatsOnComplete,
  saveVocab, getVocabForExercise,
} from './store';
import Dashboard from './components/Dashboard';
import ArticleArea from './components/ArticleArea';
import WordCards from './components/WordCards';
import BlankAnalysis from './components/BlankAnalysis';
import ReviewPanel from './components/ReviewPanel';
import VocabBook from './components/VocabBook';
import { AnimatePresence, motion } from 'framer-motion';

type AppView = 'dashboard' | 'practice' | 'review' | 'vocab';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [currentExerciseId, setCurrentExerciseId] = useState<string | null>(null);
  const [filledBlanks, setFilledBlanks] = useState<Record<number, string | null>>({});
  const [focusedBlank, setFocusedBlank] = useState<number | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [cardStatuses, setCardStatuses] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentExercise = sectionAData.find(e => e.id === currentExerciseId) || null;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Timer
  useEffect(() => {
    if (timerOn && view === 'practice' && !submitted) {
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerOn, view, submitted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Restore progress on exercise select
  const selectExercise = useCallback((id: string) => {
    const saved = loadProgress();
    if (saved && saved.exerciseId === id) {
      const filled: Record<number, string | null> = {};
      for (const bs of saved.blankStates) {
        filled[bs.number] = bs.filledLetter;
      }
      setFilledBlanks(filled);
      const cards: Record<string, string> = {};
      for (const cs of saved.cardStates) {
        cards[cs.letter] = cs.status;
      }
      setCardStatuses(cards);
    } else {
      setFilledBlanks({});
      setCardStatuses({});
    }
    setCurrentExerciseId(id);
    setFocusedBlank(null);
    setSelectedLetter(null);
    setSubmitted(false);
    setResults({});
    setScore(0);
    setShowAnalysis(false);
    setSeconds(0);
    setTimerOn(false);
    setView('practice');
  }, []);

  // Core fill logic using functional updates
  const fillBlank = useCallback((blankNum: number, letter: string) => {
    if (submitted) return;

    setFilledBlanks(prev => {
      const newFilled: Record<number, string | null> = { ...prev, [blankNum]: letter };

      const oldLetter = prev[blankNum];
      if (oldLetter && oldLetter !== letter) {
        setCardStatuses(cs => ({ ...cs, [oldLetter]: 'normal' }));
      }

      // Free this letter from any other blank
      for (const [bNumStr, bLetter] of Object.entries(prev)) {
        const bNum = parseInt(bNumStr, 10);
        if (bLetter === letter && bNum !== blankNum) {
          newFilled[bNum] = null;
        }
      }

      setCardStatuses(prevCards => ({ ...prevCards, [letter]: 'used' }));

      const filledCount = Object.values(newFilled).filter(v => v !== null).length;
      if (filledCount === 10) {
        setTimeout(() => showToast('所有空格已填满！可以提交了 ✨'), 300);
      }

      return newFilled;
    });

    setFocusedBlank(blankNum);
  }, [submitted, showToast]);

  const removeBlank = useCallback((blankNum: number) => {
    if (submitted) return;
    setFilledBlanks(prev => {
      const letter = prev[blankNum];
      if (letter) {
        setCardStatuses(cs => ({ ...cs, [letter]: 'normal' }));
      }
      return { ...prev, [blankNum]: null };
    });
    setSelectedLetter(null);
  }, [submitted]);

  const handleBlankFocus = useCallback((num: number | null) => {
    if (submitted) return;
    if (num === null) {
      setFocusedBlank(null);
      return;
    }
    if (selectedLetter) {
      fillBlank(num, selectedLetter);
      setSelectedLetter(null);
    } else {
      setFocusedBlank(num);
    }
  }, [submitted, selectedLetter, fillBlank]);

  const handleCardSelect = useCallback((letter: string) => {
    if (submitted) return;
    const status = cardStatuses[letter];
    if (status === 'used' || status === 'excluded') return;

    if (focusedBlank) {
      fillBlank(focusedBlank, letter);
      setSelectedLetter(null);
    } else {
      setSelectedLetter(prev => prev === letter ? null : letter);
    }
  }, [submitted, focusedBlank, fillBlank, cardStatuses]);

  const handleExclude = useCallback((letter: string) => {
    setCardStatuses(prev => ({ ...prev, [letter]: 'excluded' }));
    if (selectedLetter === letter) setSelectedLetter(null);
  }, [selectedLetter]);

  const handleUnexclude = useCallback((letter: string) => {
    setCardStatuses(prev => ({ ...prev, [letter]: 'normal' }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!currentExercise) return;

    // Check for unfilled blanks
    const unfilled = currentExercise.blanks.filter(b => !filledBlanks[b.number]);
    if (unfilled.length > 0) {
      if (!window.confirm(`还有 ${unfilled.length} 个空格未填入，确定要提交吗？`)) {
        return;
      }
    }
    const res: Record<number, boolean> = {};
    let correct = 0;
    for (const blank of currentExercise.blanks) {
      const myLetter = filledBlanks[blank.number] || null;
      res[blank.number] = myLetter === blank.answer;
      if (res[blank.number]) correct++;
    }
    setResults(res);
    setScore(correct);
    setSubmitted(true);
    setTimerOn(false);

    const stats = loadStats() || createDefaultStats();
    const updatedStats = updateStatsOnComplete(stats, currentExercise.id, correct, 10);
    saveStats(updatedStats);

    const existingVocab = getVocabForExercise(currentExercise.id);
    if (!existingVocab) {
      saveVocab({
        exerciseId: currentExercise.id,
        items: currentExercise.vocabulary_collection.map(v => ({
          ...v, mastered: false,
        })),
      });
    }

    clearProgress();

    if (correct === 10) {
      showToast('太棒了！全部正确！🎉');
    } else if (correct >= 7) {
      showToast(`做得不错！${correct}/10 正确 ✨`);
    } else {
      showToast(`完成了！正确 ${correct}/10，查看解析吧 📚`);
    }
  }, [currentExercise, filledBlanks, showToast]);

  // Auto-save
  useEffect(() => {
    if (view === 'practice' && !submitted && currentExerciseId && currentExercise) {
      const cardStatesArr = Object.entries(cardStatuses).map(([letter, status]) => ({
        letter,
        status: status as 'normal' | 'excluded' | 'suspended' | 'used',
        blankNumber: null,
      }));
      const blankStatesArr = currentExercise.blanks.map(b => ({
        number: b.number,
        filledLetter: filledBlanks[b.number] || null,
        isFocused: false,
        isCorrect: null,
      }));
      saveProgress(currentExerciseId, cardStatesArr, blankStatesArr, 'practice');
    }
  }, [filledBlanks, cardStatuses, view, submitted, currentExerciseId, currentExercise]);

  const handleReset = useCallback(() => {
    setFilledBlanks({});
    setCardStatuses({});
    setFocusedBlank(null);
    setSelectedLetter(null);
    setSubmitted(false);
    setResults({});
    setScore(0);
    setShowAnalysis(false);
    setSeconds(0);
    setTimerOn(false);
    clearProgress();
  }, []);

  const filledCount = Object.values(filledBlanks).filter(v => v !== null).length;
  const currentBlankData = focusedBlank
    ? currentExercise?.blanks.find(b => b.number === focusedBlank)
    : null;

  // ============================================================
  // Render: Dashboard
  // ============================================================
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen">
        <div className="sunbeam" />
        <Dashboard
          exercises={sectionAData}
          onSelect={selectExercise}
          onViewVocab={() => setView('vocab')}
        />
      </div>
    );
  }

  // ============================================================
  // Render: VocabBook
  // ============================================================
  if (view === 'vocab') {
    return (
      <div className="min-h-screen">
        <div className="sunbeam" />
        <VocabBook onBack={() => setView('dashboard')} />
      </div>
    );
  }

  // ============================================================
  // Render: Review
  // ============================================================
  if (view === 'review' && currentExercise) {
    return (
      <div className="min-h-screen">
        <div className="sunbeam" />
        <ReviewPanel
          data={currentExercise}
          filledBlanks={filledBlanks}
          results={results}
          score={score}
          onClose={() => setView('dashboard')}
        />
      </div>
    );
  }

  if (!currentExercise) return null;

  // ============================================================
  // Render: Practice
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col">
      <div className="sunbeam" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-ink-800/95 backdrop-blur text-warm-100 px-5 py-2.5 rounded-xl text-sm shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-warm-100/90 backdrop-blur-md border-b border-warm-300/40">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => { handleReset(); setView('dashboard'); }}
                className="text-ink-400 hover:text-ink-700 transition-colors flex-shrink-0"
                title="返回首页"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-ink-700 truncate">{currentExercise.title}</h1>
                <p className="text-xs text-ink-400 truncate">{currentExercise.topic}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="hidden md:flex flex-1 max-w-[16rem] mx-4">
              <div className="w-full">
                <div className="flex justify-between text-xs text-ink-400 mb-1">
                  <span>填入进度</span>
                  <span>{filledCount}/10</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${filledCount * 10}%` }} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTimerOn(!timerOn)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all font-mono ${
                  timerOn ? 'bg-accent/10 text-accent' : 'bg-ink-100 text-ink-400 hover:text-ink-600'
                }`}
                title={timerOn ? '暂停计时' : '开始计时'}
              >
                ⏱ {formatTime(seconds)}
              </button>

              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                  showAnalysis ? 'bg-accent/10 text-accent' : 'bg-ink-100 text-ink-400 hover:text-ink-600'
                }`}
                title="切换分析面板"
              >
                🔍 分析
              </button>

              {!submitted && (
                <button
                  onClick={handleReset}
                  className="text-xs px-2.5 py-1 rounded-full bg-ink-100 text-ink-400 hover:text-ink-600 transition-all"
                  title="重新开始"
                >
                  ↺
                </button>
              )}

              {submitted ? (
                <button
                  onClick={() => setView('review')}
                  className="btn-warm text-xs px-4 py-1.5"
                >
                  查看解析 →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="btn-warm text-xs px-4 py-1.5"
                >
                  提交答案
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full gap-4 px-4 py-5 relative z-10">
        {/* Article Area */}
        <div className="flex-1 min-w-0 order-1 md:order-1">
          {/* Mobile progress */}
          <div className="md:hidden mb-3">
            <div className="flex justify-between text-xs text-ink-400 mb-1">
              <span>填入进度</span>
              <span>{filledCount}/10</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${filledCount * 10}%` }} />
            </div>
          </div>

          <div className="paper-card p-5 md:p-7 mb-4">
            <ArticleArea
              data={currentExercise}
              filledBlanks={filledBlanks}
              focusedBlank={focusedBlank}
              submitted={submitted}
              results={results}
              onBlankFocus={handleBlankFocus}
              onBlankRemove={removeBlank}
            />
          </div>

          {/* Blank Status Indicators */}
          {!submitted && (
            <div className="flex flex-wrap gap-1.5 mb-4 px-1">
              {currentExercise.blanks.map(blank => {
                const isFilled = !!filledBlanks[blank.number];
                const isFocused = focusedBlank === blank.number;
                return (
                  <button
                    key={blank.number}
                    onClick={() => handleBlankFocus(blank.number)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isFocused
                        ? 'bg-accent text-white shadow-md shadow-accent/20'
                        : isFilled
                        ? 'bg-success-light text-success border border-success/20'
                        : 'bg-warm-200 text-ink-400 border border-ink-200 hover:border-accent-light'
                    }`}
                  >
                    {blank.number}
                  </button>
                );
              })}
            </div>
          )}

          {/* Analysis panel - auto-show when blank is focused */}
          <AnimatePresence>
            {(showAnalysis || (focusedBlank && !submitted)) && currentBlankData && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <BlankAnalysis
                  blank={currentBlankData}
                  options={currentExercise.options}
                  filledLetter={filledBlanks[currentBlankData.number] || null}
                  onClose={() => { setShowAnalysis(false); setFocusedBlank(null); }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected word indicator */}
          {selectedLetter && !focusedBlank && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 px-4 py-2 bg-accent/5 border border-accent/20 rounded-xl text-sm text-accent flex items-center gap-2"
            >
              <span className="text-base">👆</span>
              已选择 <strong>{currentExercise.options.find(o => o.letter === selectedLetter)?.word}</strong>，请点击文章中的空格填入
            </motion.div>
          )}
        </div>

        {/* Word Cards Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0 order-2 md:order-2">
          <div className="paper-card p-4 sticky top-20" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
            <WordCards
              options={currentExercise.options}
              cardStatuses={cardStatuses}
              selectedLetter={selectedLetter}
              onSelect={handleCardSelect}
              onExclude={handleExclude}
              onUnexclude={handleUnexclude}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
