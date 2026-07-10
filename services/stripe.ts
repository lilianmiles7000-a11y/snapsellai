/**
 * services/stripe.ts
 *
 * Thin re-export kept for backwards compatibility with any existing imports.
 * All Stripe logic has moved to services/subscriptions.ts.
 */
export { createCheckoutSession, openBillingPortal } from "@/services/subscriptions";
