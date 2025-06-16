import apiClient from "./apiClient";

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
