import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizService } from "../api/quiz";
import { questionService } from "../api/question";
import { answerService } from "../api/answer";
import { formatApiError } from "../utils/validationUtils";
import {
  QuizStatus,
  QuestionType,
  QuestionDifficulty,
  QuizSummary,
  QuizUpdate,
  QuizCreation,
  QuestionCreation,
  QuestionUpdate,
  AnswerCreation,
  QuestionSummary,
  AnswerSummary,
} from "../types";

interface QuestionState {
  id: number;
  questionText: string;
  text?: string; // for compatibility with API response
  type: QuestionType;
  difficulty: QuestionDifficulty;
  answers: AnswerState[];
}

interface AnswerState {
  id: number;
  answerText: string;
  text?: string; // for compatibility with API response
  isCorrect: boolean;
}

const generateId = () => Math.floor(Math.random() * 10000);

export const useQuizForm = (isEditMode = false) => {
  const { quizId } = useParams<{ quizId: string }>();
  const numericQuizId = quizId ? parseInt(quizId, 10) : undefined;
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizSummary | null>(null);
  const [title, setTitle] = useState<string>("");
  const [status, setStatus] = useState<QuizStatus>("DRAFT");
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<QuestionState>({
    id: generateId(),
    questionText: "",
    type: "SINGLE_CHOICE",
    difficulty: "EASY",
    answers: [],
  });

  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>({
    id: generateId(),
    answerText: "",
    isCorrect: false,
  });

  useEffect(() => {
    if (isEditMode && numericQuizId !== undefined) {
      const fetchQuiz = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const fetchedQuiz = await quizService.getQuizById(numericQuizId);
          setQuiz(fetchedQuiz);
          setTitle(fetchedQuiz.title);
          setStatus(fetchedQuiz.status);

          const transformedQuestions =
            fetchedQuiz.questions?.map((q: QuestionSummary) => ({
              id: q.id,
              questionText: q.text,
              text: q.text,
              type: q.type,
              difficulty: q.difficulty,
              answers:
                q.answers?.map((a: AnswerSummary) => ({
                  id: a.id,
                  answerText: a.text,
                  text: a.text,
                  isCorrect: a.isCorrect,
                })) || [],
            })) || [];

          setQuestions(transformedQuestions);
        } catch (err) {
          const errorMessage = formatApiError(err);
          console.error(errorMessage);
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      fetchQuiz();
    }
  }, [isEditMode, numericQuizId]);

  const validateQuiz = () => {
    if (!title.trim()) {
      setError("Quiz title is required");
      return false;
    }

    if (questions.length === 0) {
      setError("At least one question is required");
      return false;
    }

    const invalidQuestion = questions.find((q) => q.answers.length === 0);
    if (invalidQuestion) {
      setError(
        `Question "${
          invalidQuestion.questionText || invalidQuestion.text
        }" has no answers`
      );
      return false;
    }

    const questionWithoutCorrectAnswer = questions.find(
      (q) => !q.answers.some((a) => a.isCorrect)
    );
    if (questionWithoutCorrectAnswer) {
      setError(
        `Question "${
          questionWithoutCorrectAnswer.questionText ||
          questionWithoutCorrectAnswer.text
        }" has no correct answer`
      );
      return false;
    }

    return true;
  };

  const validateCurrentQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      setError("Question text is required");
      return false;
    }

    if (currentQuestion.answers.length === 0) {
      setError("At least one answer is required");
      return false;
    }

    if (!currentQuestion.answers.some((a) => a.isCorrect)) {
      setError("At least one answer must be marked as correct");
      return false;
    }

    return true;
  };

  const validateCurrentAnswer = () => {
    if (!currentAnswer.answerText.trim()) {
      setError("Answer text is required");
      return false;
    }
    return true;
  };

  const handleAddAnswer = () => {
    setError(null);
    if (!validateCurrentAnswer()) return;

    setCurrentQuestion((prev) => ({
      ...prev,
      answers: [...prev.answers, { ...currentAnswer }],
    }));

    setCurrentAnswer({
      id: generateId(),
      answerText: "",
      isCorrect: false,
    });
  };

  const handleRemoveAnswer = (answerId: number) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      answers: prev.answers.filter((a) => a.id !== answerId),
    }));
  };

  const handleAddQuestion = () => {
    setError(null);
    if (!validateCurrentQuestion()) return;

    setQuestions((prev) => [...prev, { ...currentQuestion }]);

    setCurrentQuestion({
      id: generateId(),
      questionText: "",
      type: "SINGLE_CHOICE",
      difficulty: "EASY",
      answers: [],
    });
  };

  const handleRemoveQuestion = (questionId: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleUpdateQuiz = async () => {
    if (numericQuizId === undefined) return;

    setIsSaving(true);
    setError(null);

    try {
      const quizData: QuizUpdate = {
        status,
      };

      if (quiz && title !== quiz.title) {
        quizData.title = title;
      }

      await quizService.updateQuiz(numericQuizId, quizData);
      setQuiz((prev) => (prev ? { ...prev, title, status } : null));
      alert("Quiz updated successfully!");

      navigate(`/quizzes/${quizId}`);
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateQuestion = async (
    questionId: number,
    questionData: QuestionUpdate
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      await questionService.updateQuestion(questionId, questionData);

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => {
          if (q.id === questionId) {
            const updatedQuestion: QuestionState = {
              ...q,
              text: questionData.questionText || q.text,
              questionText: questionData.questionText || q.questionText || "",
              type: questionData.type
                ? (questionData.type as QuestionType)
                : q.type,
              difficulty: questionData.difficulty
                ? (questionData.difficulty as QuestionDifficulty)
                : q.difficulty,
            };
            return updatedQuestion;
          }
          return q;
        })
      );
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAnswer = async (
    answerId: number,
    answerData: AnswerCreation
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      await answerService.updateAnswer(answerId, answerData);

      setQuestions((prevQuestions) =>
        prevQuestions.map((question) => ({
          ...question,
          answers: question.answers.map((answer) =>
            answer.id === answerId
              ? {
                  ...answer,
                  text: answerData.answerText,
                  answerText: answerData.answerText,
                  isCorrect: answerData.isCorrect,
                }
              : answer
          ),
        }))
      );
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuiz = async () => {
    setError(null);
    if (!validateQuiz()) return;

    setIsSaving(true);

    try {
      const quizData: QuizCreation = {
        title,
        status,
      };

      const quizId = await quizService.createQuiz(quizData);

      for (const question of questions) {
        const questionData: QuestionCreation = {
          questionText: question.questionText || question.text || "",
          type: question.type,
          difficulty: question.difficulty,
        };

        await questionService.addQuestionToQuiz(quizId, questionData);

        const quizQuestions = await questionService.getQuizQuestions(quizId);
        const createdQuestion = quizQuestions.find(
          (q: QuestionSummary) =>
            q.text === (question.questionText || question.text)
        );

        if (!createdQuestion) {
          throw new Error(
            `Failed to find created question: ${
              question.questionText || question.text
            }`
          );
        }

        for (const answer of question.answers) {
          const answerData: AnswerCreation = {
            answerText: answer.answerText || answer.text || "",
            isCorrect: answer.isCorrect,
          };

          await answerService.addAnswerToQuestion(
            createdQuestion.id,
            answerData
          );
        }
      }

      navigate(`/quizzes/${quizId}`);
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setError(`${errorMessage}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuestion = async (
    questionId: number,
    questionData: Partial<QuestionState>
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const questionUpdateData: QuestionUpdate = {};

      if (questionData.questionText) {
        questionUpdateData.questionText = questionData.questionText;
      }

      if (questionData.type) {
        questionUpdateData.type = questionData.type;
      }

      if (questionData.difficulty) {
        questionUpdateData.difficulty = questionData.difficulty;
      }

      await questionService.updateQuestion(questionId, questionUpdateData);

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => {
          if (q.id === questionId) {
            return {
              ...q,
              text: questionData.questionText || q.text,
              questionText: questionData.questionText || q.questionText || "",
              type: questionData.type || q.type,
              difficulty: questionData.difficulty || q.difficulty,
            };
          }
          return q;
        })
      );
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAnswer = async (
    questionId: number,
    answerId: number,
    answerData: Partial<AnswerState>
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      const answerUpdateData: AnswerCreation = {
        answerText: answerData.answerText || "",
        isCorrect:
          answerData.isCorrect !== undefined ? answerData.isCorrect : false,
      };

      await answerService.updateAnswer(answerId, answerUpdateData);

      setQuestions((prevQuestions) =>
        prevQuestions.map((question) => {
          if (question.id === questionId) {
            return {
              ...question,
              answers: question.answers.map((answer) =>
                answer.id === answerId
                  ? {
                      ...answer,
                      text: answerData.answerText || answer.text,
                      answerText:
                        answerData.answerText || answer.answerText || "",
                      isCorrect:
                        answerData.isCorrect !== undefined
                          ? answerData.isCorrect
                          : answer.isCorrect,
                    }
                  : answer
              ),
            };
          }
          return question;
        })
      );
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    quiz,
    title,
    setTitle,
    status,
    setStatus,
    questions,
    setQuestions,
    isLoading,
    isSaving,
    error,
    setError,
    currentQuestion,
    setCurrentQuestion,
    currentAnswer,
    setCurrentAnswer,
    handleAddAnswer,
    handleRemoveAnswer,
    handleAddQuestion,
    handleRemoveQuestion,
    handleUpdateQuiz,
    handleUpdateQuestion,
    handleUpdateAnswer,
    handleCreateQuiz,
    handleEditQuestion,
    handleEditAnswer,
    navigate,
  };
};
