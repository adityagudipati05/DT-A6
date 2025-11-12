import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["Technical", "Cultural", "Sports", "Workshop", "Other"],
      default: "Other",
    },
    maxParticipants: {
      type: Number,
      default: 100,
    },
    facultyCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      default: null,
    },
    qrCode: {
      type: String,
      default: null,
    },
    attendanceMarked: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        scanCount: {
          type: Number,
          default: 0,
          min: 0,
          max: 2,
        },
        entryTime: Date,
        exitTime: Date,
        attendancePercentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        markedAt: Date,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
