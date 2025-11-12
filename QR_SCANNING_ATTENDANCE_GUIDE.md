# 🎟️ QR Code Scanning & Attendance Tracking System

## 📋 Overview

The Event Management Portal now includes a comprehensive QR code scanning system for tracking student attendance at events. When a student is approved to participate in an event, they receive a unique QR code embedded in their event pass. Faculty/event organizers can scan this QR code twice (entry and exit) to mark attendance.

---

## 🎯 Key Features

### 1. **Unique QR Code Generation**
- ✅ Each approved event pass gets a unique QR code
- ✅ QR code contains encrypted pass ID, event ID, and student ID
- ✅ QR codes are displayed in the student's "My Event Passes" section
- ✅ Can be scanned multiple times without issues

### 2. **Dual-Scan Attendance Tracking**
- **Entry Scan (1st Scan)**: Marks student as present at entry
  - Status: `entry_only` (50% attendance)
  - Exit scan still pending
  
- **Exit Scan (2nd Scan)**: Completes attendance marking
  - Status: `present` (100% attendance)
  - Attendance percentage updated in student's profile

### 3. **Attendance Percentage Calculation**
- **Per Event**: 
  - Entry only: 50% attendance for that event
  - Entry + Exit: 100% attendance for that event
  
- **Overall Student Attendance**:
  - Calculated from all participated events
  - +1% per event with full attendance (entry + exit)
  - Formula: `(fully_attended_events / total_participated_events) * 100`

### 4. **Real-time Tracking**
- Entry time recorded during first scan
- Exit time recorded during second scan
- Faculty member who performed the scan is recorded
- Scan timestamps are permanent

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Student Approved for Event                               │
│    ✓ Permission request is approved by faculty              │
│    ✓ Event pass is created                                  │
│    ✓ Unique QR code is generated (contains pass ID)         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Student Views Event Pass                                 │
│    ✓ Go to "My Event Passes"                                │
│    ✓ Display QR code image                                  │
│    ✓ Shows event details and QR code status                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Faculty Scans Entry QR Code                              │
│    ✓ Go to "Scan Attendance"                                │
│    ✓ Select event                                           │
│    ✓ Scan QR code (scanType: "entry")                       │
│    ✓ System records entry time & faculty member             │
│    ✓ Status: entry_only (50% attendance)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Faculty Scans Exit QR Code (Same Pass)                   │
│    ✓ Same QR code scanned again                             │
│    ✓ Scan QR code (scanType: "exit")                        │
│    ✓ System records exit time & faculty member              │
│    ✓ Event pass status: "Used"                              │
│    ✓ Status: present (100% attendance)                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Attendance Records Updated                               │
│    ✓ Event: attendance record updated with both scans       │
│    ✓ Student: attendance percentage recalculated            │
│    ✓ Event pass: scanCount = 2, passStatus = "Used"         │
│    ✓ Overall student attendance: +1% (if event required)    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. View Reports                                             │
│    ✓ Event Attendance Report (by faculty)                   │
│    ✓ Student Attendance Stats (by student)                  │
│    ✓ Export CSV for records                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Updates

### EventPass Model Changes
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (ref: Student),
  eventId: ObjectId (ref: Event),
  qrCode: String, // Data URL of QR image
  passStatus: String, // "Active" | "Used" | "Cancelled"
  
  // Entry scan details
  entryScan: {
    scannedAt: Date,
    scannedBy: ObjectId (ref: Faculty)
  },
  
  // Exit scan details
  exitScan: {
    scannedAt: Date,
    scannedBy: ObjectId (ref: Faculty)
  },
  
  // NEW: Scan count (0, 1, or 2)
  scanCount: Number, // 0 = no scans, 1 = entry only, 2 = entry + exit
  
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model Changes
```javascript
{
  // ... existing fields ...
  
  // NEW: Enhanced attendance tracking
  attendanceMarked: [
    {
      studentId: ObjectId,
      scanCount: Number, // 0, 1, or 2
      entryTime: Date,
      exitTime: Date,
      attendancePercentage: Number, // 50 (entry only) or 100 (full)
      markedAt: Date
    }
  ]
}
```

