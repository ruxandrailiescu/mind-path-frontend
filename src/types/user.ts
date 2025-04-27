export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  userType: UserRole;
}

export interface StudentCreation {
  email: string;
  password: string;
  userType: "STUDENT";
  firstName: string;
  lastName: string;
}

export interface TeacherCreation {
  email: string;
  password: string;
  userType: "TEACHER";
  firstName: string;
  lastName: string;
}
