# Troubleshooting Guide

## 🔧 Common Issues & Solutions

### 1. Backend Server Issues

#### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Find and kill the process using port 5000
tasklist | findstr node
taskkill /PID <process_id> /F

# Or use this to kill all node processes
taskkill /F /IM node.exe

# Then restart the server
node index.js
```

#### Issue: "Cannot find module 'express'"
**Solution:**
```bash
# Reinstall all dependencies
npm install

# If that doesn't work, clear npm cache
npm cache clean --force
npm install
```

#### Issue: "MongoDB connection timeout"
**Solution:**
1. Check internet connection
2. Verify MongoDB Atlas username/password in `.env`
3. Check if your IP is whitelisted in MongoDB Atlas:
   - Go to MongoDB Atlas → Network Access
   - Add your IP address (or 0.0.0.0 for all)
4. Verify connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```

#### Issue: Server starts but immediately crashes
**Solution:**
```bash
# Check error message
node index.js 2>&1 | head -20

# Common causes:
# 1. Missing .env file → Create .env with MONGO_URI and PORT
# 2. Wrong Node version → Run: node --version (should be 14+)
# 3. Missing dependencies → Run: npm install
```

---

### 2. Database Issues

#### Issue: "Database seeding failed"
**Solution:**
```bash
# Check MongoDB connection
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected')).catch(e => console.error('Error:', e.message))"

# Re-seed the database
node seed.js

# Check if collections exist
# In MongoDB Atlas shell:
# show collections
# db.students.count()
```

#### Issue: "Student not found" during login
**Solution:**
```bash
# Check if students were seeded
# In MongoDB Atlas or shell:
# db.students.find().pretty()

# If empty, reseed:
node seed.js

# Verify admission number matches exactly
# (case-sensitive, no spaces)
```

#### Issue: "Duplicate key error"
**Solution:**
```bash
# Clear existing data and reseed
node seed.js

# Or manually clear in MongoDB:
# db.students.deleteMany({})
# db.faculty.deleteMany({})
# db.events.deleteMany({})
# db.eventpasses.deleteMany({})
```

---

### 3. Authentication Issues

#### Issue: "Invalid or expired token"
**Solution:**
```javascript
// In browser console
localStorage.clear()  // Clear stored token
// Log in again
```

#### Issue: "Unauthorized access" for faculty endpoints
**Solution:**
```javascript
// Make sure you're using faculty login
// POST /api/faculty/login
// NOT student login

// Verify role in token
const token = localStorage.getItem('authToken')
console.log(atob(token.split('.')[1]))  // Decode JWT payload
```

#### Issue: "Access token required"
**Solution:**
Make sure to include Authorization header:
```javascript
// ✅ Correct
fetch(url, {
  headers: {
    'Authorization': 'Bearer ' + token
  }
})

// ❌ Wrong
fetch(url, {
  headers: {
    'Authorization': token  // Missing 'Bearer '
  }
})
```

---

### 4. API Request Issues

#### Issue: "CORS error" in browser console
**Solution:**
1. Verify backend is running on port 5000
2. Check `.env.local` has correct API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
3. CORS is already enabled in `index.js`, but if issues persist:
   ```javascript
   // Add to index.js if needed
   const cors = require('cors');
   app.use(cors({
     origin: '*',
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

#### Issue: "404 Not Found" on API endpoint
**Solution:**
1. Check endpoint URL is correct
2. Verify backend server is running
3. Check route files are imported in `index.js`
4. Test with curl:
   ```bash
   curl http://localhost:5000/api/events/all
   ```

#### Issue: "400 Bad Request"
**Solution:**
1. Check request body is valid JSON
2. Verify required fields are present
3. Check Content-Type header is `application/json`
4. Log the error from backend:
   ```bash
   # Terminal will show the error
   node index.js
   # Look for error message
   ```

#### Issue: "500 Internal Server Error"
**Solution:**
1. Check backend terminal for error message
2. Verify database is connected
3. Check if data exists in database
4. Add error logging:
   ```javascript
   // In controller
   catch (err) {
     console.error('Full error:', err);
     res.status(500).json({ error: err.message });
   }
   ```

---

### 5. Frontend Integration Issues

#### Issue: "Cannot import from apiClient"
**Solution:**
```javascript
// Correct path
import { studentLogin } from '@/lib/apiClient'

// Or absolute path
import { studentLogin } from '/lib/apiClient'

// Or relative
import { studentLogin } from '../lib/apiClient'
```

#### Issue: "useContext error" for authentication
**Solution:**
1. Create a context provider
2. Wrap components with provider
3. Use useContext hook
4. Example:
   ```tsx
   // lib/authContext.tsx
   import { createContext, useState } from 'react'
   
   export const AuthContext = createContext()
   
   export function AuthProvider({ children }) {
     const [user, setUser] = useState(null)
     const [token, setToken] = useState(null)
     
     return (
       <AuthContext.Provider value={{ user, setUser, token, setToken }}>
         {children}
       </AuthContext.Provider>
     )
   }
   ```

#### Issue: "QR code not displaying"
**Solution:**
```javascript
// Check if QR data exists
console.log(eventPass.qrCode)

