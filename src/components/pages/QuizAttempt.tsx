import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizSessionService, AttemptResponse, SubmitResponseRequest } from "../../api/quizSession";
import { formatApiError } from "../../utils/validationUtils";

const QuizAttempt = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState<AttemptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number[]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startTime] = useState<Date>(new Date());
  const [sessionExpired, setSessionExpired] = useState(false);

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

  // Function to determine which question to show when resuming
  const determineResumeQuestionIndex = (attempt: AttemptResponse, selectedAnswers: Record<number, number[]>): number => {
    // If there are no answers yet, start from the beginning
    if (Object.keys(selectedAnswers).length === 0) {
      return 0;
    }
    
    // Get all question IDs in order
    const questionIds = attempt.questions.map(q => q.id);
    
    // Find the last answered question index
    let lastAnsweredIndex = -1;
    for (let i = questionIds.length - 1; i >= 0; i--) {
      if (questionIds[i] in selectedAnswers) {
        lastAnsweredIndex = i;
        break;
      }
    }
    
    // If we found a last answered question, go to the next unanswered one
    if (lastAnsweredIndex >= 0 && lastAnsweredIndex < questionIds.length - 1) {
      return lastAnsweredIndex + 1;
    }
    
    // If all questions are answered or no questions are answered, start from beginning
    return 0;
  };

  // Function to check if the session is expired based on the attempt status
  const checkAttemptStatus = (attempt: AttemptResponse): boolean => {
    return attempt.status === 'ABANDONED' || attempt.status === 'SUBMITTED' || attempt.status === 'GRADED';
  };

  useEffect(() => {
    const fetchAttemptData = async () => {
      try {
        setIsLoading(true);
        if (!attemptId) return;
        
        const response = await quizSessionService.getAttempt(Number(attemptId));
        setAttemptData(response);
        
        // Check if the attempt status indicates the session has expired or ended
        if (checkAttemptStatus(response)) {
          if (response.status === 'ABANDONED') {
            setSessionExpired(true);
            setError("This quiz session has expired. You cannot continue this attempt.");
          } else if (response.status === 'SUBMITTED' || response.status === 'GRADED') {
            // Redirect to results page if the attempt is already submitted
            navigate(`/student/quiz-results/${attemptId}`);
          }
        }
        
        // Pre-populate selectedAnswers if there are already submitted responses
        if (response.responses) {
          const answersMap: Record<number, number[]> = {};
          response.responses.forEach((resp: {questionId: number, answerId: number, isMultipleChoice?: boolean}) => {
            if (!answersMap[resp.questionId]) {
              answersMap[resp.questionId] = [];
            }
            answersMap[resp.questionId].push(resp.answerId);
          });
          setSelectedAnswers(answersMap);
          
          // Determine where to resume from
          const resumeIndex = determineResumeQuestionIndex(response, answersMap);
          setCurrentQuestionIndex(resumeIndex);
        }
      } catch (err) {
        const errorMessage = formatApiError(err);
        setError(errorMessage);
        console.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttemptData();

    // Set up a periodic check for session expiration every 30 seconds
    const sessionCheckInterval = setInterval(async () => {
      if (attemptId) {
        try {
          const response = await quizSessionService.getAttempt(Number(attemptId));
          
          if (checkAttemptStatus(response)) {
            if (response.status === 'ABANDONED') {
              setSessionExpired(true);
              setError("This quiz session has expired. You cannot continue this attempt.");
              clearInterval(sessionCheckInterval);
            }
          }
        } catch (error) {
          console.error("Failed to check session status:", error);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [attemptId, navigate]);

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    // Don't allow answer selection if session is expired
    if (sessionExpired) {
      return;
    }

    const currentQuestion = attemptData?.questions.find(q => q.id === questionId);
    if (!currentQuestion) return;

    if (currentQuestion.type === "MULTIPLE_CHOICE") {
      // For multiple choice, toggle the selection
      setSelectedAnswers((prev) => {
        const currentSelections = prev[questionId] || [];
        let newSelections;
        
        if (currentSelections.includes(answerId)) {
          // Remove if already selected
          newSelections = currentSelections.filter(id => id !== answerId);
        } else {
          // Add if not already selected
          newSelections = [...currentSelections, answerId];
        }
        
        return {
          ...prev,
          [questionId]: newSelections
        };
      });
      
      // Submit this toggle action
      submitAnswer(questionId, answerId, currentQuestion.type);
    } else {
      // For single choice, replace the selection
      setSelectedAnswers((prev) => ({
        ...prev,
        [questionId]: [answerId]
      }));
      
      // Submit this answer to the backend
      submitAnswer(questionId, answerId, "SINGLE_CHOICE");
    }
  };

  const submitAnswer = async (questionId: number, answerId: number, questionType: string) => {
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
        responseTime,
        isMultipleChoice: questionType === "MULTIPLE_CHOICE"
      };

      await quizSessionService.submitAnswer(Number(attemptId), request);
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      
      // Check if error indicates session expiration
      if (errorMessage.includes("session has expired") || 
          errorMessage.includes("no longer valid") ||
          errorMessage.includes("ABANDONED")) {
        setSessionExpired(true);
        setError("This quiz session has expired. You cannot continue this attempt.");
      } else {
        setResponseSubmissionErrors((prev) => ({
          ...prev,
          [questionId]: "Failed to save your answer. Please try again."
        }));
      }
    }
  };

  const handleNextQuestion = () => {
    if (sessionExpired) return;
    
    if (currentQuestionIndex < (attemptData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (sessionExpired) return;
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (sessionExpired) {
      navigate('/student/dashboard');
      return;
    }
    
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
        for (const aId of selectedAnswers[qId] || []) {
          await submitAnswer(qId, aId, attemptData?.questions.find(q => q.id === qId)?.type || "SINGLE_CHOICE");
          
          // If session expired during submission, stop and return
          if (sessionExpired) {
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Submit the entire attempt with total time taken
      const response = await quizSessionService.submitAttempt(Number(attemptId), {
        totalTime: elapsedTime,
      });

      // Check if the submission was successful by checking the status
      if (response && response.status === "SUBMITTED") {
        // Navigate to results page
        navigate(`/student/quiz-results/${attemptId}`);
      } else {
        setError("Quiz submission failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = formatApiError(err);
      setError(errorMessage);
      console.error(errorMessage);
      
      // Check if error indicates session expiration
      if (errorMessage.includes("session has expired") || 
          errorMessage.includes("no longer valid") ||
          errorMessage.includes("ABANDONED")) {
        setSessionExpired(true);
        setError("This quiz session has expired. Your attempt could not be submitted.");
      }
      
      setIsSubmitting(false);
    }
  };

  // Function to handle saving progress and exiting
  const handleSaveAndExit = async () => {
    if (sessionExpired) {
      navigate('/student/dashboard');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (!attemptId) {
        setError("Invalid attempt ID");
        setIsSaving(false);
        return;
      }

      // Submit any unsaved answers first
      const questionIds = attemptData?.questions.map(q => q.id) || [];
      const submittedQuestionIds = Object.keys(selectedAnswers).map(Number);
      
      // Find questions that were answered but not submitted
      const unsubmittedQuestions = questionIds.filter(
        id => submittedQuestionIds.includes(id) && 
        !responseSubmissionErrors[id]
      );
      
      // Submit any unsubmitted answers first
      for (const qId of unsubmittedQuestions) {
        for (const aId of selectedAnswers[qId] || []) {
          await submitAnswer(qId, aId, attemptData?.questions.find(q => q.id === qId)?.type || "SINGLE_CHOICE");
          
          // If session expired during submission, stop and return
          if (sessionExpired) {
            setIsSaving(false);
            return;
          }
        }
      }

      // Save progress
      await quizSessionService.saveProgress(Number(attemptId));
      
      // Navigate back to dashboard
      navigate('/student/dashboard');
    } catch (err) {
      const errorMessage = formatApiError(err);
      setError(errorMessage);
      console.error(errorMessage);
      
      // Check if error indicates session expiration
      if (errorMessage.includes("session has expired") || 
          errorMessage.includes("no longer valid") ||
          errorMessage.includes("ABANDONED")) {
        setSessionExpired(true);
        setError("This quiz session has expired. Your progress could not be saved.");
      }
      
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading quiz...</div>;
  }

  if (error || !attemptData) {
    const errorMessage = formatApiError(error);
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-md text-red-600 mb-4">
          {errorMessage || "Failed to load quiz"}
        </div>
        
        {/* Add a return to dashboard button if session has expired */}
        {sessionExpired && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    );
  }

  // If session is expired but we have attempt data, show a different message
  if (sessionExpired) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-2xl font-bold mb-4">{attemptData.quizTitle}</h1>
          <div className="bg-amber-50 p-4 rounded-md text-amber-600 mb-6">
            <p className="font-semibold">This quiz session has expired.</p>
            <p>The session time has ended or the teacher has closed the session. Your progress has been saved.</p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = attemptData.questions[currentQuestionIndex];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{attemptData.quizTitle}</h1>
        <div className="flex items-center gap-4">
          <div className="text-gray-600">
            Time: {Math.floor(elapsedTime / 60)}:
            {(elapsedTime % 60).toString().padStart(2, "0")}
          </div>
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving || sessionExpired}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Exit & Save"}
          </button>
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
              className={`p-3 border rounded-md flex items-center ${
                selectedAnswers[currentQuestion.id]?.includes(answer.id)
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${sessionExpired ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              onClick={() => !sessionExpired && handleAnswerSelect(currentQuestion.id, answer.id)}
            >
              {/* Show checkbox for multiple choice, radio button for single choice */}
              {currentQuestion.type === "MULTIPLE_CHOICE" ? (
                <div className={`w-5 h-5 border ${
                  selectedAnswers[currentQuestion.id]?.includes(answer.id)
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-gray-300"
                } rounded mr-3 flex items-center justify-center`}>
                  {selectedAnswers[currentQuestion.id]?.includes(answer.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </div>
              ) : (
                <div className={`w-5 h-5 rounded-full border ${
                  selectedAnswers[currentQuestion.id]?.includes(answer.id)
                    ? "bg-indigo-600 border-indigo-600"
                    : "border-gray-300"
                } mr-3 flex items-center justify-center`}>
                  {selectedAnswers[currentQuestion.id]?.includes(answer.id) && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              )}
              <span>{answer.text}</span>
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
            disabled={currentQuestionIndex === 0 || sessionExpired}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>

          {currentQuestionIndex < attemptData.questions.length - 1 ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={sessionExpired}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={isSubmitting || sessionExpired}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : sessionExpired ? "Session Expired" : "Submit Quiz"}
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
              onClick={() => !sessionExpired && setCurrentQuestionIndex(index)}
              disabled={sessionExpired}
              className={`w-10 h-10 rounded-full ${
                index === currentQuestionIndex
                  ? "bg-indigo-600 text-white"
                  : selectedAnswers[question.id]?.length > 0
                  ? "bg-indigo-100 text-indigo-600 border border-indigo-600"
                  : "bg-gray-100 text-gray-600"
              } ${sessionExpired ? "opacity-70" : ""}`}
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
