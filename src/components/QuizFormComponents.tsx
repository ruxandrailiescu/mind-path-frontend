import React, { useState } from "react";
import { QuizStatus, QuestionType, QuestionDifficulty } from "../types";

export interface QuestionState {
  id: number;
  questionText: string;
  text?: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  answers: AnswerState[];
}

interface AnswerState {
  id: number;
  answerText: string;
  text?: string;
  isCorrect: boolean;
}

interface HeaderProps {
  title: string;
  onBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack }) => (
  <header className="bg-white shadow">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <button
          onClick={onBack}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  </header>
);

interface ErrorMessageProps {
  error: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-sm text-red-600 rounded-md p-4 mb-4">
      {error}
    </div>
  );
};

interface QuizInfoFormProps {
  title: string;
  setTitle: (title: string) => void;
  status: QuizStatus;
  setStatus: (status: QuizStatus) => void;
}

export const QuizInfoForm: React.FC<QuizInfoFormProps> = ({
  title,
  setTitle,
  status,
  setStatus,
}) => (
  <div className="bg-white shadow rounded-lg mb-6">
    <div className="p-6">
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
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);

interface QuestionsListProps {
  questions: QuestionState[];
  onRemoveQuestion?: (questionId: number) => void;
  onEditQuestion?: (
    questionId: number,
    questionData: Partial<QuestionState>
  ) => void;
  onEditAnswer?: (
    questionId: number,
    answerId: number,
    answerData: Partial<AnswerState>
  ) => void;
  readOnly?: boolean;
}

