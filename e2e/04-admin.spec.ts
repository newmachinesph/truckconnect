import { test, expect } from "@playwright/test"
import {
  loginAsAdmin,
  loginAsShipper,
  loginAsTrucker,
  USERS,
  waitForPageReady,
  expectHeading,
} from "./helpers"

// ---------------------------------------------------------------------------
// Admin Dashboard (/admin)
// ---------------------------------------------------------------------------
test.describe("Admin Dashboard", () => {
  test("loads the admin dashboard page", async ({ page }) => {
    await loginAsAdmin(page)
    const response = await page.goto("/admin")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    await expectHeading(page, "Admin Dashboard")
  })

  test("displays stat cards for users, loads, revenue, and deliveries", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin")
    await waitForPageReady(page)

    await expect(page.getByText(/Total Users/i).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Active Loads/i).first()).toBeVisible()
    await expect(page.getByText(/Revenue/i).first()).toBeVisible()
    await expect(page.getByText(/Completed Deliveries/i).first()).toBeVisible()
  })

  test("shows recent bookings section", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin")
    await waitForPageReady(page)

    await expect(page.getByText("Recent Bookings")).toBeVisible()
  })

  test("has quick links to manage users and bookings", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin")
    await waitForPageReady(page)

    await expect(page.getByText("Manage Users")).toBeVisible()
    await expect(page.getByText("Manage Bookings")).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Admin Approvals (/admin/approvals)
// ---------------------------------------------------------------------------
test.describe("Admin Approvals", () => {
  test("loads the approvals page", async ({ page }) => {
    await loginAsAdmin(page)
    const response = await page.goto("/admin/approvals")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    await expectHeading(page, "Carrier Approvals")
  })

  test("shows filter by status dropdown", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/approvals")
    await waitForPageReady(page)

    await expect(page.getByText("Filter by status")).toBeVisible()
  })

  test("shows approval queue or empty state for pending", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/approvals")
    await waitForPageReady(page)

    // Either we see approval cards or the empty state message
    const hasApprovals = await page.locator("text=Approve").first().isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/no pending approvals|all carrier registrations have been reviewed/i).isVisible().catch(() => false)

    expect(hasApprovals || hasEmptyState).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Admin Disputes (/admin/disputes)
// ---------------------------------------------------------------------------
test.describe("Admin Disputes", () => {
  test("loads the disputes page", async ({ page }) => {
    await loginAsAdmin(page)
    const response = await page.goto("/admin/disputes")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    await expectHeading(page, "Dispute Queue")
  })

  test("shows dispute list or empty state", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/disputes")
    await waitForPageReady(page)

    // Either dispute cards are visible or the empty state
    const hasDisputes = await page.getByText("Resolve").first().isVisible().catch(() => false)
    const hasEmptyState = await page.getByText("No disputes found").isVisible().catch(() => false)

    expect(hasDisputes || hasEmptyState).toBeTruthy()
  })

  test("shows status filter options", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/disputes")
    await waitForPageReady(page)

    await expect(page.getByText("Filters").first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Admin Compliance (/admin/compliance)
// ---------------------------------------------------------------------------
test.describe("Admin Compliance", () => {
  test("loads the compliance dashboard", async ({ page }) => {
    await loginAsAdmin(page)
    const response = await page.goto("/admin/compliance")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    await expectHeading(page, "Compliance Dashboard")
  })

  test("displays compliance stat cards", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/compliance")
    await waitForPageReady(page)

    await expect(page.getByText("Verified")).toBeVisible()
    await expect(page.getByText("Pending Review")).toBeVisible()
    await expect(page.getByText("Expired")).toBeVisible()
    await expect(page.getByText("Total Documents")).toBeVisible()
  })

  test("shows expiry queue section", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/compliance")
    await waitForPageReady(page)

    await expect(page.getByText(/Expiry Queue/)).toBeVisible()
  })

  test("shows audit log section", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/compliance")
    await waitForPageReady(page)

    await expect(page.getByText("Recent Audit Log")).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Admin Analytics (/admin/analytics)
// ---------------------------------------------------------------------------
test.describe("Admin Analytics", () => {
  test("loads the analytics page", async ({ page }) => {
    await loginAsAdmin(page)
    const response = await page.goto("/admin/analytics")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    await expectHeading(page, "Platform Analytics")
  })

  test("displays key metrics: GMV, Active Users, Platform Revenue", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/analytics")
    await waitForPageReady(page)

    await expect(page.getByText("Gross Merchandise Value")).toBeVisible()
    await expect(page.getByText("Active Users")).toBeVisible()
    await expect(page.getByText("Platform Revenue")).toBeVisible()
    await expect(page.getByText("Dispute Rate")).toBeVisible()
  })

  test("has an export CSV button", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/analytics")
    await waitForPageReady(page)

    await expect(page.getByRole("button", { name: /Export CSV/i })).toBeVisible()
  })

  test("shows users by role and monthly GMV sections", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/analytics")
    await waitForPageReady(page)

    await expect(page.getByText("Users by Role")).toBeVisible()
    await expect(page.getByText("Monthly GMV")).toBeVisible()
  })

  test("shows top corridors and monthly metrics tables", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/analytics")
    await waitForPageReady(page)

    await expect(page.getByText("Top Corridors")).toBeVisible()
    await expect(page.getByText("Monthly Metrics")).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Admin Broadcast (/admin/broadcast)
// ---------------------------------------------------------------------------
test.describe("Admin Broadcast", () => {
  test("loads the broadcast page", async ({ page }) => {
    await loginAsAdmin(page)
    const response = await page.goto("/admin/broadcast")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    await expectHeading(page, "Broadcast Notification")
  })

  test("shows compose message form", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/broadcast")
    await waitForPageReady(page)

    await expect(page.getByText("Compose Message")).toBeVisible()
  })

  test("has audience selector with options", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/broadcast")
    await waitForPageReady(page)

    await expect(page.getByText("Target Audience")).toBeVisible()
  })

  test("has title input, message body, and send button", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/broadcast")
    await waitForPageReady(page)

    await expect(page.getByText("Notification Title")).toBeVisible()
    await expect(page.getByText("Message Body")).toBeVisible()
    await expect(page.getByRole("button", { name: /Send Broadcast/i })).toBeVisible()
  })

  test("shows preview section", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/admin/broadcast")
    await waitForPageReady(page)

    await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Role Protection - non-admin users should not access /admin/* pages
// ---------------------------------------------------------------------------
test.describe("Admin Role Protection", () => {
  const adminPages = [
    "/admin",
    "/admin/approvals",
    "/admin/disputes",
    "/admin/compliance",
    "/admin/analytics",
    "/admin/broadcast",
  ]

  test("shipper cannot access admin pages", async ({ page }) => {
    await loginAsShipper(page)

    for (const adminPage of adminPages) {
      await page.goto(adminPage)
      await page.waitForLoadState("domcontentloaded")

      // Should be redirected away from /admin or get a 404
      const url = page.url()
      const isOnAdminPage = new URL(url).pathname.startsWith("/admin")
      const has404 = await page.getByText(/404|not found/i).isVisible().catch(() => false)

      expect(isOnAdminPage && !has404).toBeFalsy()
    }
  })

  test("trucker cannot access admin pages", async ({ page }) => {
    await loginAsTrucker(page)

    for (const adminPage of adminPages) {
      await page.goto(adminPage)
      await page.waitForLoadState("domcontentloaded")

      // Should be redirected away from /admin or get a 404
      const url = page.url()
      const isOnAdminPage = new URL(url).pathname.startsWith("/admin")
      const has404 = await page.getByText(/404|not found/i).isVisible().catch(() => false)

      expect(isOnAdminPage && !has404).toBeFalsy()
    }
  })

  test("unauthenticated user is redirected from admin pages", async ({ page }) => {
    // Go directly to /admin without logging in
    await page.goto("/admin")
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    const pathname = new URL(url).pathname

    // Should be redirected to login or not be on /admin
    const redirectedAway = !pathname.startsWith("/admin") || pathname === "/login"
    const has404 = await page.getByText(/404|not found/i).isVisible().catch(() => false)

    expect(redirectedAway || has404).toBeTruthy()
  })
})
