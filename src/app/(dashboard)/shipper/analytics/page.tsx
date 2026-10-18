"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { formatPeso } from "@/lib/utils"
import {
  CurrencyDollarIcon,
  TruckIcon,
  CalculatorIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline"

type ShipperAnalytics = {
  summary: {
    totalSpend: number
    activeLoads: number
    avgCostPerLoad: number
    onTimePercent: number
  }
  monthlySpend: { month: string; amount: number }[]
  topCarriers: { name: string; trips: number; totalSpend: number; avgRating: string }[]
  routeFrequency: { origin: string; dest: string; count: number; avgCost: number }[]
}

export default function ShipperAnalyticsPage() {
  const [data, setData] = useState<ShipperAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics/shipper")
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
      const res = await fetch("/api/analytics/export?type=shipper")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "truckconnect-shipper-export.csv"
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

  // Demo fallback data
  const analytics: ShipperAnalytics = data || {
    summary: { totalSpend: 1250000, activeLoads: 8, avgCostPerLoad: 18750, onTimePercent: 87 },
    monthlySpend: [
      { month: "Oct 25", amount: 180000 },
      { month: "Nov 25", amount: 220000 },
      { month: "Dec 25", amount: 195000 },
      { month: "Jan 26", amount: 240000 },
      { month: "Feb 26", amount: 210000 },
      { month: "Mar 26", amount: 205000 },
    ],
    topCarriers: [
      { name: "Santos Trucking", trips: 24, totalSpend: 450000, avgRating: "4.8" },
      { name: "Manila Express", trips: 18, totalSpend: 337500, avgRating: "4.6" },
      { name: "Visayas Freight", trips: 12, totalSpend: 225000, avgRating: "4.5" },
    ],
    routeFrequency: [
      { origin: "Manila", dest: "Cebu City", count: 15, avgCost: 22000 },
      { origin: "Manila", dest: "Davao City", count: 10, avgCost: 35000 },
      { origin: "Cebu City", dest: "Cagayan de Oro", count: 8, avgCost: 15000 },
    ],
  }

  const maxSpend = Math.max(...analytics.monthlySpend.map((m) => m.amount), 1)

  const statCards = [
    {
      label: "Total Spend",
      value: formatPeso(analytics.summary.totalSpend),
      icon: CurrencyDollarIcon,
      iconBg: "bg-indigo-600-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Active Loads",
      value: analytics.summary.activeLoads.toString(),
      icon: TruckIcon,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Avg Cost/Load",
      value: formatPeso(analytics.summary.avgCostPerLoad),
      icon: CalculatorIcon,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "On-Time Delivery",
      value: `${analytics.summary.onTimePercent}%`,
      icon: ClockIcon,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">Shipper Analytics</h1>
          <p className="mt-1 text-sm text-warm-400">
            Track your shipping performance and spending.
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

      {/* Spend by Month Chart */}
      <Card className="mb-8">
        <CardTitle className="mb-6">Monthly Spend</CardTitle>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-48">
            {analytics.monthlySpend.map((m) => {
              const heightPct = maxSpend > 0 ? (m.amount / maxSpend) * 100 : 0
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
        {/* Top Carriers */}
        <Card>
          <CardTitle className="mb-4">Top Carriers</CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200">
                    <th className="text-left py-2 text-xs font-medium text-warm-400 uppercase">Carrier</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Trips</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Spend</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {analytics.topCarriers.map((carrier, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="py-2.5 font-medium text-warm-800">{carrier.name}</td>
                      <td className="py-2.5 text-right text-warm-500">{carrier.trips}</td>
                      <td className="py-2.5 text-right text-warm-500">{formatPeso(carrier.totalSpend)}</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {carrier.avgRating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.topCarriers.length === 0 && (
                <p className="text-center text-sm text-warm-300 py-6">No carrier data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route Frequency */}
        <Card>
          <CardTitle className="mb-4">Route Frequency</CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200">
                    <th className="text-left py-2 text-xs font-medium text-warm-400 uppercase">Route</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Count</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Avg Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {analytics.routeFrequency.map((route, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="py-2.5 font-medium text-warm-800">
                        {route.origin} &rarr; {route.dest}
                      </td>
                      <td className="py-2.5 text-right text-warm-500">{route.count}</td>
                      <td className="py-2.5 text-right text-warm-500">{formatPeso(route.avgCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {analytics.routeFrequency.length === 0 && (
                <p className="text-center text-sm text-warm-300 py-6">No route data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
