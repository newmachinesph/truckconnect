/**
 * Philippine route data with RO-RO (Roll-on/Roll-off) sea segments.
 *
 * Distances and ferry pricing are based on publicly available data from
 * 2Go Travel, Trans-Asia Shipping, Montenegro Lines, and MARINA schedules.
 * Figures are approximations suitable for rate estimation.
 */

export interface RouteSegment {
  type: "land" | "roro"
  from: string
  to: string
  distanceKm: number
  durationHours: number
  // For RO-RO segments:
  ferryOperator?: string
  ferryFrequency?: string // e.g., "4 daily departures"
  roroFee?: {
    FOUR_WHEELER: number
    SIX_WHEELER: number
    TEN_WHEELER: number
    TRAILER: number
  }
}

export interface Route {
  id: string
  from: string
  to: string
  segments: RouteSegment[]
  totalDistanceKm: number
  totalDurationHours: number
  hasRoro: boolean
  popularity: number // 1-10
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

export const PHILIPPINE_ROUTES: Route[] = [
  // 1. Manila -> Cebu City (via Batangas - Cebu RO-RO)
  {
    id: "manila-cebu",
    from: "Manila",
    to: "Cebu City",
    segments: [
      {
        type: "land",
        from: "Manila",
        to: "Batangas Port",
        distanceKm: 110,
        durationHours: 2.5,
      },
      {
        type: "roro",
        from: "Batangas Port",
        to: "Cebu Port (Pier 4)",
        distanceKm: 570,
        durationHours: 14,
        ferryOperator: "2Go Travel / Trans-Asia Shipping",
        ferryFrequency: "Daily departures (evening sailing)",
        roroFee: {
          FOUR_WHEELER: 4500,
          SIX_WHEELER: 7000,
          TEN_WHEELER: 12000,
          TRAILER: 20000,
        },
      },
      {
        type: "land",
        from: "Cebu Port",
        to: "Cebu City",
        distanceKm: 5,
        durationHours: 0.3,
      },
    ],
    totalDistanceKm: 685,
    totalDurationHours: 16.8,
    hasRoro: true,
    popularity: 10,
  },

  // 2. Manila -> Davao (via Batangas - Cagayan de Oro RO-RO + land)
  {
    id: "manila-davao",
    from: "Manila",
    to: "Davao City",
    segments: [
      {
        type: "land",
        from: "Manila",
        to: "Batangas Port",
        distanceKm: 110,
        durationHours: 2.5,
      },
      {
        type: "roro",
        from: "Batangas Port",
        to: "Cagayan de Oro Port",
        distanceKm: 830,
        durationHours: 22,
        ferryOperator: "2Go Travel",
        ferryFrequency: "3 weekly departures",
        roroFee: {
          FOUR_WHEELER: 5000,
          SIX_WHEELER: 8000,
          TEN_WHEELER: 14000,
          TRAILER: 23000,
        },
      },
      {
        type: "land",
        from: "Cagayan de Oro",
        to: "Davao City",
        distanceKm: 295,
        durationHours: 5.5,
      },
    ],
    totalDistanceKm: 1235,
    totalDurationHours: 30,
    hasRoro: true,
    popularity: 9,
  },

  // 3. Manila -> Iloilo (via Batangas - Iloilo RO-RO)
  {
    id: "manila-iloilo",
    from: "Manila",
    to: "Iloilo City",
    segments: [
      {
        type: "land",
        from: "Manila",
        to: "Batangas Port",
        distanceKm: 110,
        durationHours: 2.5,
      },
      {
        type: "roro",
        from: "Batangas Port",
        to: "Iloilo Port (Fort San Pedro)",
        distanceKm: 580,
        durationHours: 18,
        ferryOperator: "2Go Travel / Trans-Asia Shipping",
        ferryFrequency: "3-4 weekly departures",
        roroFee: {
          FOUR_WHEELER: 4200,
          SIX_WHEELER: 6500,
          TEN_WHEELER: 11000,
          TRAILER: 19000,
        },
      },
      {
        type: "land",
        from: "Iloilo Port",
        to: "Iloilo City",
        distanceKm: 4,
        durationHours: 0.2,
      },
    ],
    totalDistanceKm: 694,
    totalDurationHours: 20.7,
    hasRoro: true,
    popularity: 8,
  },

  // 4. Manila -> Baguio (land only)
  {
    id: "manila-baguio",
    from: "Manila",
    to: "Baguio City",
    segments: [
      {
        type: "land",
        from: "Manila",
        to: "Baguio City",
        distanceKm: 250,
        durationHours: 5,
      },
    ],
    totalDistanceKm: 250,
    totalDurationHours: 5,
    hasRoro: false,
    popularity: 7,
  },

  // 5. Batangas -> Laguna (land only)
  {
    id: "batangas-laguna",
    from: "Batangas",
    to: "Laguna",
    segments: [
      {
        type: "land",
        from: "Batangas City",
        to: "Santa Rosa, Laguna",
        distanceKm: 80,
        durationHours: 1.5,
      },
    ],
    totalDistanceKm: 80,
    totalDurationHours: 1.5,
    hasRoro: false,
    popularity: 5,
  },

  // 6. Pampanga -> Cavite (land only)
  {
    id: "pampanga-cavite",
    from: "Pampanga",
    to: "Cavite",
    segments: [
      {
        type: "land",
        from: "San Fernando, Pampanga",
        to: "Dasmarinas, Cavite",
        distanceKm: 120,
        durationHours: 2.5,
      },
    ],
    totalDistanceKm: 120,
    totalDurationHours: 2.5,
    hasRoro: false,
    popularity: 6,
  },

  // 7. Cebu -> Davao (via Cebu - Cagayan de Oro RO-RO + land)
  {
    id: "cebu-davao",
    from: "Cebu City",
    to: "Davao City",
    segments: [
      {
        type: "land",
        from: "Cebu City",
        to: "Cebu Port",
        distanceKm: 5,
        durationHours: 0.3,
      },
      {
        type: "roro",
        from: "Cebu Port",
        to: "Cagayan de Oro Port",
        distanceKm: 255,
        durationHours: 10,
        ferryOperator: "Trans-Asia Shipping / Cokaliong",
        ferryFrequency: "Daily departures",
        roroFee: {
          FOUR_WHEELER: 3200,
          SIX_WHEELER: 5500,
          TEN_WHEELER: 9000,
          TRAILER: 16000,
        },
      },
      {
        type: "land",
        from: "Cagayan de Oro",
        to: "Davao City",
        distanceKm: 295,
        durationHours: 5.5,
      },
    ],
    totalDistanceKm: 555,
    totalDurationHours: 15.8,
    hasRoro: true,
    popularity: 7,
  },

  // 8. Cebu -> Iloilo (via Cebu - Iloilo RO-RO)
  {
    id: "cebu-iloilo",
    from: "Cebu City",
    to: "Iloilo City",
    segments: [
      {
        type: "land",
        from: "Cebu City",
        to: "Cebu Port",
        distanceKm: 5,
        durationHours: 0.3,
      },
      {
        type: "roro",
        from: "Cebu Port",
        to: "Iloilo Port",
        distanceKm: 200,
        durationHours: 12,
        ferryOperator: "Trans-Asia Shipping / 2Go Travel",
        ferryFrequency: "3 weekly departures",
        roroFee: {
          FOUR_WHEELER: 3500,
          SIX_WHEELER: 5800,
          TEN_WHEELER: 9500,
          TRAILER: 17000,
        },
      },
      {
        type: "land",
        from: "Iloilo Port",
        to: "Iloilo City",
        distanceKm: 4,
        durationHours: 0.2,
      },
    ],
    totalDistanceKm: 209,
    totalDurationHours: 12.5,
    hasRoro: true,
    popularity: 6,
  },

  // 9. Manila -> Tacloban (via Batangas - Allen/Catbalogan multi-hop)
  {
    id: "manila-tacloban",
    from: "Manila",
    to: "Tacloban City",
    segments: [
      {
        type: "land",
        from: "Manila",
        to: "Matnog Port, Sorsogon",
        distanceKm: 560,
        durationHours: 10,
      },
      {
        type: "roro",
        from: "Matnog Port",
        to: "Allen Port, Northern Samar",
        distanceKm: 25,
        durationHours: 1.5,
        ferryOperator: "Montenegro Lines / Maharlika Ferries",
        ferryFrequency: "6-8 daily departures",
        roroFee: {
          FOUR_WHEELER: 3000,
          SIX_WHEELER: 5000,
          TEN_WHEELER: 8500,
          TRAILER: 15000,
        },
      },
      {
        type: "land",
        from: "Allen, Northern Samar",
        to: "Tacloban City",
        distanceKm: 175,
        durationHours: 4,
      },
    ],
    totalDistanceKm: 760,
    totalDurationHours: 15.5,
    hasRoro: true,
    popularity: 5,
  },

  // 10. Manila -> Zamboanga (longest route, via CDO)
  {
    id: "manila-zamboanga",
    from: "Manila",
    to: "Zamboanga City",
    segments: [
      {
        type: "land",
        from: "Manila",
        to: "Batangas Port",
        distanceKm: 110,
        durationHours: 2.5,
      },
      {
        type: "roro",
        from: "Batangas Port",
        to: "Cagayan de Oro Port",
        distanceKm: 830,
        durationHours: 22,
        ferryOperator: "2Go Travel",
        ferryFrequency: "3 weekly departures",
        roroFee: {
          FOUR_WHEELER: 5000,
          SIX_WHEELER: 8000,
          TEN_WHEELER: 14000,
          TRAILER: 23000,
        },
      },
      {
        type: "land",
        from: "Cagayan de Oro",
        to: "Zamboanga City",
        distanceKm: 580,
        durationHours: 12,
      },
    ],
    totalDistanceKm: 1520,
    totalDurationHours: 36.5,
    hasRoro: true,
    popularity: 4,
  },
]

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Normalise city names for fuzzy matching. */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bcity\b/g, "")
    .replace(/[^a-z ]/g, "")
    .trim()
}

