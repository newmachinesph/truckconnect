import { NextRequest } from "next/server"
import { checkTruckBan } from "@/lib/truck-bans"
import { TruckType } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const zoneName = searchParams.get("zoneName")
    const dateTime = searchParams.get("dateTime")
    const truckType = searchParams.get("truckType") as TruckType | null

    if (!zoneName || !dateTime || !truckType) {
      return Response.json(
        {
          success: false,
          error: "zoneName, dateTime, and truckType query parameters are required",
        },
        { status: 400 }
      )
    }

    const validTruckTypes: TruckType[] = [
      "FOUR_WHEELER",
      "SIX_WHEELER_OPEN",
      "SIX_WHEELER_CLOSED",
      "TEN_WHEELER",
      "TRAILER",
      "WING_VAN",
    ]

    if (!validTruckTypes.includes(truckType)) {
      return Response.json(
        { success: false, error: "Invalid truck type" },
        { status: 400 }
      )
    }

    const parsedDate = new Date(dateTime)
    if (isNaN(parsedDate.getTime())) {
      return Response.json(
        { success: false, error: "Invalid dateTime format" },
        { status: 400 }
      )
    }

    const result = await checkTruckBan(zoneName, parsedDate, truckType)

    return Response.json({ success: true, data: result })
  } catch (error) {
    console.error("GET /api/truck-bans error:", error)
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
