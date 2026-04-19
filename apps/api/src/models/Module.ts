import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const moduleSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: String,
    order: { type: Number, default: 0 },
    lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: true },
);

export type ModuleDoc = InferSchemaType<typeof moduleSchema>;
export const ModuleModel: Model<ModuleDoc> = model<ModuleDoc>("Module", moduleSchema);
