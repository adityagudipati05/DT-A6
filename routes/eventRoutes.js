import express from "express";
import {
  createEvent,
  getAllEvents,
  getMyHostedEvents,
  getApprovedEvents,
  getMyApprovedEvents,
  participateInEvent,
  getMyEventPasses,
  scanQRCode,
  getEventAttendance,
  markAttendanceByQR,
  getEventPassDetails,
  getStudentAttendanceStats,
} from "../controllers/eventController.js";
import { authenticateToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/create", authenticateToken, createEvent);
router.get("/all", getAllEvents);
router.get("/approved", getApprovedEvents);
router.get("/my-events", authenticateToken, getMyHostedEvents);
router.get("/my-approved-events", authenticateToken, getMyApprovedEvents);
router.post("/participate", authenticateToken, upload.single("proof"), participateInEvent);
router.get("/my-passes", authenticateToken, getMyEventPasses);
router.get("/passes/:passId", authenticateToken, getEventPassDetails);
router.post("/scan-qr", authenticateToken, scanQRCode);
router.post("/mark-attendance", authenticateToken, markAttendanceByQR);
router.get("/stats/attendance", authenticateToken, getStudentAttendanceStats);
router.get("/:eventId/attendance", authenticateToken, getEventAttendance);

// DEBUG ENDPOINT - See state of all events and passes (must come before /:eventId routes)
router.get("/debug/all-state", async (req, res) => {
  try {
    const Event = (await import("../models/Event.js")).default;
    const EventPass = (await import("../models/EventPass.js")).default;
    const PermissionRequest = (await import("../models/PermissionRequest.js")).default;
    
    const events = await Event.find({}).select("_id title hostId participants");
    const passes = await EventPass.find({}).select("_id studentId eventId");
    const requests = await PermissionRequest.find({}).select("_id studentId eventId status");
    
    res.json({
      totalEvents: events.length,
      totalPasses: passes.length,
      totalRequests: requests.length,
      events: events.map(e => ({
        _id: e._id.toString(),
        title: e.title,
        hostId: e.hostId.toString(),
        participantCount: e.participants.length,
        participantIds: e.participants.map(p => p.toString())
      })),
      passes: passes.map(p => ({
        _id: p._id.toString(),
        studentId: p.studentId.toString(),
        eventId: p.eventId.toString()
      })),
      requests: requests.map(r => ({
        _id: r._id.toString(),
        studentId: r.studentId.toString(),
        eventId: r.eventId.toString(),
        status: r.status
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending approval requests for an event (must come before /:eventId/participants-list)
router.get("/:eventId/pending-requests", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const Event = (await import("../models/Event.js")).default;
    const PermissionRequest = (await import("../models/PermissionRequest.js")).default;

    console.log("\n[pending-requests] REQUEST RECEIVED");
    console.log("[pending-requests] eventId:", eventId);
    console.log("[pending-requests] Host user:", req.user.userId);

    // Verify user is event host
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.hostId) !== String(req.user.userId)) {
      console.error("[pending-requests] NOT HOST");
      return res.status(403).json({ message: "Only event host can view pending requests" });
    }

    // Get all pending requests for this event
    const requests = await PermissionRequest.find({
      eventId,
      status: "Pending"
    }).populate("studentId", "name admissionNo");

    console.log("[pending-requests] Found", requests.length, "pending requests");
    res.json({ count: requests.length, requests });
  } catch (err) {
    console.error("[pending-requests] ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Event host (student) approves permission request (must come before /:eventId/participants-list)
router.put("/:eventId/approve-participant", authenticateToken, async (req, res) => {
  try {
    const { requestId, studentId } = req.body;
    const { eventId } = req.params;

    console.log("\n[approve-participant] REQUEST RECEIVED");
    console.log("[approve-participant] eventId:", eventId);
    console.log("[approve-participant] requestId:", requestId);
    console.log("[approve-participant] studentId:", studentId);
    console.log("[approve-participant] Host user:", req.user.userId);

    const Event = (await import("../models/Event.js")).default;
    const PermissionRequest = (await import("../models/PermissionRequest.js")).default;
    const EventPass = (await import("../models/EventPass.js")).default;
    const Student = (await import("../models/Student.js")).default;
    const QRCode = (await import("qrcode")).default;

    // Verify user is event host
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.hostId) !== String(req.user.userId)) {
      console.error("[approve-participant] NOT HOST - Host:", String(event.hostId), "User:", String(req.user.userId));
      return res.status(403).json({ message: "Only event host can approve participants" });
    }

    // Update permission request status
    if (requestId) {
      const request = await PermissionRequest.findById(requestId);
      if (request) {
        request.status = "Approved";
        request.respondedBy = req.user.userId;
        request.respondedAt = new Date();
        await request.save();
        console.log("[approve-participant] Permission request approved:", requestId);
      }
    }

    // Add student to event participants if not already
    if (!event.participants.includes(studentId)) {
      event.participants.push(studentId);
      await event.save();
      console.log("[approve-participant] Student added to event participants:", studentId);
    }

    // Add event to student's participated events
    await Student.findByIdAndUpdate(studentId, {
      $push: { participatedEvents: eventId },
    }, { upsert: true });

    // Create or update EventPass
    let eventPass = await EventPass.findOne({ studentId, eventId });
    if (!eventPass) {
      eventPass = new EventPass({ studentId, eventId });
      await eventPass.save();
      console.log("[approve-participant] EventPass created:", eventPass._id.toString());

      // Generate QR code
      const qrCode = await QRCode.toDataURL(eventPass._id.toString());
      eventPass.qrCode = qrCode;
      await eventPass.save();
      console.log("[approve-participant] QR code generated and saved");
    }

    console.log("[approve-participant] SUCCESS - Student approved for event\n");
    res.json({
      success: true,
      message: "Student approved for event",
      eventPass: {
        _id: eventPass._id,
        studentId,
        eventId,
        qrCode: eventPass.qrCode ? "generated" : "pending"
      }
    });
  } catch (err) {
    console.error("[approve-participant] ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get event participants with their QR codes (for scanning interface)
router.get("/:eventId/participants-list", authenticateToken, async (req, res) => {
  try {
    console.log("\n[participants-list] ========================================");
    console.log("[participants-list] NEW REQUEST RECEIVED");
    console.log("[participants-list] eventId:", req.params.eventId);
    console.log("[participants-list] user:", req.user);
    console.log("[participants-list] ========================================\n");
    
    const EventPass = (await import("../models/EventPass.js")).default;
    const Event = (await import("../models/Event.js")).default;
    const QRCode = (await import("qrcode")).default;
    
    const eventId = req.params.eventId;
    console.log("[participants-list] Fetching event:", eventId);
    const event = await Event.findById(eventId);
    
    if (!event) {
      console.error("[participants-list] EVENT NOT FOUND:", eventId);
      return res.status(404).json({ message: "Event not found" });
    }
    
    console.log("[participants-list] Event found:", event.title);
    console.log("[participants-list] Event host:", event.hostId);
    console.log("[participants-list] Request user:", req.user.userId);
    
    // Verify user is event host
    if (String(event.hostId) !== String(req.user.userId)) {
      console.error("[participants-list] USER NOT HOST - Host:", String(event.hostId), "User:", String(req.user.userId));
      return res.status(403).json({ message: "Only event host can view participants" });
    }
    
    console.log("[participants-list] Event has", event.participants.length, "participants");
    
    // Ensure EventPass exists for all participants
    if (event.participants.length > 0) {
      console.log("[participants-list] Creating EventPass for missing participants...");
      for (const studentId of event.participants) {
        const existingPass = await EventPass.findOne({ studentId, eventId });
        if (!existingPass) {
          try {
            console.log("[participants-list] Creating EventPass for student:", studentId);
            const newPass = new EventPass({ studentId, eventId });
            await newPass.save();
            const qrCode = await QRCode.toDataURL(newPass._id.toString());
            newPass.qrCode = qrCode;
            await newPass.save();
            console.log("[participants-list] Created EventPass:", newPass._id.toString());
          } catch (err) {
            console.error("[participants-list] Error creating EventPass:", err.message);
          }
        }
      }
    }
    
    // Fetch and return participants with their QR codes
    console.log("[participants-list] Fetching EventPass documents...");
    const passes = await EventPass.find({ eventId }).populate("studentId", "name admissionNo");
    
    console.log("[participants-list] Found", passes.length, "EventPass documents");
    
    const participants = passes.map(p => ({
      qrDataToPaste: p._id.toString(),
      qrCode: p._id.toString().substring(0, 24),
      studentName: p.studentId?.name || "Unknown",
      admissionNo: p.studentId?.admissionNo || "Unknown",
      scanned: p.scanCount > 0,
      entryScanned: !!p.entryScan?.scannedAt,
      exitScanned: !!p.exitScan?.scannedAt,
      scanCount: p.scanCount || 0
    }));
    
    console.log("[participants-list] Returning", participants.length, "participants");
    console.log("[participants-list] Response:", JSON.stringify({ count: participants.length, participants }, null, 2));
    res.json({ count: participants.length, participants });
  } catch (err) {
    console.error("[participants-list] CAUGHT ERROR:", err.message);
    console.error("[participants-list] Stack:", err.stack);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.get("/:eventId/attendance", authenticateToken, getEventAttendance);
router.get("/stats/attendance", authenticateToken, getStudentAttendanceStats);

export default router;
