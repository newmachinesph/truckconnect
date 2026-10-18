interface SectionHeaderProps {
  kicker?: string
  title: string
  description?: string
  align?: "left" | "center"
}

export function SectionHeader({ kicker, title, description, align = "left" }: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-2xl"}>
      {kicker && (
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">
          {kicker}
        </p>
      )}
      <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
