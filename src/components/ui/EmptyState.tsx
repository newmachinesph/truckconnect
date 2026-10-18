import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "py-8",
  md: "py-12",
  lg: "py-20",
}

const iconSizeClasses = {
  sm: "mb-3",
  md: "mb-4",
  lg: "mb-6",
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        sizeClasses[size],
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full bg-warm-100 text-warm-400",
            iconSizeClasses[size]
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-warm-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-warm-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
