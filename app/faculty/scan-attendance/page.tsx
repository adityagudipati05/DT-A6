"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, QrCodeIcon, CheckCircle, XCircle, Clock, Users, Download, Loader2, AlertCircle } from "lucide-react"
import FacultyHeader from "@/components/faculty/faculty-header"
import FacultyEventScanner from "@/components/faculty/faculty-event-scanner"

interface AttendeeRecord {
  _id?: string
  studentId: string
  studentName: string
  admissionNo: string
  entryTime: string | null
  exitTime: string | null
  scanCount: number
  status: "absent" | "entry" | "present"
}

interface HostedEvent {
  _id: string
  title: string
  date: string
  location: string
  attendanceMarked?: Array<{
    studentId: string
    scanCount?: number
    entryTime?: string
    exitTime?: string
    attendancePercentage?: number
  }>
}

export default function ScanAttendancePage() {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<HostedEvent | null>(null)
  const [events, setEvents] = useState<HostedEvent[]>([])
  const [scanInput, setScanInput] = useState("")
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchHostedEvents()
  }, [])

  const fetchHostedEvents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/events/my-approved-events`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error("Failed to fetch events")

      const data = await response.json()
      const approvedEvents = (data.events || []).filter((e: any) => e.approvalStatus === "Approved")
      setEvents(approvedEvents)
    } catch (err) {
      setError("Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: HostedEvent) => {
    setSelectedEvent(event)
    setAttendees(
      (event.attendanceMarked || []).map((att: any) => ({
        _id: att.studentId,
        studentId: att.studentId,
        studentName: "", // Will be filled from scan response
        admissionNo: "",
        entryTime: att.entryTime ? new Date(att.entryTime).toLocaleTimeString() : null,
        exitTime: att.exitTime ? new Date(att.exitTime).toLocaleTimeString() : null,
        scanCount: att.scanCount || 0,
        status: att.attendancePercentage === 100 ? "present" : att.scanCount === 1 ? "entry" : "absent",
      }))
    )
    setError("")
    setMessage("")
  }

  const handleLogout = () => {
    router.push("/")
  }

  const handleScan = async () => {
    if (!scanInput.trim() || !selectedEvent) return

    try {
      setScanning(true)
      setError("")
      setMessage("")

      const token = localStorage.getItem("token")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/events/scan-qr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            passId: scanInput.trim(),
            eventId: selectedEvent._id,
          }),
        }
      )

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || "Scan failed")
      }

      const data = await response.json()

      // Update or add attendee record
      setAttendees((prev) => {
        const existing = prev.find((a) => a.studentId === data.studentId)

        if (existing) {
          return prev.map((a) =>
            a.studentId === data.studentId
              ? {
                  ...a,
                  studentName: data.studentName,
                  admissionNo: data.studentAdmissionNo,
                  entryTime:
                    data.scanType === "entry" ? new Date().toLocaleTimeString() : a.entryTime,
                  exitTime:
                    data.scanType === "exit" ? new Date().toLocaleTimeString() : a.exitTime,
                  scanCount: data.scanType === "entry" ? 1 : 2,
                  status: data.scanType === "exit" ? "present" : "entry",
                }
              : a
          )
        }

        return [
          ...prev,
          {
            studentId: data.studentId,
            studentName: data.studentName,
            admissionNo: data.studentAdmissionNo,
            entryTime: data.scanType === "entry" ? new Date().toLocaleTimeString() : null,
            exitTime: data.scanType === "exit" ? new Date().toLocaleTimeString() : null,
            scanCount: data.scanType === "entry" ? 1 : 2,
            status: data.scanType === "exit" ? "present" : "entry",
          },
        ]
      })

      setMessage(
        `✓ ${data.studentName} - ${data.scanType === "entry" ? "Entry Marked (50%)" : "Exit Marked (100%)"}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan error")
    } finally {
      setScanInput("")
      setScanning(false)
    }
  }

  const stats = {
    total: attendees.length,
    present: attendees.filter((a) => a.status === "present").length,
    entry: attendees.filter((a) => a.status === "entry").length,
    absent: attendees.filter((a) => a.status === "absent").length,
  }

  const handleExportAttendance = () => {
    const csvContent = [
      ["Admission No", "Student Name", "Entry Time", "Exit Time", "Status"],
      ...attendees.map((a) => [
        a.admissionNo,
        a.studentName,
        a.entryTime || "N/A",
        a.exitTime || "N/A",
        a.status.toUpperCase(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `attendance-${selectedEvent?._id || "event"}.csv`
    link.click()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <FacultyHeader onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={() => router.back()} variant="ghost" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Event Attendance</h1>
          <p className="text-gray-600">Scan student QR codes to track entry and exit times</p>
        </div>

        {!selectedEvent ? (
          <div className="space-y-6">
            {loading ? (
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardContent className="pt-6 flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading your events...</span>
                </CardContent>
              </Card>
            ) : events.length === 0 ? (
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-gray-600">You don't have any approved events.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <Card
                    key={event._id}
                    className="border-gray-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition"
                    onClick={() => handleSelectEvent(event)}
                  >
                    <CardHeader>
                      <CardTitle className="text-gray-900 text-lg">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                        <p>📍 {event.location}</p>
                      </div>
                      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Select Event</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Event Info */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 text-xl">{selectedEvent.title}</CardTitle>
                    <p className="text-gray-600 text-sm mt-1">
                      {new Date(selectedEvent.date).toLocaleDateString()} | {selectedEvent.location}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedEvent(null)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Change Event
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-xs text-gray-600">Total Scanned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                      <p className="text-xs text-gray-600">Complete (Entry + Exit)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.entry}</p>
                      <p className="text-xs text-gray-600">Entry Only</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                      <p className="text-xs text-gray-600">Not Scanned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages */}
            {error && (
              <Card className="border-red-300 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-800">{error}</p>
                </CardContent>
              </Card>
            )}

            {message && (
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <p className="text-green-800">{message}</p>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Scanner with Camera Support */}
            <FacultyEventScanner eventId={selectedEvent._id} onScanComplete={fetchHostedEvents} />

            {/* Attendance Table */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900">Attendance Records</CardTitle>
                  {attendees.length > 0 && (
                    <Button
                      onClick={handleExportAttendance}
                      variant="outline"
                      className="border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No scans yet. Start scanning QR codes.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Admission No</th>
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Student Name</th>
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Entry Time</th>
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Exit Time</th>
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendees.map((attendee) => (
                          <tr
                            key={attendee.studentId}
                            className="border-b border-gray-100 hover:bg-gray-50 transition"
                          >
                            <td className="py-3 px-4 text-gray-900 font-mono text-sm">{attendee.admissionNo}</td>
                            <td className="py-3 px-4 text-gray-900">{attendee.studentName}</td>
                            <td className="py-3 px-4 text-gray-700 text-sm">
                              {attendee.entryTime || <span className="text-gray-400">—</span>}
                            </td>
                            <td className="py-3 px-4 text-gray-700 text-sm">
                              {attendee.exitTime || <span className="text-gray-400">—</span>}
                            </td>
                            <td className="py-3 px-4">
                              {attendee.status === "present" && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Present (100%)
                                </Badge>
                              )}
                              {attendee.status === "entry" && (
                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Entry Only (50%)
                                </Badge>
                              )}
                              {attendee.status === "absent" && (
                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Absent
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
