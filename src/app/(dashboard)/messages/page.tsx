"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardTitle } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"
import { formatDateTime } from "@/lib/utils"

interface Conversation {
  bookingId: string
  status: string
  otherPartyName: string
  originAddress: string
  destAddress: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const role = (session?.user as { role?: string } | undefined)?.role
  const isShipper = role === "SHIPPER"

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/messages/conversations")
        const json = await res.json()
        if (json.success && json.data) {
          setConversations(json.data)
        }
      } catch {
        console.error("Failed to load conversations")
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-warm-300">
        <ChatBubbleLeftRightIcon className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10 space-y-4">
      <h1 className="text-xl md:font-display text-2xl font-bold text-warm-800">Messages</h1>

      <div className="space-y-3">
        {conversations.map((convo) => {
          const bookingPath = isShipper
            ? `/shipper/booking/${convo.bookingId}`
            : `/trucker/booking/${convo.bookingId}`

          return (
            <Link key={convo.bookingId} href={bookingPath}>
              <Card interactive className="mb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="truncate">
                        {convo.otherPartyName}
                      </CardTitle>
                      <Badge variant={getStatusVariant(convo.status)}>
                        {convo.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <p className="text-sm text-warm-400 truncate">
                      {convo.originAddress} &rarr; {convo.destAddress}
                    </p>

                    {convo.lastMessage && (
                      <p className="text-sm text-warm-500 mt-1 truncate">
                        {convo.lastMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {convo.lastMessageAt && (
                      <span className="text-xs text-warm-300">
                        {formatDateTime(convo.lastMessageAt)}
                      </span>
                    )}
                    {convo.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-indigo-600 text-white text-xs font-medium">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
