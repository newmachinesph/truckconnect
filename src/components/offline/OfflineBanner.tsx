"use client"

import { useEffect, useState } from "react"
import { WifiIcon, ArrowPathIcon } from "@heroicons/react/24/outline"

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine)

    function handleOnline() {
      setIsOffline(false)
      setIsRetrying(false)
    }

    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  function handleRetry() {
    setIsRetrying(true)
    // Check connectivity by attempting to fetch
    fetch("/api/auth/session", { cache: "no-store" })
      .then(() => {
        setIsOffline(false)
        setIsRetrying(false)
        window.location.reload()
      })
      .catch(() => {
        setIsRetrying(false)
      })
  }

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 text-sm font-medium">
          <WifiIcon className="h-4 w-4" />
          <span>You are offline — cached data shown</span>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    </div>
  )
}
