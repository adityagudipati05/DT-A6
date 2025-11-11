import Event from "../models/Event.js";
import EventPass from "../models/EventPass.js";
import Student from "../models/Student.js";
import QRCode from "qrcode";
import crypto from "crypto";

// Create Event (Host Event)
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category, maxParticipants, facultyCoordinator } = req.body;

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category,
      maxParticipants,
      hostId: req.user.userId,
      facultyCoordinator: facultyCoordinator || null,
    });

    await newEvent.save();
    await newEvent.populate("hostId");

    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ message: "Error creating event", error: err.message });
  }
};

// Get All Events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("hostId", "name admissionNo")
      .populate("participants", "name admissionNo")
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
};

// Get Student's Hosted Events
export const getMyHostedEvents = async (req, res) => {
  try {
    const events = await Event.find({ hostId: req.user.userId })
      .populate("participants", "name admissionNo")
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
};

// Get Approved Events (for participation)
export const getApprovedEvents = async (req, res) => {
  try {
    const events = await Event.find({ approvalStatus: "Approved" })
      .populate("hostId", "name admissionNo")
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
};

// Participate in Event
export const participateInEvent = async (req, res) => {
  try {
    const { eventId, requestedTo } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // If student provided a faculty to request permission from, create a PermissionRequest
    if (requestedTo) {
      const PermissionRequest = require("../models/PermissionRequest.js").default;
      // handle optional uploaded proof (req.file) - multer will populate req.file
      let proofUrl = null;
      if (req.file) {
        // store relative path so frontend can request it if static serving is set up
        proofUrl = `/uploads/${req.file.filename}`;
      }

      const newRequest = new PermissionRequest({
        studentId: req.user.userId,
        eventId,
        requestedTo,
        proofUrl,
      });

      await newRequest.save();

      return res.status(201).json({ message: "Permission request created", request: newRequest });
    }

    // If no requestedTo is provided, fallback to immediate registration (legacy behavior)
    if (event.participants.includes(req.user.userId)) {
      return res.status(400).json({ message: "Already participating in this event" });
    }

    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: "Event is full" });
    }

    // Add student to event participants
    event.participants.push(req.user.userId);
    await event.save();

    // Add event to student's participated events
    await Student.findByIdAndUpdate(req.user.userId, {
      $push: { participatedEvents: eventId },
    });

    // Generate Event Pass with QR Code
    const passId = crypto.randomBytes(16).toString("hex");
    const qrCodeData = JSON.stringify({
      passId,
      eventId,
      studentId: req.user.userId,
    });

    const qrCode = await QRCode.toDataURL(qrCodeData);

    const eventPass = new EventPass({
      studentId: req.user.userId,
      eventId,
      qrCode: qrCode,
    });

    await eventPass.save();

    res.status(201).json({
      message: "Successfully registered for event",
      eventPass,
    });
  } catch (err) {
    res.status(500).json({ message: "Error participating in event", error: err.message });
  }
};

// Get Student's Event Passes
export const getMyEventPasses = async (req, res) => {
  try {
    const passes = await EventPass.find({ studentId: req.user.userId })
      .populate("eventId", "title date location")
      .sort({ createdAt: -1 });

    res.json(passes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching event passes", error: err.message });
  }
};

// Scan QR Code (Faculty) - Entry/Exit
export const scanQRCode = async (req, res) => {
  try {
    const { qrData, scanType = "entry" } = req.body; // scanType: "entry" or "exit"

    let passData;
    try {
      passData = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ message: "Invalid QR code format" });
    }

    const eventPass = await EventPass.findById(passData.passId || qrData);
    
    if (!eventPass) {
      return res.status(404).json({ message: "Event pass not found" });
    }

    // Check if event is approved
    const event = await Event.findById(eventPass.eventId);
    if (event.approvalStatus !== "Approved") {
      return res.status(400).json({ message: "Event has not been approved yet" });
    }

    // Update based on scan type
    if (scanType === "entry") {
      if (eventPass.entryScan.scannedAt) {
        return res.status(400).json({ message: "Entry already scanned for this pass" });
      }
      eventPass.entryScan.scannedAt = new Date();
      eventPass.entryScan.scannedBy = req.user.userId;
    } else if (scanType === "exit") {
      if (!eventPass.entryScan.scannedAt) {
        return res.status(400).json({ message: "Student must have entry scan before exit scan" });
      }
      if (eventPass.exitScan.scannedAt) {
        return res.status(400).json({ message: "Exit already scanned for this pass" });
      }
      eventPass.exitScan.scannedAt = new Date();
      eventPass.exitScan.scannedBy = req.user.userId;
      eventPass.passStatus = "Used";
    }

    await eventPass.save();
    await eventPass.populate("studentId", "name admissionNo");
    await eventPass.populate("eventId", "title");

    // Mark attendance only on entry scan
    if (scanType === "entry") {
      await Event.findByIdAndUpdate(
        eventPass.eventId,
        {
          $addToSet: {
            attendanceMarked: {
              studentId: eventPass.studentId,
              markedAt: new Date(),
            },
          },
        }
      );
    }

    res.json({
      message: `${scanType === "entry" ? "Entry" : "Exit"} scanned successfully`,
      eventPass,
      event: {
        title: event.title,
        totalAttendance: event.attendanceMarked.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error scanning QR code", error: err.message });
  }
};

// Get Event Attendance
export const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate(
      "attendanceMarked.studentId",
      "name admissionNo"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({
      eventTitle: event.title,
      totalParticipants: event.participants.length,
      presentCount: event.attendanceMarked.length,
      attendance: event.attendanceMarked,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
};
