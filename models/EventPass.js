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
      required: false,  // Will be generated on creation
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
    // Scan count tracking (0 = no scans, 1 = entry only, 2 = entry + exit = attendance counted)
    scanCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
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

// Unique constraint: A student can only have one pass per event
eventPassSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("EventPass", eventPassSchema);
