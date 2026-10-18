"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatDate } from "@/lib/utils"
import {
  UsersIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline"

type UserRow = {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string | null
  createdAt: string
  shipperProfile: {
    businessName: string
    _count: { loads: number }
  } | null
  truckerProfile: {
    isAvailable: boolean
    _count: { bookings: number; trucks: number }
  } | null
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}

const roleFilters = [
  { label: "All", value: "" },
  { label: "Shipper", value: "SHIPPER" },
  { label: "Trucker", value: "TRUCKER" },
  { label: "Admin", value: "ADMIN" },
]

export default function AdminUsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<UserRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [activeRole, setActiveRole] = useState(searchParams.get("role") || "")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const currentPage = parseInt(searchParams.get("page") || "1", 10)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeRole) params.set("role", activeRole)
      if (searchQuery) params.set("search", searchQuery)
      params.set("page", currentPage.toString())

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setUsers(data.data || [])
        setPagination(data.pagination || null)
      }
    } catch {
      // Silently handle errors
    } finally {
      setIsLoading(false)
    }
  }, [activeRole, searchQuery, currentPage])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    // Reset page when filters change
    if (!updates.page) {
      params.delete("page")
    }
    router.push(`/admin/users?${params.toString()}`)
  }

  function handleRoleFilter(role: string) {
    setActiveRole(role)
    updateParams({ role, page: "" })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ search: searchQuery, page: "" })
  }

  async function handleVerify(userId: string, verify: boolean) {
    setActionLoading(userId)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyTrucker: verify }),
      })
      await fetchUsers()
    } catch {
      // Silently handle errors
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBan(userId: string, ban: boolean, currentRole: string | null) {
    setActionLoading(userId)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banned: ban,
          restoreRole: !ban ? currentRole : undefined,
        }),
      })
      await fetchUsers()
    } catch {
      // Silently handle errors
    } finally {
      setActionLoading(null)
    }
  }

  function getRoleBadgeVariant(role: string | null) {
    if (role === "SHIPPER") return "confirmed" as const
    if (role === "TRUCKER") return "in_transit" as const
    if (role === "ADMIN") return "truck_ban" as const
    return "default" as const
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-warm-800">User Management</h1>
        <p className="mt-1 text-sm text-warm-400">
          View and manage all platform users.
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Role Filter */}
          <div className="flex gap-2">
            {roleFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleRoleFilter(filter.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeRole === filter.value
                    ? "bg-indigo-50 text-indigo-500"
                    : "bg-warm-100 text-warm-500 hover:bg-warm-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-md border border-warm-200 pl-10 pr-4 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
          </form>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <CardTitle className="mb-4">
          Users {pagination ? `(${pagination.total})` : ""}
        </CardTitle>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-warm-100 rounded" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title="No users found"
            description="Try adjusting your search or filters."
            size="sm"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-warm-100 text-left">
                    <th className="pb-3 font-medium text-warm-400">Name</th>
                    <th className="pb-3 font-medium text-warm-400">Email</th>
                    <th className="pb-3 font-medium text-warm-400">Role</th>
                    <th className="pb-3 font-medium text-warm-400">Status</th>
                    <th className="pb-3 font-medium text-warm-400">Joined</th>
                    <th className="pb-3 font-medium text-warm-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface">
                      <td className="py-3">
                        <p className="font-medium text-warm-800">{user.name || "No name"}</p>
                        {user.shipperProfile && (
                          <p className="text-xs text-warm-400">{user.shipperProfile.businessName}</p>
                        )}
                      </td>
                      <td className="py-3 text-warm-500">
                        {user.email || user.phone || "N/A"}
                      </td>
                      <td className="py-3">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role || "BANNED"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {user.role === "TRUCKER" && user.truckerProfile && (
                          <span className={`text-xs font-medium ${user.truckerProfile.isAvailable ? "text-indigo-600" : "text-warm-300"}`}>
                            {user.truckerProfile.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        )}
                        {user.role === "SHIPPER" && user.shipperProfile && (
                          <span className="text-xs text-warm-400">
                            {user.shipperProfile._count.loads} loads
                          </span>
                        )}
                        {!user.role && (
                          <span className="text-xs text-red-500 font-medium">Banned</span>
                        )}
                      </td>
                      <td className="py-3 text-warm-400 text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {user.role === "TRUCKER" && (
                            <button
                              onClick={() => handleVerify(user.id, true)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded text-indigo-600 hover:bg-indigo-500-50 transition-colors disabled:opacity-50"
                              title="Verify trucker"
                            >
                              <CheckBadgeIcon className="h-4 w-4" />
                            </button>
                          )}
                          {user.role ? (
                            <button
                              onClick={() => handleBan(user.id, true, user.role)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Ban user"
                            >
                              <NoSymbolIcon className="h-4 w-4" />
                            </button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBan(user.id, false, "SHIPPER")}
                              disabled={actionLoading === user.id}
                            >
                              Unban
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-warm-100">
                <p className="text-xs text-warm-400">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => updateParams({ page: (pagination.page - 1).toString() })}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!pagination.hasMore}
                    onClick={() => updateParams({ page: (pagination.page + 1).toString() })}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
