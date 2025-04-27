import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { StudentCreation, UserProfile, UserSession } from "../types";
import { authService } from "../api/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { userService } from "../api/user";

type AuthContext = {
  authToken?: string | null;
  currentUser?: UserProfile | null;
  handleLogin: (credentials: UserSession) => Promise<void>;
  handleLogout: () => void;
  handleRegister: (userData: StudentCreation) => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContext | undefined>(undefined);

type AuthProviderProps = PropsWithChildren;

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authToken, setAuthToken] = useState<string | null>();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const userData = await userService.getCurrentUser();
          setCurrentUser(userData);
          setAuthToken(token);

          if (location.pathname === "/" || location.pathname === "/register") {
            if (userData.userType === "TEACHER") {
              navigate("/teacher/dashboard");
            } else if (userData.userType === "STUDENT") {
              navigate("/student/dashboard");
            }
          }
        } catch (error) {
          console.error("Auth token invalid or expired", error);
          localStorage.removeItem("token");
          setAuthToken(null);
          setCurrentUser(null);

          if (location.pathname.includes("/dashboard")) {
            navigate("/");
          }
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [navigate, location.pathname]);

  async function handleLogin(credentials: UserSession) {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      localStorage.setItem("token", response.token);
      setAuthToken(response.token);

      const userData = await userService.getCurrentUser();
      setCurrentUser(userData);

      if (userData.userType === "TEACHER") {
        navigate("/teacher/dashboard");
      } else if (userData.userType === "STUDENT") {
        navigate("/student/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      setAuthToken(null);
      setCurrentUser(null);
      console.error("Login failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    localStorage.removeItem("token");
    setAuthToken(null);
    setCurrentUser(null);
    navigate("/");
  }

  async function handleRegister(userData: StudentCreation) {
    setIsLoading(true);
    try {
      console.log("Starting registration process for:", userData.email);
      await authService.register(userData);
      console.log("Registration successful, attempting login");
      await handleLogin({
        email: userData.email,
        password: userData.password,
      });
      console.log("Login successful after registration");
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        authToken,
        currentUser,
        handleLogin,
        handleLogout,
        handleRegister,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used inside of a AuthProvider");
  }

  return context;
}
