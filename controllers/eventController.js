import Event from "../models/Event.js";
import EventPass from "../models/EventPass.js";
import Student from "../models/Student.js";
import PermissionRequest from "../models/PermissionRequest.js";
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

    // If faculty coordinator is specified, create a PermissionRequest
    if (facultyCoordinator) {
      const permissionRequest = new PermissionRequest({
        studentId: req.user.userId,
        eventId: newEvent._id,
        requestedTo: facultyCoordinator,
      });
      await permissionRequest.save();
    }

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
      .populate("participants", "name admissionNo email")
      .sort({ createdAt: -1 });

    res.json({ events });
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

// Get Faculty's Approved Events (for faculty scanning/viewing)
export const getMyApprovedEvents = async (req, res) => {
  try {
    // Get events that were approved by this faculty OR where this faculty is the coordinator
    const events = await Event.find({
      $or: [
        { approvedBy: req.user.userId },
        { facultyCoordinator: req.user.userId }
      ],
      approvalStatus: "Approved"
    })
      .populate("hostId", "name admissionNo")
      .populate("participants", "name admissionNo")
      .sort({ createdAt: -1 });

    res.json({ events });
  } catch (err) {
    console.error("Error fetching faculty approved events:", err);
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
    // Use passId directly in QR code for easier scanning
    const qrCode = await QRCode.toDataURL(passId);

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

// Get Event Pass Details (for displaying QR code to student)
export const getEventPassDetails = async (req, res) => {
  try {
    const { passId } = req.params;

    const eventPass = await EventPass.findById(passId)
      .populate("eventId", "title date location description")
      .populate("studentId", "name admissionNo");

    if (!eventPass) {
      return res.status(404).json({ message: "Event pass not found" });
    }

    res.json({
      _id: eventPass._id,
      studentId: eventPass.studentId._id,
      studentName: eventPass.studentId.name,
      admissionNo: eventPass.studentId.admissionNo,
      event: {
        _id: eventPass.eventId._id,
        title: eventPass.eventId.title,
        date: eventPass.eventId.date,
        location: eventPass.eventId.location,
        description: eventPass.eventId.description,
      },
      qrCode: eventPass.qrCode,
      passStatus: eventPass.passStatus,
      scanCount: eventPass.scanCount,
      entryScanTime: eventPass.entryScan.scannedAt,
      exitScanTime: eventPass.exitScan.scannedAt,
      createdAt: eventPass.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching event pass", error: err.message });
  }
};

// Get Student's Attendance Stats Across All Events
export const getStudentAttendanceStats = async (req, res) => {
  try {
    const student = await Student.findById(req.user.userId).populate(
      "eventAttendance.eventId",
      "title date"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const totalEvents = student.participatedEvents.length;
    const attendedEvents = student.eventAttendance.filter(ea => ea.percentage === 100).length;
    const partialAttendanceEvents = student.eventAttendance.filter(ea => ea.percentage === 50).length;
    const missedEvents = totalEvents - attendedEvents - partialAttendanceEvents;

    res.json({
      totalAttendancePercentage: student.attendance,
      totalEvents: totalEvents,
      attendedEvents: attendedEvents,
      partialAttendanceEvents: partialAttendanceEvents,
      missedEvents: missedEvents,
      eventDetails: student.eventAttendance.map(ea => ({
        eventId: ea.eventId._id,
        eventTitle: ea.eventId.title,
        eventDate: ea.eventId.date,
        scanCount: ea.scanCount,
        attendancePercentage: ea.percentage,
        status: ea.percentage === 100 ? "attended" : ea.percentage === 50 ? "partial" : "missed",
        entryTime: ea.entryTime,
        exitTime: ea.exitTime,
        markedAt: ea.markedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance stats", error: err.message });
  }
};

// Get Student's Event Passes
export const getMyEventPasses = async (req, res) => {
  try {
    const passes = await EventPass.find({ studentId: req.user.userId })
      .populate("eventId", "title date location approvalStatus description")
      .sort({ createdAt: -1 });

    // Ensure all necessary fields are included in response
    const passesWithDetails = passes.map(pass => ({
      _id: pass._id,
      studentId: pass.studentId,
      eventId: pass.eventId,
      qrCode: pass.qrCode,
      passStatus: pass.passStatus,
      scanCount: pass.scanCount || 0,
      entryScan: pass.entryScan,
      exitScan: pass.exitScan,
      createdAt: pass.createdAt,
      updatedAt: pass.updatedAt,
    }));

    res.json(passesWithDetails);
  } catch (err) {
    res.status(500).json({ message: "Error fetching event passes", error: err.message });
  }
};

// Scan QR Code (Faculty) - Entry/Exit with Attendance Tracking
export const scanQRCode = async (req, res) => {
  try {
    const { qrData, passId, eventId } = req.body;

    // Use passId directly or parse qrData
    let passId_ = passId;
    if (!passId_ && qrData) {
      try {
        const passData = JSON.parse(qrData);
        passId_ = passData.passId;
      } catch {
        passId_ = qrData;
      }
    }

    if (!passId_) {
      return res.status(400).json({ message: "Pass ID is required" });
    }

    const eventPass = await EventPass.findById(passId_);
    
    if (!eventPass) {
      return res.status(404).json({ message: "Event pass not found" });
    }

    // Check if event is approved
    const event = await Event.findById(eventPass.eventId);
    if (event.approvalStatus !== "Approved") {
      return res.status(400).json({ message: "Event has not been approved yet" });
    }

    let attendancePercentage = 0;
    let isAttendanceComplete = false;
    let scanType = "entry";

    // Initialize scan objects if they don't exist
    if (!eventPass.entryScan) {
      eventPass.entryScan = { scannedAt: null, scannedBy: null };
    }
    if (!eventPass.exitScan) {
      eventPass.exitScan = { scannedAt: null, scannedBy: null };
    }

    // AUTO-DETECT scan type based on current scanCount
    if (eventPass.scanCount === 0) {
      // No scans yet, this is entry
      scanType = "entry";
    } else if (eventPass.scanCount === 1 && eventPass.entryScan.scannedAt) {
      // Already has entry, this is exit
      scanType = "exit";
    } else if (eventPass.scanCount >= 2) {
      // Already completed
      return res.status(400).json({ message: "This QR code has already been scanned for entry and exit" });
    }

    // Update based on scan type
    if (scanType === "entry") {
      eventPass.entryScan.scannedAt = new Date();
      eventPass.entryScan.scannedBy = req.user.userId;
      eventPass.scanCount = 1;
      attendancePercentage = 50;
    } else if (scanType === "exit") {
      eventPass.exitScan.scannedAt = new Date();
      eventPass.exitScan.scannedBy = req.user.userId;
      eventPass.scanCount = 2;
      eventPass.passStatus = "Used";
      isAttendanceComplete = true;
      attendancePercentage = 100;
    }

    await eventPass.save();
    await eventPass.populate("studentId", "name admissionNo");
    await eventPass.populate("eventId", "title");

    // Update Event attendance record with scan information
    const attendanceIndex = event.attendanceMarked.findIndex(
      (att) => String(att.studentId) === String(eventPass.studentId._id)
    );

    if (attendanceIndex === -1 && scanType === "entry") {
      // First time - create entry
      event.attendanceMarked.push({
        studentId: eventPass.studentId._id,
        scanCount: 1,
        entryTime: eventPass.entryScan.scannedAt,
        exitTime: null,
        attendancePercentage: 50, // 50% for entry only
        markedAt: new Date(),
      });
    } else if (attendanceIndex !== -1) {
      // Update existing record
      const attendance = event.attendanceMarked[attendanceIndex];
      
      if (scanType === "entry") {
        attendance.entryTime = eventPass.entryScan.scannedAt;
        attendance.scanCount = 1;
        attendance.attendancePercentage = 50; // 50% for entry only
      } else if (scanType === "exit") {
        attendance.exitTime = eventPass.exitScan.scannedAt;
        attendance.scanCount = 2;
        attendance.attendancePercentage = 100; // 100% for entry + exit
      }
      attendance.markedAt = new Date();
    }

    await event.save();

    // Update Student's event attendance record
    if (scanType === "exit" && isAttendanceComplete) {
      const student = await Student.findById(eventPass.studentId._id);
      
      const eventAttIdx = student.eventAttendance.findIndex(
        (ea) => String(ea.eventId) === String(eventPass.eventId)
      );

      if (eventAttIdx === -1) {
        // Add new event attendance record
        student.eventAttendance.push({
          eventId: eventPass.eventId,
          percentage: 100,
          scanCount: 2,
          entryTime: eventPass.entryScan.scannedAt,
          exitTime: eventPass.exitScan.scannedAt,
          markedAt: new Date(),
        });
      } else {
        // Update existing
        const eventAtt = student.eventAttendance[eventAttIdx];
        eventAtt.percentage = 100;
        eventAtt.scanCount = 2;
        eventAtt.entryTime = eventPass.entryScan.scannedAt;
        eventAtt.exitTime = eventPass.exitScan.scannedAt;
        eventAtt.markedAt = new Date();
      }

      // Calculate overall attendance percentage (1% increase per event)
      const totalEvents = student.participatedEvents.length || 1;
      const attendedEvents = student.eventAttendance.filter(ea => ea.percentage === 100).length;
      student.attendance = Math.min(100, (attendedEvents / totalEvents) * 100);

      await student.save();
    }

    res.json({
      message: `${scanType === "entry" ? "Entry" : "Exit"} scanned successfully`,
      scanType: scanType,
      studentId: eventPass.studentId._id,
      studentName: eventPass.studentId.name,
      studentAdmissionNo: eventPass.studentId.admissionNo,
      eventPass,
      event: {
        title: event.title,
        totalAttendance: event.attendanceMarked.length,
        studentAttendancePercentage: attendancePercentage,
        isAttendanceComplete: isAttendanceComplete,
      },
      attendancePercentage: attendancePercentage,
    });
  } catch (err) {
    res.status(500).json({ message: "Error scanning QR code", error: err.message });
  }
};

// Get Event Attendance with detailed scan information
export const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate(
      "attendanceMarked.studentId",
      "name admissionNo email"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attendanceStats = {
      total: event.participants.length,
      presentCount: event.attendanceMarked.filter(att => att.scanCount === 2).length,
      entryOnlyCount: event.attendanceMarked.filter(att => att.scanCount === 1).length,
      absentCount: event.participants.length - event.attendanceMarked.length,
      attendancePercentage: event.participants.length > 0 
        ? Math.round((event.attendanceMarked.filter(att => att.scanCount === 2).length / event.participants.length) * 100)
        : 0,
    };

    const detailedAttendance = event.attendanceMarked.map(att => ({
      studentId: att.studentId._id,
      studentName: att.studentId.name,
      admissionNo: att.studentId.admissionNo,
      email: att.studentId.email,
      status: att.scanCount === 2 ? "present" : att.scanCount === 1 ? "entry_only" : "absent",
      scanCount: att.scanCount,
      entryTime: att.entryTime,
      exitTime: att.exitTime,
      attendancePercentage: att.attendancePercentage,
      markedAt: att.markedAt,
    }));

    res.json({
      eventTitle: event.title,
      eventId: event._id,
      stats: attendanceStats,
      attendance: detailedAttendance,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
};

// Mark Attendance by QR Code Scan (for hosts)
export const markAttendanceByQR = async (req, res) => {
  try {
    const { qrData, eventId } = req.body;

    // Parse QR data
    let passData;
    try {
      passData = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ message: "Invalid QR code format" });
    }

    // Find the event pass
    const eventPass = await EventPass.findById(passData.passId || qrData)
      .populate("studentId", "name admissionNo")
      .populate("eventId");

    if (!eventPass) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Verify the event matches
    if (String(eventPass.eventId._id) !== String(eventId)) {
      return res.status(400).json({ message: "QR code does not match this event" });
    }

    // Check if already marked
    const event = await Event.findById(eventId);
    const alreadyMarked = event.attendanceMarked.some(
      (att) => String(att.studentId) === String(eventPass.studentId._id)
    );

    if (alreadyMarked) {
      return res.status(200).json({
        message: "Already marked",
        status: "already_marked",
        student: {
          name: eventPass.studentId.name,
          admissionNo: eventPass.studentId.admissionNo,
        },
      });
    }

    // Mark attendance
    event.attendanceMarked.push({
      studentId: eventPass.studentId._id,
      markedAt: new Date(),
    });

    await event.save();

    res.json({
      message: "Attendance marked successfully",
      status: "marked",
      student: {
        name: eventPass.studentId.name,
        admissionNo: eventPass.studentId.admissionNo,
      },
      totalAttendance: event.attendanceMarked.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Error marking attendance", error: err.message });
  }
};
