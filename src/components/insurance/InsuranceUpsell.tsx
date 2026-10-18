"use client"

import { useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/ui/Toast"
import { formatPeso } from "@/lib/utils"
import { ShieldCheckIcon, CheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

interface InsuranceUpsellProps {
  bookingId: string
  onSelect?: (policyId: string) => void
}

type Tier = "BASIC" | "COMPREHENSIVE"

const tiers: {
  id: Tier
  name: string
  rateLabel: string
  rate: number
  coverageMax: number
  features: string[]
}[] = [
  {
    id: "BASIC",
    name: "Basic",
    rateLabel: "1% of declared value",
    rate: 0.01,
    coverageMax: 100000,
    features: [
      "Covers cargo damage during transit",
      "Up to " + formatPeso(100000) + " coverage",
      "Standard claim processing (5-7 days)",
      "Basic documentation support",
    ],
  },
  {
    id: "COMPREHENSIVE",
    name: "Comprehensive",
    rateLabel: "2.5% of declared value",
    rate: 0.025,
    coverageMax: 500000,
    features: [
      "Full cargo damage & loss coverage",
      "Up to " + formatPeso(500000) + " coverage",
      "Priority claim processing (2-3 days)",
      "Dedicated claims manager",
      "Theft and natural disaster coverage",
      "Documentation & legal support",
    ],
  },
]

export function InsuranceUpsell({ bookingId, onSelect }: InsuranceUpsellProps) {
  const { toast } = useToast()
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null)
  const [declaredValue, setDeclaredValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const parsedValue = parseFloat(declaredValue) || 0
  const selectedTierData = tiers.find((t) => t.id === selectedTier)
  const calculatedPremium = selectedTierData
    ? Math.round(parsedValue * selectedTierData.rate)
    : 0

  async function handleAddInsurance() {
    if (!selectedTier) {
      toast("error", "Please select an insurance tier")
      return
    }
    if (parsedValue <= 0) {
      toast("error", "Please enter a valid declared value")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          tier: selectedTier,
          declaredValue: parsedValue,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", "Insurance added successfully!")
        onSelect?.(data.data.id)
      } else {
        toast("error", data.error || "Failed to add insurance")
      }
    } catch {
      toast("error", "Failed to add insurance")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-warm-800">Protect Your Cargo</h3>
        <p className="text-sm text-warm-400 mt-1">
          Add insurance to safeguard your shipment against damage, loss, or theft.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id
          return (
            <Card
              key={tier.id}
              interactive
              onClick={() => setSelectedTier(tier.id)}
              className={cn(
                "relative transition-all",
                isSelected
                  ? "ring-2 ring-indigo-600 border-indigo-600-300"
                  : "hover:border-slate-300"
              )}
            >
              {tier.id === "COMPREHENSIVE" && (
                <Badge className="absolute -top-2 right-4 bg-indigo-600 text-white">
                  Recommended
                </Badge>
              )}
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheckIcon
                  className={cn(
                    "h-6 w-6",
                    isSelected ? "text-indigo-600" : "text-warm-300"
                  )}
                />
                <CardTitle>{tier.name}</CardTitle>
              </div>
              <CardContent>
                <p className="text-indigo-600 font-semibold text-sm mb-3">{tier.rateLabel}</p>
                <p className="text-xs text-warm-300 mb-3">
                  Max coverage: {formatPeso(tier.coverageMax)}
                </p>
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-warm-500">
                      <CheckIcon className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Declared Value Input */}
      {selectedTier && (
        <Card>
          <CardContent className="space-y-4">
            <Input
              label="Declared Cargo Value"
              type="number"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
              placeholder="Enter value in PHP"
              hint="This is the total value of your cargo"
            />

            {parsedValue > 0 && (
              <div className="p-3 bg-indigo-600-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-warm-500">Premium</span>
                  <span className="text-lg font-bold text-indigo-500">
                    {formatPeso(calculatedPremium)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-warm-300">
                  <span>Coverage up to</span>
                  <span>{formatPeso(Math.min(parsedValue, selectedTierData?.coverageMax || 0))}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddInsurance}
              isLoading={isSubmitting}
              disabled={parsedValue <= 0}
              className="w-full"
            >
              Add Insurance - {parsedValue > 0 ? formatPeso(calculatedPremium) : "Enter value"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
