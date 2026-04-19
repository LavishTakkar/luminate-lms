import { Schema, model, type InferSchemaType, type Model } from "mongoose";

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson" },
    messages: [messageSchema],
    context: String,
  },
  { timestamps: true },
);

export type AIConversationDoc = InferSchemaType<typeof conversationSchema>;
export const AIConversationModel: Model<AIConversationDoc> = model<AIConversationDoc>(
  "AIConversation",
  conversationSchema,
);
