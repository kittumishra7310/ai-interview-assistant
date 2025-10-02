import { QuestionDifficulty } from './types';

export const INTERVIEW_QUESTIONS_CONFIG = [
  { difficulty: QuestionDifficulty.Easy, timeLimit: 60 },
  { difficulty: QuestionDifficulty.Easy, timeLimit: 60 },
  { difficulty: QuestionDifficulty.Medium, timeLimit: 180 },
  { difficulty: QuestionDifficulty.Medium, timeLimit: 180 },
  { difficulty: QuestionDifficulty.Hard, timeLimit: 300 },
  { difficulty: QuestionDifficulty.Hard, timeLimit: 300 },
];

export const TOTAL_QUESTIONS = INTERVIEW_QUESTIONS_CONFIG.length;