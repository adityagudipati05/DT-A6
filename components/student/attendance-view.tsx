import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, ScanLine } from "lucide-react"

interface AttendanceRecord {
  date: string
  event: string
  status: "present" | "absent"
  type: "qr" | "manual"
}

export default function AttendanceView() {
  const attendance: AttendanceRecord[] = [
    { date: "2025-11-08", event: "Technical Seminar", status: "present", type: "qr" },
    { date: "2025-11-05", event: "Annual Sports Meet", status: "present", type: "qr" },
    { date: "2025-10-28", event: "Cultural Fest", status: "absent", type: "manual" },
    { date: "2025-10-20", event: "Workshop - Web Dev", status: "present", type: "manual" },
    { date: "2025-10-15", event: "Guest Lecture", status: "present", type: "manual" },
    { date: "2025-10-08", event: "Club Meeting", status: "present", type: "manual" },
  ]

  const presentCount = attendance.filter((a) => a.status === "present").length
  const attendance_percent = Math.round((presentCount / attendance.length) * 100)

  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Event Attendance</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">{attendance_percent}%</p>
            <p className="text-gray-400 text-xs">Attendance Rate</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {attendance.map((record, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition"
            >
              <div className="flex items-center gap-3">
                {record.status === "present" ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{record.event}</p>
                    {record.type === "qr" && (
                      <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        <ScanLine className="w-3 h-3" />
                        QR
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">{record.date}</p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  record.status === "present" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {record.status === "present" ? "Present" : "Absent"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
