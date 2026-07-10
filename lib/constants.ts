import type { PlatformInfo, PricingPlan } from "@/types";
import { STRIPE_PRO_PRICE_ID } from "@/lib/env";

export const APP_NAME = "SnapSell AI";
export const APP_TAGLINE =
  "Upload photos. AI enhances them and generates the perfect listing in seconds.";

export const PLATFORMS: PlatformInfo[] = [
  { id: "vinted",               label: "Vinted",     color: "#09B1BA" },
  { id: "leboncoin",            label: "Leboncoin",  color: "#F56B2A" },
  { id: "facebook_marketplace", label: "Facebook",   color: "#1877F2" },
  { id: "ebay",                 label: "eBay",       color: "#E53238" },
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceId: null,
    description: "Get started with AI-powered listing creation.",
    features: [
      "5 listings per month",
      "Standard AI analysis",
      "4 platforms supported",
      "30-day history",
      "Basic photo enhancement",
    ],
    limits: {
      listings: 5,
      aiRequests: 5,
      photoEnhancements: 10,
      historyDays: 30,
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    // Use the centralised env helper — never access process.env directly here.
    priceId: STRIPE_PRO_PRICE_ID || null,
    description: "Everything you need to sell faster at scale.",
    features: [
      "Unlimited listings",
      "Unlimited AI analysis",
      "HD photo enhancement",
      "Background removal",
      "Priority processing",
      "Unlimited history",
      "All future features",
    ],
    limits: {
      listings: null,
      aiRequests: null,
      photoEnhancements: null,
      historyDays: null,
    },
    highlight: true,
    badge: "Most popular",
  },
];

export const FREE_LIMITS = {
  listings: 5,
  aiRequests: 5,
  photoEnhancements: 10,
} as const;
