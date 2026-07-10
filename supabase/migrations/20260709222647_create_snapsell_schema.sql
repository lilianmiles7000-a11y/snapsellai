/*
# SnapSell AI — Core Schema

## Overview
Creates the production schema for SnapSell AI, an AI-powered listing generator
for resellers on Vinted, Leboncoin, Facebook Marketplace and eBay. The app has
a sign-in screen, so all data is owner-scoped per authenticated user.

## 1. New Tables
- `profiles` — extends auth.users with billing/plan/credits info.
- `listings` — generated listings created from uploaded photos.
- `listing_images` — photos attached to a listing (stored in Cloudinary).
- `subscriptions` — Stripe billing state mirror.

## 2. Security — RLS
All tables have RLS enabled. Because the app has a sign-in screen, every policy
is scoped TO authenticated with an auth.uid() = user_id ownership check. Owner
columns default to auth.uid() so client inserts that omit user_id still pass
the WITH CHECK predicate. Four separate policies per table — no FOR ALL.
listing_images is scoped through its parent listing via EXISTS subquery.

## 3. Indexes
- listings(user_id, created_at desc) — dashboard + history queries.
- listing_images(listing_id, order_index) — image ordering.
- subscriptions(user_id) — billing lookups.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free',
  credits_remaining integer NOT NULL DEFAULT 10,
  credits_total integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- listings
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  description text,
  category text,
  condition text,
  brand text,
  suggested_price numeric(10,2),
  currency text NOT NULL DEFAULT 'EUR',
  platform text,
  status text NOT NULL DEFAULT 'draft',
  seo_keywords text[],
  attributes jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_listings" ON listings;
CREATE POLICY "select_own_listings" ON listings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_listings" ON listings;
CREATE POLICY "insert_own_listings" ON listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_listings" ON listings;
CREATE POLICY "update_own_listings" ON listings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_listings" ON listings;
CREATE POLICY "delete_own_listings" ON listings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- listing_images
CREATE TABLE IF NOT EXISTS listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  cloudinary_public_id text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_images" ON listing_images;
CREATE POLICY "select_own_images" ON listing_images FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_images" ON listing_images;
CREATE POLICY "insert_own_images" ON listing_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_images" ON listing_images;
CREATE POLICY "update_own_images" ON listing_images FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_images" ON listing_images;
CREATE POLICY "delete_own_images" ON listing_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM listings WHERE listings.id = listing_images.listing_id AND listings.user_id = auth.uid())
  );

-- subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscription" ON subscriptions;
CREATE POLICY "select_own_subscription" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subscription" ON subscriptions;
CREATE POLICY "insert_own_subscription" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subscription" ON subscriptions;
CREATE POLICY "update_own_subscription" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_subscription" ON subscriptions;
CREATE POLICY "delete_own_subscription" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_user_created ON listings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images (listing_id, order_index);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);

-- updated_at trigger for profiles and listings
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_listings_updated ON listings;
CREATE TRIGGER trg_listings_updated BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
