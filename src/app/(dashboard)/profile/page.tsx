"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import { SavedAddresses } from "@/components/profile/SavedAddresses"
import { NotificationPreferences } from "@/components/profile/NotificationPreferences"
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: "SHIPPER" | "TRUCKER"
  preferredLanguage: string
  isActive: boolean
  createdAt: string
  shipperProfile: {
    businessName: string
    businessType: string
    businessAddress: string
    gcashNumber: string | null
  } | null
  truckerProfile: {
    ltfrbAccreditation: string | null
    gcashNumber: string | null
    isAvailable: boolean
    experienceTags: string[]
    preferredRegions: string[]
  } | null
}

interface DocumentItem {
  id: string
  type: string
  fileName: string
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED"
  createdAt: string
}

const EXPERIENCE_TAG_OPTIONS = [
  "Frozen Goods",
  "Hazardous Materials",
  "Oversized Cargo",
  "Fragile Items",
  "Livestock",
  "Construction Materials",
  "FMCG",
  "Electronics",
  "Furniture",
  "Agricultural Products",
  "Pharmaceuticals",
  "Perishable Goods",
]

const REGION_OPTIONS = [
  "NCR",
  "Region I - Ilocos",
  "Region II - Cagayan Valley",
  "Region III - Central Luzon",
  "Region IV-A - CALABARZON",
  "Region V - Bicol",
  "Region VI - Western Visayas",
  "Region VII - Central Visayas",
  "Region VIII - Eastern Visayas",
  "Region IX - Zamboanga",
  "Region X - Northern Mindanao",
  "Region XI - Davao",
  "Region XII - SOCCSKSARGEN",
  "CAR - Cordillera",
  "BARMM",
]

const DOC_STATUS_MAP: Record<string, { variant: "confirmed" | "open" | "cancelled" | "in_transit"; label: string }> = {
  PENDING: { variant: "open", label: "Pending" },
  VERIFIED: { variant: "confirmed", label: "Verified" },
  REJECTED: { variant: "cancelled", label: "Rejected" },
  EXPIRED: { variant: "in_transit", label: "Expired" },
}

