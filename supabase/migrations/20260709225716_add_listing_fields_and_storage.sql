/*
# SnapSell AI — Add listing detail fields + storage bucket

## Overview
Extends the `listings` table with reseller-relevant fields (size, colors,
quick_sale_price, premium_price, tags) and creates a `listing-images` storage
bucket with RLS policies so authenticated users can upload product photos.

## 1. Modified Tables
- `listings`
  - `size` text nullable — clothing/shoe size or product dimensions.
  - `colors` text[] nullable — detected or user-set color names.
  - `quick_sale_price` numeric(10,2) nullable — fast-sell price suggestion.
  - `premium_price` numeric(10,2) nullable — premium/listing ceiling price.
  - `tags` text[] nullable — marketplace tags for search visibility.

All additions are nullable with no defaults, so existing rows are unaffected.

## 2. Storage
- Create bucket `listing-images` (public read, authenticated write).
- RLS policies:
  - SELECT (public read): anyone can view listing images.
  - INSERT/UPDATE/DELETE: authenticated users manage their own folder
    (`user_id/{filename}`).

## 3. Security Notes
- The bucket is public-read so marketplace-style image URLs work without
  signed URLs. Writes are scoped to the authenticated owner's folder prefix.
- No destructive changes — only ADD COLUMN and CREATE.
*/

-- Add new columns to listings (idempotent)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS colors text[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quick_sale_price numeric(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS premium_price numeric(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS tags text[];

-- Create the listing-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
-- Public read: anyone can view listing images
DROP POLICY IF EXISTS "public_read_listing_images" ON storage.objects;
CREATE POLICY "public_read_listing_images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "auth_upload_listing_images" ON storage.objects;
CREATE POLICY "auth_upload_listing_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update their own files
DROP POLICY IF EXISTS "auth_update_listing_images" ON storage.objects;
CREATE POLICY "auth_update_listing_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "auth_delete_listing_images" ON storage.objects;
CREATE POLICY "auth_delete_listing_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
