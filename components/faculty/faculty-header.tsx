"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Bell, User, QrCode, Menu, Home, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/components/auth-context"
import { useState } from "react"

interface FacultyHeaderProps {
  onLogout: () => void
}

export default function FacultyHeader({ onLogout }: FacultyHeaderProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const facultyName = user?.name || "Faculty"
  const facultyId = user?.facultyId || "N/A"

  const handleNavigation = (path: string) => {
    router.push(path)
    setShowMenu(false)
  }

  return (
    <header className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-50 shadow-sm">
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
              <h1 className="text-2xl font-bold text-blue-900">Welcome, Prof. {facultyName}!</h1>
              <p className="text-blue-700 text-sm">Faculty ID: {facultyId} | Event Management Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                onClick={() => handleNavigation("/faculty/dashboard")}
                variant="ghost"
                size="sm"
                className="text-blue-700 hover:bg-blue-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => router.push("/faculty/scan-attendance")}
                variant="outline"
                size="sm"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Scan Attendance
              </Button>
            </div>

            {/* Icons */}
            <button className="p-2 hover:bg-blue-200 rounded-lg transition text-blue-700 hover:text-blue-900">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-blue-200 rounded-lg transition text-blue-700 hover:text-blue-900">
              <User className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2 hover:bg-blue-200 rounded-lg transition text-blue-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-900 hover:bg-blue-200 bg-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-blue-200 pt-4 space-y-2">
            <Button
              onClick={() => handleNavigation("/faculty/dashboard")}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-blue-700 hover:bg-blue-200"
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={() => {
                handleNavigation("/faculty/scan-attendance")
              }}
              variant="outline"
              size="sm"
              className="w-full justify-start border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan Attendance
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
