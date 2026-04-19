import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "general", index: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
      index: true,
    },
    thumbnail: String,
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    modules: [{ type: Schema.Types.ObjectId, ref: "Module" }],
    tags: [String],
    isPublished: { type: Boolean, default: false, index: true },
    enrollmentCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true },
);

export type CourseDoc = InferSchemaType<typeof courseSchema>;
export const CourseModel: Model<CourseDoc> = model<CourseDoc>("Course", courseSchema);
