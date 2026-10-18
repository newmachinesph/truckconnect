"use client"

import { UploadDropzone } from "@/lib/uploadthing"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  endpoint: keyof OurFileRouter
  onUploadComplete: (urls: string[]) => void
  onUploadError?: (error: Error) => void
  label?: string
  hint?: string
  className?: string
}

export function FileUpload({
  endpoint,
  onUploadComplete,
  onUploadError,
  label,
  hint,
  className,
}: FileUploadProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-warm-600">
          {label}
        </label>
      )}
      <UploadDropzone
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          const urls = res.map((f) => f.ufsUrl)
          onUploadComplete(urls)
        }}
        onUploadError={(error) => {
          onUploadError?.(error)
        }}
        appearance={{
          container:
            "border-2 border-dashed border-slate-300 rounded-xl bg-surface hover:bg-warm-100 transition-colors cursor-pointer ut-uploading:border-indigo-600-400",
          label: "text-warm-500 text-sm",
          allowedContent: "text-warm-300 text-xs",
          button:
            "bg-indigo-600 hover:bg-indigo-500-700 text-white text-sm rounded-lg px-4 py-2 ut-uploading:bg-indigo-600-400",
        }}
      />
      {hint && <p className="text-xs text-warm-300">{hint}</p>}
    </div>
  )
}
