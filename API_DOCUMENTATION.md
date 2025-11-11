# Event Permission & Attendance System - API Documentation

## Server Status
- **Backend Server**: Running on `http://localhost:5000`
- **API Endpoint**: `http://localhost:5000/api`
- **Database**: MongoDB Atlas (Connected)

## Database Seeded With

### Students (6 total)
```
1. Admission No: 24071A05E9 | Name: Gattu Manaswini
2. Admission No: 24071A05F0 | Name: Gudipati Venkata Sai Aditya
3. Admission No: 24071A12B9 | Name: T Nagasaichetan
4. Admission No: 24071A12C0 | Name: Tantepudi Sreenidhi
5. Admission No: 24071A04E3 | Name: Ch Bala Sai Kusuma Rohith
6. Admission No: 24071A04E4 | Name: Chechala Yeshwanth
```
**Password for all students**: `vnrvjiet`

### Faculty (4 total)
```
1. Faculty ID: 101 | Name: V Baby
2. Faculty ID: 102 | Name: Mangathayaru
3. Faculty ID: 103 | Name: L Padma Sree
4. Faculty ID: 104 | Name: Ch Naveen Reddy
```
**Password for all faculty**: `vnrvjiet`

---

## API Endpoints

### 1. Authentication Endpoints

#### Student Login
```
POST /api/students/login
Content-Type: application/json

Body:
{
  "admissionNo": "24071A05E9",
  "password": "vnrvjiet"
}

Response:
{
  "token": "jwt_token_here",
  "student": {
    "_id": "student_id",
    "admissionNo": "24071A05E9",
    "name": "Gattu Manaswini",
    "email": "manaswini@student.edu",
    "department": "CSE",
    "semester": "4th Year"
  }
}
```

#### Faculty Login
```
POST /api/faculty/login
Content-Type: application/json

Body:
{
  "facultyId": "101",
  "password": "vnrvjiet"
}

Response:
{
  "token": "jwt_token_here",
  "faculty": {
    "_id": "faculty_id",
    "facultyId": "101",
    "name": "V Baby",
    "email": "vbaby@faculty.edu",
    "department": "Computer Science",
    "designation": "Assistant Professor"
  }
}
```

---

### 2. Student Profile Endpoints

#### Get Student Profile
```
GET /api/students/profile
Authorization: Bearer {token}

Response:
{
  "_id": "student_id",
  "admissionNo": "24071A05E9",
  "name": "Gattu Manaswini",
  "email": "manaswini@student.edu",
  "phone": "9999999901",
  "department": "CSE",
  "semester": "4th Year",
  "attendance": 0,
  "hostedEvents": [],
  "participatedEvents": [],
  "eventPasses": []
}
```

#### Update Student Profile
```
PUT /api/students/profile
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Updated Name",
  "email": "newemail@student.edu",
  "phone": "9999999999",
  "profileImage": "image_url"
}
```

#### Get Student Attendance
```
GET /api/students/attendance
Authorization: Bearer {token}

Response:
{
  "totalEvents": 3,
  "attendancePercentage": 85,
  "events": [
    {
      "_id": "event_id",
      "title": "Tech Workshop",
      "date": "2025-11-15T10:00:00Z"
    }
  ]
}
```

---

### 3. Faculty Endpoints

#### Get Faculty Profile
```
GET /api/faculty/profile
Authorization: Bearer {token}

Response:
{
  "_id": "faculty_id",
  "facultyId": "101",
  "name": "V Baby",
  "email": "vbaby@faculty.edu",
  "phone": "8888888801",
  "department": "Computer Science",
  "designation": "Assistant Professor"
}
```

#### Get Pending Event Requests
```
GET /api/faculty/pending-requests
Authorization: Bearer {token}

Response:
[
  {
    "_id": "event_id",
    "title": "Annual Tech Fest",
    "description": "Annual technology festival",
    "hostId": {
      "_id": "student_id",
      "admissionNo": "24071A05E9",
      "name": "Gattu Manaswini"
    },
    "date": "2025-11-20T14:00:00Z",
    "location": "College Auditorium",
    "category": "Technical",
    "maxParticipants": 200,
    "approvalStatus": "Pending"
  }
]
```

#### Approve or Reject Event
```
PUT /api/faculty/approve-event
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "eventId": "event_id",
  "approvalStatus": "Approved"  // or "Rejected"
}

Response:
{
  "_id": "event_id",
  "title": "Annual Tech Fest",
  "approvalStatus": "Approved",
  "approvedBy": "faculty_id"
}
```

---

### 4. Event Endpoints

