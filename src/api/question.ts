import { QuestionCreation, QuestionSummary, QuestionUpdate } from "../types";
import apiClient from "./apiClient";

export const questionService = {
  addQuestionToQuiz: async (
    quizId: number,
    questionData: QuestionCreation
  ): Promise<void> => {
    await apiClient.post(`/quizzes/${quizId}/questions`, questionData);
  },
  getQuizQuestions: async (quizId: number): Promise<QuestionSummary[]> => {
    const response = await apiClient.get(`/quizzes/${quizId}/questions`);
    return response.data;
  },
  updateQuestion: async (
    questionId: number,
    questionData: QuestionUpdate
  ): Promise<void> => {
    await apiClient.patch(`/questions/${questionId}`, questionData);
  },
  deleteQuestion: async (questionId: number): Promise<void> => {
    await apiClient.delete(`/questions/${questionId}`);
  },
};
