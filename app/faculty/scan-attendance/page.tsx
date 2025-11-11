"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, QrCodeIcon, CheckCircle, XCircle, Clock, Users, Download } from "lucide-react"
import FacultyHeader from "@/components/faculty/faculty-header"

interface AttendeeRecord {
  admissionNo: string
  studentName: string
  entryTime: string | null
  exitTime: string | null
  status: "absent" | "entry" | "present"
}

interface Event {
  id: string
  name: string
  date: string
  time: string
  venue: string
}

export default function ScanAttendancePage() {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [scanInput, setScanInput] = useState("")
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([
    { admissionNo: "CSE2024101", studentName: "Alex Johnson", entryTime: null, exitTime: null, status: "absent" },
    { admissionNo: "CSE2024102", studentName: "Sarah Williams", entryTime: null, exitTime: null, status: "absent" },
    { admissionNo: "CSE2024103", studentName: "Mike Chen", entryTime: null, exitTime: null, status: "absent" },
    { admissionNo: "CSE2024104", studentName: "Emily Davis", entryTime: null, exitTime: null, status: "absent" },
    { admissionNo: "CSE2024105", studentName: "James Brown", entryTime: null, exitTime: null, status: "absent" },
  ])

  const events: Event[] = [
    {
      id: "EVT001",
      name: "Tech Conference 2025",
      date: "2025-11-15",
      time: "10:00 AM - 4:00 PM",
      venue: "Main Auditorium",
    },
    { id: "EVT002", name: "Cultural Night", date: "2025-11-16", time: "6:00 PM - 10:00 PM", venue: "Open Ground" },
  ]

  const handleLogout = () => {
    router.push("/")
  }

  const handleScan = () => {
    if (!scanInput.trim()) return

    // Parse the QR code data (expecting JSON with studentId)
    let studentId = scanInput.trim()

    try {
      const qrData = JSON.parse(scanInput)
      studentId = qrData.studentId || qrData.admissionNo
    } catch {
      // If not JSON, treat as direct admission number
      studentId = scanInput.trim()
    }

    setAttendees((prev) =>
      prev.map((attendee) => {
        if (attendee.admissionNo === studentId) {
          const now = new Date().toLocaleTimeString()

          // First scan = Entry
          if (!attendee.entryTime) {
            return {
              ...attendee,
              entryTime: now,
              status: "entry" as const,
            }
          }
          // Second scan = Exit (mark as present)
          else if (!attendee.exitTime) {
            return {
              ...attendee,
              exitTime: now,
              status: "present" as const,
            }
          }
        }
        return attendee
      }),
    )

    setScanInput("")
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
    link.download = `attendance-${selectedEvent?.id || "event"}.csv`
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
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <Card
                key={event.id}
                className="border-gray-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition"
                onClick={() => setSelectedEvent(event)}
              >
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">{event.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📅 {event.date}</p>
                    <p>🕒 {event.time}</p>
                    <p>📍 {event.venue}</p>
                  </div>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Select Event</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Event Info */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900 text-xl">{selectedEvent.name}</CardTitle>
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedEvent.date} | {selectedEvent.time}
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
                      <p className="text-xs text-gray-600">Total Students</p>
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
                      <p className="text-xs text-gray-600">Present</p>
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
                      <p className="text-xs text-gray-600">Absent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scanner */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <QrCodeIcon className="w-5 h-5" />
                  Scan QR Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    placeholder="Scan QR code or enter admission number (e.g., CSE2024101)"
                    className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  />
                  <Button onClick={handleScan} className="bg-blue-600 hover:bg-blue-700">
                    <QrCodeIcon className="w-4 h-4 mr-2" />
                    Scan
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  First scan marks entry, second scan marks exit and completes attendance
                </p>
              </CardContent>
            </Card>

            {/* Attendance Table */}
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900">Attendance Records</CardTitle>
                  <Button
                    onClick={handleExportAttendance}
                    variant="outline"
                    className="border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                        <tr key={attendee.admissionNo} className="border-b border-gray-100 hover:bg-gray-50 transition">
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
                                Present
                              </Badge>
                            )}
                            {attendee.status === "entry" && (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                <Clock className="w-3 h-3 mr-1" />
                                Entry Only
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
