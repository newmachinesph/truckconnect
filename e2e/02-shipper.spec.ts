import { test, expect } from "@playwright/test"
import {
  loginAsShipper,
  USERS,
  waitForPageReady,
  expectHeading,
  navigateTo,
  expectPageLoads,
} from "./helpers"

// ────────────────────────────────────────────────────────
// Shipper Dashboard
// ────────────────────────────────────────────────────────
test.describe("Shipper Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
    await waitForPageReady(page)
  })

  test("shows welcome message with shipper name", async ({ page }) => {
    await expect(
      page.getByText(`Welcome back, ${USERS.shipper.name}`)
    ).toBeVisible({ timeout: 10000 })
  })

  test("displays stat cards including Active Loads", async ({ page }) => {
    await expect(page.getByText("Active Loads")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Pending Bookings")).toBeVisible()
    await expect(page.getByText("Completed")).toBeVisible()
    await expect(page.getByText("Total Spent")).toBeVisible()
  })

  test("sidebar navigation links are visible", async ({ page }) => {
    const sidebarLinks = [
      "Dashboard",
      "Post Load",
      "My Loads",
      "Payments",
      "Reviews",
      "Messages",
      "Find Carriers",
      "Saved Carriers",
      "Backhaul Deals",
      "Contracts",
      "Analytics",
      "Insurance",
      "Disputes",
      "Support",
      "Subscription",
      "Referrals",
    ]

    for (const linkName of sidebarLinks) {
      await expect(
        page.getByRole("link", { name: linkName }).first()
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test("shows recent loads or empty state", async ({ page }) => {
    const recentLoads = page.getByText("Recent Loads")
    const emptyState = page.getByText("No loads posted")
    await expect(recentLoads.or(emptyState).first()).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Post Load
// ────────────────────────────────────────────────────────
test.describe("Post Load", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads with correct heading", async ({ page }) => {
    await expectPageLoads(page, "/shipper/post-load", "Post a New Load")
  })

  test("has required form fields with placeholders", async ({ page }) => {
    await page.goto("/shipper/post-load")
    await waitForPageReady(page)

    // Origin address field
    const originField = page.getByPlaceholder(/Manila/i)
    await expect(originField).toBeVisible()

    // Destination address field
    const destField = page.getByPlaceholder(/Cebu/i)
    await expect(destField).toBeVisible()

    // Weight field
    const weightField = page.getByLabel(/Weight/i)
    await expect(weightField).toBeVisible()

    // Cargo type field
    const cargoField = page.getByLabel(/Cargo Type/i)
    await expect(cargoField).toBeVisible()

    // Pickup date field
    const dateField = page.getByLabel(/Pickup Date/i)
    await expect(dateField).toBeVisible()
  })

  test("can fill and submit the form with PH data", async ({ page }) => {
    await page.goto("/shipper/post-load")
    await waitForPageReady(page)

    // Fill origin address
    await page.getByPlaceholder(/Manila/i).fill("Port Area, Manila")

    // Fill destination address
    await page.getByPlaceholder(/Cebu/i).fill("Mandaue, Cebu")

    // Fill weight
    await page.getByLabel(/Weight/i).fill("8")

    // Fill cargo type
    await page.getByLabel(/Cargo Type/i).fill("Automotive Parts")

    // Fill pickup date (use a future date)
    await page.getByLabel(/Pickup Date/i).fill("2026-04-15")

    // Submit the form
    await page.getByRole("button", { name: /Post Load/i }).click()

    // After submit, should redirect to my-loads
    await page.waitForURL("**/shipper/my-loads", { timeout: 60000 })
  })
})

// ────────────────────────────────────────────────────────
// My Loads
// ────────────────────────────────────────────────────────
test.describe("My Loads", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads with correct heading", async ({ page }) => {
    await expectPageLoads(page, "/shipper/my-loads", "My Loads")
  })

  test("has filter tabs: All, Open, Booked", async ({ page }) => {
    await page.goto("/shipper/my-loads")
    await waitForPageReady(page)

    await expect(
      page.getByRole("button", { name: "All", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Open", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Booked", exact: true })
    ).toBeVisible()
  })

  test("shows load cards with route arrows and peso signs", async ({ page }) => {
    await page.goto("/shipper/my-loads")
    await waitForPageReady(page)

    // Wait for loads to appear (route arrows render as → via &rarr;)
    const arrowText = page.getByText("→").first()
    const emptyState = page.getByText("No loads found")
    await expect(arrowText.or(emptyState).first()).toBeVisible({ timeout: 10000 })

    // If loads exist, verify peso sign is present
    const pesoSign = page.getByText("₱").first()
    if (await arrowText.isVisible()) {
      await expect(pesoSign).toBeVisible()
    }
  })

  test("can click into a load detail", async ({ page }) => {
    await page.goto("/shipper/my-loads")
    await waitForPageReady(page)

    // Click the first load card link
    const firstLoadLink = page.getByRole("link").filter({ hasText: "→" }).first()
    const hasLoads = await firstLoadLink.isVisible().catch(() => false)

    if (hasLoads) {
      await firstLoadLink.click()
      await waitForPageReady(page)

      // Should navigate to a load detail page
      await expect(page).toHaveURL(/\/shipper\/my-loads\//)
    }
  })
})

// ────────────────────────────────────────────────────────
// Load Detail
// ────────────────────────────────────────────────────────
test.describe("Load Detail", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("navigating from my-loads shows load details", async ({ page }) => {
    await page.goto("/shipper/my-loads")
    await waitForPageReady(page)

    // Click the first load card link (goes to /shipper/my-loads/[id])
    const firstLoadLink = page.locator("a[href*='/shipper/my-loads/']").first()
    const hasLoads = await firstLoadLink.isVisible().catch(() => false)

    if (hasLoads) {
      await firstLoadLink.click()
      await waitForPageReady(page)

      // Should show Booking Details or Shipment Info heading
      const bookingDetails = page.getByRole("heading", { name: /Booking Details|Load Details/i })
      const shipmentInfo = page.getByText("Shipment Info")
      await expect(bookingDetails.or(shipmentInfo).first()).toBeVisible({ timeout: 15000 })

      // Should show origin/destination info
      await expect(page.getByText("Origin").first()).toBeVisible()
      await expect(page.getByText("Destination").first()).toBeVisible()

      // Should show cargo info or load info
      const cargoText = page.getByText("Cargo").first()
      const loadInfo = page.getByText(/cargo|weight|type/i).first()
      await expect(cargoText.or(loadInfo)).toBeVisible()

      // Should show bids section
      const activeBids = page.getByText(/Active Bids/i)
      const noBids = page.getByText(/No bids yet/i)
      await expect(activeBids.or(noBids).first()).toBeVisible({ timeout: 10000 })
    }
  })
})

// ────────────────────────────────────────────────────────
// Payments
// ────────────────────────────────────────────────────────
test.describe("Payments", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/shipper/payments")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("shows payment history or empty state", async ({ page }) => {
    await page.goto("/shipper/payments")
    await waitForPageReady(page)

    // Page should have some meaningful content
    const content = page.locator("main, [role='main'], .mx-auto").first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Reviews
// ────────────────────────────────────────────────────────
test.describe("Reviews", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/shipper/reviews")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("shows reviews or empty state", async ({ page }) => {
    await page.goto("/shipper/reviews")
    await waitForPageReady(page)

    const content = page.locator("main, [role='main'], .mx-auto").first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Find Carriers
// ────────────────────────────────────────────────────────
test.describe("Find Carriers", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/shipper/carriers")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("has a search input", async ({ page }) => {
    await page.goto("/shipper/carriers")
    await waitForPageReady(page)

    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toBeVisible({ timeout: 10000 })
  })

  test("shows carrier cards or empty state", async ({ page }) => {
    await page.goto("/shipper/carriers")
    await waitForPageReady(page)

    const content = page.locator("main, [role='main'], .mx-auto").first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Saved Carriers
// ────────────────────────────────────────────────────────
test.describe("Saved Carriers", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/shipper/saved-carriers")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })
})

// ────────────────────────────────────────────────────────
// Backhaul
// ────────────────────────────────────────────────────────
test.describe("Backhaul", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/shipper/backhaul")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("has filter section", async ({ page }) => {
    await page.goto("/shipper/backhaul")
    await waitForPageReady(page)

    // The backhaul page has filter controls (search input or filter button)
    const filterButton = page.getByRole("button").filter({ hasText: /filter/i }).first()
    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(filterButton.or(searchInput).first()).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Contracts
// ────────────────────────────────────────────────────────
test.describe("Contracts", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/contracts")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("shows contracts list or empty state", async ({ page }) => {
    await page.goto("/contracts")
    await waitForPageReady(page)

    const content = page.locator("main, [role='main'], .mx-auto").first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────────────────
test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    await expectPageLoads(page, "/shipper/analytics", /Analytics/i)
  })

  test("shows summary metrics", async ({ page }) => {
    await page.goto("/shipper/analytics")
    await waitForPageReady(page)

    await expect(page.getByText("Total Spend")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Active Loads")).toBeVisible()
  })

  test("has export button", async ({ page }) => {
    await page.goto("/shipper/analytics")
    await waitForPageReady(page)

    await expect(
      page.getByRole("button", { name: /Export/i })
    ).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Insurance
// ────────────────────────────────────────────────────────
test.describe("Insurance", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/insurance")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })
})

// ────────────────────────────────────────────────────────
// Disputes
// ────────────────────────────────────────────────────────
test.describe("Disputes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/disputes")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("has create dispute button", async ({ page }) => {
    await page.goto("/disputes")
    await waitForPageReady(page)

    const createButton = page.getByRole("link", { name: /File|Create|New/i }).first()
      .or(page.getByRole("button", { name: /File|Create|New/i }).first())
    await expect(createButton.first()).toBeVisible({ timeout: 10000 })
  })
})

// ────────────────────────────────────────────────────────
// Support
// ────────────────────────────────────────────────────────
test.describe("Support", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/support")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("has new ticket button", async ({ page }) => {
    await page.goto("/support")
    await waitForPageReady(page)

    await expect(
      page.getByRole("link", { name: /New Ticket/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test("can navigate to new ticket page", async ({ page }) => {
    await page.goto("/support")
    await waitForPageReady(page)

    await page.getByRole("link", { name: /New Ticket/i }).first().click()
    await page.waitForURL("**/support/new", { timeout: 15000 })
    await waitForPageReady(page)
  })
})

// ────────────────────────────────────────────────────────
// Subscription
// ────────────────────────────────────────────────────────
test.describe("Subscription", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    await expectPageLoads(page, "/subscription", /Subscription/i)
  })

  test("shows plan cards: Free, Fleet Pro, Enterprise", async ({ page }) => {
    await page.goto("/subscription")
    await waitForPageReady(page)

    // Plan names rendered as headings in plan cards
    await expect(page.getByText("Fleet Pro").first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Enterprise").first()).toBeVisible()
    await expect(page.getByText("Free").first()).toBeVisible()
  })
})

// ────────────────────────────────────────────────────────
// Referrals
// ────────────────────────────────────────────────────────
test.describe("Referrals", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    await expectPageLoads(page, "/referrals", /Referral/i)
  })

  test("shows referral code section", async ({ page }) => {
    await page.goto("/referrals")
    await waitForPageReady(page)

    // Referral code heading in the green banner
    await expect(
      page.getByText("Your Referral Code").first()
    ).toBeVisible({ timeout: 15000 })
  })
})

// ────────────────────────────────────────────────────────
// Profile
// ────────────────────────────────────────────────────────
test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsShipper(page)
  })

  test("page loads without server error", async ({ page }) => {
    const response = await page.goto("/profile")
    expect(response?.status()).toBeLessThan(500)
    await waitForPageReady(page)
  })

  test("shows profile form with name and email", async ({ page }) => {
    await page.goto("/profile")
    await waitForPageReady(page)

    // Full Name is an input label in the Edit Profile section
    const nameField = page.getByLabel("Full Name")
    await expect(nameField).toBeVisible({ timeout: 10000 })
    // Email is displayed as text in Account Information, not a form input
    await expect(page.getByText("Email").first()).toBeVisible()
  })

  test("shows role-specific fields for shipper", async ({ page }) => {
    await page.goto("/profile")
    await waitForPageReady(page)

    // Shipper profile should show business-related fields
    const businessField = page.getByLabel(/Business/i).first()
      .or(page.getByText(/Business/i).first())
    await expect(businessField).toBeVisible({ timeout: 10000 })
  })
})
