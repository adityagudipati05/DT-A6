import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    facultyId: {
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
      default: "Computer Science",
    },
    designation: {
      type: String,
      default: "Assistant Professor",
    },
    profileImage: {
      type: String,
      default: null,
    },
    scannedAttendance: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
        },
        eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
        },
        scannedAt: Date,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", facultySchema);
