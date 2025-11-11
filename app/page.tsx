"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useAuth } from "@/components/auth-context"
import { studentLogin, facultyLogin } from "@/lib/apiClient"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [credentials, setCredentials] = useState({ id: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = (role: string) => {
    setSelectedRole(role)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (selectedRole === "student") {
        const response = await studentLogin(credentials.id, credentials.password)
        if (response.success && response.data) {
          // response.data contains { token, student }
          login(response.data.student, response.data.token, "student")
          router.push("/student/dashboard")
        } else {
          setError(response.error || "Login failed. Please try again.")
        }
      } else {
        const response = await facultyLogin(credentials.id, credentials.password)
        if (response.success && response.data) {
          // response.data contains { token, faculty }
          login(response.data.faculty, response.data.token, "faculty")
          router.push("/faculty/dashboard")
        } else {
          setError(response.error || "Login failed. Please try again.")
        }
      }
    } catch (err) {
      setError("An error occurred. Please check your credentials and try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedRole(null)
    setCredentials({ id: "", password: "" })
    setError("")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/opening_logo-Gpbb4Sie2efbLnJeyiPv0JKGWrG54t.png"
              alt="VNR Vignana Jyothi Institute of Engineering and Technology"
              width={400}
              height={80}
              className="max-w-full h-auto"
            />
          </div>
          <p className="text-gray-600 text-sm">College Event Permission System</p>
        </div>

        {/* Login Card */}
        <Card className="border-gray-200 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-gray-900">
              {selectedRole ? `${selectedRole === "student" ? "Student" : "Faculty"} Login` : "Welcome"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {selectedRole ? "Enter your credentials to continue" : "Select your role to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedRole ? (
              <>
                <Button
                  onClick={() => handleLogin("student")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6"
                  size="lg"
                >
                  Student Login
                </Button>
                <Button
                  onClick={() => handleLogin("faculty")}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-900 hover:bg-gray-100 font-semibold py-6"
                  size="lg"
                >
                  Faculty Login
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="id" className="text-gray-900">
                    {selectedRole === "student" ? "Admission Number" : "Faculty ID"}
                  </Label>
                  <Input
                    id="id"
                    type="text"
                    placeholder={selectedRole === "student" ? "e.g., 24071A05E9" : "e.g., 101"}
                    value={credentials.id}
                    onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="bg-white border-gray-300 text-gray-900"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-100 bg-white"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">For demonstration purposes only</p>
      </div>
    </main>
  )
}
