"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { formatPeso } from "@/lib/utils"
import {
  CurrencyDollarIcon,
  UsersIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline"

type AdminAnalytics = {
  summary: {
    gmv: number
    activeUsers: number
    platformRevenue: number
    disputeRate: number
  }
  roleBreakdown: { role: string; count: number }[]
  topCorridors: { origin: string; dest: string; count: number; gmv: number }[]
  monthlyMetrics: { month: string; gmv: number; bookings: number; revenue: number }[]
}

const roleColors: Record<string, { bg: string; text: string }> = {
  SHIPPER: { bg: "bg-blue-500", text: "text-blue-700" },
  TRUCKER: { bg: "bg-indigo-600", text: "text-indigo-500" },
  ADMIN: { bg: "bg-amber-500", text: "text-amber-700" },
  UNSET: { bg: "bg-warm-300", text: "text-warm-500" },
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics/admin")
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
      const res = await fetch("/api/analytics/export?type=admin")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "truckconnect-admin-export.csv"
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

  const analytics: AdminAnalytics = data || {
    summary: { gmv: 8500000, activeUsers: 342, platformRevenue: 680000, disputeRate: 3 },
    roleBreakdown: [
      { role: "SHIPPER", count: 185 },
      { role: "TRUCKER", count: 150 },
      { role: "ADMIN", count: 7 },
    ],
    topCorridors: [
      { origin: "Manila", dest: "Cebu City", count: 120, gmv: 2640000 },
      { origin: "Manila", dest: "Davao City", count: 85, gmv: 2975000 },
      { origin: "Cebu City", dest: "Cagayan de Oro", count: 60, gmv: 900000 },
      { origin: "Manila", dest: "Iloilo City", count: 45, gmv: 990000 },
      { origin: "Davao City", dest: "General Santos", count: 35, gmv: 525000 },
    ],
    monthlyMetrics: [
      { month: "Oct 25", gmv: 1200000, bookings: 64, revenue: 96000 },
      { month: "Nov 25", gmv: 1400000, bookings: 75, revenue: 112000 },
      { month: "Dec 25", gmv: 1300000, bookings: 70, revenue: 104000 },
      { month: "Jan 26", gmv: 1600000, bookings: 86, revenue: 128000 },
      { month: "Feb 26", gmv: 1500000, bookings: 80, revenue: 120000 },
      { month: "Mar 26", gmv: 1500000, bookings: 78, revenue: 120000 },
    ],
  }

  const totalUsers = analytics.roleBreakdown.reduce((s, r) => s + r.count, 0)
  const maxGmv = Math.max(...analytics.monthlyMetrics.map((m) => m.gmv), 1)

  const statCards = [
    {
      label: "Gross Merchandise Value",
      value: formatPeso(analytics.summary.gmv),
      icon: CurrencyDollarIcon,
      iconBg: "bg-indigo-600-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Active Users",
      value: analytics.summary.activeUsers.toString(),
      icon: UsersIcon,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Platform Revenue",
      value: formatPeso(analytics.summary.platformRevenue),
      icon: BanknotesIcon,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Dispute Rate",
      value: `${analytics.summary.disputeRate}%`,
      icon: ExclamationTriangleIcon,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">Platform Analytics</h1>
          <p className="mt-1 text-sm text-warm-400">
            Overview of platform performance and key metrics.
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

      {/* Users by Role + Monthly GMV */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Users by Role Pie */}
        <Card>
          <CardTitle className="mb-4">Users by Role</CardTitle>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <div className="relative h-32 w-32">
                {/* Stacked bar visualization */}
                <div className="flex h-full rounded-lg overflow-hidden">
                  {analytics.roleBreakdown.map((role) => {
                    const pct = totalUsers > 0 ? (role.count / totalUsers) * 100 : 0
                    const colors = roleColors[role.role] || roleColors.UNSET
                    return (
                      <div
                        key={role.role}
                        className={`${colors.bg} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                        title={`${role.role}: ${role.count}`}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {analytics.roleBreakdown.map((role) => {
                const pct = totalUsers > 0 ? Math.round((role.count / totalUsers) * 100) : 0
                const colors = roleColors[role.role] || roleColors.UNSET
                return (
                  <div key={role.role} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${colors.bg}`} />
                      <span className="text-sm text-warm-600">{role.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-warm-800">{role.count}</span>
                      <span className="text-xs text-warm-300">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly GMV Chart */}
        <Card className="lg:col-span-2">
          <CardTitle className="mb-6">Monthly GMV</CardTitle>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {analytics.monthlyMetrics.map((m) => {
                const heightPct = maxGmv > 0 ? (m.gmv / maxGmv) * 100 : 0
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-warm-600">
                      {formatPeso(m.gmv)}
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
      </div>

      {/* Top Corridors + Monthly Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Corridors */}
        <Card>
          <CardTitle className="mb-4">Top Corridors</CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200">
                    <th className="text-left py-2 text-xs font-medium text-warm-400 uppercase">Corridor</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Bookings</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">GMV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {analytics.topCorridors.map((corridor, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="py-2.5 font-medium text-warm-800">
                        {corridor.origin} &rarr; {corridor.dest}
                      </td>
                      <td className="py-2.5 text-right text-warm-500">{corridor.count}</td>
                      <td className="py-2.5 text-right text-indigo-500 font-medium">
                        {formatPeso(corridor.gmv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary Table */}
        <Card>
          <CardTitle className="mb-4">Monthly Metrics</CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-200">
                    <th className="text-left py-2 text-xs font-medium text-warm-400 uppercase">Month</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Bookings</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">GMV</th>
                    <th className="text-right py-2 text-xs font-medium text-warm-400 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {analytics.monthlyMetrics.map((m, i) => (
                    <tr key={i} className="hover:bg-surface">
                      <td className="py-2.5 font-medium text-warm-800">{m.month}</td>
                      <td className="py-2.5 text-right text-warm-500">{m.bookings}</td>
                      <td className="py-2.5 text-right text-warm-500">{formatPeso(m.gmv)}</td>
                      <td className="py-2.5 text-right text-indigo-500 font-medium">
                        {formatPeso(m.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
