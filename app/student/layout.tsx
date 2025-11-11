import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Student Portal - EventPass",
  description: "Student event permission management",
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
