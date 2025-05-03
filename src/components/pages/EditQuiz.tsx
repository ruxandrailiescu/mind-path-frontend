import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizService } from "../../api/quiz";
import { questionService } from "../../api/question";
import { answerService } from "../../api/answer";
import {
  QuizStatus,
  QuestionType,
  QuestionDifficulty,
  AnswerCreation,
  QuestionCreation,
} from "../../types";
import { formatApiError } from "../../utils/validationUtils";

// Helper to generate IDs
const generateId = () => Math.floor(Math.random() * 10000);

// Interfaces for our component state
interface AnswerState extends AnswerCreation {
  id: number;
  questionId?: number; // Backend ID if exists
}

interface QuestionState extends QuestionCreation {
  id: number;
  answers: AnswerState[];
}

const EditQuiz = () => {
  const { quizId } = useParams(); // Get quiz ID from URL
  const navigate = useNavigate();

  // State for the quiz
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<QuizStatus>("DRAFT");
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Current question being edited
  const [currentQuestion, setCurrentQuestion] = useState<QuestionState>({
    id: generateId(),
    questionText: "",
    type: "SINGLE_CHOICE",
    difficulty: "EASY",
    answers: [],
  });

  // Current answer being added
  const [currentAnswer, setCurrentAnswer] = useState<AnswerState>({
    id: generateId(),
    answerText: "",
    isCorrect: false,
  });

  // Load the quiz data when component mounts
  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId) return;

      try {
        setIsLoading(true);

        // Step 1: Load the quiz details
        const quizIdInt = parseInt(quizId, 10);
        const quiz = await quizService.getQuizById(quizIdInt);
        console.error("Quiz id retrieved from url: ", quizIdInt);
        setTitle(quiz.title);
        setStatus(quiz.status);

        // Step 2: Load the questions for this quiz
        const quizQuestions = await questionService.getQuizQuestions(
          parseInt(quizId)
        );

        // Step 3: For each question, load its answers
        const questionsWithAnswers = await Promise.all(
          quizQuestions.map(async (question) => {
            const answers = await answerService.getQuestionAnswers(question.id);

            // Format each answer for our state
            const formattedAnswers = answers.map((answer) => ({
              id: generateId(),
              questionId: question.id,
              answerText: answer.text,
              isCorrect: answer.isCorrect,
            }));

            // Return the formatted question with its answers
            return {
              id: generateId(),
              questionId: question.id,
              questionText: question.text,
              type: question.type,
              difficulty: question.difficulty,
              answers: formattedAnswers,
            };
          })
        );

        setQuestions(questionsWithAnswers);
      } catch (err) {
        const errorMessage = formatApiError(err);
        setError(`Failed to load quiz: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizData();
  }, [quizId]);

  // Validation function for the quiz
  const validateQuiz = () => {
    if (!title.trim()) {
      setError("Quiz title is required");
      return false;
    }

    if (questions.length === 0) {
      setError("At least one question is required");
      return false;
    }

    // Check that all questions have at least one answer
    for (const question of questions) {
      if (question.answers.length === 0) {
        setError(`Question "${question.questionText}" has no answers`);
        return false;
      }

      // Check that each question has at least one correct answer
      if (!question.answers.some((a) => a.isCorrect)) {
        setError(`Question "${question.questionText}" has no correct answer`);
        return false;
      }
    }

    return true;
  };

  // Validation for current question
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

  // Add an answer to the current question
  const handleAddAnswer = () => {
    setError(null);

    if (!currentAnswer.answerText.trim()) {
      setError("Answer text is required");
      return;
    }

    setCurrentQuestion((prev) => ({
      ...prev,
      answers: [...prev.answers, { ...currentAnswer }],
    }));

    // Reset the current answer
    setCurrentAnswer({
      id: generateId(),
      answerText: "",
      isCorrect: false,
    });
  };

  // Remove an answer from the current question
  const handleRemoveAnswer = (answerId: number) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      answers: prev.answers.filter((a) => a.id !== answerId),
    }));
  };

  // Add current question to the quiz
  const handleAddQuestion = () => {
    setError(null);

    if (!validateCurrentQuestion()) {
      return;
    }

    setQuestions((prev) => [...prev, { ...currentQuestion }]);

    // Reset the current question
    setCurrentQuestion({
      id: generateId(),
      questionText: "",
      type: "SINGLE_CHOICE",
      difficulty: "EASY",
      answers: [],
    });
  };

  // Remove a question from the quiz
  const handleRemoveQuestion = (questionId: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  // Handle form submission to update the quiz
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateQuiz() || !quizId) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Update quiz data
      await quizService.updateQuiz(parseInt(quizId), { title, status });

      // Process each question
      for (const question of questions) {
        if (question.questionId) {
          // Existing question - update it
          await questionService.updateQuestion(question.questionId, {
            questionText: question.questionText,
            type: question.type,
            difficulty: question.difficulty,
          });

          // Get current answers for comparison
          const existingAnswers = await answerService.getQuestionAnswers(
            question.questionId
          );

          // Process each answer
          for (const answer of question.answers) {
            if (answer.questionId) {
              // Answer exists - update it
              await answerService.updateAnswer(answer.questionId, {
                answerText: answer.answerText,
                isCorrect: answer.isCorrect,
              });
            } else {
              // New answer - create it
              await answerService.addAnswerToQuestion(question.questionId, {
                answerText: answer.answerText,
                isCorrect: answer.isCorrect,
              });
            }
          }

          // Remove answers that no longer exist
          const currentAnswerIds = question.answers
            .filter((a) => a.questionId)
            .map((a) => a.questionId);

          for (const existingAnswer of existingAnswers) {
            if (!currentAnswerIds.includes(existingAnswer.id)) {
              await answerService.deleteAnswer(existingAnswer.id);
            }
          }
        } else {
          // New question - create it
          const newQuestionId = await questionService.addQuestionToQuiz(
            parseInt(quizId),
            {
              questionText: question.questionText,
              type: question.type,
              difficulty: question.difficulty,
            }
          );

          // Add all answers to this new question
          for (const answer of question.answers) {
            await answerService.addAnswerToQuestion(newQuestionId, {
              answerText: answer.answerText,
              isCorrect: answer.isCorrect,
            });
          }
        }
      }

      // Get current questions to find deleted ones
      const existingQuestions = await questionService.getQuizQuestions(
        parseInt(quizId)
      );
      const currentQuestionIds = questions
        .filter((q) => q.questionId)
        .map((q) => q.questionId);

      // Delete questions that were removed
      for (const existingQuestion of existingQuestions) {
        if (!currentQuestionIds.includes(existingQuestion.id)) {
          await questionService.deleteQuestion(existingQuestion.id);
        }
      }

      // Navigate back to quiz detail page
      navigate(`/quizzes/${quizId}`);
    } catch (err) {
      const errorMessage = formatApiError(err);
      setError(`Failed to update quiz: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return <div className="text-center p-6">Loading quiz data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Quiz</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-sm text-red-600 rounded-md p-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quiz Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quiz Information</h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Quiz Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as QuizStatus)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Questions</h2>

          {questions.length > 0 ? (
            <ul className="space-y-4 mb-6">
              {questions.map((question, index) => (
                <li key={question.id} className="p-4 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        <span className="text-gray-500">Q{index + 1}:</span>{" "}
                        {question.questionText}
                      </p>
                      <p className="text-sm text-gray-500">
                        {question.type} • {question.difficulty} •{" "}
                        {question.answers.length} answers
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mb-6">No questions added yet.</p>
          )}

          {/* Add New Question */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Add New Question</h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="questionText"
                  className="block text-sm font-medium text-gray-700"
                >
                  Question Text
                </label>
                <textarea
                  id="questionText"
                  value={currentQuestion.questionText}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      questionText: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="questionType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Question Type
                  </label>
                  <select
                    id="questionType"
                    value={currentQuestion.type}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        type: e.target.value as QuestionType,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="OPEN_ENDED">Open Ended</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="difficulty"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={currentQuestion.difficulty}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        difficulty: e.target.value as QuestionDifficulty,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Answer options */}
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Answer Options</h4>

                {currentQuestion.answers.length > 0 ? (
                  <ul className="space-y-2 mb-4">
                    {currentQuestion.answers.map((answer) => (
                      <li
                        key={answer.id}
                        className="flex items-center p-2 border rounded"
                      >
                        <span
                          className={`w-4 h-4 rounded-full mr-2 ${
                            answer.isCorrect ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></span>
                        <span className="flex-grow">{answer.answerText}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnswer(answer.id)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 mb-4">No answers added yet.</p>
                )}

                <div className="flex space-x-4">
                  <div className="flex-grow">
                    <input
                      type="text"
                      placeholder="Enter answer text"
                      value={currentAnswer.answerText}
                      onChange={(e) =>
                        setCurrentAnswer({
                          ...currentAnswer,
                          answerText: e.target.value,
                        })
                      }
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="isCorrect"
                      type="checkbox"
                      checked={currentAnswer.isCorrect}
                      onChange={(e) =>
                        setCurrentAnswer({
                          ...currentAnswer,
                          isCorrect: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="isCorrect"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Correct
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAnswer}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
                  disabled={
                    !currentQuestion.questionText.trim() ||
                    currentQuestion.answers.length === 0
                  }
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || questions.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditQuiz;
