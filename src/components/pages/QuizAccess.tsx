import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { quizSessionService } from "../../api/quizSession";
import { quizAttemptService } from "../../api/quizAttempt";
import { formatApiError } from "../../utils/validationUtils";

const QuizAccess = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleQrCodeScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length > 0) {
      setAccessCode(detectedCodes[0].rawValue);
      setShowScanner(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!accessCode.trim()) {
      setError("Please enter an access code or scan a QR code");
      return;
    }

    if (!quizId) {
      setError("Invalid quiz ID");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const isValid = await quizSessionService.validateAccessCode(accessCode);

      if (!isValid) {
        setError("Invalid or expired access code. Please check and try again.");
        return;
      }

      const response = await quizAttemptService.startAttemptWithAccessCode(
        Number(quizId),
        accessCode
      );

      navigate(`/student/quiz-attempt/${response.attemptId}`);
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      setError(
        errorMessage || "Failed to start quiz. Please check your access code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Access Quiz</h1>
        <p className="text-gray-600 mb-6">
          Please enter the access code provided by your teacher or scan the QR
          code to start the quiz.
        </p>

        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-600 mb-4">
            {error}
          </div>
        )}

        {showScanner ? (
          <div className="mb-4">
            <Scanner
              onScan={handleQrCodeScan}
              onError={(error: unknown) => {
                console.error(error);
                setError(
                  "Failed to scan QR code: " +
                    (error instanceof Error ? error.message : "Unknown error")
                );
                setShowScanner(false);
              }}
            />
            <button
              type="button"
              onClick={() => setShowScanner(false)}
              className="mt-2 w-full py-2 bg-gray-200 text-gray-800 rounded-md"
            >
              Cancel Scanning
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter access code"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleStartQuiz();
                  }
                }}
              />
            </div>

            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={isLoading}
                className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {isLoading ? "Starting..." : "Start Quiz"}
              </button>

              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Scan QR Code
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizAccess;
