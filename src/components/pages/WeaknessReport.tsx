import dayjs from "dayjs";
import { useState } from "react";
import {
  weaknessDetectionService,
  WeaknessReport,
} from "../../api/weaknessReport";

const WeaknessReportPage = () => {
  const today = dayjs().format("YYYY-MM-DD");
  const [from, setFrom] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD")
  );
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<WeaknessReport>();

  const load = () =>
    weaknessDetectionService.getWeaknessReport(from, to).then(setReport);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Weakness Report</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button
          onClick={load}
          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Generate
        </button>
      </div>

      {report && (
        <>
          <p className="mb-2">
            Analyzed <strong>{report.totalQuestions}</strong> answers -{" "}
            <strong className="text-red-600">{report.rushingErrors}</strong>{" "}
            rushing errors (wrong and &lt; 5s)
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2">Attempted</th>
                  <th className="px-4 py-2">Incorrect</th>
                  <th className="px-4 py-2">Average time (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(report.statsByType).map(([t, s]) => (
                  <tr key={t}>
                    <td className="px-4 py-2 font-medium">{t}</td>
                    <td className="px-4 py-2 text-center">{s.attempted}</td>
                    <td className="px-4 py-2 text-center text-red-600">
                      {s.incorrect}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {s.averageTimeSec.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default WeaknessReportPage;
