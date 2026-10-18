import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get or create referral code
    let referralCode = await prisma.referralCode.findUnique({
      where: { userId: session.user.id },
    })

    if (!referralCode) {
      const code = `TC-${session.user.id.slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
      referralCode = await prisma.referralCode.create({
        data: {
          userId: session.user.id,
          code,
        },
      })
    }

    // Get referrals made by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // Get referred user names
    const referredUserIds = referrals.map((r) => r.referredId)
    const referredUsers = await prisma.user.findMany({
      where: { id: { in: referredUserIds } },
      select: { id: true, name: true, createdAt: true },
    })

    const userMap = new Map(referredUsers.map((u) => [u.id, u]))

    const referralList = referrals.map((r) => {
      const user = userMap.get(r.referredId)
      return {
        id: r.id,
        name: user?.name || "Unknown User",
        signUpDate: r.createdAt,
        firstTripCompleted: !!r.firstTripAt,
        firstTripAt: r.firstTripAt,
        bonusAmount: r.bonusAmount,
        bonusPaid: !!r.bonusPaidAt,
      }
    })

    const totalBonus = referrals.reduce((sum, r) => sum + r.bonusAmount, 0)
    const completedFirstTrips = referrals.filter((r) => r.firstTripAt).length

    return Response.json({
      success: true,
      data: {
        code: referralCode.code,
        stats: {
          totalReferrals: referrals.length,
          completedFirstTrips,
          totalBonusEarned: totalBonus,
        },
        referrals: referralList,
      },
    })
  } catch (error) {
    console.error("GET /api/referrals error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Generate a new referral code
    const code = `TC-${session.user.id.slice(-4).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`

    const referralCode = await prisma.referralCode.upsert({
      where: { userId: session.user.id },
      update: { code },
      create: {
        userId: session.user.id,
        code,
      },
    })

    return Response.json({
      success: true,
      data: { code: referralCode.code },
    })
  } catch (error) {
    console.error("POST /api/referrals error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
