import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const DEFAULT_PREFS = {
  bookingUpdates: true,
  bidNotifications: true,
  paymentAlerts: true,
  deliveryUpdates: true,
  marketing: false,
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    })

    if (!pref) {
      return Response.json({
        success: true,
        data: {
          push: DEFAULT_PREFS,
          sms: DEFAULT_PREFS,
          email: DEFAULT_PREFS,
        },
      })
    }

    return Response.json({ success: true, data: pref })
  } catch (error) {
    console.error("GET /api/notification-preferences error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { push, sms, email } = body

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        push: push || DEFAULT_PREFS,
        sms: sms || DEFAULT_PREFS,
        email: email || DEFAULT_PREFS,
      },
      update: {
        ...(push !== undefined ? { push } : {}),
        ...(sms !== undefined ? { sms } : {}),
        ...(email !== undefined ? { email } : {}),
      },
    })

    return Response.json({ success: true, data: pref })
  } catch (error) {
    console.error("PUT /api/notification-preferences error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
