import type { BookingStatus } from "@prisma/client"

/**
 * Valid booking status transitions.
 * Terminal states (COMPLETED, CANCELLED) have no outgoing transitions.
 */
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  CONFIRMED: ["IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["COMPLETED"],
  DISPUTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
}

/**
 * Check if a transition from currentStatus to newStatus is valid.
 */
export function validateTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus
): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus]
  return allowed !== undefined && allowed.includes(newStatus)
}

/**
 * Get the list of valid next statuses from the current status.
 */
export function getNextStatuses(currentStatus: BookingStatus): string[] {
  return VALID_TRANSITIONS[currentStatus] ?? []
}

/**
 * Check if a transition is valid, returning a structured result with error message.
 */
export function canTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus
): { valid: boolean; error?: string } {
  if (!(currentStatus in VALID_TRANSITIONS)) {
    return {
      valid: false,
      error: `Unknown booking status: ${currentStatus}`,
    }
  }

  if (!(newStatus in VALID_TRANSITIONS)) {
    return {
      valid: false,
      error: `Unknown target status: ${newStatus}`,
    }
  }

  const allowed = VALID_TRANSITIONS[currentStatus]
  if (allowed.length === 0) {
    return {
      valid: false,
      error: `${currentStatus} is a terminal status and cannot be changed`,
    }
  }

  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}. Valid transitions: ${allowed.join(", ")}`,
    }
  }

  return { valid: true }
}
