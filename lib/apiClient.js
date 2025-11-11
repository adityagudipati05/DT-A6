// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Store token in localStorage
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

// Get token from localStorage
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Remove token from localStorage
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

// Get authorization header
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function for fetch with auth
const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

// Student Login
export const studentLogin = async (admissionNo, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admissionNo, password }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { success: false, error: data.message || 'Login failed' };
      } else {
        return { success: false, error: `Server error: ${response.statusText}` };
      }
    }

    const data = await response.json();
    setToken(data.token);
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return { success: false, error: errorMessage };
  }
};

// Faculty Login
export const facultyLogin = async (facultyId, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facultyId, password }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { success: false, error: data.message || 'Login failed' };
      } else {
        return { success: false, error: `Server error: ${response.statusText}` };
      }
    }

    const data = await response.json();
    setToken(data.token);
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return { success: false, error: errorMessage };
  }
};

// Get Student Profile
export const getStudentProfile = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/students/profile`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch profile' };
  }
};

// Update Student Profile
export const updateStudentProfile = async (profileData) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/students/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to update profile' };
  }
};

// Get Student Attendance
export const getStudentAttendance = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/students/attendance`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch attendance' };
  }
};

// Get All Events
export const getAllEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/all`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch events' };
  }
};

// Get Approved Events
export const getApprovedEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/approved`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch approved events' };
  }
};

// Get My Hosted Events
export const getMyHostedEvents = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/my-events`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch hosted events' };
  }
};

// Create Event
export const createEvent = async (eventData) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/create`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to create event' };
  }
};

// Participate in Event
export const participateInEvent = async (eventId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/participate`, {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to participate in event' };
  }
};

// Get My Event Passes
export const getMyEventPasses = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/my-passes`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch event passes' };
  }
};

// Scan QR Code (Faculty)
export const scanQRCode = async (qrData, scanType = "entry") => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/scan-qr`, {
      method: 'POST',
      body: JSON.stringify({ qrData, scanType }),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { success: false, error: data.message || 'Failed to scan QR code' };
      } else {
        return { success: false, error: `Server error: ${response.statusText}` };
      }
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to scan QR code';
    return { success: false, error: errorMessage };
  }
};

// Get Faculty Pending Requests
export const getPendingRequests = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/faculty/pending-requests`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch pending requests' };
  }
};

// Approve or Reject Event
export const updateEventApproval = async (eventId, approvalStatus) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/faculty/approve-event`, {
      method: 'PUT',
      body: JSON.stringify({ eventId, approvalStatus }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to update approval' };
  }
};

// Get Event Attendance
export const getEventAttendance = async (eventId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/events/${eventId}/attendance`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch attendance' };
  }
};

// Get Faculty Profile
export const getFacultyProfile = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/faculty/profile`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch faculty profile' };
  }
};

// Respond to a permission request (Approve/Reject)
export const respondPermissionRequest = async (requestId, status) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/faculty/permissions/respond`, {
      method: 'PUT',
      body: JSON.stringify({ requestId, status }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to respond to request' };
  }
};

// Get list of all faculty (simple)
export const getFacultyList = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/faculty/all`);
    const data = await response.json();
    if (response.ok) return { success: true, data };
    return { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to fetch faculties' };
  }
};

// Logout
export const logout = () => {
  removeToken();
  return { success: true };
};
