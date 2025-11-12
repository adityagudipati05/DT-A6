"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { getAllEvents, updateEventApproval } from "@/lib/apiClient"

export default function HostedEventsApproval() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  useEffect(() => {
    fetchEvents()
    // Refresh events every 3 seconds to keep data fresh
    const interval = setInterval(fetchEvents, 3000)
    return () => clearInterval(interval)
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await getAllEvents()
      if (res.success && res.data) {
        setEvents(res.data)
      }
    } catch (err) {
      console.error("Error fetching events:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (eventId: string, status: "Approved" | "Rejected") => {
    try {
      setActionInProgress(eventId)
      const res = await updateEventApproval(eventId, status)
      
      if (res.success) {
        setMessage({
          type: "success",
          text: `Event ${status === "Approved" ? "approved" : "rejected"} successfully!`,
        })
        // Update the event in the list
        setEvents((prev) =>
          prev.map((ev) =>
            ev._id === eventId
              ? { ...ev, approvalStatus: status }
              : ev
          )
        )
        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({
          type: "error",
          text: res.error || "Failed to update event approval",
        })
      }
    } catch (err) {
      console.error("Error updating approval:", err)
      setMessage({
        type: "error",
        text: "Error updating event approval",
      })
    } finally {
      setActionInProgress(null)
    }
  }

  const pendingEvents = events.filter((ev) => ev.approvalStatus === "Pending")
  const approvedEvents = events.filter((ev) => ev.approvalStatus === "Approved")
  const rejectedEvents = events.filter((ev) => ev.approvalStatus === "Rejected")

  return (
    <div className="space-y-6">
      {message && (
        <Alert
          className={`border-2 ${
            message.type === "success"
              ? "border-green-300 bg-green-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <AlertDescription
            className={`text-sm font-medium ${
              message.type === "success"
                ? "text-green-800"
                : "text-red-800"
            }`}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Events */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="bg-yellow-50 border-b border-yellow-200">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Pending Events ({pendingEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading events...</p>
          ) : pendingEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No pending events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((event) => (
                <div
                  key={event._id}
                  className="p-4 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {event.title || "Untitled Event"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Host</p>
                      <p className="font-medium text-gray-900">
                        {event.hostId?.name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">
                        {event.location || "TBD"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Category</p>
                      <p className="font-medium text-gray-900">
                        {event.category || "General"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-yellow-200">
                    <Button
                      onClick={() => handleApproval(event._id, "Approved")}
                      disabled={actionInProgress === event._id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {actionInProgress === event._id ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      onClick={() => handleApproval(event._id, "Rejected")}
                      disabled={actionInProgress === event._id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {actionInProgress === event._id ? "Rejecting..." : "Reject"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Events */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="bg-green-50 border-b border-green-200">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Approved Events ({approvedEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {approvedEvents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No approved events yet
            </p>
          ) : (
            <div className="space-y-3">
              {approvedEvents.map((event) => (
                <div
                  key={event._id}
                  className="p-3 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {event.title || "Untitled Event"}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Host: {event.hostId?.name || "Unknown"} | {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-block px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded">
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected Events */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Rejected Events ({rejectedEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {rejectedEvents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No rejected events
            </p>
          ) : (
            <div className="space-y-3">
              {rejectedEvents.map((event) => (
                <div
                  key={event._id}
                  className="p-3 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {event.title || "Untitled Event"}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Host: {event.hostId?.name || "Unknown"} | {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                      Rejected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
