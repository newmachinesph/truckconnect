import { cn } from "@/lib/utils"

type BadgeVariant = "open" | "confirmed" | "in_transit" | "delivered" | "cancelled" | "truck_ban" | "default"

/* Tailwind UI badge pattern: ring-1 ring-inset + tinted bg + dark text */
const variants: Record<BadgeVariant, string> = {
  open: "bg-blue-50 text-blue-700 ring-blue-600/20",
  confirmed: "bg-green-50 text-green-700 ring-green-600/20",
  in_transit: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  delivered: "bg-green-50 text-green-700 ring-green-600/20",
  cancelled: "bg-red-50 text-red-700 ring-red-600/10",
  truck_ban: "bg-red-50 text-red-700 ring-red-600/10",
  default: "bg-gray-50 text-gray-600 ring-gray-500/10",
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    OPEN: "open",
    BOOKED: "confirmed",
    CONFIRMED: "confirmed",
    IN_TRANSIT: "in_transit",
    DELIVERED: "delivered",
    COMPLETED: "delivered",
    CANCELLED: "cancelled",
    DISPUTED: "cancelled",
  }
  return map[status] || "default"
}
