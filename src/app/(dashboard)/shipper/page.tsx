"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { SkeletonDashboard } from "@/components/ui/Skeleton"
import { formatPeso, timeAgo } from "@/lib/utils"
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  PlusCircleIcon,
  TruckIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline"
import type { Load } from "@/types"

type DashboardStats = {
  activeLoads: number
  pendingBookings: number
  completed: number
  totalSpent: number
}

export default function ShipperDashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    activeLoads: 0,
    pendingBookings: 0,
    completed: 0,
    totalSpent: 0,
  })
  const [recentLoads, setRecentLoads] = useState<Load[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [loadsRes, bookingsRes] = await Promise.all([
          fetch("/api/loads"),
          fetch("/api/bookings"),
        ])
        const loadsData = await loadsRes.json()
        const bookingsData = await bookingsRes.json()

        const loads: Load[] = loadsData.data || loadsData || []
        const bookings = bookingsData.data || bookingsData || []

        const completedBookings = bookings.filter(
          (b: { status: string }) => b.status === "DELIVERED" || b.status === "COMPLETED"
        )
        const totalSpent = completedBookings.reduce(
          (sum: number, b: { agreedRate?: number }) => sum + (b.agreedRate || 0),
          0
        )

        setStats({
          activeLoads: loads.filter((l: Load) => l.status === "OPEN").length,
          pendingBookings: bookings.filter(
            (b: { status: string }) => b.status === "CONFIRMED" || b.status === "IN_TRANSIT"
          ).length,
          completed: completedBookings.length,
          totalSpent,
        })

        setRecentLoads(loads.slice(0, 5))
      } catch {
        // Silently handle errors, stats stay at 0
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    {
      label: "Active Loads",
      value: stats.activeLoads,
      icon: ClipboardDocumentListIcon,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
    },
    {
      label: "Pending Bookings",
      value: stats.pendingBookings,
      icon: ClockIcon,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-amber-600",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircleIcon,
      iconBg: "bg-indigo-600-50",
      iconColor: "text-indigo-600",
      valueColor: "text-indigo-600",
    },
    {
      label: "Total Spent",
      value: formatPeso(stats.totalSpent),
      icon: CurrencyDollarIcon,
      iconBg: "bg-warm-100",
      iconColor: "text-warm-500",
      valueColor: "text-warm-800",
      isMonetary: true,
    },
  ]

  if (isLoading) {
    return <SkeletonDashboard />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-warm-800">
          Welcome back, {session?.user?.name || "Shipper"}
        </h1>
        <p className="mt-1 text-sm text-warm-400">
          Here&apos;s an overview of your shipping activity.
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
              </div>
              <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Post Load CTA + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Quick Post Load CTA */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-600 text-white relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-20 w-20 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mb-4">
              <PlusCircleIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Quick Post a Load</h3>
            <p className="text-sm text-indigo-600-light mb-5">
              Get your cargo moving fast. Post a load and receive trucker bids within minutes.
            </p>
            <Link href="/shipper/post-load">
              <Button
                variant="secondary"
                className="bg-white text-indigo-500 hover:bg-indigo-500-50 border-white"
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Post a Load
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex items-center gap-1 text-xs text-warm-300">
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
              <span>Last 7 days</span>
            </div>
          </div>

          {recentLoads.length === 0 ? (
            <EmptyState
              icon={<TruckIcon className="h-6 w-6" />}
              title="No activity yet"
              description="Post your first load to start tracking activity here."
              size="sm"
            />
          ) : (
            <div className="space-y-3">
              {recentLoads.slice(0, 4).map((load) => (
                <div
                  key={load.id}
                  className="flex items-center gap-3 rounded-lg border border-warm-100 p-3 hover:border-warm-200 transition-colors"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface">
                    <TruckIcon className="h-4 w-4 text-warm-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {load.originAddress} &rarr; {load.destAddress}
                    </p>
                    <p className="text-xs text-warm-400">
                      {load.preferredTruck?.replace(/_/g, " ")} &middot; {timeAgo(load.createdAt)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(load.status)} className="flex-shrink-0">
                    {load.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Loads Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent Loads</CardTitle>
          <Link href="/shipper/my-loads">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {recentLoads.length === 0 ? (
          <EmptyState
            icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
            title="No loads posted"
            description="Post your first load to get started and find truckers."
            action={
              <Link href="/shipper/post-load">
                <Button size="sm">
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Post a Load
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-warm-100">
            {recentLoads.map((load) => (
              <div key={load.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-warm-800 truncate">
                    {load.originAddress} &rarr; {load.destAddress}
                  </p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {load.preferredTruck?.replace(/_/g, " ")} &middot; {timeAgo(load.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-semibold text-warm-800">
                    {formatPeso(load.rateEstimate ?? 0)}
                  </span>
                  <Badge variant={getStatusVariant(load.status)}>
                    {load.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
