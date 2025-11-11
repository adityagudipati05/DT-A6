# Event Permission & Attendance System - Setup & Integration Guide

## ✅ What's Been Set Up

### Backend Infrastructure
- ✅ Express.js server running on port 5000
- ✅ MongoDB Atlas database connected
- ✅ All API routes configured
- ✅ JWT authentication implemented
- ✅ Database seeded with students and faculty

### Installed Packages
- `express` - Web framework
- `mongoose` - MongoDB object modeling
- `dotenv` - Environment variables
- `jsonwebtoken` - JWT authentication
- `qrcode` - QR code generation

### Database Collections Created
1. **Students** (6 records) - All with password: `vnrvjiet`
2. **Faculty** (4 records) - All with password: `vnrvjiet`
3. **Events** - To be created by students
4. **EventPasses** - Auto-generated when students participate

---

## 🔑 Test Credentials

### Student Login
- **Admission No**: 24071A05E9
- **Password**: vnrvjiet
- **Name**: Gattu Manaswini

### Faculty Login  
- **Faculty ID**: 101
- **Password**: vnrvjiet
- **Name**: V Baby

---

## 🚀 How to Use in Frontend

### 1. Import API Client
```tsx
import { 
  studentLogin, 
  getApprovedEvents, 
  participateInEvent,
  getMyEventPasses,
  scanQRCode
} from '@/lib/apiClient';
```

### 2. Student Dashboard Integration

#### Login Form
```tsx
"use client"

import { useState } from "react"
import { studentLogin } from "@/lib/apiClient"

export default function StudentLogin() {
  const [admissionNo, setAdmissionNo] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async () => {
    const result = await studentLogin(admissionNo, password)
    if (result.success) {
      // Redirect to dashboard
      window.location.href = "/student/dashboard"
    } else {
      setError(result.error)
    }
  }

  return (
    <div>
      <input 
        value={admissionNo} 
        onChange={(e) => setAdmissionNo(e.target.value)}
        placeholder="Admission No (e.g., 24071A05E9)"
      />
      <input 
        type="password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (vnrvjiet)"
      />
      <button onClick={handleLogin}>Login</button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
```

#### Participate in Event
```tsx
"use client"

import { useState } from "react"
import { participateInEvent } from "@/lib/apiClient"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function EventCard({ event }) {
  const [isLoading, setIsLoading] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [showQR, setShowQR] = useState(false)

  const handleParticipate = async () => {
    setIsLoading(true)
    const result = await participateInEvent(event._id)
    if (result.success) {
      setQrCode(result.data.eventPass.qrCode)
      setShowQR(true)
    }
    setIsLoading(false)
  }

  return (
    <div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <button onClick={handleParticipate} disabled={isLoading}>
        {isLoading ? "Registering..." : "Participate"}
      </button>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <h2>Your Event Pass</h2>
          {qrCode && <img src={qrCode} alt="Event Pass QR Code" />}
          <p>Show this QR code at the event entrance</p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

#### Display Event Passes
```tsx
"use client"

import { useState, useEffect } from "react"
import { getMyEventPasses } from "@/lib/apiClient"

export default function MyEventPasses() {
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPasses = async () => {
      const result = await getMyEventPasses()
      if (result.success) {
        setPasses(result.data)
      }
      setLoading(false)
    }
    fetchPasses()
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {passes.map((pass) => (
        <div key={pass._id} className="border rounded-lg p-4">
          <h3>{pass.eventId.title}</h3>
          <p>{pass.eventId.date}</p>
          <img src={pass.qrCode} alt="Pass QR Code" className="w-full" />
          <p className="text-sm text-gray-600">
            Status: {pass.passStatus}
          </p>
        </div>
      ))}
    </div>
  )
}
```

### 3. Faculty Dashboard Integration

#### Scan QR Code
```tsx
"use client"

import { useState, useRef } from "react"
import { scanQRCode } from "@/lib/apiClient"
import jsQR from "jsqr"

export default function QRScanner() {
  const videoRef = useRef(null)
  const [result, setResult] = useState(null)

  const handleQRScan = async (qrData) => {
    const result = await scanQRCode(qrData)
    if (result.success) {
      setResult({
        studentName: result.data.eventPass.studentId.name,
        eventTitle: result.data.event.title,
        totalAttendance: result.data.event.totalAttendance
      })
    }
  }

  return (
    <div>
      <video ref={videoRef} />
      {result && (
        <div className="border-2 border-green-500 p-4 rounded">
          <p>✅ {result.studentName}</p>
          <p>Event: {result.eventTitle}</p>
          <p>Total Attendance: {result.totalAttendance}</p>
        </div>
      )}
    </div>
  )
}
```

#### Pending Requests List
```tsx
"use client"

