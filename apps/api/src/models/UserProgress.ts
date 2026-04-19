import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const quizAttemptSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    score: Number,
    answers: [
      {
        questionId: String,
        userAnswer: String,
        isCorrect: Boolean,
      },
    ],
    attemptDate: { type: Date, default: Date.now },
  },
  { _id: false },
);

const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    quizAttempts: [quizAttemptSchema],
    currentLesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    totalTimeSpent: { type: Number, default: 0 },
    lastAccessedAt: { type: Date, default: Date.now },
    certificateIssued: { type: Boolean, default: false },
    certificateUrl: String,
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export type UserProgressDoc = InferSchemaType<typeof progressSchema>;
export const UserProgressModel: Model<UserProgressDoc> = model<UserProgressDoc>(
  "UserProgress",
  progressSchema,
);
