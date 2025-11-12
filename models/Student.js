import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      sparse: true,
    },
    phone: {
      type: String,
      sparse: true,
    },
    department: {
      type: String,
      default: "CSE",
    },
    semester: {
      type: String,
      default: "2nd Year",
    },
    profileImage: {
      type: String,
      default: null,
    },
    attendance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Track attendance in individual events
    eventAttendance: [
      {
        eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
        },
        percentage: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        scanCount: {
          type: Number,
          default: 0,
          min: 0,
          max: 2,
        },
        entryTime: Date,
        exitTime: Date,
        markedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    hostedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    participatedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    eventPasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventPass",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);
