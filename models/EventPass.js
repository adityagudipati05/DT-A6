import mongoose from "mongoose";

const eventPassSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    passStatus: {
      type: String,
      enum: ["Active", "Used", "Cancelled"],
      default: "Active",
    },
    // Entry scan details
    entryScan: {
      scannedAt: {
        type: Date,
        default: null,
      },
      scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        default: null,
      },
    },
    // Exit scan details
    exitScan: {
      scannedAt: {
        type: Date,
        default: null,
      },
      scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Faculty",
        default: null,
      },
    },
    // Legacy field for backward compatibility
    scannedAt: {
      type: Date,
      default: null,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EventPass", eventPassSchema);
