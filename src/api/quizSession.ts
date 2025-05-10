import apiClient from "./apiClient";

export interface CreateSessionRequest {
  quizId: number;
  durationMinutes?: number;
}

export interface QuizSessionResponse {
  sessionId: number;
  quizId: number;
  accessCode: string;
  createdBy: number;
  status: "ACTIVE" | "EXPIRED" | "CLOSED";
  createdAt: string;
  expiresAt?: string;
}

export interface SubmitResponseRequest {
  questionId: number;
  answerId: number;
  responseTime: number;
  isMultipleChoice?: boolean;
}

export interface SubmitAttemptRequest {
  totalTime: number;
}

export interface Answer {
  id: number;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  type: string;
  difficulty: string;
  answers: Answer[];
}

export interface AttemptResponse {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  status: string | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ABANDONED';
  score: number | null;
  attemptTime: number | null;
  startedAt: string;
  completedAt: string | null;
  questions: Question[];
  responses?: Array<{questionId: number, answerId: number, isMultipleChoice?: boolean}>;
}

export interface UserResponse {
  responseId: number;
  questionId: number;
  answerId: number;
  isCorrect: boolean;
  isMultipleChoice?: boolean;
}

export interface AttemptResult {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  score: number;
  attemptTime: number;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  questions: Array<{
    id: number;
    text: string;
    type: string;
    answers: Array<{
      id: number;
      text: string;
      isSelected: boolean;
      isCorrect: boolean;
    }>;
    isCorrect: boolean;
  }>;
}

export const quizSessionService = {
  /**
   * Create a new quiz session with access code
   */
  createSession: async (request: CreateSessionRequest): Promise<QuizSessionResponse> => {
    const response = await apiClient.post("/quiz-sessions", request);
    return response.data;
  },

  /**
   * Validate an access code
   */
  validateAccessCode: async (accessCode: string): Promise<boolean> => {
    const response = await apiClient.get(`/quiz-sessions/validate?accessCode=${accessCode}`);
    return response.data;
  },

  /**
   * Start a quiz attempt using an access code
   */
  startAttemptWithAccessCode: async (quizId: number, accessCode: string): Promise<{ attemptId: number }> => {
    const response = await apiClient.post("/quizzes/attempts", {
      quizId,
      accessCode,
    });
    return response.data;
  },

  /**
   * Get attempt details
   */
  getAttempt: async (attemptId: number): Promise<AttemptResponse> => {
    const response = await apiClient.get(`/attempts/${attemptId}`);
    return response.data;
  },

  /**
   * Get all in-progress attempts for the current user
   */
  getInProgressAttempts: async (): Promise<AttemptResponse[]> => {
    const response = await apiClient.get('/attempts/in-progress');
    return response.data;
  },

  /**
   * Save the current progress of an attempt (without submitting)
   */
  saveProgress: async (attemptId: number): Promise<AttemptResponse> => {
    const response = await apiClient.post(`/attempts/${attemptId}/save-progress`);
    return response.data;
  },

  /**
   * Submit a response to a question
   */
  submitAnswer: async (attemptId: number, request: SubmitResponseRequest): Promise<UserResponse> => {
    const response = await apiClient.post(`/attempts/${attemptId}/responses`, request);
    return response.data;
  },

  /**
   * Submit the entire quiz attempt
   */
  submitAttempt: async (attemptId: number, request: SubmitAttemptRequest): Promise<AttemptResponse> => {
    const response = await apiClient.post(`/attempts/${attemptId}/submit`, request);
    return response.data;
  },

  /**
   * Get quiz results after submission
   */
  getResults: async (attemptId: number): Promise<AttemptResult> => {
    const response = await apiClient.get(`/attempts/${attemptId}/results`);
    return response.data;
  }
}; 