#### Create Event (Host Event)
```
POST /api/events/create
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "title": "Annual Tech Fest",
  "description": "A grand technology festival",
  "date": "2025-11-20T14:00:00Z",
  "location": "College Auditorium",
  "category": "Technical",  // Technical, Cultural, Sports, Workshop, Other
  "maxParticipants": 200
}

Response:
{
  "_id": "event_id",
  "title": "Annual Tech Fest",
  "description": "A grand technology festival",
  "hostId": "student_id",
  "date": "2025-11-20T14:00:00Z",
  "location": "College Auditorium",
  "category": "Technical",
  "maxParticipants": 200,
  "approvalStatus": "Pending",
  "participants": [],
  "attendanceMarked": [],
  "qrCode": null
}
```

#### Get All Events
```
GET /api/events/all

Response:
[
  {
    "_id": "event_id",
    "title": "Annual Tech Fest",
    "description": "A grand technology festival",
    "hostId": {
      "_id": "student_id",
      "name": "Gattu Manaswini",
      "admissionNo": "24071A05E9"
    },
    "date": "2025-11-20T14:00:00Z",
    "location": "College Auditorium",
    "category": "Technical",
    "maxParticipants": 200,
    "participants": [],
    "approvalStatus": "Approved"
  }
]
```

#### Get Approved Events
```
GET /api/events/approved

Response: [List of approved events only]
```

#### Get My Hosted Events
```
GET /api/events/my-events
Authorization: Bearer {token}

Response: [Events hosted by the current student]
```

#### Participate in Event
```
POST /api/events/participate
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "eventId": "event_id"
}

Response:
{
  "message": "Successfully registered for event",
  "eventPass": {
    "_id": "pass_id",
    "studentId": "student_id",
    "eventId": "event_id",
    "qrCode": "data:image/png;base64,...",  // QR Code as data URL
    "passStatus": "Active",
    "createdAt": "2025-11-11T10:00:00Z"
  }
}
```

#### Get My Event Passes
```
GET /api/events/my-passes
Authorization: Bearer {token}

Response:
[
  {
    "_id": "pass_id",
    "studentId": "student_id",
    "eventId": {
      "_id": "event_id",
      "title": "Annual Tech Fest",
      "date": "2025-11-20T14:00:00Z",
      "location": "College Auditorium"
    },
    "qrCode": "data:image/png;base64,...",
    "passStatus": "Active",
    "createdAt": "2025-11-11T10:00:00Z"
  }
]
```

#### Scan QR Code (Faculty)
```
POST /api/events/scan-qr
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "qrData": "qr_code_data_or_pass_id"
}

Response:
{
  "message": "Attendance marked successfully",
  "eventPass": {
    "_id": "pass_id",
    "studentId": {
      "_id": "student_id",
      "name": "Gattu Manaswini",
      "admissionNo": "24071A05E9"
    },
    "eventId": "event_id",
    "passStatus": "Used",
    "scannedAt": "2025-11-20T14:30:00Z",
    "scannedBy": "faculty_id"
  },
  "event": {
    "title": "Annual Tech Fest",
    "totalAttendance": 45
  }
}
```

#### Get Event Attendance
```
GET /api/events/{eventId}/attendance
Authorization: Bearer {token}

Response:
{
  "eventTitle": "Annual Tech Fest",
  "totalParticipants": 50,
  "presentCount": 45,
  "attendance": [
    {
      "studentId": {
        "_id": "student_id",
        "name": "Gattu Manaswini",
        "admissionNo": "24071A05E9"
      },
      "markedAt": "2025-11-20T14:30:00Z"
    }
  ]
}
```

---

## Frontend Integration

### Using the API Client in React/Next.js

```jsx
import { studentLogin, getApprovedEvents, participateInEvent } from '@/lib/apiClient';

// Login
const handleLogin = async () => {
  const result = await studentLogin('24071A05E9', 'vnrvjiet');
  if (result.success) {
    // Token automatically stored in localStorage
    console.log('Logged in:', result.data.student);
  }
};

// Get Approved Events
const handleGetEvents = async () => {
  const result = await getApprovedEvents();
  if (result.success) {
    console.log('Events:', result.data);
  }
};

// Participate in Event
const handleParticipate = async (eventId) => {
  const result = await participateInEvent(eventId);
  if (result.success) {
    // Event pass with QR code generated
    console.log('Event pass:', result.data.eventPass);
    // Display QR code: result.data.eventPass.qrCode
  }
};
```

---

## Notes

- All authentication-required endpoints need a valid JWT token in the `Authorization` header
- Token format: `Authorization: Bearer {token}`
- QR codes are generated automatically when a student participates in an event
- Faculty can scan QR codes to mark attendance
- Events are pending approval from faculty until approved
- Database is automatically seeded with provided student and faculty data

---

## Troubleshooting

If API calls fail:
1. Ensure backend server is running: `node index.js`
2. Check MongoDB connection is active
3. Verify token is valid and not expired
4. Check CORS settings if calling from different domain
5. Ensure proper JSON format in request body

