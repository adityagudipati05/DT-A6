# Quick Testing Guide - Login & UI Integration

## Current System Status
✅ Backend: Running on port 5000
✅ Frontend: Running on port 3000
✅ Database: Connected to MongoDB Atlas
✅ All 6 students and 4 faculty seeded with real names

## Test Login Credentials

### Student Accounts (Password: `vnrvjiet`)
| Admission No | Name | Department |
|---|---|---|
| 24071A05E9 | Gattu Manaswini | CSE |
| 24071A05F0 | Gudipati Venkata Sai Aditya | CSE |
| 24071A12B9 | T Nagasaichetan | CSE |
| 24071A12C0 | Tantepudi Sreenidhi | CSE |
| 24071A04E3 | Ch Bala Sai Kusuma Rohith | CSE |
| 24071A04E4 | Chechala Yeshwanth | CSE |

### Faculty Accounts (Password: `vnrvjiet`)
| Faculty ID | Name | Department |
|---|---|---|
| 101 | V Baby | CSE |
| 102 | Mangathayaru | CSE |
| 103 | L Padma Sree | CSE |
| 104 | Ch Naveen Reddy | CSE |

## Step-by-Step Testing

### 1. Test Student Login & Real Name Display
```
1. Go to http://localhost:3000
2. Click "Student Login"
3. Enter:
   - Admission Number: 24071A05E9
   - Password: vnrvjiet
4. Click "Login"

EXPECTED RESULTS:
✓ Redirected to student dashboard
✓ Header shows "Welcome, Gattu Manaswini!"
✓ Header shows "Admission No: 24071A05E9"
✓ "Your Info" card shows:
  - Name: Gattu Manaswini
  - Admission No: 24071A05E9
  - Department: CSE
  - Semester: 4th Year
✓ Stats cards show calculated numbers (not hardcoded)
```

### 2. Test Faculty Login & Real Name Display
```
1. Go to http://localhost:3000
2. Click "Faculty Login"
3. Enter:
   - Faculty ID: 101
   - Password: vnrvjiet
4. Click "Login"

EXPECTED RESULTS:
✓ Redirected to faculty dashboard
✓ Header shows "Welcome, Prof. V Baby!"
✓ Header shows "Faculty ID: 101 | Event Management Portal"
✓ Stats cards show:
  - Total Requests: X (from database)
  - Approved: Y (from database)
  - Pending Review: Z (from database)
✓ Can see pending event requests
```

### 3. Test Different Student
```
1. Logout from current account
2. Login with different student:
   - Admission Number: 24071A05F0
   - Password: vnrvjiet

EXPECTED RESULTS:
✓ Header shows "Welcome, Gudipati Venkata Sai Aditya!"
✓ Header shows "Admission No: 24071A05F0"
✓ Different name appears (verifies dynamic loading, not cache)
```

### 4. Test Different Faculty
```
1. Logout from current account
2. Login with different faculty:
   - Faculty ID: 102
   - Password: vnrvjiet

EXPECTED RESULTS:
✓ Header shows "Welcome, Prof. Mangathayaru!"
✓ Header shows "Faculty ID: 102"
✓ Different name appears
```

### 5. Test Logout Functionality
```
1. Login as any student or faculty
2. Click the logout button (if visible) or navigate away
3. Try to access dashboard directly via URL

EXPECTED RESULTS:
✓ Redirected to login page
✓ Token cleared from localStorage
✓ Cannot access protected pages without login
```

### 6. Test Invalid Credentials
```
1. Go to http://localhost:3000
2. Click "Student Login"
3. Enter:
   - Admission Number: 99999A99Z9 (invalid)
   - Password: wrongpassword
4. Click "Login"

EXPECTED RESULTS:
✓ Error message appears
✓ Not redirected (stays on login page)
✓ Can retry with correct credentials
```

### 7. Test All 6 Students (Loop Test)
```
Test each student one by one:
- 24071A05E9: Gattu Manaswini
- 24071A05F0: Gudipati Venkata Sai Aditya
- 24071A12B9: T Nagasaichetan
- 24071A12C0: Tantepudi Sreenidhi
- 24071A04E3: Ch Bala Sai Kusuma Rohith
- 24071A04E4: Chechala Yeshwanth

For each:
✓ Verify correct name displays in header
✓ Verify correct admission number displays
✓ Verify "Your Info" card shows real data
✓ Logout and try next student
```

### 8. Test All 4 Faculty (Loop Test)
```
Test each faculty one by one:
- 101: V Baby
- 102: Mangathayaru
- 103: L Padma Sree
- 104: Ch Naveen Reddy

For each:
✓ Verify correct name displays in header
✓ Verify correct faculty ID displays
✓ Stats load from database (may vary based on events)
✓ Logout and try next faculty
```

## Common Issues & Solutions

### Issue: "Login failed. Please try again"
**Possible Causes**:
- Backend server not running on port 5000
- MongoDB connection lost
- Wrong admission number/faculty ID

**Solution**:
```bash
# Check backend is running
cd backend
npm start

# Check MongoDB connection in terminal output
# Should show: "✅ Connected successfully to MongoDB Atlas"
```

### Issue: Header shows "Welcome, Student!" instead of real name
**Possible Cause**: Auth context not properly initialized

**Solution**:
1. Check browser console for errors (F12 → Console)
2. Verify AuthProvider wraps entire app in `app/layout.tsx`
3. Refresh page (Ctrl+F5 to clear cache)

### Issue: Stats show "0" instead of real numbers
**Possible Cause**: 
- User doesn't have any events created yet (normal)
- API not returning data

**Solution**:
1. Create some test events as a student
2. Approve them as faculty
3. Stats will then show real numbers

### Issue: Can access dashboard without logging in
**Possible Cause**: Auth redirect not working

**Solution**:
1. Check if `useAuth()` hook is imported
2. Verify `useEffect` redirect logic exists
3. Clear localStorage and try again

## Files to Monitor (Developer View)

### Check these in browser DevTools (F12):

**Storage Tab → LocalStorage**:
- Look for `authToken` key
- Should contain JWT token after login
- Should be deleted after logout

**Console Tab**:
- No errors should appear
- Check for API call responses
- Watch for auth state changes

**Network Tab**:
- POST to `/api/students/login` or `/api/faculty/login`
- Response should include token and user data
- All subsequent requests should have `Authorization: Bearer <token>`

## Success Criteria Checklist

After running all tests:

- [ ] All 6 students can login with correct credentials
- [ ] All 4 faculty can login with correct credentials
- [ ] Each user's real name displays in header (not hardcoded)
- [ ] Each user's ID/admission number displays correctly
- [ ] "Your Info" card shows real student data
- [ ] Stats cards calculate from real data
- [ ] Invalid credentials show error
- [ ] Logout clears auth and redirects to login
- [ ] Can re-login after logout
- [ ] No hardcoded placeholder names remain
- [ ] Website is ready for real users

## Performance Checklist

- [ ] Login completes in <2 seconds
- [ ] Dashboard loads in <1 second
- [ ] Stats load without delay
- [ ] No unnecessary API calls (check Network tab)
- [ ] No memory leaks (stats don't repeat-fetch)
- [ ] Smooth navigation between pages

---

**Last Updated**: 2024
**Status**: ✅ Ready for Testing
**Backend**: Running ✅
**Database**: Connected ✅
**Frontend**: Running ✅
