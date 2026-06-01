import type { SavedProgress, UserStats, SavedVocab, CardState, BlankState, ExerciseMode } from './types';

const STORAGE_KEYS = {
  progress: 'cet6_sectionA_progress',
  stats: 'cet6_sectionA_stats',
  vocab: 'cet6_sectionA_vocab',
};

export function saveProgress(exerciseId: string, cardStates: CardState[], blankStates: BlankState[], mode: ExerciseMode): void {
  const data: SavedProgress = { exerciseId, cardStates, blankStates, mode, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(data));
}

export function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.progress);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProgress;
  } catch { return null; }
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEYS.progress);
}

export function saveStats(stats: UserStats): void {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
}

export function loadStats(): UserStats | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stats);
    if (!raw) return null;
    return JSON.parse(raw) as UserStats;
  } catch { return null; }
}

export function createDefaultStats(): UserStats {
  return {
    totalCompleted: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    streakDays: 0,
    lastPracticeDate: '',
    vocabCount: 0,
    completedExercises: [],
    errorDistribution: {},
    createdAt: new Date().toISOString().split('T')[0],
  };
}

export function updateStatsOnComplete(stats: UserStats, exerciseId: string, correctCount: number, totalBlanks: number): UserStats {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = stats.lastPracticeDate;
  
  let newStreak = stats.streakDays;
  if (lastDate !== today) {
    if (lastDate) {
      const last = new Date(lastDate);
      const now = new Date(today);
      const diff = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) newStreak += 1;
      else if (diff > 1) newStreak = 1;
    } else {
      newStreak = 1;
    }
  }

  const errorDist = { ...stats.errorDistribution };
  const wrong = totalBlanks - correctCount;
  if (wrong > 0) {
    errorDist['语义错误'] = (errorDist['语义错误'] || 0) + Math.ceil(wrong * 0.4);
    errorDist['搭配错误'] = (errorDist['搭配错误'] || 0) + Math.ceil(wrong * 0.3);
    errorDist['词性错误'] = (errorDist['词性错误'] || 0) + Math.floor(wrong * 0.3);
  }

  return {
    ...stats,
    totalCompleted: stats.totalCompleted + 1,
    totalCorrect: stats.totalCorrect + correctCount,
    totalAttempts: stats.totalAttempts + totalBlanks,
    streakDays: newStreak,
    lastPracticeDate: today,
    completedExercises: stats.completedExercises.includes(exerciseId) ? stats.completedExercises : [...stats.completedExercises, exerciseId],
    errorDistribution: errorDist,
  };
}

export function saveVocab(vocab: SavedVocab): void {
  const allVocab = loadAllVocab();
  const existing = allVocab.findIndex(v => v.exerciseId === vocab.exerciseId);
  if (existing >= 0) {
    allVocab[existing] = vocab;
  } else {
    allVocab.push(vocab);
  }
  localStorage.setItem(STORAGE_KEYS.vocab, JSON.stringify(allVocab));
}

export function loadAllVocab(): SavedVocab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.vocab);
    if (!raw) return [];
    return JSON.parse(raw) as SavedVocab[];
  } catch { return []; }
}

export function getVocabForExercise(exerciseId: string): SavedVocab | null {
  return loadAllVocab().find(v => v.exerciseId === exerciseId) || null;
}
