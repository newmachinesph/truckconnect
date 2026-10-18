"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"

interface BidFormProps {
  loadId: string
  rateEstimate?: number | null
  maxBudget?: number | null
  onBidPlaced?: () => void
}

export function BidForm({ loadId, rateEstimate, maxBudget, onBidPlaced }: BidFormProps) {
  const [proposedRate, setProposedRate] = useState(rateEstimate?.toString() ?? "")
  const [comments, setComments] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/loads/${loadId}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedRate: parseFloat(proposedRate),
          comments: comments || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to submit bid")
        return
      }

      setSuccess(true)
      onBidPlaced?.()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-600-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-semibold text-indigo-500">Bid Submitted!</p>
        <p className="mt-1 text-sm text-indigo-600">The shipper will review your bid shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-warm-600 mb-1">
          Your Proposed Rate (₱)
        </label>
        <Input
          type="number"
          value={proposedRate}
          onChange={(e) => setProposedRate(e.target.value)}
          placeholder="e.g. 15000"
          required
          min={100}
        />
        {rateEstimate && (
          <p className="mt-1 text-xs text-warm-300">
            Estimated rate: ₱{rateEstimate.toLocaleString()}
          </p>
        )}
        {maxBudget && (
          <p className="mt-1 text-xs text-warm-300">
            Shipper budget: ₱{maxBudget.toLocaleString()}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-600 mb-1">
          Comments (optional)
        </label>
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="e.g. I have experience with this route, can pick up early..."
          rows={3}
          maxLength={500}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Submit Bid
      </Button>
    </form>
  )
}
