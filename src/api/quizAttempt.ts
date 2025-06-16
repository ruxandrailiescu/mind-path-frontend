import apiClient from "./apiClient";

export interface SubmitResponseRequest {
  questionId: number;
  selectedAnswerIds: number[];
  responseTime: number;
  isMultipleChoice?: boolean;
  textResponse?: string;
  isOpenEnded?: boolean;
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
  status: string | "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "ABANDONED";
  score: number | null;
  attemptTime: number | null;
  startedAt: string;
  completedAt: string | null;
  questions: Question[];
  responses?: Array<{
    questionId: number;
    answerId?: number;
    isMultipleChoice?: boolean;
    textResponse?: string;
    isOpenEnded?: boolean;
  }>;
}

export interface UserResponse {
  responseId: number;
  questionId: number;
  answerId: number;
  isCorrect: boolean;
  isMultipleChoice?: boolean;
  textResponse?: string;
  isOpenEnded?: boolean;
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

export const quizAttemptService = {
  startAttemptWithAccessCode: async (
    quizId: number,
    accessCode: string
  ): Promise<{ attemptId: number }> => {
    const response = await apiClient.post("/quizzes/attempts", {
      quizId,
      accessCode,
    });
    return response.data;
  },

  getAttempt: async (attemptId: number): Promise<AttemptResponse> => {
    const response = await apiClient.get(`/attempts/${attemptId}`);
    return response.data;
  },

  getInProgressAttempts: async (): Promise<AttemptResponse[]> => {
    const response = await apiClient.get("/attempts/in-progress");
    return response.data;
  },

  saveProgress: async (attemptId: number): Promise<AttemptResponse> => {
    const response = await apiClient.post(
      `/attempts/${attemptId}/save-progress`
    );
    return response.data;
  },

  submitAnswer: async (
    attemptId: number,
    request: SubmitResponseRequest
  ): Promise<UserResponse> => {
    const response = await apiClient.post(
      `/attempts/${attemptId}/responses`,
      request
    );
    return response.data;
  },

  submitAttempt: async (
    attemptId: number,
    request: SubmitAttemptRequest
  ): Promise<AttemptResponse> => {
    const response = await apiClient.post(
      `/attempts/${attemptId}/submit`,
      request
    );
    return response.data;
  },

  getResults: async (attemptId: number): Promise<AttemptResult> => {
    const response = await apiClient.get(`/attempts/${attemptId}/results`);
    return response.data;
  },

  getCompletedAttempts: async (): Promise<AttemptResult[]> => {
    const response = await apiClient.get("/attempts/completed");
    return response.data;
  },
};
