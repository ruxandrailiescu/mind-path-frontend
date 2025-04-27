export type QuizStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type QuestionType = "MULTIPLE_CHOICE" | "OPEN_ENDED" | "SINGLE_CHOICE";
export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuizCreation {
  title: string;
  status?: QuizStatus;
}

export interface QuizUpdate {
  title?: string;
  status?: QuizStatus;
}

export interface QuestionCreation {
  questionText: string;
  type: string;
  difficulty: string;
}

export interface QuestionUpdate {
  questionText?: string;
  type?: string;
  difficulty?: string;
}

export interface AnswerCreation {
  answerText: string;
  isCorrect: boolean;
}

export interface AnswerSummary {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuestionSummary {
  id: number;
  text: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  answers: AnswerSummary[];
}

export interface QuizSummary {
  id: number;
  title: string;
  createdBy: string;
  status: QuizStatus;
  createdAt: string;
  questions: QuestionSummary[];
}
