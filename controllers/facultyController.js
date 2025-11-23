import Faculty from "../models/Faculty.js";
import Event from "../models/Event.js";
import PermissionRequest from "../models/PermissionRequest.js";
import EventPass from "../models/EventPass.js";
import Student from "../models/Student.js";
import { generateToken } from "../middleware/auth.js";
import crypto from "crypto";
import QRCode from "qrcode";

// Get all faculty (simple list) for dropdowns
export const getAllFaculty = async (req, res) => {
  try {
    const faculties = await Faculty.find().select("name facultyId department");
    res.json(faculties);
  } catch (err) {
    res.status(500).json({ message: "Error fetching faculties", error: err.message });
  }
};

// Faculty Login
export const facultyLogin = async (req, res) => {
  try {
    const { facultyId, password } = req.body;

    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) {
      return res.status(401).json({ message: "Invalid faculty ID" });
    }

    // Simple password check (in production, use bcrypt)
    if (faculty.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = generateToken(faculty._id, "faculty");
    res.json({
      token,
      faculty: {
        _id: faculty._id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        designation: faculty.designation,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// Get Faculty Profile
export const getFacultyProfile = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.userId);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

// Get Pending Event Requests
export const getPendingRequests = async (req, res) => {
  try {
    // Return only permission requests assigned to this faculty
    const requests = await PermissionRequest.find({ requestedTo: req.user.userId, status: "Pending" })
      .populate("studentId", "name admissionNo")
      .populate("eventId", "title date location")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ message: "Error fetching requests", error: err.message });
  }
};

// Get requests stats (counts of Pending, Approved, Rejected)
export const getRequestsStats = async (req, res) => {
  try {
    const pendingCount = await PermissionRequest.countDocuments({
      requestedTo: req.user.userId,
      status: "Pending",
    });

    const approvedCount = await PermissionRequest.countDocuments({
      requestedTo: req.user.userId,
      status: "Approved",
    });

    const rejectedCount = await PermissionRequest.countDocuments({
      requestedTo: req.user.userId,
      status: "Rejected",
    });

    res.json({
      totalRequests: pendingCount + approvedCount + rejectedCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
};

// Approve or Reject Event
export const updateEventApproval = async (req, res) => {
  try {
    const { eventId, approvalStatus } = req.body;

    if (!["Approved", "Rejected"].includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid approval status" });
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        approvalStatus,
        approvedBy: req.user.userId,
      },
      { new: true }
    ).populate("hostId");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ success: true, message: `Event ${approvalStatus.toLowerCase()} successfully`, data: event });
  } catch (err) {
    console.error("Error updating event approval:", err);
    res.status(500).json({ message: "Error updating event", error: err.message });
  }
};

// Respond to Permission Request (approve/reject)
export const respondPermissionRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body; // status: "Approved" or "Rejected"

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await PermissionRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (String(request.requestedTo) !== String(req.user.userId)) {
      return res.status(403).json({ message: "Not authorized to respond to this request" });
    }

    request.status = status;
    request.respondedBy = req.user.userId;
    request.respondedAt = new Date();
    await request.save();

    // If approved, add student as participant, create EventPass and update student's participatedEvents
    if (status === "Approved") {
      const event = await Event.findById(request.eventId);
      if (event) {
        // Set event approval status to "Approved" if not already
        if (event.approvalStatus === "Pending") {
          event.approvalStatus = "Approved";
          event.approvedBy = req.user.userId;
        }
        
        // Add student as participant
        if (!event.participants.includes(request.studentId)) {
          event.participants.push(request.studentId);
        }
        await event.save();
      }

      await Student.findByIdAndUpdate(request.studentId, { $push: { participatedEvents: request.eventId } });

      // create event pass with QR code
      const passId = crypto.randomBytes(16).toString("hex");
      const qrCode = await QRCode.toDataURL(passId);

      const eventPass = new EventPass({ 
        studentId: request.studentId, 
        eventId: request.eventId, 
        qrCode 
      });
      await eventPass.save();
    }

    res.json({ success: true, message: `Request ${status.toLowerCase()}`, request });
  } catch (err) {
    console.error("Error responding to request:", err);
    res.status(500).json({ message: "Error responding to request", error: err.message });
  }
};
