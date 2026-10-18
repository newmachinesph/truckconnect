"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

interface CheckoutFlowProps {
  bookingId: string
  agreedRate: number
  platformFee: number
  onPaymentComplete?: () => void
}

type PaymentMethod = "GCASH" | "BANK_TRANSFER" | "CASH_ON_DELIVERY"

const methods: { value: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { value: "GCASH", label: "GCash", icon: "📱", desc: "Instant mobile payment" },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: "🏦", desc: "BDO, BPI, Metrobank, etc." },
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery", icon: "💵", desc: "Pay when cargo arrives" },
]

export function CheckoutFlow({ bookingId, agreedRate, platformFee, onPaymentComplete }: CheckoutFlowProps) {
  const [step, setStep] = useState<"select" | "confirm" | "processing" | "done">("select")
  const [method, setMethod] = useState<PaymentMethod>("GCASH")
  const [isLoading, setIsLoading] = useState(false)

  const total = agreedRate + platformFee

  async function handlePayment() {
    setStep("processing")
    setIsLoading(true)

    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      })

      if (res.ok) {
        // Simulate processing delay for demo realism
        await new Promise((r) => setTimeout(r, 2000))
        setStep("done")
        onPaymentComplete?.()
      }
    } catch {
      setStep("confirm")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-600-50 to-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-warm-800">Payment Successful!</h3>
        <p className="mt-2 text-sm text-warm-400">₱{total.toLocaleString()} held in escrow</p>
        <Badge variant="confirmed" className="mt-3">
          Demo: Auto-approved
        </Badge>
        <p className="mt-4 text-xs text-warm-300">
          Funds will be released to the trucker upon delivery confirmation.
        </p>
      </div>
    )
  }

  if (step === "processing") {
    return (
      <div className="rounded-2xl border border-warm-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <h3 className="text-lg font-bold text-warm-800">Processing Payment...</h3>
        <p className="mt-2 text-sm text-warm-400">
          {method === "GCASH" ? "Connecting to GCash..." : "Processing bank transfer..."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Amount Summary */}
      <div className="rounded-xl bg-surface p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-warm-400">Freight Rate</span>
          <span className="font-medium text-warm-800">₱{agreedRate.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-warm-400">Platform Fee (3.5%)</span>
          <span className="font-medium text-warm-800">₱{platformFee.toLocaleString()}</span>
        </div>
        <div className="border-t border-warm-200 pt-2 flex justify-between">
          <span className="font-semibold text-warm-800">Total</span>
          <span className="font-bold text-lg text-indigo-600">₱{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Method Selection */}
      {step === "select" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-warm-600">Payment Method</p>
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => { setMethod(m.value); setStep("confirm") }}
              className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                method === m.value ? "border-indigo-600-500 bg-indigo-600-50" : "border-warm-200 hover:border-slate-300"
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="font-semibold text-warm-800">{m.label}</p>
                <p className="text-xs text-warm-300">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Confirm */}
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-600-50 p-4">
            <p className="text-sm text-warm-500">Paying with</p>
            <p className="text-lg font-bold text-warm-800">
              {methods.find((m) => m.value === method)?.icon} {methods.find((m) => m.value === method)?.label}
            </p>
          </div>
          <Badge variant="confirmed" className="w-full justify-center py-1">
            Demo: Payment will auto-succeed
          </Badge>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("select")} className="flex-1">
              Back
            </Button>
            <Button onClick={handlePayment} isLoading={isLoading} className="flex-1">
              Pay ₱{total.toLocaleString()}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