### Student Model Changes
```javascript
{
  // ... existing fields ...
  
  // Enhanced overall attendance tracking
  attendance: Number, // 0-100 percentage
  
  // NEW: Track event-wise attendance
  eventAttendance: [
    {
      eventId: ObjectId,
      percentage: Number, // 50 or 100
      scanCount: Number, // 0, 1, or 2
      entryTime: Date,
      exitTime: Date,
      markedAt: Date
    }
  ]
}
```

---

## 📡 API Endpoints

### 1. **Scan QR Code (Entry/Exit)**
**Endpoint:** `POST /api/events/scan-qr`

**Request Body:**
```json
{
  "qrData": "{\"passId\":\"abc123\",\"eventId\":\"evt456\",\"studentId\":\"std789\"}",
  "scanType": "entry" // or "exit"
}
```

**Response (Entry Scan):**
```json
{
  "message": "Entry scanned successfully",
  "eventPass": {
    "_id": "pass123",
    "scanCount": 1,
    "passStatus": "Active",
    "entryScan": {
      "scannedAt": "2025-11-12T10:30:00Z",
      "scannedBy": "faculty_id_123"
    }
  },
  "event": {
    "title": "Tech Conference 2025",
    "totalAttendance": 45,
    "studentAttendancePercentage": 50,
    "isAttendanceComplete": false
  }
}
```

**Response (Exit Scan):**
```json
{
  "message": "Exit scanned successfully",
  "eventPass": {
    "_id": "pass123",
    "scanCount": 2,
    "passStatus": "Used",
    "exitScan": {
      "scannedAt": "2025-11-12T16:30:00Z",
      "scannedBy": "faculty_id_123"
    }
  },
  "event": {
    "title": "Tech Conference 2025",
    "totalAttendance": 45,
    "studentAttendancePercentage": 100,
    "isAttendanceComplete": true
  }
}
```

### 2. **Get Event Attendance Report**
**Endpoint:** `GET /api/events/:eventId/attendance`

**Response:**
```json
{
  "eventTitle": "Tech Conference 2025",
  "eventId": "evt456",
  "stats": {
    "total": 50,
    "presentCount": 45,
    "entryOnlyCount": 3,
    "absentCount": 2,
    "attendancePercentage": 90
  },
  "attendance": [
    {
      "studentId": "std789",
      "studentName": "John Doe",
      "admissionNo": "24071A04E3",
      "status": "present",
      "scanCount": 2,
      "entryTime": "2025-11-12T10:30:00Z",
      "exitTime": "2025-11-12T16:30:00Z",
      "attendancePercentage": 100,
      "markedAt": "2025-11-12T16:30:05Z"
    },
    {
      "studentId": "std790",
      "studentName": "Jane Smith",
      "admissionNo": "24071A04E4",
      "status": "entry_only",
      "scanCount": 1,
      "entryTime": "2025-11-12T10:35:00Z",
      "exitTime": null,
      "attendancePercentage": 50,
      "markedAt": "2025-11-12T10:35:05Z"
    }
  ]
}
```

### 3. **Get Event Pass Details**
**Endpoint:** `GET /api/events/passes/:passId`

**Response:**
```json
{
  "_id": "pass123",
  "studentId": "std789",
  "studentName": "John Doe",
  "admissionNo": "24071A04E3",
  "event": {
    "_id": "evt456",
    "title": "Tech Conference 2025",
    "date": "2025-11-15T10:00:00Z",
    "location": "Main Auditorium",
    "description": "Annual tech conference with industry experts"
  },
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "passStatus": "Active",
  "scanCount": 0,
  "entryScanTime": null,
  "exitScanTime": null,
  "createdAt": "2025-11-12T08:00:00Z"
}
```

