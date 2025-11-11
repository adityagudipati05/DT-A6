import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import studentRoutes from "./routes/studentRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config(); // loads variables from .env

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected successfully to MongoDB Atlas"))
  .catch((err) => console.error("❌ Connection error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("Event Permission & Attendance API is running...");
});

app.use("/api/students", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/events", eventRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
