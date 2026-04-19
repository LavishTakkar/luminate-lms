/**
 * API response envelope used by every route.
 * The exact error shape is finalized in YOUR TURN #3
 * (apps/api/src/middleware/error.ts).
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "student" | "admin";
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CourseProgressSummary {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastAccessedAt: string;
  currentLessonId: string | null;
}

export interface ProgressOverview {
  courses: CourseProgressSummary[];
  totals: {
    enrolledCount: number;
    completedCourses: number;
    totalLessonsCompleted: number;
  };
}

export interface AIStatusResponse {
  provider: string;
  stubbed: boolean;
}

export interface SummarizeResponse {
  summary: string;
}

export interface GeneratedQuizResponse {
  quiz: {
    title: string;
    questions: Array<{
      questionText: string;
      questionType: "multiple-choice" | "true-false" | "short-answer";
      options?: string[];
      correctAnswer: string;
      explanation: string;
      points: number;
    }>;
  };
}

export interface ChatResponse {
  response: string;
  conversationId: string | null;
}
