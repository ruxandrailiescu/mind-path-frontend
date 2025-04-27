export interface UserSession {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface PasswordChange {
  oldPassword: string;
  newPassword: string;
}
