# 🎯 LOCALHOST ACCESS GUIDE

## ✅ BOTH SERVERS ARE NOW RUNNING!

### Frontend Server
```
✅ Status: RUNNING
📍 Local:    http://localhost:3000
📍 Network:  http://192.168.56.1:3000
🔧 Tech:    Next.js 16.0.0
```

### Backend API Server
```
✅ Status: RUNNING
📍 URL:     http://localhost:5000
🔧 Tech:    Express.js
🗄️  DB:      MongoDB Atlas Connected
```

---

## 🌐 HOW TO OPEN IN BROWSER

### Option 1: Click the Link
**http://localhost:3000**

### Option 2: Manual Entry
1. Open your browser (Chrome, Firefox, Edge, Safari)
2. Type in address bar: `localhost:3000`
3. Press Enter

### Option 3: Network Access
If accessing from another device on the same network:
```
http://192.168.56.1:3000
```

---

## 📋 WHAT YOU'LL SEE

When you open http://localhost:3000, you'll see:

### Login Page
```
Event Management Portal
├─ Student Login (Admission No + Password)
├─ Faculty Login (Faculty ID + Password)
└─ Forgot Password option
```

### Use These Credentials:

**Student Account:**
```
Admission No: 24071A04E3
Password:     vnrvjiet
```

**Faculty Account:**
```
Faculty ID: 101
Password:   vnrvjiet
```

---

## ✨ TEST THE FEATURES AFTER LOGIN

### As a Student:
1. ✅ Dashboard - View stats
2. ✅ Participate in Events - See approved events dropdown
3. ✅ Submit participation request - Upload file
4. ✅ My Event Passes - View QR codes
5. ✅ Permission Requests - Track status

### As Faculty:
1. ✅ Dashboard - View request statistics
2. ✅ Pending Requests - Review and approve/reject
3. ✅ Approved Events - See accepted events
4. ✅ Scan Attendance - Use QR code scanner
5. ✅ Event Statistics - View analytics

---

## 🔧 TROUBLESHOOTING

### If localhost:3000 doesn't open:

**Problem: Cannot connect to localhost:3000**
```
✓ Check: Frontend server is running (Terminal shows "Ready in...")
✓ Try: Refresh browser (Ctrl+R or Cmd+R)
✓ Try: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
✓ Try: Clear browser cache
✓ Try: Use http:// (not https://)
```

**Problem: API calls failing**
```
✓ Check: Backend server running on port 5000
✓ Check: MongoDB Atlas is connected
✓ Try: Restart backend (node index.js)
✓ Check: .env file has MONGO_URI
```

**Problem: File upload not working**
```
✓ Check: Backend is running
✓ Check: File is PDF/JPG/PNG (< 5MB)
✓ Try: Clear browser cache and refresh
```

---

## 📊 QUICK STATUS CHECK

Run this to verify everything:

```powershell
# Check if ports are listening
netstat -ano | findstr "3000\|5000"

# Output should show:
# TCP    127.0.0.1:3000    LISTENING
# TCP    127.0.0.1:5000    LISTENING
```

---

## 🎮 QUICK START (5 MINUTES)

```
1. Open http://localhost:3000 in browser
   ↓
2. Click "Student Login"
   ↓
3. Enter: Admission No = 24071A04E3
           Password = vnrvjiet
   ↓
4. Click Login
   ↓
5. You're in! Explore the dashboard
   ↓
6. Click "Participate in Approved Events"
   ↓
7. See the dropdown with real approved events ✅
```

---

## 🎊 YOU'RE ALL SET!

**Both servers are running and ready!**

Just open: **http://localhost:3000**

If you see the login page, everything is working perfectly! 🎉