import { useState, useEffect } from "react"
import { getPendingRequests, updateEventApproval } from "@/lib/apiClient"

export default function PendingEventRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const result = await getPendingRequests()
    if (result.success) {
      setRequests(result.data)
    }
    setLoading(false)
  }

  const handleApprove = async (eventId) => {
    const result = await updateEventApproval(eventId, "Approved")
    if (result.success) {
      fetchRequests()
    }
  }

  const handleReject = async (eventId) => {
    const result = await updateEventApproval(eventId, "Rejected")
    if (result.success) {
      fetchRequests()
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      {requests.map((event) => (
        <div key={event._id} className="border p-4 mb-4 rounded">
          <h3>{event.title}</h3>
          <p>Host: {event.hostId.name}</p>
          <p>{event.description}</p>
          <div className="flex gap-2">
            <button 
              onClick={() => handleApprove(event._id)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Approve
            </button>
            <button 
              onClick={() => handleReject(event._id)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 📋 API Workflow Examples

### Complete Student Event Participation Flow

```
1. Student Login
   POST /api/students/login
   Returns: JWT Token

2. Get Approved Events
   GET /api/events/approved
   Returns: List of approved events

3. Participate in Event
   POST /api/events/participate
   Returns: Event Pass with QR Code

4. Display QR Code
   Show the QR code image to student

5. Faculty Scans QR
   POST /api/events/scan-qr
   Marks attendance automatically

6. Check Attendance
   GET /api/students/attendance
   Returns: Attendance statistics
```

### Complete Faculty Event Approval Flow

```
1. Faculty Login
   POST /api/faculty/login
   Returns: JWT Token

2. Get Pending Requests
   GET /api/faculty/pending-requests
   Returns: List of pending events

3. Review Event Details
   Faculty can read event info

4. Approve or Reject
   PUT /api/faculty/approve-event
   Updates event status

5. Event becomes visible to students
   Students can now participate
```

---

## 🔌 Environment Setup

### Backend (.env file - already configured)
```
MONGO_URI=mongodb+srv://adityagudipati05:vnrvjiet@cluster0.ccokzur.mongodb.net/event_permission_db?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=mysecretkey
```

### Frontend (.env.local file - already configured)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 📊 Data Relationships

```
Student
├── hostedEvents: Array[Event]
├── participatedEvents: Array[Event]
└── eventPasses: Array[EventPass]

Event
├── hostId: Student
├── participants: Array[Student]
├── approvedBy: Faculty (optional)
└── attendanceMarked: Array[Student]

EventPass
├── studentId: Student
├── eventId: Event
└── scannedBy: Faculty (optional)

Faculty
└── scannedAttendance: Array[Attendance records]
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Student Login
curl -X POST http://localhost:5000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{"admissionNo":"24071A05E9","password":"vnrvjiet"}'

# Get Approved Events (replace TOKEN)
curl -X GET http://localhost:5000/api/events/approved \
  -H "Authorization: Bearer TOKEN"

# Participate in Event
curl -X POST http://localhost:5000/api/events/participate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"eventId":"event_id_here"}'
```

---

## ✨ Features Implemented

✅ Student authentication with JWT  
✅ Faculty authentication with JWT  
✅ Event creation by students  
✅ Event approval workflow by faculty  
✅ Automatic QR code generation for event passes  
✅ QR code scanning for attendance marking  
✅ Student attendance tracking  
✅ Event participation management  
✅ MongoDB Atlas integration  
✅ CORS enabled for frontend communication  
✅ Proper error handling  
✅ Token-based authorization  

---

## 🎯 Next Steps

1. **Update Frontend Components** - Use the API client in your existing React components
2. **Add QR Scanner** - Implement a QR scanner library for faculty
3. **Add Notifications** - Show toast notifications for API responses
4. **Form Validation** - Add validation to event creation forms
5. **Loading States** - Show loading indicators during API calls
6. **Error Handling** - Display user-friendly error messages

---

## ❓ Troubleshooting

### "Connection refused" error
- Check if backend is running: `node index.js`
- Verify MongoDB connection string in .env

### "Unauthorized" error (401)
- Token may be expired
- Check if token is correctly stored in localStorage
- Try logging in again

### "CORS" error
- CORS is enabled in backend
- Check if frontend URL matches the API URL in environment

### "Event not found" error  
- Verify event ID is correct
- Event might have been deleted

