"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatDate } from "@/lib/utils"
import {
  TicketIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline"

type Ticket = {
  id: string
  subject: string
  category: string
  status: string
  description: string
  attachmentUrl: string | null
  createdAt: string
}

function getTicketStatusVariant(status: string) {
  switch (status) {
    case "OPEN":
      return "open" as const
    case "IN_PROGRESS":
      return "in_transit" as const
    case "RESOLVED":
      return "confirmed" as const
    default:
      return "default" as const
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "OPEN":
      return "Open"
    case "IN_PROGRESS":
      return "In Progress"
    case "RESOLVED":
      return "Resolved"
    default:
      return status
  }
}

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch("/api/support")
        const data = await res.json()
        if (data.success) {
          setTickets(data.data)
        }
      } catch {
        // Silently handle error
      } finally {
        setIsLoading(false)
      }
    }
    fetchTickets()
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-800">Support Tickets</h1>
          <p className="mt-1 text-sm text-warm-400">
            View and manage your support requests.
          </p>
        </div>
        <Link href="/support/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-1.5" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-6 w-6" />}
          title="No support tickets"
          description="You haven't submitted any support tickets yet. Need help? Create a new ticket."
          action={
            <Link href="/support/new">
              <Button>
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Create Ticket
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:border-indigo-200 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warm-100">
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-warm-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-warm-800">{ticket.subject}</p>
                      <Badge variant={getTicketStatusVariant(ticket.status)}>
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default">{ticket.category}</Badge>
                      <span className="text-xs text-warm-300">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-warm-400 mt-1 line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
