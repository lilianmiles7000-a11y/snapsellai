/*
# Subscriptions Table + Usage Tracking

## Overview
Creates the subscriptions table for Stripe billing integration and adds usage
tracking columns to the profiles table.

## 1. New Tables

### subscriptions
Tracks Stripe subscription state per user.
- id (uuid, PK) — unique subscription record
- user_id (uuid, FK → auth.users) — owner; defaults to auth.uid()
- stripe_customer_id (text, nullable) — Stripe customer ID
- stripe_subscription_id (text, nullable) — Stripe subscription ID
- plan (text) — 'free' | 'pro'
- status (text) — 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
- renewal_date (timestamptz, nullable) — when the subscription renews
- created_at / updated_at (timestamptz)

## 2. Modified Tables

### profiles
- Added usage_listings_this_month (integer) — count of listings created this calendar month
- Added usage_reset_at (timestamptz) — when the monthly usage was last reset
- Updated credits_total default from 10 → 5 for free tier

## 3. Security
- RLS enabled on subscriptions
- Owner-scoped CRUD policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  renewal_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx ON subscriptions(stripe_customer_id);

-- Add usage tracking to profiles (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='usage_listings_this_month') THEN
    ALTER TABLE profiles ADD COLUMN usage_listings_this_month integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='usage_reset_at') THEN
    ALTER TABLE profiles ADD COLUMN usage_reset_at timestamptz DEFAULT date_trunc('month', now());
  END IF;
END $$;

-- Auto-update subscriptions.updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();
