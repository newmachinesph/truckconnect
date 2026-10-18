import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { payerId: session.user.id },
          { payeeId: session.user.id },
        ],
      },
      include: {
        booking: {
          include: {
            load: {
              select: {
                originAddress: true,
                destAddress: true,
                cargoType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return Response.json({ success: true, data: payments })
  } catch (error) {
    console.error("GET /api/payments error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
