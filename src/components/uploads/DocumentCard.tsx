"use client"

import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

interface DocumentCardProps {
  fileName: string
  fileUrl: string
  type: string
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED"
  uploadedAt: string
  onRemove?: () => void
}

const statusColors = {
  PENDING: "default" as const,
  VERIFIED: "delivered" as const,
  REJECTED: "cancelled" as const,
  EXPIRED: "truck_ban" as const,
}

const statusLabels = {
  PENDING: "Pending Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
}

export function DocumentCard({
  fileName,
  fileUrl,
  type,
  status,
  uploadedAt,
  onRemove,
}: DocumentCardProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)

  return (
    <div className="flex items-center gap-4 rounded-lg border border-warm-200 bg-white p-4">
      {isImage ? (
        <img
          src={fileUrl}
          alt={fileName}
          className="h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-warm-100">
          <svg className="h-8 w-8 text-warm-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-warm-800 truncate">{fileName}</p>
        <p className="text-xs text-warm-300 mt-0.5">
          {type.replace(/_/g, " ")} · {new Date(uploadedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusColors[status]}>{statusLabels[status]}</Badge>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}
