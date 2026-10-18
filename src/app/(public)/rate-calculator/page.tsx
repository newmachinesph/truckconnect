"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { Card, CardTitle } from "@/components/ui/Card"
import { formatPeso } from "@/lib/utils"
import type { RateBreakdown } from "@/types"
import { loadPlacesLibrary } from "@/lib/maps"
import {
  PHILIPPINE_ROUTES,
  findRoute,
  getAvailableCities,
} from "@/lib/philippine-routes"
import { calculateRateV2 } from "@/lib/rate-engine-v2"
import type { RateBreakdownV2 } from "@/lib/rate-engine-v2"
import type { Route } from "@/lib/philippine-routes"

const LoadVisualizer = dynamic(
  () => import("@/components/three/LoadVisualizer").then(m => ({ default: m.LoadVisualizer })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] bg-gray-950 flex items-center justify-center rounded-xl">
        <span className="text-sm text-gray-500">Loading 3D view&hellip;</span>
      </div>
    ),
  }
)

// ---------------------------------------------------------------------------
// Constants — verified PH truck specs
// ---------------------------------------------------------------------------

// Rate engine uses these keys (business model); LoadVisualizer maps them via LEGACY_MAP
const TRUCK_SPECS: Record<string, { label: string; maxTons: number; dims: string }> = {
  FOUR_WHEELER:       { label: "4W Closed Van",   maxTons: 2.5,  dims: "9×5.5×5.5 ft" },
  SIX_WHEELER_OPEN:   { label: "6W Forward",      maxTons: 7,    dims: "17×7×7 ft" },
  SIX_WHEELER_CLOSED: { label: "6W Closed Van",   maxTons: 4.5,  dims: "13×6×6 ft" },
  TEN_WHEELER:        { label: "10W Wing Van",    maxTons: 15,   dims: "32×7.5×7.5 ft" },
  TRAILER:            { label: "40ft Trailer",    maxTons: 28,   dims: "40×8×8.5 ft" },
  WING_VAN:           { label: "10W Wing Van",    maxTons: 15,   dims: "32×7.5×7.5 ft" },
}

const truckTypeOptions = [
  { value: "FOUR_WHEELER",       label: `4W Closed Van — 2.5T · 9×5.5×5.5 ft` },
  { value: "SIX_WHEELER_CLOSED", label: `6W Closed Van — 4.5T · 13×6×6 ft` },
  { value: "SIX_WHEELER_OPEN",   label: `6W Forward — 7T · 17×7×7 ft` },
  { value: "TEN_WHEELER",        label: `10W Wing Van — 15T · 32×7.5×7.5 ft` },
  { value: "TRAILER",            label: `40ft Trailer — 28T · 40×8×8.5 ft` },
]

const TRUCK_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(TRUCK_SPECS).map(([k, v]) => [k, v.label])
)

const comparisonTruckTypes = [
  "FOUR_WHEELER",
  "SIX_WHEELER_CLOSED",
  "TEN_WHEELER",
  "TRAILER",
]

type PresetRoute = {
  label: string
  origin: string
  destination: string
  originLat: number
  originLng: number
  destLat: number
  destLng: number
}

const presetRoutes: PresetRoute[] = [
  {
    label: "Manila \u2192 Cebu",
    origin: "Manila, Metro Manila",
    destination: "Cebu City, Cebu",
    originLat: 14.5995,
    originLng: 120.9842,
    destLat: 10.3157,
    destLng: 123.8854,
  },
  {
    label: "Manila \u2192 Davao",
    origin: "Manila, Metro Manila",
    destination: "Davao City, Davao del Sur",
    originLat: 14.5995,
    originLng: 120.9842,
    destLat: 7.1907,
    destLng: 125.4553,
  },
  {
    label: "Batangas \u2192 Laguna",
    origin: "Batangas City, Batangas",
    destination: "Santa Rosa, Laguna",
    originLat: 13.7565,
    originLng: 121.0583,
    destLat: 14.3122,
    destLng: 121.1113,
  },
  {
    label: "Pampanga \u2192 Cavite",
    origin: "San Fernando, Pampanga",
    destination: "Dasmari\u00f1as, Cavite",
    originLat: 15.0286,
    originLng: 120.687,
    destLat: 14.3294,
    destLng: 120.9367,
  },
]

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type CalculatorTab = "route" | "custom"

// ---------------------------------------------------------------------------
// PlacesAutocomplete
// ---------------------------------------------------------------------------

