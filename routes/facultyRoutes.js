import express from "express";
import { facultyLogin, getFacultyProfile, getPendingRequests, updateEventApproval, respondPermissionRequest, getAllFaculty, getRequestsStats } from "../controllers/facultyController.js";
import { authenticateToken, authorizeRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", facultyLogin);
router.get("/profile", authenticateToken, getFacultyProfile);
router.get("/pending-requests", authenticateToken, authorizeRole(["faculty"]), getPendingRequests);
router.get("/requests-stats", authenticateToken, authorizeRole(["faculty"]), getRequestsStats);
router.put("/approve-event", authenticateToken, authorizeRole(["faculty"]), updateEventApproval);
router.put("/permissions/respond", authenticateToken, authorizeRole(["faculty"]), respondPermissionRequest);
router.get("/all", authenticateToken, authorizeRole(["faculty","student","admin"]), getAllFaculty);

export default router;
