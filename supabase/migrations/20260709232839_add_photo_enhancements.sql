/*
# Photo Enhancements — AI Photo Studio

## Overview
Tracks before/after AI photo enhancements for each listing image.
Stores original and enhanced image URLs, the action applied, and links to the listing.

## 1. New Tables

### photo_enhancements
Stores each individual AI enhancement applied to a listing image.
- `id` (uuid, PK) — unique enhancement record
- `user_id` (uuid, FK → auth.users) — owner
- `listing_id` (uuid, FK → listings, nullable) — linked listing if any
- `original_url` (text) — public URL of the original image
- `enhanced_url` (text, nullable) — public URL of the AI-enhanced image
- `original_storage_path` (text, nullable) — Supabase Storage path of original
- `enhanced_storage_path` (text, nullable) — Supabase Storage path of enhanced
- `action` (text) — the enhancement action: enhance_colors, improve_brightness, sharpen, reduce_noise, auto_crop, remove_background, white_background, marketplace_background, transparent_background
- `status` (text) — pending | processing | done | failed
- `provider` (text, nullable) — which AI provider processed this (cloudinary, replicate, removebg, fal)
- `metadata` (jsonb, nullable) — provider-specific response metadata
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### user_ai_settings
Stores per-user AI Photo Studio preferences.
- `id` (uuid, PK, FK → auth.users) — one row per user
- `default_preset` (text) — none | enhance_colors | white_background | marketplace_background
- `auto_enhance` (boolean) — auto-run enhancement after upload
- `preferred_background` (text) — white | marketplace | transparent | original
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## 2. Security
- RLS enabled on both tables
- Owner-scoped CRUD policies for authenticated users
- `user_id` defaults to `auth.uid()` so client inserts without passing user_id still work
*/

CREATE TABLE IF NOT EXISTS photo_enhancements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  original_url text NOT NULL,
  enhanced_url text,
  original_storage_path text,
  enhanced_storage_path text,
  action text NOT NULL DEFAULT 'enhance_colors',
  status text NOT NULL DEFAULT 'pending',
  provider text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE photo_enhancements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_enhancements" ON photo_enhancements;
CREATE POLICY "select_own_enhancements" ON photo_enhancements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_enhancements" ON photo_enhancements;
CREATE POLICY "insert_own_enhancements" ON photo_enhancements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_enhancements" ON photo_enhancements;
CREATE POLICY "update_own_enhancements" ON photo_enhancements FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_enhancements" ON photo_enhancements;
CREATE POLICY "delete_own_enhancements" ON photo_enhancements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS photo_enhancements_user_id_idx ON photo_enhancements(user_id);
CREATE INDEX IF NOT EXISTS photo_enhancements_listing_id_idx ON photo_enhancements(listing_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_photo_enhancements_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS photo_enhancements_updated_at ON photo_enhancements;
CREATE TRIGGER photo_enhancements_updated_at
  BEFORE UPDATE ON photo_enhancements
  FOR EACH ROW EXECUTE FUNCTION update_photo_enhancements_updated_at();

-- User AI settings
CREATE TABLE IF NOT EXISTS user_ai_settings (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_preset text NOT NULL DEFAULT 'none',
  auto_enhance boolean NOT NULL DEFAULT false,
  preferred_background text NOT NULL DEFAULT 'original',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_settings" ON user_ai_settings;
CREATE POLICY "select_own_ai_settings" ON user_ai_settings FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_ai_settings" ON user_ai_settings;
CREATE POLICY "insert_own_ai_settings" ON user_ai_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_ai_settings" ON user_ai_settings;
CREATE POLICY "update_own_ai_settings" ON user_ai_settings FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_ai_settings" ON user_ai_settings;
CREATE POLICY "delete_own_ai_settings" ON user_ai_settings FOR DELETE
  TO authenticated USING (auth.uid() = id);
