"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import FacultyHeader from "@/components/faculty/faculty-header"
import FacultyStats from "@/components/faculty/faculty-stats"
import PendingRequests from "@/components/faculty/pending-requests"
import HostedEventsApproval from "@/components/faculty/hosted-events-approval"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"
import { useAuth } from "@/components/auth-context"

export default function FacultyDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()

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

  const handleScanAttendance = () => {
    router.push("/faculty/scan-attendance")
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <FacultyHeader onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={handleScanAttendance} className="bg-blue-600 hover:bg-blue-700 text-white">
            <QrCode className="w-4 h-4 mr-2" />
            Scan Event Attendance
          </Button>
        </div>

        <FacultyStats />
        <HostedEventsApproval />
        <PendingRequests />
      </div>
    </main>
  )
}
