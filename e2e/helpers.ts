import { Page, expect } from "@playwright/test"

// ── Demo Credentials ──
export const USERS = {
  shipper: {
    email: "maria.santos@cebupackaging.ph",
    name: "Maria Santos",
    role: "SHIPPER",
  },
  trucker: {
    email: "ricardo.cruz@example.com",
    name: "Ricardo Cruz",
    role: "TRUCKER",
  },
  admin: {
    email: "admin@test.com",
    name: "Alejandro Magno",
    role: "ADMIN",
  },
  shipper2: {
    email: "shipper@test.com",
    name: "Gabriela Villanueva",
    role: "SHIPPER",
  },
  trucker2: {
    email: "trucker@test.com",
    name: "Juan Dela Cruz",
    role: "TRUCKER",
  },
} as const

// ── Login Helpers ──
export async function login(page: Page, email: string) {
  await page.goto("/login")
  await page.getByLabel("Email Address").fill(email)
  await page.getByRole("button", { name: "Sign In" }).click()
}

export async function loginAsShipper(page: Page) {
  await login(page, USERS.shipper.email)
  await page.waitForURL("**/shipper", { timeout: 20000 })
}

export async function loginAsTrucker(page: Page) {
  await login(page, USERS.trucker.email)
  await page.waitForURL("**/trucker", { timeout: 20000 })
}

export async function loginAsAdmin(page: Page) {
  await login(page, USERS.admin.email)
  // Admin may redirect to /admin or /onboarding depending on setup
  await page.waitForURL(/\/(admin|shipper|trucker|onboarding)/, { timeout: 20000 })
}

// ── Navigation Helpers ──
export async function navigateTo(page: Page, linkName: string) {
  await page.getByRole("link", { name: linkName }).click()
  await page.waitForLoadState("domcontentloaded")
}

// ── Wait Helpers ──
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState("domcontentloaded")
  await page.waitForTimeout(1000)
}

// ── Assertion Helpers ──
export async function expectHeading(page: Page, text: string | RegExp) {
  await expect(page.getByRole("heading", { name: text }).first()).toBeVisible({ timeout: 10000 })
}

export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("hydrat")) {
      errors.push(msg.text())
    }
  })
  return errors
}

// ── Page Load Verification ──
export async function expectPageLoads(page: Page, url: string, headingText?: string | RegExp) {
  const response = await page.goto(url)
  expect(response?.status()).toBeLessThan(500)
  await waitForPageReady(page)
  if (headingText) {
    await expectHeading(page, headingText)
  }
}
