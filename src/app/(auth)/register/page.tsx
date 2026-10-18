"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

const steps = [
  { number: 1, label: "Account" },
  { number: 2, label: "Choose Role" },
  { number: 3, label: "Get Started" },
]

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const roleHint = searchParams.get("role")

  const [name, setName] = useState("")
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
        name,
        email,
        phone,
        isRegister: "true",
      })

      if (result?.error) {
        setError("Registration failed. Please try again.")
      } else if (result?.ok) {
        window.location.href = roleHint ? `/onboarding?role=${roleHint}` : "/onboarding"
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
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Join TruckConnect PH and start moving freight
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-3">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                    step.number === 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {step.number}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs font-medium",
                    step.number === 1 ? "text-indigo-600" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="h-px w-12 bg-gray-200 -mt-5" />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          placeholder="Juan Dela Cruz"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+63 9XX XXX XXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          hint="We'll use this for OTP verification"
        />

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-500">Already have an account?</span>
        </div>
      </div>

      <p className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          Sign in instead
        </Link>
      </p>
    </>
  )
}
