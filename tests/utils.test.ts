import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { cn, formatPeso, formatDate, formatDateTime, getInitials, timeAgo } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2")
  })

  it("handles empty input", () => {
    expect(cn()).toBe("")
  })

  it("resolves complex tailwind conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })
})

describe("formatPeso", () => {
  it("formats with peso sign", () => {
    const result = formatPeso(1000)
    expect(result).toContain("\u20B1")
  })

  it("handles zero", () => {
    expect(formatPeso(0)).toBe("\u20B10")
  })

  it("formats large numbers with commas", () => {
    const result = formatPeso(1000000)
    expect(result).toContain("1,000,000")
  })

  it("formats without decimal places", () => {
    const result = formatPeso(1234.56)
    // maximumFractionDigits: 0 means no decimals
    expect(result).not.toContain(".")
  })
})

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-01-15T00:00:00Z"))
    // en-PH locale, short month format
    expect(result).toContain("Jan")
    expect(result).toContain("15")
    expect(result).toContain("2026")
  })

  it("formats a date string", () => {
    const result = formatDate("2026-06-20T12:00:00Z")
    expect(result).toContain("Jun")
    expect(result).toContain("2026")
  })
})

describe("formatDateTime", () => {
  it("formats a Date with time", () => {
    const result = formatDateTime(new Date("2026-01-15T14:30:00Z"))
    expect(result).toContain("Jan")
    expect(result).toContain("15")
    expect(result).toContain("2026")
  })

  it("formats a date string with time", () => {
    const result = formatDateTime("2026-06-20T08:00:00Z")
    expect(result).toContain("Jun")
    expect(result).toContain("2026")
  })
})

describe("getInitials", () => {
  it("returns initials for two names", () => {
    expect(getInitials("Juan Cruz")).toBe("JC")
  })

  it("returns initial for single name", () => {
    expect(getInitials("Juan")).toBe("J")
  })

  it("returns empty string for empty input", () => {
    expect(getInitials("")).toBe("")
  })

  it("limits to 2 characters for long names", () => {
    expect(getInitials("Juan Dela Cruz Santos")).toBe("JD")
  })

  it("uppercases initials", () => {
    expect(getInitials("juan cruz")).toBe("JC")
  })
})

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-13T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 'just now' for recent times", () => {
    expect(timeAgo(new Date("2026-03-13T11:59:45Z"))).toBe("just now")
  })

  it("returns minutes ago", () => {
    expect(timeAgo(new Date("2026-03-13T11:55:00Z"))).toBe("5m ago")
  })

  it("returns hours ago", () => {
    expect(timeAgo(new Date("2026-03-13T09:00:00Z"))).toBe("3h ago")
  })

  it("returns days ago", () => {
    expect(timeAgo(new Date("2026-03-11T12:00:00Z"))).toBe("2d ago")
  })

  it("returns formatted date for older than a week", () => {
    const result = timeAgo(new Date("2026-02-01T12:00:00Z"))
    expect(result).toContain("Feb")
    expect(result).toContain("2026")
  })

  it("works with string input", () => {
    expect(timeAgo("2026-03-13T11:55:00Z")).toBe("5m ago")
  })
})
