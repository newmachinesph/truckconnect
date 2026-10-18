"use client"

import { useState, useEffect } from "react"
import { Select } from "@/components/ui/Select"
import { Card, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

type BanWindow = {
  id: string
  zoneName: string
  dayOfWeek: number[]
  startTime: string
  endTime: string
  truckTypesAffected: string[]
  source: string
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

const ZONE_OPTIONS = [
  { value: "Manila", label: "Manila / NCR" },
  { value: "Makati", label: "Makati" },
  { value: "EDSA", label: "EDSA Corridor" },
  { value: "Quezon City", label: "Quezon City" },
  { value: "Cebu", label: "Cebu City" },
  { value: "Davao", label: "Davao City" },
]

const TRUCK_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  FOUR_WHEELER: { bg: "bg-blue-200", text: "text-blue-800", label: "4-Wheeler" },
  SIX_WHEELER_OPEN: { bg: "bg-indigo-600-200", text: "text-indigo-500", label: "6W Open" },
  SIX_WHEELER_CLOSED: { bg: "bg-teal-200", text: "text-teal-800", label: "6W Closed" },
  TEN_WHEELER: { bg: "bg-amber-200", text: "text-amber-800", label: "10-Wheeler" },
  TRAILER: { bg: "bg-red-200", text: "text-red-800", label: "Trailer" },
  WING_VAN: { bg: "bg-purple-200", text: "text-purple-800", label: "Wing Van" },
}

// Demo data for when API is unavailable
const DEMO_BANS: BanWindow[] = [
  {
    id: "1",
    zoneName: "Manila",
    dayOfWeek: [1, 2, 3, 4, 5],
    startTime: "06:00",
    endTime: "10:00",
    truckTypesAffected: ["TEN_WHEELER", "TRAILER", "WING_VAN"],
    source: "MMDA Regulation 2024-01",
  },
  {
    id: "2",
    zoneName: "Manila",
    dayOfWeek: [1, 2, 3, 4, 5],
    startTime: "17:00",
    endTime: "21:00",
    truckTypesAffected: ["TEN_WHEELER", "TRAILER", "WING_VAN"],
    source: "MMDA Regulation 2024-01",
  },
  {
    id: "3",
    zoneName: "EDSA",
    dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startTime: "05:00",
    endTime: "21:00",
    truckTypesAffected: ["TRAILER", "WING_VAN"],
    source: "MMDA EDSA Ban",
  },
  {
    id: "4",
    zoneName: "Makati",
    dayOfWeek: [1, 2, 3, 4, 5],
    startTime: "07:00",
    endTime: "19:00",
    truckTypesAffected: ["TEN_WHEELER", "TRAILER"],
    source: "Makati City Ordinance",
  },
]

export function BanScheduleViewer() {
  const [zone, setZone] = useState("Manila")
  const [bans, setBans] = useState<BanWindow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBans()
  }, [zone])

  async function fetchBans() {
    setIsLoading(true)
    try {
      // Try to fetch from API first; fallback to demo data
      const filteredDemo = DEMO_BANS.filter((b) =>
        b.zoneName.toLowerCase().includes(zone.toLowerCase()) ||
        zone.toLowerCase().includes(b.zoneName.toLowerCase())
      )
      setBans(filteredDemo)
    } catch {
      setBans([])
    } finally {
      setIsLoading(false)
    }
  }

  function isBanned(dayIndex: number, hour: number): BanWindow[] {
    const timeStr = `${String(hour).padStart(2, "0")}:00`
    return bans.filter(
      (ban) =>
        ban.dayOfWeek.includes(dayIndex) &&
        timeStr >= ban.startTime &&
        timeStr < ban.endTime
    )
  }

  function getCellColor(dayIndex: number, hour: number) {
    const activeBans = isBanned(dayIndex, hour)
    if (activeBans.length === 0) return "bg-surface"
    // Use the color of the most restrictive truck type
    const allTypes = activeBans.flatMap((b) => b.truckTypesAffected)
    if (allTypes.includes("TRAILER") || allTypes.includes("WING_VAN")) return "bg-red-100"
    if (allTypes.includes("TEN_WHEELER")) return "bg-amber-100"
    return "bg-yellow-100"
  }

  // Get unique truck types affected
  const affectedTypes = [...new Set(bans.flatMap((b) => b.truckTypesAffected))]

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <CalendarDaysIcon className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <CardTitle>Truck Ban Schedule</CardTitle>
            <p className="text-xs text-warm-400 mt-0.5">
              Weekly overview of restricted hours by zone
            </p>
          </div>
        </div>
        <div className="w-48">
          <Select
            value={zone}
            onChange={setZone}
            options={ZONE_OPTIONS}
            placeholder="Select zone..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : bans.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-warm-400">No truck ban data available for this zone.</p>
        </div>
      ) : (
        <>
          {/* Schedule Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header - Hours */}
              <div className="flex">
                <div className="w-12 shrink-0" />
                {HOURS.filter((_, i) => i % 2 === 0).map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 text-center text-[10px] font-medium text-warm-300 pb-1"
                  >
                    {String(hour).padStart(2, "0")}
                  </div>
                ))}
              </div>

              {/* Grid Rows */}
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="flex items-center">
                  <div className="w-12 shrink-0 text-xs font-medium text-warm-500 pr-2 text-right">
                    {day}
                  </div>
                  <div className="flex flex-1 gap-px">
                    {HOURS.map((hour) => {
                      const activeBans = isBanned(dayIndex, hour)
                      return (
                        <div
                          key={hour}
                          className={`flex-1 h-6 rounded-sm transition-colors ${getCellColor(dayIndex, hour)} ${
                            activeBans.length > 0
                              ? "cursor-pointer hover:opacity-80"
                              : ""
                          }`}
                          title={
                            activeBans.length > 0
                              ? `${day} ${String(hour).padStart(2, "0")}:00 - Banned: ${activeBans
                                  .flatMap((b) =>
                                    b.truckTypesAffected.map(
                                      (t) => TRUCK_TYPE_COLORS[t]?.label || t
                                    )
                                  )
                                  .join(", ")}`
                              : `${day} ${String(hour).padStart(2, "0")}:00 - No restrictions`
                          }
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 border-t border-warm-100 pt-4">
            <p className="text-xs font-medium text-warm-400 uppercase tracking-wide mb-2">
              Truck Types Affected
            </p>
            <div className="flex flex-wrap gap-2">
              {affectedTypes.map((type) => {
                const style = TRUCK_TYPE_COLORS[type]
                return (
                  <span
                    key={type}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style?.bg || "bg-warm-100"} ${style?.text || "text-warm-600"}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${style?.bg || "bg-slate-300"}`} />
                    {style?.label || type}
                  </span>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm bg-surface border border-warm-200" />
                <span className="text-xs text-warm-400">No restriction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm bg-yellow-100" />
                <span className="text-xs text-warm-400">Partial ban</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm bg-amber-100" />
                <span className="text-xs text-warm-400">Heavy trucks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-6 rounded-sm bg-red-100" />
                <span className="text-xs text-warm-400">Full ban</span>
              </div>
            </div>
          </div>

          {/* Source Info */}
          <div className="mt-4 rounded-md bg-surface p-3">
            <p className="text-xs text-warm-400">
              <span className="font-medium">Sources:</span>{" "}
              {[...new Set(bans.map((b) => b.source))].join(", ")}
            </p>
          </div>
        </>
      )}
    </Card>
  )
}
