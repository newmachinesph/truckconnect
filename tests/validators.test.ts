import { describe, it, expect } from "vitest"
import {
  loadPostSchema,
  truckSchema,
  rateCalcSchema,
  messageSchema,
  backhaulSchema,
  trackingSchema,
  profileSchema,
  loadFilterSchema,
} from "@/lib/validators"

describe("loadPostSchema", () => {
  const validInput = {
    originAddress: "Manila",
    originLat: 14.5995,
    originLng: 120.9842,
    destAddress: "Cebu",
    destLat: 10.3157,
    destLng: 123.8854,
    cargoType: "Electronics",
    weightTons: 5,
    pickupDate: "2026-04-01T08:00:00Z",
  }

  it("accepts valid input", () => {
    const result = loadPostSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("accepts valid input with optional preferredTruck", () => {
    const result = loadPostSchema.safeParse({
      ...validInput,
      preferredTruck: "TEN_WHEELER",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing required fields", () => {
    const result = loadPostSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects missing originAddress", () => {
    const { originAddress, ...rest } = validInput
    const result = loadPostSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects invalid coordinates - lat out of range", () => {
    const result = loadPostSchema.safeParse({ ...validInput, originLat: 100 })
    expect(result.success).toBe(false)
  })

  it("rejects invalid coordinates - lng out of range", () => {
    const result = loadPostSchema.safeParse({ ...validInput, destLng: 200 })
    expect(result.success).toBe(false)
  })

  it("rejects invalid truck type", () => {
    const result = loadPostSchema.safeParse({
      ...validInput,
      preferredTruck: "BICYCLE",
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-positive weight", () => {
    const result = loadPostSchema.safeParse({ ...validInput, weightTons: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects negative weight", () => {
    const result = loadPostSchema.safeParse({ ...validInput, weightTons: -5 })
    expect(result.success).toBe(false)
  })

  it("transforms pickupDate string to Date", () => {
    const result = loadPostSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.pickupDate).toBeInstanceOf(Date)
    }
  })
})

describe("truckSchema", () => {
  const validTruck = {
    plateNumber: "ABC 1234",
    truckType: "SIX_WHEELER_OPEN" as const,
    capacityTons: 10,
  }

  it("accepts valid plate number", () => {
    const result = truckSchema.safeParse(validTruck)
    expect(result.success).toBe(true)
  })

  it("rejects invalid plate format with special chars", () => {
    const result = truckSchema.safeParse({
      ...validTruck,
      plateNumber: "ABC@1234!",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty plate number", () => {
    const result = truckSchema.safeParse({ ...validTruck, plateNumber: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing fields", () => {
    const result = truckSchema.safeParse({ plateNumber: "ABC 1234" })
    expect(result.success).toBe(false)
  })

  it("accepts optional dimension fields", () => {
    const result = truckSchema.safeParse({
      ...validTruck,
      lengthFt: 20,
      widthFt: 8,
      heightFt: 8,
    })
    expect(result.success).toBe(true)
  })
})

describe("rateCalcSchema", () => {
  const validRate = {
    originLat: 14.5995,
    originLng: 120.9842,
    destLat: 10.3157,
    destLng: 123.8854,
    truckType: "FOUR_WHEELER" as const,
  }

  it("accepts valid input", () => {
    const result = rateCalcSchema.safeParse(validRate)
    expect(result.success).toBe(true)
  })

  it("rejects missing coordinates", () => {
    const { originLat, ...rest } = validRate
    const result = rateCalcSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects invalid truck type", () => {
    const result = rateCalcSchema.safeParse({
      ...validRate,
      truckType: "MOTORCYCLE",
    })
    expect(result.success).toBe(false)
  })
})

describe("messageSchema", () => {
  it("accepts valid message", () => {
    const result = messageSchema.safeParse({
      bookingId: "booking-123",
      content: "Hello, is this available?",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty content", () => {
    const result = messageSchema.safeParse({
      bookingId: "booking-123",
      content: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects content over 1000 characters", () => {
    const result = messageSchema.safeParse({
      bookingId: "booking-123",
      content: "a".repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it("accepts content at exactly 1000 characters", () => {
    const result = messageSchema.safeParse({
      bookingId: "booking-123",
      content: "a".repeat(1000),
    })
    expect(result.success).toBe(true)
  })
})

describe("backhaulSchema", () => {
  const validBackhaul = {
    originAddress: "Cebu",
    originLat: 10.3157,
    originLng: 123.8854,
    destAddress: "Manila",
    destLat: 14.5995,
    destLng: 120.9842,
    truckType: "WING_VAN" as const,
    availableTons: 5,
    discountedRate: 15000,
    departureTime: "2026-04-01T08:00:00Z",
    expiresAt: "2026-03-31T08:00:00Z",
  }

  it("accepts valid input", () => {
    const result = backhaulSchema.safeParse(validBackhaul)
    expect(result.success).toBe(true)
  })

  it("transforms date strings to Date objects", () => {
    const result = backhaulSchema.safeParse(validBackhaul)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.departureTime).toBeInstanceOf(Date)
      expect(result.data.expiresAt).toBeInstanceOf(Date)
    }
  })

  it("accepts past dates (no validation on date freshness)", () => {
    const result = backhaulSchema.safeParse({
      ...validBackhaul,
      expiresAt: "2020-01-01T00:00:00Z",
    })
    // The schema only transforms, it does not reject past dates
    expect(result.success).toBe(true)
  })
})

describe("trackingSchema", () => {
  it("accepts valid coordinates", () => {
    const result = trackingSchema.safeParse({ lat: 14.5995, lng: 120.9842 })
    expect(result.success).toBe(true)
  })

  it("rejects lat out of range (>90)", () => {
    const result = trackingSchema.safeParse({ lat: 91, lng: 120 })
    expect(result.success).toBe(false)
  })

  it("rejects lat out of range (<-90)", () => {
    const result = trackingSchema.safeParse({ lat: -91, lng: 120 })
    expect(result.success).toBe(false)
  })

  it("rejects lng out of range (>180)", () => {
    const result = trackingSchema.safeParse({ lat: 14, lng: 181 })
    expect(result.success).toBe(false)
  })

  it("rejects lng out of range (<-180)", () => {
    const result = trackingSchema.safeParse({ lat: 14, lng: -181 })
    expect(result.success).toBe(false)
  })

  it("accepts boundary values", () => {
    expect(trackingSchema.safeParse({ lat: 90, lng: 180 }).success).toBe(true)
    expect(trackingSchema.safeParse({ lat: -90, lng: -180 }).success).toBe(true)
  })
})

describe("profileSchema", () => {
  it("accepts valid partial update", () => {
    const result = profileSchema.safeParse({ name: "Juan Dela Cruz" })
    expect(result.success).toBe(true)
  })

  it("accepts empty object (all optional)", () => {
    const result = profileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts valid role", () => {
    const result = profileSchema.safeParse({ role: "SHIPPER" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid role", () => {
    const result = profileSchema.safeParse({ role: "ADMIN" })
    expect(result.success).toBe(false)
  })

  it("accepts full profile update", () => {
    const result = profileSchema.safeParse({
      name: "Juan",
      role: "TRUCKER",
      businessName: "Juan Trucking",
      businessType: "Logistics",
      businessAddress: "Manila",
      ltfrbAccreditation: "ACC-12345",
      gcashNumber: "09171234567",
      isAvailable: true,
    })
    expect(result.success).toBe(true)
  })
})

describe("loadFilterSchema", () => {
  it("accepts valid filters", () => {
    const result = loadFilterSchema.safeParse({
      status: "OPEN",
      truckType: "TEN_WHEELER",
      minWeight: 1,
      maxWeight: 20,
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty object (all optional)", () => {
    const result = loadFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = loadFilterSchema.safeParse({ status: "UNKNOWN" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid truckType", () => {
    const result = loadFilterSchema.safeParse({ truckType: "BICYCLE" })
    expect(result.success).toBe(false)
  })

  it("accepts location filter with radius", () => {
    const result = loadFilterSchema.safeParse({
      originLat: 14.5,
      originLng: 121.0,
      radiusKm: 50,
    })
    expect(result.success).toBe(true)
  })
})
