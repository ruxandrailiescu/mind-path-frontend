import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  quizSessionService,
  AttemptResponse,
  Question,
} from "../../api/quizSession";
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
  const [textResponses, setTextResponses] = useState<Record<number, string>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [questionDurations, setQuestionDurations] = useState<
    Record<number, number>
  >({});
  const [sessionExpired, setSessionExpired] = useState(false);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [responseSubmissionErrors, setResponseSubmissionErrors] = useState<
    Record<number, string | undefined>
  >({});

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (
      attemptData &&
      attemptData.questions &&
      attemptData.questions.length > 0
    ) {
      const currentQuestion = attemptData.questions[currentQuestionIndex];
      if (currentQuestion) {
        setQuestionStartTime(new Date());
      }
    }
  }, [currentQuestionIndex, attemptData]);

  const isOpenEndedQuestion = (question: Question): boolean => {
    return question.type === "OPEN_ENDED";
  };

  const isQuestionAnswered = (question: Question): boolean => {
    if (isOpenEndedQuestion(question)) {
      const textResponse = textResponses[question.id];
      return textResponse != null && textResponse.trim().length > 0;
    } else {
      const selections = selectedAnswers[question.id];
      return selections != null && selections.length > 0;
    }
  };

  const recordTimeForCurrentQuestion = () => {
    if (!attemptData) return;
    const question = attemptData.questions[currentQuestionIndex];
    if (!questionStartTime) return;

    const duration = Math.round(
      (new Date().getTime() - questionStartTime.getTime()) / 1000
    );

    setQuestionDurations((prev) => ({
      ...prev,
      [question.id]: (prev[question.id] || 0) + duration,
    }));
  };

  const determineResumeQuestionIndex = (
    attempt: AttemptResponse,
    selectedAnswers: Record<number, number[]>,
    textResponses: Record<number, string>
  ): number => {
    if (
      Object.keys(selectedAnswers).length === 0 &&
      Object.keys(textResponses).length === 0
    ) {
      return 0;
    }

    const questionIds = attempt.questions.map((q) => q.id);

    let lastAnsweredIndex = -1;
    for (let i = questionIds.length - 1; i >= 0; i--) {
      const questionId = questionIds[i];

      const hasMultipleChoiceAnswer =
        questionId in selectedAnswers && selectedAnswers[questionId].length > 0;
      const hasTextResponse =
        questionId in textResponses &&
        textResponses[questionId].trim().length > 0;

      if (hasMultipleChoiceAnswer || hasTextResponse) {
        lastAnsweredIndex = i;
        break;
      }
    }

    if (lastAnsweredIndex >= 0 && lastAnsweredIndex < questionIds.length - 1) {
      return lastAnsweredIndex + 1;
    }

    return 0;
  };

  const checkAttemptStatus = (attempt: AttemptResponse): boolean => {
    return (
      attempt.status === "ABANDONED" ||
      attempt.status === "SUBMITTED" ||
      attempt.status === "GRADED"
    );
  };

  useEffect(() => {
    const fetchAttemptData = async () => {
      try {
        setIsLoading(true);
        if (!attemptId) return;

        const response = await quizSessionService.getAttempt(Number(attemptId));
        setAttemptData(response);

        if (checkAttemptStatus(response)) {
          if (response.status === "ABANDONED") {
            setSessionExpired(true);
            setError(
              "This quiz session has expired. You cannot continue this attempt."
            );
            return;
          } else if (
            response.status === "SUBMITTED" ||
            response.status === "GRADED"
          ) {
            navigate(`/student/quiz-results/${attemptId}`);
            return;
          }
        }

        if (response.responses) {
          const answersMap: Record<number, number[]> = {};
          const textResponsesMap: Record<number, string> = {};

          response.responses.forEach(
            (resp: {
              questionId: number;
              answerId?: number;
              textResponse?: string;
              isOpenEnded?: boolean;
            }) => {
              if (resp.isOpenEnded && resp.textResponse) {
                textResponsesMap[resp.questionId] = resp.textResponse;
              } else if (resp.answerId) {
                if (!answersMap[resp.questionId]) {
                  answersMap[resp.questionId] = [];
                }
                answersMap[resp.questionId].push(resp.answerId);
              }
            }
          );
          setSelectedAnswers(answersMap);
          setTextResponses(textResponsesMap);

          const resumeIndex = determineResumeQuestionIndex(
            response,
            answersMap,
            textResponsesMap
          );
          setCurrentQuestionIndex(resumeIndex);
          setQuestionStartTime(new Date());
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

    const sessionCheckInterval = setInterval(async () => {
      if (!attemptId) return;

      try {
        const response = await quizSessionService.getAttempt(Number(attemptId));
        if (checkAttemptStatus(response) && response.status === "ABANDONED") {
          setSessionExpired(true);
          setError(
            "This quiz session has expired. You cannot continue this attempt."
          );
          clearInterval(sessionCheckInterval);
        }
      } catch (error) {
        console.error("Failed to check session status:", error);
      }
    }, 30000);

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [attemptId, navigate]);

  const handleAnswerSelect = async (questionId: number, answerId: number) => {
    if (sessionExpired) return;

    const currentQuestion = attemptData?.questions.find(
      (q) => q.id === questionId
    );
    if (!currentQuestion) return;

    setSelectedAnswers((prev) => {
      const currentSelections = prev[questionId] || [];

      if (currentQuestion.type == "MULTIPLE_CHOICE") {
        const newSelections = currentSelections.includes(answerId)
          ? currentSelections.filter((id) => id !== answerId)
          : [...currentSelections, answerId];

        return {
          ...prev,
          [questionId]: newSelections,
        };
      } else {
        return {
          ...prev,
          [questionId]: [answerId],
        };
      }
    });
  };

  const handleTextResponseChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTextResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: e.target.value,
    }));
  };

  const submitCurrentQuestionAnswers = async () => {
    const question = attemptData?.questions[currentQuestionIndex];
    if (!question || !attemptId) return;

    try {
      setResponseSubmissionErrors((prev) => ({
        ...prev,
        [question.id]: undefined,
      }));

      const responseTime = questionDurations[question.id] || 0;

      if (isOpenEndedQuestion(question)) {
        const textResponse = textResponses[question.id] || "";
        if (textResponse.trim().length === 0) {
          return;
        }

        await quizSessionService.submitAnswer(Number(attemptId), {
          questionId: question.id,
          selectedAnswerIds: [],
          textResponse: textResponse,
          responseTime: responseTime,
          isMultipleChoice: false,
          isOpenEnded: true,
        });
      } else {
        const selected = selectedAnswers[question.id] || [];
        if (selected.length === 0) {
          return;
        }

        await quizSessionService.submitAnswer(Number(attemptId), {
          questionId: question.id,
          selectedAnswerIds: selected,
          textResponse: undefined,
          responseTime: responseTime,
          isMultipleChoice: question.type === "MULTIPLE_CHOICE",
          isOpenEnded: false,
        });
      }
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setResponseSubmissionErrors((prev) => ({
        ...prev,
        [question.id]: "Failed to save your answer. Please try again.",
      }));
      setError(errorMessage);
    }
  };

  const handleNextQuestion = async () => {
    if (sessionExpired) return;

    await submitCurrentQuestionAnswers();

    recordTimeForCurrentQuestion();

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < (attemptData?.questions.length || 0)) {
      setCurrentQuestionIndex(nextIndex);
      setQuestionStartTime(new Date());
    }
  };

  const handlePreviousQuestion = () => {
    if (sessionExpired) return;

    recordTimeForCurrentQuestion();

    const prevIndex = currentQuestionIndex - 1;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex);
      setQuestionStartTime(new Date());
    }
  };

  const handleSubmitQuiz = async () => {
    if (sessionExpired) {
      navigate("/student/dashboard");
      return;
    }

    await submitCurrentQuestionAnswers();

    const questions = attemptData?.questions || [];
    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter((q) =>
      isOpenEndedQuestion(q)
        ? textResponses[q.id]?.trim().length > 0
        : selectedAnswers[q.id]?.length > 0
    ).length;

    if (answeredQuestions < totalQuestions) {
      const confirm = window.confirm(
        `You've only answered ${answeredQuestions} out of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (!attemptId) {
        setError("Invalid attempt ID");
        setIsSubmitting(false);
        return;
      }

      recordTimeForCurrentQuestion();

      for (const question of questions) {
        if (isOpenEndedQuestion(question)) {
          const textResponse = textResponses[question.id];

          if (
            textResponse &&
            textResponse.trim().length > 0 &&
            !responseSubmissionErrors[question.id]
          ) {
            const responseTime = questionDurations[question.id] || 0;

            await quizSessionService.submitAnswer(Number(attemptId), {
              questionId: question.id,
              selectedAnswerIds: [],
              textResponse: textResponse,
              responseTime: responseTime,
              isMultipleChoice: false,
              isOpenEnded: true,
            });

            if (sessionExpired) {
              setIsSubmitting(false);
              return;
            }
          }
        } else {
          const answerIds = selectedAnswers[question.id];

          if (
            answerIds &&
            answerIds.length > 0 &&
            !responseSubmissionErrors[question.id]
          ) {
            const responseTime = questionDurations[question.id] || 0;

            await quizSessionService.submitAnswer(Number(attemptId), {
              questionId: question.id,
              selectedAnswerIds: answerIds,
              responseTime: responseTime,
              isMultipleChoice: question.type === "MULTIPLE_CHOICE",
            });

            if (sessionExpired) {
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      const response = await quizSessionService.submitAttempt(
        Number(attemptId),
        {
          totalTime: elapsedTime,
        }
      );

      if (response && response.status === "SUBMITTED") {
        navigate(`/student/quiz-results/${attemptId}`);
      } else {
        setError("Quiz submission failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = formatApiError(err);
      setError(errorMessage);
      console.error(errorMessage);

      if (
        errorMessage.includes("session has expired") ||
        errorMessage.includes("no longer valid") ||
        errorMessage.includes("ABANDONED")
      ) {
        setSessionExpired(true);
        setError(
          "This quiz session has expired. Your attempt could not be submitted."
        );
      }

      setIsSubmitting(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (sessionExpired) {
      navigate("/student/dashboard");
      return;
    }

    await submitCurrentQuestionAnswers();
    recordTimeForCurrentQuestion();

    try {
      setIsSaving(true);
      setError(null);

      if (!attemptId) {
        setError("Invalid attempt ID");
        setIsSaving(false);
        return;
      }

      const questions = attemptData?.questions || [];

      for (const question of questions) {
        if (isOpenEndedQuestion(question)) {
          const textResponse = textResponses[question.id];

          if (
            textResponse &&
            textResponse.trim().length > 0 &&
            !responseSubmissionErrors[question.id]
          ) {
            const responseTime = questionDurations[question.id] || 0;

            await quizSessionService.submitAnswer(Number(attemptId), {
              questionId: question.id,
              selectedAnswerIds: [],
              textResponse: textResponse,
              responseTime: responseTime,
              isMultipleChoice: false,
              isOpenEnded: true,
            });

            if (sessionExpired) {
              setIsSaving(false);
              return;
            }
          }
        } else {
          const answerIds = selectedAnswers[question.id];

          if (
            answerIds &&
            answerIds.length > 0 &&
            !responseSubmissionErrors[question.id]
          ) {
            const responseTime = questionDurations[question.id] || 0;

            await quizSessionService.submitAnswer(Number(attemptId), {
              questionId: question.id,
              selectedAnswerIds: answerIds,
              responseTime: responseTime,
              isMultipleChoice: question.type === "MULTIPLE_CHOICE",
            });

            if (sessionExpired) {
              setIsSaving(false);
              return;
            }
          }
        }
      }

      await quizSessionService.saveProgress(Number(attemptId));

      navigate("/student/dashboard");
    } catch (err) {
      const errorMessage = formatApiError(err);
      setError(errorMessage);
      console.error(errorMessage);

      if (
        errorMessage.includes("session has expired") ||
        errorMessage.includes("no longer valid") ||
        errorMessage.includes("ABANDONED")
      ) {
        setSessionExpired(true);
        setError(
          "This quiz session has expired. Your progress could not be saved."
        );
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

        {sessionExpired && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-2xl font-bold mb-4">{attemptData.quizTitle}</h1>
          <div className="bg-amber-50 p-4 rounded-md text-amber-600 mb-6">
            <p className="font-semibold">This quiz session has expired.</p>
            <p>
              The session time has ended or the teacher has closed the session.
              Your progress has been saved.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate("/student/dashboard")}
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

        <div className="mb-6">
          <h2 className="text-xl font-medium mb-2">{currentQuestion.text}</h2>
          <p className="text-sm text-gray-500">
            {currentQuestion.type === "SINGLE_CHOICE"
              ? "Select one answer"
              : currentQuestion.type === "MULTIPLE_CHOICE"
              ? "Select all that apply"
              : "Enter your response in the text box below"}
          </p>
        </div>

        {isOpenEndedQuestion(currentQuestion) ? (
          <div className="mb-6">
            <textarea
              value={textResponses[currentQuestion.id] || ""}
              onChange={handleTextResponseChange}
              className="w-full min-h-25 p-2"
              placeholder="Enter your response here..."
            />
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {currentQuestion.answers.map((answer) => (
              <div
                key={answer.id}
                className={`p-3 border rounded-md flex items-center ${
                  selectedAnswers[currentQuestion.id]?.includes(answer.id)
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${
                  sessionExpired
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer"
                }`}
                onClick={() =>
                  !sessionExpired &&
                  handleAnswerSelect(currentQuestion.id, answer.id)
                }
              >
                {currentQuestion.type === "MULTIPLE_CHOICE" ? (
                  <div
                    className={`w-5 h-5 border ${
                      selectedAnswers[currentQuestion.id]?.includes(answer.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    } rounded mr-3 flex items-center justify-center`}
                  >
                    {selectedAnswers[currentQuestion.id]?.includes(
                      answer.id
                    ) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    )}
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full border ${
                      selectedAnswers[currentQuestion.id]?.includes(answer.id)
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    } mr-3 flex items-center justify-center`}
                  >
                    {selectedAnswers[currentQuestion.id]?.includes(
                      answer.id
                    ) && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                )}
                <span>{answer.text}</span>
              </div>
            ))}
          </div>
        )}

        {responseSubmissionErrors[currentQuestion.id] && (
          <div className="mb-4 text-sm text-red-600">
            {responseSubmissionErrors[currentQuestion.id]}
          </div>
        )}

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
              {isSubmitting
                ? "Submitting..."
                : sessionExpired
                ? "Session Expired"
                : "Submit Quiz"}
            </button>
          )}
        </div>
      </div>

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
                  : isQuestionAnswered(question)
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
