"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, QrCode, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react"

interface EventPass {
  _id: string
  eventId: {
    _id: string
    title: string
    date: string
    location: string
    approvalStatus: string
  }
  qrCode: string
  passStatus: string
  entryScan?: {
    scannedAt: string
    scannedBy: string
  }
  exitScan?: {
    scannedAt: string
    scannedBy: string
  }
  createdAt: string
}

interface EventPassDetailsProps {
  pass: EventPass
}

export default function EventPassDetails({ pass }: EventPassDetailsProps) {
  const [showQR, setShowQR] = useState(false)

  const isApproved = pass.eventId.approvalStatus === "Approved"
  const isPending = pass.eventId.approvalStatus === "Pending"
  const isRejected = pass.eventId.approvalStatus === "Rejected"
  
  const hasEntry = pass.entryScan?.scannedAt
  const hasExit = pass.exitScan?.scannedAt

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  // Don't render rejected passes
  if (isRejected) {
    return (
      <Card className="border-red-200 bg-red-50 opacity-75">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-gray-900 text-lg">{pass.eventId.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">📅 {formatDate(pass.eventId.date)}</p>
            </div>
            <Badge className="bg-red-100 text-red-700">Rejected</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">This event request has been rejected.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-gray-200 bg-white shadow-sm ${isApproved ? "border-green-200" : "border-yellow-200"}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-900 text-lg">{pass.eventId.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">📅 {formatDate(pass.eventId.date)}</p>
            <p className="text-sm text-gray-600">📍 {pass.eventId.location}</p>
          </div>
          <Badge
            className={
              isApproved
                ? "bg-green-100 text-green-700"
                : isPending
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
            }
          >
            {pass.eventId.approvalStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Approval Status Message */}
        {isPending && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Awaiting Faculty Approval</p>
                <p className="text-sm text-yellow-700 mt-1">
                  QR code and entry/exit scans will be available once the faculty approves this event.
                  Check your "Permission Requests" tab for the approval status.
                </p>
              </div>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-green-900">Event Approved - Attendance Tracking Active</p>
            </div>
          </div>
        )}

        {/* Attendance Scans - Only show if event is approved */}
        {isApproved && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Attendance Record</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entry Scan */}
              <div className={`p-4 rounded-lg border-2 ${hasEntry ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className={`w-5 h-5 ${hasEntry ? "text-green-600" : "text-gray-400"}`} />
                  <span className="font-semibold text-gray-900">Entry Scan</span>
                </div>
                {hasEntry ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-green-700 font-medium">✓ Scanned</p>
                    <p className="text-gray-600">Time: {pass.entryScan?.scannedAt ? formatDate(pass.entryScan.scannedAt) : "N/A"}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Waiting for entry scan...</p>
                )}
              </div>

              {/* Exit Scan */}
              <div className={`p-4 rounded-lg border-2 ${hasExit ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeft className={`w-5 h-5 ${hasExit ? "text-green-600" : "text-gray-400"}`} />
                  <span className="font-semibold text-gray-900">Exit Scan</span>
                </div>
                {hasExit ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-green-700 font-medium">✓ Scanned</p>
                    <p className="text-gray-600">Time: {pass.exitScan?.scannedAt ? formatDate(pass.exitScan.scannedAt) : "N/A"}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Waiting for exit scan...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QR Code Display - Only show for approved events */}
        {isApproved && (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900">Event Pass QR Code</h3>
            {showQR ? (
              <div className="p-4 bg-gray-50 rounded-lg flex justify-center">
                <img src={pass.qrCode} alt="Event Pass QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg flex justify-center items-center gap-2 text-gray-600">
                <QrCode className="w-5 h-5" />
                <button
                  onClick={() => setShowQR(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Click to show QR Code
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500 text-center">
              Show this QR code to faculty for entry and exit scanning at the event
            </p>
          </div>
        )}

        {/* Pass Details */}
        <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Pass Created</span>
            <span className="text-gray-900 font-medium">{formatDate(pass.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pass Status</span>
            <span className="text-gray-900 font-medium">{pass.passStatus}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
