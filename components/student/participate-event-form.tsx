"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getFacultyList, participateInEvent, getApprovedEvents } from "@/lib/api"

interface ApprovedEvent {
  _id: string
  title: string
  date: Date
  location: string
}

export default function ParticipateEventForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    rollNo: "",
    name: "",
    year: "",
    branch: "",
    section: "",
    event: "",
    proof: null as File | null,
  })

  const [faculties, setFaculties] = useState<Array<{ _id: string; name: string; facultyId?: string }>>([])
  const [selectedFaculty, setSelectedFaculty] = useState<string>("")
  const [approvedEvents, setApprovedEvents] = useState<ApprovedEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const [facultyRes, eventsRes] = await Promise.all([getFacultyList(), getApprovedEvents()])

      if (mounted) {
        if (facultyRes.success) {
          setFaculties(facultyRes.data)
        }
        if (eventsRes.success) {
          setApprovedEvents(eventsRes.data)
        }
        setLoadingEvents(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target

    if (type === "file") {
      const input = e.target as HTMLInputElement
      setFormData({
        ...formData,
        [name]: input.files?.[0] || null,
      })
    } else {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement | HTMLSelectElement).value,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.event) {
      alert("Please select an event")
      return
    }
    if (!selectedFaculty) {
      alert("Please select a faculty member to request permission from")
      return
    }
    if (!formData.proof) {
      alert("Please upload a proof document")
      return
    }

    ;(async () => {
      try {
        const payload: any = {
          eventId: formData.event,
          requestedTo: selectedFaculty,
          proof: formData.proof,
        }

        const res = await participateInEvent(payload as any)
        if (res.success) {
          alert(res.data?.message || "Request submitted successfully")
          router.push("/student/dashboard")
        } else {
          alert(res.error || "Failed to submit request")
        }
      } catch (err) {
        console.error(err)
        alert("Error submitting request: " + (err instanceof Error ? err.message : "Unknown error"))
      }
    })()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
          <input
            type="text"
            name="rollNo"
            value={formData.rollNo}
            onChange={handleChange}
            required
            placeholder="e.g., CSE-2024-101"
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Your full name"
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="">Select Year</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
          <select
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="">Select Branch</option>
            <option value="cse">Computer Science and Engineering</option>
            <option value="ece">Electronics and Communication Engineering</option>
            <option value="it">Information and Technology</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
          <select
            name="section"
            value={formData.section}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition"
          >
            <option value="">Select Section</option>
            <option value="a">A</option>
            <option value="b">B</option>
            <option value="c">C</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
        <select
          name="event"
          value={formData.event}
          onChange={handleChange}
          required
          disabled={loadingEvents}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {loadingEvents ? "Loading events..." : approvedEvents.length === 0 ? "No approved events available" : "Select Event"}
          </option>
          {approvedEvents.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title} ({new Date(event.date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Request To (Faculty)</label>
        <select
          name="requestedTo"
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          required
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition"
        >
          <option value="">Select Faculty</option>
          {faculties.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name} {f.facultyId ? `(${f.facultyId})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Attach Proof (PDF/JPG/PNG)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
          <input
            type="file"
            name="proof"
            onChange={handleChange}
            required
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            id="proof-input"
          />
          <label htmlFor="proof-input" className="cursor-pointer block">
            <p className="text-gray-600">{formData.proof ? formData.proof.name : "Click to upload or drag and drop"}</p>
            <p className="text-gray-500 text-xs mt-1">PNG, JPG or PDF up to 5MB</p>
          </label>
        </div>
      </div>

      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3">
        Submit Participation Request
      </Button>
    </form>
  )
}
