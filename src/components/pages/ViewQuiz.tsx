import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { quizService } from "../../api/quiz";
import { questionService } from "../../api/question";
import { answerService } from "../../api/answer";
import { QuizSummary } from "../../types";
import { formatApiError } from "../../utils/validationUtils";
import { Clock, User, BookOpen } from "lucide-react";
import {
  Header,
  ErrorMessage,
  QuestionsList,
} from "../../components/QuizFormComponents";
import { QuestionState } from "../QuizFormComponents";

const useUserRole = () => {
  const location = useLocation();

  const isTeacher = location.pathname.includes("/teacher/");
  const isStudent = location.pathname.includes("/student/");

  const role = isTeacher ? "teacher" : isStudent ? "student" : "student";

  return { role, isTeacher, isStudent };
};

const useQuizData = (quizId: number) => {
  const [quiz, setQuiz] = useState<QuizSummary | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);

        const fetchedQuestions = await questionService.getQuizQuestions(quizId);

        const questionsWithAnswers: QuestionState[] = [];

        for (const question of fetchedQuestions) {
          const answers = await answerService.getQuestionAnswers(question.id);

          questionsWithAnswers.push({
            id: question.id,
            text: question.text,
            questionText: question.text,
            type: question.type,
            difficulty: question.difficulty,
            answers: answers.map((answer) => ({
              id: answer.id,
              text: answer.text,
              answerText: answer.text,
              isCorrect: answer.isCorrect,
            })),
          });
        }

        setQuestions(questionsWithAnswers);
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

  return { quiz, questions, isLoading, error };
};

const ViewQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = Number(id);
  const { role } = useUserRole();

  const { quiz, questions, isLoading, error } = useQuizData(quizId);

  const handleBackNavigation = () => {
    if (role === "teacher") {
      navigate("/teacher/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="View Quiz" onBack={handleBackNavigation} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading quiz data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="View Quiz" onBack={handleBackNavigation} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorMessage error={error} />
        </main>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="View Quiz" onBack={handleBackNavigation} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Quiz not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={quiz.title} onBack={handleBackNavigation} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Details */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
                <div className="flex text-sm text-gray-500 items-center space-x-4">
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
                    {questions.length} question
                    {questions.length !== 1 ? "s" : ""}
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
            </div>
          </div>
        </div>

        {/* Questions List - Using the shared component with readOnly mode */}
        <QuestionsList questions={questions} readOnly={true} />
      </main>
    </div>
  );
};

export default ViewQuiz;
