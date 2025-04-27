import {
  AuthResponse,
  PasswordChange,
  StudentCreation,
  UserSession,
} from "../types";
import apiClient from "./apiClient";

export const authService = {
  login: async (credentials: UserSession): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },
  register: async (studentData: StudentCreation): Promise<string> => {
    const response = await apiClient.post("/auth/register", studentData);
    return response.data;
  },
  changePassword: async (passwordData: PasswordChange): Promise<string> => {
    const response = await apiClient.patch(
      "/auth/change-password",
      passwordData
    );
    return response.data;
  },
};
