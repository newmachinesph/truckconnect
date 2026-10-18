import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Use notifications with type SUPPORT_TICKET as tickets for demo
    const tickets = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        type: { startsWith: "SUPPORT" },
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedTickets = tickets.map((ticket) => {
      const data = (ticket.data as any) || {}
      return {
        id: ticket.id,
        subject: ticket.title,
        category: data.category || "Other",
        status: data.status || "OPEN",
        description: ticket.body,
        attachmentUrl: data.attachmentUrl || null,
        createdAt: ticket.createdAt,
      }
    })

    return Response.json({ success: true, data: formattedTickets })
  } catch (error) {
    console.error("GET /api/support error:", error)
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
    const { subject, category, description, attachmentUrl } = body

    if (!subject || !category || !description) {
      return Response.json(
        { success: false, error: "subject, category, and description are required" },
        { status: 400 }
      )
    }

    // Store as notification with SUPPORT_TICKET type
    const ticket = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "SUPPORT_TICKET",
        title: subject,
        body: description,
        data: {
          category,
          status: "OPEN",
          attachmentUrl: attachmentUrl || null,
          ticketNumber: `TKT-${Date.now().toString(36).toUpperCase()}`,
        },
      },
    })

    return Response.json({
      success: true,
      data: {
        id: ticket.id,
        subject: ticket.title,
        category,
        status: "OPEN",
        createdAt: ticket.createdAt,
      },
    })
  } catch (error) {
    console.error("POST /api/support error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
