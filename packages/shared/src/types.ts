/**
 * Domain types shared between apps/api and apps/web.
 * Mirrors the Mongoose schemas in apps/api/src/models.
 * `Id` is a string on the wire (ObjectId.toString()).
 */

export type Id = string;

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Role = "student" | "admin";

export interface LearningPreferences {
  topics: string[];
  difficulty: Difficulty;
  learningStyle: string;
}

export interface User {
  _id: Id;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  role: Role;
  learningPreferences?: LearningPreferences;
  enrolledCourses: Id[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  _id: Id;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  thumbnail?: string;
  instructor: Id;
  modules: Id[];
  tags: string[];
  isPublished: boolean;
  enrollmentCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  _id: Id;
  courseId: Id;
  title: string;
  description?: string;
  order: number;
  lessons: Id[];
  createdAt: string;
  updatedAt: string;
}

export type ContentType = "video" | "text" | "pdf" | "mixed";

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Lesson {
  _id: Id;
  moduleId: Id;
  title: string;
  content: string;
  contentType: ContentType;
  videoUrl?: string;
  attachments: Attachment[];
  duration: number;
  order: number;
  aiSummary?: string;
  aiKeyPoints: string[];
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = "multiple-choice" | "true-false" | "short-answer";

export interface QuizQuestion {
  questionText: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface Quiz {
  _id: Id;
  lessonId: Id;
  courseId: Id;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  isAIGenerated: boolean;
  sourceContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  quizId: Id;
  score: number;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
  }>;
  attemptDate: string;
}

export interface UserProgress {
  _id: Id;
  userId: Id;
  courseId: Id;
  completedLessons: Id[];
  quizAttempts: QuizAttempt[];
  currentLesson?: Id;
  progressPercentage: number;
  totalTimeSpent: number;
  lastAccessedAt: string;
  certificateIssued: boolean;
  certificateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type SummaryType = "brief" | "detailed" | "bullet-points";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Certificate {
  _id: Id;
  userId: Id;
  courseId: Id;
  courseTitle: string;
  userFullName: string;
  slug: string;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
}
