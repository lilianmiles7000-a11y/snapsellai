export type Plan = "free" | "pro";
export type Platform = "vinted" | "leboncoin" | "facebook_marketplace" | "ebay";
export type ListingStatus = "draft" | "generating" | "ready" | "published" | "archived";
export type EnhancementAction =
  | "enhance_colors" | "improve_brightness" | "sharpen" | "reduce_noise"
  | "auto_crop" | "remove_background" | "white_background"
  | "marketplace_background" | "transparent_background";
export type EnhancementStatus = "pending" | "processing" | "done" | "failed";
export type EnhancementProvider = "cloudinary" | "replicate" | "removebg" | "fal";
export type EnhancementPreset = "none" | "enhance_colors" | "white_background" | "marketplace_background";
export type PreferredBackground = "white" | "marketplace" | "transparent" | "original";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  credits_remaining: number;
  credits_total: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  status: SubscriptionStatus;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  storage_path: string | null;
  order_index: number;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  condition: string | null;
  size: string | null;
  colors: string[] | null;
  materials: string[] | null;
  gender: string | null;
  suggested_price: number | null;
  quick_sale_price: number | null;
  premium_price: number | null;
  confidence: number | null;
  currency: string;
  platform: Platform | null;
  status: ListingStatus;
  seo_keywords: string[] | null;
  tags: string[] | null;
  hashtags: string[] | null;
  images: ListingImage[];
  created_at: string;
  updated_at: string;
}

export interface PhotoEnhancement {
  id: string;
  user_id: string;
  listing_id: string | null;
  original_url: string;
  enhanced_url: string | null;
  original_storage_path: string | null;
  enhanced_storage_path: string | null;
  action: EnhancementAction;
  status: EnhancementStatus;
  provider: EnhancementProvider | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UserAISettings {
  id: string;
  default_preset: EnhancementPreset;
  auto_enhance: boolean;
  preferred_background: PreferredBackground;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  totalListings: number;
  listingsThisMonth: number;
  estimatedValue: number;
  timeSavedMinutes: number;
  topPlatform: Platform | null;
  weeklyData: { day: string; listings: number }[];
  platformBreakdown: { platform: Platform; count: number }[];
}

export interface PlatformInfo {
  id: Platform;
  label: string;
  color: string;
}

export interface AnalysisStep {
  key: string;
  label: string;
  status: "pending" | "running" | "done";
}

export interface PricingPlan {
  id: Plan;
  name: string;
  price: number | null;
  priceId: string | null;
  description: string;
  features: string[];
  limits: {
    listings: number | null;
    aiRequests: number | null;
    photoEnhancements: number | null;
    historyDays: number | null;
  };
  highlight?: boolean;
  badge?: string;
}
