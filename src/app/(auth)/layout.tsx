import { Logo } from "@/components/brand/Logo"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left Branding Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative overflow-hidden bg-gray-900">
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo variant="light" size="md" href="/" />

          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1]">
              Move freight across the Philippines,
              <span className="block mt-2 text-indigo-400">
                the smarter way.
              </span>
            </h2>
            <p className="mt-8 text-sm text-gray-400 leading-relaxed">
              Join thousands of shippers and truckers on the country&apos;s most trusted logistics marketplace.
            </p>

            {/* Trust points */}
            <div className="mt-12 space-y-4">
              {[
                "LTFRB-compliant verified truckers",
                "Instant payouts via GCash or bank transfer",
                "Real-time GPS tracking on every delivery",
                "Transparent pricing with no hidden fees",
              ].map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-indigo-500/20">
                    <svg className="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-300">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} TruckConnect PH
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-12 sm:px-8">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo variant="dark" size="md" href="/" />
        </div>

        <div className="w-full max-w-md">
          <div>
            {children}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
