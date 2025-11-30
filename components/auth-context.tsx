"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getToken, removeToken, setToken } from "@/lib/apiClient"

interface User {
  _id?: string
  name?: string
  admissionNo?: string
  facultyId?: string
  email?: string
  phone?: string
  department?: string
  semester?: string
  [key: string]: any
}

interface AuthContextType {
  user: User | null
  userRole: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (userData: User, token: string, role: string) => void
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check if user is already logged in on mount
  useEffect(() => {
    // Clean up old token key (migrate from "token" to "authToken")
    if (typeof window !== "undefined") {
      const oldToken = localStorage.getItem("token")
      if (oldToken && !localStorage.getItem("authToken")) {
        localStorage.setItem("authToken", oldToken)
        localStorage.removeItem("token")
      }
    }

    const token = getToken()
    if (token) {
      // You can validate token here if needed
      try {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split(".")[1]))
        setIsAuthenticated(true)
        // We'll fetch full user data when needed
      } catch (error) {
        removeToken()
        setIsAuthenticated(false)
      }
    }
    setLoading(false)
  }, [])

  const login = (userData: User, token: string, role: string) => {
    setToken(token)
    setUser(userData)
    setUserRole(role)
    setIsAuthenticated(true)
  }

  const logout = () => {
    removeToken()
    setUser(null)
    setUserRole(null)
    setIsAuthenticated(false)
  }

  const value: AuthContextType = {
    user,
    userRole,
    loading,
    isAuthenticated,
    login,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
