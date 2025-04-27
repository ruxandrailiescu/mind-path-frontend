import { QuizCreation, QuizSummary, QuizUpdate } from "../types";
import apiClient from "./apiClient";

export const quizService = {
  createQuiz: async (quizData: QuizCreation): Promise<string> => {
    const response = await apiClient.post("/quizzes", quizData);
    return response.data;
  },
  getAllQuizzes: async (): Promise<QuizSummary[]> => {
    const response = await apiClient.get("/quizzes");
    return response.data;
  },
  getActiveQuizzes: async (): Promise<QuizSummary[]> => {
    const response = await apiClient.get("/quizzes/active");
    return response.data;
  },
  getQuizById: async (quizId: number): Promise<QuizSummary> => {
    const response = await apiClient.get(`/quizzes/${quizId}`);
    return response.data;
  },
  updateQuiz: async (quizId: number, quizData: QuizUpdate): Promise<void> => {
    await apiClient.patch(`/quizzes/${quizId}`, quizData);
  },
  deleteQuiz: async (quizId: number): Promise<void> => {
    await apiClient.delete(`/quizzes/${quizId}`);
  },
};
