import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    // Return free plan if no subscription exists
    if (!subscription) {
      return Response.json({
        success: true,
        data: {
          id: null,
          plan: "FREE",
          status: "ACTIVE",
          amount: 0,
          startDate: null,
          endDate: null,
        },
      })
    }

    return Response.json({ success: true, data: subscription })
  } catch (error) {
    console.error("GET /api/subscription error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { plan } = body

    if (!plan || !["FREE", "FLEET_PRO", "ENTERPRISE"].includes(plan)) {
      return Response.json(
        { success: false, error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    const amounts: Record<string, number> = {
      FREE: 0,
      FLEET_PRO: 2999,
      ENTERPRISE: 0, // Custom pricing
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan,
        amount: amounts[plan],
        status: "ACTIVE",
        startDate: new Date(),
        endDate: plan === "FREE" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: session.user.id,
        plan,
        amount: amounts[plan],
        startDate: new Date(),
        endDate: plan === "FREE" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return Response.json({ success: true, data: subscription })
  } catch (error) {
    console.error("POST /api/subscription error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
