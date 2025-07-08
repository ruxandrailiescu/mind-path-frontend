import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AttemptResult } from "../../api/quizAttempt";
import { teacherGradingService } from "../../api/teacherDashboard";
import dayjs from "dayjs";

const StudentResults = () => {
  const { studentId } = useParams();
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);

  useEffect(() => {
    teacherGradingService
      .getStudentAttempts(Number(studentId))
      .then((data) =>
        setAttempts([...data].sort((a, b) => b.attemptId - a.attemptId))
      );
  }, [studentId]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Student Quiz History</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attempt ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quiz Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Open-ended
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Results
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attempts.map((r) => (
              <tr key={r.attemptId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {r.attemptId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {r.quizTitle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {r.score ? `${r.score.toFixed(2)}%` : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {dayjs(r.completedAt).format("D MMM YYYY, HH:mm")}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    to={`/teacher/grade/${r.attemptId}`}
                    className="text-indigo-600 hover:underline"
                  >
                    Grade
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    to={`/student/quiz-results/${r.attemptId}`}
                    className="text-indigo-600 hover:underline"
                  >
                    Results
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentResults;
