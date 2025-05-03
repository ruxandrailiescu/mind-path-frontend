import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { quizService } from "../../api/quiz";
import { questionService } from "../../api/question";
import { answerService } from "../../api/answer";
import { QuizSummary, QuestionSummary, AnswerSummary } from "../../types";
import { formatApiError } from "../../utils/validationUtils";
import { ArrowLeft, Edit, Trash2, Clock, User, BookOpen } from "lucide-react";

interface QuestionWithAnswers extends QuestionSummary {
  answers: AnswerSummary[];
}

interface QuizWithQuestions extends QuizSummary {
  questions: QuestionWithAnswers[];
}

const ViewQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = Number(id);

  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch quiz details
        const quizData = await quizService.getQuizById(quizId);

        // Fetch quiz questions
        const questions = await questionService.getQuizQuestions(quizId);

        // For each question, fetch its answers
        const questionsWithAnswers: QuestionWithAnswers[] = [];

        for (const question of questions) {
          const answers = await answerService.getQuestionAnswers(question.id);
          questionsWithAnswers.push({
            ...question,
            answers: answers,
          });
        }

        // Combine quiz with its questions and answers
        setQuiz({
          ...quizData,
          questions: questionsWithAnswers,
        });
      } catch (err) {
        const errorMessage = formatApiError(err);
        console.error(errorMessage);
        setError(`Failed to load quiz: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (quizId) {
      fetchQuizData();
    }
  }, [quizId]);

  const handleDeleteQuiz = async () => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    try {
      await quizService.deleteQuiz(quizId);
      navigate("/teacher"); // Redirect to teacher dashboard after deletion
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      alert("Failed to delete quiz. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Loading quiz data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-sm text-red-600 rounded-md p-4 mb-4">
          {error}
        </div>
        <div className="mt-4">
          <Link
            to="/teacher"
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">Quiz not found.</p>
        </div>
        <div className="mt-4">
          <Link
            to="/teacher"
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with quiz title and actions */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Link
              to="/teacher"
              className="text-indigo-600 hover:text-indigo-800 flex items-center mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <div className="flex mt-2 text-sm text-gray-500 items-center space-x-4">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                ${
                  quiz.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : quiz.status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {quiz.status}
              </span>
              <span className="flex items-center">
                <BookOpen size={16} className="mr-1" />
                {quiz.questions.length} question
                {quiz.questions.length !== 1 ? "s" : ""}
              </span>
              {quiz.createdBy && (
                <span className="flex items-center">
                  <User size={16} className="mr-1" />
                  {quiz.createdBy}
                </span>
              )}
              {quiz.createdAt && (
                <span className="flex items-center">
                  <Clock size={16} className="mr-1" />
                  {new Date(quiz.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/teacher/edit-quiz/${quiz.id}`}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Edit size={16} className="mr-1" /> Edit Quiz
            </Link>
            <button
              onClick={handleDeleteQuiz}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 size={16} className="mr-1" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Questions and Answers */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>

        {quiz.questions.length === 0 ? (
          <p className="text-gray-500">
            This quiz doesn't have any questions yet.
          </p>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((question, qIndex) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">
                    <span className="text-gray-500">Q{qIndex + 1}.</span>{" "}
                    {question.text}
                  </h3>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {question.type}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full
                      ${
                        question.difficulty === "EASY"
                          ? "bg-green-100 text-green-800"
                          : question.difficulty === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {question.difficulty}
                    </span>
                  </div>
                </div>

                {/* Answers for this question */}
                <div className="mt-3 pl-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Answers:
                  </h4>
                  {question.answers && question.answers.length > 0 ? (
                    <ul className="space-y-2">
                      {question.answers.map((answer, aIndex) => (
                        <li key={answer.id} className="flex items-start">
                          <span
                            className={`w-5 h-5 flex items-center justify-center rounded-full mr-2 mt-0.5 ${
                              answer.isCorrect
                                ? "bg-green-100 text-green-800 border border-green-500"
                                : "bg-red-100 text-red-800 border border-red-500"
                            }`}
                          >
                            {answer.isCorrect ? "✓" : "✗"}
                          </span>
                          <span className="text-sm">
                            {aIndex + 1}. {answer.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No answers available for this question.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="mt-6 flex justify-between">
        <Link
          to="/teacher"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Back to Dashboard
        </Link>
        <Link
          to={`/teacher/edit-quiz/${quiz.id}`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Edit Quiz
        </Link>
      </div>
    </div>
  );
};

export default ViewQuiz;
