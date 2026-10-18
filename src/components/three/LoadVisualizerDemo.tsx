"use client"

import { useState, useCallback, useId } from "react"
import dynamic from "next/dynamic"
import type { CargoItem, TruckEntry } from "./LoadVisualizer"

const LoadVisualizer = dynamic(
  () => import("@/components/three/LoadVisualizer").then(m => ({ default: m.LoadVisualizer })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] lg:aspect-auto lg:h-full min-h-[320px] bg-slate-900 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
        <span className="text-sm text-slate-500 tracking-wide">Building 3D scene&hellip;</span>
      </div>
    ),
  }
)

const ITEM_COLORS = [
  "#4f7df0", "#e8913a", "#3bba6a", "#d45d5d", "#9b6fd4",
  "#d4709b", "#2ba897", "#c77830", "#617899", "#8b8b3d",
]

let nextId = 1
function makeId() { return `item-${nextId++}` }

function createItem(overrides?: Partial<CargoItem>): CargoItem {
  const id = makeId()
  return {
    id,
    label: overrides?.label || "Cargo",
    lengthFt: overrides?.lengthFt || 3,
    widthFt: overrides?.widthFt || 2,
    heightFt: overrides?.heightFt || 2,
    quantity: overrides?.quantity || 5,
    color: overrides?.color || ITEM_COLORS[0],
    allowSideways: overrides?.allowSideways ?? true,
  }
}

let nextTruckId = 1
function makeTruckId() { return `truck-${nextTruckId++}` }

interface Preset {
  label: string
  shortLabel: string
  trucks: { truckType: string }[]
  loadPct: number
  items: Omit<CargoItem, "id">[]
}

const PRESETS: Preset[] = [
  {
    label: "Rice Sacks to Cebu",
    shortLabel: "Rice",
    trucks: [{ truckType: "CLOSED_VAN_6W" }],
    loadPct: 90,
    items: [
      { label: "Rice Sacks (50kg)", lengthFt: 2, widthFt: 1.5, heightFt: 1, quantity: 20, color: "#3bba6a", allowSideways: true },
    ],
  },
  {
    label: "Mixed Electronics",
    shortLabel: "Electronics",
    trucks: [{ truckType: "WING_VAN_10W" }],
    loadPct: 50,
    items: [
      { label: "TV Boxes (55\")", lengthFt: 5, widthFt: 1, heightFt: 3.5, quantity: 8, color: "#4f7df0", allowSideways: true },
      { label: "Appliance Crates", lengthFt: 3, widthFt: 2.5, heightFt: 3, quantity: 6, color: "#9b6fd4", allowSideways: true },
    ],
  },
  {
    label: "Construction Mix",
    shortLabel: "Construction",
    trucks: [{ truckType: "TRAILER_40FT" }],
    loadPct: 65,
    items: [
      { label: "Steel Bars (20ft)", lengthFt: 20, widthFt: 2, heightFt: 2, quantity: 3, color: "#617899", allowSideways: false },
      { label: "Cement Bags", lengthFt: 2, widthFt: 1.5, heightFt: 1, quantity: 25, color: "#8b8b3d", allowSideways: true },
    ],
  },
  {
    label: "Food & Beverage NCR",
    shortLabel: "F&B",
    trucks: [{ truckType: "CLOSED_VAN_4W" }],
    loadPct: 60,
    items: [
      { label: "Cooler Boxes", lengthFt: 2, widthFt: 1.5, heightFt: 1.5, quantity: 4, color: "#e8913a", allowSideways: false },
      { label: "Crate Stacks", lengthFt: 1.5, widthFt: 1, heightFt: 1, quantity: 8, color: "#d45d5d", allowSideways: true },
    ],
  },
  {
    label: "Furniture to Laguna",
    shortLabel: "Furniture",
    trucks: [{ truckType: "WING_VAN_10W" }],
    loadPct: 80,
    items: [
      { label: "Sofa (wrapped)", lengthFt: 7, widthFt: 3, heightFt: 3, quantity: 3, color: "#9b6fd4", allowSideways: true },
      { label: "Dining Tables", lengthFt: 5, widthFt: 3, heightFt: 1, quantity: 4, color: "#d4709b", allowSideways: true },
      { label: "Chair Stacks", lengthFt: 2, widthFt: 2, heightFt: 4, quantity: 6, color: "#2ba897", allowSideways: true },
    ],
  },
]

