import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import MainLayout from "../components/layout/MainLayout";
import Login from "../components/pages/Login";
import Register from "../components/pages/Register";
import TeacherDashboard from "../components/pages/TeacherDashboard";
import StudentDashboard from "../components/pages/StudentDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import CreateQuiz from "../components/pages/CreateQuiz";
import EditQuiz from "../components/pages/EditQuiz";
import ViewQuiz from "../components/pages/ViewQuiz";
import QuizAccess from "../components/pages/QuizAccess";
import QuizAttempt from "../components/pages/QuizAttempt";
import QuizResults from "../components/pages/QuizResults";
import QuizSession from "../components/pages/QuizSession";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Login /> },
          { path: "register", element: <Register /> },
          {
            path: "teacher/dashboard",
            element: (
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "teacher/create-quiz",
            element: (
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <CreateQuiz />
              </ProtectedRoute>
            ),
          },
          {
            path: "teacher/edit-quiz/:quizId",
            element: (
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <EditQuiz />
              </ProtectedRoute>
            ),
          },
          {
            path: "teacher/create-session/:quizId",
            element: (
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <QuizSession />
              </ProtectedRoute>
            ),
          },
          {
            path: "quizzes/:id",
            element: (
              <ProtectedRoute allowedRoles={["STUDENT", "TEACHER"]}>
                <ViewQuiz />
              </ProtectedRoute>
            ),
          },
          {
            path: "student/dashboard",
            element: (
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: "student/quiz-access/:quizId",
            element: (
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <QuizAccess />
              </ProtectedRoute>
            ),
          },
          {
            path: "student/quiz-attempt/:attemptId",
            element: (
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <QuizAttempt />
              </ProtectedRoute>
            ),
          },
          {
            path: "student/quiz-results/:attemptId",
            element: (
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <QuizResults />
              </ProtectedRoute>
            ),
          },
          {
            path: "student/quiz-session/:sessionId",
            element: (
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <QuizSession />
              </ProtectedRoute>
            ),
          },
          // Fallback route
          { path: "*", element: <Navigate to="/" /> },
        ],
      },
    ],
  },
]);

export default router;
