/*
# SnapSell AI — Add AI analysis fields to listings

## Overview
Adds columns to `listings` for the richer AI analysis data returned by the
OpenAI Vision edge function: materials, subcategory, gender, and confidence.

## 1. Modified Tables
- `listings`
  - `materials` text[] nullable — detected materials (e.g. ["Cotton", "Polyester"]).
  - `subcategory` text nullable — subcategory within the main category.
  - `gender` text nullable — "Men", "Women", "Unisex", or "Unknown".
  - `confidence` numeric(3,2) nullable — AI confidence score 0.00–1.00.

All additions are nullable with no defaults — existing rows are unaffected.

## 2. Security
No RLS policy changes needed — existing owner-scoped policies already cover
all columns on the table.
*/

ALTER TABLE listings ADD COLUMN IF NOT EXISTS materials text[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS confidence numeric(3,2);
