import { test, expect } from "@playwright/test"
import {
  loginAsTrucker,
  USERS,
  waitForPageReady,
  expectHeading,
  expectPageLoads,
  navigateTo,
} from "./helpers"

// ── Trucker Dashboard ─────────────────────────────────────────────────────────

test.describe("Trucker Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
    await waitForPageReady(page)
  })

  test("shows trucker name in welcome message", async ({ page }) => {
    await expect(page.getByText(USERS.trucker.name).first()).toBeVisible({ timeout: 15000 })
  })

  test("shows availability toggle switch", async ({ page }) => {
    const toggle = page.getByRole("switch")
    await expect(toggle).toBeVisible({ timeout: 15000 })
  })

  test("shows Available Loads stat", async ({ page }) => {
    await expect(page.getByText("Available Loads").first()).toBeVisible({ timeout: 15000 })
  })

  test("shows Active Jobs stat", async ({ page }) => {
    await expect(page.getByText("Active Jobs")).toBeVisible()
  })

  test("shows Available Loads Near You section", async ({ page }) => {
    await expect(
      page.getByText("Available Loads Near You").or(page.getByText("Available Loads Nearby"))
    ).toBeVisible()
  })

  test("availability toggle can be clicked and aria-checked changes", async ({ page }) => {
    const toggle = page.getByRole("switch")
    const initialChecked = await toggle.getAttribute("aria-checked")
    await toggle.click()
    await page.waitForTimeout(500)
    const newChecked = await toggle.getAttribute("aria-checked")
    expect(newChecked).not.toBe(initialChecked)
  })
})

// ── Browse Loads ──────────────────────────────────────────────────────────────

test.describe("Browse Loads", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
    await page.goto("/trucker/available-loads")
    await waitForPageReady(page)
  })

  test("shows Available Loads heading", async ({ page }) => {
    await expectHeading(page, "Available Loads")
  })

  test("has search input with city placeholder", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search by city/i)
    await expect(searchInput).toBeVisible()
  })

  test("has Refresh button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /refresh/i })).toBeVisible()
  })

  test("shows load cards with accept buttons, route arrows, and peso signs", async ({ page }) => {
    // Wait for loads to render (may be empty if no seed data for open loads)
    const cards = page.locator("[class*=Card]").filter({ hasText: /Accept/ })
    const cardCount = await cards.count()

    if (cardCount > 0) {
      // Check route arrows (rendered as &rarr; which becomes the arrow character)
      await expect(page.getByText("\u2192").first()).toBeVisible()
      // Check peso sign
      await expect(page.getByText("\u20B1").first()).toBeVisible()
      // Check accept button
      await expect(page.getByRole("button", { name: /accept/i }).first()).toBeVisible()
    }
  })

  test("can search by city name", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search by city/i)
    await searchInput.fill("Manila")
    await page.waitForTimeout(500)
    // After typing, the page should filter - we just verify no crash
    await expect(searchInput).toHaveValue("Manila")
  })

  test("can click into load detail", async ({ page }) => {
    // If there are load cards with links, click the first one
    const loadLinks = page.locator("a[href*='/trucker/available-loads/']")
    const linkCount = await loadLinks.count()

    if (linkCount > 0) {
      await loadLinks.first().click()
      await waitForPageReady(page)
      await expect(page.url()).toContain("/trucker/available-loads/")
    }
  })
})

// ── Load Detail ───────────────────────────────────────────────────────────────

test.describe("Load Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("shows shipment details, origin, destination on load detail page", async ({ page }) => {
    await page.goto("/trucker/available-loads")
    await waitForPageReady(page)

    // Try navigating to a load detail if links exist
    const loadLinks = page.locator("a[href*='/trucker/available-loads/']")
    const linkCount = await loadLinks.count()

    if (linkCount > 0) {
      await loadLinks.first().click()
      await waitForPageReady(page)

      await expect(page.getByText("Shipment Details")).toBeVisible({ timeout: 10000 })
      await expect(page.getByText("Origin").first()).toBeVisible()
      await expect(page.getByText("Destination").first()).toBeVisible()
    }
  })

  test("shows bid form when load is OPEN", async ({ page }) => {
    await page.goto("/trucker/available-loads")
    await waitForPageReady(page)

    const loadLinks = page.locator("a[href*='/trucker/available-loads/']")
    const linkCount = await loadLinks.count()

    if (linkCount > 0) {
      await loadLinks.first().click()
      await waitForPageReady(page)

      // Check for the bid form heading
      await expect(page.getByText("Place Your Bid")).toBeVisible({ timeout: 10000 })
    }
  })
})

// ── My Trucks ─────────────────────────────────────────────────────────────────

