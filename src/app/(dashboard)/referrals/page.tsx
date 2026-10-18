"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { useToast } from "@/components/ui/Toast"
import { formatPeso, formatDate } from "@/lib/utils"
import {
  UserPlusIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  GiftIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  TruckIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline"

type ReferralData = {
  code: string
  stats: {
    totalReferrals: number
    completedFirstTrips: number
    totalBonusEarned: number
  }
  referrals: {
    id: string
    name: string
    signUpDate: string
    firstTripCompleted: boolean
    firstTripAt: string | null
    bonusAmount: number
    bonusPaid: boolean
  }[]
}

export default function ReferralDashboardPage() {
  const { toast } = useToast()
  const [data, setData] = useState<ReferralData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch("/api/referrals")
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch {
      toast("error", "Failed to load referral data")
    } finally {
      setIsLoading(false)
    }
  }

  async function copyReferralLink() {
    if (!data?.code) return
    const link = `${window.location.origin}/register?ref=${data.code}`
    try {
      await navigator.clipboard.writeText(link)
      setIsCopied(true)
      toast("success", "Referral link copied to clipboard")
      setTimeout(() => setIsCopied(false), 3000)
    } catch {
      toast("error", "Failed to copy link")
    }
  }

  async function copyCode() {
    if (!data?.code) return
    try {
      await navigator.clipboard.writeText(data.code)
      toast("success", "Referral code copied")
    } catch {
      toast("error", "Failed to copy code")
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600-50">
            <GiftIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-warm-800">Referral Program</h1>
            <p className="text-sm text-warm-400">
              Invite others and earn rewards for every successful referral.
            </p>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <Card className="mb-6 bg-gradient-to-r from-indigo-600-50 to-indigo-600-light/50 border-indigo-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-500">Your Referral Code</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-bold font-mono text-indigo-500 tracking-wider">
                {data?.code || "---"}
              </span>
              <button
                onClick={copyCode}
                className="p-1.5 rounded-md hover:bg-indigo-500-200/50 transition-colors"
                title="Copy code"
              >
                <ClipboardDocumentIcon className="h-5 w-5 text-indigo-600" />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={copyReferralLink} size="sm">
              <ShareIcon className="h-4 w-4 mr-1.5" />
              {isCopied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Bonus Info */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
        <Card className="border-indigo-600-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600-50">
              <TruckIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-800">Carrier Bonus</p>
              <p className="text-lg font-bold text-indigo-600">{formatPeso(500)}</p>
              <p className="text-xs text-warm-400">Per referral who completes first trip</p>
            </div>
          </div>
        </Card>
        <Card className="border-blue-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-800">Shipper Credit</p>
              <p className="text-lg font-bold text-blue-600">{formatPeso(200)}</p>
              <p className="text-xs text-warm-400">Credit per referral who completes first trip</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3 mb-8">
        <Card>
          <div className="text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 mx-auto mb-2">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            <p className="font-display text-2xl font-bold text-warm-800">
              {data?.stats.totalReferrals ?? 0}
            </p>
            <p className="text-xs text-warm-400">Total Referrals</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600-50 mx-auto mb-2">
              <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="font-display text-2xl font-bold text-warm-800">
              {data?.stats.completedFirstTrips ?? 0}
            </p>
            <p className="text-xs text-warm-400">First Trips</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 mx-auto mb-2">
              <GiftIcon className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {formatPeso(data?.stats.totalBonusEarned ?? 0)}
            </p>
            <p className="text-xs text-warm-400">Total Earned</p>
          </div>
        </Card>
      </div>

      {/* Referral List */}
      <Card>
        <CardTitle>Your Referrals</CardTitle>
        <CardContent>
          {!data?.referrals?.length ? (
            <EmptyState
              icon={<UserPlusIcon className="h-6 w-6" />}
              title="No referrals yet"
              description="Share your referral code to start earning rewards."
              size="sm"
            />
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-100 text-left">
                    <th className="pb-3 font-medium text-warm-400">Name</th>
                    <th className="pb-3 font-medium text-warm-400">Sign-up Date</th>
                    <th className="pb-3 font-medium text-warm-400">First Trip</th>
                    <th className="pb-3 font-medium text-warm-400 text-right">Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {data.referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-surface">
                      <td className="py-3 text-warm-800 font-medium">{ref.name}</td>
                      <td className="py-3 text-warm-500">{formatDate(ref.signUpDate)}</td>
                      <td className="py-3">
                        {ref.firstTripCompleted ? (
                          <Badge variant="confirmed">Completed</Badge>
                        ) : (
                          <Badge variant="open">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 text-right font-semibold text-indigo-600">
                        {formatPeso(ref.bonusAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
