"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatPeso, timeAgo } from "@/lib/utils"
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline"

type Stats = {
  users: {
    total: number
    totalShippers: number
    totalTruckers: number
    totalAdmins: number
    activeTruckers: number
    activeShippers: number
  }
  loads: {
    total: number
    open: number
    booked: number
    inTransit: number
    delivered: number
    cancelled: number
  }
  bookings: {
    total: number
    confirmed: number
    inTransit: number
    delivered: number
    completed: number
    cancelled: number
    disputed: number
  }
  revenue: {
    totalPlatformFees: number
  }
  recentActivity: {
    loadsLast24h: number
    loadsLast7d: number
    bookingsLast24h: number
    bookingsLast7d: number
  }
}

type BookingRow = {
  id: string
  waybillNumber: string
  status: string
  agreedRate: number
  createdAt: string
  load: {
    originAddress: string
    destAddress: string
    shipperProfile: {
      user: { name: string | null }
    }
  }
  truckerProfile: {
    user: { name: string | null }
  }
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<BookingRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/bookings?limit=10"),
        ])
        const statsData = await statsRes.json()
        const bookingsData = await bookingsRes.json()

        if (statsData.success) {
          setStats(statsData.data)
        }
        if (bookingsData.success) {
          setRecentBookings(bookingsData.data || [])
        }
      } catch {
        // Silently handle errors
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-warm-200 rounded" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-warm-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-warm-200 rounded-lg" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.users.total ?? 0,
      icon: UsersIcon,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
      detail: `${stats?.users.totalShippers ?? 0} shippers, ${stats?.users.totalTruckers ?? 0} truckers`,
    },
    {
      label: "Active Loads",
      value: (stats?.loads.open ?? 0) + (stats?.loads.booked ?? 0) + (stats?.loads.inTransit ?? 0),
      icon: ClipboardDocumentListIcon,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-600",
      detail: `${stats?.loads.open ?? 0} open, ${stats?.loads.inTransit ?? 0} in transit`,
    },
    {
      label: "Revenue",
      value: formatPeso(stats?.revenue.totalPlatformFees ?? 0),
      icon: CurrencyDollarIcon,
      iconBg: "bg-indigo-600-50",
      iconColor: "text-indigo-600",
      valueColor: "text-indigo-600",
      detail: "Platform fees collected",
    },
    {
      label: "Completed Deliveries",
      value: (stats?.bookings.delivered ?? 0) + (stats?.bookings.completed ?? 0),
      icon: CheckCircleIcon,
      iconBg: "bg-warm-100",
      iconColor: "text-warm-500",
      valueColor: "text-warm-800",
      detail: `${stats?.bookings.disputed ?? 0} disputed`,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-warm-800">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-warm-400">
          Platform overview and management.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className={`mt-2 text-2xl font-bold ${stat.valueColor}`}>
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-warm-300">{stat.detail}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity Summary */}
      {stats?.recentActivity && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white border border-warm-200 rounded-lg p-4 text-center">
            <p className="font-display text-2xl font-bold text-warm-800">{stats.recentActivity.loadsLast24h}</p>
            <p className="text-xs text-warm-400">Loads (24h)</p>
          </div>
          <div className="bg-white border border-warm-200 rounded-lg p-4 text-center">
            <p className="font-display text-2xl font-bold text-warm-800">{stats.recentActivity.loadsLast7d}</p>
            <p className="text-xs text-warm-400">Loads (7d)</p>
          </div>
          <div className="bg-white border border-warm-200 rounded-lg p-4 text-center">
            <p className="font-display text-2xl font-bold text-warm-800">{stats.recentActivity.bookingsLast24h}</p>
            <p className="text-xs text-warm-400">Bookings (24h)</p>
          </div>
          <div className="bg-white border border-warm-200 rounded-lg p-4 text-center">
            <p className="font-display text-2xl font-bold text-warm-800">{stats.recentActivity.bookingsLast7d}</p>
            <p className="text-xs text-warm-400">Bookings (7d)</p>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
        <Link href="/admin/users">
          <Card interactive className="hover:border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-800">Manage Users</p>
                <p className="text-xs text-warm-400">{stats?.users.total ?? 0} total users</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/bookings">
          <Card interactive className="hover:border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <ClipboardDocumentListIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-800">Manage Bookings</p>
                <p className="text-xs text-warm-400">{stats?.bookings.total ?? 0} total bookings</p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/users?role=TRUCKER">
          <Card interactive className="hover:border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-600-50">
                <TruckIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-800">Verify Truckers</p>
                <p className="text-xs text-warm-400">{stats?.users.activeTruckers ?? 0} active truckers</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Bookings Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Bookings</CardTitle>
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <EmptyState
            icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
            title="No bookings yet"
            description="Bookings will appear here once shippers and truckers start transacting."
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-100 text-left">
                  <th className="pb-3 font-medium text-warm-400">Waybill</th>
                  <th className="pb-3 font-medium text-warm-400">Shipper</th>
                  <th className="pb-3 font-medium text-warm-400">Trucker</th>
                  <th className="pb-3 font-medium text-warm-400">Route</th>
                  <th className="pb-3 font-medium text-warm-400">Amount</th>
                  <th className="pb-3 font-medium text-warm-400">Status</th>
                  <th className="pb-3 font-medium text-warm-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-surface">
                    <td className="py-3 font-mono text-xs text-warm-500">
                      {booking.waybillNumber.slice(0, 8)}...
                    </td>
                    <td className="py-3 text-warm-800">
                      {booking.load.shipperProfile?.user?.name || "N/A"}
                    </td>
                    <td className="py-3 text-warm-800">
                      {booking.truckerProfile?.user?.name || "N/A"}
                    </td>
                    <td className="py-3 text-warm-500 max-w-[200px] truncate">
                      {booking.load.originAddress} &rarr; {booking.load.destAddress}
                    </td>
                    <td className="py-3 font-semibold text-warm-800">
                      {formatPeso(booking.agreedRate)}
                    </td>
                    <td className="py-3">
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-warm-400 text-xs">
                      {timeAgo(booking.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
