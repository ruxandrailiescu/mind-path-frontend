import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock } from "lucide-react";
import { quizService } from "../../api/quiz";
import { QuizSummary } from "../../types";
import { formatApiError } from "../../utils/validationUtils";

const StudentDashboard = () => {
  const [activeQuizzes, setActiveQuizzes] = useState<QuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveQuizzes = async () => {
      try {
        setIsLoading(true);
        const quizzes = await quizService.getActiveQuizzes();
        setActiveQuizzes(quizzes);
      } catch (err) {
        const errorMessage = formatApiError(err);
        console.error(errorMessage);
        setError(errorMessage);
        setActiveQuizzes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveQuizzes();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">Loading quizzes...</div>;
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-md text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
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
                  Start Quiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
