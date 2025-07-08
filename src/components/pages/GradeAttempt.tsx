import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AttemptResult, quizAttemptService } from "../../api/quizAttempt";
import { teacherGradingService } from "../../api/teacherDashboard";

const GradeAttempt = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<AttemptResult>();
  const [localScore, setLocalScore] = useState(0);

  useEffect(() => {
    quizAttemptService.getResults(Number(attemptId)).then(setAttempt);
  }, [attemptId]);

  if (!attempt) return null;

  const grade = (questionId: number, localScore: number) =>
    teacherGradingService
      .gradeAnswer(Number(attemptId), questionId, localScore)
      .then(() => {
        setAttempt((a) => ({
          ...a!,
          questions: a!.questions.map((q) =>
            q.id === questionId ? { ...q, score: localScore } : q
          ),
        }));

        alert("Response graded successfully!");
      })
      .catch(() => {
        alert("Could not save grade. Please try again.");
      });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{attempt.quizTitle}</h1>

      {attempt.questions.map(
        (q) =>
          q.type === "OPEN_ENDED" && (
            <div
              key={q.id}
              className="border rounded-lg shadow-sm p-5 bg-white space-y-4"
            >
              <p className="font-medium">{q.text}</p>

              <pre className="whitespace-pre-wrap bg-gray-50 rounded-md p-3 text-sm">
                {q.answers[0].text}
              </pre>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={localScore}
                  onChange={(e) =>
                    setLocalScore(
                      e.target.value === "" ? 0 : parseFloat(e.target.value)
                    )
                  }
                  className="w-24 border-gray-300 rounded px-2 py-1 text-sm"
                  placeholder="Score"
                />
                <button
                  onClick={() => grade(q.id, localScore)}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Save grade
                </button>

                {q.aiScore !== null && (
                  <span className="ml-auto flex items-center gap-1 text-sm">
                    <span className="text-gray-500">AI score</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      {q.aiScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">
                      (click Save to override)
                    </span>
                  </span>
                )}

                {q.teacherScore !== null && q.teacherScore !== q.aiScore && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-sm">
                      Teacher score
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm">
                      {q.teacherScore.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {q.aiFeedback && (
                <div className="border-l-4 border-emerald-600 bg-emerald-50 p-3 rounded-r-md">
                  <p className="text-sm text-emerald-800 whitespace-pre-line">
                    {q.aiFeedback}
                  </p>
                </div>
              )}
            </div>
          )
      )}
    </div>
  );
};

export default GradeAttempt;
