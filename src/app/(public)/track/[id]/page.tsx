"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { LiveTracking } from "@/components/maps/LiveTracking"
import { RouteMap } from "@/components/maps/RouteMap"
import { DemoTracking } from "@/components/maps/DemoTracking"
import { formatDateTime } from "@/lib/utils"

interface TrackingData {
  bookingId: string
  waybillNumber: string
  status: string
  originAddress: string
  originLat: number
  originLng: number
  destAddress: string
  destLat: number
  destLng: number
  cargoType: string
  pickupDate: string
  truckerName: string
  lastUpdate: string | null
  estimatedArrival: string | null
}

const statusSteps = ["CONFIRMED", "IN_TRANSIT", "DELIVERED", "COMPLETED"]

const demoTrackingData: TrackingData = {
  bookingId: "demo-booking-001",
  waybillNumber: "TC-2026-0314-DEMO",
  status: "IN_TRANSIT",
  originAddress: "Bonifacio Global City, Taguig, Metro Manila",
  originLat: 14.5547,
  originLng: 121.0244,
  destAddress: "Naga City, Camarines Sur, Bicol Region",
  destLat: 13.6218,
  destLng: 123.1948,
  cargoType: "FMCG / Consumer Goods",
  pickupDate: new Date().toISOString(),
  truckerName: "Juan Dela Cruz (10-Wheeler)",
  lastUpdate: new Date().toISOString(),
  estimatedArrival: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
}

function getStepIndex(status: string) {
  const idx = statusSteps.indexOf(status)
  return idx >= 0 ? idx : 0
}

export default function PublicTrackingPage() {
  const params = useParams()
  const trackingId = params.id as string
  const isDemo = trackingId === "demo"
  const [data, setData] = useState<TrackingData | null>(isDemo ? demoTrackingData : null)
  const [isLoading, setIsLoading] = useState(!isDemo)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isDemo) return
    async function fetchTracking() {
      try {
        const res = await fetch(`/api/track/${trackingId}`)
        if (!res.ok) {
          setError("Booking not found or invalid tracking link.")
          return
        }
        const json = await res.json()
        setData(json.data)
      } catch {
        setError("Failed to load tracking data.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTracking()
  }, [trackingId, isDemo])

  return (
    <div>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {isDemo && (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm font-medium text-amber-800">
              This is a demo tracking view. Real shipments will show live GPS data and actual delivery status.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Tracking Unavailable</h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <Link href="/" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-600">
              Go to TruckConnect
            </Link>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">Waybill</p>
                  <p className="text-lg font-bold text-gray-900">{data.waybillNumber}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                  data.status === "COMPLETED" ? "bg-indigo-50 text-indigo-600" :
                  data.status === "DELIVERED" ? "bg-blue-100 text-blue-700" :
                  data.status === "IN_TRANSIT" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {data.status.replace(/_/g, " ")}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="relative">
                <div className="flex justify-between">
                  {statusSteps.map((step, i) => {
                    const currentIdx = getStepIndex(data.status)
                    const isComplete = i <= currentIdx
                    const isCurrent = i === currentIdx
                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          isComplete ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-400"
                        } ${isCurrent ? "ring-4 ring-indigo-100" : ""}`}>
                          {isComplete && i < currentIdx ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </div>
                        <p className={`mt-2 text-xs font-medium ${isComplete ? "text-indigo-600" : "text-gray-400"}`}>
                          {step.replace(/_/g, " ")}
                        </p>
                      </div>
                    )
                  })}
                </div>
                {/* Progress line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10 mx-12" />
                <div
                  className="absolute top-4 left-0 h-0.5 bg-indigo-600 -z-10 mx-12 transition-all"
                  style={{ width: `${(getStepIndex(data.status) / (statusSteps.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Live Map */}
            {data.originLat && data.destLat && (
              isDemo ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Live Location</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-medium text-green-600">Tracking Active</span>
                    </div>
                  </div>
                  <DemoTracking
                    originLat={data.originLat}
                    originLng={data.originLng}
                    destLat={data.destLat}
                    destLng={data.destLng}
                    className="min-h-[400px]"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">
                    {data.status === "IN_TRANSIT" ? "Live Location" : "Route Map"}
                  </h3>
                  {data.status === "IN_TRANSIT" ? (
                    <LiveTracking
                      bookingId={data.bookingId}
                      originLat={data.originLat}
                      originLng={data.originLng}
                      destLat={data.destLat}
                      destLng={data.destLng}
                      className="min-h-[350px]"
                    />
                  ) : (
                    <RouteMap
                      originLat={data.originLat}
                      originLng={data.originLng}
                      destLat={data.destLat}
                      destLng={data.destLng}
                      className="h-[350px]"
                    />
                  )}
                </div>
              )
            )}

            {/* Route Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Route Details</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-indigo-600" />
                    <div className="flex-1 w-0.5 bg-gray-200 my-1" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase">Pickup</p>
                    <p className="text-sm font-medium text-gray-900">{data.originAddress}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(data.pickupDate)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-400 uppercase">Delivery</p>
                    <p className="text-sm font-medium text-gray-900">{data.destAddress}</p>
                    {data.estimatedArrival && (
                      <p className="text-xs text-indigo-600 mt-0.5">ETA: {formatDateTime(data.estimatedArrival)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo & Carrier */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium text-gray-400 uppercase">Cargo</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{data.cargoType}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium text-gray-400 uppercase">Carrier</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{data.truckerName}</p>
              </div>
            </div>

            {/* Last Update */}
            {data.lastUpdate && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
                <p className="text-xs text-blue-600">Last updated: {formatDateTime(data.lastUpdate)}</p>
              </div>
            )}

            {/* Share link */}
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">Share this tracking link with anyone — no login required</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  alert("Link copied!")
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                Copy Link
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