// Should be data URL: data:image/png;base64,...
// Display correctly:
<img src={eventPass.qrCode} alt="QR Code" />

// If still not showing:
// 1. Check participation was successful
// 2. Verify response has qrCode field
// 3. Check browser console for errors
```

#### Issue: "Loading state not updating"
**Solution:**
```javascript
// Make sure to set loading state
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchData()
    .then(data => setData(data))
    .finally(() => setLoading(false))  // Always set to false
}, [])
```

---

### 6. Data Issues

#### Issue: "Events not appearing in list"
**Causes:**
- Event status is "Pending" (not yet approved)
- Event host ID doesn't match
- Database connection issue

**Solution:**
```bash
# Check event status
# In MongoDB: db.events.find().pretty()

# Approve event manually (faculty)
# Or check if faculty account has proper role
```

#### Issue: "Student participation failed"
**Causes:**
- Event is full (max participants reached)
- Student already participating
- Event not approved yet

**Solution:**
```javascript
// Check error message
const result = await participateInEvent(eventId)
console.log(result.error)  // Shows specific reason

// If "Event is full"
// Try different event

// If "Already participating"
// Can't participate twice

// If "Not approved"
// Wait for faculty approval
```

#### Issue: "Attendance not marking"
**Solution:**
1. Check QR code data is valid
2. Ensure faculty is logged in
3. Verify event exists
4. Check student is registered for event
5. Test with curl:
   ```bash
   curl -X POST http://localhost:5000/api/events/scan-qr \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d '{"qrData":"pass_id_or_qr_data"}'
   ```

---

## 🔍 Debugging Steps

### Step 1: Check Server Status
```bash
curl http://localhost:5000
# Should return: "Event Permission & Attendance API is running..."
```

### Step 2: Check Database Connection
```javascript
// In browser console
fetch('http://localhost:5000/api/events/all')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error('Error:', e))
```

### Step 3: Test Login
```bash
curl -X POST http://localhost:5000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{"admissionNo":"24071A05E9","password":"vnrvjiet"}'
```

### Step 4: Enable Detailed Logging
```javascript
// In index.js, add before routes:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// In controllers, add console.log:
console.log('Request received:', req.body)
```

### Step 5: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make API call
4. Click on request
5. Check Response tab for error details

---

## 📋 Verification Checklist

- [ ] Backend server is running (`node index.js`)
- [ ] MongoDB connection is active
- [ ] Database is seeded with data
- [ ] Can login with test credentials
- [ ] Token is stored in localStorage
- [ ] API requests include Authorization header
- [ ] Frontend .env.local has correct API URL
- [ ] No CORS errors in browser console
- [ ] No network errors in DevTools
- [ ] No JavaScript errors in console

---

## 📞 Getting Help

### Check Logs
```bash
# Backend logs (terminal running node index.js)
# Shows connection status, requests, errors

# Browser console (F12)
# Shows frontend errors, network issues

# Network tab (F12 → Network)
# Shows API requests/responses
```

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot GET /api/...` | Route not defined | Check routes in index.js |
| `Token expired` | JWT validity expired | Login again |
| `MongooseError` | Database disconnected | Check MongoDB connection |
| `CORS error` | Frontend/backend URL mismatch | Update .env.local |
| `socket hang up` | Database timeout | Check MongoDB Atlas status |
| `Module not found` | Missing npm package | Run npm install |

---

## 🚀 Recovery Procedures

### Full Reset
```bash
# 1. Stop server
taskkill /F /IM node.exe

# 2. Clear node_modules
rm -r node_modules
rm package-lock.json

# 3. Reinstall
npm install

# 4. Reseed database
node seed.js

# 5. Start server
node index.js
```

### Database Reset
```bash
# 1. Clear collections in MongoDB Atlas
# Go to Collections tab and delete all collections

# 2. Reseed
node seed.js

# Verify
curl http://localhost:5000/api/students/login
```

### Frontend Reset
```bash
# Clear all frontend data
localStorage.clear()
sessionStorage.clear()

# Refresh browser
# Reload page
```

---

## ✅ Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Server not responding | `taskkill /F /IM node.exe && node index.js` |
| Login fails | `node seed.js` to reseed database |
| Token invalid | `localStorage.clear()` in browser console |
| Events not showing | Check event status in MongoDB, should be "Approved" |
| QR code not working | Verify participateInEvent response has qrCode field |
| CORS error | Verify `NEXT_PUBLIC_API_URL` in `.env.local` |

---

Generated: November 11, 2025  
Last Updated: November 11, 2025  
Status: ✅ Troubleshooting Guide Complete
