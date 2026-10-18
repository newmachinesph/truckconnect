"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import type { TruckType } from "@/types"

const TRUCK_TYPE_OPTIONS = [
  { value: "", label: "All Truck Types" },
  { value: "FOUR_WHEELER", label: "4-Wheeler" },
  { value: "SIX_WHEELER_OPEN", label: "6-Wheeler (Open)" },
  { value: "SIX_WHEELER_CLOSED", label: "6-Wheeler (Closed Van)" },
  { value: "TEN_WHEELER", label: "10-Wheeler" },
  { value: "TRAILER", label: "Trailer" },
  { value: "WING_VAN", label: "Wing Van" },
]

export interface LoadFilterValues {
  truckType: TruckType | ""
  dateFrom: string
  dateTo: string
  weightMin: string
  weightMax: string
}

const INITIAL_FILTERS: LoadFilterValues = {
  truckType: "",
  dateFrom: "",
  dateTo: "",
  weightMin: "",
  weightMax: "",
}

interface LoadFiltersProps {
  onChange: (filters: LoadFilterValues) => void
  className?: string
}

export function LoadFilters({ onChange, className }: LoadFiltersProps) {
  const [filters, setFilters] = useState<LoadFilterValues>(INITIAL_FILTERS)

  const update = useCallback(
    (field: keyof LoadFilterValues, value: string) => {
      setFilters((prev) => {
        const next = { ...prev, [field]: value }
        onChange(next)
        return next
      })
    },
    [onChange]
  )

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
    onChange(INITIAL_FILTERS)
  }, [onChange])

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="md:w-48">
          <Select
            label="Truck Type"
            value={filters.truckType}
            onChange={(value) => update("truckType", value)}
            options={TRUCK_TYPE_OPTIONS}
            placeholder="All Truck Types"
          />
        </div>

        <div className="md:w-40">
          <Input
            label="Date From"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
          />
        </div>

        <div className="md:w-40">
          <Input
            label="Date To"
            type="date"
            value={filters.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
          />
        </div>

        <div className="md:w-28">
          <Input
            label="Min Weight"
            type="number"
            min={0}
            step={0.1}
            placeholder="tons"
            value={filters.weightMin}
            onChange={(e) => update("weightMin", e.target.value)}
          />
        </div>

        <div className="md:w-28">
          <Input
            label="Max Weight"
            type="number"
            min={0}
            step={0.1}
            placeholder="tons"
            value={filters.weightMax}
            onChange={(e) => update("weightMax", e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
