"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { formatPeso, formatDate } from "@/lib/utils"
import { ArrowLeftIcon, DocumentTextIcon, EyeIcon } from "@heroicons/react/24/outline"

type Carrier = {
  id: string
  carrierId: string
  name?: string
  user?: { name: string | null }
}

export default function NewContractPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [carrierSearch, setCarrierSearch] = useState("")
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(true)

  const [form, setForm] = useState({
    truckerId: "",
    carrierName: "",
    originCity: "",
    destCity: "",
    agreedRate: "",
    startDate: "",
    endDate: "",
    fuelSurchargeFormula: "",
    noticePeriodDays: "30",
  })

  useEffect(() => {
    fetchCarriers()
  }, [])

  async function fetchCarriers() {
    setIsLoadingCarriers(true)
    try {
      // Fetch trucker profiles as available carriers
      const res = await fetch("/api/users?role=TRUCKER")
      const data = await res.json()
      const users = data.data || data || []
      setCarriers(
        users.map((u: { id: string; truckerProfile?: { id: string }; name: string | null }) => ({
          id: u.truckerProfile?.id || u.id,
          carrierId: u.truckerProfile?.id || u.id,
          name: u.name || "Unknown Carrier",
        }))
      )
    } catch {
      // Fallback demo carriers
      setCarriers([
        { id: "demo-1", carrierId: "demo-1", name: "Santos Trucking Co." },
        { id: "demo-2", carrierId: "demo-2", name: "Manila Express Logistics" },
        { id: "demo-3", carrierId: "demo-3", name: "Visayas Freight Services" },
        { id: "demo-4", carrierId: "demo-4", name: "Mindanao Haulers Inc." },
      ])
    } finally {
      setIsLoadingCarriers(false)
    }
  }

  const filteredCarriers = carriers.filter((c) =>
    (c.name || "").toLowerCase().includes(carrierSearch.toLowerCase())
  )

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function selectCarrier(carrier: Carrier) {
    setForm((prev) => ({
      ...prev,
      truckerId: carrier.carrierId,
      carrierName: carrier.name || "",
    }))
    setCarrierSearch("")
  }

  const isValid =
    form.truckerId &&
    form.originCity &&
    form.destCity &&
    form.agreedRate &&
    form.startDate &&
    form.endDate

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckerId: form.truckerId,
          originCity: form.originCity,
          destCity: form.destCity,
          agreedRate: form.agreedRate,
          startDate: form.startDate,
          endDate: form.endDate,
          fuelSurchargeFormula: form.fuelSurchargeFormula || null,
          noticePeriodDays: form.noticePeriodDays,
        }),
      })

      const data = await res.json()

      if (data.success) {
        router.push(`/contracts/${data.data.id}`)
      } else {
        setError(data.error || "Failed to create contract")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back */}
      <button
        onClick={() => router.push("/contracts")}
        className="flex items-center gap-1 text-sm text-warm-400 hover:text-warm-600 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Contracts
      </button>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-warm-800">Create New Contract</h1>
        <p className="mt-1 text-sm text-warm-400">
          Establish a contract lane with a carrier for recurring shipments.
        </p>
      </div>

      {showPreview ? (
        /* Preview */
        <Card className="mb-6">
          <CardTitle className="mb-4">Contract Preview</CardTitle>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-warm-300 uppercase tracking-wide">Carrier</p>
                  <p className="text-sm font-semibold text-warm-800 mt-1">{form.carrierName}</p>
                </div>
                <div>
                  <p className="text-xs text-warm-300 uppercase tracking-wide">Agreed Rate</p>
                  <p className="text-sm font-semibold text-indigo-500 mt-1">
                    {formatPeso(parseFloat(form.agreedRate) || 0)}
                  </p>
                </div>
              </div>

              <div className="border-t border-warm-100 pt-4">
                <p className="text-xs text-warm-300 uppercase tracking-wide mb-1">Route</p>
                <p className="text-sm font-semibold text-warm-800">
                  {form.originCity} &rarr; {form.destCity}
                </p>
              </div>

              <div className="border-t border-warm-100 pt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-warm-300 uppercase tracking-wide">Start Date</p>
                  <p className="text-sm text-warm-800 mt-1">{formatDate(form.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-warm-300 uppercase tracking-wide">End Date</p>
                  <p className="text-sm text-warm-800 mt-1">{formatDate(form.endDate)}</p>
                </div>
              </div>

              {form.fuelSurchargeFormula && (
                <div className="border-t border-warm-100 pt-4">
                  <p className="text-xs text-warm-300 uppercase tracking-wide">Fuel Surcharge Formula</p>
                  <p className="text-sm text-warm-800 mt-1">{form.fuelSurchargeFormula}</p>
                </div>
              )}

              <div className="border-t border-warm-100 pt-4">
                <p className="text-xs text-warm-300 uppercase tracking-wide">Notice Period</p>
                <p className="text-sm text-warm-800 mt-1">{form.noticePeriodDays} days</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowPreview(false)}>
                Edit
              </Button>
              <Button onClick={handleSubmit} isLoading={isSubmitting}>
                <DocumentTextIcon className="mr-2 h-4 w-4" />
                Create Contract
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Form */
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setShowPreview(true)
          }}
        >
          <Card className="mb-6">
            <CardTitle className="mb-4">Carrier Selection</CardTitle>
            <CardContent>
              {form.truckerId ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-600-50 border border-indigo-200">
                  <div>
                    <p className="text-sm font-semibold text-indigo-600-900">{form.carrierName}</p>
                    <p className="text-xs text-indigo-600">Selected carrier</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateForm("truckerId", "")}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Search Carriers"
                    placeholder="Type carrier name..."
                    value={carrierSearch}
                    onChange={(e) => setCarrierSearch(e.target.value)}
                  />
                  {isLoadingCarriers ? (
                    <LoadingSpinner size="sm" className="py-4" />
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-warm-200 rounded-md divide-y divide-warm-100">
                      {filteredCarriers.length === 0 ? (
                        <p className="text-sm text-warm-300 p-3 text-center">No carriers found</p>
                      ) : (
                        filteredCarriers.map((carrier) => (
                          <button
                            type="button"
                            key={carrier.id}
                            onClick={() => selectCarrier(carrier)}
                            className="w-full text-left px-3 py-2.5 hover:bg-indigo-500-50 transition-colors text-sm text-warm-600"
                          >
                            {carrier.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardTitle className="mb-4">Route &amp; Rate</CardTitle>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Origin City"
                    placeholder="e.g., Manila"
                    value={form.originCity}
                    onChange={(e) => updateForm("originCity", e.target.value)}
                    required
                  />
                  <Input
                    label="Destination City"
                    placeholder="e.g., Cebu City"
                    value={form.destCity}
                    onChange={(e) => updateForm("destCity", e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Agreed Rate per Trip"
                  type="number"
                  placeholder="e.g., 25000"
                  value={form.agreedRate}
                  onChange={(e) => updateForm("agreedRate", e.target.value)}
                  required
                  hint="Fixed rate per trip in PHP"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardTitle className="mb-4">Contract Terms</CardTitle>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Start Date"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateForm("startDate", e.target.value)}
                    required
                  />
                  <Input
                    label="End Date"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateForm("endDate", e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Fuel Surcharge Formula"
                  placeholder="e.g., Base + (DOE diesel price - 45) x 0.5%"
                  value={form.fuelSurchargeFormula}
                  onChange={(e) => updateForm("fuelSurchargeFormula", e.target.value)}
                  hint="Optional - define how fuel surcharges are calculated"
                />
                <Input
                  label="Notice Period (Days)"
                  type="number"
                  placeholder="30"
                  value={form.noticePeriodDays}
                  onChange={(e) => updateForm("noticePeriodDays", e.target.value)}
                  hint="Required notice before termination"
                />
              </div>
            </CardContent>
          </Card>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => router.push("/contracts")}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              <EyeIcon className="mr-2 h-4 w-4" />
              Preview Contract
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
