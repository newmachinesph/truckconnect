import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "light" | "dark"
  size?: "sm" | "md" | "lg"
  href?: string
}

const sizes = {
  sm: { icon: "h-7 w-7", svg: "h-4 w-4", text: "text-base" },
  md: { icon: "h-8 w-8", svg: "h-5 w-5", text: "text-lg" },
  lg: { icon: "h-10 w-10", svg: "h-6 w-6", text: "text-xl" },
}

export function Logo({ variant = "dark", size = "md", href = "/" }: LogoProps) {
  const s = sizes[size]
  const isLight = variant === "light"

  const content = (
    <span className="inline-flex items-center gap-2.5">
      <span className={cn(s.icon, "flex items-center justify-center rounded-lg bg-indigo-600 shadow-sm")}>
        <svg className={cn(s.svg, "text-white")} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      </span>
      <span className={cn(s.text, "font-bold", isLight ? "text-white" : "text-gray-900")}>
        TruckConnect
        <span className={cn("text-xs font-semibold ml-1", isLight ? "text-gray-400" : "text-gray-500")}>PH</span>
      </span>
    </span>
  )

  if (href) {
    return <Link href={href} className="inline-flex">{content}</Link>
  }
  return content
}
