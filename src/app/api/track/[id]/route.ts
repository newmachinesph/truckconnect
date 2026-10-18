import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { id },
        { waybillNumber: id },
      ],
    },
    include: {
      load: true,
      truckerProfile: {
        include: { user: { select: { name: true } } },
      },
      trackingPoints: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const lastPoint = booking.trackingPoints[0]

  return NextResponse.json({
    success: true,
    data: {
      bookingId: booking.id,
      waybillNumber: booking.waybillNumber,
      status: booking.status,
      originAddress: booking.load.originAddress,
      originLat: booking.load.originLat,
      originLng: booking.load.originLng,
      destAddress: booking.load.destAddress,
      destLat: booking.load.destLat,
      destLng: booking.load.destLng,
      cargoType: booking.load.cargoType,
      pickupDate: booking.load.pickupDate.toISOString(),
      truckerName: booking.truckerProfile.user.name ?? "Carrier",
      lastUpdate: lastPoint?.timestamp?.toISOString() ?? booking.updatedAt.toISOString(),
      estimatedArrival: null,
    },
  })
}
