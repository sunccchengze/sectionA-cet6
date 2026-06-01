// ============================================================
// Types
// ============================================================

export interface Option {
  letter: string;
  word: string;
  pos: string;
  used: boolean;
}

export interface BlankAnalysis {
  why_correct: string;
  grammar_clue: string;
  context_clue: string;
  collocation: string;
  common_mistakes: { wrong: string; reason: string }[];
}

export interface Blank {
  number: number;
  position: string;
  answer: string;
  answerWord: string;
  partOfSpeech: string;
  analysis: BlankAnalysis;
}

export interface Distractor {
  letter: string;
  word: string;
  explanation: string;
}

export interface VocabItem {
  expression: string;
  meaning: string;
  example: string;
}

export interface SectionAData {
  id: string;
  title: string;
  topic: string;
  article: string;
  blanks: Blank[];
  options: Option[];
  distractors: Distractor[];
  vocabulary_collection: VocabItem[];
}

// ============================================================
// Practice state types
// ============================================================

export type CardStatus = 'normal' | 'excluded' | 'suspended' | 'used';

export interface CardState {
  letter: string;
  status: CardStatus;
  blankNumber: number | null;
}

export interface BlankState {
  number: number;
  filledLetter: string | null;
  isFocused: boolean;
  isCorrect: boolean | null;
}

export type ExerciseMode = 'practice' | 'focus' | 'challenge';
export type AppView = 'dashboard' | 'practice' | 'review' | 'vocab' | 'mistakes';

export interface SavedProgress {
  exerciseId: string;
  cardStates: CardState[];
  blankStates: BlankState[];
  mode: ExerciseMode;
  timestamp: number;
}

export interface UserStats {
  totalCompleted: number;
  totalCorrect: number;
  totalAttempts: number;
  streakDays: number;
  lastPracticeDate: string;
  vocabCount: number;
  completedExercises: string[];
  errorDistribution: Record<string, number>;
  createdAt: string;
}

export interface SavedVocab {
  exerciseId: string;
  items: { expression: string; meaning: string; example: string; mastered: boolean }[];
}
