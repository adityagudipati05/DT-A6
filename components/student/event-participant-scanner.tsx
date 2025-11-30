"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, StopCircle, CheckCircle2, AlertCircle, Loader2, X, AlertTriangle, Upload } from "lucide-react"

interface AttendanceRecord {
  studentId: string
  studentName: string
  admissionNo: string
  scanType: "entry" | "exit"
  attendancePercentage: number
  timestamp: string
}

interface EventParticipantScannerProps {
  eventId: string
  eventTitle: string
  onScanComplete?: () => void
  onClose?: () => void
}

export default function EventParticipantScanner({
  eventId,
  eventTitle,
  onScanComplete,
  onClose,
}: EventParticipantScannerProps) {
  console.log("[EventParticipantScanner] RENDERING with eventId:", eventId, "eventTitle:", eventTitle)
  
  const [cameraActive, setCameraActive] = useState(false)
  const [manualQR, setManualQR] = useState("")
  const [scanning, setScanning] = useState(false)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [participants, setParticipants] = useState<any[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [stats, setStats] = useState({ total: 0, present: 0, entry: 0, absent: 0 })
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt")
  const [requestingPermission, setRequestingPermission] = useState(false)
  const qrScannerRef = useRef<any>(null)
  const lastScanRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scannerDivId = "qr_scanner_participant"

  // Fetch participants when component mounts
  useEffect(() => {
    console.log("[EventParticipantScanner] Component mounted with eventId:", eventId)
    if (eventId) {
      console.log("[EventParticipantScanner] Calling fetchParticipants...")
      fetchParticipants()
    }
  }, [eventId])

  const fetchParticipants = async () => {
    try {
      setLoadingParticipants(true)
      const token = localStorage.getItem("token")
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/events/${eventId}/participants-list`
      console.log("[fetchParticipants] Fetching from:", apiUrl)
      
      const res = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log("[fetchParticipants] Response status:", res.status)
      const data = await res.json()
      console.log("[fetchParticipants] Response data:", data)
      
      if (data.participants) {
        console.log("[fetchParticipants] Found", data.participants.length, "participants")
        setParticipants(data.participants)
      } else {
        console.warn("[fetchParticipants] No participants in response")
        setParticipants([])
      }
    } catch (err) {
      console.error("[fetchParticipants] Error:", err)
      setError(`Failed to load participants: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoadingParticipants(false)
    }
  }

  // Check camera permission status on mount
  useEffect(() => {
    checkCameraPermission()
  }, [])

  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: "camera" })
        setPermissionStatus(permission.state)
      }
    } catch (err) {
      console.log("Permission check not available")
    }
  }

  const requestCameraPermission = async () => {
    try {
      setRequestingPermission(true)
      setError("")
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      
      setPermissionStatus("granted")
      await checkCameraPermission()
      
      // Start camera after permission granted
      setCameraActive(true)
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setPermissionStatus("denied")
        setError("Camera permission denied. Please allow camera access in your browser settings to scan QR codes.")
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No camera found on this device.")
      } else {
        setError("Unable to access camera. Please check your browser permissions.")
      }
    } finally {
      setRequestingPermission(false)
    }
  }

  useEffect(() => {
    if (cameraActive) {
      initCamera()
    }
    return () => stopCamera()
  }, [cameraActive])

  const initCamera = async () => {
    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode")

      // Clear any existing scanner
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.clear()
        } catch {}
      }

      const scanner = new Html5QrcodeScanner(
        scannerDivId,
        { 
          fps: 30,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        false
      )

      scanner.render(
        (code) => {
          console.log("[Scanner] ✅ QR code detected:", code)
          console.log("[Scanner] QR length:", code.length)
          console.log("[Scanner] QR first 50 chars:", code.substring(0, 50))
          handleQRCode(code)
        },
        (err) => {
          // Ignore scan errors - they're expected when no QR in view
          if (err && !err.includes("NotFoundException")) {
            console.log("[Scanner] Scan error:", err)
          }
        }
      )

      qrScannerRef.current = scanner
      setError("")
    } catch (err) {
      console.error("[Scanner] Initialization error:", err)
      setError("Camera initialization failed. Use manual entry.")
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
    const timeSinceLastScan = now - lastScanRef.current

    console.log("[handleQRCode] 📱 QR detected!")
    console.log("[handleQRCode] QR data:", qrData)
    console.log("[handleQRCode] QR length:", qrData.length)
    console.log("[handleQRCode] Time since last scan:", timeSinceLastScan, "ms")

    // Prevent duplicate scans within 2 seconds
    if (timeSinceLastScan < 2000) {
      console.log("[handleQRCode] ⏱ Ignoring duplicate scan (too soon)")
      return
    }

    // Prevent scanning while already processing
    if (scanning) {
      console.log("[handleQRCode] ⏳ Ignoring - already scanning")
      return
    }

    lastScanRef.current = now
    console.log("[handleQRCode] ✅ Processing QR code")
    await processQR(qrData)
  }

  const processQR = async (qrData: string) => {
    try {
      setScanning(true)
      setError("")
      setSuccess("")

      console.log("[processQR] 🔄 Processing QR data:", qrData)
      console.log("[processQR] QR data is", qrData.length, "characters long")

      const token = localStorage.getItem("authToken") || localStorage.getItem("token")
      if (!token) {
        console.error("[processQR] ❌ No token found")
        setError("Authentication required. Please log in again.")
        setScanning(false)
        return
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/events/mark-attendance`
      console.log("[processQR] 📡 Sending to:", apiUrl)
      console.log("[processQR] Payload:", { qrData: qrData.substring(0, 50) + "...", eventId })

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qrData,
          eventId,
        }),
      })

      console.log("[processQR] 📩 Response status:", res.status)
      console.log("[processQR] 📩 Response headers:", res.headers)

      const data = await res.json()
      console.log("[processQR] 📋 Raw response data:", data)

      if (!res.ok) {
        console.error("[processQR] ❌ API error response:", data)
        const errorMsg = data?.message || data?.error || `API Error: ${res.status}`
        const errorDetail = data?.error ? `(${data.error})` : data?.detail ? `(${data.detail})` : ""
        throw new Error(`${errorMsg} ${errorDetail}`)
      }

      console.log("[processQR] ✅ Response data:", data)
      console.log("[processQR] Response student data:", data.student)
      console.log("[processQR] Response status:", data.status)
      console.log("[processQR] Response attendance:", data.attendance)

      const record: AttendanceRecord = {
        studentId: data.student?.studentId || "Unknown",
        studentName: data.student?.name || "Unknown",
        admissionNo: data.student?.admissionNo || "N/A",
        scanType: data.status === "entry" ? "entry" : "exit",
        attendancePercentage: data.attendance || 0,
        timestamp: new Date().toLocaleTimeString(),
      }

      console.log("[processQR] 📝 Created record:", record)

      setRecords((prev) => [record, ...prev])
      setSuccess(
        `✓ ${record.studentName} - ${record.scanType === "entry" ? "Entry (50%)" : "Exit (100%)"}`
      )

      updateStats([record, ...records])

      // Refresh participants list to show updated entry/exit status
      console.log("[processQR] 🔄 Refreshing participants list to show updated status")
      await fetchParticipants()
      console.log("[processQR] ✅ Participants list refreshed")

      if (onScanComplete) {
        setTimeout(() => onScanComplete(), 500)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
      setTimeout(() => setScanning(false), 1500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error scanning"
      console.error("[processQR] ❌ Error:", errorMsg)
      setError(errorMsg)
      setScanning(false)
    }
  }

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedData = manualQR.trim()
    
    if (!trimmedData) {
      setError("Please paste or type the QR code data")
      return
    }
    
    console.log("[handleManual] 📝 Manual entry:", trimmedData.substring(0, 50))
    console.log("[handleManual] 📝 Length:", trimmedData.length)
    
    await processQR(trimmedData)
    setManualQR("")
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setScanning(true)
      setError("")
      setSuccess("")

      console.log("[handleFileUpload] 📤 Processing file:", file.name, "size:", file.size, "type:", file.type)

      // Validate file is an image
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file")
        setScanning(false)
        return
      }

      // Import html5-qrcode
      const { Html5Qrcode } = await import("html5-qrcode")

      try {
        console.log("[handleFileUpload] 📸 Starting QR scan from file using html5-qrcode...")
        
        // Create a hidden container for html5-qrcode
        const container = document.createElement("div")
        container.id = `qr_scanner_upload_${Date.now()}`
        container.style.display = "none"
        document.body.appendChild(container)
        
        // Create instance and scan
        const qrInstance = new Html5Qrcode(container.id)
        const result = await qrInstance.scanFile(file, true)
        
        console.log("[handleFileUpload] ✅ QR detected in file:", result)
        console.log("[handleFileUpload] QR result length:", result.length)
        
        await qrInstance.clear()
        document.body.removeChild(container)
        
        await processQR(result)
        
      } catch (scanErr) {
        console.error("[handleFileUpload] ❌ QR scan failed:", scanErr)
        const scanError = scanErr instanceof Error ? scanErr.message : String(scanErr)
        
        // Provide helpful alternatives
        setError(`Could not scan QR from image: ${scanError}
        
BETTER OPTIONS:
✅ Use "Manual Entry" tab - paste the QR code text directly
✅ Use "Camera Scan" tab - scan with your device camera

The QR code image might be:
• Too small or blurry
• At an angle
• Have poor lighting
• Have reflections or glare`)
        setScanning(false)
      }
    } catch (err) {
      console.error("[handleFileUpload] ❌ Error:", err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(`Failed to process image: ${errorMsg}`)
      setScanning(false)
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const updateStats = (allRecords: AttendanceRecord[]) => {
    const uniqueStudents = new Set(allRecords.map((r) => r.studentId))
    const present = allRecords.filter((r) => r.attendancePercentage === 100).length
    const entry = allRecords.filter((r) => r.scanType === "entry").length

    setStats({
      total: uniqueStudents.size,
      present,
      entry: entry - present,
      absent: uniqueStudents.size - present,
    })
  }

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <CardTitle className="text-gray-900">Scan Participant QR Codes</CardTitle>
          <CardDescription className="text-gray-600">{eventTitle}</CardDescription>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tab Navigation */}
        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="camera">Camera Scan</TabsTrigger>
            <TabsTrigger value="upload">Upload QR</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          {/* Participants Tab - APPROVAL WORKFLOW */}
          <TabsContent value="participants" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-blue-900">Approved Participants ({participants.length})</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchParticipants}
                  disabled={loadingParticipants}
                  className="text-xs"
                >
                  {loadingParticipants ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
              <p className="text-sm text-blue-800 mb-4">Approve or reject entry/exit scans for each participant. Use QR scanning tabs to generate scan data.</p>
              
              {loadingParticipants && participants.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4">No participants registered for this event yet.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {participants.map((participant: any, idx: number) => (
                    <div key={idx} className="bg-white border border-blue-200 rounded-lg p-4 space-y-3">
                      {/* Participant Header */}
                      <div className="flex justify-between items-start border-b pb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{participant.studentName}</p>
                          <p className="text-xs text-gray-600 font-mono">{participant.admissionNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">Scans: {participant.scanCount}</p>
                        </div>
                      </div>

                      {/* Entry Scan Control */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Entry Scan</label>
                          {participant.entryScanned ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                              <span>✓</span> Approved
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={participant.entryScanned ? "default" : "outline"}
                            onClick={() => {
                              const updatedParticipants = [...participants]
                              updatedParticipants[idx].entryScanned = true
                              setParticipants(updatedParticipants)
                              setSuccess(`✓ Entry approved for ${participant.admissionNo}`)
                              setTimeout(() => setSuccess(""), 2500)
                            }}
                            className={`flex-1 text-xs ${participant.entryScanned ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                          >
                            ✓ Approve Entry
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedParticipants = [...participants]
                              updatedParticipants[idx].entryScanned = false
                              setParticipants(updatedParticipants)
                              setError(`✗ Entry rejected for ${participant.admissionNo}`)
                              setTimeout(() => setError(""), 2500)
                            }}
                            className="flex-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      </div>

                      {/* Exit Scan Control */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700">Exit Scan</label>
                          {participant.exitScanned ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                              <span>✓</span> Approved
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={participant.exitScanned ? "default" : "outline"}
                            onClick={() => {
                              const updatedParticipants = [...participants]
                              updatedParticipants[idx].exitScanned = true
                              setParticipants(updatedParticipants)
                              setSuccess(`✓ Exit approved for ${participant.admissionNo}`)
                              setTimeout(() => setSuccess(""), 2500)
                            }}
                            className={`flex-1 text-xs ${participant.exitScanned ? "bg-green-600 hover:bg-green-700" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                          >
                            ✓ Approve Exit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedParticipants = [...participants]
                              updatedParticipants[idx].exitScanned = false
                              setParticipants(updatedParticipants)
                              setError(`✗ Exit rejected for ${participant.admissionNo}`)
                              setTimeout(() => setError(""), 2500)
                            }}
                            className="flex-1 text-xs border-red-300 text-red-700 hover:bg-red-50"
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      </div>

                      {/* Attendance Status */}
                      <div className="bg-gray-50 p-2 rounded text-xs text-gray-700 text-center font-semibold">
                        {participant.entryScanned && participant.exitScanned ? (
                          <span className="text-green-700">✓ Full Attendance (100%)</span>
                        ) : participant.entryScanned ? (
                          <span className="text-yellow-700">⚠ Partial Attendance (50%)</span>
                        ) : (
                          <span className="text-gray-600">○ No Attendance</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Camera Tab */}
          <TabsContent value="camera" className="space-y-4">
            {permissionStatus === "denied" && (
              <Alert className="border-red-300 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Camera permission denied. Please enable camera access in your browser settings to scan QR codes.
                  <br />
                  <span className="text-xs mt-2 block">
                    In most browsers, click the lock icon in the address bar and allow camera access.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {!cameraActive && permissionStatus !== "granted" ? (
              <Button
                onClick={requestCameraPermission}
                disabled={requestingPermission}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {requestingPermission ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting Camera Access...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Request Camera Permission
                  </>
                )}
              </Button>
            ) : !cameraActive ? (
              <Button
                onClick={() => setCameraActive(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Activate Camera
              </Button>
            ) : (
              <>
                <div id={scannerDivId} className="w-full rounded-lg overflow-hidden border border-gray-300" />
                <Button
                  onClick={() => setCameraActive(false)}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              </>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 mb-2">Upload QR Code Image</p>
              <p className="text-xs text-gray-600 mb-4">
                Take a screenshot or photo of the participant's QR code and upload it
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={scanning}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanning}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-blue-900">How to use Manual Entry:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Scan the QR code using your phone camera or QR code scanner app</li>
                <li>Copy the extracted text/code</li>
                <li>Paste it in the field below</li>
                <li>Click "Submit QR Data"</li>
              </ol>
            </div>

            <form onSubmit={handleManual} className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">QR Code Data:</label>
                <textarea
                  placeholder="Paste the QR code data here..."
                  value={manualQR}
                  onChange={(e) => setManualQR(e.target.value)}
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  {manualQR.length > 0 ? `${manualQR.trim().length} characters entered` : "Waiting for QR data..."}
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                disabled={scanning || !manualQR.trim()}
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit QR Data
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Messages */}
        {error && (
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-xs text-gray-600">Unique</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="text-xl font-bold text-green-700">{stats.present}</div>
            <div className="text-xs text-gray-600">Present</div>
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <div className="text-xl font-bold text-yellow-700">{stats.entry}</div>
            <div className="text-xs text-gray-600">Entry Only</div>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <div className="text-xl font-bold text-red-700">{stats.absent}</div>
            <div className="text-xs text-gray-600">Absent</div>
          </div>
        </div>

        {/* Records */}
        {records.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <h4 className="font-semibold text-gray-900">Recent Scans</h4>
            {records.map((record, idx) => (
              <div
                key={idx}
                className={`p-3 rounded text-sm border ${
                  record.attendancePercentage === 100
                    ? "bg-green-50 border-green-300"
                    : "bg-yellow-50 border-yellow-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{record.studentName}</p>
                    <p className="text-xs text-gray-600">{record.admissionNo}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{record.attendancePercentage}%</div>
                    <div className="text-xs text-gray-600">{record.timestamp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
