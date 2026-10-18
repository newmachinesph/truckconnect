import { z } from "zod"

export const loadPostSchema = z.object({
  originAddress: z.string().min(1, "Origin address is required"),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(1, "Destination address is required"),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  cargoType: z.string().min(1, "Cargo type is required"),
  weightTons: z.number().positive("Weight must be positive"),
  lengthFt: z.number().positive().optional(),
  widthFt: z.number().positive().optional(),
  heightFt: z.number().positive().optional(),
  preferredTruck: z.enum([
    "FOUR_WHEELER",
    "SIX_WHEELER_OPEN",
    "SIX_WHEELER_CLOSED",
    "TEN_WHEELER",
    "TRAILER",
    "WING_VAN",
  ]).optional(),
  pickupDate: z.string().transform((s) => new Date(s)),
})

export const truckSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required").regex(/^[A-Z0-9 -]+$/i, "Invalid plate number format"),
  truckType: z.enum([
    "FOUR_WHEELER",
    "SIX_WHEELER_OPEN",
    "SIX_WHEELER_CLOSED",
    "TEN_WHEELER",
    "TRAILER",
    "WING_VAN",
  ]),
  capacityTons: z.number().positive("Capacity must be positive"),
  lengthFt: z.number().positive().optional(),
  widthFt: z.number().positive().optional(),
  heightFt: z.number().positive().optional(),
})

export const rateCalcSchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  truckType: z.enum([
    "FOUR_WHEELER",
    "SIX_WHEELER_OPEN",
    "SIX_WHEELER_CLOSED",
    "TEN_WHEELER",
    "TRAILER",
    "WING_VAN",
  ]),
})

export const backhaulSchema = z.object({
  originAddress: z.string().min(1),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(1),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  truckType: z.enum([
    "FOUR_WHEELER",
    "SIX_WHEELER_OPEN",
    "SIX_WHEELER_CLOSED",
    "TEN_WHEELER",
    "TRAILER",
    "WING_VAN",
  ]),
  availableTons: z.number().positive(),
  discountedRate: z.number().positive(),
  departureTime: z.string().transform((s) => new Date(s)),
  expiresAt: z.string().transform((s) => new Date(s)),
})

export const messageSchema = z.object({
  bookingId: z.string().min(1),
  content: z.string().min(1, "Message cannot be empty").max(1000),
})

export const trackingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  role: z.enum(["SHIPPER", "TRUCKER"]).optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  businessAddress: z.string().optional(),
  ltfrbAccreditation: z.string().optional(),
  gcashNumber: z.string().optional(),
  isAvailable: z.boolean().optional(),
})

export const loadFilterSchema = z.object({
  status: z.enum(["OPEN", "BOOKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]).optional(),
  truckType: z.enum([
    "FOUR_WHEELER",
    "SIX_WHEELER_OPEN",
    "SIX_WHEELER_CLOSED",
    "TEN_WHEELER",
    "TRAILER",
    "WING_VAN",
  ]).optional(),
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  radiusKm: z.number().optional(),
})

export const bidSchema = z.object({
  proposedRate: z.number().min(100, "Rate must be at least ₱100"),
  comments: z.string().max(500).optional(),
})

export const counterOfferSchema = z.object({
  counterRate: z.number().min(100),
  counterNote: z.string().max(500).optional(),
})
