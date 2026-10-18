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
    const role = searchParams.get("role") as "SHIPPER" | "TRUCKER" | "ADMIN" | null
    const search = searchParams.get("search")
    const { skip, take, page, limit } = parsePagination(searchParams)

    const where: Record<string, unknown> = {}

    if (role) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          shipperProfile: {
            include: {
              _count: { select: { loads: true } },
            },
          },
          truckerProfile: {
            include: {
              _count: { select: { bookings: true, trucks: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ])

    return Response.json({
      success: true,
      ...paginatedResponse(users, total, page, limit),
    })
  } catch (error) {
    console.error("GET /api/admin/users error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
