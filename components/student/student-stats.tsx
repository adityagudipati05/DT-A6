"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CheckCircle, Clock } from "lucide-react"
import { useAuth } from "@/components/auth-context"

export default function StudentStats() {
  const { user } = useAuth()

  // Calculate stats from user data
  const eventsAttended = user?.participatedEvents?.length || 0
  const requestsApproved = user?.hostedEvents?.filter((e: any) => e.approvalStatus === "Approved").length || 0
  const pendingApproval = user?.hostedEvents?.filter((e: any) => e.approvalStatus === "Pending").length || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Events Participated</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{eventsAttended}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Events Approved</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{requestsApproved}</p>
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
              <p className="text-gray-600 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{pendingApproval}</p>
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
