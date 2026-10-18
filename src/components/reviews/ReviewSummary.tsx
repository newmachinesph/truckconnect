"use client"

import { StarRating } from "./StarRating"

interface ReviewSummaryProps {
  reviews: {
    overallRating: number
    onTimeRating: number
    cargoCareRating: number
    communicationRating: number
    professionalismRating: number
  }[]
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function ReviewSummary({ reviews }: ReviewSummaryProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-warm-200 bg-surface p-6 text-center">
        <p className="text-sm text-warm-400">No reviews yet</p>
      </div>
    )
  }

  const overall = avg(reviews.map((r) => r.overallRating))
  const onTime = avg(reviews.map((r) => r.onTimeRating))
  const cargoCare = avg(reviews.map((r) => r.cargoCareRating))
  const communication = avg(reviews.map((r) => r.communicationRating))
  const professionalism = avg(reviews.map((r) => r.professionalismRating))

  return (
    <div className="rounded-xl border border-warm-200 bg-white p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-warm-800">{overall.toFixed(1)}</p>
          <StarRating value={Math.round(overall)} size="sm" readonly />
          <p className="text-xs text-warm-300 mt-1">{reviews.length} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-warm-400 w-28">On Time</span>
            <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(onTime / 5) * 100}%` }} />
            </div>
            <span className="text-warm-500 font-medium w-8 text-right">{onTime.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-warm-400 w-28">Cargo Care</span>
            <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(cargoCare / 5) * 100}%` }} />
            </div>
            <span className="text-warm-500 font-medium w-8 text-right">{cargoCare.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-warm-400 w-28">Communication</span>
            <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(communication / 5) * 100}%` }} />
            </div>
            <span className="text-warm-500 font-medium w-8 text-right">{communication.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-warm-400 w-28">Professionalism</span>
            <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(professionalism / 5) * 100}%` }} />
            </div>
            <span className="text-warm-500 font-medium w-8 text-right">{professionalism.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