function PlacesAutocomplete({
  label,
  placeholder,
  value,
  onPlaceSelected,
}: {
  label: string
  placeholder: string
  value: string
  onPlaceSelected: (place: { address: string; lat: number; lng: number }) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    let mounted = true

    async function initAutocomplete() {
      try {
        await loadPlacesLibrary()

        if (!mounted || !inputRef.current || autocompleteRef.current) return

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "ph" },
          fields: ["formatted_address", "geometry", "name"],
        })

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (place.geometry?.location) {
            const address = place.formatted_address || place.name || ""
            setInputValue(address)
            onPlaceSelected({
              address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            })
          }
        })

        autocompleteRef.current = autocomplete
      } catch (err) {
        console.error("Failed to load Places API:", err)
      }
    }

    initAutocomplete()

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full rounded-md bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 hover:ring-gray-400"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Route Segment Map (visual)
// ---------------------------------------------------------------------------

function RouteSegmentMap({ breakdown }: { breakdown: RateBreakdownV2 }) {
  return (
    <div className="space-y-0">
      {breakdown.segments.map((seg, i) => {
        const isLand = seg.type === "land"
        return (
          <div key={i} className="flex items-stretch gap-3">
            {/* Timeline column */}
            <div className="flex flex-col items-center w-6 shrink-0">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 shadow-sm ${
                  isLand
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-blue-500 bg-blue-100"
                }`}
              />
              {i < breakdown.segments.length - 1 && (
                <div
                  className={`flex-1 w-0.5 ${
                    isLand ? "bg-indigo-300" : "bg-blue-300"
                  }`}
                  style={{ minHeight: "2rem" }}
                />
              )}
            </div>
            {/* Content */}
            <div className="pb-5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                    isLand
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {isLand ? "Land" : "RO-RO Ferry"}
                </span>
                <span className="text-xs text-gray-400">
                  {seg.distanceKm} km &middot; {seg.duration}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700 truncate">
                {seg.from} &rarr; {seg.to}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Segment cost: {formatPeso(seg.cost)}
              </p>
            </div>
          </div>
        )
      })}
      {/* Final dot */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center w-6 shrink-0">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 bg-gray-200 shadow-sm" />
        </div>
        <p className="text-sm font-semibold text-gray-600">Destination</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RO-RO Info Panel
// ---------------------------------------------------------------------------

function RoroInfoPanel({ route }: { route: Route }) {
  const roroSegments = route.segments.filter((s) => s.type === "roro")
  if (roroSegments.length === 0) return null

  return (
    <Card className="p-6 bg-blue-50 border-blue-200 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
        <CardTitle className="text-blue-900 !mb-0 text-sm">
          RO-RO Ferry Information
        </CardTitle>
      </div>
      <div className="space-y-4">
        {roroSegments.map((seg, i) => (
          <div key={i} className="text-sm space-y-1.5 bg-white/60 rounded-xl p-4 border border-blue-100">
            <p className="font-semibold text-blue-800">
              {seg.from} &rarr; {seg.to}
            </p>
            {seg.ferryOperator && (
              <p className="text-blue-700">
                <span className="text-blue-500 font-medium">Operator:</span>{" "}
                {seg.ferryOperator}
              </p>
            )}
            {seg.ferryFrequency && (
              <p className="text-blue-700">
                <span className="text-blue-500 font-medium">Schedule:</span>{" "}
                {seg.ferryFrequency}
              </p>
            )}
            <p className="text-blue-700">
              <span className="text-blue-500 font-medium">Crossing time:</span>{" "}
              ~{seg.durationHours} hours
            </p>
            {seg.roroFee && (
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-blue-600">
                <span className="bg-blue-50 rounded-lg px-2 py-1">4-Wheeler: {formatPeso(seg.roroFee.FOUR_WHEELER)}</span>
                <span className="bg-blue-50 rounded-lg px-2 py-1">6-Wheeler: {formatPeso(seg.roroFee.SIX_WHEELER)}</span>
                <span className="bg-blue-50 rounded-lg px-2 py-1">10-Wheeler: {formatPeso(seg.roroFee.TEN_WHEELER)}</span>
                <span className="bg-blue-50 rounded-lg px-2 py-1">Trailer: {formatPeso(seg.roroFee.TRAILER)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Comparison Table
// ---------------------------------------------------------------------------

function ComparisonTable({
  route,
}: {
  route: Route
}) {
  const rows = useMemo(
    () =>
      comparisonTruckTypes.map((tt) => ({
        truckType: tt,
        label: TRUCK_TYPE_LABELS[tt] ?? tt,
        breakdown: calculateRateV2(route, tt),
      })),
    [route]
  )

  return (
    <Card className="p-6 overflow-x-auto rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>
        <CardTitle className="!mb-0 text-sm">
          Price Comparison by Truck Type
        </CardTitle>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
            <th className="pb-3 pr-4 font-semibold">Truck Type</th>
            <th className="pb-3 pr-4 font-semibold text-right">Land Cost</th>
            {route.hasRoro && (
              <th className="pb-3 pr-4 font-semibold text-right">RO-RO Fees</th>
            )}
            <th className="pb-3 pr-4 font-semibold text-right">Shipper Pays</th>
            <th className="pb-3 font-semibold text-right">Trucker Receives</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.truckType} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4 font-semibold text-gray-700">
                {r.label}
              </td>
              <td className="py-3 pr-4 text-right text-gray-600">
                {formatPeso(r.breakdown.baseRate)}
              </td>
              {route.hasRoro && (
                <td className="py-3 pr-4 text-right text-blue-600 font-medium">
                  {formatPeso(r.breakdown.roroFees)}
                </td>
              )}
              <td className="py-3 pr-4 text-right font-bold text-indigo-600">
                {formatPeso(r.breakdown.totalShipperPays)}
              </td>
              <td className="py-3 text-right font-bold text-indigo-600">
                {formatPeso(r.breakdown.totalTruckerReceives)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Duration Breakdown
// ---------------------------------------------------------------------------

function DurationBreakdown({ breakdown }: { breakdown: RateBreakdownV2 }) {
  const landHours = breakdown.segments
    .filter((s) => s.type === "land")
    .reduce((sum, s) => {
      const parts = s.duration.match(/(\d+)h\s*(\d*)m?|(\d+)\s*min/)
      if (!parts) return sum
      if (parts[3]) return sum + parseInt(parts[3]) / 60
      const h = parseInt(parts[1] || "0")
      const m = parseInt(parts[2] || "0")
      return sum + h + m / 60
    }, 0)

  const roroHours = breakdown.segments
    .filter((s) => s.type === "roro")
    .reduce((sum, s) => {
      const parts = s.duration.match(/(\d+)h\s*(\d*)m?|(\d+)\s*min/)
      if (!parts) return sum
      if (parts[3]) return sum + parseInt(parts[3]) / 60
      const h = parseInt(parts[1] || "0")
      const m = parseInt(parts[2] || "0")
      return sum + h + m / 60
    }, 0)

  const total = landHours + roroHours
  const landPct = total > 0 ? (landHours / total) * 100 : 100
  const roroPct = total > 0 ? (roroHours / total) * 100 : 0

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Travel Time Breakdown
      </p>
      <div className="flex h-3.5 rounded-full overflow-hidden bg-gray-100 shadow-inner">
        {landPct > 0 && (
          <div
            className="bg-indigo-600 transition-all rounded-l-full"
            style={{ width: `${landPct}%` }}
          />
        )}
        {roroPct > 0 && (
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${roroPct}%` }}
          />
        )}
      </div>
      <div className="flex gap-5 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block shadow-sm" />
          Land: ~{landHours.toFixed(1)}h
        </span>
        {roroPct > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block shadow-sm" />
            RO-RO: ~{roroHours.toFixed(1)}h
          </span>
        )}
        <span className="ml-auto font-bold text-gray-700">
          Total: {breakdown.estimatedDuration}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function RateCalculatorPage() {
  const [tab, setTab] = useState<CalculatorTab>("route")

  // --- Route-based state ---
  const [fromCity, setFromCity] = useState("")
  const [toCity, setToCity] = useState("")
  const [truckType, setTruckType] = useState("")
  const [routeResult, setRouteResult] = useState<RateBreakdownV2 | null>(null)
  const [matchedRoute, setMatchedRoute] = useState<Route | null>(null)
  const [routeError, setRouteError] = useState("")

  // --- Custom (Places API) state ---
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [customTruckType, setCustomTruckType] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<(RateBreakdown & { durationMinutes?: number }) | null>(null)
  const [error, setError] = useState("")

  // --- Build city options ---
  const cities = useMemo(() => getAvailableCities(), [])
  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c, label: c })),
    [cities]
  )

  // Destination options filtered by origin
  const destinationOptions = useMemo(() => {
    if (!fromCity) return cityOptions
    return cityOptions.filter((c) => c.value !== fromCity)
  }, [fromCity, cityOptions])

  // Route options for quick-select (unused but kept for future)
  useMemo(
    () =>
      PHILIPPINE_ROUTES.sort((a, b) => b.popularity - a.popularity).map(
        (r) => ({
          value: r.id,
          label: `${r.from} \u2192 ${r.to}${r.hasRoro ? " (RO-RO)" : ""}`,
        })
      ),
    []
  )

  // --- Handlers ---

  function handleRouteCalculate(e: React.FormEvent) {
    e.preventDefault()
    setRouteError("")
    setRouteResult(null)
    setMatchedRoute(null)

    if (!fromCity || !toCity) {
      setRouteError("Please select both origin and destination cities.")
      return
    }
    if (!truckType) {
      setRouteError("Please select a truck type.")
      return
    }

    const route = findRoute(fromCity, toCity)
    if (!route) {
      setRouteError(
        `No pre-defined route found for ${fromCity} to ${toCity}. Try the Custom Location tab for address-based estimation.`
      )
      return
    }

    setMatchedRoute(route)
    setRouteResult(calculateRateV2(route, truckType))
  }

  function handleRouteQuickSelect(routeId: string) {
    const route = PHILIPPINE_ROUTES.find((r) => r.id === routeId)
    if (route) {
      setFromCity(route.from)
      setToCity(route.to)
      setRouteResult(null)
      setMatchedRoute(null)
      setRouteError("")
    }
  }

  const applyPreset = useCallback((preset: PresetRoute) => {
    setOrigin(preset.origin)
    setDestination(preset.destination)
    setOriginCoords({ lat: preset.originLat, lng: preset.originLng })
    setDestCoords({ lat: preset.destLat, lng: preset.destLng })
    setResult(null)
    setError("")
  }, [])

  async function handleCustomCalculate(e: React.FormEvent) {
    e.preventDefault()
    if (!originCoords || !destCoords) {
      setError("Please select origin and destination from the suggestions, or use a preset route.")
      return
    }
    if (!customTruckType) {
      setError("Please select a truck type.")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/rate/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originLat: originCoords.lat,
          originLng: originCoords.lng,
          destLat: destCoords.lat,
          destLng: destCoords.lng,
          truckType: customTruckType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : "Failed to calculate rate. Please try again."
        setError(errMsg)
      } else {
        setResult(data.data ?? data)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Page Header */}
      <section className="bg-gray-900 py-16 sm:py-20">
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center rounded-full border border-indigo-600/30 bg-indigo-600/10 px-4 py-1.5 text-sm font-medium text-indigo-300 mb-6">
            No signup needed &middot; Includes RO-RO routes
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Rate Calculator
          </h1>
          <p className="mt-4 text-lg text-gray-300 leading-relaxed max-w-xl mx-auto">
            Get an instant estimate for your shipment. Covers island-to-island RO-RO ferry routes across the Philippines.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-8 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setTab("route")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
              tab === "route"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            City-to-City Route
          </button>
          <button
            type="button"
            onClick={() => setTab("custom")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
              tab === "custom"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Custom Location
          </button>
        </div>

        {/* ================================================================== */}
        {/* Route-based Tab                                                     */}
        {/* ================================================================== */}
        {tab === "route" && (
          <>
            {/* Quick route pills */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold text-gray-700">
                Popular routes:
              </p>
              <div className="flex flex-wrap gap-2">
                {PHILIPPINE_ROUTES.filter((r) => r.popularity >= 7).map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => handleRouteQuickSelect(route.id)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      fromCity === route.from && toCity === route.to
                        ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {route.from} &rarr; {route.to}
                    {route.hasRoro && (
                      <span className="ml-1.5 text-xs text-blue-500 font-semibold">(RO-RO)</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Card className="p-6 md:p-8 rounded-xl shadow-md border-gray-200">
              <form onSubmit={handleRouteCalculate} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Select
                    label="Origin City"
                    value={fromCity}
                    onChange={(v) => {
                      setFromCity(v)
                      setRouteResult(null)
                      setMatchedRoute(null)
                    }}
                    options={cityOptions}
                    placeholder="Select origin..."
                  />
                  <Select
                    label="Destination City"
                    value={toCity}
                    onChange={(v) => {
                      setToCity(v)
                      setRouteResult(null)
                      setMatchedRoute(null)
                    }}
                    options={destinationOptions}
                    placeholder="Select destination..."
                  />
                </div>
                <Select
                  label="Truck Type"
                  value={truckType}
                  onChange={setTruckType}
                  options={truckTypeOptions}
                  placeholder="Select truck type..."
                />
                {routeError && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {routeError}
                  </div>
                )}
                <Button type="submit" size="lg" className="w-full">
                  Calculate Rate
                </Button>
              </form>
            </Card>

            {/* Route Results */}
            {routeResult && matchedRoute && (
              <div className="mt-8 space-y-6">
                {/* Segment map */}
                <Card className="p-6 md:p-8 rounded-xl shadow-sm">
                  <CardTitle className="mb-1">
                    {matchedRoute.from} &rarr; {matchedRoute.to}
                  </CardTitle>
                  <p className="text-sm text-gray-500 mb-6">
                    {routeResult.totalDistanceKm} km total &middot;{" "}
                    {routeResult.estimatedDuration}
                    {routeResult.hasRoro && (
                      <span className="ml-2 inline-flex items-center rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        Includes RO-RO
                      </span>
                    )}
                  </p>

                  <RouteSegmentMap breakdown={routeResult} />

                  <div className="mt-6 pt-5 border-t border-gray-200">
                    <DurationBreakdown breakdown={routeResult} />
                  </div>
                </Card>

                {/* RO-RO info */}
                {matchedRoute.hasRoro && <RoroInfoPanel route={matchedRoute} />}

                {/* Rate breakdown */}
                <Card className="p-6 md:p-8 rounded-xl shadow-sm border-indigo-100 bg-white">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <CardTitle className="!mb-0">Rate Breakdown</CardTitle>
                  </div>
                  <div className="space-y-3">
                    <Row label="Route" value={`${matchedRoute.from} \u2192 ${matchedRoute.to}`} />
                    <Row label="Land Distance" value={`${routeResult.landDistanceKm} km`} />
                    {routeResult.roroDistanceKm > 0 && (
                      <Row label="RO-RO Distance" value={`${routeResult.roroDistanceKm} km`} />
                    )}
                    <Row label="Total Distance" value={`${routeResult.totalDistanceKm} km`} />
                    <Row label="Est. Duration" value={routeResult.estimatedDuration} />
                    <Row label="Truck Type" value={TRUCK_TYPE_LABELS[truckType] || truckType} />

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <Row label="Base Rate (land transport)" value={formatPeso(routeResult.baseRate)} />
                      <Row label="Fuel Surcharge (15%)" value={formatPeso(routeResult.fuelSurcharge)} />
                      <Row label="Toll Fees (est.)" value={formatPeso(routeResult.tollFees)} />
                      {routeResult.roroFees > 0 && (
                        <Row label="RO-RO Ferry Fees" value={formatPeso(routeResult.roroFees)} highlight="blue" />
                      )}
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <Row label="Platform Fee (Shipper, 3.5%)" value={formatPeso(routeResult.shipperPlatformFee)} />
                      <Row label="Platform Fee (Trucker, 6%)" value={formatPeso(routeResult.truckerPlatformFee)} />
                    </div>

                    <div className="border-t-2 border-indigo-300 pt-5 mt-4">
                      <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4">
                        <div>
                          <span className="text-sm text-gray-600 font-medium">Shipper Pays</span>
                          <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">
                            {formatPeso(routeResult.totalShipperPays)}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-indigo-200" />
                        <div className="text-right">
                          <span className="text-sm text-gray-600 font-medium">Trucker Receives</span>
                          <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">
                            {formatPeso(routeResult.totalTruckerReceives)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {routeResult.roroNote && (
                      <p className="text-xs text-blue-600 mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        {routeResult.roroNote}
                      </p>
                    )}
                  </div>
                </Card>

                {/* 3D Truck Visualization */}
                <Card className="p-0 overflow-hidden rounded-xl shadow-sm">
                  <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {TRUCK_SPECS[truckType]?.label || truckType}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Cargo bed: {TRUCK_SPECS[truckType]?.dims} · Max {TRUCK_SPECS[truckType]?.maxTons}T
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-lg px-2.5 py-1">
                        Drag to rotate
                      </span>
                    </div>
                  </div>
                  <LoadVisualizer
                    truckType={truckType}
                    weightTons={TRUCK_SPECS[truckType]?.maxTons ? TRUCK_SPECS[truckType].maxTons * 0.7 : 5}
                    cargoType="general merchandise"
                    className="aspect-[2/1]"
                  />
                </Card>

                {/* Comparison table */}
                <ComparisonTable route={matchedRoute} />
              </div>
            )}
          </>
        )}

        {/* ================================================================== */}
        {/* Custom Location Tab                                                */}
        {/* ================================================================== */}
        {tab === "custom" && (
          <>
            {/* Preset Routes */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold text-gray-700">Quick routes:</p>
              <div className="flex flex-wrap gap-2">
                {presetRoutes.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <Card className="p-6 md:p-8 rounded-xl shadow-md border-gray-200">
              <form onSubmit={handleCustomCalculate} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <PlacesAutocomplete
                    label="Origin"
                    placeholder="Search address in Philippines..."
                    value={origin}
                    onPlaceSelected={({ address, lat, lng }) => {
                      setOrigin(address)
                      setOriginCoords({ lat, lng })
                    }}
                  />
                  <PlacesAutocomplete
                    label="Destination"
                    placeholder="Search address in Philippines..."
                    value={destination}
                    onPlaceSelected={({ address, lat, lng }) => {
                      setDestination(address)
                      setDestCoords({ lat, lng })
                    }}
                  />
                </div>
                <Select
                  label="Truck Type"
                  value={customTruckType}
                  onChange={setCustomTruckType}
                  options={truckTypeOptions}
                  placeholder="Select truck type..."
                />
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    {error}
                  </div>
                )}
                <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                  Calculate Rate
                </Button>
              </form>
            </Card>

            {/* Custom Results */}
            {result && (
              <>
              {/* 3D Truck Visualization */}
              <Card className="mt-8 p-0 overflow-hidden rounded-xl shadow-sm">
                <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {TRUCK_SPECS[customTruckType]?.label || customTruckType}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Cargo bed: {TRUCK_SPECS[customTruckType]?.dims} · Max {TRUCK_SPECS[customTruckType]?.maxTons}T
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-lg px-2.5 py-1">
                      Drag to rotate
                    </span>
                  </div>
                </div>
                <LoadVisualizer
                  truckType={customTruckType}
                  weightTons={TRUCK_SPECS[customTruckType]?.maxTons ? TRUCK_SPECS[customTruckType].maxTons * 0.7 : 5}
                  cargoType="general merchandise"
                  className="aspect-[2/1]"
                />
              </Card>

              <Card className="mt-6 p-6 md:p-8 rounded-xl shadow-sm border-indigo-100 bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle className="!mb-0">Rate Breakdown</CardTitle>
                </div>
                <div className="space-y-3">
                  <Row label="Route" value={`${origin} \u2192 ${destination}`} />
                  <Row label="Distance" value={`${result.distanceKm.toFixed(1)} km`} />
                  {result.durationMinutes && (
                    <Row label="Est. Travel Time" value={formatDuration(result.durationMinutes)} />
                  )}
                  <Row label="Truck Type" value={TRUCK_TYPE_LABELS[result.truckType] || String(result.truckType)} />
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <Row label="Base Rate" value={formatPeso(result.baseRate)} />
                    <Row label="Rate per km" value={`${formatPeso(result.baseRatePerKm)}/km`} />
                    <Row label="Fuel Surcharge" value={formatPeso(result.fuelSurcharge)} />
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <Row label="Platform Fee (Shipper)" value={formatPeso(result.platformFeeShipper)} />
                    <Row label="Platform Fee (Trucker)" value={formatPeso(result.platformFeeTrucker)} />
                  </div>
                  <div className="border-t-2 border-indigo-300 pt-5 mt-4">
                    <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 px-5 py-4">
                      <div>
                        <span className="text-sm text-gray-600 font-medium">Shipper Pays</span>
                        <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">
                          {formatPeso(result.totalShipperPays)}
                        </p>
                      </div>
                      <div className="h-10 w-px bg-indigo-200" />
                      <div className="text-right">
                        <span className="text-sm text-gray-600 font-medium">Trucker Receives</span>
                        <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">
                          {formatPeso(result.totalTruckerReceives)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              </>
            )}
          </>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Ready to move your freight?
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Create Free Account
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: "blue"
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span
        className={`font-semibold text-right ml-4 ${
          highlight === "blue" ? "text-blue-600" : "text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}