// Verified PH truck types — cargo interior dims & payload from manufacturer specs
const TRUCK_OPTIONS = [
  { value: "L300_VAN",       label: "L300/Van",        maxTons: 1,    dims: "7×4×4 ft" },
  { value: "CLOSED_VAN_4W",  label: "4W Closed Van",   maxTons: 2.5,  dims: "9×5.5×5.5 ft" },
  { value: "CLOSED_VAN_6W",  label: "6W Closed Van",   maxTons: 4.5,  dims: "13×6×6 ft" },
  { value: "FWD_TRUCK_6W",   label: "6W Forward",      maxTons: 7,    dims: "17×7×7 ft" },
  { value: "WING_VAN_10W",   label: "10W Wing Van",    maxTons: 15,   dims: "32×7.5×7.5 ft" },
  { value: "TRAILER_40FT",   label: "40ft Trailer",    maxTons: 28,   dims: "40×8×8.5 ft" },
]

function DimensionInput({ id, label, value, min, max, step, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[10px] font-medium text-slate-400 mb-0.5 uppercase tracking-wider">{label}</label>
      <input
        id={id}
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
      />
    </div>
  )
}

function getTruckMaxTons(truckType: string): number {
  return TRUCK_OPTIONS.find(o => o.value === truckType)?.maxTons ?? 7
}