export const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  onRemoveQuestion,
  onEditQuestion,
  onEditAnswer,
  readOnly = false,
}) => {
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);

  const [editedQuestionText, setEditedQuestionText] = useState("");
  const [editedQuestionType, setEditedQuestionType] =
    useState<QuestionType>("SINGLE_CHOICE");
  const [editedQuestionDifficulty, setEditedQuestionDifficulty] =
    useState<QuestionDifficulty>("EASY");
  const [editedAnswerText, setEditedAnswerText] = useState("");
  const [editedAnswerIsCorrect, setEditedAnswerIsCorrect] = useState(false);

  const startEditingQuestion = (question: QuestionState) => {
    setEditedQuestionText(question.questionText || question.text || "");
    setEditedQuestionType(question.type);
    setEditedQuestionDifficulty(question.difficulty);
    setEditingQuestionId(question.id);
  };

  const startEditingAnswer = (answer: AnswerState) => {
    setEditedAnswerText(answer.answerText || answer.text || "");
    setEditedAnswerIsCorrect(Boolean(answer.isCorrect));
    setEditingAnswerId(answer.id);
  };

  const saveQuestionEdit = (questionId: number) => {
    if (onEditQuestion) {
      onEditQuestion(questionId, {
        questionText: editedQuestionText,
        type: editedQuestionType,
        difficulty: editedQuestionDifficulty,
      });
    }
    setEditingQuestionId(null);
  };

  const saveAnswerEdit = (questionId: number, answerId: number) => {
    if (onEditAnswer) {
      onEditAnswer(questionId, answerId, {
        answerText: editedAnswerText,
        isCorrect: editedAnswerIsCorrect,
      });
    }
    setEditingAnswerId(null);
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setEditingAnswerId(null);
    setEditedQuestionText("");
    setEditedQuestionType("SINGLE_CHOICE");
    setEditedQuestionDifficulty("EASY");
    setEditedAnswerText("");
    setEditedAnswerIsCorrect(false);
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Questions</h2>
          </div>
          <p className="text-gray-500">No questions added yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Questions</h2>
        </div>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="mb-4">
                {editingQuestionId === question.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Question Text
                      </label>
                      <textarea
                        value={editedQuestionText}
                        onChange={(e) => setEditedQuestionText(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          value={editedQuestionType}
                          onChange={(e) =>
                            setEditedQuestionType(
                              e.target.value as QuestionType
                            )
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        >
                          <option value="SINGLE_CHOICE">Single Choice</option>
                          <option value="MULTIPLE_CHOICE">
                            Multiple Choice
                          </option>
                          <option value="OPEN_ENDED">Open Ended</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Difficulty
                        </label>
                        <select
                          value={editedQuestionDifficulty}
                          onChange={(e) =>
                            setEditedQuestionDifficulty(
                              e.target.value as QuestionDifficulty
                            )
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <button
                        type="button"
                        onClick={() => saveQuestionEdit(question.id)}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <h3 className="font-medium">
                      <span className="text-gray-500">Q{index + 1}:</span>{" "}
                      {question.text || question.questionText}
                    </h3>
                    {!readOnly && (
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditingQuestion(question)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Edit
                        </button>
                        {onRemoveQuestion && (
                          <button
                            type="button"
                            onClick={() => onRemoveQuestion(question.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-1 text-sm text-gray-500">
                  Type: {question.type} | Difficulty: {question.difficulty}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Answers:</h4>
                {(question.answers || []).map((answer) => (
                  <div
                    key={answer.id}
                    className={`p-2 rounded-md ${
                      answer.isCorrect
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {editingAnswerId === answer.id ? (
                      <div className="space-y-2">
                        <div>
                          <input
                            type="text"
                            value={editedAnswerText}
                            onChange={(e) =>
                              setEditedAnswerText(e.target.value)
                            }
                            className="block w-full rounded-md border border-gray-300 py-1 px-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            id={`isCorrect-${answer.id}`}
                            type="checkbox"
                            checked={editedAnswerIsCorrect}
                            onChange={(e) =>
                              setEditedAnswerIsCorrect(e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label
                            htmlFor={`isCorrect-${answer.id}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            Correct Answer
                          </label>
                        </div>
                        <div className="flex space-x-2 mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              saveAnswerEdit(question.id, answer.id)
                            }
                            className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <span>{answer.text || answer.answerText}</span>
                          <span className="ml-2 text-xs">
                            {answer.isCorrect ? "(Correct)" : ""}
                          </span>
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => startEditingAnswer(answer)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AddQuestionFormProps {
  currentQuestion: QuestionState;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<QuestionState>>;
  currentAnswer: AnswerState;
  setCurrentAnswer: React.Dispatch<React.SetStateAction<AnswerState>>;
  handleAddAnswer: () => void;
  handleRemoveAnswer: (answerId: number) => void;
  handleAddQuestion: () => void;
}

export const AddQuestionForm: React.FC<AddQuestionFormProps> = ({
  currentQuestion,
  setCurrentQuestion,
  currentAnswer,
  setCurrentAnswer,
  handleAddAnswer,
  handleRemoveAnswer,
  handleAddQuestion,
}) => (
  <div className="bg-white shadow rounded-lg mb-6">
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Question</h2>

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

        <div>
          <h3 className="text-md font-medium mb-2">Answer Options</h3>

          {currentQuestion.answers.length > 0 ? (
            <div className="space-y-2 mb-4">
              {currentQuestion.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-2 rounded-md ${
                    answer.isCorrect
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span>{answer.answerText || answer.text}</span>
                      <span className="ml-2 text-xs">
                        {answer.isCorrect ? "(Correct)" : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAnswer(answer.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No answers added yet.</p>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-md font-medium mb-2">Add Answer</h3>
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
              <label htmlFor="isCorrect" className="ml-2 text-sm text-gray-700">
                Correct
              </label>
            </div>
            <button
              type="button"
              onClick={handleAddAnswer}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add Answer
            </button>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            disabled={
              !currentQuestion.questionText?.trim() ||
              currentQuestion.answers.length === 0 ||
              !currentQuestion.answers.some((a) => a.isCorrect)
            }
          >
            Add Question
          </button>
        </div>
      </div>
    </div>
  </div>
);
