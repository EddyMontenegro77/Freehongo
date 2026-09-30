export type CharacterQuizType =
  | 'characterToReading'
  | 'readingToCharacter'
  | 'characterToMeaning'
  | 'meaningToCharacter';

export interface QuizOption {
  value: string;
  label: string;
}

export type AnswerType = 'multiple' | 'open' | 'flashcard' | 'keyBoardWriting' | 'strokeWriting';
export type QuizMode = 'practice' | 'evaluation';
export type QuizOrder = 'random' | 'list';

export interface CharacterQuizConfig {
  listId: string;
  characterQuizType: CharacterQuizType;
  answerType: AnswerType;
  mode: QuizMode;
  order: QuizOrder;
}

export interface CharacterQuizQuestion {
  prompt: string;
  acceptedAnswers: string[];
  characterUnicode: string;
  options?: QuizOption[];
}

export interface QuizAnswerResult {
  characterUnicode: string;
  answer: string;
  correct: boolean;
}

export interface QuizEvaluationResult {
  id: string;
  listId: string;
  characterQuizType: CharacterQuizType;
  answerType: AnswerType;
  order: QuizOrder;
  startedAt: string;
  completedAt: string;
  score: number;
  total: number;
  answers: QuizAnswerResult[];
}
