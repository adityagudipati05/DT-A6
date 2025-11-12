"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Share2, QrCode, Barcode } from "lucide-react"
import StudentHeader from "@/components/student/student-header"
import StudentStats from "@/components/student/student-stats"
import AttendanceView from "@/components/student/attendance-view"
import RequestsList from "@/components/student/requests-list"
import { useAuth } from "@/components/auth-context"

export default function StudentDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const studentName = user?.name || "Student"
  const admissionNo = user?.admissionNo || "N/A"
  const department = user?.department || "CSE"
  const semester = user?.semester || "2nd Year"

  return (
    <main className="min-h-screen bg-gray-50">
      <StudentHeader onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <StudentStats />

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Attendance & Overview
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-3 font-medium transition ${
              activeTab === "requests"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Permission Requests
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <>
              <AttendanceView />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-3">Available event options:</p>
                      <Button
                        onClick={() => router.push("/student/host-event")}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Host an Event
                      </Button>
                      <Button
                        onClick={() => router.push("/student/participate-event")}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Participate in Approved Events
                      </Button>
                      <Button
                        onClick={() => router.push("/student/manage-event")}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Barcode className="w-4 h-4 mr-2" />
                        Manage Hosted Events
                      </Button>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <Button
                        onClick={() => router.push("/student/event-pass")}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        My Event Passes
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        ℹ️ Event passes appear here after faculty approves your event participation
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-900 text-lg">Your Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name</span>
                      <span className="text-gray-900 font-medium">{studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admission No</span>
                      <span className="text-gray-900 font-medium">{admissionNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department</span>
                      <span className="text-gray-900 font-medium">{department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Semester</span>
                      <span className="text-gray-900 font-medium">{semester}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === "requests" && <RequestsList />}
        </div>
      </div>
    </main>
  )
}
