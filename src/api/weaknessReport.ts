import apiClient from "./apiClient";

export interface QuestionTypeStats {
  attempted: number;
  incorrect: number;
  averageTimeSec: number;
}

export interface WeaknessReport {
  totalQuestions: number;
  rushingErrors: number;
  statsByType: Record<string, QuestionTypeStats>;
}

export const weaknessDetectionService = {
  getWeaknessReport: async (
    from: string,
    to: string
  ): Promise<WeaknessReport> => {
    const response = await apiClient.get(`/students/me/weakness-report`, {
      params: { from, to },
    });
    return response.data;
  },
};
