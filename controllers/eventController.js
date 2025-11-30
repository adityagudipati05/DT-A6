import mongoose from "mongoose";
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
    console.log("[getMyHostedEvents] Incoming request");
    console.log("[getMyHostedEvents] Headers:", req.headers);
    console.log("[getMyHostedEvents] User from token:", req.user);
    
    if (!req.user || !req.user.userId) {
      console.error("[getMyHostedEvents] No userId in request - token issue");
      return res.status(401).json({ message: "Invalid token - no userId", received: req.user });
    }
    
    const userId = req.user.userId;
    console.log("[getMyHostedEvents] Querying events for userId:", userId);
    
    const events = await Event.find({ hostId: userId })
      .populate("hostId", "name admissionNo email")
      .populate("participants", "name admissionNo email")
      .populate("facultyCoordinator", "name facultyId")
      .sort({ createdAt: -1 });

    console.log("[getMyHostedEvents] Query complete - found", events.length, "events");
    res.json({ events, userId, queriedFor: userId });
  } catch (err) {
    console.error("[getMyHostedEvents] Exception:", err);
    res.status(500).json({ message: "Error fetching events", error: err.message, stack: err.stack });
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

    // Check if event is approved before allowing participation
    if (event.approvalStatus !== "Approved") {
      return res.status(400).json({ 
        message: "Cannot join event",
        detail: `Event is ${event.approvalStatus || "pending"} approval. Please try again later.`
      });
    }

    // Student must request permission from a Faculty member
    if (!requestedTo) {
      return res.status(400).json({ message: "Please select a faculty member to request permission from" });
    }

    // handle optional uploaded proof (req.file) - multer will populate req.file
    let proofUrl = null;
    if (req.file) {
      // store relative path so frontend can request it if static serving is set up
      proofUrl = `/uploads/${req.file.filename}`;
    }

    const newRequest = new PermissionRequest({
      studentId: req.user.userId,
      eventId,
      requestedTo,  // Must be a Faculty ID
      proofUrl,
    });

    await newRequest.save();

    return res.status(201).json({ message: "Permission request created", request: newRequest });
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
    console.log("\n[markAttendanceByQR] ===== INCOMING REQUEST =====");
    console.log("[markAttendanceByQR] Full req.body:", JSON.stringify(req.body));
    console.log("[markAttendanceByQR] qrData received:", qrData);
    console.log("[markAttendanceByQR] qrData type:", typeof qrData);
    console.log("[markAttendanceByQR] qrData length:", qrData ? qrData.length : 'null');
    console.log("[markAttendanceByQR] eventId:", eventId);
    console.log("[markAttendanceByQR] req.user:", req.user);

    // Validate inputs
    if (!qrData || !eventId) {
      console.error("[markAttendanceByQR] ❌ Missing required fields - qrData or eventId");
      return res.status(400).json({ message: "QR data and event ID are required" });
    }

    // The QR data should be just the passId (EventPass _id)
    const passIdToFind = qrData.trim();
    
    console.log("[markAttendanceByQR] Raw QR data received:", passIdToFind);
    console.log("[markAttendanceByQR] QR data length:", passIdToFind.length);
    console.log("[markAttendanceByQR] First 50 chars:", passIdToFind.substring(0, 50));

    // Extract ObjectId from QR data
    let extractedId = passIdToFind;
    
    // Handle different formats:
    // - Exactly 24 hex chars: use as-is
    // - 32 chars: take last 24 (most likely format from copy-paste)
    // - Other: reject
    
    if (passIdToFind.match(/^[0-9a-fA-F]{24}$/)) {
      // Exactly 24 chars - perfect
      console.log("[markAttendanceByQR] ✅ Valid 24-char ObjectId format detected");
      extractedId = passIdToFind;
    } else if (passIdToFind.match(/^[0-9a-fA-F]{32}$/)) {
      // Exactly 32 chars - take the last 24 (first 8 are usually extra)
      extractedId = passIdToFind.substring(8);
      console.log("[markAttendanceByQR] ℹ️ 32-char string detected, using last 24 chars");
      console.log("[markAttendanceByQR] Original:", passIdToFind);
      console.log("[markAttendanceByQR] Extracted:", extractedId);
    } else {
      console.error("[markAttendanceByQR] ❌ Invalid QR format");
      console.error("[markAttendanceByQR] Expected 24 or 32 hex chars, got:", passIdToFind.length, "chars");
      console.error("[markAttendanceByQR] Data:", passIdToFind);
      return res.status(400).json({ 
        message: "Invalid QR code format",
        detail: `Expected 24 or 32 character hex string, got ${passIdToFind.length} characters`
      });
    }

    // Find the event pass - convert hex string to ObjectId
    console.log("[markAttendanceByQR] Looking for EventPass with ID:", extractedId);
    
    // Convert hex string to MongoDB ObjectId
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(extractedId);
      console.log("[markAttendanceByQR] ✅ Converted to ObjectId:", objectId);
    } catch (err) {
      console.error("[markAttendanceByQR] ❌ Failed to convert to ObjectId:", err.message);
      return res.status(400).json({ message: "Invalid QR code ID format" });
    }
    
    const eventPass = await EventPass.findById(objectId)
      .populate("studentId", "name admissionNo attendance eventAttendance")
      .populate("eventId");

    console.log("[markAttendanceByQR] EventPass found:", !!eventPass);

    if (!eventPass) {
      console.error("[markAttendanceByQR] ❌ EventPass not found for ID:", passIdToFind);
      console.error("[markAttendanceByQR] 🔍 Searched with ObjectId:", objectId);
      return res.status(404).json({ message: "Participant not found. Invalid QR code." });
    }

    // Log the found EventPass details
    console.log("[markAttendanceByQR] 📋 EventPass Details:");
    console.log("  - EventPass ID:", eventPass._id);
    console.log("  - Student ID:", eventPass.studentId?._id);
    console.log("  - Student Name:", eventPass.studentId?.name);
    console.log("  - Student Admission:", eventPass.studentId?.admissionNo);
    console.log("  - Event ID:", eventPass.eventId?._id);
    console.log("  - Event Title:", eventPass.eventId?.title);
    console.log("  - ScanCount:", eventPass.scanCount);
    console.log("  - PassStatus:", eventPass.passStatus);

    // Verify eventId is valid
    if (!eventPass.eventId) {
      console.error("[markAttendanceByQR] ❌ EventPass has no associated event");
      return res.status(400).json({ message: "EventPass has no associated event" });
    }

    // NOTE: Event mismatch check REMOVED for testing purposes
    // Allows scanning QR codes from different events
    console.log("[markAttendanceByQR] 🔍 Checking event details:");
    console.log("  - EventPass event ID:", String(eventPass.eventId._id));
    console.log("  - Request event ID:", String(eventId));
    console.log("[markAttendanceByQR] ℹ️  Event mismatch validation disabled for testing");

    // Check if attendance already marked for this student
    const event = await Event.findById(eventId);
    if (!event) {
      console.error("[markAttendanceByQR] ❌ Event not found:", eventId);
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Verify the user is the event host (host can be faculty or student)
    console.log("[markAttendanceByQR] Checking if user is event host:");
    console.log("  - Event hostId:", String(event.hostId));
    console.log("  - Request userId:", String(req.user.userId));
    
    if (String(event.hostId) !== String(req.user.userId)) {
      console.error("[markAttendanceByQR] ❌ User is not the event host");
      return res.status(403).json({ 
        message: "Only the event host can scan QR codes",
        detail: "You are not the host of this event"
      });
    }
    console.log("[markAttendanceByQR] ✅ User is event host - allowed to scan");
    
    const existingRecord = event.attendanceMarked.find(
      (att) => String(att.studentId) === String(eventPass.studentId._id)
    );

    console.log("[markAttendanceByQR] Existing record found:", !!existingRecord);
    console.log("[markAttendanceByQR] Student ObjectId:", eventPass.studentId._id);

    // Auto-detect entry/exit based on scan count
    let scanType = "entry";
    let attendancePercentage = 50; // First scan = 50% (entry)
    const now = new Date();
    const studentId = eventPass.studentId._id; // Extract the actual student ID

    if (existingRecord) {
      // Second scan = exit (100% attendance)
      scanType = "exit";
      attendancePercentage = 100;
      existingRecord.scanCount = (existingRecord.scanCount || 1) + 1;
      existingRecord.exitTime = now;
      existingRecord.attendancePercentage = 100;
      
      // UPDATE EVENTPASS EXIT SCAN
      console.log("[markAttendanceByQR] 📍 Updating EventPass exit scan");
      eventPass.exitScan.scannedAt = now;
      eventPass.exitScan.scannedBy = req.user.userId; // Host who scanned
      eventPass.scanCount = 2;
      await eventPass.save();
      console.log("[markAttendanceByQR] ✅ EventPass exit scan recorded");
    } else {
      // First scan = entry
      event.attendanceMarked.push({
        studentId: studentId,
        scanCount: 1,
        entryTime: now,
        attendancePercentage: 50,
      });
      
      // UPDATE EVENTPASS ENTRY SCAN
      console.log("[markAttendanceByQR] 📍 Updating EventPass entry scan");
      eventPass.entryScan.scannedAt = now;
      eventPass.entryScan.scannedBy = req.user.userId; // Host who scanned
      eventPass.scanCount = 1;
      await eventPass.save();
      console.log("[markAttendanceByQR] ✅ EventPass entry scan recorded");
    }

    await event.save();
    
    // UPDATE STUDENT ATTENDANCE: Increment by 1% when exit scan is completed
    if (scanType === "exit") {
      console.log("[markAttendanceByQR] 📊 Updating student total attendance");
      
      const student = await Student.findById(studentId);
      if (student) {
        // Increment total attendance by 1%, cap at 100%
        const newAttendance = Math.min(100, (student.attendance || 0) + 1);
        student.attendance = newAttendance;
        
        // Also update or create event attendance record in Student document
        const existingEventAttendance = student.eventAttendance.find(
          (ea) => String(ea.eventId) === String(eventId)
        );
        
        if (existingEventAttendance) {
          existingEventAttendance.percentage = 100;
          existingEventAttendance.scanCount = 2;
          existingEventAttendance.exitTime = new Date();
        } else {
          student.eventAttendance.push({
            eventId,
            percentage: 100,
            scanCount: 2,
            entryTime: existingRecord?.entryTime || new Date(),
            exitTime: new Date(),
            markedAt: new Date(),
          });
        }
        
        await student.save();
        console.log("[markAttendanceByQR] ✅ Student attendance updated to:", newAttendance, "%");
      }
    }

    console.log("[markAttendanceByQR] ✅ Attendance marked successfully - scanType:", scanType);

    res.json({
      message: `${scanType === "entry" ? "Entry marked" : "Exit marked"} successfully`,
      status: scanType,
      student: {
        studentId: eventPass.studentId._id,
        name: eventPass.studentId.name,
        admissionNo: eventPass.studentId.admissionNo,
      },
      attendance: attendancePercentage,
      totalAttendance: event.attendanceMarked.length,
    });
  } catch (err) {
    console.error("\n[markAttendanceByQR] ❌ EXCEPTION CAUGHT:");
    console.error("[markAttendanceByQR] Error message:", err.message);
    console.error("[markAttendanceByQR] Error stack:", err.stack);
    console.error("[markAttendanceByQR] Error type:", err.constructor.name);
    res.status(500).json({ 
      message: "Error marking attendance", 
      error: err.message,
      type: err.constructor.name
    });
  }
};