const DOC_STATUS_ICONS: Record<string, typeof CheckCircleIcon> = {
  PENDING: ClockIcon,
  VERIFIED: CheckCircleIcon,
  REJECTED: XCircleIcon,
  EXPIRED: ExclamationTriangleIcon,
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [ltfrbAccreditation, setLtfrbAccreditation] = useState("")
  const [gcashNumber, setGcashNumber] = useState("")
  const [experienceTags, setExperienceTags] = useState<string[]>([])
  const [preferredRegions, setPreferredRegions] = useState<string[]>([])
  const [preferredLanguage, setPreferredLanguage] = useState("en")
  const [isActive, setIsActive] = useState(true)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)

  const role = session?.user?.role as string | undefined
  const isShipper = role === "SHIPPER"
  const isTrucker = role === "TRUCKER"

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, docsRes] = await Promise.all([
          fetch("/api/users/profile"),
          fetch("/api/users/profile").then(() =>
            // Simulate documents for demo
            Promise.resolve({
              json: () =>
                Promise.resolve({
                  success: true,
                  data: [] as DocumentItem[],
                }),
            })
          ),
        ])

        const profileJson = await profileRes.json()
        if (profileJson.success && profileJson.data) {
          const user: UserProfile = profileJson.data
          setProfile(user)
          setName(user.name || "")
          setPreferredLanguage(user.preferredLanguage || "en")
          setIsActive(user.isActive)
          if (user.shipperProfile) {
            setBusinessName(user.shipperProfile.businessName || "")
            setBusinessType(user.shipperProfile.businessType || "")
            setBusinessAddress(user.shipperProfile.businessAddress || "")
            setGcashNumber(user.shipperProfile.gcashNumber || "")
          }
          if (user.truckerProfile) {
            setLtfrbAccreditation(user.truckerProfile.ltfrbAccreditation || "")
            setGcashNumber(user.truckerProfile.gcashNumber || "")
            setExperienceTags(user.truckerProfile.experienceTags || [])
            setPreferredRegions(user.truckerProfile.preferredRegions || [])
          }
        }

        const docsJson = await docsRes.json()
        if (docsJson.success) {
          setDocuments(docsJson.data)
        }
      } catch {
        toast("error", "Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name,
        preferredLanguage,
      }

      if (isShipper) {
        body.businessName = businessName
        body.businessType = businessType
        body.businessAddress = businessAddress
        body.gcashNumber = gcashNumber
      } else if (isTrucker) {
        body.ltfrbAccreditation = ltfrbAccreditation
        body.gcashNumber = gcashNumber
        body.experienceTags = experienceTags
        body.preferredRegions = preferredRegions
      }

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (json.success) {
        setProfile(json.data)
        toast("success", "Profile updated successfully")
      } else {
        toast("error", "Failed to save profile")
      }
    } catch {
      toast("error", "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  function toggleExperienceTag(tag: string) {
    setExperienceTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  function toggleRegion(region: string) {
    setPreferredRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    )
  }

  function handleDeactivateToggle() {
    if (isActive) {
      setShowDeactivateConfirm(true)
    } else {
      setIsActive(true)
      setShowDeactivateConfirm(false)
    }
  }

  function confirmDeactivate() {
    setIsActive(false)
    setShowDeactivateConfirm(false)
    toast("warning", "Account marked for deactivation. Save to confirm.")
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10 space-y-6">
      <h1 className="text-xl md:font-display text-2xl font-bold text-warm-800">My Profile</h1>

      {/* Account Info Card */}
      <Card>
        <CardTitle>Account Information</CardTitle>
        <CardContent className="mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-warm-400">Email</span>
            <span className="font-medium text-warm-800">{profile?.email || "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-warm-400">Phone</span>
            <span className="font-medium text-warm-800">{profile?.phone || "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-warm-400">Role</span>
            <Badge variant={isShipper ? "confirmed" : "in_transit"}>
              {isShipper ? "Shipper" : "Trucker"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-warm-400">Status</span>
            <Badge variant={isActive ? "confirmed" : "cancelled"}>
              {isActive ? "Active" : "Deactivated"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-warm-400">Member since</span>
            <span className="font-medium text-warm-800">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile Card */}
      <Card>
        <CardTitle>Edit Profile</CardTitle>
        <CardContent className="mt-4 space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
          />

          {/* Language Toggle */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-warm-600">
              Preferred Language
            </label>
            <div className="flex rounded-lg border border-warm-200 overflow-hidden w-fit">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  preferredLanguage === "en"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-warm-600 hover:bg-surface"
                }`}
                onClick={() => setPreferredLanguage("en")}
              >
                English
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-warm-200 ${
                  preferredLanguage === "fil"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-warm-600 hover:bg-surface"
                }`}
                onClick={() => setPreferredLanguage("fil")}
              >
                Filipino
              </button>
            </div>
          </div>

          {isShipper && (
            <>
              <Input
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
              />
              <Input
                label="Business Type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. Logistics, Manufacturing"
              />
              <Input
                label="Business Address"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Enter business address"
              />
            </>
          )}

          {isTrucker && (
            <>
              <Input
                label="LTFRB Accreditation No."
                value={ltfrbAccreditation}
                onChange={(e) => setLtfrbAccreditation(e.target.value)}
                placeholder="Enter LTFRB accreditation number"
              />

              {/* Experience Tags */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-warm-600">
                  Experience Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleExperienceTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        experienceTags.includes(tag)
                          ? "bg-indigo-50 text-indigo-500 ring-1 ring-indigo-600-300"
                          : "bg-warm-100 text-warm-500 hover:bg-warm-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Regions */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-warm-600">
                  Preferred Regions
                </label>
                <div className="flex flex-wrap gap-2">
                  {REGION_OPTIONS.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        preferredRegions.includes(region)
                          ? "bg-indigo-50 text-indigo-500 ring-1 ring-indigo-600-300"
                          : "bg-warm-100 text-warm-500 hover:bg-warm-200"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Input
            label="GCash Number"
            value={gcashNumber}
            onChange={(e) => setGcashNumber(e.target.value)}
            placeholder="e.g. 09171234567"
          />

          <div className="pt-2">
            <Button onClick={handleSave} isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      <Card>
        <CardTitle>Documents</CardTitle>
        <CardContent className="mt-4 space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-6">
              <DocumentTextIcon className="h-10 w-10 text-warm-200 mx-auto mb-2" />
              <p className="text-sm text-warm-300">
                No documents uploaded yet
              </p>
              <p className="text-xs text-warm-300 mt-1">
                Upload verification documents to build trust with {isShipper ? "carriers" : "shippers"}
              </p>
              <Button variant="secondary" size="sm" className="mt-3">
                Upload Document
              </Button>
            </div>
          ) : (
            documents.map((doc) => {
              const statusInfo = DOC_STATUS_MAP[doc.status] || DOC_STATUS_MAP.PENDING
              const StatusIcon = DOC_STATUS_ICONS[doc.status] || ClockIcon
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-warm-100"
                >
                  <DocumentTextIcon className="h-5 w-5 text-warm-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800 truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-warm-300">
                      {doc.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className="h-4 w-4" />
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Saved Addresses */}
      <SavedAddresses />

      {/* Notification Preferences */}
      <NotificationPreferences />

      {/* Account Deactivation */}
      <Card>
        <CardTitle>Account Settings</CardTitle>
        <CardContent className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-warm-800">
                Account Status
              </p>
              <p className="text-xs text-warm-300 mt-0.5">
                {isActive
                  ? "Your account is active and visible to others"
                  : "Your account is deactivated and hidden from search"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDeactivateToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                isActive ? "bg-indigo-600" : "bg-warm-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {showDeactivateConfirm && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Deactivate your account?
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Your profile will be hidden from search results and you will not receive new booking requests. You can reactivate anytime.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={confirmDeactivate}
                    >
                      Deactivate
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowDeactivateConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
