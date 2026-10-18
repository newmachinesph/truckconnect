import Link from "next/link"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Truck<span className="text-indigo-600">Connect</span>
                <span className="text-xs font-medium text-gray-400 ml-1">PH</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/rate-calculator"
                className="hidden sm:inline-flex text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Rate Calculator
              </Link>
              <Link
                href="/track/demo"
                className="hidden sm:inline-flex text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Track
              </Link>
              <Link
                href="/help"
                className="hidden sm:inline-flex text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Help
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <span className="text-lg font-bold text-white">
                Truck<span className="text-indigo-400">Connect</span>
                <span className="text-xs font-medium text-gray-500 ml-1">PH</span>
              </span>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                The Philippines&apos; trusted trucking marketplace. Connecting shippers with reliable carriers nationwide.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2.5">
                <li><Link href="/rate-calculator" className="text-sm text-gray-400 hover:text-white transition-colors">Rate Calculator</Link></li>
                <li><Link href="/register?role=shipper" className="text-sm text-gray-400 hover:text-white transition-colors">Ship Freight</Link></li>
                <li><Link href="/register?role=trucker" className="text-sm text-gray-400 hover:text-white transition-colors">Find Loads</Link></li>
                <li><Link href="/track/demo" className="text-sm text-gray-400 hover:text-white transition-colors">Track Shipment</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/messenger-demo" className="text-sm text-gray-400 hover:text-white transition-colors">Messenger Bot</Link></li>
                <li className="text-sm text-gray-400">support@truckconnect.ph</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Coverage</h4>
              <ul className="space-y-2.5">
                <li className="text-sm text-gray-400">Metro Manila</li>
                <li className="text-sm text-gray-400">Luzon, Visayas, Mindanao</li>
                <li className="text-sm text-gray-400">Nationwide Routes</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 py-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} TruckConnect PH. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Platform Online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
