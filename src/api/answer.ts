import { AnswerCreation, AnswerSummary } from "../types";
import apiClient from "./apiClient";

export const answerService = {
  addAnswerToQuestion: async (
    questionId: number,
    answerData: AnswerCreation
  ): Promise<void> => {
    await apiClient.post(`/questions/${questionId}/answers`, answerData);
  },
  getQuestionAnswers: async (questionId: number): Promise<AnswerSummary[]> => {
    const response = await apiClient.get(`/questions/${questionId}/answers`);
    return response.data;
  },
  updateAnswer: async (
    answerId: number,
    answerData: Partial<AnswerCreation>
  ): Promise<void> => {
    await apiClient.patch(`/answers/${answerId}`, answerData);
  },
  deleteAnswer: async (answerId: number): Promise<void> => {
    await apiClient.delete(`/answers/${answerId}`);
  },
};
