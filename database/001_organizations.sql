-- Migration 001: organizations table
-- Run this first in the Supabase SQL editor

create table if not exists organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  sport        text,
  invite_code  char(8) unique not null,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- Enable Row Level Security
alter table organizations enable row level security;

-- Authenticated users can create orgs
create policy "Authenticated users can create orgs"
  on organizations for insert
  with check (auth.uid() = created_by);

-- Allow anyone to read orgs (needed for invite code lookup and member access)
-- Cross-table policies that reference organization_members are in 002_organization_members.sql
create policy "Anyone can read orgs"
  on organizations for select
  using (true);
