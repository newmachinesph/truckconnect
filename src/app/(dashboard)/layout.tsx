"use client"

import { useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn, getInitials } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Logo } from "@/components/brand/Logo"
import {
  HomeIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  TruckIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon,
  ArrowRightStartOnRectangleIcon,
  UsersIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  StarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  GiftIcon,
  LifebuoyIcon,
  BookmarkIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline"
import { NotificationBell } from "@/components/notifications/NotificationBell"

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  group?: string
}

const shipperNav: NavItem[] = [
  { label: "Dashboard", href: "/shipper", icon: HomeIcon, group: "Overview" },
  { label: "Post Load", href: "/shipper/post-load", icon: PlusCircleIcon, group: "Loads" },
  { label: "My Loads", href: "/shipper/my-loads", icon: ClipboardDocumentListIcon, group: "Loads" },
  { label: "Find Carriers", href: "/shipper/carriers", icon: MagnifyingGlassIcon, group: "Loads" },
  { label: "Saved Carriers", href: "/shipper/saved-carriers", icon: BookmarkIcon, group: "Loads" },
  { label: "Backhaul Deals", href: "/shipper/backhaul", icon: ArrowPathIcon, group: "Loads" },
  { label: "Contracts", href: "/contracts", icon: DocumentTextIcon, group: "Business" },
  { label: "Payments", href: "/shipper/payments", icon: CurrencyDollarIcon, group: "Finance" },
  { label: "Analytics", href: "/shipper/analytics", icon: ChartBarIcon, group: "Finance" },
  { label: "Insurance", href: "/insurance", icon: ShieldCheckIcon, group: "Finance" },
  { label: "Messages", href: "/messages", icon: ChatBubbleLeftRightIcon, group: "Communication" },
  { label: "Disputes", href: "/disputes", icon: ExclamationTriangleIcon, group: "Support" },
  { label: "Support", href: "/support", icon: LifebuoyIcon, group: "Support" },
  { label: "Reviews", href: "/shipper/reviews", icon: StarIcon, group: "Account" },
  { label: "Subscription", href: "/subscription", icon: CreditCardIcon, group: "Account" },
  { label: "Referrals", href: "/referrals", icon: GiftIcon, group: "Account" },
  { label: "Profile", href: "/profile", icon: UserCircleIcon, group: "Account" },
]

const truckerNav: NavItem[] = [
  { label: "Dashboard", href: "/trucker", icon: HomeIcon, group: "Overview" },
  { label: "Browse Loads", href: "/trucker/available-loads", icon: MagnifyingGlassIcon, group: "Loads" },
  { label: "My Trucks", href: "/trucker/my-trucks", icon: TruckIcon, group: "Fleet" },
  { label: "Backhaul", href: "/trucker/backhaul", icon: ArrowPathIcon, group: "Fleet" },
  { label: "Contracts", href: "/contracts", icon: DocumentTextIcon, group: "Business" },
  { label: "Earnings", href: "/trucker/earnings", icon: BanknotesIcon, group: "Finance" },
  { label: "Analytics", href: "/trucker/analytics", icon: ChartBarIcon, group: "Finance" },
  { label: "Insurance", href: "/insurance", icon: ShieldCheckIcon, group: "Finance" },
  { label: "Messages", href: "/messages", icon: ChatBubbleLeftRightIcon, group: "Communication" },
  { label: "Disputes", href: "/disputes", icon: ExclamationTriangleIcon, group: "Support" },
  { label: "Support", href: "/support", icon: LifebuoyIcon, group: "Support" },
  { label: "Reviews", href: "/trucker/reviews", icon: StarIcon, group: "Account" },
  { label: "Subscription", href: "/subscription", icon: CreditCardIcon, group: "Account" },
  { label: "Referrals", href: "/referrals", icon: GiftIcon, group: "Account" },
  { label: "Profile", href: "/profile", icon: UserCircleIcon, group: "Account" },
]

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: HomeIcon, group: "Overview" },
  { label: "Users", href: "/admin/users", icon: UsersIcon, group: "Management" },
  { label: "Bookings", href: "/admin/bookings", icon: ClipboardDocumentListIcon, group: "Management" },
  { label: "Approvals", href: "/admin/approvals", icon: CheckBadgeIcon, group: "Management" },
  { label: "Disputes", href: "/admin/disputes", icon: ShieldExclamationIcon, group: "Management" },
  { label: "Compliance", href: "/admin/compliance", icon: ShieldCheckIcon, group: "Management" },
  { label: "Analytics", href: "/admin/analytics", icon: ChartBarIcon, group: "Analytics" },
  { label: "Broadcast", href: "/admin/broadcast", icon: MegaphoneIcon, group: "Communication" },
  { label: "Messages", href: "/messages", icon: ChatBubbleLeftRightIcon, group: "Communication" },
  { label: "Profile", href: "/profile", icon: UserCircleIcon, group: "Account" },
]

