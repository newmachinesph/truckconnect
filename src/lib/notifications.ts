import { prisma } from "@/lib/db"

export async function createNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ? JSON.parse(JSON.stringify(params.data)) : undefined,
    },
  })
}

export async function notifyBidReceived(shipperUserId: string, loadId: string, truckerName: string) {
  return createNotification({
    userId: shipperUserId,
    type: "BID_RECEIVED",
    title: "New Bid Received",
    body: `${truckerName} placed a bid on your load`,
    data: { loadId },
  })
}

export async function notifyBidAccepted(truckerUserId: string, loadId: string, bookingId: string) {
  return createNotification({
    userId: truckerUserId,
    type: "BID_ACCEPTED",
    title: "Bid Accepted!",
    body: "Your bid has been accepted. Check your bookings.",
    data: { loadId, bookingId },
  })
}

export async function notifyPaymentReceived(truckerUserId: string, bookingId: string, amount: number) {
  return createNotification({
    userId: truckerUserId,
    type: "PAYMENT_RECEIVED",
    title: "Payment Received",
    body: `₱${amount.toLocaleString()} has been held in escrow for your delivery`,
    data: { bookingId },
  })
}

export async function notifyDeliveryConfirmed(shipperUserId: string, bookingId: string) {
  return createNotification({
    userId: shipperUserId,
    type: "DELIVERY_CONFIRMED",
    title: "Delivery Confirmed",
    body: "Your delivery has been confirmed with ePOD",
    data: { bookingId },
  })
}

export async function notifyReviewReceived(userId: string, reviewerName: string) {
  return createNotification({
    userId,
    type: "REVIEW_RECEIVED",
    title: "New Review",
    body: `${reviewerName} left you a review`,
  })
}
