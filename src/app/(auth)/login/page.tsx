"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

type LoginMethod = "email" | "phone"

export default function LoginPage() {
  const [method, setMethod] = useState<LoginMethod>("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: method === "email" ? email : undefined,
        phone: method === "phone" ? phone : undefined,
      })

      if (result?.error) {
        setError("Invalid credentials. Please try again.")
      } else if (result?.ok) {
        // Fetch user profile to determine role-based redirect
        try {
          const profileRes = await fetch("/api/users/profile")
          const profileData = await profileRes.json()
          const userRole = profileData.data?.role
          if (userRole === "ADMIN") {
            window.location.href = "/admin"
          } else if (userRole === "TRUCKER") {
            window.location.href = "/trucker"
          } else if (userRole === "SHIPPER") {
            window.location.href = "/shipper"
          } else {
            window.location.href = "/onboarding"
          }
        } catch {
          window.location.href = "/onboarding"
        }
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to your TruckConnect PH account
        </p>
      </div>

      {/* Method Tabs */}
      <div className="mb-6 flex rounded-md bg-gray-100 p-1">
        {(["email", "phone"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMethod(tab)
              setError("")
            }}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-semibold transition-colors",
              method === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab === "email" ? "Email" : "Phone"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {method === "email" ? (
          <Input
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        ) : (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+63 9XX XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-500">New to TruckConnect?</span>
        </div>
      </div>

      <p className="mt-6 text-center">
        <Link
          href="/register"
          className="inline-flex items-center justify-center w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          Create a free account
        </Link>
      </p>
    </>
  )
}
