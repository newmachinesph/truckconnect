import { PrismaClient, TruckType } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding E2E test data with realistic Philippine trucking scenarios...")

  // Clean existing test data (order matters for foreign keys)
  await prisma.referral.deleteMany()
  await prisma.referralCode.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.cancellationLog.deleteMany()
  await prisma.insurancePolicy.deleteMany()
  await prisma.dispute.deleteMany()
  await prisma.contractLane.deleteMany()
  await prisma.savedCarrier.deleteMany()
  await prisma.savedAddress.deleteMany()
  await prisma.notificationPreference.deleteMany()
  await prisma.routeAlert.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.review.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.incidentReport.deleteMany()
  await prisma.billOfLading.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.document.deleteMany()
  await prisma.loadStop.deleteMany()
  await prisma.message.deleteMany()
  await prisma.trackingPoint.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.load.deleteMany()
  await prisma.truck.deleteMany()
  await prisma.backhaulOffer.deleteMany()
  await prisma.truckerProfile.deleteMany()
  await prisma.shipperProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // ── Shipper User: Maria Santos (Cebu-based manufacturer) ──
  const shipper = await prisma.user.create({
    data: {
      email: "maria.santos@cebupackaging.ph",
      phone: "+639171234567",
      name: "Maria Santos",
      role: "SHIPPER",
      shipperProfile: {
        create: {
          businessName: "Cebu Packaging Solutions Inc.",
          businessType: "Manufacturing",
          businessAddress: "Lot 5 Block 3, Mactan Export Processing Zone, Lapu-Lapu City, Cebu 6015",
          gcashNumber: "09171234567",
        },
      },
    },
    include: { shipperProfile: true },
  })
  console.log(`  Created shipper: ${shipper.name} (${shipper.email})`)

  // ── Trucker User: Ricardo Cruz (Manila-based trucker) ──
  const trucker = await prisma.user.create({
    data: {
      email: "ricardo.cruz@example.com",
      phone: "+639281234567",
      name: "Ricardo Cruz",
      role: "TRUCKER",
      truckerProfile: {
        create: {
          ltfrbAccreditation: "LTFRB-NCR-2025-0042",
          gcashNumber: "09281234567",
          currentLat: 14.5995,
          currentLng: 120.9842,
          isAvailable: true,
        },
      },
    },
    include: { truckerProfile: true },
  })
  console.log(`  Created trucker: ${trucker.name} (${trucker.email})`)

  // ── Trucker's Trucks ──
  const truck1 = await prisma.truck.create({
    data: {
      truckerProfileId: trucker.truckerProfile!.id,
      plateNumber: "NCR 7842",
      truckType: "TEN_WHEELER",
      capacityTons: 15,
      lengthFt: 32,
      widthFt: 8,
      heightFt: 8,
      isVerified: true,
    },
  })
  console.log(`  Created truck: ${truck1.plateNumber} (${truck1.truckType})`)

  const truck2 = await prisma.truck.create({
    data: {
      truckerProfileId: trucker.truckerProfile!.id,
      plateNumber: "NCR 2156",
      truckType: "SIX_WHEELER_CLOSED",
      capacityTons: 7,
      lengthFt: 20,
      widthFt: 7,
      heightFt: 7,
      isVerified: true,
    },
  })
  console.log(`  Created truck: ${truck2.plateNumber} (${truck2.truckType})`)

  // ── Realistic Philippine Loads ──

  // Load 1: Cebu to Manila — Electronics
  const load1 = await prisma.load.create({
    data: {
      shipperProfileId: shipper.shipperProfile!.id,
      originAddress: "Mactan Export Zone, Lapu-Lapu City, Cebu",
      originLat: 10.3157,
      originLng: 123.9721,
      destAddress: "Valenzuela Industrial Park, Valenzuela City, Metro Manila",
      destLat: 14.6942,
      destLng: 120.9645,
      cargoType: "Consumer Electronics (Boxed, Palletized)",
      weightTons: 8.5,
      preferredTruck: "TEN_WHEELER" as TruckType,
      pickupDate: new Date("2026-03-15"),
      rateEstimate: 45000,
      distanceKm: 572,
      status: "OPEN",
    },
  })

  // Load 2: Manila to Batangas — Construction Materials
  const load2 = await prisma.load.create({
    data: {
      shipperProfileId: shipper.shipperProfile!.id,
      originAddress: "Tondo, Manila City, Metro Manila",
      originLat: 14.6166,
      originLng: 120.9692,
      destAddress: "Batangas City Port Area, Batangas",
      destLat: 13.7565,
      destLng: 121.0583,
      cargoType: "Steel Rebar and Cement Bags",
      weightTons: 12,
      preferredTruck: "TEN_WHEELER" as TruckType,
      pickupDate: new Date("2026-03-16"),
      rateEstimate: 18000,
      distanceKm: 110,
      status: "OPEN",
    },
  })

  // Load 3: Pampanga to Makati — FMCG
  const load3 = await prisma.load.create({
    data: {
      shipperProfileId: shipper.shipperProfile!.id,
      originAddress: "San Fernando, Pampanga",
      originLat: 15.0286,
      originLng: 120.6922,
      destAddress: "Chino Roces Avenue, Makati City, Metro Manila",
      destLat: 14.5547,
      destLng: 121.0244,
      cargoType: "FMCG - Canned Goods & Beverages",
      weightTons: 5,
      preferredTruck: "SIX_WHEELER_CLOSED" as TruckType,
      pickupDate: new Date("2026-03-17"),
      rateEstimate: 12000,
      distanceKm: 85,
      status: "OPEN",
    },
  })

  // Load 4: Quezon City to Laguna — Textiles (already booked)
  const load4 = await prisma.load.create({
    data: {
      shipperProfileId: shipper.shipperProfile!.id,
      originAddress: "Novaliches, Quezon City, Metro Manila",
      originLat: 14.7186,
      originLng: 121.0442,
      destAddress: "Calamba Industrial Park, Calamba, Laguna",
      destLat: 14.1953,
      destLng: 121.1652,
      cargoType: "Textile Rolls & Fabric Bolts",
      weightTons: 4,
      preferredTruck: "SIX_WHEELER_CLOSED" as TruckType,
      pickupDate: new Date("2026-03-14"),
      rateEstimate: 9500,
      distanceKm: 65,
      status: "BOOKED",
    },
  })

  // Load 5: Davao to CDO — Agricultural
  const load5 = await prisma.load.create({
    data: {
      shipperProfileId: shipper.shipperProfile!.id,
      originAddress: "Toril District, Davao City, Davao del Sur",
      originLat: 7.0123,
      originLng: 125.5009,
      destAddress: "Cagayan de Oro Port, Misamis Oriental",
      destLat: 8.4822,
      destLng: 124.6472,
      cargoType: "Fresh Bananas (Refrigerated)",
      weightTons: 10,
      preferredTruck: "WING_VAN" as TruckType,
      pickupDate: new Date("2026-03-18"),
      rateEstimate: 35000,
      distanceKm: 300,
      status: "OPEN",
    },
  })

  console.log(`  Created ${5} loads across Philippine routes`)

  // ── Booking for Load 4 ──
  const booking1 = await prisma.booking.create({
    data: {
      loadId: load4.id,
      truckerProfileId: trucker.truckerProfile!.id,
      agreedRate: 9500,
      platformFeeShipper: 332.5,
      platformFeeTrucker: 570,
      status: "CONFIRMED",
      waybillNumber: `WB-2026-${Date.now().toString(36).toUpperCase()}`,
    },
  })
  console.log(`  Created booking: ${booking1.waybillNumber} for Quezon City → Laguna`)

  // ── Messages for the booking ──
  await prisma.message.createMany({
    data: [
      {
        bookingId: booking1.id,
        senderId: shipper.id,
        content: "Hi Ricardo, the textiles are ready for pickup at our Novaliches warehouse. Gate 3, ask for Supervisor Ramos.",
        createdAt: new Date("2026-03-13T08:30:00Z"),
      },
      {
        bookingId: booking1.id,
        senderId: trucker.id,
        content: "Good morning po! I'll be there by 10 AM with my 6-wheeler. NCR 2156 ang plate number.",
        createdAt: new Date("2026-03-13T08:45:00Z"),
      },
      {
        bookingId: booking1.id,
        senderId: shipper.id,
        content: "Perfect. Please bring the waybill copy. Ramos will stamp it upon loading.",
        createdAt: new Date("2026-03-13T08:50:00Z"),
      },
    ],
  })
  console.log("  Created 3 messages for booking conversation")

  // ── Backhaul Offer ──
  await prisma.backhaulOffer.create({
    data: {
      truckerProfileId: trucker.truckerProfile!.id,
      originAddress: "Calamba Industrial Park, Calamba, Laguna",
      originLat: 14.1953,
      originLng: 121.1652,
      destAddress: "Tondo, Manila City, Metro Manila",
      destLat: 14.6166,
      destLng: 120.9692,
      truckType: "SIX_WHEELER_CLOSED",
      availableTons: 5,
      discountedRate: 5500,
      departureTime: new Date("2026-03-14T16:00:00Z"),
      expiresAt: new Date("2026-03-14T14:00:00Z"),
      isActive: true,
    },
  })
  console.log("  Created backhaul offer: Laguna → Manila (₱5,500 discounted)")

  // ── Ensure RateConfig exists ──
  const rateConfigs = [
    { truckType: "FOUR_WHEELER" as TruckType, baseRatePerKm: 25 },
    { truckType: "SIX_WHEELER_OPEN" as TruckType, baseRatePerKm: 35 },
    { truckType: "SIX_WHEELER_CLOSED" as TruckType, baseRatePerKm: 40 },
    { truckType: "TEN_WHEELER" as TruckType, baseRatePerKm: 55 },
    { truckType: "TRAILER" as TruckType, baseRatePerKm: 75 },
    { truckType: "WING_VAN" as TruckType, baseRatePerKm: 70 },
  ]

  for (const config of rateConfigs) {
    await prisma.rateConfig.upsert({
      where: { truckType: config.truckType },
      update: { baseRatePerKm: config.baseRatePerKm },
      create: {
        truckType: config.truckType,
        baseRatePerKm: config.baseRatePerKm,
        fuelSurchargeMultiplier: 1.15,
        platformFeeShipperPct: 0.035,
        platformFeeTruckerPct: 0.06,
      },
    })
  }
  console.log("  Ensured 6 rate configs")

  // ── Additional Test Shipper: Gabriela Villanueva (Manila-based) ──
  const shipper2 = await prisma.user.create({
    data: {
      email: "shipper@test.com",
      phone: "+639171112222",
      name: "Gabriela Villanueva",
      role: "SHIPPER",
      shipperProfile: {
        create: {
          businessName: "Manila Fresh Exports Co.",
          businessType: "Agriculture & Exports",
          businessAddress: "Unit 12, Farmers Market Complex, Cubao, Quezon City 1109",
          gcashNumber: "09171112222",
        },
      },
    },
    include: { shipperProfile: true },
  })
  console.log(`  Created test shipper: ${shipper2.name} (${shipper2.email})`)

  // ── Additional Test Trucker: Juan Dela Cruz (Cavite-based) ──
  const trucker2 = await prisma.user.create({
    data: {
      email: "trucker@test.com",
      phone: "+639183334444",
      name: "Juan Dela Cruz",
      role: "TRUCKER",
      truckerProfile: {
        create: {
          ltfrbAccreditation: "LTFRB-R4A-2025-0098",
          gcashNumber: "09183334444",
          currentLat: 14.4791,
          currentLng: 120.8980,
          isAvailable: true,
        },
      },
    },
    include: { truckerProfile: true },
  })
  console.log(`  Created test trucker: ${trucker2.name} (${trucker2.email})`)

  // ── Test Trucker's Truck ──
  await prisma.truck.create({
    data: {
      truckerProfileId: trucker2.truckerProfile!.id,
      plateNumber: "CVT 5501",
      truckType: "SIX_WHEELER_OPEN",
      capacityTons: 5,
      lengthFt: 18,
      widthFt: 7,
      heightFt: 7,
      isVerified: true,
    },
  })
  console.log("  Created truck: CVT 5501 (SIX_WHEELER_OPEN) for test trucker")

  // ── Admin Test User ──
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@test.com",
      phone: "+639195556666",
      name: "Alejandro Magno",
      role: "ADMIN",
    },
  })
  console.log(`  Created admin: ${adminUser.name} (${adminUser.email})`)

  // ── Bids on existing loads ──
  // Find an OPEN load to add bids
  const openLoads = await prisma.load.findMany({ where: { status: "OPEN" }, take: 3 })

  if (openLoads.length > 0 && trucker.truckerProfile && trucker2.truckerProfile) {
    for (const load of openLoads) {
      await prisma.bid.create({
        data: {
          loadId: load.id,
          truckerId: trucker.truckerProfile.id,
          proposedRate: (load.rateEstimate ?? 15000) * 0.95,
          comments: "I have experience with this route. Can pick up early morning.",
          status: "PENDING",
        },
      })
      await prisma.bid.create({
        data: {
          loadId: load.id,
          truckerId: trucker2.truckerProfile.id,
          proposedRate: (load.rateEstimate ?? 15000) * 1.05,
          comments: "Insured cargo, 10-wheeler available. Can handle fragile items.",
          status: "PENDING",
        },
      })
    }
    console.log(`  Created ${openLoads.length * 2} bids on ${openLoads.length} open loads`)
  }

  // ── Reviews on completed bookings ──
  const completedBookings = await prisma.booking.findMany({
    where: { status: { in: ["DELIVERED", "COMPLETED"] } },
    include: { load: { include: { shipperProfile: true } }, truckerProfile: true },
    take: 5,
  })

  for (const booking of completedBookings) {
    const shipperUserId = (await prisma.shipperProfile.findUnique({
      where: { id: booking.load.shipperProfileId },
      select: { userId: true },
    }))?.userId

    const truckerUserId = (await prisma.truckerProfile.findUnique({
      where: { id: booking.truckerProfileId },
      select: { userId: true },
    }))?.userId

    if (shipperUserId && truckerUserId) {
      // Shipper reviews trucker
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          reviewerId: shipperUserId,
          revieweeId: truckerUserId,
          onTimeRating: Math.floor(Math.random() * 2) + 4,
          cargoCareRating: Math.floor(Math.random() * 2) + 4,
          communicationRating: Math.floor(Math.random() * 2) + 4,
          professionalismRating: Math.floor(Math.random() * 2) + 4,
          overallRating: 4.5,
          comment: [
            "Great trucker! Delivered on time and handled the cargo with care.",
            "Very professional and responsive. Would book again.",
            "Excellent communication throughout the delivery.",
            "Reliable and careful with our fragile products.",
            "On time, respectful, and kept us updated. Highly recommend!",
          ][Math.floor(Math.random() * 5)],
        },
      })

      // Trucker reviews shipper
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          reviewerId: truckerUserId,
          revieweeId: shipperUserId,
          onTimeRating: 5,
          cargoCareRating: 5,
          communicationRating: Math.floor(Math.random() * 2) + 4,
          professionalismRating: 5,
          overallRating: 4.75,
          comment: "Good shipper. Clear instructions, cargo ready on time.",
        },
      })
    }
  }
  console.log(`  Created ${completedBookings.length * 2} reviews on completed bookings`)

  // ── Payments on bookings ──
  const allBookings = await prisma.booking.findMany({
    where: { status: { in: ["CONFIRMED", "IN_TRANSIT", "DELIVERED", "COMPLETED"] } },
    include: {
      load: { include: { shipperProfile: { select: { userId: true } } } },
      truckerProfile: { select: { userId: true } },
    },
    take: 10,
  })

  for (const booking of allBookings) {
    const totalAmount = booking.agreedRate + booking.platformFeeShipper
    const netAmount = booking.agreedRate - booking.platformFeeTrucker
    const isCompleted = booking.status === "COMPLETED" || booking.status === "DELIVERED"

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        payerId: booking.load.shipperProfile.userId,
        payeeId: booking.truckerProfile.userId,
        amount: totalAmount,
        platformFee: booking.platformFeeShipper + booking.platformFeeTrucker,
        netAmount,
        method: "GCASH",
        status: isCompleted ? "RELEASED" : "ESCROW_HELD",
        escrowHeldAt: new Date(),
        escrowReleasedAt: isCompleted ? new Date() : null,
        receiptNumber: `RC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      },
    })
  }
  console.log(`  Created ${allBookings.length} payments`)

  // ── Notifications for demo ──
  const allUsers = await prisma.user.findMany({ where: { role: { in: ["SHIPPER", "TRUCKER"] } }, take: 5 })
  const notifTypes = [
    { type: "BID_RECEIVED", title: "New Bid Received", body: "A trucker placed a bid on your load" },
    { type: "BID_ACCEPTED", title: "Bid Accepted!", body: "Your bid has been accepted. Check your bookings." },
    { type: "PAYMENT_RECEIVED", title: "Payment Received", body: "₱15,000 has been held in escrow for your delivery" },
    { type: "DELIVERY_CONFIRMED", title: "Delivery Confirmed", body: "Your delivery has been confirmed with ePOD" },
    { type: "REVIEW_RECEIVED", title: "New Review", body: "Someone left you a 5-star review!" },
  ]

  for (const user of allUsers) {
    for (let i = 0; i < 3; i++) {
      const notif = notifTypes[Math.floor(Math.random() * notifTypes.length)]
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          isRead: i > 0,
          createdAt: new Date(Date.now() - i * 3600000),
        },
      })
    }
  }
  console.log(`  Created ${allUsers.length * 3} notifications`)

  // ── Additional Truckers for carrier search ──
  const trucker3 = await prisma.user.create({
    data: {
      email: "diego.reyes@example.com",
      phone: "+639191234567",
      name: "Diego Reyes",
      role: "TRUCKER",
      truckerProfile: {
        create: {
          ltfrbAccreditation: "LTFRB-R3-2025-0155",
          gcashNumber: "09191234567",
          currentLat: 15.0286,
          currentLng: 120.6922,
          isAvailable: true,
          experienceTags: ["FMCG", "CONSTRUCTION", "AGRICULTURE"],
          preferredRegions: ["Central Luzon", "NCR", "CALABARZON"],
          completedTrips: 142,
        },
      },
    },
    include: { truckerProfile: true },
  })
  await prisma.truck.create({
    data: {
      truckerProfileId: trucker3.truckerProfile!.id,
      plateNumber: "PAM 8821",
      truckType: "WING_VAN",
      capacityTons: 20,
      lengthFt: 40,
      widthFt: 8,
      heightFt: 9,
      isVerified: true,
    },
  })

  const trucker4 = await prisma.user.create({
    data: {
      email: "anna.bautista@example.com",
      phone: "+639201234567",
      name: "Anna Bautista",
      role: "TRUCKER",
      truckerProfile: {
        create: {
          ltfrbAccreditation: "LTFRB-NCR-2024-0303",
          gcashNumber: "09201234567",
          currentLat: 14.5547,
          currentLng: 121.0244,
          isAvailable: true,
          experienceTags: ["ELECTRONICS", "PERISHABLES", "FMCG"],
          preferredRegions: ["NCR", "CALABARZON", "Central Visayas"],
          completedTrips: 87,
        },
      },
    },
    include: { truckerProfile: true },
  })
  await prisma.truck.create({
    data: {
      truckerProfileId: trucker4.truckerProfile!.id,
      plateNumber: "MKT 3345",
      truckType: "SIX_WHEELER_CLOSED",
      capacityTons: 7,
      lengthFt: 20,
      widthFt: 7,
      heightFt: 7,
      isVerified: true,
    },
  })

  const trucker5 = await prisma.user.create({
    data: {
      email: "marco.santiago@example.com",
      phone: "+639211234567",
      name: "Marco Santiago",
      role: "TRUCKER",
      truckerProfile: {
        create: {
          ltfrbAccreditation: "LTFRB-R7-2025-0077",
          gcashNumber: "09211234567",
          currentLat: 10.3157,
          currentLng: 123.9721,
          isAvailable: true,
          experienceTags: ["CONSTRUCTION", "ELECTRONICS"],
          preferredRegions: ["Central Visayas", "Western Visayas"],
          completedTrips: 215,
        },
      },
    },
    include: { truckerProfile: true },
  })
  await prisma.truck.create({
    data: {
      truckerProfileId: trucker5.truckerProfile!.id,
      plateNumber: "CEB 7712",
      truckType: "TRAILER",
      capacityTons: 25,
      lengthFt: 40,
      widthFt: 8,
      heightFt: 9,
      isVerified: true,
    },
  })
  console.log("  Created 3 additional truckers with experience tags")

  // ── Update existing truckers with experience/trips ──
  await prisma.truckerProfile.update({
    where: { id: trucker.truckerProfile!.id },
    data: {
      experienceTags: ["ELECTRONICS", "FMCG", "PERISHABLES"],
      preferredRegions: ["NCR", "CALABARZON", "Central Luzon"],
      completedTrips: 328,
    },
  })
  await prisma.truckerProfile.update({
    where: { id: trucker2.truckerProfile!.id },
    data: {
      experienceTags: ["AGRICULTURE", "CONSTRUCTION"],
      preferredRegions: ["CALABARZON", "NCR"],
      completedTrips: 56,
    },
  })

  // ── Saved Addresses ──
  await prisma.savedAddress.createMany({
    data: [
      {
        userId: shipper.id,
        label: "Main Warehouse",
        address: "Mactan Export Zone, Lapu-Lapu City, Cebu",
        lat: 10.3157,
        lng: 123.9721,
        isDefault: true,
      },
      {
        userId: shipper.id,
        label: "Manila Office",
        address: "BGC, Taguig City, Metro Manila",
        lat: 14.5547,
        lng: 121.0508,
      },
      {
        userId: shipper2.id,
        label: "Farmers Market Warehouse",
        address: "Unit 12, Farmers Market Complex, Cubao, Quezon City",
        lat: 14.6198,
        lng: 121.0565,
        isDefault: true,
      },
    ],
  })
  console.log("  Created 3 saved addresses")

  // ── Saved Carriers ──
  await prisma.savedCarrier.createMany({
    data: [
      { shipperId: shipper.shipperProfile!.id, carrierId: trucker.truckerProfile!.id, notes: "Reliable for Cebu-Manila" },
      { shipperId: shipper.shipperProfile!.id, carrierId: trucker3.truckerProfile!.id, notes: "Great for large hauls" },
      { shipperId: shipper2.shipperProfile!.id, carrierId: trucker2.truckerProfile!.id, notes: "Preferred for CALABARZON" },
    ],
  })
  console.log("  Created 3 saved carriers")

  // ── Contract Lanes ──
  await prisma.contractLane.createMany({
    data: [
      {
        shipperId: shipper.shipperProfile!.id,
        truckerId: trucker.truckerProfile!.id,
        originCity: "Cebu City",
        destCity: "Manila",
        agreedRate: 42000,
        fuelSurchargeFormula: "Base + 15% fuel adjustment",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        noticePeriodDays: 30,
        status: "ACTIVE",
        signedByShipper: new Date("2025-12-20"),
        signedByTrucker: new Date("2025-12-22"),
      },
      {
        shipperId: shipper2.shipperProfile!.id,
        truckerId: trucker3.truckerProfile!.id,
        originCity: "Quezon City",
        destCity: "Pampanga",
        agreedRate: 15000,
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-08-31"),
        noticePeriodDays: 15,
        status: "ACTIVE",
        signedByShipper: new Date("2026-01-28"),
        signedByTrucker: new Date("2026-01-29"),
      },
      {
        shipperId: shipper.shipperProfile!.id,
        truckerId: trucker5.truckerProfile!.id,
        originCity: "Cebu City",
        destCity: "Davao City",
        agreedRate: 55000,
        startDate: new Date("2026-04-01"),
        endDate: new Date("2026-09-30"),
        noticePeriodDays: 30,
        status: "DRAFT",
      },
    ],
  })
  console.log("  Created 3 contract lanes")

  // ── Disputes ──
  // Create a completed booking for dispute
  const disputeLoad = await prisma.load.create({
    data: {
      shipperProfileId: shipper.shipperProfile!.id,
      originAddress: "Pasig City, Metro Manila",
      originLat: 14.5764,
      originLng: 121.0851,
      destAddress: "Caloocan City, Metro Manila",
      destLat: 14.6570,
      destLng: 120.9833,
      cargoType: "Electronics - LCD Monitors",
      weightTons: 3,
      preferredTruck: "SIX_WHEELER_CLOSED" as TruckType,
      pickupDate: new Date("2026-03-10"),
      rateEstimate: 8000,
      distanceKm: 25,
      status: "DELIVERED",
    },
  })
  const disputeBooking = await prisma.booking.create({
    data: {
      loadId: disputeLoad.id,
      truckerProfileId: trucker2.truckerProfile!.id,
      agreedRate: 8000,
      platformFeeShipper: 280,
      platformFeeTrucker: 480,
      status: "DISPUTED",
      waybillNumber: `WB-2026-DISP001`,
    },
  })
  await prisma.dispute.createMany({
    data: [
      {
        bookingId: disputeBooking.id,
        filedById: shipper.id,
        type: "CARGO_DAMAGE",
        description: "3 LCD monitors arrived with cracked screens. Packaging appeared intact but internal damage occurred during transit.",
        evidencePhotos: [],
        evidenceNotes: "Photos attached showing damaged monitors upon unpacking",
        counterPhotos: [],
        status: "UNDER_REVIEW",
      },
    ],
  })

  // Another dispute
  const disputeLoad2 = await prisma.load.create({
    data: {
      shipperProfileId: shipper2.shipperProfile!.id,
      originAddress: "Makati City, Metro Manila",
      originLat: 14.5547,
      originLng: 121.0244,
      destAddress: "San Pablo, Laguna",
      destLat: 14.0687,
      destLng: 121.3254,
      cargoType: "Perishable - Frozen Goods",
      weightTons: 6,
      preferredTruck: "SIX_WHEELER_CLOSED" as TruckType,
      pickupDate: new Date("2026-03-08"),
      rateEstimate: 12000,
      distanceKm: 95,
      status: "DELIVERED",
    },
  })
  const disputeBooking2 = await prisma.booking.create({
    data: {
      loadId: disputeLoad2.id,
      truckerProfileId: trucker4.truckerProfile!.id,
      agreedRate: 11500,
      platformFeeShipper: 402.5,
      platformFeeTrucker: 690,
      status: "COMPLETED",
      waybillNumber: `WB-2026-DISP002`,
    },
  })
  await prisma.dispute.create({
    data: {
      bookingId: disputeBooking2.id,
      filedById: shipper2.id,
      type: "LATE_DELIVERY",
      description: "Delivery was 4 hours late. Frozen goods partially thawed causing ₱15,000 in losses.",
      evidencePhotos: [],
      evidenceNotes: "Temperature logs show cargo exceeded safe threshold",
      counterEvidence: "Traffic accident on SLEX caused unavoidable delay. Photos of accident attached.",
      counterPhotos: [],
      status: "RESOLVED",
      resolution: "Partial refund of ₱5,000 credited to shipper. Carrier not penalized due to force majeure.",
      resolvedById: adminUser.id,
      resolvedAt: new Date("2026-03-12"),
    },
  })
  console.log("  Created 2 disputes (1 under review, 1 resolved)")

  // ── Insurance Policies ──
  await prisma.insurancePolicy.create({
    data: {
      bookingId: booking1.id,
      tier: "BASIC",
      declaredValue: 50000,
      premium: 500,
      coverageMax: 100000,
      status: "ACTIVE",
    },
  })
  await prisma.insurancePolicy.create({
    data: {
      bookingId: disputeBooking.id,
      tier: "COMPREHENSIVE",
      declaredValue: 200000,
      premium: 5000,
      coverageMax: 500000,
      status: "CLAIMED",
      claimFiledAt: new Date("2026-03-11"),
      claimNotes: "Claiming for damaged LCD monitors - 3 units x ₱25,000 each",
      claimPhotos: [],
      claimStatus: "UNDER_REVIEW",
    },
  })
  console.log("  Created 2 insurance policies")

  // ── Subscriptions ──
  await prisma.subscription.createMany({
    data: [
      {
        userId: trucker.id,
        plan: "FLEET_PRO",
        status: "ACTIVE",
        amount: 2999,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      },
      {
        userId: trucker3.id,
        plan: "FREE",
        status: "ACTIVE",
        amount: 0,
        startDate: new Date("2026-03-01"),
      },
      {
        userId: shipper.id,
        plan: "ENTERPRISE",
        status: "ACTIVE",
        amount: 9999,
        startDate: new Date("2026-01-15"),
        endDate: new Date("2027-01-15"),
      },
    ],
  })
  console.log("  Created 3 subscriptions")

  // ── Referral Codes ──
  await prisma.referralCode.createMany({
    data: [
      { userId: trucker.id, code: "RICARDO500", usageCount: 5, totalBonus: 2500 },
      { userId: shipper.id, code: "CEBUPACK200", usageCount: 3, totalBonus: 600 },
      { userId: trucker3.id, code: "DIEGO500", usageCount: 0, totalBonus: 0 },
    ],
  })
  await prisma.referral.createMany({
    data: [
      {
        referrerId: trucker.id,
        referredId: trucker2.id,
        code: "RICARDO500",
        bonusAmount: 500,
        bonusPaidAt: new Date("2026-02-15"),
        firstTripAt: new Date("2026-02-20"),
      },
      {
        referrerId: trucker.id,
        referredId: trucker4.id,
        code: "RICARDO500",
        bonusAmount: 500,
        bonusPaidAt: new Date("2026-03-01"),
        firstTripAt: new Date("2026-03-05"),
      },
      {
        referrerId: shipper.id,
        referredId: shipper2.id,
        code: "CEBUPACK200",
        bonusAmount: 200,
        bonusPaidAt: new Date("2026-02-10"),
        firstTripAt: new Date("2026-02-18"),
      },
    ],
  })
  console.log("  Created 3 referral codes and 3 referrals")

  // ── Route Alerts ──
  await prisma.routeAlert.createMany({
    data: [
      { userId: trucker.id, originCity: "Manila", destCity: "Cebu", truckType: "TEN_WHEELER" as TruckType },
      { userId: trucker.id, originCity: "Batangas", destCity: "Manila" },
      { userId: trucker3.id, originCity: "Pampanga", destCity: "Manila", truckType: "WING_VAN" as TruckType },
    ],
  })
  console.log("  Created 3 route alerts")

  // ── Documents for carriers ──
  await prisma.document.createMany({
    data: [
      {
        userId: trucker.id,
        type: "GOVERNMENT_ID",
        fileName: "ricardo-govt-id.jpg",
        fileUrl: "https://utfs.io/f/placeholder-govt-id.jpg",
        fileSize: 245000,
        status: "VERIFIED",
        verifiedAt: new Date("2026-01-15"),
      },
      {
        userId: trucker.id,
        type: "LTFRB_CERTIFICATE",
        fileName: "ricardo-ltfrb-cert.pdf",
        fileUrl: "https://utfs.io/f/placeholder-ltfrb.pdf",
        fileSize: 520000,
        status: "VERIFIED",
        verifiedAt: new Date("2026-01-15"),
      },
      {
        userId: trucker.id,
        type: "VEHICLE_OR_CR",
        fileName: "ncr7842-orcr.pdf",
        fileUrl: "https://utfs.io/f/placeholder-orcr.pdf",
        fileSize: 380000,
        status: "VERIFIED",
        verifiedAt: new Date("2026-01-16"),
      },
      {
        userId: trucker2.id,
        type: "GOVERNMENT_ID",
        fileName: "juan-govt-id.jpg",
        fileUrl: "https://utfs.io/f/placeholder-govt-id-2.jpg",
        fileSize: 210000,
        status: "PENDING",
      },
      {
        userId: trucker3.id,
        type: "LTFRB_CERTIFICATE",
        fileName: "diego-ltfrb.pdf",
        fileUrl: "https://utfs.io/f/placeholder-ltfrb-3.pdf",
        fileSize: 490000,
        status: "VERIFIED",
        verifiedAt: new Date("2026-02-01"),
      },
      {
        userId: trucker4.id,
        type: "CARGO_INSURANCE",
        fileName: "anna-cargo-insurance.pdf",
        fileUrl: "https://utfs.io/f/placeholder-insurance.pdf",
        fileSize: 350000,
        status: "EXPIRED",
      },
    ],
  })
  console.log("  Created 6 documents for carriers")

  // ── Additional Backhaul Offers ──
  await prisma.backhaulOffer.createMany({
    data: [
      {
        truckerProfileId: trucker3.truckerProfile!.id,
        originAddress: "Manila Port Area, Manila City",
        originLat: 14.5891,
        originLng: 120.9747,
        destAddress: "San Fernando, Pampanga",
        destLat: 15.0286,
        destLng: 120.6922,
        truckType: "WING_VAN",
        availableTons: 15,
        discountedRate: 8500,
        departureTime: new Date("2026-03-15T14:00:00Z"),
        expiresAt: new Date("2026-03-15T12:00:00Z"),
        isActive: true,
      },
      {
        truckerProfileId: trucker5.truckerProfile!.id,
        originAddress: "Mandaue City, Cebu",
        originLat: 10.3236,
        originLng: 123.9223,
        destAddress: "Cagayan de Oro City, Misamis Oriental",
        destLat: 8.4822,
        destLng: 124.6472,
        truckType: "TRAILER",
        availableTons: 20,
        discountedRate: 22000,
        departureTime: new Date("2026-03-16T08:00:00Z"),
        expiresAt: new Date("2026-03-16T06:00:00Z"),
        isActive: true,
      },
      {
        truckerProfileId: trucker4.truckerProfile!.id,
        originAddress: "Calamba, Laguna",
        originLat: 14.1953,
        originLng: 121.1652,
        destAddress: "Quezon City, Metro Manila",
        destLat: 14.6760,
        destLng: 121.0437,
        truckType: "SIX_WHEELER_CLOSED",
        availableTons: 5,
        discountedRate: 4200,
        departureTime: new Date("2026-03-14T18:00:00Z"),
        expiresAt: new Date("2026-03-14T16:00:00Z"),
        isActive: true,
      },
    ],
  })
  console.log("  Created 3 additional backhaul offers")

  // ── More loads for rich demo data ──
  await prisma.load.createMany({
    data: [
      {
        shipperProfileId: shipper2.shipperProfile!.id,
        originAddress: "Quezon City, Metro Manila",
        originLat: 14.6760,
        originLng: 121.0437,
        destAddress: "Angeles City, Pampanga",
        destLat: 15.1427,
        destLng: 120.5889,
        cargoType: "Agricultural - Rice Sacks",
        weightTons: 8,
        preferredTruck: "SIX_WHEELER_OPEN" as TruckType,
        pickupDate: new Date("2026-03-19"),
        rateEstimate: 14000,
        distanceKm: 90,
        status: "OPEN",
        specialHandling: ["FRAGILE"],
        maxBudget: 16000,
        biddingDeadline: new Date("2026-03-18T18:00:00Z"),
      },
      {
        shipperProfileId: shipper.shipperProfile!.id,
        originAddress: "Cebu Port, Cebu City",
        originLat: 10.2969,
        originLng: 123.8953,
        destAddress: "Iloilo City Port, Iloilo",
        destLat: 10.6969,
        destLng: 122.5646,
        cargoType: "Processed Foods - Canned Goods",
        weightTons: 12,
        preferredTruck: "WING_VAN" as TruckType,
        pickupDate: new Date("2026-03-20"),
        rateEstimate: 28000,
        distanceKm: 200,
        status: "OPEN",
        specialHandling: ["TEMPERATURE"],
      },
      {
        shipperProfileId: shipper2.shipperProfile!.id,
        originAddress: "Taguig City, Metro Manila",
        originLat: 14.5176,
        originLng: 121.0509,
        destAddress: "Lipa City, Batangas",
        destLat: 13.9412,
        destLng: 121.1622,
        cargoType: "Office Furniture & Equipment",
        weightTons: 3,
        preferredTruck: "FOUR_WHEELER" as TruckType,
        pickupDate: new Date("2026-03-21"),
        rateEstimate: 7500,
        distanceKm: 75,
        status: "OPEN",
      },
      {
        shipperProfileId: shipper.shipperProfile!.id,
        originAddress: "Mandaue City, Cebu",
        originLat: 10.3236,
        originLng: 123.9223,
        destAddress: "Tacloban City, Leyte",
        destLat: 11.2543,
        destLng: 124.9600,
        cargoType: "Construction Materials - Steel & Plywood",
        weightTons: 18,
        preferredTruck: "TRAILER" as TruckType,
        pickupDate: new Date("2026-03-22"),
        rateEstimate: 45000,
        distanceKm: 280,
        status: "OPEN",
        specialHandling: ["OVERSIZED"],
        maxBudget: 50000,
        isBackhaulRequest: false,
      },
      {
        shipperProfileId: shipper2.shipperProfile!.id,
        originAddress: "Pasay City, Metro Manila",
        originLat: 14.5378,
        originLng: 121.0014,
        destAddress: "Cabanatuan City, Nueva Ecija",
        destLat: 15.4866,
        destLng: 120.9723,
        cargoType: "Retail - Mixed Consumer Goods",
        weightTons: 6,
        preferredTruck: "SIX_WHEELER_CLOSED" as TruckType,
        pickupDate: new Date("2026-03-23"),
        rateEstimate: 16000,
        distanceKm: 130,
        status: "OPEN",
        biddingDeadline: new Date("2026-03-22T12:00:00Z"),
      },
    ],
  })
  console.log("  Created 5 additional loads for richer demo")

  console.log("\nE2E seed complete! Test accounts:")
  console.log("  Shipper: maria.santos@cebupackaging.ph")
  console.log("  Trucker: ricardo.cruz@example.com")
  console.log("  Test Shipper: shipper@test.com (Gabriela Villanueva)")
  console.log("  Test Trucker: trucker@test.com (Juan Dela Cruz)")
  console.log("  Admin (placeholder): admin@test.com (Alejandro Magno)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
