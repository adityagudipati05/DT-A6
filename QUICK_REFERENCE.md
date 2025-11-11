# Quick Reference Card - API & Integration

## 🚀 Server Commands

```bash
# Start Backend Server
node index.js

# Seed Database (reinitialize data)
node seed.js

# Check if running
curl http://localhost:5000
```

---

## 🔐 Quick Login Test

### Student
```
Admission No: 24071A05E9
Password: vnrvjiet
```

### Faculty
```
Faculty ID: 101
Password: vnrvjiet
```

---

## 📱 Most Common API Calls

### Student Login
```javascript
import { studentLogin } from '@/lib/apiClient'

const result = await studentLogin('24071A05E9', 'vnrvjiet')
```

### Get All Events
```javascript
import { getAllEvents } from '@/lib/apiClient'

const result = await getAllEvents()
// result.data contains array of events
```

### Participate in Event
```javascript
import { participateInEvent } from '@/lib/apiClient'

const result = await participateInEvent(eventId)
// result.data.eventPass contains QR code
```

### Get My Event Passes
```javascript
import { getMyEventPasses } from '@/lib/apiClient'

const result = await getMyEventPasses()
// result.data is array of passes with QR codes
```

### Faculty: Get Pending Requests
```javascript
import { getPendingRequests } from '@/lib/apiClient'

const result = await getPendingRequests()
// result.data is array of pending events
```

### Faculty: Approve Event
```javascript
import { updateEventApproval } from '@/lib/apiClient'

const result = await updateEventApproval(eventId, 'Approved')
```

### Faculty: Scan QR Code
```javascript
import { scanQRCode } from '@/lib/apiClient'

const result = await scanQRCode(qrData)
// Marks attendance automatically
```

---

## 📊 Database Collections

### Students
```
{
  admissionNo: String (unique)
  name: String
  password: String
  email: String
  phone: String
  department: String
  semester: String
  attendance: Number (%)
  hostedEvents: [EventId]
  participatedEvents: [EventId]
  eventPasses: [PassId]
}
```

### Faculty
```
{
  facultyId: String (unique)
  name: String
  password: String
  email: String
  phone: String
  department: String
  designation: String
  scannedAttendance: [Record]
}
```

### Events
```
{
  title: String
  description: String
  hostId: StudentId
  date: Date
  location: String
  category: Enum[Technical|Cultural|Sports|Workshop|Other]
  maxParticipants: Number
  participants: [StudentId]
  approvalStatus: Enum[Pending|Approved|Rejected]
  approvedBy: FacultyId (optional)
  qrCode: String (optional)
  attendanceMarked: [{studentId, markedAt}]
}
```

### EventPasses
```
{
  studentId: StudentId
  eventId: EventId
  qrCode: String (base64)
  passStatus: Enum[Active|Used|Cancelled]
  scannedAt: Date (optional)
  scannedBy: FacultyId (optional)
}
```

---

## 🔑 All Test Credentials

### Students (All password: vnrvjiet)
1. 24071A05E9 - Gattu Manaswini
2. 24071A05F0 - Gudipati Venkata Sai Aditya
3. 24071A12B9 - T Nagasaichetan
4. 24071A12C0 - Tantepudi Sreenidhi
5. 24071A04E3 - Ch Bala Sai Kusuma Rohith
6. 24071A04E4 - Chechala Yeshwanth

### Faculty (All password: vnrvjiet)
1. 101 - V Baby
2. 102 - Mangathayaru
3. 103 - L Padma Sree
4. 104 - Ch Naveen Reddy

---

## 🎯 Integration Checklist

- [ ] Import apiClient in components
- [ ] Add login forms for student/faculty
- [ ] Display list of approved events
- [ ] Add participate button with API call
- [ ] Display QR code in dialog
- [ ] Add faculty scanning interface
- [ ] Display attendance list
- [ ] Add error toast notifications
- [ ] Add loading states
- [ ] Test all workflows

---

## ⚡ Quick Code Templates

### Login Component
```tsx
import { studentLogin } from '@/lib/apiClient'

export default function LoginForm() {
  const [admissionNo, setAdmissionNo] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const result = await studentLogin(admissionNo, password)
    if (result.success) {
      // Redirect to dashboard
    } else {
      console.error(result.error)
    }
  }

  return (
    <>
      <input value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </>
  )
}
```

### Event List Component
```tsx
import { useState, useEffect } from 'react'
import { getApprovedEvents } from '@/lib/apiClient'

export default function EventsList() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    getApprovedEvents().then(result => {
      if (result.success) setEvents(result.data)
    })
  }, [])

  return (
    <div>
      {events.map(event => (
        <div key={event._id}>
          <h3>{event.title}</h3>
          <p>{event.date}</p>
        </div>
      ))}
    </div>
  )
}
```

### QR Code Display
```tsx
import { Dialog, DialogContent } from '@/components/ui/dialog'

export default function QRCodeModal({ qrCode, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <h2>Your Event Pass</h2>
        <img src={qrCode} alt="Pass QR Code" />
      </DialogContent>
    </Dialog>
  )
}
```

---

## 🔍 Debugging Tips

### Check if Backend is Running
```bash
curl http://localhost:5000
# Should return: "Event Permission & Attendance API is running..."
```

### Test API Endpoint
```bash
# Student login test
curl -X POST http://localhost:5000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{"admissionNo":"24071A05E9","password":"vnrvjiet"}'
```

### Check Token in Browser
```javascript
// In browser console
localStorage.getItem('authToken')
```

### Clear All Local Data
```javascript
// In browser console
localStorage.clear()
```

---

## 📚 Documentation Files

- **API_DOCUMENTATION.md** - Complete API reference
- **INTEGRATION_GUIDE.md** - Detailed integration examples
- **SETUP_SUMMARY.md** - Full system overview
- **This file** - Quick reference

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Connection refused | Start server: `node index.js` |
| Token expired | Login again with credentials |
| CORS error | Check API URL in .env.local |
| Event not found | Verify event ID exists |
| No events showing | Events must be approved first |

---

## 📞 Server URLs

- **API Base**: `http://localhost:5000/api`
- **Students**: `http://localhost:5000/api/students`
- **Faculty**: `http://localhost:5000/api/faculty`
- **Events**: `http://localhost:5000/api/events`

---

**Last Updated**: November 11, 2025  
**Status**: ✅ All Systems Operational
