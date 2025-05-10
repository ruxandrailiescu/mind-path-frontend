import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizService } from "../../api/quiz";
import { questionService } from "../../api/question";
import { answerService } from "../../api/answer";
import { QuizSummary } from "../../types";
import { formatApiError } from "../../utils/validationUtils";
import { Clock, User, BookOpen, CheckCircle, XCircle } from "lucide-react";
import {
  Header,
  ErrorMessage,
} from "../../components/QuizFormComponents";
import { QuestionState } from "../QuizFormComponents";
import { useAuth } from "../AuthProvider";

const useUserRole = () => {
  const { currentUser } = useAuth();
  return {
    role: currentUser?.userType.toLowerCase() || "student",
    isTeacher: currentUser?.userType === "TEACHER",
    isStudent: currentUser?.userType === "STUDENT",
  };
};

const useQuizData = (quizId: number) => {
  const [quiz, setQuiz] = useState<QuizSummary | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extended interface to handle both property name formats
  interface RawAnswer {
    id: number;
    text: string;
    isCorrect?: boolean;
    correct?: boolean;
  }

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
            answers: answers.map((answer) => {
              // Cast to our extended interface that handles both property names
              const rawAnswer = answer as unknown as RawAnswer;
              const correctValue = rawAnswer.isCorrect !== undefined ? 
                                  rawAnswer.isCorrect : 
                                  rawAnswer.correct;
              
              return {
                id: answer.id,
                text: answer.text,
                answerText: answer.text,
                isCorrect: Boolean(correctValue),
              };
            }),
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

// Custom component for displaying answers with visibility controls for correct answers
const AnswersList = ({ question, isTeacher }: { question: QuestionState, isTeacher: boolean }) => {
  // Force convert isCorrect to boolean for each answer - this will fix the highlighting issue
  const answersWithBooleanCorrect = question.answers.map(answer => ({
    ...answer,
    isCorrect: Boolean(answer.isCorrect)
  }));
  
  return (
    <div className="space-y-2 mt-2">
      <h4 className="text-sm font-medium">Answers:</h4>
      {answersWithBooleanCorrect.map((answer) => (
        <div
          key={answer.id}
          className={`p-3 rounded-md ${
            isTeacher && answer.isCorrect
              ? "bg-green-50 border border-green-200"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {isTeacher && (
                <span className="mr-2">
                  {answer.isCorrect ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <XCircle size={16} className="text-gray-400" />
                  )}
                </span>
              )}
              <span>{answer.text || answer.answerText}</span>
            </div>
            {isTeacher && (
              <span className={`text-xs font-medium ml-2 ${answer.isCorrect ? 'text-green-600' : 'text-gray-500'}`}>
                {answer.isCorrect ? "Correct" : "Incorrect"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ViewQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quizId = Number(id);
  const { role, isTeacher } = useUserRole();

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

        {/* Display questions with custom answer rendering */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Questions</h2>
              {isTeacher && (
                <div className="text-sm text-gray-500">
                  <span className="inline-flex items-center">
                    <CheckCircle size={16} className="text-green-600 mr-1" />
                    Correct answers are highlighted
                  </span>
                </div>
              )}
            </div>
            
            {questions.length === 0 ? (
              <p className="text-gray-500">No questions added yet.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="mb-3">
                      <h3 className="font-medium">
                        <span className="text-gray-500">Q{index + 1}:</span>{" "}
                        {question.text || question.questionText}
                      </h3>
                      <div className="mt-1 text-sm text-gray-500">
                        Type: {question.type} | Difficulty: {question.difficulty}
                      </div>
                    </div>
                    
                    <AnswersList question={question} isTeacher={isTeacher} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewQuiz;
