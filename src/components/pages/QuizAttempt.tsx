import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizSessionService, AttemptResponse, SubmitResponseRequest } from "../../api/quizSession";

const QuizAttempt = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState<AttemptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState<Date>(new Date());

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [responseSubmissionErrors, setResponseSubmissionErrors] = useState<Record<number, string | undefined>>({});

  useEffect(() => {
    // Set up timer
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchAttemptData = async () => {
      try {
        setIsLoading(true);
        if (!attemptId) return;
        
        const response = await quizSessionService.getAttempt(Number(attemptId));
        setAttemptData(response);
        
        // Pre-populate selectedAnswers if there are already submitted responses
        if (response.responses) {
          const answersMap: Record<number, number> = {};
          response.responses.forEach((resp: {questionId: number, answerId: number}) => {
            answersMap[resp.questionId] = resp.answerId;
          });
          setSelectedAnswers(answersMap);
        }
      } catch (err) {
        setError("Failed to load quiz attempt");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttemptData();
  }, [attemptId]);

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));

    // Submit this answer to the backend
    submitAnswer(questionId, answerId);
  };

  const submitAnswer = async (questionId: number, answerId: number) => {
    try {
      setResponseSubmissionErrors((prev) => ({
        ...prev,
        [questionId]: undefined
      }));
      
      const responseTime = Math.round(
        (new Date().getTime() - startTime.getTime()) / 1000
      );

      if (!attemptId) return;

      const request: SubmitResponseRequest = {
        questionId,
        answerId,
        responseTime
      };

      await quizSessionService.submitResponse(Number(attemptId), request);
    } catch (err) {
      console.error("Failed to submit answer", err);
      setResponseSubmissionErrors((prev) => ({
        ...prev,
        [questionId]: "Failed to save your answer. Please try again."
      }));
      // Continue anyway to avoid blocking the user
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (attemptData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    // Check if all questions have been answered
    const questionsCount = attemptData?.questions.length || 0;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < questionsCount) {
      if (
        !window.confirm(
          `You've only answered ${answeredCount} out of ${questionsCount} questions. Are you sure you want to submit?`
        )
      ) {
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (!attemptId) {
        setError("Invalid attempt ID");
        setIsSubmitting(false);
        return;
      }

      // Submit any remaining answers that may not have been sent yet
      const questionIds = attemptData?.questions.map(q => q.id) || [];
      const submittedQuestionIds = Object.keys(selectedAnswers).map(Number);
      
      // Find questions that were answered but not submitted
      const unsubmittedQuestions = questionIds.filter(
        id => submittedQuestionIds.includes(id) && 
        !responseSubmissionErrors[id]
      );
      
      // Submit any unsubmitted answers first
      for (const qId of unsubmittedQuestions) {
        if (selectedAnswers[qId]) {
          await submitAnswer(qId, selectedAnswers[qId]);
        }
      }

      // Submit the entire attempt with total time taken
      await quizSessionService.submitAttempt(Number(attemptId), {
        totalTime: elapsedTime,
      });

      // Navigate to results page
      navigate(`/student/quiz-results/${attemptId}`);
    } catch (err) {
      setError("Failed to submit quiz. Please try again.");
      console.error(err);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  if (error || !attemptData) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-md text-red-600">
          {error || "Failed to load quiz"}
        </div>
      </div>
    );
  }

  const currentQuestion = attemptData.questions[currentQuestionIndex];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{attemptData.quizTitle}</h1>
        <div className="text-gray-600">
          Time: {Math.floor(elapsedTime / 60)}:
          {(elapsedTime % 60).toString().padStart(2, "0")}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        {/* Question progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              Question {currentQuestionIndex + 1} of{" "}
              {attemptData.questions.length}
            </span>
            <span>{currentQuestion.difficulty}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / attemptData.questions.length) *
                  100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question text */}
        <div className="mb-6">
          <h2 className="text-xl font-medium mb-2">{currentQuestion.text}</h2>
          <p className="text-sm text-gray-500">
            {currentQuestion.type === "SINGLE_CHOICE"
              ? "Select one answer"
              : "Select all that apply"}
          </p>
        </div>

        {/* Answer options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.answers.map((answer) => (
            <div
              key={answer.id}
              className={`p-3 border rounded-md cursor-pointer ${
                selectedAnswers[currentQuestion.id] === answer.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
            >
              {answer.text}
            </div>
          ))}
        </div>

        {/* Error message for response submission */}
        {responseSubmissionErrors[currentQuestion.id] && (
          <div className="mb-4 text-sm text-red-600">
            {responseSubmissionErrors[currentQuestion.id]}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>

          {currentQuestionIndex < attemptData.questions.length - 1 ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>

      {/* Question navigation bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {attemptData.questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-full ${
                index === currentQuestionIndex
                  ? "bg-indigo-600 text-white"
                  : selectedAnswers[question.id]
                  ? "bg-indigo-100 text-indigo-600 border border-indigo-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
