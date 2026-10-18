"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Switch } from "@headlessui/react"
import { Card, CardTitle } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { SkeletonDashboard } from "@/components/ui/Skeleton"
import { cn, formatPeso, timeAgo } from "@/lib/utils"
import {
  TruckIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  SignalIcon,
} from "@heroicons/react/24/outline"
import type { Load } from "@/types"

export default function TruckerDashboardPage() {
  const { data: session } = useSession()
  const [loads, setLoads] = useState<Load[]>([])
  const [bookings, setBookings] = useState<{ status: string; agreedRate?: number; createdAt?: string }[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [loadsRes, bookingsRes] = await Promise.all([
          fetch("/api/loads?status=OPEN"),
          fetch("/api/bookings"),
        ])
        const loadsData = await loadsRes.json()
        const bookingsData = await bookingsRes.json()

        const loadsArr: Load[] = loadsData.data || loadsData || []
        const bookingsArr = bookingsData.data || bookingsData || []

        setLoads(loadsArr.slice(0, 5))
        setBookings(bookingsArr)
      } catch {
        // Handle silently
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  async function toggleAvailability(val: boolean) {
    setIsAvailable(val)
    try {
      await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: val }),
      })
    } catch {
      setIsAvailable(!val)
    }
  }

  const activeBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "IN_TRANSIT"
  )
  const completedBookings = bookings.filter(
    (b) => b.status === "DELIVERED" || b.status === "COMPLETED"
  )
  const totalEarnings = completedBookings.reduce(
    (sum, b) => sum + (b.agreedRate || 0),
    0
  )

  // Simulated breakdown for earnings display
  const weeklyEarnings = Math.round(totalEarnings * 0.15)
  const todayEarnings = Math.round(totalEarnings * 0.03)

  const earningsCards = [
    {
      label: "Today",
      value: formatPeso(todayEarnings),
      icon: CurrencyDollarIcon,
      iconBg: "bg-indigo-600-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "This Week",
      value: formatPeso(weeklyEarnings),
      icon: CalendarDaysIcon,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "This Month",
      value: formatPeso(totalEarnings),
      icon: BanknotesIcon,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Total Earned",
      value: formatPeso(totalEarnings),
      icon: CheckBadgeIcon,
      iconBg: "bg-indigo-600-50",
      iconColor: "text-indigo-600",
    },
  ]

  if (isLoading) {
    return <SkeletonDashboard />
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Welcome + Availability Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">
            Welcome back, {session?.user?.name || "Trucker"}
          </h1>
          <p className="mt-1 text-sm text-warm-400">
            Here&apos;s your trucking overview.
          </p>
        </div>

        {/* Availability Toggle Card */}
        <Card
          className={cn(
            "flex items-center gap-4 !p-4 transition-all",
            isAvailable
              ? "ring-2 ring-indigo-600-200 border-indigo-200 bg-indigo-600-50/50"
              : "ring-1 ring-warm-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                isAvailable ? "bg-indigo-50" : "bg-warm-100"
              )}
            >
              <SignalIcon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isAvailable ? "text-indigo-600" : "text-warm-300"
                )}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-800">
                {isAvailable ? "Available for Jobs" : "Unavailable"}
              </p>
              <p className="text-xs text-warm-400">
                {isAvailable ? "Shippers can see you" : "You are hidden from search"}
              </p>
            </div>
          </div>
          <Switch
            checked={isAvailable}
            onChange={toggleAvailability}
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ml-2",
              isAvailable ? "bg-indigo-600" : "bg-warm-300"
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                isAvailable ? "translate-x-6" : "translate-x-1"
              )}
            />
          </Switch>
        </Card>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {earningsCards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="mt-2 font-display text-2xl font-bold text-warm-800">
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

      {/* Active Bookings + Stats Row */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Active Booking Status */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <CardTitle>Active Bookings</CardTitle>
            <Badge variant="in_transit">{activeBookings.length} active</Badge>
          </div>

          {activeBookings.length === 0 ? (
            <EmptyState
              icon={<TruckIcon className="h-6 w-6" />}
              title="No active bookings"
              description="Browse available loads to find your next job."
              size="sm"
              action={
                <Link href="/trucker/available-loads">
                  <Button size="sm">Browse Loads</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {activeBookings.slice(0, 3).map((booking, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-warm-100 p-3 hover:border-warm-200 transition-colors"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                      booking.status === "IN_TRANSIT" ? "bg-amber-50" : "bg-blue-50"
                    )}
                  >
                    <TruckIcon
                      className={cn(
                        "h-4 w-4",
                        booking.status === "IN_TRANSIT" ? "text-amber-600" : "text-blue-600"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-warm-800">
                      Booking #{String(index + 1).padStart(3, "0")}
                    </p>
                    <p className="text-xs text-warm-400">
                      {formatPeso(booking.agreedRate || 0)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(booking.status)}>
                    {booking.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Stats Summary */}
        <Card>
          <CardTitle className="mb-5">Overview</CardTitle>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-warm-500">Available Loads</span>
              </div>
              <span className="text-sm font-bold text-warm-800">{loads.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-50">
                  <TruckIcon className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-sm text-warm-500">Active Jobs</span>
              </div>
              <span className="text-sm font-bold text-warm-800">{activeBookings.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-indigo-600-50">
                  <MapPinIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm text-warm-500">Completed</span>
              </div>
              <span className="text-sm font-bold text-warm-800">{completedBookings.length}</span>
            </div>
            <hr className="border-warm-100" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-indigo-600-50">
                  <CurrencyDollarIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-warm-800">Total Earnings</span>
              </div>
              <span className="text-sm font-bold text-indigo-600">{formatPeso(totalEarnings)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Loads Nearby */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Available Loads Near You</CardTitle>
          <Link href="/trucker/available-loads">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </div>

        {loads.length === 0 ? (
          <EmptyState
            icon={<MapPinIcon className="h-6 w-6" />}
            title="No available loads nearby"
            description="Check back soon for new loads in your area."
            size="sm"
          />
        ) : (
          <div className="divide-y divide-warm-100">
            {loads.map((load) => (
              <Link
                key={load.id}
                href="/trucker/available-loads"
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-surface -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface">
                    <TruckIcon className="h-4 w-4 text-warm-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {load.originAddress} &rarr; {load.destAddress}
                    </p>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {load.preferredTruck?.replace(/_/g, " ")} &middot; {timeAgo(load.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-indigo-600">
                    {formatPeso(load.rateEstimate ?? 0)}
                  </p>
                  <Badge variant={getStatusVariant(load.status)} className="mt-0.5">
                    {load.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
