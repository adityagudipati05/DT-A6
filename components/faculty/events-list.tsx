"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllEvents } from "@/lib/apiClient"

export default function EventsList() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await getAllEvents()
      if (!mounted) return
      if (res.success) setEvents(res.data || [])
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Card className="border-gray-200 bg-white shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-gray-900">All Events</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-500">No events found.</p>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => (
              <div key={ev._id} className="p-4 border rounded-md bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-900 font-medium">{ev.title}</h3>
                    <p className="text-sm text-gray-600">{ev.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(ev.date).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{ev.approvalStatus || 'Pending'}</p>
                    <p className="text-xs text-gray-500">Host: {ev.hostId?.name || '—'}</p>
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
