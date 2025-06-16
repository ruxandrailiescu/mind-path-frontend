import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  RefreshCw,
  PlayCircle,
  CheckCircle,
} from "lucide-react";
import { quizService } from "../../api/quiz";
import {
  quizAttemptService,
  AttemptResponse,
  AttemptResult,
} from "../../api/quizAttempt";
import { QuizSummary } from "../../types";
import { formatApiError } from "../../utils/validationUtils";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeQuizzes, setActiveQuizzes] = useState<QuizSummary[]>([]);
  const [inProgressAttempts, setInProgressAttempts] = useState<
    AttemptResponse[]
  >([]);
  const [completedAttempts, setCompletedAttempts] = useState<AttemptResult[]>(
    []
  );
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  const totalPages = Math.ceil(completedAttempts.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const currentItems = completedAttempts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    const fetchActiveQuizzes = async () => {
      try {
        setIsLoadingQuizzes(true);
        const quizzes = await quizService.getActiveQuizzes();
        setActiveQuizzes(quizzes);
      } catch (err) {
        const errorMessage = formatApiError(err);
        console.error(errorMessage);
        setError(errorMessage);
        setActiveQuizzes([]);
      } finally {
        setIsLoadingQuizzes(false);
      }
    };

    const fetchInProgressAttempts = async () => {
      try {
        setIsLoadingAttempts(true);
        const attempts = await quizAttemptService.getInProgressAttempts();
        setInProgressAttempts(attempts);
      } catch (err) {
        const errorMessage = formatApiError(err);
        console.error(errorMessage);
        setInProgressAttempts([]);
      } finally {
        setIsLoadingAttempts(false);
      }
    };

    const fetchCompletedAttempts = async () => {
      try {
        setIsLoadingAttempts(true);
        const completedAttempts =
          await quizAttemptService.getCompletedAttempts();
        setCompletedAttempts(completedAttempts);
      } catch (err) {
        const errorMessage = formatApiError(err);
        console.error(errorMessage);
        setCompletedAttempts([]);
      } finally {
        setIsLoadingAttempts(false);
      }
    };

    fetchActiveQuizzes();
    fetchInProgressAttempts();
    fetchCompletedAttempts();
  }, []);

  const handleResumeAttempt = (attemptId: number) => {
    navigate(`/student/quiz-attempt/${attemptId}`);
  };

  if (isLoadingQuizzes && isLoadingAttempts) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error && activeQuizzes.length === 0 && inProgressAttempts.length === 0) {
    return <div className="bg-red-50 p-4 rounded-md text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {inProgressAttempts.length > 0 && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-4">Continue Your Progress</h1>
          <p className="text-gray-600 mb-4">
            You have {inProgressAttempts.length} quiz attempt
            {inProgressAttempts.length > 1 ? "s" : ""} in progress. Continue
            where you left off.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {inProgressAttempts.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {attempt.quizTitle}
                </h2>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock size={16} className="mr-1" />
                  <span>
                    Started: {new Date(attempt.startedAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleResumeAttempt(attempt.attemptId)}
                  className="w-full flex justify-center items-center bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Resume Quiz
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">Available Quizzes</h1>

      {!activeQuizzes || activeQuizzes.length === 0 ? (
        <p className="text-gray-500">No active quizzes available right now.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeQuizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <BookOpen size={16} className="mr-1" />
                <span>{quiz.questions?.length || 0} questions</span>
                <span className="mx-2">•</span>
                <Clock size={16} className="mr-1" />
                <span>Created by: {quiz.createdBy}</span>
              </div>
              <Link
                to={`/student/quiz-access/${quiz.id}`}
                className="block w-full text-center bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
              >
                <div className="flex justify-center items-center">
                  <PlayCircle size={16} className="mr-2" />
                  Start Quiz
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="p-4"></div>

      {completedAttempts.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Past Quiz Results</h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="p-2 rounded-md bg-gray-200 disabled:opacity-50"
              >
                ←
              </button>
              <span className="text-sm text-gray-600">
                {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className="p-2 rounded-md bg-gray-200 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentItems.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {attempt.quizTitle}
                </h2>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <BookOpen size={16} className="mr-1" />
                  <span>{attempt.questions?.length || 0} questions</span>
                  <span className="mx-2">•</span>
                  <CheckCircle size={16} className="mr-1" />
                  <span>Score: {attempt.score}</span>
                </div>
                <Link
                  to={`/student/quiz-results/${attempt.attemptId}`}
                  className="block w-full text-center bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700"
                >
                  <div className="flex justify-center items-center">
                    <CheckCircle size={16} className="mr-2" />
                    View Results
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
