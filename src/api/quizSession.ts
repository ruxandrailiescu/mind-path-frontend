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

export interface TeacherDashboardStats {
  activeStudentsCount: number;
  completionRate: number;
}

export interface StudentProgress {
  studentId: number;
  firstName: string;
  lastName: string;
  quizzesTaken: number;
  avgScore: number;
  lastActive: string;
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

  getDashboardStats: async (): Promise<TeacherDashboardStats> => {
    const response = await apiClient.get("/teacher/dashboard/stats");
    return response.data;
  },

  getStudentProgress: async (): Promise<StudentProgress[]> => {
    const reponse = await apiClient.get("/teacher/dashboard/students");
    return reponse.data;
  },
};
