import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { parsePagination, paginatedResponse } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    if ((session.user as any).role !== "ADMIN") {
      return Response.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      )
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get("status") as
      | "CONFIRMED"
      | "IN_TRANSIT"
      | "DELIVERED"
      | "COMPLETED"
      | "CANCELLED"
      | "DISPUTED"
      | null
    const { skip, take, page, limit } = parsePagination(searchParams)

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          load: {
            include: {
              shipperProfile: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
          truckerProfile: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.booking.count({ where }),
    ])

    return Response.json({
      success: true,
      ...paginatedResponse(bookings, total, page, limit),
    })
  } catch (error) {
    console.error("GET /api/admin/bookings error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
