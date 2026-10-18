import { NextRequest } from "next/server"
import { z } from "zod"
import { findRoute, PHILIPPINE_ROUTES } from "@/lib/philippine-routes"
import { calculateRateV2, calculateFallbackRate } from "@/lib/rate-engine-v2"

const requestSchema = z.object({
  fromCity: z.string().min(1, "Origin city is required"),
  toCity: z.string().min(1, "Destination city is required"),
  truckType: z.enum([
    "FOUR_WHEELER",
    "SIX_WHEELER_OPEN",
    "SIX_WHEELER_CLOSED",
    "TEN_WHEELER",
    "TRAILER",
    "WING_VAN",
  ]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { fromCity, toCity, truckType } = parsed.data

    const route = findRoute(fromCity, toCity)

    if (route) {
      const breakdown = calculateRateV2(route, truckType)
      return Response.json({
        success: true,
        data: {
          routeId: route.id,
          from: route.from,
          to: route.to,
          ...breakdown,
        },
      })
    }

    // Fallback: no known route, use straight-line estimate
    // Simple heuristic: 100km per unknown city pair
    const fallback = calculateFallbackRate(100, truckType)
    return Response.json({
      success: true,
      data: {
        routeId: null,
        from: fromCity,
        to: toCity,
        ...fallback,
        warning:
          "This route is not in our database. The estimate uses a default 100 km distance. For accurate pricing, please contact us.",
      },
    })
  } catch (error) {
    console.error("POST /api/rate/calculate-v2 error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/** GET: return available routes for client-side dropdowns. */
export async function GET() {
  const routes = PHILIPPINE_ROUTES.map((r) => ({
    id: r.id,
    from: r.from,
    to: r.to,
    hasRoro: r.hasRoro,
    totalDistanceKm: r.totalDistanceKm,
    popularity: r.popularity,
  }))

  return Response.json({ success: true, data: routes })
}