const breadcrumbLabels: Record<string, string> = {
  shipper: "Shipper",
  trucker: "Trucker",
  admin: "Admin",
  "post-load": "Post Load",
  "my-loads": "My Loads",
  "available-loads": "Available Loads",
  "my-trucks": "My Trucks",
  backhaul: "Backhaul",
  messages: "Messages",
  profile: "Profile",
  users: "Users",
  bookings: "Bookings",
  earnings: "Earnings",
  payments: "Payments",
  reviews: "Reviews",
  booking: "Booking",
  carriers: "Carriers",
  "saved-carriers": "Saved Carriers",
  contracts: "Contracts",
  analytics: "Analytics",
  insurance: "Insurance",
  disputes: "Disputes",
  support: "Support",
  subscription: "Subscription",
  referrals: "Referrals",
  approvals: "Approvals",
  compliance: "Compliance",
  broadcast: "Broadcast",
  new: "New",
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = breadcrumbLabels[segment] || segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    const isLast = index === segments.length - 1
    return { label, href, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {index > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
          {crumb.isLast ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-gray-500 hover:text-gray-700 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

function groupNavItems(items: NavItem[]): { group: string; items: NavItem[] }[] {
  const groups: { group: string; items: NavItem[] }[] = []
  for (const item of items) {
    const groupName = item.group || "General"
    const existing = groups.find((g) => g.group === groupName)
    if (existing) {
      existing.items.push(item)
    } else {
      groups.push({ group: groupName, items: [item] })
    }
  }
  return groups
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role = session?.user?.role as string | undefined
  const isShipper = role === "SHIPPER"
  const isAdmin = role === "ADMIN"
  const navItems = isAdmin ? adminNav : isShipper ? shipperNav : truckerNav
  const groupedNav = groupNavItems(navItems)
  const userName = session?.user?.name || "User"
  const userInitials = getInitials(userName)

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  function isActive(href: string) {
    if (href === "/shipper" || href === "/trucker" || href === "/admin") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const roleLabel = isAdmin ? "Admin" : isShipper ? "Shipper" : "Trucker"
  const roleBadgeVariant = isAdmin ? "truck_ban" : isShipper ? "confirmed" : "in_transit"

  const sidebarContent = (
    <>
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-700 px-5">
        <Logo variant="light" size="sm" href="/" />
        <button
          onClick={closeSidebar}
          className="md:hidden rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Close sidebar"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="border-b border-gray-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm",
            isAdmin
              ? "bg-gray-700 text-gray-300"
              : "bg-indigo-500/20 text-indigo-400"
          )}>
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <Badge variant={roleBadgeVariant} className="mt-0.5">
              {roleLabel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groupedNav.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-indigo-500/15 text-indigo-400"
                          : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-colors",
                          active ? "text-indigo-400" : "text-gray-500"
                        )}
                      />
                      {item.label}
                      {active && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-indigo-400" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-gray-700 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <ArrowRightStartOnRectangleIcon className="h-5 w-5 text-gray-500" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex-col bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ display: "flex" }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-gray-800 bg-gray-900">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-lg px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="md:hidden">
            <Logo variant="dark" size="sm" />
          </div>

          <div className="hidden md:block flex-1">
            <Breadcrumbs pathname={pathname} />
          </div>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs",
                isAdmin
                  ? "bg-gray-100 text-gray-600"
                  : "bg-indigo-50 text-indigo-600"
              )}>
                {userInitials}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{userName}</p>
                <p className="text-xs text-gray-500 leading-tight">
                  {roleLabel}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              aria-label="Sign out"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur-lg md:hidden">
          <div className="flex">
            {navItems.slice(0, 5).map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors relative",
                    active ? "text-indigo-600" : "text-gray-400"
                  )}
                >
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-indigo-600" />
                  )}
                  <item.icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