### 4. **Get Student Attendance Stats**
**Endpoint:** `GET /api/events/stats/attendance`

**Response:**
```json
{
  "totalAttendancePercentage": 85,
  "totalEvents": 5,
  "attendedEvents": 4,
  "partialAttendanceEvents": 1,
  "missedEvents": 0,
  "eventDetails": [
    {
      "eventId": "evt456",
      "eventTitle": "Tech Conference 2025",
      "eventDate": "2025-11-15T10:00:00Z",
      "scanCount": 2,
      "attendancePercentage": 100,
      "status": "attended",
      "entryTime": "2025-11-12T10:30:00Z",
      "exitTime": "2025-11-12T16:30:00Z",
      "markedAt": "2025-11-12T16:30:05Z"
    },
    {
      "eventId": "evt457",
      "eventTitle": "Cultural Night",
      "eventDate": "2025-11-16T18:00:00Z",
      "scanCount": 1,
      "attendancePercentage": 50,
      "status": "partial",
      "entryTime": "2025-11-12T18:00:00Z",
      "exitTime": null,
      "markedAt": "2025-11-12T18:00:05Z"
    }
  ]
}
```

---

## 👨‍💼 Faculty Actions

### Scan Event Attendance
1. **Login** as Faculty
2. **Click** "Scan Attendance" from dashboard
3. **Select** the event to scan for
4. **Scan or Enter** the QR code for student entry
   - System records entry time
   - Status: `entry_only` (50%)
5. **Scan or Enter** the same QR code for student exit
   - System records exit time
   - Status: `present` (100%)
6. **View** real-time statistics:
   - Total students
   - Present (2 scans)
   - Entry only (1 scan)
   - Absent (0 scans)
7. **Export** attendance as CSV for records

---

## 👨‍🎓 Student Actions

### View Event Pass & QR Code
1. **Login** as Student
2. **Click** "My Event Passes" 
3. **View** approved event pass with QR code
4. **Share** QR code with faculty at event entry/exit points

### Track Personal Attendance
1. **Login** as Student
2. **Click** "Attendance" or "My Stats"
3. **View**:
   - Overall attendance percentage
   - Event-wise breakdown
   - Entry/exit times for each event
   - Full attendance vs partial attendance

---

## 📊 Attendance Calculation Examples

### Example 1: Student with Full Attendance
```
Student: John Doe
Participated Events: 5

Event 1 (Tech Conf):      Entry ✓ Exit ✓ → 100%
Event 2 (Cultural):       Entry ✓ Exit ✓ → 100%
Event 3 (Sports):         Entry ✓ Exit ✓ → 100%
Event 4 (Workshop):       Entry ✓ Exit ✓ → 100%
Event 5 (Seminar):        Entry ✓ Exit ✓ → 100%

Overall Attendance = (5 attended / 5 total) * 100 = 100%
```

### Example 2: Student with Partial Attendance
```
Student: Jane Smith
Participated Events: 5

Event 1 (Tech Conf):      Entry ✓ Exit ✓ → 100%
Event 2 (Cultural):       Entry ✓ Exit ✓ → 100%
Event 3 (Sports):         Entry ✓ Exit ✗ → 50%
Event 4 (Workshop):       Entry ✗ Exit ✗ → 0%
Event 5 (Seminar):        Entry ✓ Exit ✓ → 100%

Fully Attended = 3, Partial = 1, Missed = 1
Overall Attendance = (3 attended / 5 total) * 100 = 60%
```

### Example 3: Attendance Increase Over Time
```
Event 1: Attended → +20% (1/5)
Event 2: Attended → +20% (2/5)
Event 3: Attended → +20% (3/5)
Event 4: Attended → +20% (4/5)
Event 5: Attended → +20% (5/5) = 100%

OR with partial:
Event 1: Attended → +14% (1/7)
Event 2: Attended → +14% (2/7)
Event 3: Partial  → +0%
Event 4: Missed   → +0%
Event 5: Attended → +14% (3/7)
Event 6: Attended → +14% (4/7)
Event 7: Attended → +14% (5/7) = 71%
```

