"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Bell, User } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/components/auth-context"

interface StudentHeaderProps {
  onLogout: () => void
}

export default function StudentHeader({ onLogout }: StudentHeaderProps) {
  const { user } = useAuth()

  const studentName = user?.name || "Student"
  const admissionNo = user?.admissionNo || "N/A"

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/inner_logo-g1Fe17ATPYImZpEkBZGSMgjQz76b63.png"
              alt="VNR Logo"
              width={60}
              height={60}
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {studentName}!</h1>
              <p className="text-gray-600 text-sm">Admission No: {admissionNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900">
              <User className="w-5 h-5" />
            </button>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-900 hover:bg-gray-100 bg-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
