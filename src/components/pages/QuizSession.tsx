import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { quizService } from "../../api/quiz";
import { quizSessionService, QuizSessionResponse } from "../../api/quizSession";
import { Clock, Copy, RefreshCw } from "lucide-react";
import QRCode from "react-qr-code";
import { formatApiError } from "../../utils/validationUtils";
import { QuizSummary } from "../../types";

const QuizSession = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizSummary | null>(null);
  const [session, setSession] = useState<QuizSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(30); // Default to 30 minutes
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizData = await quizService.getQuizById(Number(quizId));
        setQuiz(quizData);
      } catch (err) {
        const errorMessage = formatApiError(err);
        setError(`Failed to fetch quiz: ${errorMessage}`);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const createSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newSession = await quizSessionService.createSession({
        quizId: Number(quizId),
        durationMinutes: expiresIn
      });
      setSession(newSession);
    } catch (err) {
      const errorMessage = formatApiError(err);
      setError(`Failed to create session: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAccessCode = () => {
    if (session?.accessCode) {
      navigator.clipboard.writeText(session.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Loading quiz...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Session: {quiz.title}</h1>
      
      {!session ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-medium mb-4">Session Settings</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Duration (minutes)
            </label>
            <input
              type="number"
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
              min="5"
              max="180"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <button
            onClick={createSession}
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? "Creating..." : "Create Session"}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Active Session</h2>
            <button
              onClick={createSession}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCw size={16} className="mr-1" />
              Create New
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Access Code</h3>
                <div className="flex items-center">
                  <div className="text-2xl font-mono bg-gray-100 p-3 rounded-md flex-grow text-center">
                    {session?.accessCode || "No code available"}
                  </div>
                  <button
                    onClick={copyAccessCode}
                    className="ml-2 p-2 text-gray-500 hover:text-indigo-600"
                    title="Copy to clipboard"
                    disabled={!session?.accessCode}
                  >
                    <Copy size={20} />
                  </button>
                </div>
                {copied && (
                  <p className="text-green-600 text-sm mt-1">Copied to clipboard!</p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-1">Session Details</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="flex items-center text-sm text-gray-700">
                    <Clock size={16} className="mr-2" />
                    Created: {session?.createdAt ? new Date(session.createdAt).toLocaleString() : "N/A"}
                  </p>
                  {session?.expiresAt && (
                    <p className="flex items-center text-sm text-gray-700 mt-1">
                      <Clock size={16} className="mr-2" />
                      Expires: {new Date(session.expiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Student Instructions</h3>
                <ol className="list-decimal list-inside bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                  <li>Go to the student dashboard</li>
                  <li>Select this quiz ({quiz.title})</li>
                  <li>Enter the access code OR scan the QR code</li>
                  <li>Complete the quiz before the session expires</li>
                </ol>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center bg-white p-4 rounded-md border">
              <h3 className="text-sm font-medium text-gray-700 mb-3">QR Code</h3>
              <div className="bg-white p-4 rounded-md">
                {session && session.accessCode ? (
                  <QRCode value={session.accessCode || ''} size={200} />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                    No access code available
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Students can scan this QR code to access the quiz
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSession; 