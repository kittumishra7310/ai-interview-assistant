export enum Tab {
  Interviewee = 'interviewee',
  Interviewer = 'interviewer',
}

export enum InterviewStatus {
  NotStarted = 'NOT_STARTED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
}

export enum QuestionDifficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export interface Question {
  id: number;
  text: string;
  difficulty: QuestionDifficulty;
  timeLimit: number; // in seconds
}

export interface InterviewAnswer {
  question: Question;
  answer: string;
  feedback?: string;
  score?: number;
}

export interface Candidate {
  id:string;
  name: string;
  email: string;
  phone: string;
  resumeContent: string;
  interviewStatus: InterviewStatus;
  answers: InterviewAnswer[];
  finalScore: number | null;
  summary: string | null;
  currentQuestionIndex: number;
  timeLeftOnQuestion: number | null; // Added to persist timer state
}