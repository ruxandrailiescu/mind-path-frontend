import apiClient from "./apiClient";
import { AttemptResult } from "./quizAttempt";

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

export const teacherDashboardService = {
  getDashboardStats: async (): Promise<TeacherDashboardStats> => {
    const response = await apiClient.get("/teacher/dashboard/stats");
    return response.data;
  },

  getStudentProgress: async (): Promise<StudentProgress[]> => {
    const reponse = await apiClient.get("/teacher/dashboard/students");
    return reponse.data;
  },
};

export const teacherGradingService = {
  getStudentAttempts: async (studentId: number): Promise<AttemptResult[]> => {
    const response = await apiClient.get(
      `/teacher/students/${studentId}/attempts`
    );
    return response.data;
  },

  gradeAnswer: async (
    attemptId: number,
    questionId: number,
    score: number
  ): Promise<void> => {
    const response = await apiClient.post(
      `/teacher/attempts/${attemptId}/questions/${questionId}/grade`,
      null,
      { params: { score } }
    );
    return response.data;
  },
};
