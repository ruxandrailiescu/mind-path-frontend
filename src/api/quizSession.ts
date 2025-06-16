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

export const quizSessionService = {
  createSession: async (
    request: CreateSessionRequest
  ): Promise<QuizSessionResponse> => {
    const response = await apiClient.post("/quiz-sessions", request);
    return response.data;
  },

  validateAccessCode: async (accessCode: string): Promise<boolean> => {
    const response = await apiClient.get(
      `/quiz-sessions/validate?accessCode=${accessCode}`
    );
    return response.data;
  },
};