export function LoadVisualizerDemo() {
  const uid = useId()
  const [trucks, setTrucks] = useState<TruckEntry[]>([
    { id: makeTruckId(), truckType: "CLOSED_VAN_6W" },
  ])
  const [activeTruckIdx, setActiveTruckIdx] = useState(0)
  const [loadPct, setLoadPct] = useState(70)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [items, setItems] = useState<CargoItem[]>([
    createItem({ label: "Boxes", lengthFt: 3, widthFt: 2, heightFt: 2, quantity: 8, color: ITEM_COLORS[0] }),
  ])

  const loadId = `${uid}-load`
  const currentTruck = trucks[activeTruckIdx] || trucks[0]

  // Compute total weight from truck capacities × load %
  const totalMaxTons = trucks.reduce((s, t) => s + getTruckMaxTons(t.truckType), 0)
  const weightTons = Math.round((totalMaxTons * loadPct / 100) * 10) / 10

  const addItem = useCallback(() => {
    setItems(prev => [
      ...prev,
      createItem({
        label: `Cargo ${prev.length + 1}`,
        color: ITEM_COLORS[prev.length % ITEM_COLORS.length],
      }),
    ])
    setActivePreset(null)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    setActivePreset(null)
  }, [])

  const updateItem = useCallback((id: string, field: keyof CargoItem, value: string | number | boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
    setActivePreset(null)
  }, [])

  const addTruck = useCallback(() => {
    setTrucks(prev => [...prev, { id: makeTruckId(), truckType: "CLOSED_VAN_6W" }])
    setActiveTruckIdx(prev => prev + 1)
    setActivePreset(null)
  }, [])

  const removeTruck = useCallback((idx: number) => {
    setTrucks(prev => prev.filter((_, i) => i !== idx))
    setActiveTruckIdx(prev => Math.min(prev, trucks.length - 2))
    setActivePreset(null)
  }, [trucks.length])

  const updateTruckType = useCallback((idx: number, truckType: string) => {
    setTrucks(prev => prev.map((t, i) => i === idx ? { ...t, truckType } : t))
    setActivePreset(null)
  }, [])

  function applyPreset(p: Preset) {
    setTrucks(p.trucks.map(t => ({ id: makeTruckId(), truckType: t.truckType })))
    setActiveTruckIdx(0)
    setLoadPct(p.loadPct)
    setItems(p.items.map(item => createItem(item)))
    setActivePreset(p.label)
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-2xl shadow-slate-900/20 ring-1 ring-white/5">
      {/* Preset strip */}
      <div className="flex items-center gap-1 px-3 py-2.5 bg-slate-800/60 border-b border-slate-700/50 overflow-x-auto" role="toolbar" aria-label="Load presets">
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mr-2 shrink-0">Try</span>
        {PRESETS.map((p) => {
          const isActive = activePreset === p.label
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              }`}
            >
              <span className="hidden sm:inline">{p.label}</span>
              <span className="sm:hidden">{p.shortLabel}</span>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[340px_1fr]">
        {/* Controls panel */}
        <div className="border-b lg:border-b-0 lg:border-r border-slate-700/50 p-4 space-y-4 max-h-[500px] lg:max-h-[600px] overflow-y-auto">
          {/* Trucks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Trucks ({trucks.length})
              </span>
              <button
                type="button"
                onClick={addTruck}
                className="rounded-md bg-slate-700 hover:bg-slate-600 px-2.5 py-1 text-[10px] font-medium text-slate-300 transition-colors min-h-[28px]"
              >
                + Add Truck
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trucks.map((truck, idx) => {
                const opt = TRUCK_OPTIONS.find(o => o.value === truck.truckType)
                const isActive = idx === activeTruckIdx
                return (
                  <div key={truck.id} className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTruckIdx(idx)}
                      className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                          : "bg-slate-800 text-slate-400 hover:text-slate-200 ring-1 ring-slate-700/50"
                      }`}
                    >
                      {opt?.label || truck.truckType} <span className="text-[10px] opacity-60">#{idx + 1} · {opt?.maxTons}T</span>
                    </button>
                    {trucks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTruck(idx)}
                        className="text-slate-600 hover:text-red-400 text-xs p-1 transition-colors"
                        aria-label={`Remove truck #${idx + 1}`}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active truck type selector */}
            <div className="mt-2">
              <label htmlFor={`${uid}-truck-${activeTruckIdx}`} className="block text-[10px] font-medium text-slate-400 mb-1 uppercase tracking-wider">
                Truck #{activeTruckIdx + 1} Type
              </label>
              <select
                id={`${uid}-truck-${activeTruckIdx}`}
                value={currentTruck.truckType}
                onChange={(e) => updateTruckType(activeTruckIdx, e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              >
                {TRUCK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label} — {o.maxTons}T · {o.dims}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Load % */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label htmlFor={loadId} className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Load</label>
              <output className="text-sm font-semibold text-slate-100 tabular-nums">
                {loadPct}<span className="text-slate-500 font-normal ml-0.5">%</span>
                <span className="text-slate-500 font-normal ml-2 text-xs">{weightTons}T / {totalMaxTons}T</span>
              </output>
            </div>
            <input
              id={loadId}
              type="range" min={10} max={120} step={5} value={loadPct}
              onChange={(e) => { setLoadPct(Number(e.target.value)); setActivePreset(null) }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>10%</span><span>100%</span><span className="text-red-400/60">120%</span>
            </div>
          </div>

          {/* Cargo items */}
          <div className="pt-2 border-t border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Cargo Items ({items.length})
              </span>
              <button
                type="button"
                onClick={addItem}
                className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors min-h-[32px]"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-800/80 p-3 space-y-2.5 ring-1 ring-slate-700/50">
                  {/* Item header */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm shrink-0 ring-1 ring-white/10"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateItem(item.id, "label", e.target.value)}
                      className="flex-1 bg-transparent text-xs font-medium text-slate-200 border-none outline-none min-w-0"
                      placeholder="Item name"
                      aria-label="Cargo item name"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-slate-500 hover:text-red-400 text-xs font-medium transition-colors min-w-[44px] min-h-[28px] flex items-center justify-end"
                        aria-label={`Remove ${item.label}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Dimensions */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <DimensionInput id={`${uid}-${item.id}-l`} label="L (ft)" value={item.lengthFt} min={0.5} max={32} step={0.5} onChange={(v) => updateItem(item.id, "lengthFt", v)} />
                    <DimensionInput id={`${uid}-${item.id}-w`} label="W (ft)" value={item.widthFt} min={0.5} max={8} step={0.5} onChange={(v) => updateItem(item.id, "widthFt", v)} />
                    <DimensionInput id={`${uid}-${item.id}-h`} label="H (ft)" value={item.heightFt} min={0.5} max={8.5} step={0.5} onChange={(v) => updateItem(item.id, "heightFt", v)} />
                    <DimensionInput id={`${uid}-${item.id}-q`} label="Qty" value={item.quantity} min={1} max={100} step={1} onChange={(v) => updateItem(item.id, "quantity", v)} />
                  </div>

                  {/* Sideways toggle + color */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer min-h-[28px]">
                      <input
                        type="checkbox"
                        checked={item.allowSideways !== false}
                        onChange={(e) => updateItem(item.id, "allowSideways", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400">Allow sideways loading</span>
                    </label>
                    <div className="flex gap-1.5" role="radiogroup" aria-label={`Color for ${item.label}`}>
                      {ITEM_COLORS.slice(0, 6).map(c => (
                        <button
                          key={c}
                          type="button"
                          role="radio"
                          aria-checked={item.color === c}
                          aria-label={`Color ${c}`}
                          onClick={() => updateItem(item.id, "color", c)}
                          className={`w-5 h-5 rounded-full transition-transform ${
                            item.color === c
                              ? "ring-2 ring-white/60 scale-110"
                              : "ring-1 ring-white/10 hover:scale-110"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Viewport — all trucks in one scene */}
        <div className="relative">
          <LoadVisualizer
            trucks={trucks}
            weightTons={weightTons}
            items={items}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
