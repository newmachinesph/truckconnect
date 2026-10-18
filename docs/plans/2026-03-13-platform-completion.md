# Platform Completion: Profile, Messaging, Three.js Load Visualizer

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete all broken/missing platform features — profile page, messaging system, messages inbox, and a Three.js 3D load visualizer — making TruckConnect PH production-ready.

**Architecture:** Fix broken API wiring in booking pages by replacing inline chat with the existing ChatWindow component. Add SSE endpoint for real-time messages. Create profile page with role-aware forms. Build a Three.js cargo visualization component showing truck cargo space in 3D.

**Tech Stack:** Next.js 16 App Router, Prisma ORM, Upstash Redis SSE, Tailwind CSS, Headless UI, Three.js (via @react-three/fiber + @react-three/drei), Heroicons

---

## Task 1: Fix Profile Validator — Add `isAvailable` field

The trucker dashboard availability toggle sends `isAvailable` but the `profileSchema` validator rejects it silently.

**Files:**
- Modify: `src/lib/validators.ts:88-96`
- Modify: `src/app/api/users/profile/route.ts:73-112`

**Step 1: Update profileSchema to accept isAvailable**

In `src/lib/validators.ts`, replace the `profileSchema`:

```typescript
export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(["SHIPPER", "TRUCKER"]).optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  businessAddress: z.string().optional(),
  ltfrbAccreditation: z.string().optional(),
  gcashNumber: z.string().optional(),
  isAvailable: z.boolean().optional(),
})
```

Note: `role` is now optional so profile updates don't require re-sending role.

**Step 2: Update PATCH handler to handle isAvailable and optional role**

In `src/app/api/users/profile/route.ts`, update the PATCH handler to:
- Only update `role` if provided
- Handle `isAvailable` on truckerProfile
- Allow partial updates without role

```typescript
// Update user fields
const updatedUser = await prisma.user.update({
  where: { id: session.user.id },
  data: {
    ...(data.name ? { name: data.name } : {}),
    ...(data.role ? { role: data.role } : {}),
  },
})

const effectiveRole = data.role || user.role

// Create or update profile based on role
if (effectiveRole === "SHIPPER") {
  await prisma.shipperProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      businessName: data.businessName || "",
      businessType: data.businessType || "",
      businessAddress: data.businessAddress || "",
      gcashNumber: data.gcashNumber,
    },
    update: {
      ...(data.businessName !== undefined ? { businessName: data.businessName } : {}),
      ...(data.businessType !== undefined ? { businessType: data.businessType } : {}),
      ...(data.businessAddress !== undefined ? { businessAddress: data.businessAddress } : {}),
      ...(data.gcashNumber !== undefined ? { gcashNumber: data.gcashNumber } : {}),
    },
  })
} else if (effectiveRole === "TRUCKER") {
  await prisma.truckerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ltfrbAccreditation: data.ltfrbAccreditation,
      gcashNumber: data.gcashNumber,
      isAvailable: data.isAvailable ?? true,
    },
    update: {
      ...(data.ltfrbAccreditation !== undefined ? { ltfrbAccreditation: data.ltfrbAccreditation } : {}),
      ...(data.gcashNumber !== undefined ? { gcashNumber: data.gcashNumber } : {}),
      ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
    },
  })
}
```

**Step 3: Verify build passes**

Run: `npx next build 2>&1 | tail -10`

**Step 4: Commit**

```bash
git add src/lib/validators.ts src/app/api/users/profile/route.ts
git commit -m "fix: allow isAvailable and partial profile updates in validator"
```

---

## Task 2: Create Profile Page

**Files:**
- Create: `src/app/(dashboard)/profile/page.tsx`

**Step 1: Create the profile page**

This is a client component that fetches the user's profile via GET `/api/users/profile` and renders a role-aware edit form. Uses existing UI components (Card, Input, Button, Badge).

