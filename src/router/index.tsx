import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import MainLayout from "../components/layout/MainLayout";
import Login from "../components/pages/Login";
import Register from "../components/pages/Register";
import TeacherDashboard from "../components/pages/TeacherDashboard";
import StudentDashboard from "../components/pages/StudentDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

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
            path: "student/dashboard",
            element: (
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
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
