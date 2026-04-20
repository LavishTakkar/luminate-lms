import { Schema, model, type InferSchemaType, type Model } from "mongoose";
import { randomBytes } from "node:crypto";

const certificateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    courseTitle: { type: String, required: true },
    userFullName: { type: String, required: true },
    /** Public, unguessable slug for verification URLs */
    slug: {
      type: String,
      required: true,
      unique: true,
      default: () => randomBytes(9).toString("hex"),
    },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export type CertificateDoc = InferSchemaType<typeof certificateSchema>;
export const CertificateModel: Model<CertificateDoc> = model<CertificateDoc>(
  "Certificate",
  certificateSchema,
);
