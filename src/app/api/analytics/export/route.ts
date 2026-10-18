import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const type = searchParams.get("type") || "shipper"

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

    let csvContent = ""

    if (type === "shipper" && user.shipperProfile) {
      const loads = await prisma.load.findMany({
        where: { shipperProfileId: user.shipperProfile.id },
        include: {
          booking: {
            include: {
              truckerProfile: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      csvContent = "Date,Origin,Destination,Cargo Type,Weight (tons),Status,Carrier,Agreed Rate,Platform Fee\n"
      for (const load of loads) {
        const date = new Date(load.createdAt).toLocaleDateString("en-PH")
        const carrier = load.booking?.truckerProfile?.user?.name || ""
        const rate = load.booking?.agreedRate || ""
        const fee = load.booking?.platformFeeShipper || ""
        csvContent += `"${date}","${load.originAddress}","${load.destAddress}","${load.cargoType}",${load.weightTons},"${load.status}","${carrier}",${rate},${fee}\n`
      }
    } else if (type === "trucker" && user.truckerProfile) {
      const bookings = await prisma.booking.findMany({
        where: { truckerProfileId: user.truckerProfile.id },
        include: {
          load: {
            include: {
              shipperProfile: {
                include: { user: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      csvContent = "Date,Origin,Destination,Shipper,Agreed Rate,Platform Fee,Net Earnings,Status\n"
      for (const b of bookings) {
        const date = new Date(b.createdAt).toLocaleDateString("en-PH")
        const shipper = b.load?.shipperProfile?.user?.name || ""
        const net = b.agreedRate - b.platformFeeTrucker
        csvContent += `"${date}","${b.load.originAddress}","${b.load.destAddress}","${shipper}",${b.agreedRate},${b.platformFeeTrucker},${net},"${b.status}"\n`
      }
    } else if (type === "admin") {
      const bookings = await prisma.booking.findMany({
        include: {
          load: {
            include: {
              shipperProfile: {
                include: { user: { select: { name: true } } },
              },
            },
          },
          truckerProfile: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      })

      csvContent = "Date,Origin,Destination,Shipper,Carrier,Agreed Rate,Shipper Fee,Trucker Fee,Platform Revenue,Status\n"
      for (const b of bookings) {
        const date = new Date(b.createdAt).toLocaleDateString("en-PH")
        const shipper = b.load?.shipperProfile?.user?.name || ""
        const carrier = b.truckerProfile?.user?.name || ""
        const platformRev = b.platformFeeShipper + b.platformFeeTrucker
        csvContent += `"${date}","${b.load.originAddress}","${b.load.destAddress}","${shipper}","${carrier}",${b.agreedRate},${b.platformFeeShipper},${b.platformFeeTrucker},${platformRev},"${b.status}"\n`
      }
    } else {
      return Response.json(
        { success: false, error: "Invalid export type" },
        { status: 400 }
      )
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="truckconnect-${type}-export.csv"`,
      },
    })
  } catch (error) {
    console.error("GET /api/analytics/export error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
