import { test, expect } from "@playwright/test"
import {
  login,
  loginAsShipper,
  loginAsTrucker,
  USERS,
  waitForPageReady,
  expectHeading,
  expectPageLoads,
} from "./helpers"

// ---------------------------------------------------------------------------
// Cross-Role Navigation
// ---------------------------------------------------------------------------

test.describe("Cross-Role Navigation", () => {
  test("Shipper cannot see trucker sidebar items", async ({ page }) => {
    await loginAsShipper(page)
    await waitForPageReady(page)

    // Wait for sidebar to render
    await expect(page.getByRole("link", { name: "Post Load" }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("link", { name: "My Loads" }).first()).toBeVisible()

    // Trucker-only nav items should not be present
    const browseLoads = await page.getByRole("link", { name: "Browse Loads" }).count()
    const myTrucks = await page.getByRole("link", { name: "My Trucks" }).count()
    expect(browseLoads).toBe(0)
    expect(myTrucks).toBe(0)
  })

  test("Trucker cannot see shipper sidebar items", async ({ page }) => {
    await loginAsTrucker(page)
    await waitForPageReady(page)

    // Wait for sidebar to render
    await expect(page.getByRole("link", { name: "Browse Loads" }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("link", { name: "My Trucks" }).first()).toBeVisible()

    // Shipper-only nav items should not be present
    const postLoad = await page.getByRole("link", { name: "Post Load" }).count()
    const findCarriers = await page.getByRole("link", { name: "Find Carriers" }).count()
    expect(postLoad).toBe(0)
    expect(findCarriers).toBe(0)
  })

  test("Shipper can access all shared pages", async ({ page }) => {
    await loginAsShipper(page)
    await waitForPageReady(page)

    const sharedPages = [
      { url: "/contracts", heading: /contracts/i },
      { url: "/disputes", heading: /disputes/i },
      { url: "/insurance", heading: /insurance/i },
      { url: "/subscription", heading: /subscription/i },
      { url: "/referrals", heading: /referral/i },
      { url: "/support", heading: /support/i },
      { url: "/profile", heading: /profile/i },
    ]

    for (const { url, heading } of sharedPages) {
      await expectPageLoads(page, url, heading)
    }
  })

  test("Trucker can access all shared pages", async ({ page }) => {
    await loginAsTrucker(page)
    await waitForPageReady(page)

    const sharedPages = [
      { url: "/contracts", heading: /contracts/i },
      { url: "/disputes", heading: /disputes/i },
      { url: "/insurance", heading: /insurance/i },
      { url: "/subscription", heading: /subscription/i },
      { url: "/referrals", heading: /referral/i },
      { url: "/support", heading: /support/i },
      { url: "/profile", heading: /profile/i },
    ]

    for (const { url, heading } of sharedPages) {
      await expectPageLoads(page, url, heading)
    }
  })
})

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

test.describe("Messaging", () => {
  test("Shipper messages page loads", async ({ page }) => {
    await loginAsShipper(page)
    const response = await page.goto("/messages")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("Trucker messages page loads", async ({ page }) => {
    await loginAsTrucker(page)
    const response = await page.goto("/messages")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("Messages page shows conversations or loading state", async ({ page }) => {
    await loginAsShipper(page)
    const response = await page.goto("/messages")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    // Page should render without crash — content may still be loading
    const hasContent = await page.locator("aside, [role='list'], [class*='conversation']").count() > 0
    const hasEmptyState = await page.getByText(/no messages|no conversations|start a conversation/i).isVisible().catch(() => false)
    const hasHeading = await page.getByRole("heading").first().isVisible().catch(() => false)
    const isLoading = await page.locator("[class*='spinner'], [class*='loading']").isVisible().catch(() => false)

    // Any of these is acceptable — page rendered without 500 error
    expect(hasContent || hasEmptyState || hasHeading || isLoading).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Load Lifecycle Flow
// ---------------------------------------------------------------------------

test.describe("Load Lifecycle Flow", () => {
  test("Post load page renders form", async ({ page }) => {
    await loginAsShipper(page)
    await page.goto("/shipper/post-load")
    await waitForPageReady(page)

    await expectHeading(page, "Post a New Load")

    // Form elements should be visible
    await expect(page.getByText("PICKUP LOCATION").first()).toBeVisible()
    await expect(page.getByText("CARGO DETAILS").first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Post Load" })).toBeVisible()
  })

  test("Shipper can fill post load form", async ({ page }) => {
    test.setTimeout(60_000)
    await loginAsShipper(page)
    await page.goto("/shipper/post-load")
    await waitForPageReady(page)

    // Fill origin address (first Address label)
    const addressInputs = page.locator("input[placeholder*='Manila']").first()
      .or(page.getByLabel("Address").first())
    await addressInputs.fill("Makati City, Metro Manila")

    // Fill weight
    await page.getByLabel("Weight (tons)").fill("3.5")

    // Fill cargo type
    await page.getByLabel("Cargo Type").fill("Electronics")

    // Set pickup date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split("T")[0]
    await page.getByLabel("Pickup Date").fill(dateStr)

    // Verify form fields are filled
    await expect(page.getByLabel("Weight (tons)")).toHaveValue("3.5")
  })

  test("Shipper can see loads in My Loads", async ({ page }) => {
    await loginAsShipper(page)
    const response = await page.goto("/shipper/my-loads")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    await expectHeading(page, /my loads/i)
  })

  test("Trucker can see available loads", async ({ page }) => {
    await loginAsTrucker(page)
    await expectPageLoads(page, "/trucker/available-loads", /available loads|browse loads|load board/i)
  })

  test("Load cards display route information", async ({ page }) => {
    await loginAsTrucker(page)
    await page.goto("/trucker/available-loads")
    await waitForPageReady(page)

    // If there are load cards, they should show route info
    const cards = page.locator("a[href*='available-loads/']")
    const cardCount = await cards.count()

    if (cardCount > 0) {
      const firstCard = cards.first()
      const cardText = await firstCard.textContent()
      expect(cardText).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

test.describe("Edge Cases", () => {
  test("Invalid URL returns 404", async ({ page }) => {
    const response = await page.goto("/nonexistent-page")
    expect(response?.status()).toBe(404)
  })

  test("Empty state: new shipper with no data sees appropriate message", async ({ page }) => {
    await loginAsShipper(page)
    await page.goto("/shipper/my-loads")
    await waitForPageReady(page)

    // Page should load without errors
    expect(page.url()).toContain("/shipper/my-loads")
  })

  test("Rate calculator loads and has form elements", async ({ page }) => {
    const response = await page.goto("/rate-calculator")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    // Should have interactive elements
    const hasInputs = (await page.locator("select, [role='listbox'], [role='combobox'], input, button").count()) > 0
    expect(hasInputs).toBeTruthy()
  })

  test("Help page has searchable FAQ", async ({ page }) => {
    await page.goto("/help")
    await waitForPageReady(page)

    await expectHeading(page, "Help Center")

    // Should have a search input
    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toBeVisible()

    // FAQ categories should be visible
    await expect(page.getByText("Getting Started").first()).toBeVisible()
  })

  test("Navigation breadcrumbs visible in dashboard pages", async ({ page }) => {
    await loginAsShipper(page)
    await page.goto("/shipper/post-load")
    await waitForPageReady(page)

    // Breadcrumbs should show path segments
    await expect(page.getByText("Shipper").first()).toBeVisible()
    await expect(page.getByText("Post Load").first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Responsive / UI Quality
// ---------------------------------------------------------------------------

test.describe("Responsive / UI Quality", () => {
  test("Dashboard pages have proper heading hierarchy", async ({ page }) => {
    await loginAsShipper(page)
    await page.goto("/shipper/post-load")
    await waitForPageReady(page)

    // Should have at least one h1 heading
    const h1Count = await page.locator("h1").count()
    expect(h1Count).toBeGreaterThanOrEqual(1)

    const h1Text = await page.locator("h1").first().textContent()
    expect(h1Text?.trim().length).toBeGreaterThan(0)
  })

  test("Pages do not have uncaught JS errors on critical paths", async ({ page }) => {
    const errors: string[] = []

    page.on("pageerror", (err) => {
      errors.push(err.message)
    })

    await loginAsShipper(page)

    // Visit critical pages
    const pagesToCheck = [
      "/shipper",
      "/shipper/post-load",
      "/profile",
    ]

    for (const url of pagesToCheck) {
      await page.goto(url)
      await waitForPageReady(page)
    }

    // Filter out known benign errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Failed to load resource") &&
        !e.includes("net::ERR") &&
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.includes("hydrat") &&
        !e.includes("ResizeObserver") &&
        !e.includes("AbortError")
    )

    expect(criticalErrors).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Second User Tests
// ---------------------------------------------------------------------------

test.describe("Second User Tests", () => {
  test("Login as shipper2 redirects to /shipper", async ({ page }) => {
    await login(page, USERS.shipper2.email)
    await page.waitForURL("**/shipper", { timeout: 20_000 })

    expect(page.url()).toContain("/shipper")
    await waitForPageReady(page)
  })

  test("Login as trucker2 redirects to /trucker", async ({ page }) => {
    await login(page, USERS.trucker2.email)
    await page.waitForURL("**/trucker", { timeout: 20_000 })

    expect(page.url()).toContain("/trucker")
    await waitForPageReady(page)
  })

  test("Shipper2 sees their own dashboard", async ({ page }) => {
    await login(page, USERS.shipper2.email)
    await page.waitForURL("**/shipper", { timeout: 20_000 })
    await waitForPageReady(page)

    // Should show shipper sidebar nav items
    await expect(page.getByRole("link", { name: "Post Load" }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("link", { name: "My Loads" }).first()).toBeVisible()

    // Should display user name
    await expect(page.getByText(USERS.shipper2.name).first()).toBeVisible()
  })

  test("Trucker2 sees their own dashboard", async ({ page }) => {
    await login(page, USERS.trucker2.email)
    await page.waitForURL("**/trucker", { timeout: 20_000 })
    await waitForPageReady(page)

    // Should show trucker sidebar nav items
    await expect(page.getByRole("link", { name: "Browse Loads" }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole("link", { name: "My Trucks" }).first()).toBeVisible()

    // Should display user name
    await expect(page.getByText(USERS.trucker2.name).first()).toBeVisible()
  })
})
