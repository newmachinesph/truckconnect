import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { claimNotes, claimPhotos } = body

    if (!claimNotes) {
      return Response.json(
        { success: false, error: "Claim description is required" },
        { status: 400 }
      )
    }

    const policy = await prisma.insurancePolicy.findUnique({ where: { id } })
    if (!policy) {
      return Response.json({ success: false, error: "Policy not found" }, { status: 404 })
    }

    if (policy.status !== "ACTIVE") {
      return Response.json(
        { success: false, error: "Claims can only be filed on active policies" },
        { status: 400 }
      )
    }

    const updated = await prisma.insurancePolicy.update({
      where: { id },
      data: {
        status: "CLAIMED",
        claimFiledAt: new Date(),
        claimNotes,
        claimPhotos: claimPhotos || [],
        claimStatus: "UNDER_REVIEW",
      },
    })

    return Response.json({ success: true, data: updated })
  } catch (error) {
    console.error("POST /api/insurance/[id]/claim error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
