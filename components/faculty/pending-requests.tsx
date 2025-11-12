"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { getPendingRequests, respondPermissionRequest } from "@/lib/apiClient"

export default function PendingRequests() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
    // Auto-refresh every 2 seconds to keep data fresh
    const interval = setInterval(fetchRequests, 2000)
    return () => clearInterval(interval)
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await getPendingRequests()
      if (res.success) setRequests(res.data || [])
    } catch (err) {
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, status: "Approved" | "Rejected") => {
    try {
      setActionInProgress(id)
      const res = await respondPermissionRequest(id, status)
      if (res.success) {
        // Remove the request from the list immediately
        setRequests((prev) => prev.filter((r) => r._id !== id))
        alert(`Request ${status.toLowerCase()} successfully!`)
        // Refetch all requests to sync with backend
        setTimeout(() => {
          fetchRequests()
        }, 500)
      } else {
        alert(res.error || "Failed to update request")
      }
    } catch (err) {
      console.error("Error responding to request:", err)
      alert("Error responding to request")
    } finally {
      setActionInProgress(null)
    }
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Pending Permission Requests ({requests.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No pending requests</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Student</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Event</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-gray-900 font-medium">{request.studentId?.name || "Student"}</p>
                        <p className="text-gray-600 text-xs">{request.studentId?.admissionNo || "-"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-900">{request.eventId?.title || "Event"}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(request._id, "Approved")}
                          disabled={actionInProgress === request._id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {actionInProgress === request._id ? "..." : "Approve"}
                        </Button>
                        <Button
                          onClick={() => handleAction(request._id, "Rejected")}
                          disabled={actionInProgress === request._id}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {actionInProgress === request._id ? "..." : "Reject"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
