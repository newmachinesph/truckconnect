"use client"

import { StarRating } from "./StarRating"

interface ReviewCardProps {
  review: {
    id: string
    onTimeRating: number
    cargoCareRating: number
    communicationRating: number
    professionalismRating: number
    overallRating: number
    comment?: string | null
    response?: string | null
    createdAt: string
    reviewer: { name: string | null; image: string | null }
  }
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="rounded-xl border border-warm-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-100 text-sm font-bold text-warm-500">
            {review.reviewer.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium text-warm-800 text-sm">{review.reviewer.name ?? "User"}</p>
            <p className="text-xs text-warm-300">{new Date(review.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <StarRating value={review.overallRating} size="sm" readonly />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-warm-300">On Time:</span>
          <StarRating value={review.onTimeRating} size="sm" readonly />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-warm-300">Cargo Care:</span>
          <StarRating value={review.cargoCareRating} size="sm" readonly />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-warm-300">Comms:</span>
          <StarRating value={review.communicationRating} size="sm" readonly />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-warm-300">Professional:</span>
          <StarRating value={review.professionalismRating} size="sm" readonly />
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-warm-500 bg-surface rounded-lg p-3">{review.comment}</p>
      )}

      {review.response && (
        <div className="ml-4 border-l-2 border-indigo-200 pl-4">
          <p className="text-xs font-medium text-indigo-500">Response</p>
          <p className="text-sm text-warm-500 mt-1">{review.response}</p>
        </div>
      )}
    </div>
  )
}
