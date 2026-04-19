import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const attachmentSchema = new Schema(
  {
    name: String,
    url: String,
    type: String,
  },
  { _id: false },
);

const lessonSchema = new Schema(
  {
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    contentType: {
      type: String,
      enum: ["video", "text", "pdf", "mixed"],
      default: "text",
    },
    videoUrl: String,
    attachments: [attachmentSchema],
    duration: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    aiSummary: String,
    aiKeyPoints: [String],
  },
  { timestamps: true },
);

export type LessonDoc = InferSchemaType<typeof lessonSchema>;
export const LessonModel: Model<LessonDoc> = model<LessonDoc>("Lesson", lessonSchema);
