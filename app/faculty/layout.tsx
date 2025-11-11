import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Faculty Portal - EventPass",
  description: "Faculty event request management",
}

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