---

## ⚙️ Technical Implementation

### QR Code Structure
The QR code contains JSON data:
```json
{
  "passId": "hex_string_16_bytes",
  "eventId": "mongodb_object_id",
  "studentId": "mongodb_object_id"
}
```

### Generation Process (Backend)
```javascript
// 1. Create pass ID
const passId = crypto.randomBytes(16).toString("hex");

// 2. Create QR data
const qrCodeData = JSON.stringify({
  passId,
  eventId,
  studentId,
});

// 3. Generate QR image
const qrCode = await QRCode.toDataURL(qrCodeData);

// 4. Save to database
const eventPass = new EventPass({
  studentId,
  eventId,
  qrCode: qrCode, // Data URL
});
```

### Scanning Process (Frontend)
```javascript
// 1. User scans QR with device camera or barcode scanner
// 2. QR data is extracted: {"passId":"...", "eventId":"...", "studentId":"..."}
// 3. Send to backend with scan type (entry or exit)

fetch('/api/events/scan-qr', {
  method: 'POST',
  body: JSON.stringify({
    qrData: '{"passId":"...","eventId":"...","studentId":"..."}',
    scanType: 'entry' // or 'exit'
  })
});
```

---

## 🔒 Security Features

1. **Unique QR Codes**: Each pass has unique ID
2. **Event Verification**: QR code is verified against event
3. **Scan Validation**: Can only scan entry once, exit once
4. **Faculty Authentication**: Only authenticated faculty can scan
5. **Timestamp Recording**: All scans are timestamped and tracked
6. **Faculty Attribution**: Each scan records which faculty performed it

---

## 🐛 Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Event pass not found" | Invalid QR code | Rescan or verify QR is correct |
| "Entry already scanned" | Entry already recorded | Proceed to exit scan |
| "Exit already scanned" | Exit already recorded | Pass already used |
| "Must have entry before exit" | Exit scanned without entry | Student must enter first |
| "Event not approved yet" | Event status is Pending/Rejected | Wait for event approval |
| "Invalid QR format" | QR contains wrong data | Regenerate pass/QR |

---

## 📈 Future Enhancements

1. **Mobile App**: Native app for scanning QR codes
2. **Real-time Dashboard**: Live attendance updates
3. **Email Notifications**: Confirm attendance to students
4. **Late Arrival Tracking**: Mark if entry time exceeds event start
5. **Early Exit Tracking**: Track students who leave early
6. **Participation Reports**: Download formatted reports
7. **Automated Reminders**: Alert about missing exit scans
8. **Geofencing**: Verify location during scan

---

## 🎓 Testing Checklist

- [ ] Student receives event pass with QR code after approval
- [ ] Faculty can scan entry QR code successfully
- [ ] Student attendance marked as 50% after entry scan
- [ ] Faculty can scan exit QR code for same pass
- [ ] System prevents double entry scans
- [ ] System prevents exit without entry
- [ ] Student attendance marked as 100% after exit scan
- [ ] Overall student attendance percentage updates correctly
- [ ] Event attendance report shows all three categories (present, entry only, absent)
- [ ] Student can view personal attendance statistics
- [ ] Export CSV works and contains correct data
- [ ] Error messages appear for invalid scans
- [ ] QR codes work multiple times without degradation

---

## 📞 Support

For issues or questions about the QR scanning system:
1. Check the error message in the response
2. Verify event is approved
3. Ensure faculty is authenticated
4. Check QR code is valid and not corrupted
5. Verify student has event pass

---

**Last Updated:** November 12, 2025  
**System Version:** Event Management Portal v2.0
