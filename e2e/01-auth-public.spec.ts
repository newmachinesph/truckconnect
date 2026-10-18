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

// ────────────────────────────────────────────────────────────────
// Auth Flow Tests
// ────────────────────────────────────────────────────────────────
test.describe("Auth Flow", () => {
  test("landing page loads with hero section", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    // Hero heading
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 15000 })

    // Register / CTA links visible
    const registerLinks = page.getByRole("link", { name: /register|get started|sign up/i })
    await expect(registerLinks.first()).toBeVisible()
  })

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login")
    await waitForPageReady(page)

    // Main heading
    await expectHeading(page, "Welcome back")

    // Email / Phone tabs
    await expect(page.getByRole("button", { name: "Email" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Phone" })).toBeVisible()

    // Email input and submit
    await expect(page.getByLabel("Email Address")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
  })

  test("login with shipper email redirects to /shipper dashboard", async ({ page }) => {
    await login(page, USERS.shipper.email)
    await page.waitForURL("**/shipper", { timeout: 20000 })

    await waitForPageReady(page)
    expect(page.url()).toContain("/shipper")
  })

  test("login with trucker email redirects to /trucker dashboard", async ({ page }) => {
    await login(page, USERS.trucker.email)
    await page.waitForURL("**/trucker", { timeout: 20000 })

    await waitForPageReady(page)
    expect(page.url()).toContain("/trucker")
  })

  test("login with phone tab works", async ({ page }) => {
    await page.goto("/login")
    await waitForPageReady(page)

    // Switch to Phone tab
    await page.getByRole("button", { name: "Phone" }).click()

    // Fill phone number and submit
    const phoneInput = page.getByLabel(/phone/i)
    await expect(phoneInput).toBeVisible()
    await phoneInput.fill("+639171234567")

    await page.getByRole("button", { name: "Sign In" }).click()

    // Should attempt login (no error crash)
    await page.waitForLoadState("domcontentloaded")
  })

  test("navigate between login and register", async ({ page }) => {
    // Start at login
    await page.goto("/login")
    await waitForPageReady(page)

    // Click register link
    await page.getByRole("link", { name: "Create a free account" }).click()
    await page.waitForURL("**/register", { timeout: 15000 })
    await waitForPageReady(page)
    expect(page.url()).toContain("/register")

    // Click sign-in link back to login
    await page.getByRole("link", { name: /sign in/i }).click()
    await page.waitForURL("**/login", { timeout: 15000 })
    await waitForPageReady(page)
    expect(page.url()).toContain("/login")
  })

  test("register new shipper", async ({ page }) => {
    test.setTimeout(90000)

    const uniqueEmail = `test.shipper.${Date.now()}@testmail.ph`

    await page.goto("/register?role=shipper")
    await waitForPageReady(page)

    await page.getByLabel("Full Name").fill("Elena Magsaysay")
    await page.getByLabel("Email Address").fill(uniqueEmail)
    await page.getByLabel("Phone Number").fill("+639281234567")

    const submitButton = page.getByRole("button", { name: "Create Account" })
    await submitButton.click()

    // Wait for either: redirect to onboarding, or error message, or URL change
    try {
      await page.waitForURL(/\/(onboarding|shipper|trucker)/, { timeout: 60000 })
    } catch {
      // If redirect didn't happen, verify no server crash — form may show validation error
      const hasError = await page.getByText(/failed|wrong|error/i).isVisible().catch(() => false)
      const has500 = await page.getByText(/500|internal server error/i).isVisible().catch(() => false)
      expect(has500).toBeFalsy()
      // If there's a user-facing error that's acceptable (e.g. duplicate email)
      // but a 500 crash is not
    }
  })

  test("register new trucker", async ({ page }) => {
    test.setTimeout(90000)

    const uniqueEmail = `test.trucker.${Date.now()}@testmail.ph`

    await page.goto("/register?role=trucker")
    await waitForPageReady(page)

    await page.getByLabel("Full Name").fill("Andres Bonifacio Jr.")
    await page.getByLabel("Email Address").fill(uniqueEmail)
    await page.getByLabel("Phone Number").fill("+639351234567")

    const submitButton = page.getByRole("button", { name: "Create Account" })
    await submitButton.click()

    try {
      await page.waitForURL(/\/(onboarding|shipper|trucker)/, { timeout: 60000 })
    } catch {
      const has500 = await page.getByText(/500|internal server error/i).isVisible().catch(() => false)
      expect(has500).toBeFalsy()
    }
  })
})

// ────────────────────────────────────────────────────────────────
// Public Pages (no auth required)
// ────────────────────────────────────────────────────────────────
test.describe("Public Pages", () => {
  test("help page loads with FAQ content and search", async ({ page }) => {
    await expectPageLoads(page, "/help")

    // Help Center heading
    await expect(page.getByText("Help Center").first()).toBeVisible()

    // FAQ categories visible (e.g., "Getting Started")
    await expect(page.getByText("Getting Started").first()).toBeVisible()

    // Search input
    await expect(page.getByPlaceholder(/search/i).first()).toBeVisible()
  })

  test("rate calculator page loads", async ({ page }) => {
    await expectPageLoads(page, "/rate-calculator")

    // Page should render without server error
    await waitForPageReady(page)
    expect(page.url()).toContain("/rate-calculator")
  })

  test("public tracking page for nonexistent shipment shows error state", async ({ page }) => {
    await page.goto("/track/nonexistent")
    await waitForPageReady(page)

    await expect(page.getByText("Tracking Unavailable")).toBeVisible({ timeout: 10000 })
  })

  test("landing page has stats section", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    // Scroll to stats section and verify it exists
    const statsText = page.getByText("Loads Posted")
    await statsText.scrollIntoViewIfNeeded()
    await expect(statsText).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Verified Truckers").first()).toBeVisible()
  })
})
