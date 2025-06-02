import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { quizSessionService, AttemptResult } from "../../api/quizSession";
import { AxiosError } from "axios";
import { formatApiError } from "../../utils/validationUtils";

const QuizResults = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [resultData, setResultData] = useState<AttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOpenEndedQuestion = (questionType: string): boolean => {
    return questionType === "OPEN_ENDED";
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!attemptId) {
          setError("Invalid attempt ID");
          setIsLoading(false);
          return;
        }

        const response = await quizSessionService.getResults(Number(attemptId));
        setResultData(response);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<{ message: string }>;

        if (
          axiosError.response &&
          axiosError.response.status === 400 &&
          axiosError.response.data &&
          "message" in axiosError.response.data &&
          typeof axiosError.response.data.message === "string" &&
          axiosError.response.data.message.includes("must be submitted first")
        ) {
          setError(
            "This quiz hasn't been submitted yet or is still being graded."
          );

          setTimeout(() => {
            navigate(`/student/quiz-attempt/${attemptId}`);
          }, 3000);
        } else {
          setError("Failed to load quiz results. Please try again later.");
        }
        const errorMessage = formatApiError(err);
        console.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [attemptId, navigate]);

  if (isLoading) {
    return <div className="text-center py-8">Loading results...</div>;
  }

  if (error) {
    const errorMessage = formatApiError(error);
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-600">
          No results available. Your quiz might still be processing.
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {resultData.quizTitle} - Results
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <Award size={20} className="text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium">Score</h3>
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {resultData.score.toFixed(1)}%
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <CheckCircle size={20} className="text-green-600 mr-2" />
              <h3 className="text-lg font-medium">Correct Answers</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {resultData.correctAnswers} / {resultData.totalQuestions}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <Clock size={20} className="text-blue-600 mr-2" />
              <h3 className="text-lg font-medium">Time Taken</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {formatTime(resultData.attemptTime)}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Questions Review</h2>

          <div className="space-y-6">
            {resultData.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">
                    <span className="text-gray-500">{index + 1}.</span>{" "}
                    {question.text}
                  </h3>
                  {question.isCorrect ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <XCircle size={20} className="text-red-600" />
                  )}
                </div>

                <div className="ml-6">
                  {isOpenEndedQuestion(question.type) ? (
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-300 rounded-md p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            Your Response:
                          </h4>
                        </div>
                        {question.answers
                          .filter(
                            (answer) => answer.isSelected && answer.id === 0
                          )
                          .map((textAnswer) => (
                            <div key="text-response" className="text-gray-800">
                              {textAnswer.text || "No response provided"}
                            </div>
                          ))}
                      </div>

                      {question.answers
                        .filter((answer) => answer.isCorrect && answer.id !== 0)
                        .map((exampleAnswer) => (
                          <div
                            key={exampleAnswer.id}
                            className="bg-green-50 border border-green-300 rounded-md p-3"
                          >
                            <h4 className="text-sm font-medium text-green-700 mb-2">
                              Example Response:
                            </h4>
                            <div className="text-green-800">
                              {exampleAnswer.text}
                            </div>
                          </div>
                        ))}

                      <div
                        className={`text-sm font-medium ${
                          question.isCorrect
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {question.isCorrect
                          ? "Response evaluated as correct"
                          : "Response pending evaluation"}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {question.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className={`p-2 rounded-md ${
                            answer.isCorrect && answer.isSelected
                              ? "bg-green-100 border border-green-500"
                              : answer.isCorrect
                              ? "bg-green-50 border border-green-300"
                              : answer.isSelected
                              ? "bg-red-100 border border-red-500"
                              : "bg-gray-50 border border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{answer.text}</span>
                            <div>
                              {answer.isSelected && (
                                <span className="text-sm font-medium mr-2">
                                  Your answer
                                </span>
                              )}
                              {answer.isCorrect && (
                                <span className="text-sm font-medium text-green-600">
                                  Correct
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            to="/student/dashboard"
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
