"use client"

import { useEffect, useState } from "react"
import { Card, CardTitle, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { PageLoading } from "@/components/ui/LoadingSpinner"
import { useToast } from "@/components/ui/Toast"
import { formatPeso } from "@/lib/utils"
import {
  CheckIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

type PlanType = "FREE" | "FLEET_PRO" | "ENTERPRISE"

const plans: {
  id: PlanType
  name: string
  price: string
  priceAmount: number
  period: string
  description: string
  icon: typeof SparklesIcon
  features: string[]
  highlight?: boolean
}[] = [
  {
    id: "FREE",
    name: "Free",
    price: formatPeso(0),
    priceAmount: 0,
    period: "forever",
    description: "Get started with basic features",
    icon: RocketLaunchIcon,
    features: [
      "5 loads per month",
      "Basic analytics",
      "Email support",
      "Standard load board access",
      "Basic notifications",
    ],
  },
  {
    id: "FLEET_PRO",
    name: "Fleet Pro",
    price: formatPeso(2999),
    priceAmount: 2999,
    period: "/month",
    description: "For growing businesses that need more",
    icon: SparklesIcon,
    highlight: true,
    features: [
      "Unlimited loads",
      "Advanced analytics & reports",
      "Priority support (24/7)",
      "Fleet Pro badge on profile",
      "Priority load matching",
      "Bulk load posting",
      "Custom invoicing",
      "Dedicated account support",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    priceAmount: 0,
    period: "pricing",
    description: "For large fleets and enterprises",
    icon: BuildingOfficeIcon,
    features: [
      "Everything in Fleet Pro",
      "Dedicated account manager",
      "Custom API integrations",
      "White-label options",
      "SLA guarantees",
      "Custom reporting",
      "Multi-user management",
      "Priority feature requests",
    ],
  },
]

export default function SubscriptionPage() {
  const { toast } = useToast()
  const [currentPlan, setCurrentPlan] = useState<PlanType>("FREE")
  const [isLoading, setIsLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState<PlanType | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscription")
        const data = await res.json()
        if (data.success && data.data) {
          setCurrentPlan(data.data.plan as PlanType)
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubscription()
  }, [])

  async function handleChangePlan(plan: PlanType) {
    if (plan === currentPlan) return

    if (plan === "ENTERPRISE") {
      toast("info", "Please contact our sales team for Enterprise pricing")
      return
    }

    setChangingPlan(plan)
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentPlan(plan)
        toast(
          "success",
          plan === "FREE"
            ? "Downgraded to Free plan"
            : `Upgraded to ${plans.find((p) => p.id === plan)?.name}!`
        )
      } else {
        toast("error", data.error || "Failed to change plan")
      }
    } catch {
      toast("error", "Failed to change plan")
    } finally {
      setChangingPlan(null)
    }
  }

  if (isLoading) return <PageLoading />

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-xl sm:font-display text-2xl font-bold text-warm-800">Subscription Plans</h1>
        <p className="text-sm text-warm-400 mt-2">
          Choose the plan that fits your business. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current Plan Banner */}
      <Card className="text-center bg-indigo-600-50 border-indigo-200">
        <CardContent>
          <p className="text-sm text-indigo-500">
            You are currently on the{" "}
            <span className="font-bold">{plans.find((p) => p.id === currentPlan)?.name}</span>{" "}
            plan
          </p>
        </CardContent>
      </Card>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const Icon = plan.icon

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.highlight && "ring-2 ring-indigo-600-500 border-indigo-600-300",
                isCurrent && "bg-indigo-600-50/30"
              )}
            >
              {plan.highlight && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3">
                  Most Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <div
                  className={cn(
                    "inline-flex items-center justify-center h-12 w-12 rounded-xl mb-3",
                    plan.highlight
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-warm-100 text-warm-400"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-warm-800">{plan.name}</h3>
                <p className="text-xs text-warm-400 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="font-display text-3xl font-bold text-warm-800">{plan.price}</span>
                  <span className="text-sm text-warm-300 ml-1">{plan.period}</span>
                </div>
              </div>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-warm-500">
                      <CheckIcon
                        className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          plan.highlight ? "text-indigo-600" : "text-warm-300"
                        )}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.id === "ENTERPRISE" ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleChangePlan(plan.id)}
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlight ? "primary" : "secondary"}
                    className="w-full"
                    onClick={() => handleChangePlan(plan.id)}
                    isLoading={changingPlan === plan.id}
                  >
                    {plans.findIndex((p) => p.id === plan.id) >
                    plans.findIndex((p) => p.id === currentPlan)
                      ? "Upgrade"
                      : "Downgrade"}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* FAQ */}
      <Card>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardContent className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-warm-800">Can I change plans anytime?</p>
            <p className="text-sm text-warm-400 mt-1">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-warm-800">Is there a contract?</p>
            <p className="text-sm text-warm-400 mt-1">
              No. All plans are month-to-month with no long-term commitment required.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-warm-800">What payment methods are accepted?</p>
            <p className="text-sm text-warm-400 mt-1">
              We accept GCash, bank transfer, and major credit cards.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-warm-800">What is the Fleet Pro badge?</p>
            <p className="text-sm text-warm-400 mt-1">
              Fleet Pro subscribers get a verified badge on their profile, increasing trust with shippers and truckers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
