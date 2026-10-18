import Link from "next/link"
import { prisma } from "@/lib/db"
import { LoadVisualizerDemo } from "@/components/three/LoadVisualizerDemo"
import { SectionHeader } from "@/components/brand/SectionHeader"

const valueProps = [
  {
    title: "Transparent Pricing",
    description:
      "Know exactly what you'll pay or earn before you commit. Our rate engine factors in distance, truck type, fuel, and tolls.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    title: "No Brokers, No Middlemen",
    description:
      "Connect directly with shippers or truckers. No middlemen taking a cut. Just a small, transparent platform fee.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: "Instant Payouts",
    description:
      "Truckers get paid as soon as delivery is confirmed with e-POD. No more waiting 30-60 days for your money.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
]

const howItWorks = {
  shipper: [
    { step: "01", title: "Post Your Load", description: "Enter pickup & delivery locations, cargo details, and preferred truck type." },
    { step: "02", title: "Get Matched", description: "Nearby verified truckers see your load and send quotes in minutes." },
    { step: "03", title: "Track & Confirm", description: "Monitor delivery in real-time and confirm receipt with e-POD." },
  ],
  trucker: [
    { step: "01", title: "Browse Loads", description: "Find loads that match your truck, location, and schedule." },
    { step: "02", title: "Accept & Haul", description: "Accept loads instantly, navigate to pickup, and hit the road." },
    { step: "03", title: "Get Paid Fast", description: "Receive payment directly via GCash or bank transfer upon delivery." },
  ],
}

const popularRoutes = [
  { from: "Manila", to: "Cebu", distance: "~570 km", rate: "₱18,000 - ₱42,000" },
  { from: "Manila", to: "Davao", distance: "~1,500 km", rate: "₱35,000 - ₱85,000" },
  { from: "Batangas", to: "Laguna", distance: "~80 km", rate: "₱4,500 - ₱12,000" },
  { from: "Pampanga", to: "Cavite", distance: "~120 km", rate: "₱5,500 - ₱15,000" },
  { from: "Cebu", to: "Iloilo", distance: "~200 km", rate: "₱9,000 - ₱22,000" },
  { from: "Manila", to: "Baguio", distance: "~250 km", rate: "₱10,000 - ₱28,000" },
]

async function getPlatformStats() {
  try {
    const [totalLoads, totalTruckers, totalShippers, completedBookings] = await Promise.all([
      prisma.load.count(),
      prisma.user.count({ where: { role: "TRUCKER" } }),
      prisma.user.count({ where: { role: "SHIPPER" } }),
      prisma.booking.count({ where: { status: { in: ["DELIVERED", "COMPLETED"] } } }),
    ])
    return { totalLoads, totalTruckers, totalShippers, completedBookings }
  } catch {
    return { totalLoads: 0, totalTruckers: 0, totalShippers: 0, completedBookings: 0 }
  }
}

export default async function LandingPage() {
  const stats = await getPlatformStats()

  return (
    <>
      {/* ===================== HERO SECTION ===================== */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-32 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="animate-fade-in-up text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-[1.1]">
              Move freight smarter.
              <br />
              <span className="text-indigo-600">Earn more.</span>
            </h1>

            <p className="animate-fade-in-up delay-1 mt-6 max-w-lg text-base text-gray-600 sm:text-lg leading-relaxed">
              The Philippine trucking marketplace connecting shippers with reliable
              carriers. Post loads, find trucks, and keep your business moving &mdash; from Manila to Mindanao.
            </p>

            <div className="animate-fade-in-up delay-2 mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register?role=shipper"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Get Started as Shipper
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/register?role=trucker"
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
              >
                Register as Trucker
              </Link>
            </div>

            <div className="animate-fade-in-up delay-3 mt-8">
              <Link
                href="/rate-calculator"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Try our Rate Calculator &mdash; no signup needed
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== LIVE PLATFORM STATS ===================== */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200">
            {[
              { value: stats.totalLoads, label: "Loads Posted" },
              { value: stats.totalTruckers, label: "Verified Truckers" },
              { value: stats.totalShippers, label: "Active Shippers" },
              { value: stats.completedBookings, label: "Deliveries Done" },
            ].map((stat) => (
              <div key={stat.label} className="px-6 py-8 text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stat.value}+</p>
                <p className="mt-1 text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== VALUE PROPS ===================== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="Why TruckConnect PH"
            title="Built for the Philippine trucking industry"
            description="By people who understand the roads, the regulations, and the hustle of Filipino logistics."
          />
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {valueProps.map((prop) => (
              <div key={prop.title} className="flex gap-4">
                <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  {prop.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{prop.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                    {prop.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="How It Works"
            title="Get started in minutes"
            description="Whether you're shipping goods or hauling freight, we've made it simple."
          />

          <div className="mt-16 grid gap-0 lg:grid-cols-2">
            {/* For Shippers */}
            <div className="rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none bg-gray-900 p-8 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide mb-8">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                For Shippers
              </span>
              <div className="space-y-8">
                {howItWorks.shipper.map((item) => (
                  <div key={item.step} className="flex gap-5">
                    <span className="text-sm font-bold text-indigo-400 shrink-0 w-8 pt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-semibold text-white">{item.title}</h4>
                      <p className="mt-1 text-sm text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <Link
                  href="/register?role=shipper"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign up as shipper
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* For Truckers */}
            <div className="rounded-b-xl lg:rounded-r-xl lg:rounded-bl-none bg-white border border-gray-200 border-l-0 p-8 sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 uppercase tracking-wide mb-8">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                For Truckers
              </span>
              <div className="space-y-8">
                {howItWorks.trucker.map((item) => (
                  <div key={item.step} className="flex gap-5">
                    <span className="text-sm font-bold text-indigo-600 shrink-0 w-8 pt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                  href="/register?role=trucker"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Sign up as trucker
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== POPULAR ROUTES ===================== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <SectionHeader
              kicker="Popular Routes"
              title="Estimated rates across the Philippines"
              description="Rates vary by truck type, cargo weight, and market conditions."
            />
            <Link
              href="/rate-calculator"
              className="shrink-0 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              Calculate Your Exact Rate
            </Link>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-4 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wide bg-gray-50 text-gray-500">
              <span>Route</span>
              <span>Distance</span>
              <span>Est. Rate (4W - Wing Van)</span>
              <span />
            </div>
            {popularRoutes.map((route, i) => (
              <div
                key={`${route.from}-${route.to}`}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center px-6 py-4 bg-white hover:bg-gray-50 transition-colors"
                style={{ borderTop: i > 0 ? "1px solid #e5e7eb" : undefined }}
              >
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <span>{route.from}</span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <span>{route.to}</span>
                </div>
                <div className="text-sm text-gray-500">{route.distance}</div>
                <div className="text-lg font-bold text-gray-900">{route.rate}</div>
                <div className="text-right">
                  <Link href="/rate-calculator" className="text-xs font-semibold text-indigo-600 hover:underline">
                    Get exact rate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 3D LOAD VISUALIZER ===================== */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl tracking-tight">
                See How Your Cargo Fits
              </h2>
              <p className="mt-2 text-sm text-gray-600 max-w-lg">
                Pick a truck, add your cargo, and the optimizer packs it in real time.
              </p>
            </div>
            <span className="text-xs shrink-0 text-gray-500">Drag to rotate &middot; Scroll to zoom</span>
          </div>
          <LoadVisualizerDemo />
        </div>
      </section>

      {/* ===================== TRUST SIGNALS ===================== */}
      <section className="py-8 bg-white border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              { title: "LTFRB Compliant", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
              { title: "GPS Tracking", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> },
              { title: "GCash & Bank Transfer", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> },
              { title: "MMDA Truck Ban Aware", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            ].map((badge) => (
              <div key={badge.title} className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  {badge.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{badge.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="What Users Say"
            title="Trusted by truckers and shippers nationwide"
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Maria Santos", role: "Shipper - Manila Foods Corp", quote: "We reduced our logistics costs by 30% in the first month. The bidding system lets us get competitive rates from verified truckers.", rating: 5 },
              { name: "Juan dela Cruz", role: "Trucker - 10-Wheeler Owner", quote: "No more empty return trips! The backhaul matching saved me ₱15,000 last week alone. GCash payouts are instant.", rating: 5 },
              { name: "Ana Reyes", role: "Shipper - Cebu Electronics", quote: "The real-time GPS tracking and ePOD gave us peace of mind. Our customers love knowing exactly when deliveries arrive.", rating: 4 },
              { name: "Pedro Bautista", role: "Fleet Manager - 5 Trucks", quote: "Managing my fleet is so much easier now. The dashboard shows earnings, active bookings, and truck status all in one place.", rating: 5 },
              { name: "Lisa Tan", role: "Shipper - Pampanga Agriculture", quote: "Posting a load takes 30 seconds. Within minutes, I get bids from truckers in my area. The rate calculator is incredibly accurate.", rating: 5 },
              { name: "Roberto Gonzales", role: "Trucker - Wing Van Operator", quote: "Finally a platform that understands Philippine trucking. MMDA truck ban awareness means I never get stuck or fined.", rating: 4 },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex gap-0.5 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-4 w-4" style={{ color: star <= t.rating ? "#d97706" : "#e5e7eb", fill: star <= t.rating ? "#d97706" : "#e5e7eb" }} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ SECTION ===================== */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            kicker="FAQ"
            title="Frequently asked questions"
            align="center"
          />
          <div className="mt-14 space-y-3">
            {[
              { q: "How does TruckConnect ensure trucker quality?", a: "Every trucker is verified with valid LTFRB accreditation, government ID, and vehicle registration. Our multi-dimensional review system (On-Time, Cargo Care, Communication, Professionalism) ensures accountability." },
              { q: "What payment methods are supported?", a: "We support GCash (instant mobile payment), bank transfer (BDO, BPI, Metrobank, etc.), corporate credit, and cash on delivery. Payments are held in escrow until delivery is confirmed via ePOD." },
              { q: "How does the bidding system work?", a: "When you post a load, verified truckers in the area can submit competitive bids. You can accept, reject, or counter-offer each bid. Once accepted, the booking is confirmed and the trucker is assigned." },
              { q: "What happens if there's an issue during delivery?", a: "Truckers can file incident reports (breakdown, road closure, weather, etc.) directly from the app. Both parties can communicate via in-app messaging, and disputes can be escalated to our support team." },
              { q: "What truck types are available?", a: "We support 4-Wheeler, 6-Wheeler Open, 6-Wheeler Closed, 10-Wheeler, Trailer, and Wing Van. Our rate calculator automatically adjusts pricing based on truck type, distance, and fuel surcharges." },
              { q: "Is there a fee for using TruckConnect?", a: "Shippers pay a 3.5% platform fee on top of the agreed rate. Truckers pay a 6% platform fee deducted from their earnings. No subscription fees, no hidden charges." },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-lg border border-gray-200 bg-white">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-gray-900">
                  <span className="group-open:text-indigo-600 transition-colors">{faq.q}</span>
                  <svg className="h-4 w-4 flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform ml-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to move freight the smarter way?
              </h2>
              <p className="mt-3 text-base text-indigo-200 max-w-lg">
                Join hundreds of shippers and truckers already on the platform. Create your free account in under 2 minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/rate-calculator"
                className="inline-flex items-center justify-center rounded-md ring-1 ring-inset ring-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                Try Rate Calculator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
