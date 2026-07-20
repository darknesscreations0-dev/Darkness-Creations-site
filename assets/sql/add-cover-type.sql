-- ============================================================
-- Adds support for video covers (not just static images)
-- Run this once in Supabase → SQL Editor → New query → Run
-- ============================================================
alter table public.products
  add column if not exists cover_type text not null default 'image';
-- cover_type will be either 'image' or 'video'
