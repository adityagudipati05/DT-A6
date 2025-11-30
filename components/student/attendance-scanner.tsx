"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface AttendanceScannerProps {
  eventId: string
}

export default function AttendanceScanner({ eventId }: AttendanceScannerProps) {
  const [qrInput, setQrInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error" | "already_marked"
    text: string
    studentName?: string
    admissionNo?: string
  } | null>(null)

  const handleScanQR = async () => {
    if (!qrInput.trim()) {
      setMessage({
        type: "error",
        text: "Please enter a QR code data or scan a QR code",
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/events/mark-attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            qrData: qrInput,
            eventId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.message || "Failed to mark attendance",
        })
        return
      }

      if (data.status === "already_marked") {
        setMessage({
          type: "already_marked",
          text: `Already marked for ${data.student?.name || "this participant"}`,
          studentName: data.student?.name,
          admissionNo: data.student?.admissionNo,
        })
      } else if (data.status === "marked") {
        setMessage({
          type: "success",
          text: `Attendance marked for ${data.student?.name || "participant"}`,
          studentName: data.student?.name,
          admissionNo: data.student?.admissionNo,
        })
      }

      // Clear input for next scan
      setQrInput("")
    } catch (error) {
      console.error("Error marking attendance:", error)
      setMessage({
        type: "error",
        text: "Error: Unable to connect to server",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleScanQR()
    }
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">Mark Attendance</CardTitle>
        <CardDescription className="text-gray-600">
          Scan participant QR codes to mark attendance at your event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert
            className={`border-2 ${
              message.type === "success"
                ? "border-green-300 bg-green-50"
                : message.type === "already_marked"
                  ? "border-yellow-300 bg-yellow-50"
                  : "border-red-300 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {message.type === "success" && (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              )}
              {message.type === "already_marked" && (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              )}
              {message.type === "error" && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
              <div>
                <AlertDescription
                  className={`text-sm font-medium ${
                    message.type === "success"
                      ? "text-green-800"
                      : message.type === "already_marked"
                        ? "text-yellow-800"
                        : "text-red-800"
                  }`}
                >
                  {message.text}
                </AlertDescription>
                {message.studentName && (
                  <div className="text-xs text-gray-600 mt-1">
                    {message.studentName}
                    {message.admissionNo && ` (${message.admissionNo})`}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code Data
            </label>
            <Input
              type="text"
              placeholder="Paste or scan QR code here"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              The QR input field will auto-focus. Scan QR codes here to mark attendance.
            </p>
          </div>

          <Button
            onClick={handleScanQR}
            disabled={loading || !qrInput.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
          >
            {loading ? "Marking..." : "Mark Attendance"}
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Participants should present their QR codes from "My Event Passes"</li>
            <li>✓ Scan or paste the QR code data in the input field above</li>
            <li>✓ Click "Mark Attendance" or press Enter to mark attendance</li>
            <li>✓ The system will show "Already marked" if participant was already scanned</li>
            <li>✓ Input clears automatically after each scan for continuous scanning</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
