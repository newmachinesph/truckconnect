import { NextRequest } from "next/server"
import { rateCalcSchema } from "@/lib/validators"
import { calculateDistance } from "@/lib/maps"
import { calculateRate } from "@/lib/rate-engine"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = rateCalcSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { originLat, originLng, destLat, destLng, truckType } = parsed.data

    const { distanceKm, durationMinutes } = await calculateDistance(
      originLat,
      originLng,
      destLat,
      destLng
    )

    const rateBreakdown = await calculateRate(distanceKm, truckType)

    return Response.json({
      success: true,
      data: {
        ...rateBreakdown,
        durationMinutes,
      },
    })
  } catch (error) {
    console.error("POST /api/rate/calculate error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
