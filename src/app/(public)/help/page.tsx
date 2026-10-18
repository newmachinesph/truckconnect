"use client"

import { useState } from "react"
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline"

const faqCategories = [
  {
    name: "Getting Started",
    icon: RocketLaunchIcon,
    color: "bg-indigo-50 text-indigo-600",
    questions: [
      {
        q: "How do I create an account on TruckConnect PH?",
        a: "You can sign up using your email address or mobile number. After registration, complete your profile by selecting your role (Shipper or Trucker) and providing your business details.",
      },
      {
        q: "What documents do I need to register as a carrier?",
        a: "Carriers need to upload: a valid Government ID, LTFRB Certificate of Public Convenience, Vehicle OR/CR, Cargo Insurance, and Driver's License. All documents will be verified by our team within 24-48 hours.",
      },
      {
        q: "How long does account verification take?",
        a: "Account verification typically takes 24-48 business hours. You will receive a notification once your account has been reviewed. Incomplete documents may require re-submission.",
      },
      {
        q: "Can I use TruckConnect PH on my mobile phone?",
        a: "Yes! TruckConnect PH is fully responsive and works on any modern mobile browser. We also support offline viewing of cached data when you have limited connectivity.",
      },
      {
        q: "Is TruckConnect PH available nationwide?",
        a: "We currently operate across major routes in Luzon, Visayas, and Mindanao. We are continuously expanding our coverage area and partner network.",
      },
    ],
  },
  {
    name: "For Shippers",
    icon: BuildingOfficeIcon,
    color: "bg-blue-50 text-blue-600",
    questions: [
      {
        q: "How do I post a load?",
        a: "Navigate to 'Post a Load' from your dashboard. Fill in the origin, destination, cargo type, weight, preferred truck type, and pickup date. You can also set a maximum budget and special handling requirements.",
      },
      {
        q: "How does the bidding system work?",
        a: "After posting a load, verified carriers can submit bids. You can view all bids, compare rates and carrier ratings, send counter-offers, and accept the best bid. The system also provides AI-powered rate estimates.",
      },
      {
        q: "Can I save favorite carriers?",
        a: "Yes! After completing a booking with a carrier, you can save them to your favorites list. This makes it easy to directly book trusted carriers for future shipments.",
      },
      {
        q: "What is the platform fee for shippers?",
        a: "Shippers pay a 3.5% platform fee on each booking. This covers payment processing, insurance facilitation, dispute resolution, and 24/7 customer support.",
      },
    ],
  },
  {
    name: "For Truckers",
    icon: TruckIcon,
    color: "bg-amber-50 text-amber-600",
    questions: [
      {
        q: "How do I find available loads?",
        a: "Browse the Load Board from your dashboard to see all available loads. You can filter by route, cargo type, truck type, and date. Set up Route Alerts to get notified when loads match your preferred routes.",
      },
      {
        q: "What are backhaul offers?",
        a: "Backhaul offers let you list available capacity on return trips at discounted rates. This helps you avoid empty return trips and earn additional income. Shippers benefit from lower rates on these routes.",
      },
      {
        q: "How do I get paid after a delivery?",
        a: "Payment is processed through our escrow system. Once the shipper confirms delivery via ePOD (electronic Proof of Delivery), funds are released to your GCash or bank account within 1-2 business days.",
      },
      {
        q: "What are truck ban windows?",
        a: "Truck ban windows are time-restricted periods when certain truck types cannot operate in specific zones (e.g., Metro Manila). Our system automatically checks for conflicts and suggests alternative delivery windows.",
      },
    ],
  },
  {
    name: "Payments",
    icon: CurrencyDollarIcon,
    color: "bg-green-50 text-green-600",
    questions: [
      {
        q: "What payment methods are supported?",
        a: "We support GCash, Bank Transfer, Corporate Credit, and Cash on Delivery. GCash is the most popular option and provides instant payment confirmation.",
      },
      {
        q: "How does the escrow system work?",
        a: "When a booking is confirmed, the shipper's payment is held in escrow. The funds are only released to the carrier after successful delivery is confirmed through the ePOD process. This protects both parties.",
      },
      {
        q: "What happens if a payment fails?",
        a: "If a payment fails, you will receive a notification with the reason. Common causes include insufficient funds or bank maintenance windows. You can retry the payment or switch to another payment method.",
      },
      {
        q: "Can I get a refund?",
        a: "Refunds are processed for cancelled bookings within the cancellation window, or when disputes are resolved in the shipper's favor. Refunds typically take 3-5 business days to process.",
      },
    ],
  },
  {
    name: "Disputes",
    icon: ShieldExclamationIcon,
    color: "bg-red-50 text-red-600",
    questions: [
      {
        q: "How do I file a dispute?",
        a: "You can file a dispute from the booking details page. Select the dispute type (cargo damage, late delivery, detention fee, etc.), provide a description, and upload evidence photos. Our team will review within 48 hours.",
      },
      {
        q: "What types of disputes can I file?",
        a: "Supported dispute types include: Cargo Damage, Late Delivery, Detention Fee, Cargo Misrepresentation, No-Show, and Other. Each type has specific resolution guidelines.",
      },
      {
        q: "How long does dispute resolution take?",
        a: "Most disputes are resolved within 3-5 business days. Complex cases involving insurance claims may take up to 10 business days. You will receive updates via notifications throughout the process.",
      },
      {
        q: "Can I appeal a dispute resolution?",
        a: "Yes, you can appeal a dispute resolution within 7 days of the decision. Provide additional evidence or context for your appeal. Appeals are reviewed by a senior team member.",
      },
    ],
  },
  {
    name: "Account",
    icon: UserCircleIcon,
    color: "bg-purple-50 text-purple-600",
    questions: [
      {
        q: "How do I update my profile?",
        a: "Go to Settings > Profile from your dashboard. You can update your business name, contact information, and profile photo. Some changes (like business name) may require re-verification.",
      },
      {
        q: "How do I change my notification preferences?",
        a: "Navigate to Settings > Notifications. You can customize which notifications you receive via push, SMS, and email. We recommend keeping booking and payment notifications enabled.",
      },
      {
        q: "Can I deactivate my account?",
        a: "Yes, you can deactivate your account from Settings > Account. This will hide your profile and cancel any active route alerts. You can reactivate at any time by logging back in.",
      },
      {
        q: "What is the referral program?",
        a: "Share your unique referral code with other businesses. When they sign up and complete their first trip, carriers earn P500 and shippers earn P200 credit. There is no limit to the number of referrals.",
      },
    ],
  },
]

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCategories = searchQuery.trim()
    ? faqCategories
        .map((cat) => ({
          ...cat,
          questions: cat.questions.filter(
            (faq) =>
              faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.a.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.questions.length > 0)
    : faqCategories

  const totalResults = filteredCategories.reduce(
    (sum, cat) => sum + cat.questions.length,
    0
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        <p className="mt-2 text-gray-500">
          Find answers to common questions about TruckConnect PH.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for answers..."
          className="block w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-500">
            {totalResults} result{totalResults !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* FAQ Categories */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-700">No results found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try a different search term or browse the categories below.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((category) => {
            const Icon = category.icon
            return (
              <div key={category.name}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${category.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                  <Badge variant="default">{category.questions.length}</Badge>
                </div>

                <div className="space-y-2">
                  {category.questions.map((faq, index) => (
                    <Disclosure key={index}>
                      {({ open }) => (
                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                          <DisclosureButton className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                            <span className="text-sm font-medium text-gray-700 pr-4">
                              {faq.q}
                            </span>
                            <ChevronDownIcon
                              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                                open ? "rotate-180" : ""
                              }`}
                            />
                          </DisclosureButton>
                          <DisclosurePanel className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                            {faq.a}
                          </DisclosurePanel>
                        </div>
                      )}
                    </Disclosure>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Contact Support */}
      <div className="mt-12 rounded-lg bg-indigo-50 border border-indigo-200 p-6 text-center">
        <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Still need help?</h3>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Our support team is available 24/7 to assist you.
        </p>
        <Button onClick={() => (window.location.href = "/support/new")}>
          Contact Support
        </Button>
      </div>
    </div>
  )
}
