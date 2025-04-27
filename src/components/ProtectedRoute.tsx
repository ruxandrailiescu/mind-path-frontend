import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import Loading from "./Loading";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { authToken, currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (!authToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (
    allowedRoles &&
    currentUser &&
    !allowedRoles.includes(currentUser.userType)
  ) {
    if (currentUser.userType === "STUDENT") {
      return <Navigate to="/student/dashboard" replace />;
    } else if (currentUser.userType === "TEACHER") {
      return <Navigate to="/teacher/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
