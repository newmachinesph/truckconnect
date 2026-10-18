import { PrismaClient, TruckType } from '@prisma/client'

const prisma = new PrismaClient()

const allTruckTypes: TruckType[] = [
  'FOUR_WHEELER',
  'SIX_WHEELER_OPEN',
  'SIX_WHEELER_CLOSED',
  'TEN_WHEELER',
  'TRAILER',
  'WING_VAN',
]

const heavyTruckTypes: TruckType[] = [
  'TEN_WHEELER',
  'TRAILER',
  'WING_VAN',
]

async function main() {
  console.log('Seeding RateConfig...')

  const rateConfigs: { truckType: TruckType; baseRatePerKm: number }[] = [
    { truckType: 'FOUR_WHEELER', baseRatePerKm: 25 },
    { truckType: 'SIX_WHEELER_OPEN', baseRatePerKm: 35 },
    { truckType: 'SIX_WHEELER_CLOSED', baseRatePerKm: 40 },
    { truckType: 'TEN_WHEELER', baseRatePerKm: 55 },
    { truckType: 'TRAILER', baseRatePerKm: 75 },
    { truckType: 'WING_VAN', baseRatePerKm: 70 },
  ]

  for (const config of rateConfigs) {
    await prisma.rateConfig.upsert({
      where: { truckType: config.truckType },
      update: {
        baseRatePerKm: config.baseRatePerKm,
        fuelSurchargeMultiplier: 1.15,
        platformFeeShipperPct: 0.035,
        platformFeeTruckerPct: 0.06,
      },
      create: {
        truckType: config.truckType,
        baseRatePerKm: config.baseRatePerKm,
        fuelSurchargeMultiplier: 1.15,
        platformFeeShipperPct: 0.035,
        platformFeeTruckerPct: 0.06,
      },
    })
    console.log(`  Upserted RateConfig for ${config.truckType}`)
  }

  console.log('Seeding TruckBanWindow...')

  const truckBanWindows = [
    // EDSA: Mon-Sat 5:00-9:00 and 17:00-21:00
    {
      zoneName: 'EDSA',
      dayOfWeek: [1, 2, 3, 4, 5, 6],
      startTime: '05:00',
      endTime: '09:00',
      truckTypesAffected: allTruckTypes,
      source: 'MMDA',
    },
    {
      zoneName: 'EDSA',
      dayOfWeek: [1, 2, 3, 4, 5, 6],
      startTime: '17:00',
      endTime: '21:00',
      truckTypesAffected: allTruckTypes,
      source: 'MMDA',
    },
    // Makati CBD: Mon-Fri 6:00-10:00 and 17:00-21:00
    {
      zoneName: 'Makati CBD',
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: '06:00',
      endTime: '10:00',
      truckTypesAffected: allTruckTypes,
      source: 'Makati LGU',
    },
    {
      zoneName: 'Makati CBD',
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: '17:00',
      endTime: '21:00',
      truckTypesAffected: allTruckTypes,
      source: 'Makati LGU',
    },
    // BGC/Taguig: Mon-Fri 6:00-9:00 and 17:00-20:00
    {
      zoneName: 'BGC/Taguig',
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: '06:00',
      endTime: '09:00',
      truckTypesAffected: heavyTruckTypes,
      source: 'Taguig LGU',
    },
    {
      zoneName: 'BGC/Taguig',
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: '17:00',
      endTime: '20:00',
      truckTypesAffected: heavyTruckTypes,
      source: 'Taguig LGU',
    },
    // Manila City (España, Taft): Mon-Sat 6:00-21:00
    {
      zoneName: 'Manila City (España, Taft)',
      dayOfWeek: [1, 2, 3, 4, 5, 6],
      startTime: '06:00',
      endTime: '21:00',
      truckTypesAffected: allTruckTypes,
      source: 'Manila LGU',
    },
    // Quezon City (Commonwealth, EDSA): Mon-Fri 6:00-9:00 and 16:00-20:00
    {
      zoneName: 'Quezon City (Commonwealth, EDSA)',
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: '06:00',
      endTime: '09:00',
      truckTypesAffected: allTruckTypes,
      source: 'QC LGU',
    },
    {
      zoneName: 'Quezon City (Commonwealth, EDSA)',
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: '16:00',
      endTime: '20:00',
      truckTypesAffected: allTruckTypes,
      source: 'QC LGU',
    },
  ]

  for (const ban of truckBanWindows) {
    // Use zoneName + startTime + endTime as a unique key for upsert logic
    const existing = await prisma.truckBanWindow.findFirst({
      where: {
        zoneName: ban.zoneName,
        startTime: ban.startTime,
        endTime: ban.endTime,
      },
    })

    if (existing) {
      await prisma.truckBanWindow.update({
        where: { id: existing.id },
        data: {
          dayOfWeek: ban.dayOfWeek,
          truckTypesAffected: ban.truckTypesAffected,
          source: ban.source,
          isActive: true,
        },
      })
      console.log(`  Updated TruckBanWindow: ${ban.zoneName} ${ban.startTime}-${ban.endTime}`)
    } else {
      await prisma.truckBanWindow.create({
        data: {
          zoneName: ban.zoneName,
          dayOfWeek: ban.dayOfWeek,
          startTime: ban.startTime,
          endTime: ban.endTime,
          truckTypesAffected: ban.truckTypesAffected,
          source: ban.source,
          isActive: true,
        },
      })
      console.log(`  Created TruckBanWindow: ${ban.zoneName} ${ban.startTime}-${ban.endTime}`)
    }
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
