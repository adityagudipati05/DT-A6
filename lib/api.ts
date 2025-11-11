// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Helper function to handle errors
const handleError = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unknown error";
};

// Store token in localStorage
export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("authToken", token);
  }
};

// Get token from localStorage
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken");
  }
  return null;
};

// Remove token from localStorage
export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authToken");
  }
};

// Get authorization header
export const getAuthHeader = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Student Login
export const studentLogin = async (admissionNo: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNo, password }),
    });

    const data = await response.json();
    if (response.ok) {
      setToken(data.token);
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Faculty Login
export const facultyLogin = async (facultyId: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facultyId, password }),
    });

    const data = await response.json();
    if (response.ok) {
      setToken(data.token);
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get Student Profile
export const getStudentProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/profile`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get Student Attendance
export const getStudentAttendance = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/attendance`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get All Events
export const getAllEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/all`, {
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get Approved Events (for participation)
export const getApprovedEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/approved`, {
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get My Hosted Events
export const getMyHostedEvents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/my-events`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Create Event
export const createEvent = async (eventData: Record<string, unknown>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/create`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Participate in Event
export const participateInEvent = async (eventId: string) => {
  try {
    // Legacy signature: participateInEvent(eventId)
    // New signature supports an object: { eventId, requestedTo, proof }
    const bodyData: any = { eventId };
    let response;

    // If `eventId` is actually an object (developer may call with object), handle it
    if (typeof (eventId as any) === "object") {
      const payload = eventId as any;
      // if there's a proof File, use FormData
      if (payload.proof instanceof File || (payload.proof && (payload.proof as any).name)) {
        const form = new FormData();
        form.append("eventId", payload.eventId);
        if (payload.requestedTo) form.append("requestedTo", payload.requestedTo);
        form.append("proof", payload.proof);

        response = await fetch(`${API_BASE_URL}/events/participate`, {
          method: "POST",
          headers: { ...getAuthHeader() },
          body: form,
        });
      } else {
        bodyData.eventId = payload.eventId;
        if (payload.requestedTo) bodyData.requestedTo = payload.requestedTo;

        response = await fetch(`${API_BASE_URL}/events/participate`, {
          method: "POST",
          headers: { ...getAuthHeader(), "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        });
      }
    } else {
      response = await fetch(`${API_BASE_URL}/events/participate`, {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
    }

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get current student's permission requests
export const getMyRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/my-requests`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get list of faculty (for dropdowns)
export const getFacultyList = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty/all`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get My Event Passes
export const getMyEventPasses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/my-passes`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Scan QR Code (Faculty)
export const scanQRCode = async (qrData: string, scanType: string = "entry") => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/scan-qr`, {
      method: "POST",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ qrData, scanType }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get Faculty Pending Requests
export const getPendingRequests = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty/pending-requests`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Approve or Reject Event
export const updateEventApproval = async (eventId: string, approvalStatus: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/faculty/approve-event`, {
      method: "PUT",
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, approvalStatus }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Get Event Attendance
export const getEventAttendance = async (eventId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/attendance`, {
      headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.message };
  } catch (error: unknown) {
    return { success: false, error: handleError(error) };
  }
};

// Logout
export const logout = () => {
  removeToken();
  return { success: true };
};
