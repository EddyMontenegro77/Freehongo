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

export type ImplementedAnswerType = Extract<AnswerType, 'multiple' | 'open'>;

export interface QuizSettings {
  characterQuizType: CharacterQuizType;
  answerType: ImplementedAnswerType;
  mode: QuizMode;
  order: QuizOrder;
}

export interface CharacterQuizConfig extends QuizSettings {
  listId: string;
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
