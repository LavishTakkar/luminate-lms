import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const questionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["multiple-choice", "true-false", "short-answer"],
      required: true,
    },
    options: [String],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: String,
    points: { type: Number, default: 10, min: 0 },
  },
  { _id: false },
);

const quizSchema = new Schema(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    questions: [questionSchema],
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    timeLimit: Number,
    isAIGenerated: { type: Boolean, default: false },
    sourceContent: String,
  },
  { timestamps: true },
);

export type QuizDoc = InferSchemaType<typeof quizSchema>;
export const QuizModel: Model<QuizDoc> = model<QuizDoc>("Quiz", quizSchema);
