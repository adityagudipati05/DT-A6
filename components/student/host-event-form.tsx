"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { getFacultyList, createEvent as createEventApi } from "@/lib/apiClient"

export default function HostEventForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    eventName: "",
    clubName: "",
    designation: "",
    description: "",
    startDate: "",
    endDate: "",
    facultyCoordinator: "",
  })

  const [faculties, setFaculties] = useState<Array<{ _id: string; name: string; facultyId?: string }>>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const res = await getFacultyList()
      if (!mounted) return
      if (res.success) setFaculties(res.data || [])
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ;(async () => {
      try {
        const payload = {
          title: formData.eventName,
          description: formData.description,
          date: formData.startDate || formData.endDate,
          location: formData.clubName,
          category: "Other",
          maxParticipants: 100,
          facultyCoordinator: formData.facultyCoordinator || undefined,
        }

        const res = await createEventApi(payload)
        if (res.success) {
          alert("Event created / permission requested successfully")
          router.push("/student/dashboard")
        } else {
          alert(res.error || "Failed to create event")
        }
      } catch (err) {
        console.error(err)
        alert("Error creating event")
      }
    })()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
        <input
          type="text"
          name="eventName"
          value={formData.eventName}
          onChange={handleChange}
          required
          placeholder="e.g., Annual Tech Summit 2025"
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Club/Chapter Name</label>
        <input
          type="text"
          name="clubName"
          value={formData.clubName}
          onChange={handleChange}
          required
          placeholder="e.g., Computer Science Club"
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Designation</label>
        <input
          type="text"
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          required
          placeholder="e.g., President, Vice President"
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Event Description (max 200 words)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          placeholder="Describe the event, its objectives, and expected participants..."
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Coordinator</label>
        <select
          name="facultyCoordinator"
          value={formData.facultyCoordinator}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500 transition"
        >
          <option value="">Select Faculty Coordinator</option>
          {faculties.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name} {f.facultyId ? `(${f.facultyId})` : ""}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3">
        Submit Permission Request
      </Button>
    </form>
  )
}
