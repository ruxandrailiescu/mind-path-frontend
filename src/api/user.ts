import { UserProfile } from "../types";
import apiClient from "./apiClient";

export const userService = {
  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },
  getUserById: async (userId: number): Promise<UserProfile> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },
};
