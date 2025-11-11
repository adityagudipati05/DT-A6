import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "./models/Student.js";
import Faculty from "./models/Faculty.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Student data
    const studentsData = [
      {
        admissionNo: "24071A05E9",
        name: "Gattu Manaswini",
        password: "vnrvjiet",
        email: "manaswini@student.edu",
        phone: "9999999901",
        department: "CSE",
        semester: "2nd Year",
      },
      {
        admissionNo: "24071A05F0",
        name: "Gudipati Venkata Sai Aditya",
        password: "vnrvjiet",
        email: "aditya@student.edu",
        phone: "9999999902",
        department: "CSE",
        semester: "2nd Year",
      },
      {
        admissionNo: "24071A12B9",
        name: "T Nagasaichetan",
        password: "vnrvjiet",
        email: "nagasai@student.edu",
        phone: "9999999903",
        department: "IT",
        semester: "2nd Year",
      },
      {
        admissionNo: "24071A12C0",
        name: "Tantepudi Sreenidhi",
        password: "vnrvjiet",
        email: "sreenidhi@student.edu",
        phone: "9999999904",
        department: "IT",
        semester: "2nd Year",
      },
      {
        admissionNo: "24071A04E3",
        name: "Ch Bala Sai Kusuma Rohith",
        password: "vnrvjiet",
        email: "rohith@student.edu",
        phone: "9999999905",
        department: "ECE",
        semester: "2nd Year",
      },
      {
        admissionNo: "24071A04E4",
        name: "Chechala Yeshwanth",
        password: "vnrvjiet",
        email: "yeshwanth@student.edu",
        phone: "9999999906",
        department: "ECE",
        semester: "2nd Year",
      },
    ];

    // Faculty data
    const facultyData = [
      {
        facultyId: "101",
        name: "V Baby",
        password: "vnrvjiet",
        email: "vbaby@faculty.edu",
        phone: "8888888801",
        department: "Computer Science",
        designation: "Assistant Professor",
      },
      {
        facultyId: "102",
        name: "Mangathayaru",
        password: "vnrvjiet",
        email: "mangathayaru@faculty.edu",
        phone: "8888888802",
        department: "Computer Science",
        designation: "Assistant Professor",
      },
      {
        facultyId: "103",
        name: "L Padma Sree",
        password: "vnrvjiet",
        email: "padmasree@faculty.edu",
        phone: "8888888803",
        department: "Computer Science",
        designation: "Assistant Professor",
      },
      {
        facultyId: "104",
        name: "Ch Naveen Reddy",
        password: "vnrvjiet",
        email: "naveenreddy@faculty.edu",
        phone: "8888888804",
        department: "Computer Science",
        designation: "Assistant Professor",
      },
    ];

    // Insert students
    const students = await Student.insertMany(studentsData);
    console.log(`✅ Created ${students.length} students`);

    // Insert faculty
    const faculty = await Faculty.insertMany(facultyData);
    console.log(`✅ Created ${faculty.length} faculty members`);

    console.log("\n📋 Seeded Data Summary:");
    console.log("\n👥 Students:");
    students.forEach((student) => {
      console.log(`  - ${student.admissionNo}: ${student.name}`);
    });

    console.log("\n👨‍🏫 Faculty:");
    faculty.forEach((fac) => {
      console.log(`  - ${fac.facultyId}: ${fac.name}`);
    });

    console.log("\n✅ Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  }
};

seedDatabase();
