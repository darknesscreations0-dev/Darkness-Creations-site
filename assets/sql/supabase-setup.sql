-- ============================================================
-- DARKNESS CREATIONS — SUPABASE SETUP
-- ------------------------------------------------------------
-- Run this once in your Supabase project:
-- Dashboard → SQL Editor → New query → paste this whole file → Run
-- ============================================================

-- ---------- Products table ----------
-- One table, shared by both Darkness Creations' marketplace and
-- Crispy Pizza's store — separated by the `brand` column.
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null default 'darkness-creations', -- 'darkness-creations' or 'crispy-pizza'
  name          text not null,
  category      text not null,          -- e.g. 'templates', 'project-files', 'plugins'
  description   text,
  price         numeric,                -- null or 0 when is_free is true
  is_free       boolean not null default false,
  badge         text,                   -- e.g. 'Bestseller', 'New', 'Free' — optional
  tags          text[] default '{}',
  image_url     text,
  video_url     text,                   -- optional preview/demo video
  file_url      text,                   -- the actual downloadable product file
  sort_order    int default 0,
  is_published  boolean not null default true,
  created_at    timestamptz default now()
);

-- ---------- Row Level Security ----------
alter table products enable row level security;

-- Anyone (including logged-out visitors) can VIEW published products.
create policy "Public can view published products"
  on products for select
  using (is_published = true);

-- Only logged-in users (i.e. you, once you have an account) can
-- insert, update, or delete. Since you'll be the only account,
-- this effectively makes it admin-only.
create policy "Authenticated users can insert products"
  on products for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update products"
  on products for update
  to authenticated
  using (true);

create policy "Authenticated users can delete products"
  on products for delete
  to authenticated
  using (true);

-- ============================================================
-- STORAGE BUCKETS
-- ------------------------------------------------------------
-- Run this too — creates two public buckets for images and videos.
-- (You can also do this via Dashboard → Storage → New bucket,
-- just make sure "Public bucket" is checked for both.)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

-- Allow public read of anything in product-media.
create policy "Public can view product media"
  on storage.objects for select
  using (bucket_id = 'product-media');

-- Allow only authenticated users (you) to upload/delete.
create policy "Authenticated users can upload product media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-media');

create policy "Authenticated users can delete product media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-media');

-- ============================================================
-- Next: create your one admin login.
-- Dashboard → Authentication → Users → Add user → enter your
-- email + a password. That's the account you'll log in with
-- on admin.html.
-- ============================================================
