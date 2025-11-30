"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import StudentHeader from "@/components/student/student-header"
import EventParticipantScanner from "@/components/student/event-participant-scanner"
import { useAuth } from "@/components/auth-context"

interface HostedEvent {
  _id: string
  title: string
  description?: string
  date: string
  location: string
  approvalStatus: string
  facultyCoordinator?: string
  participants?: Array<{
    _id: string
    name: string
    admissionNo: string
  }>
  attendanceMarked?: Array<{
    studentId: string
    scanCount?: number
    entryTime?: string
    exitTime?: string
    attendancePercentage?: number
    markedAt?: string
  }>
}

export default function ManageEventPage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth()
  const [hostedEvents, setHostedEvents] = useState<HostedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Verify authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login")
      router.push("/")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch hosted events when authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?._id) {
      console.log("User authenticated:", user.admissionNo)
      fetchHostedEvents()
      // Don't auto-refresh - use manual refresh button to avoid page fluctuation
    }
  }, [authLoading, isAuthenticated, user?._id])

  const fetchHostedEvents = async () => {
    try {
      setLoading(true)
      setError("")
      
      const token = localStorage.getItem("authToken") || localStorage.getItem("token")
      
      if (!token) {
        console.error("No token found in localStorage")
        setError("Session expired. Please log in again.")
        router.push("/")
        return
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/events/my-events`
      console.log("[ManageEvent] Fetching from:", apiUrl)
      console.log("[ManageEvent] Token:", token.substring(0, 20) + "...")

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[ManageEvent] Response status:", response.status)

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorMessage = `API Error: ${response.status}`
        
        try {
          if (contentType?.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
            console.error("[ManageEvent] API Error:", errorData)
          } else {
            const text = await response.text()
            console.error("[ManageEvent] API Error (text):", text)
          }
        } catch (parseError) {
          console.error("[ManageEvent] Failed to parse error response:", parseError)
        }

        if (response.status === 401) {
          setError("Authentication failed. Please log in again.")
          logout()
          router.push("/")
        } else {
          setError(errorMessage)
        }
        return
      }

      const data = await response.json()
      console.log("[ManageEvent] Events data received:", data)
      setHostedEvents(Array.isArray(data.events) ? data.events : [])
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      console.error("[ManageEvent] Fetch error:", errorMsg)
      setError(`Failed to load events: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const refreshEventData = async () => {
    await fetchHostedEvents()
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Show all hosted events (Pending, Approved, or Rejected)
  const approvedEvents = hostedEvents

  return (
    <main className="min-h-screen bg-gray-50">
      <StudentHeader onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button onClick={() => router.back()} variant="ghost" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Hosted Events</h1>
              <p className="text-gray-600 mt-2">Mark attendance for your approved events</p>
            </div>
            <Button 
              onClick={refreshEventData} 
              disabled={loading}
              variant="outline"
              className="text-gray-700 hover:bg-gray-100"
            >
              🔄 Refresh
            </Button>
          </div>

          {error && (
            <Card className="border-red-300 bg-red-50 mb-6">
              <CardContent className="pt-6">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="pt-6 flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading your events...</span>
              </CardContent>
            </Card>
          ) : approvedEvents.length === 0 ? (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardContent className="pt-6 text-center py-12">
                <p className="text-gray-600">
                  You haven't hosted any events yet. Create one to get started!
                </p>
                <Button
                  onClick={() => router.push("/student/host-event")}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Host an Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Event Selection */}
              {!selectedEventId && (
                <Card className="border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Select Event</CardTitle>
                    <CardDescription className="text-gray-600">
                      Choose an event to mark attendance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {approvedEvents.map((event) => (
                        <Card
                          key={event._id}
                          className={`border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition ${
                            event.approvalStatus === "Approved" ? "" : event.approvalStatus === "Pending" ? "border-yellow-300" : "border-red-300"
                          }`}
                          onClick={() => setSelectedEventId(event._id)}
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-lg text-gray-900">{event.title}</CardTitle>
                                <CardDescription className="text-sm text-gray-600">
                                  {new Date(event.date).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                event.approvalStatus === "Approved" ? "bg-green-100 text-green-800" : 
                                event.approvalStatus === "Pending" ? "bg-yellow-100 text-yellow-800" : 
                                "bg-red-100 text-red-800"
                              }`}>
                                {event.approvalStatus}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Location:</span>
                                <span className="text-gray-900 font-medium">{event.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Participants:</span>
                                <span className="text-gray-900 font-medium">
                                  {event.participants?.length || 0} registered
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Marked:</span>
                                <span className="text-gray-900 font-medium">
                                  {event.attendanceMarked?.length || 0} attended
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Attendance Scanner */}
              {selectedEventId && (
                <>
                  <Button
                    onClick={() => setSelectedEventId(null)}
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Events
                  </Button>
                  <EventParticipantScanner 
                    eventId={selectedEventId} 
                    eventTitle={hostedEvents.find((e) => e._id === selectedEventId)?.title || "Event"}
                    onScanComplete={refreshEventData} 
                    onClose={() => setSelectedEventId(null)}
                  />

                  {/* Attendance Summary */}
                  {hostedEvents.find((e) => e._id === selectedEventId)?.attendanceMarked &&
                    hostedEvents.find((e) => e._id === selectedEventId)!.attendanceMarked!.length > 0 && (
                      <Card className="border-gray-200 bg-white shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-gray-900">Marked Attendance</CardTitle>
                          <CardDescription className="text-gray-600">
                            {hostedEvents.find((e) => e._id === selectedEventId)?.attendanceMarked?.length || 0}{" "}
                            participants have been marked
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {hostedEvents
                              .find((e) => e._id === selectedEventId)
                              ?.attendanceMarked?.map((student, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between p-3 rounded border ${
                                    student.attendancePercentage === 100
                                      ? "bg-green-50 border-green-300"
                                      : "bg-yellow-50 border-yellow-300"
                                  }`}
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">Student {student.studentId}</p>
                                    <p className="text-xs text-gray-600">
                                      {student.attendancePercentage === 100 ? "✓ Entry & Exit scanned" : "⏱ Entry scanned (waiting for exit)"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-gray-900">{student.attendancePercentage || 0}%</div>
                                    <div className="text-xs text-gray-600">
                                      {student.attendancePercentage === 100 ? "Complete" : "Partial"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
