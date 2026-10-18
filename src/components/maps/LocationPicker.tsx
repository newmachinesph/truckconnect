"use client"

import { useState } from "react"
import { MapPinIcon } from "@heroicons/react/24/outline"
import { Input } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

interface LocationPickerProps {
  label: string
  value: string
  lat?: number
  lng?: number
  onChange: (address: string, lat: number, lng: number) => void
  placeholder?: string
  error?: string
  className?: string
}

export function LocationPicker({
  label,
  value,
  lat,
  lng,
  onChange,
  placeholder = "Enter address...",
  error,
  className,
}: LocationPickerProps) {
  const [showCoords, setShowCoords] = useState(false)

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, lat || 0, lng || 0)
  }

  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(value, parseFloat(e.target.value) || 0, lng || 0)
  }

  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(value, lat || 0, parseFloat(e.target.value) || 0)
  }

  const hasCoords = lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        label={label}
        value={value}
        onChange={handleAddressChange}
        placeholder={placeholder}
        error={error}
      />

      <button
        type="button"
        onClick={() => setShowCoords(!showCoords)}
        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
      >
        {showCoords ? "Hide coordinates" : "Set coordinates manually"}
      </button>

      {showCoords && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Latitude"
            type="number"
            step="any"
            value={lat?.toString() || ""}
            onChange={handleLatChange}
            placeholder="e.g. 14.5995"
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            value={lng?.toString() || ""}
            onChange={handleLngChange}
            placeholder="e.g. 120.9842"
          />
        </div>
      )}

      {/* Map preview placeholder */}
      {hasCoords && (
        <div className="rounded-md border border-warm-200 bg-surface h-32 flex items-center justify-center">
          <div className="text-center text-warm-300">
            <MapPinIcon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs">
              {lat?.toFixed(4)}, {lng?.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
