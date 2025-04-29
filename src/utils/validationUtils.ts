import { StudentCreation, UserSession } from "../types";

type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export function validateLoginForm(data: UserSession): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 4) {
    errors.password = "Password must be at least 4 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegisterForm(data: StudentCreation): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.firstName?.trim()) {
    errors.firstName = "First name is required";
  }

  if (!data.lastName?.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!data.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 4) {
    errors.password = "Password must be at least 4 characters";
  } else if (data.password.length > 20) {
    errors.password = "Password must be less than 20 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatApiError(error: unknown): string {
  if (!error) return "An unknown error occurred";

  if (typeof error === "string") return error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  if (typeof error === "object" && error !== null) {
    const errorMessages = Object.values(error as Record<string, unknown>)
      .filter((msg): msg is string => typeof msg === "string")
      .join(", ");

    if (errorMessages) return errorMessages;
  }

  return "An unexpected error occurred";
}
