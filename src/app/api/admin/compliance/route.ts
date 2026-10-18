import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextRequest } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as any).role !== "ADMIN") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Get documents with metadata containing expiryDate within next 30 days
    // For demo purposes, we fetch all documents and simulate expiry dates
    const allDocuments = await prisma.document.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Simulate expiry dates based on document creation + 1 year
    const expiringDocs = allDocuments
      .map((doc) => {
        const createdDate = new Date(doc.createdAt)
        const expiryDate = new Date(createdDate.getTime() + 365 * 24 * 60 * 60 * 1000)
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        return {
          id: doc.id,
          type: doc.type,
          fileName: doc.fileName,
          status: doc.status,
          userId: doc.userId,
          userName: doc.user.name || "Unknown",
          userEmail: doc.user.email,
          expiryDate: expiryDate.toISOString(),
          daysRemaining,
          createdAt: doc.createdAt,
        }
      })
      .filter((doc) => doc.daysRemaining <= 30 && doc.daysRemaining > -30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)

    // Stats
    const totalVerified = allDocuments.filter((d) => d.status === "VERIFIED").length
    const pendingReview = allDocuments.filter((d) => d.status === "PENDING").length
    const expired = allDocuments.filter((d) => d.status === "EXPIRED").length

    // Recent audit log (use notifications of verification type as audit trail)
    const auditLog = await prisma.notification.findMany({
      where: {
        type: { in: ["APPROVAL_APPROVED", "APPROVAL_REJECTED", "DOC_VERIFIED", "DOC_REJECTED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true } },
      },
    })

    return Response.json({
      success: true,
      data: {
        expiringDocuments: expiringDocs,
        stats: {
          totalVerified,
          pendingReview,
          expired,
          totalDocuments: allDocuments.length,
        },
        auditLog: auditLog.map((entry) => ({
          id: entry.id,
          action: entry.type,
          title: entry.title,
          body: entry.body,
          userName: entry.user.name,
          createdAt: entry.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error("GET /api/admin/compliance error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if ((session.user as any).role !== "ADMIN") {
      return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { documentId, action, notes } = body

    if (!documentId || !action) {
      return Response.json(
        { success: false, error: "documentId and action are required" },
        { status: 400 }
      )
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { user: { select: { id: true, name: true } } },
    })

    if (!document) {
      return Response.json({ success: false, error: "Document not found" }, { status: 404 })
    }

    const newStatus = action === "verify" ? "VERIFIED" : "REJECTED"

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: newStatus as any,
        verifiedAt: action === "verify" ? new Date() : undefined,
      },
    })

    // Create audit notification
    await prisma.notification.create({
      data: {
        userId: document.userId,
        type: action === "verify" ? "DOC_VERIFIED" : "DOC_REJECTED",
        title: action === "verify" ? "Document Verified" : "Document Needs Re-upload",
        body:
          action === "verify"
            ? `Your ${document.type.replace(/_/g, " ")} has been verified.`
            : `Your ${document.type.replace(/_/g, " ")} needs to be re-uploaded. ${notes || ""}`,
        data: { documentId, action, notes, reviewedBy: session.user!.id },
      },
    })

    return Response.json({ success: true, data: { action, documentId } })
  } catch (error) {
    console.error("POST /api/admin/compliance error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