```typescript
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"

interface ProfileData {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: "SHIPPER" | "TRUCKER" | null
  createdAt: string
  shipperProfile?: {
    businessName: string
    businessType: string
    businessAddress: string
    gcashNumber: string | null
  } | null
  truckerProfile?: {
    ltfrbAccreditation: string | null
    gcashNumber: string | null
    isAvailable: boolean
  } | null
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [ltfrbAccreditation, setLtfrbAccreditation] = useState("")
  const [gcashNumber, setGcashNumber] = useState("")

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile")
        const data = await res.json()
        if (data.success) {
          const p = data.data
          setProfile(p)
          setName(p.name || "")
          if (p.shipperProfile) {
            setBusinessName(p.shipperProfile.businessName || "")
            setBusinessType(p.shipperProfile.businessType || "")
            setBusinessAddress(p.shipperProfile.businessAddress || "")
            setGcashNumber(p.shipperProfile.gcashNumber || "")
          }
          if (p.truckerProfile) {
            setLtfrbAccreditation(p.truckerProfile.ltfrbAccreditation || "")
            setGcashNumber(p.truckerProfile.gcashNumber || "")
          }
        }
      } catch {
        toast("error", "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [toast])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const body: Record<string, unknown> = { name }
      if (profile?.role === "SHIPPER") {
        body.businessName = businessName
        body.businessType = businessType
        body.businessAddress = businessAddress
        body.gcashNumber = gcashNumber || undefined
      } else if (profile?.role === "TRUCKER") {
        body.ltfrbAccreditation = ltfrbAccreditation || undefined
        body.gcashNumber = gcashNumber || undefined
      }

      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        toast("success", "Profile updated successfully")
      } else {
        toast("error", data.error || "Failed to update profile")
      }
    } catch {
      toast("error", "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const isShipper = profile?.role === "SHIPPER"
  const isTrucker = profile?.role === "TRUCKER"

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account and business details.</p>
      </div>

      {/* Account Info */}
      <Card className="mb-6">
        <CardTitle className="mb-4">Account</CardTitle>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Email</p>
              <p className="mt-0.5 text-sm text-slate-900">{profile?.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Phone</p>
              <p className="mt-0.5 text-sm text-slate-900">{profile?.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Role</p>
              <Badge variant={isShipper ? "confirmed" : "in_transit"} className="mt-1">
                {profile?.role || "—"}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Member Since</p>
              <p className="mt-0.5 text-sm text-slate-900">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile */}
      <Card>
        <CardTitle className="mb-4">{isShipper ? "Business Details" : "Trucker Details"}</CardTitle>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />

          {isShipper && (
            <>
              <Input
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Cebu Packaging Solutions"
              />
              <Input
                label="Business Type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g., Manufacturing, Agriculture, Retail"
              />
              <Input
                label="Business Address"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Full business address"
              />
            </>
          )}

          {isTrucker && (
            <Input
              label="LTFRB Accreditation No."
              value={ltfrbAccreditation}
              onChange={(e) => setLtfrbAccreditation(e.target.value)}
              placeholder="e.g., LTFRB-NCR-2024-12345"
            />
          )}

          <Input
            label="GCash Number"
            value={gcashNumber}
            onChange={(e) => setGcashNumber(e.target.value)}
            placeholder="e.g., 09171234567"
          />

          <div className="pt-2">
            <Button type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npx next build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/profile/page.tsx
git commit -m "feat: add profile page with role-aware form"
```

---

## Task 3: Create Messages SSE Endpoint

The ChatWindow component subscribes to `/api/messages/stream?bookingId=X` but this endpoint doesn't exist.

**Files:**
- Create: `src/app/api/messages/stream/route.ts`

**Step 1: Create the SSE endpoint**

Follow the same pattern as `src/app/api/sse/loads/route.ts` — poll Redis list `sse:messages:{bookingId}` every 2 seconds.

