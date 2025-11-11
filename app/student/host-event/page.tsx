"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import HostEventForm from "@/components/student/host-event-form"

export default function HostEventPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button onClick={() => router.back()} variant="ghost" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Host an Event</CardTitle>
              <CardDescription className="text-gray-600">
                Request permission to host a college event or activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HostEventForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