/** Try to find a pre-defined route between two cities (order-insensitive). */
export function findRoute(fromCity: string, toCity: string): Route | null {
  const from = normalise(fromCity)
  const to = normalise(toCity)

  for (const route of PHILIPPINE_ROUTES) {
    const rFrom = normalise(route.from)
    const rTo = normalise(route.to)

    if (
      (rFrom.includes(from) || from.includes(rFrom)) &&
      (rTo.includes(to) || to.includes(rTo))
    ) {
      return route
    }
    // Check reverse direction
    if (
      (rFrom.includes(to) || to.includes(rFrom)) &&
      (rTo.includes(from) || from.includes(rTo))
    ) {
      // Return reversed route
      return {
        ...route,
        id: `${route.id}-rev`,
        from: route.to,
        to: route.from,
        segments: [...route.segments].reverse().map((seg) => ({
          ...seg,
          from: seg.to,
          to: seg.from,
        })),
      }
    }
  }

  return null
}

/** Get all unique city names available in the route dataset. */
export function getAvailableCities(): string[] {
  const cities = new Set<string>()
  for (const route of PHILIPPINE_ROUTES) {
    cities.add(route.from)
    cities.add(route.to)
  }
  return Array.from(cities).sort()
}

/** Get all routes originating from or arriving at a given city. */
export function getRoutesForCity(city: string): Route[] {
  const n = normalise(city)
  return PHILIPPINE_ROUTES.filter((r) => {
    const rFrom = normalise(r.from)
    const rTo = normalise(r.to)
    return rFrom.includes(n) || n.includes(rFrom) || rTo.includes(n) || n.includes(rTo)
  })
}
