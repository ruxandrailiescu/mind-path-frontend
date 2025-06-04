import { useEffect, useState } from "react";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { QuizSummary } from "../../types";
import { quizService } from "../../api/quiz";
import { formatApiError } from "../../utils/validationUtils";

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("quizzes");
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fetchedQuizzes = await quizService.getAllQuizzes();
        setQuizzes(fetchedQuizzes);
      } catch (err) {
        const errorMessage = formatApiError(err);
        console.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
    } catch (err) {
      const errorMessage = formatApiError(err);
      console.error(errorMessage);
      alert("Failed to delete quiz. Please try again.");
    }
  };

  const getCompletionsCount = () => {
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Teacher Dashboard
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                <BarChart size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Quizzes
                </p>
                <p className="text-2xl font-semibold">{quizzes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <LineChart size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Students
                </p>
                <p className="text-2xl font-semibold">48</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <PieChart size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg. Completion Rate
                </p>
                <p className="text-2xl font-semibold">82%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "quizzes"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Your Quizzes
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "students"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Student Progress
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>

        <div className="bg-white shadow rounded-lg">
          {activeTab === "quizzes" && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium">Your Quizzes</h2>
                <Link
                  to="/teacher/create-quiz"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 inline-block text-center"
                >
                  Create New Quiz
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <p className="text-gray-500">Loading quizzes...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-sm text-red-600 rounded-md p-4 mb-4">
                  {error}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    You haven't created any quizzes yet.
                  </p>
                  <Link
                    to="/teacher/create-quiz"
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Create your first quiz
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Questions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Completions
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quizzes.map((quiz) => (
                        <tr key={quiz.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <Link
                              to={`/quizzes/${quiz.id}`}
                              className="text-gray-900 hover:text-indigo-600"
                            >
                              {quiz.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {quiz.questions ? quiz.questions.length : 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getCompletionsCount()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/teacher/edit-quiz/${quiz.id}`}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </Link>
                            <Link
                              to={`/teacher/create-session/${quiz.id}`}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Create Session
                            </Link>
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "students" && (
            <div className="p-6">
              <h2 className="text-lg font-medium mb-6">Student Progress</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quizzes Taken
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg. Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="p-6">
              <h2 className="text-lg font-medium mb-6">Analytics Dashboard</h2>
              <p className="text-gray-600">
                Analytics charts and visualizations will be displayed here.
              </p>
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-400">
                  Knowledge tracing visualizations coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
