-- Migration 002: organization_members table
-- Run this second in the Supabase SQL editor (after 001)

create table if not exists organization_members (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('admin', 'member')),
  joined_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

-- Enable Row Level Security
alter table organization_members enable row level security;

-- Helper: check admin status without triggering RLS recursion
create or replace function public.is_org_admin(check_org_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members
    where org_id = check_org_id
      and user_id = check_user_id
      and role = 'admin'
  );
$$;

-- Users can read their own memberships
create policy "Users can read their own memberships"
  on organization_members for select
  using (user_id = auth.uid());

-- Org admins can read all memberships in their org (uses security definer fn to avoid recursion)
create policy "Admins can read all memberships in their org"
  on organization_members for select
  using (public.is_org_admin(org_id, auth.uid()));

-- Authenticated users can insert their own membership (join via invite code)
create policy "Users can join orgs"
  on organization_members for insert
  with check (user_id = auth.uid());

-- Users can leave (delete their own membership)
create policy "Users can leave orgs"
  on organization_members for delete
  using (user_id = auth.uid());

-- Admins can remove members from their org
create policy "Admins can remove members"
  on organization_members for delete
  using (public.is_org_admin(org_id, auth.uid()));

-- Now that organization_members exists, add the cross-table org policies
-- Only org admins can update their org
create policy "Admins can update their org"
  on organizations for update
  using (
    exists (
      select 1 from organization_members
      where organization_members.org_id = organizations.id
        and organization_members.user_id = auth.uid()
        and organization_members.role = 'admin'
    )
  );
