"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, CheckCircle, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { useEffect, useState } from "react"
import { getPendingRequests } from "@/lib/apiClient"

export default function FacultyStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalRequests: 0,
    approved: 0,
    pending: 0,
  })

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await getPendingRequests()
      if (response.success && response.data) {
        const allRequests = response.data || []
        const pendingCount = allRequests.filter((e: any) => e.approvalStatus === "Pending").length
        const approvedCount = allRequests.filter((e: any) => e.approvalStatus === "Approved").length
        
        setStats({
          totalRequests: allRequests.length,
          approved: approvedCount,
          pending: pendingCount,
        })
      }
    } catch (error) {
      console.error("Failed to fetch statistics:", error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-gray-600 text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
