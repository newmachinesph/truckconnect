"use client"

import { useState, useRef } from "react"
import { CameraIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"

interface EpodUploadProps {
  bookingId: string
  existingUrl?: string | null
  onUploadSuccess?: (url: string) => void
  className?: string
}

export function EpodUpload({ bookingId, existingUrl, onUploadSuccess, className }: EpodUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(existingUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast("error", "Please select an image file")
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch(`/api/bookings/${bookingId}/epod`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload ePOD")
      }

      toast("success", "Proof of delivery uploaded successfully")
      setSelectedFile(null)
      onUploadSuccess?.(data.data.url)
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className={cn("space-y-4", className)}>
      <h4 className="text-sm font-semibold text-warm-800">Electronic Proof of Delivery</h4>

      {preview ? (
        <div className="space-y-3">
          <img
            src={preview}
            alt="ePOD preview"
            className="rounded-md border border-warm-200 max-h-64 w-full object-contain bg-surface"
          />
          {selectedFile && (
            <div className="flex gap-2">
              <Button onClick={handleUpload} isLoading={isUploading} size="sm">
                <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
                Upload ePOD
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null)
                  setPreview(existingUrl || null)
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          )}
          {!selectedFile && existingUrl && (
            <p className="text-xs text-warm-300">ePOD already uploaded</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-8 text-warm-300 hover:border-indigo-600-300 hover:text-indigo-600 transition-colors"
        >
          <CameraIcon className="h-10 w-10" />
          <span className="text-sm font-medium">Capture or upload photo</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!selectedFile && preview && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <CameraIcon className="h-4 w-4 mr-1.5" />
          Replace Photo
        </Button>
      )}
    </Card>
  )
}