```typescript
import { NextRequest } from "next/server"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("bookingId")
  if (!bookingId) {
    return Response.json({ error: "bookingId required" }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`)
      )

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      const pollInterval = setInterval(async () => {
        try {
          const message = await redis.lpop<string>(`sse:messages:${bookingId}`)
          if (message) {
            const parsed = typeof message === "string" ? JSON.parse(message) : message
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`)
            )
          }
        } catch {
          // Silently handle poll errors
        }
      }, 1000)

      const cleanup = () => {
        clearInterval(heartbeat)
        clearInterval(pollInterval)
      }

      ;(controller as unknown as Record<string, () => void>).__cleanup = cleanup
    },
    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, () => void>).__cleanup
      if (cleanup) cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

**Step 2: Update message POST to push to Redis list (not just pub/sub)**

In `src/app/api/messages/route.ts`, replace the `publishEvent` call with a Redis list push so the SSE polling endpoint can pick it up:

```typescript
// After creating the message, push to Redis list for SSE streaming
await redis.rpush(
  `sse:messages:${bookingId}`,
  JSON.stringify({
    id: message.id,
    content: message.content,
    senderName: message.sender.name,
    senderId: message.sender.id,
    timestamp: message.createdAt,
  })
)
```

Replace the existing `publishEvent(...)` call on line 140-143.

**Step 3: Verify build**

Run: `npx next build 2>&1 | tail -10`

**Step 4: Commit**

```bash
git add src/app/api/messages/stream/route.ts src/app/api/messages/route.ts
git commit -m "feat: add SSE endpoint for real-time messaging"
```

---

## Task 4: Fix Booking Detail Pages — Wire Up ChatWindow

Both shipper and trucker booking detail pages have broken inline chat. Replace with the working ChatWindow component.

**Files:**
- Modify: `src/app/(dashboard)/shipper/booking/[id]/page.tsx`
- Modify: `src/app/(dashboard)/trucker/booking/[id]/page.tsx`

**Step 1: Fix shipper booking page**

Replace the entire chat section (the `lg:col-span-1` div at lines 180-211) with:

```typescript
// Add import at top:
import { ChatWindow } from "@/components/messaging/ChatWindow"
import { useSession } from "next-auth/react"

// Add inside component:
const { data: session } = useSession()

// Replace the chat div:
<div className="lg:col-span-1">
  <Card className="overflow-hidden">
    <CardTitle className="mb-2">Messages</CardTitle>
    {session?.user?.id && (
      <ChatWindow
        bookingId={bookingId}
        currentUserId={session.user.id}
        className="h-[460px]"
      />
    )}
  </Card>
</div>
```

Remove the `messages`, `newMessage`, `isSending` state variables and the `sendMessage` function, and the `ChatMessage` type — they're no longer needed.

**Step 2: Fix trucker booking page**

Same change as shipper — replace the chat section (lines 309-340) with ChatWindow. Remove unused `messages`, `newMessage`, `isSending` state and `sendMessage` function and `ChatMessage` type.

**Step 3: Verify build**

Run: `npx next build 2>&1 | tail -10`

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/shipper/booking/\[id\]/page.tsx src/app/\(dashboard\)/trucker/booking/\[id\]/page.tsx
git commit -m "fix: wire up ChatWindow component in booking detail pages"
```

---

## Task 5: Create Messages Inbox Page

The nav links to `/messages` but the page doesn't exist. Create an inbox that lists all bookings with their latest message.

**Files:**
- Create: `src/app/(dashboard)/messages/page.tsx`

**Step 1: Create the messages inbox page**

```typescript
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardTitle } from "@/components/ui/Card"
import { Badge, getStatusVariant } from "@/components/ui/Badge"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline"
import { formatDateTime } from "@/lib/utils"

interface Conversation {
  bookingId: string
  status: string
  otherPartyName: string
  originAddress: string
  destAddress: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isShipper = session?.user?.role === "SHIPPER"

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/messages/conversations")
        const data = await res.json()
        if (data.success) {
          setConversations(data.data)
        }
      } catch {
        // Handle silently
      } finally {
        setIsLoading(false)
      }
    }
    fetchConversations()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const bookingBasePath = isShipper ? "/shipper/booking" : "/trucker/booking"

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-500">Your booking conversations.</p>
      </div>

      {conversations.length === 0 ? (
        <Card className="p-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">No conversations yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Messages will appear here once you have active bookings.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Link key={conv.bookingId} href={`${bookingBasePath}/${conv.bookingId}`}>
              <Card interactive className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {conv.otherPartyName}
                    </p>
                    <Badge variant={getStatusVariant(conv.status)} className="shrink-0">
                      {conv.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {conv.originAddress} → {conv.destAddress}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-sm text-slate-600 truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {conv.lastMessageAt && (
                    <p className="text-xs text-slate-400">
                      {formatDateTime(conv.lastMessageAt)}
                    </p>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-medium text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create conversations API endpoint**

Create `src/app/api/messages/conversations/route.ts`:

```typescript
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { shipperProfile: true, truckerProfile: true },
    })

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Find all bookings the user is part of
    const isShipper = !!user.shipperProfile
    const bookings = await prisma.booking.findMany({
      where: isShipper
        ? { load: { shipperProfileId: user.shipperProfile!.id } }
        : { truckerProfileId: user.truckerProfile!.id },
      include: {
        load: {
          include: {
            shipperProfile: { include: { user: { select: { name: true } } } },
          },
        },
        truckerProfile: { include: { user: { select: { name: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: session.user.id },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    const conversations = bookings.map((b) => ({
      bookingId: b.id,
      status: b.status,
      otherPartyName: isShipper
        ? b.truckerProfile.user.name || "Trucker"
        : b.load.shipperProfile.user.name || "Shipper",
      originAddress: b.load.originAddress,
      destAddress: b.load.destAddress,
      lastMessage: b.messages[0]?.content || null,
      lastMessageAt: b.messages[0]?.createdAt?.toISOString() || null,
      unreadCount: b._count.messages,
    }))

    return Response.json({ success: true, data: conversations })
  } catch (error) {
    console.error("GET /api/messages/conversations error:", error)
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
```

**Step 3: Verify build**

Run: `npx next build 2>&1 | tail -10`

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/messages/page.tsx src/app/api/messages/conversations/route.ts
git commit -m "feat: add messages inbox page with conversations list"
```

---

## Task 6: Install Three.js Dependencies

**Step 1: Install packages**

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Three.js, R3F, and drei for 3D visualization"
```

---

## Task 7: Create Three.js Load Visualizer Component

A 3D interactive truck cargo visualization. Shows the truck cargo bay with cargo inside, rotatable/zoomable. Used on load posting results and booking details.

**Files:**
- Create: `src/components/three/LoadVisualizer.tsx`

**Step 1: Create the 3D cargo visualizer**

```typescript
"use client"

import { Suspense, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Text, RoundedBox, Environment } from "@react-three/drei"
import * as THREE from "three"

interface LoadVisualizerProps {
  truckType: string
  cargoType: string
  weightTons: number
  lengthFt?: number
  widthFt?: number
  heightFt?: number
  className?: string
}

// Truck cargo bay dimensions (in feet) by type
const TRUCK_DIMS: Record<string, { l: number; w: number; h: number; label: string }> = {
  FOUR_WHEELER: { l: 8, w: 5, h: 5, label: "4-Wheeler" },
  SIX_WHEELER_OPEN: { l: 14, w: 7, h: 4, label: "6W Open" },
  SIX_WHEELER_CLOSED: { l: 14, w: 7, h: 7, label: "6W Closed" },
  TEN_WHEELER: { l: 20, w: 7.5, h: 7.5, label: "10-Wheeler" },
  TRAILER: { l: 32, w: 8, h: 8.5, label: "Trailer" },
  WING_VAN: { l: 32, w: 8, h: 8.5, label: "Wing Van" },
}

const CARGO_COLORS: Record<string, string> = {
  "General Merchandise": "#6366f1",
  "Food & Beverage": "#f59e0b",
  "Construction Materials": "#78716c",
  "Electronics": "#3b82f6",
  "Agricultural Products": "#22c55e",
  "Chemicals": "#ef4444",
  "Furniture": "#a855f7",
  "Machinery": "#64748b",
}

function TruckBed({ dims, isOpen }: { dims: { l: number; w: number; h: number }; isOpen: boolean }) {
  const scale = 0.3
  const l = dims.l * scale
  const w = dims.w * scale
  const h = dims.h * scale
  const thickness = 0.06

  return (
    <group position={[0, -h / 2, 0]}>
      {/* Floor */}
      <mesh position={[0, thickness / 2, 0]}>
        <boxGeometry args={[l, thickness, w]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Left wall */}
      <mesh position={[0, h / 2, -w / 2]}>
        <boxGeometry args={[l, h, thickness]} />
        <meshStandardMaterial color="#4b5563" metalness={0.2} roughness={0.8} transparent opacity={0.6} />
      </mesh>

      {/* Right wall */}
      <mesh position={[0, h / 2, w / 2]}>
        <boxGeometry args={[l, h, thickness]} />
        <meshStandardMaterial color="#4b5563" metalness={0.2} roughness={0.8} transparent opacity={0.6} />
      </mesh>

      {/* Back wall */}
      <mesh position={[-l / 2, h / 2, 0]}>
        <boxGeometry args={[thickness, h, w]} />
        <meshStandardMaterial color="#4b5563" metalness={0.2} roughness={0.8} transparent opacity={0.6} />
      </mesh>

      {/* Roof (closed types only) */}
      {!isOpen && (
        <mesh position={[0, h + thickness / 2, 0]}>
          <boxGeometry args={[l, thickness, w]} />
          <meshStandardMaterial color="#4b5563" metalness={0.2} roughness={0.8} transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

function CargoBox({
  position,
  size,
  color,
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
}) {
  return (
    <RoundedBox args={size} position={position} radius={0.03} smoothness={4}>
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} />
    </RoundedBox>
  )
}

function CargoLoad({
  dims,
  cargoType,
  weightTons,
  cargoLengthFt,
  cargoWidthFt,
  cargoHeightFt,
}: {
  dims: { l: number; w: number; h: number }
  cargoType: string
  weightTons: number
  cargoLengthFt?: number
  cargoWidthFt?: number
  cargoHeightFt?: number
}) {
  const scale = 0.3
  const color = CARGO_COLORS[cargoType] || "#6366f1"

  const boxes = useMemo(() => {
    const result: { pos: [number, number, number]; size: [number, number, number] }[] = []

    if (cargoLengthFt && cargoWidthFt && cargoHeightFt) {
      // Single cargo with exact dimensions
      const cl = Math.min(cargoLengthFt, dims.l) * scale
      const cw = Math.min(cargoWidthFt, dims.w) * scale
      const ch = Math.min(cargoHeightFt, dims.h) * scale
      result.push({
        pos: [0, ch / 2 - (dims.h * scale) / 2 + 0.06, 0],
        size: [cl * 0.95, ch * 0.95, cw * 0.95],
      })
    } else {
      // Generate boxes based on weight (fill percentage)
      const maxTons = dims.l * dims.w * dims.h * 0.01 // rough density estimate
      const fillRatio = Math.min(weightTons / maxTons, 0.95)
      const numBoxes = Math.max(1, Math.min(Math.ceil(fillRatio * 8), 12))
      const boxL = (dims.l * scale * 0.9) / Math.ceil(numBoxes / 2)
      const boxW = (dims.w * scale * 0.9) / 2
      const boxH = (dims.h * scale * 0.4)

      for (let i = 0; i < numBoxes; i++) {
        const col = Math.floor(i / 2)
        const row = i % 2
        const x = -((dims.l * scale) / 2) + boxL * col + boxL / 2 + 0.1
        const z = row === 0 ? -boxW / 2 - 0.05 : boxW / 2 + 0.05
        const y = boxH / 2 - (dims.h * scale) / 2 + 0.1

        if (x < (dims.l * scale) / 2) {
          result.push({
            pos: [x, y, z],
            size: [boxL * 0.9, boxH, boxW * 0.9],
          })
        }
      }
    }

    return result
  }, [dims, cargoLengthFt, cargoWidthFt, cargoHeightFt, weightTons, scale])

  return (
    <group>
      {boxes.map((box, i) => (
        <CargoBox key={i} position={box.pos} size={box.size} color={color} />
      ))}
    </group>
  )
}

function UtilizationLabel({ percentage }: { percentage: number }) {
  return (
    <Text
      position={[0, 2.2, 0]}
      fontSize={0.2}
      color={percentage > 80 ? "#dc2626" : percentage > 50 ? "#f59e0b" : "#059669"}
      anchorX="center"
      anchorY="middle"
      font="/fonts/inter-medium.woff"
    >
      {`${percentage}% capacity utilized`}
    </Text>
  )
}

function Scene({
  truckType,
  cargoType,
  weightTons,
  lengthFt,
  widthFt,
  heightFt,
}: Omit<LoadVisualizerProps, "className">) {
  const dims = TRUCK_DIMS[truckType] || TRUCK_DIMS.TEN_WHEELER
  const isOpen = truckType.includes("OPEN")
  const maxTons = dims.l * dims.w * dims.h * 0.01
  const utilization = Math.min(Math.round((weightTons / maxTons) * 100), 100)

  return (
    <>
      <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.1}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />

      <TruckBed dims={dims} isOpen={isOpen} />
      <CargoLoad
        dims={dims}
        cargoType={cargoType}
        weightTons={weightTons}
        cargoLengthFt={lengthFt}
        cargoWidthFt={widthFt}
        cargoHeightFt={heightFt}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -(dims.h * 0.3) / 2 - 0.01, 0]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>

      <UtilizationLabel percentage={utilization} />
    </>
  )
}

export function LoadVisualizer({
  truckType,
  cargoType,
  weightTons,
  lengthFt,
  widthFt,
  heightFt,
  className,
}: LoadVisualizerProps) {
  const dims = TRUCK_DIMS[truckType] || TRUCK_DIMS.TEN_WHEELER

  return (
    <div className={className}>
      <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="h-[300px] sm:h-[400px]">
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Loading 3D view...
              </div>
            }
          >
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
              <Scene
                truckType={truckType}
                cargoType={cargoType}
                weightTons={weightTons}
                lengthFt={lengthFt}
                widthFt={widthFt}
                heightFt={heightFt}
              />
            </Canvas>
          </Suspense>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{dims.label} Cargo Bay</p>
            <p className="text-xs text-slate-500">
              {dims.l}ft × {dims.w}ft × {dims.h}ft
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{weightTons} tons</p>
            <p className="text-xs text-slate-500">{cargoType}</p>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400 text-center">
        Drag to rotate · Scroll to zoom
      </p>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `npx next build 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add src/components/three/LoadVisualizer.tsx
git commit -m "feat: add Three.js 3D load/cargo visualizer component"
```

---

## Task 8: Integrate Load Visualizer into Pages

**Files:**
- Modify: `src/app/(dashboard)/shipper/booking/[id]/page.tsx`
- Modify: `src/app/(dashboard)/trucker/booking/[id]/page.tsx`

**Step 1: Add LoadVisualizer to shipper booking page**

Add below the Shipment Info card (after the closing `</Card>` at line ~147):

```typescript
import dynamic from "next/dynamic"

const LoadVisualizer = dynamic(
  () => import("@/components/three/LoadVisualizer").then(m => ({ default: m.LoadVisualizer })),
  { ssr: false, loading: () => <div className="h-[300px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-sm text-slate-400">Loading 3D view...</div> }
)

// In JSX, after the Shipment Info Card:
<LoadVisualizer
  truckType={booking.load.preferredTruck || "TEN_WHEELER"}
  cargoType={booking.load.cargoType}
  weightTons={booking.load.weightTons}
  lengthFt={booking.load.lengthFt || undefined}
  widthFt={booking.load.widthFt || undefined}
  heightFt={booking.load.heightFt || undefined}
/>
```

**Step 2: Same for trucker booking page**

Add after the Shipment Info Card.

**Step 3: Verify build**

Run: `npx next build 2>&1 | tail -10`

**Step 4: Commit**

```bash
git add src/app/\(dashboard\)/shipper/booking/\[id\]/page.tsx src/app/\(dashboard\)/trucker/booking/\[id\]/page.tsx
git commit -m "feat: integrate 3D load visualizer into booking detail pages"
```

---

## Task 9: Final Build Verification & Test

**Step 1: Full build**

```bash
npx next build
```

**Step 2: Run E2E tests to verify nothing is broken**

```bash
npx playwright test
```

**Step 3: Fix any failures discovered**

**Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: address build/test issues from platform completion"
```
