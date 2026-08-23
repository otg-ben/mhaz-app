-- 011: profile fields + moderated handle changes

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS location text,
  -- A requested handle sits here until an admin approves it; handle itself
  -- is only rewritten on approval, so existing @mentions stay stable.
  ADD COLUMN IF NOT EXISTS pending_handle text,
  ADD COLUMN IF NOT EXISTS pending_handle_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_pending_handle
  ON public.users (pending_handle_at) WHERE pending_handle IS NOT NULL;

-- Members may edit their own bio and location, and request a handle change.
-- handle / role / approved stay server-side only (see 006).
-- 006 granted UPDATE on handle directly, which would let a member rename
-- themselves and skip the approval queue entirely.
REVOKE UPDATE (handle) ON public.users FROM authenticated;

-- updated_at is included because the API stamps it on every profile save
GRANT UPDATE (bio, location, pending_handle, pending_handle_at, updated_at)
  ON public.users TO authenticated;

-- Handles are used as identity throughout the app, so they must be unique.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_unique
  ON public.users (lower(handle));
