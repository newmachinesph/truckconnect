"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { formatPeso } from "@/lib/utils"
import {
  BanknotesIcon,
  TruckIcon,
  ChartBarIcon,
  MapPinIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline"

type TruckerAnalytics = {
  summary: {
    totalEarnings: number
    activeBookings: number
    utilizationPercent: number
    revenuePerKm: number
  }
  monthlyEarnings: { month: string; amount: number }[]
  topRoutes: { origin: string; dest: string; trips: number; totalEarned: number }[]
  fleetUtilization: { plateNumber: string; truckType: string; trips: number; idleDays: number; revenue: number }[]
}

export default function TruckerAnalyticsPage() {
  const [data, setData] = useState<TruckerAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics/trucker")
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  async function handleExport() {
    setIsExporting(true)
    try {
      const res = await fetch("/api/analytics/export?type=trucker")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "truckconnect-trucker-export.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const analytics: TruckerAnalytics = data || {
    summary: { totalEarnings: 890000, activeBookings: 3, utilizationPercent: 72, revenuePerKm: 45 },
    monthlyEarnings: [
      { month: "Oct 25", amount: 120000 },
      { month: "Nov 25", amount: 155000 },
      { month: "Dec 25", amount: 140000 },
      { month: "Jan 26", amount: 175000 },
      { month: "Feb 26", amount: 160000 },
      { month: "Mar 26", amount: 140000 },
    ],
    topRoutes: [
      { origin: "Manila", dest: "Cebu City", trips: 12, totalEarned: 264000 },
      { origin: "Manila", dest: "Davao City", trips: 8, totalEarned: 240000 },
      { origin: "Cebu City", dest: "Cagayan de Oro", trips: 6, totalEarned: 90000 },
    ],
    fleetUtilization: [
      { plateNumber: "ABC 1234", truckType: "TEN WHEELER", trips: 18, idleDays: 8, revenue: 540000 },
      { plateNumber: "XYZ 5678", truckType: "SIX WHEELER CLOSED", trips: 12, idleDays: 12, revenue: 350000 },
    ],
  }

  const maxEarning = Math.max(...analytics.monthlyEarnings.map((m) => m.amount), 1)

  const statCards = [
    {
      label: "Total Earnings",
      value: formatPeso(analytics.summary.totalEarnings),
      icon: BanknotesIcon,
      iconBg: "bg-indigo-600-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Active Bookings",
      value: analytics.summary.activeBookings.toString(),
      icon: TruckIcon,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Utilization",
      value: `${analytics.summary.utilizationPercent}%`,
      icon: ChartBarIcon,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Revenue/km",
      value: formatPeso(analytics.summary.revenuePerKm),
      icon: MapPinIcon,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">Trucker Analytics</h1>
          <p className="mt-1 text-sm text-warm-400">
            Track your earnings, fleet performance, and popular routes.
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport} isLoading={isExporting}>
          <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-warm-800">{stat.value}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Earnings by Month Chart */}
      <Card className="mb-8">
        <CardTitle className="mb-6">Monthly Earnings</CardTitle>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48">
            {analytics.monthlyEarnings.map((m) => {
              const heightPct = maxEarning > 0 ? (m.amount / maxEarning) * 100 : 0
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-warm-600">
                    {formatPeso(m.amount)}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-12 bg-indigo-600 rounded-t-md transition-all duration-500 hover:bg-indigo-500"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-xs text-warm-400">{m.month}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Routes */}
        <Card>
          <CardTitle className="mb-4">Top Routes</CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200">
                    <th className="text-left py-2 text-xs font-medium text-warm-400 uppercase">Route</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Trips</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {analytics.topRoutes.map((route, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="py-2.5 font-medium text-warm-800">
                        {route.origin} &rarr; {route.dest}
                      </td>
                      <td className="py-2.5 text-right text-warm-500">{route.trips}</td>
                      <td className="py-2.5 text-right text-indigo-500 font-medium">
                        {formatPeso(route.totalEarned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.topRoutes.length === 0 && (
                <p className="text-center text-sm text-warm-300 py-6">No route data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fleet Utilization */}
        <Card>
          <CardTitle className="mb-4">Fleet Utilization</CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200">
                    <th className="text-left py-2 text-xs font-medium text-warm-400 uppercase">Truck</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Trips</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Idle</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {analytics.fleetUtilization.map((truck, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="py-2.5">
                        <p className="font-medium text-warm-800">{truck.plateNumber}</p>
                        <p className="text-xs text-warm-400">{truck.truckType}</p>
                      </td>
                      <td className="py-2.5 text-right text-warm-500">{truck.trips}</td>
                      <td className="py-2.5 text-right">
                        <span className={truck.idleDays > 15 ? "text-red-600 font-medium" : "text-warm-500"}>
                          {truck.idleDays}d
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-indigo-500 font-medium">
                        {formatPeso(truck.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.fleetUtilization.length === 0 && (
                <p className="text-center text-sm text-warm-300 py-6">No fleet data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
