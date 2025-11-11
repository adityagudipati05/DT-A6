import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle } from "lucide-react"
import { getMyRequests } from "@/lib/api"

export default function RequestsList() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await getMyRequests()
      if (!mounted) return
      if (res.success) {
        setRequests(res.data)
      }
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "Pending":
        return <Clock className="w-5 h-5 text-yellow-400" />
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500/20 text-green-300"
      case "Pending":
        return "bg-yellow-500/20 text-yellow-300"
      case "Rejected":
        return "bg-red-500/20 text-red-300"
      default:
        return "bg-gray-200 text-gray-700"
    }
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Permission Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-gray-500">No permission requests found.</p>
          ) : (
            requests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <p className="text-gray-900 font-medium">{request.eventId?.title || "Unnamed Event"}</p>
                    <p className="text-gray-600 text-xs">
                      Request to: {request.requestedTo?.name || "-"} • {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(request.status)} border-0 capitalize`}>{request.status}</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
