import Student from "../models/Student.js";
import PermissionRequest from "../models/PermissionRequest.js";
import { generateToken } from "../middleware/auth.js";

// Student Login
export const studentLogin = async (req, res) => {
  try {
    const { admissionNo, password } = req.body;

    const student = await Student.findOne({ admissionNo });
    if (!student) {
      return res.status(401).json({ message: "Invalid admission number" });
    }

    // Simple password check (in production, use bcrypt)
    if (student.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken(student._id, "student");
    res.json({
      token,
      student: {
        _id: student._id,
        admissionNo: student.admissionNo,
        name: student.name,
        email: student.email,
        department: student.department,
        semester: student.semester,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// Get Student Profile
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.userId)
      .populate("hostedEvents")
      .populate("participatedEvents")
      .populate("eventPasses");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

// Get current student's permission requests
export const getMyRequests = async (req, res) => {
  try {
    const requests = await PermissionRequest.find({ studentId: req.user.userId })
      .populate("eventId", "title date location")
      .populate("requestedTo", "name facultyId")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Error fetching requests", error: err.message });
  }
};

// Update Student Profile
export const updateStudentProfile = async (req, res) => {
  try {
    const { name, email, phone, profileImage } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.user.userId,
      { name, email, phone, profileImage },
      { new: true }
    );

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

// Get Student Attendance
export const getStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findById(req.user.userId).populate({
      path: "participatedEvents",
      select: "title date",
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const attendanceData = {
      totalEvents: student.participatedEvents.length,
      attendancePercentage: student.attendance,
      events: student.participatedEvents,
    };

    res.json(attendanceData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
};
