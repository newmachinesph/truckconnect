"use client"

import { useState, useEffect } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import {
  MapPinIcon,
  StarIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline"
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid"

interface SavedAddress {
  id: string
  label: string
  address: string
  lat: number
  lng: number
  isDefault: boolean
  createdAt: string
}

export function SavedAddresses() {
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [label, setLabel] = useState("")
  const [address, setAddress] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    fetchAddresses()
  }, [])

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/saved-addresses")
      const json = await res.json()
      if (json.success) {
        setAddresses(json.data)
      }
    } catch {
      toast("error", "Failed to load saved addresses")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!label.trim() || !address.trim()) {
      toast("error", "Label and address are required")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/saved-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, address, isDefault }),
      })
      const json = await res.json()
      if (json.success) {
        toast("success", "Address saved")
        setLabel("")
        setAddress("")
        setIsDefault(false)
        setShowForm(false)
        fetchAddresses()
      } else {
        toast("error", "Failed to save address")
      }
    } catch {
      toast("error", "Failed to save address")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/saved-addresses?id=${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id))
        toast("success", "Address removed")
      } else {
        toast("error", "Failed to remove address")
      }
    } catch {
      toast("error", "Failed to remove address")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardTitle>Saved Addresses</CardTitle>
        <CardContent className="mt-4">
          <LoadingSpinner size="sm" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <CardTitle>Saved Addresses</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <CardContent className="mt-4 space-y-3">
        {showForm && (
          <div className="border border-warm-200 rounded-lg p-4 space-y-3 bg-surface">
            <Input
              label="Label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main Warehouse, Office"
            />
            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address"
            />
            <label className="flex items-center gap-2 text-sm text-warm-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600-500"
              />
              Set as default address
            </label>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} isLoading={saving}>
                Save Address
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowForm(false)
                  setLabel("")
                  setAddress("")
                  setIsDefault(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {addresses.length === 0 && !showForm && (
          <p className="text-sm text-warm-300 text-center py-4">
            No saved addresses yet
          </p>
        )}

        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-warm-100 hover:border-warm-200 transition-colors"
          >
            <MapPinIcon className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-warm-800">
                  {addr.label}
                </span>
                {addr.isDefault && (
                  <StarSolidIcon className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <p className="text-sm text-warm-400 truncate">{addr.address}</p>
            </div>
            <button
              onClick={() => handleDelete(addr.id)}
              disabled={deletingId === addr.id}
              className="shrink-0 p-1 rounded hover:bg-red-50 text-warm-300 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              {deletingId === addr.id ? (
                <LoadingSpinner size="sm" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
