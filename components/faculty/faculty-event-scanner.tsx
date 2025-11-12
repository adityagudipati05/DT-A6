"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, StopCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

interface ScanRecord {
  studentId: string
  name: string
  admissionNo: string
  scanType: "entry" | "exit"
  attendance: number
  timestamp: string
}

interface FacultyEventScannerProps {
  eventId: string
  onScanComplete?: () => void
}

export default function FacultyEventScanner({ eventId, onScanComplete }: FacultyEventScannerProps) {
  const [cameraActive, setCameraActive] = useState(false)
  const [manualQR, setManualQR] = useState("")
  const [scanning, setScanning] = useState(false)
  const [records, setRecords] = useState<ScanRecord[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [stats, setStats] = useState({ total: 0, present: 0, entryOnly: 0, absent: 0 })
  const qrScannerRef = useRef<any>(null)
  const lastScanRef = useRef<number>(0)
  const scannerDivId = "faculty_qr_scanner_div"

  useEffect(() => {
    if (cameraActive) {
      initCamera()
    }
    return () => stopCamera()
  }, [cameraActive])

  const initCamera = async () => {
    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode")
      
      const scanner = new Html5QrcodeScanner(
        scannerDivId,
        { fps: 10, qrbox: 250, aspectRatio: 1.0 },
        false
      )

      scanner.render(
        (code) => handleQRCode(code),
        () => {}
      )

      qrScannerRef.current = scanner
    } catch (err) {
      setError("Camera failed. Use manual entry.")
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.clear()
      } catch {}
      qrScannerRef.current = null
    }
  }

  const handleQRCode = async (qrData: string) => {
    const now = Date.now()
    if (now - lastScanRef.current < 1500 || scanning) return

    lastScanRef.current = now
    await processQR(qrData)
  }

  const processQR = async (qrData: string) => {
    try {
      setScanning(true)
      setError("")
      setSuccess("")

      const token = localStorage.getItem("token")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/events/scan-qr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ passId: qrData, eventId }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Scan failed")
      }

      const data = await res.json()
      const record: ScanRecord = {
        studentId: data.studentId,
        name: data.studentName,
        admissionNo: data.studentAdmissionNo,
        scanType: data.scanType === "entry" ? "entry" : "exit",
        attendance: data.attendancePercentage,
        timestamp: new Date().toLocaleTimeString(),
      }

      setRecords((prev) => [record, ...prev])
      setSuccess(
        `✓ ${data.studentName} - ${data.scanType === "entry" ? "Entry (50%)" : "Exit (100%)"}`
      )

      updateStats([record, ...records])
      
      // Call the callback to refresh parent component
      if (onScanComplete) {
        setTimeout(() => onScanComplete(), 500)
      }
      
      setTimeout(() => setScanning(false), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error scanning")
      setScanning(false)
    }
  }

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualQR.trim()) {
      setError("Enter QR data")
      return
    }
    await processQR(manualQR)
    setManualQR("")
  }

  const updateStats = (allRecords: ScanRecord[]) => {
    const studentMap = new Map<string, ScanRecord[]>()
    allRecords.forEach((r) => {
      if (!studentMap.has(r.studentId)) {
        studentMap.set(r.studentId, [])
      }
      studentMap.get(r.studentId)!.push(r)
    })

    let present = 0,
      entryOnly = 0
    studentMap.forEach((recs) => {
      const hasExit = recs.some((r) => r.scanType === "exit")
      const hasEntry = recs.some((r) => r.scanType === "entry")
      if (hasEntry && hasExit) present++
      else if (hasEntry) entryOnly++
    })

    setStats({
      total: studentMap.size,
      present,
      entryOnly,
      absent: 0,
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Camera className="w-5 h-5" />
            QR Code Scanner - Event Passes
          </CardTitle>
          <CardDescription className="text-gray-600">
            Scan student event pass QR codes for attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Camera</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              {!cameraActive ? (
                <Button
                  onClick={() => setCameraActive(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <Button
                  onClick={() => setCameraActive(false)}
                  variant="destructive"
                  className="w-full h-12"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              )}

              {cameraActive && (
                <div className="space-y-3">
                  <div
                    id={scannerDivId}
                    className="w-full rounded-lg overflow-hidden border border-gray-200"
                    style={{ aspectRatio: "1 / 1" }}
                  />
                  {scanning && (
                    <div className="flex items-center justify-center gap-2 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <Alert className="border-red-300 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-300 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-3">
              <form onSubmit={handleManual} className="space-y-3">
                <Input
                  value={manualQR}
                  onChange={(e) => setManualQR(e.target.value)}
                  placeholder="Paste QR code data or pass ID"
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                />
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={scanning}
                >
                  Submit
                </Button>
              </form>

              {error && (
                <Alert className="border-red-300 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-300 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <div className="text-xs text-green-700">Complete</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.entryOnly}</div>
            <div className="text-xs text-yellow-700">Entry Only</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.absent}</div>
            <div className="text-xs text-gray-700">Not Scanned</div>
          </CardContent>
        </Card>
      </div>

      {records.length > 0 && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Scan Records</CardTitle>
            <CardDescription className="text-gray-600">
              {records.length} total scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {records.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded border flex justify-between text-sm ${
                    r.scanType === "exit"
                      ? "bg-green-50 border-green-300"
                      : "bg-yellow-50 border-yellow-300"
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-600">{r.admissionNo}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{r.attendance}%</div>
                    <div className="text-xs text-gray-600">
                      {r.scanType === "exit" ? "✓ Exit" : "→ Entry"} {r.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
