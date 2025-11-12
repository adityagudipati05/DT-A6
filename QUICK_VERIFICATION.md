# Quick Verification Guide - 5 Minute Test

## Application Status
- ✅ Development Server: Running on http://localhost:3000
- ✅ Build: Successful (no errors)
- ✅ All fixes deployed and ready

---

## Test Case 1: View Approved Events (2 min)

### What to Test:
Student should see faculty-approved events in the participation form dropdown

### Steps:
1. Open http://localhost:3000
2. Click "Student Login" (if not already logged in)
3. Enter credentials:
   - Admission No: `24071A04E3`
   - Password: `vnrvjiet`
4. Click "Participate in Approved Events" button
5. Click the "Event Name" dropdown

### Expected Result:
✅ Dropdown shows events like:
- "National Seminar (11/10/2025)"
- "Technical Fest (12/1/2025)"
- "Workshop - Web Development (11/20/2025)"
- "Annual Sports Meet (11/25/2025)"

❌ NOT showing hardcoded placeholder values

---

## Test Case 2: Submit Participation Request (2 min)

### What to Test:
Student can successfully submit event participation request with file upload

### Steps:
1. From the "Participate in Approved Events" form
2. Fill in all fields:
   - Roll Number: `24071A04E3` (auto-populated)
   - Student Name: `Your Name`
   - Year: `2nd Year`
   - Branch: `Computer Science`
   - Section: `C`
   - Event Name: Select any event from dropdown
   - Request To: Select any faculty member
   - Proof: Upload a PDF, JPG, or PNG file (< 5MB)
3. Click "Submit Participation Request" button

### Expected Result:
✅ See alert: "Request submitted successfully"
✅ Automatically redirected to Student Dashboard
✅ No error messages

❌ Form should NOT show validation errors if all fields filled

---

## Test Case 3: Faculty Header Navigation (1 min)

### What to Test:
Faculty page header shows proper navigation menu

### Steps:

#### Desktop View (browser width > 768px):
1. Open http://localhost:3000
3. Click "Faculty Login"
4. Enter credentials:
   - Faculty ID: `101`
   - Password: `vnrvjiet`
4. View the top header

#### Mobile View (browser width < 768px):
1. Resize browser window to < 768px width, OR
2. Open DevTools (F12) > click device toolbar icon
3. Select "iPhone" or "Mobile" device
4. Refresh page
5. View the header

### Expected Result - Desktop:
✅ Header shows:
- VNR Logo (left side)
- "Welcome, Prof. [Name]!" title
- "Faculty ID: [ID] | Event Management Portal" subtitle
- **Dashboard** button with Home icon
- **Scan Attendance** button with QR icon
- Bell icon, User icon
- **Logout** button

### Expected Result - Mobile:
✅ Header shows:
- VNR Logo (left side)
- "Welcome, Prof. [Name]!" title
- Hamburger menu icon (≡) on right
- Bell icon, User icon
- **Logout** button
- ✅ Click hamburger icon - expands to show:
  - Dashboard option
  - Scan Attendance option
- ✅ Clicking any option closes menu and navigates

---

## Test Case 4: File Upload Validation (Optional)

### What to Test:
File upload validation works correctly

### Steps:
1. Go to "Participate in Approved Events" form
2. Try uploading:
   - Valid file: PDF/JPG/PNG < 5MB ✅ Should work
   - Invalid file: DOC/DOCX/TXT ❌ Should show error
   - Large file: > 5MB ❌ Should show error

### Expected Result:
✅ Only PNG, JPG, PDF files accepted
✅ File size limited to 5MB
✅ Error message for invalid files

---

## If Something Doesn't Work

### Event list is empty:
- Check if events are approved in database
- Backend API: GET /api/events/approved should return events
- Run: `node seed.js` to seed test data

### Form submission fails:
- Check browser console (F12) for errors
- Verify faculty member is selected
- Ensure proof file is uploaded
- Check Network tab for API errors

### Header buttons don't work:
- Verify you're on faculty dashboard page
- Check browser console for routing errors
- Try hard refresh (Ctrl+Shift+R)

### Mobile menu not appearing:
- Ensure browser is < 768px wide
- Try DevTools device emulation
- Check CSS media queries are working

---

## Files Changed Summary

```
✅ components/student/participate-event-form.tsx
   - Added dynamic event fetching
   - Added event loading state

✅ routes/eventRoutes.js
   - Added multer middleware to /participate route
   - Import statement added

✅ components/faculty/faculty-header.tsx
   - Added desktop navigation menu
   - Added mobile hamburger menu
   - Added state management for menu toggle
   - Added responsive breakpoints
```

---

## Need Help?

Check the detailed guide: `FIXES_SUMMARY.md`

All fixes are documented with:
- Root causes explained
- Implementation details
- How to verify each fix
- Testing checklist
- Future improvement suggestions

---

**Status: ✅ READY FOR PRODUCTION TESTING**

Test now at: http://localhost:3000
