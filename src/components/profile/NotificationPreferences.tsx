"use client"

import { useState, useEffect } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"

interface NotifChannel {
  bookingUpdates: boolean
  bidNotifications: boolean
  paymentAlerts: boolean
  deliveryUpdates: boolean
  marketing: boolean
}

const CATEGORIES = [
  { key: "bookingUpdates" as const, label: "Booking Updates", desc: "Status changes for your bookings" },
  { key: "bidNotifications" as const, label: "Bid Notifications", desc: "New bids and bid responses" },
  { key: "paymentAlerts" as const, label: "Payment Alerts", desc: "Payment confirmations and receipts" },
  { key: "deliveryUpdates" as const, label: "Delivery Updates", desc: "Real-time delivery tracking alerts" },
  { key: "marketing" as const, label: "Marketing", desc: "Promotions, tips, and new features" },
]

const DEFAULT_PREFS: NotifChannel = {
  bookingUpdates: true,
  bidNotifications: true,
  paymentAlerts: true,
  deliveryUpdates: true,
  marketing: false,
}

export function NotificationPreferences() {
  const { toast } = useToast()
  const [push, setPush] = useState<NotifChannel>({ ...DEFAULT_PREFS })
  const [sms, setSms] = useState<NotifChannel>({ ...DEFAULT_PREFS })
  const [email, setEmail] = useState<NotifChannel>({ ...DEFAULT_PREFS })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchPrefs() {
      try {
        const res = await fetch("/api/notification-preferences")
        const json = await res.json()
        if (json.success && json.data) {
          if (json.data.push) setPush(json.data.push as NotifChannel)
          if (json.data.sms) setSms(json.data.sms as NotifChannel)
          if (json.data.email) setEmail(json.data.email as NotifChannel)
        }
      } catch {
        toast("error", "Failed to load notification preferences")
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [toast])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ push, sms, email }),
      })
      const json = await res.json()
      if (json.success) {
        toast("success", "Notification preferences saved")
      } else {
        toast("error", "Failed to save preferences")
      }
    } catch {
      toast("error", "Failed to save preferences")
    } finally {
      setSaving(false)
    }
  }

  function toggleChannel(
    channel: "push" | "sms" | "email",
    key: keyof NotifChannel
  ) {
    const setters = { push: setPush, sms: setSms, email: setEmail }
    setters[channel]((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <Card>
        <CardTitle>Notification Preferences</CardTitle>
        <CardContent className="mt-4">
          <LoadingSpinner size="sm" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle>Notification Preferences</CardTitle>
      <CardContent className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-200">
                <th className="text-left py-3 pr-4 font-medium text-warm-600">
                  Category
                </th>
                <th className="text-center py-3 px-3 font-medium text-warm-600">
                  Push
                </th>
                <th className="text-center py-3 px-3 font-medium text-warm-600">
                  SMS
                </th>
                <th className="text-center py-3 px-3 font-medium text-warm-600">
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat) => (
                <tr
                  key={cat.key}
                  className="border-b border-warm-100 last:border-0"
                >
                  <td className="py-3 pr-4">
                    <div className="font-medium text-warm-800">{cat.label}</div>
                    <div className="text-xs text-warm-300">{cat.desc}</div>
                  </td>
                  <td className="text-center py-3 px-3">
                    <input
                      type="checkbox"
                      checked={push[cat.key]}
                      onChange={() => toggleChannel("push", cat.key)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600-500"
                    />
                  </td>
                  <td className="text-center py-3 px-3">
                    <input
                      type="checkbox"
                      checked={sms[cat.key]}
                      onChange={() => toggleChannel("sms", cat.key)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600-500"
                    />
                  </td>
                  <td className="text-center py-3 px-3">
                    <input
                      type="checkbox"
                      checked={email[cat.key]}
                      onChange={() => toggleChannel("email", cat.key)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4">
          <Button size="sm" onClick={handleSave} isLoading={saving}>
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
