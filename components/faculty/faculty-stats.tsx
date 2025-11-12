"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, CheckCircle, Clock, XCircle } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { useEffect, useState } from "react"
import { getRequestsStats } from "@/lib/apiClient"

export default function FacultyStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalRequests: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
      // Auto-refresh stats every 2 seconds
      const interval = setInterval(fetchStats, 2000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await getRequestsStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading stats...</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRequests}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