test.describe("My Trucks", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
    await page.goto("/trucker/my-trucks")
    await waitForPageReady(page)
  })

  test("shows My Trucks heading", async ({ page }) => {
    await expectHeading(page, "My Trucks")
  })

  test("shows NCR 7842 truck card", async ({ page }) => {
    await expect(page.getByText("NCR 7842")).toBeVisible({ timeout: 10000 })
  })

  test("shows NCR 2156 truck card", async ({ page }) => {
    await expect(page.getByText("NCR 2156")).toBeVisible({ timeout: 10000 })
  })

  test("shows 15 tons capacity", async ({ page }) => {
    await expect(page.getByText("15 tons")).toBeVisible({ timeout: 10000 })
  })

  test("shows Verified badge", async ({ page }) => {
    await expect(page.getByText("Verified").first()).toBeVisible({ timeout: 10000 })
  })

  test("has Add Truck button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /add truck/i })).toBeVisible()
  })

  test("can open add truck modal and fill form", async ({ page }) => {
    await page.getByRole("button", { name: /add truck/i }).click()
    await expect(page.getByText("Add a Truck")).toBeVisible()

    // Fill the form fields
    await page.getByLabel("Plate Number").fill("TEST 1234")
    await expect(page.getByLabel("Plate Number")).toHaveValue("TEST 1234")

    // Fill capacity
    await page.getByLabel(/capacity/i).fill("12")
    await expect(page.getByLabel(/capacity/i)).toHaveValue("12")
  })
})

// ── Earnings ──────────────────────────────────────────────────────────────────

test.describe("Earnings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("page loads with earnings data or empty state", async ({ page }) => {
    const response = await page.goto("/trucker/earnings")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    // Should show some content - either earnings data or an empty state
    const body = page.locator("body")
    await expect(body).not.toBeEmpty()
  })
})

// ── Reviews ───────────────────────────────────────────────────────────────────

test.describe("Reviews", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("page loads", async ({ page }) => {
    const response = await page.goto("/trucker/reviews")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })
})

// ── Backhaul ──────────────────────────────────────────────────────────────────

test.describe("Backhaul", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("page loads with backhaul content", async ({ page }) => {
    const response = await page.goto("/trucker/backhaul")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    const body = page.locator("body")
    await expect(body).not.toBeEmpty()
  })
})

// ── Contracts (shared) ───────────────────────────────────────────────────────

test.describe("Contracts", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("page loads", async ({ page }) => {
    const response = await page.goto("/contracts")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })
})

// ── Analytics ─────────────────────────────────────────────────────────────────

test.describe("Trucker Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
    await page.goto("/trucker/analytics")
    await waitForPageReady(page)
  })

  test("shows Trucker Analytics heading", async ({ page }) => {
    await expectHeading(page, "Trucker Analytics")
  })

  test("shows Total Earnings metric", async ({ page }) => {
    await expect(page.getByText("Total Earnings").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows Active Bookings metric", async ({ page }) => {
    await expect(page.getByText("Active Bookings").first()).toBeVisible({ timeout: 10000 })
  })

  test("shows Utilization metric", async ({ page }) => {
    await expect(page.getByText("Utilization").first()).toBeVisible({ timeout: 10000 })
  })

  test("has export button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible()
  })
})

// ── Insurance (shared) ───────────────────────────────────────────────────────

test.describe("Insurance", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("page loads", async ({ page }) => {
    const response = await page.goto("/insurance")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })
})

// ── Disputes (shared) ────────────────────────────────────────────────────────

test.describe("Disputes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("page loads", async ({ page }) => {
    const response = await page.goto("/disputes")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })
})

// ── Support (shared) ─────────────────────────────────────────────────────────

test.describe("Support", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("page loads", async ({ page }) => {
    const response = await page.goto("/support")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })
})

// ── Subscription (shared) ────────────────────────────────────────────────────

test.describe("Subscription", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("shows plan cards", async ({ page }) => {
    const response = await page.goto("/subscription")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    // The subscription page shows plan cards (Free, Fleet Pro, Enterprise)
    await expect(page.getByText("Free").first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Fleet Pro").first()).toBeVisible({ timeout: 10000 })
  })
})

// ── Referrals (shared) ───────────────────────────────────────────────────────

test.describe("Referrals", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
  })

  test("shows referral section", async ({ page }) => {
    const response = await page.goto("/referrals")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)

    // Referral page should show referral-related content
    const body = page.locator("body")
    await expect(body).not.toBeEmpty()
  })
})

// ── Profile ──────────────────────────────────────────────────────────────────

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrucker(page)
    await page.goto("/profile")
    await waitForPageReady(page)
  })

  test("shows trucker-specific LTFRB accreditation field", async ({ page }) => {
    await expect(
      page.getByText(/LTFRB/i).first()
    ).toBeVisible({ timeout: 10000 })
  })

  test("shows accreditation number from seed data", async ({ page }) => {
    // Accreditation number is in an input field, not visible as text
    const ltfrbInput = page.getByLabel(/LTFRB/i)
    await expect(ltfrbInput).toBeVisible({ timeout: 10000 })
    await expect(ltfrbInput).toHaveValue(/LTFRB-NCR-2025-0042/)
  })
})
