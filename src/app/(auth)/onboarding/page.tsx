"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"

type Role = "SHIPPER" | "TRUCKER"
type Step = "role" | "profile" | "done"

const roles: { value: Role; title: string; subtitle: string; description: string; iconPath: string; features: string[] }[] = [
  {
    value: "SHIPPER",
    title: "Shipper",
    subtitle: "I need to move freight",
    description:
      "Post loads, get quotes from verified truckers, and track deliveries in real-time.",
    iconPath:
      "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
    features: ["Post unlimited loads", "Get instant quotes", "Track in real-time", "e-POD confirmation"],
  },
  {
    value: "TRUCKER",
    title: "Trucker",
    subtitle: "I have trucks for hire",
    description:
      "Find loads, manage your fleet, and get paid fast via GCash or bank transfer.",
    iconPath:
      "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
    features: ["Browse available loads", "Backhaul matching", "Instant GCash payouts", "Fleet management"],
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleHint = searchParams.get("role")

  const [step, setStep] = useState<Step>("role")
  const [selectedRole, setSelectedRole] = useState<Role | "">(
    roleHint === "shipper" ? "SHIPPER" : roleHint === "trucker" ? "TRUCKER" : ""
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Shipper profile fields
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("Manufacturing")
  const [businessAddress, setBusinessAddress] = useState("")
  const [gcashNumber, setGcashNumber] = useState("")

  // Trucker profile fields
  const [ltfrbAccreditation, setLtfrbAccreditation] = useState("")
  const [truckerGcash, setTruckerGcash] = useState("")

  async function handleRoleSelect() {
    if (!selectedRole) return
    setStep("profile")
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const roleRes = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          ...(selectedRole === "SHIPPER" && {
            businessName,
            businessType,
            businessAddress,
            gcashNumber: gcashNumber || undefined,
          }),
          ...(selectedRole === "TRUCKER" && {
            ltfrbAccreditation: ltfrbAccreditation || undefined,
            gcashNumber: truckerGcash || undefined,
          }),
        }),
      })

      if (!roleRes.ok) {
        const data = await roleRes.json()
        setError(data.error || "Failed to save profile.")
        return
      }

      setStep("done")

      setTimeout(() => {
        router.push(selectedRole === "SHIPPER" ? "/shipper" : "/trucker")
      }, 1500)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const stepIndex = step === "role" ? 0 : step === "profile" ? 1 : 2
  const stepLabels = ["Choose Role", "Business Profile", "Ready!"]

  return (
    <div className="text-center">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
              i <= stepIndex
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-400"
            )}>
              {i < stepIndex ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={cn(
              "text-xs font-medium hidden sm:inline",
              i <= stepIndex ? "text-indigo-600" : "text-gray-400"
            )}>
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <div className={cn(
                "w-8 h-0.5",
                i < stepIndex ? "bg-indigo-600" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Role Selection */}
      {step === "role" && (
        <>
          <h1 className="text-3xl font-bold text-gray-900">What brings you here?</h1>
          <p className="mt-2 text-sm text-gray-600">
            Choose your role to personalize your dashboard experience
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={cn(
                  "group relative flex flex-col items-start rounded-lg border-2 p-6 text-left transition-all duration-300",
                  selectedRole === role.value
                    ? "border-indigo-600 bg-indigo-50 shadow-lg ring-4 ring-indigo-600/10"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                )}
              >
                {selectedRole === role.value && (
                  <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                )}
                <div className={cn(
                  "mb-4 rounded-lg p-3 transition-all duration-300",
                  selectedRole === role.value
                    ? "bg-indigo-600 shadow-lg"
                    : "bg-gray-100 group-hover:bg-gray-200"
                )}>
                  <svg
                    className={cn("h-7 w-7 transition-colors duration-300", selectedRole === role.value ? "text-white" : "text-gray-500")}
                    fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={role.iconPath} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{role.title}</h3>
                <p className="text-sm font-medium text-indigo-600 mt-0.5">{role.subtitle}</p>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{role.description}</p>
                <ul className="mt-4 space-y-2 w-full">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-gray-500">
                      <svg className={cn("h-3.5 w-3.5 flex-shrink-0", selectedRole === role.value ? "text-indigo-600" : "text-gray-300")}
                        fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <Button onClick={handleRoleSelect} size="lg" className="mt-8 w-full" disabled={!selectedRole}>
            Continue
          </Button>
        </>
      )}

      {/* Step: Profile Info */}
      {step === "profile" && (
        <form onSubmit={handleProfileSubmit} className="text-left max-w-md mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            {selectedRole === "SHIPPER" ? "Business Profile" : "Trucker Profile"}
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            {selectedRole === "SHIPPER"
              ? "Tell us about your business to get started"
              : "Add your credentials for verified trucker status"}
          </p>

          {selectedRole === "SHIPPER" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Manila Foods Corp" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                <Select
                  value={businessType}
                  onChange={(v) => setBusinessType(v)}
                  options={[
                    { value: "Manufacturing", label: "Manufacturing" },
                    { value: "Agriculture", label: "Agriculture" },
                    { value: "Construction", label: "Construction" },
                    { value: "Retail", label: "Retail" },
                    { value: "Food & Beverage", label: "Food & Beverage" },
                    { value: "Electronics", label: "Electronics" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address *</label>
                <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="e.g. 123 EDSA, Makati City" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GCash Number (optional)</label>
                <Input value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} placeholder="09XX XXX XXXX" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LTFRB Accreditation (optional)</label>
                <Input value={ltfrbAccreditation} onChange={(e) => setLtfrbAccreditation(e.target.value)} placeholder="Accreditation number" />
                <p className="mt-1 text-xs text-gray-400">You can add this later from your profile</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GCash Number (optional)</label>
                <Input value={truckerGcash} onChange={(e) => setTruckerGcash(e.target.value)} placeholder="09XX XXX XXXX" />
                <p className="mt-1 text-xs text-gray-400">For receiving payments</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm text-amber-800 font-medium">Document Upload</p>
                <p className="text-xs text-amber-700 mt-1">
                  You can upload your Government ID, LTFRB Certificate, and vehicle documents from your profile dashboard after onboarding.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setStep("role")} className="flex-1">
              Back
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Complete Setup
            </Button>
          </div>
        </form>
      )}

      {/* Step: Success */}
      {step === "done" && (
        <div className="py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 animate-bounce">
            <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">You&apos;re all set!</h2>
          <p className="mt-2 text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      )}
    </div>
  )
}
