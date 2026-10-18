import { TruckType } from "@prisma/client"
import { prisma } from "./db"

export interface TruckBanCheck {
  isBanned: boolean
  conflicts: TruckBanConflict[]
  suggestedWindows: SuggestedWindow[]
}

export interface TruckBanConflict {
  zoneName: string
  startTime: string
  endTime: string
  source: string
}

export interface SuggestedWindow {
  label: string
  startTime: string
  endTime: string
}

export async function checkTruckBan(
  zoneName: string,
  dateTime: Date,
  truckType: TruckType
): Promise<TruckBanCheck> {
  const dayOfWeek = dateTime.getDay() // 0=Sunday
  const timeStr = dateTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  })

  const bans = await prisma.truckBanWindow.findMany({
    where: {
      isActive: true,
      dayOfWeek: { has: dayOfWeek },
      truckTypesAffected: { has: truckType },
    },
  })

  const conflicts: TruckBanConflict[] = []
  const suggestedWindows: SuggestedWindow[] = []

  for (const ban of bans) {
    // Check if zone matches (case-insensitive partial match)
    if (!ban.zoneName.toLowerCase().includes(zoneName.toLowerCase()) &&
        !zoneName.toLowerCase().includes(ban.zoneName.toLowerCase())) {
      continue
    }

    if (timeStr >= ban.startTime && timeStr < ban.endTime) {
      conflicts.push({
        zoneName: ban.zoneName,
        startTime: ban.startTime,
        endTime: ban.endTime,
        source: ban.source,
      })

      // Suggest windows before and after the ban
      suggestedWindows.push(
        {
          label: `Before ban (${ban.zoneName})`,
          startTime: subtractHour(ban.startTime),
          endTime: ban.startTime,
        },
        {
          label: `After ban (${ban.zoneName})`,
          startTime: ban.endTime,
          endTime: addHour(ban.endTime),
        }
      )
    }
  }

  return {
    isBanned: conflicts.length > 0,
    conflicts,
    suggestedWindows,
  }
}

function subtractHour(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const newH = h <= 0 ? 23 : h - 1
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const newH = h >= 23 ? 0 : h + 1
  return `${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export async function getAllBansForZone(zoneName: string) {
  return prisma.truckBanWindow.findMany({
    where: {
      isActive: true,
      zoneName: { contains: zoneName, mode: "insensitive" },
    },
  })
}
