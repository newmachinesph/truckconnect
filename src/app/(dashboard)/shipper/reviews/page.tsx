"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/Card"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { ReviewSummary } from "@/components/reviews/ReviewSummary"
import { ReviewCard } from "@/components/reviews/ReviewCard"

interface Review {
  id: string
  onTimeRating: number
  cargoCareRating: number
  communicationRating: number
  professionalismRating: number
  overallRating: number
  comment: string | null
  response: string | null
  createdAt: string
  reviewer: { name: string | null; image: string | null }
  booking: {
    waybillNumber: string
    load: { originAddress: string; destAddress: string }
  }
}

export default function ShipperReviewsPage() {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      if (!session?.user?.id) return
      try {
        const res = await fetch(`/api/users/${session.user.id}/reviews`)
        const data = await res.json()
        if (data.success) setReviews(data.data.reviews)
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    fetchReviews()
  }, [session?.user?.id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-warm-800 mb-6">My Reviews</h1>

      <div className="space-y-6">
        <ReviewSummary reviews={reviews} />

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent>
              <p className="text-center text-sm text-warm-300 py-8">
                No reviews yet. Complete bookings to start receiving feedback.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
