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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true, truckerProfile: true },
    })

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const { skip, take, page, limit } = parsePagination(request.nextUrl.searchParams)

    let bookings: unknown[]
    let total: number

    if (user.role === "SHIPPER" && user.shipperProfile) {
      const where = {
        load: {
          shipperProfileId: user.shipperProfile.id,
        },
      }
      // Shipper sees bookings for their loads
      ;[bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            load: true,
            truckerProfile: {
              include: { user: { select: { name: true, phone: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.booking.count({ where }),
      ])
    } else if (user.role === "TRUCKER" && user.truckerProfile) {
      const where = {
        truckerProfileId: user.truckerProfile.id,
      }
      // Trucker sees their own bookings
      ;[bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
            load: {
              include: {
                shipperProfile: {
                  include: { user: { select: { name: true, phone: true } } },
                },
              },
            },
            truckerProfile: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.booking.count({ where }),
      ])
    } else {
      bookings = []
      total = 0
    }

    return Response.json({
      success: true,
      ...paginatedResponse(bookings, total, page, limit),
    })
  } catch (error) {
    console.error("GET /api/bookings error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
