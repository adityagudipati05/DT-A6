"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import StudentHeader from "@/components/student/student-header"
import EventPassDetails from "@/components/student/event-pass-details"
import { useAuth } from "@/components/auth-context"
import { getMyEventPasses } from "@/lib/apiClient"

export default function EventPassPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [passes, setPasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const fetchPasses = async () => {
      try {
        const response = await getMyEventPasses()
        if (response.success) {
          setPasses(response.data)
        } else {
          setError(response.error || "Failed to fetch event passes")
        }
      } catch (err) {
        setError("An error occurred while fetching event passes")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPasses()
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <StudentHeader onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={() => router.back()} variant="ghost" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Event Passes</h1>
          <p className="text-gray-600">View your event passes and attendance records</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : passes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">You haven't registered for any events yet</p>
            <Button
              onClick={() => router.push("/student/participate-event")}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {passes.map((pass: any) => (
              <EventPassDetails key={pass._id} pass={pass} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
