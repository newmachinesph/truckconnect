"use client"

import { useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Select } from "@/components/ui/Select"
import { Badge } from "@/components/ui/Badge"
import { useToast } from "@/components/ui/Toast"
import {
  MegaphoneIcon,
  BellIcon,
  UsersIcon,
  TruckIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline"

const audienceOptions = [
  { value: "all", label: "All Users" },
  { value: "shippers", label: "Shippers Only" },
  { value: "truckers", label: "Truckers Only" },
]

const audienceIcons: Record<string, typeof UsersIcon> = {
  all: UsersIcon,
  shippers: BuildingOfficeIcon,
  truckers: TruckIcon,
}

export default function AdminBroadcastPage() {
  const { toast } = useToast()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState("all")
  const [isSending, setIsSending] = useState(false)
  const [sentHistory, setSentHistory] = useState<
    { title: string; audience: string; recipientCount: number; sentAt: string }[]
  >([])

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast("warning", "Please fill in both title and message body")
      return
    }

    setIsSending(true)
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, audience }),
      })
      const data = await res.json()
      if (data.success) {
        toast("success", `Broadcast sent to ${data.data.recipientCount} user(s)`)
        setSentHistory((prev) => [
          {
            title,
            audience,
            recipientCount: data.data.recipientCount,
            sentAt: new Date().toISOString(),
          },
          ...prev,
        ])
        setTitle("")
        setBody("")
      } else {
        toast("error", data.error || "Failed to send broadcast")
      }
    } catch {
      toast("error", "Failed to send broadcast")
    } finally {
      setIsSending(false)
    }
  }

  const AudienceIcon = audienceIcons[audience] || UsersIcon

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600-50">
            <MegaphoneIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-warm-800">Broadcast Notification</h1>
            <p className="text-sm text-warm-400">
              Send a notification to all users or specific segments.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose Form */}
        <Card>
          <CardTitle>Compose Message</CardTitle>
          <div className="mt-4 space-y-4">
            <Select
              label="Target Audience"
              value={audience}
              onChange={setAudience}
              options={audienceOptions}
            />

            <Input
              label="Notification Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., System Maintenance Notice"
            />

            <Textarea
              label="Message Body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your notification message here..."
              rows={5}
            />

            <Button
              onClick={handleSend}
              isLoading={isSending}
              disabled={!title.trim() || !body.trim()}
              className="w-full"
            >
              Send Broadcast
            </Button>
          </div>
        </Card>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Preview</CardTitle>
            <div className="mt-4">
              {title || body ? (
                <div className="rounded-lg border border-warm-200 bg-surface p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                      <BellIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-warm-800">
                          {title || "Notification Title"}
                        </p>
                        <Badge variant="default">
                          <AudienceIcon className="h-3 w-3 mr-1" />
                          {audienceOptions.find((o) => o.value === audience)?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-warm-500">
                        {body || "Message body will appear here..."}
                      </p>
                      <p className="text-xs text-warm-300 mt-2">Just now</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <BellIcon className="h-8 w-8 text-warm-200 mb-2" />
                  <p className="text-sm text-warm-300">
                    Start typing to preview your notification
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Sent History */}
          {sentHistory.length > 0 && (
            <Card>
              <CardTitle>Recently Sent</CardTitle>
              <CardContent>
                <div className="mt-3 space-y-3">
                  {sentHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border border-warm-100 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-warm-600">{item.title}</p>
                        <p className="text-xs text-warm-300">
                          {item.recipientCount} recipients
                          {" -- "}
                          {audienceOptions.find((o) => o.value === item.audience)?.label}
                        </p>
                      </div>
                      <Badge variant="confirmed">Sent</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
