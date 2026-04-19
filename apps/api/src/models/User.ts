import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatar: String,
    bio: String,
    role: { type: String, enum: ["student", "admin"], default: "student", required: true },
    learningPreferences: {
      topics: [String],
      difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"] },
      learningStyle: String,
    },
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const UserModel: Model<UserDoc> = model<UserDoc>("User", userSchema);
