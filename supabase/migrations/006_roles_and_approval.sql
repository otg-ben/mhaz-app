-- 006: moderator role + account approval gate
-- New signups land unapproved and can see NOTHING until an admin approves them.
-- Enforced in RLS, not just the UI.

-- ─── Columns ──────────────────────────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'mod', 'admin')),
  ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users;

-- Keep legacy is_admin in sync with the new role column
UPDATE public.users SET role = 'admin' WHERE is_admin = true;
UPDATE public.users SET approved = true WHERE is_admin = true;

-- ─── Helpers (mirror public.is_admin from 002) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND approved = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_mod()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND approved = true
      AND (role IN ('mod', 'admin') OR is_admin = true)
  )
$$;

-- ─── Swap every "any authenticated user" check for "any APPROVED user" ────────
-- Rewrites the policies created in 002 in place.
DO $do$
DECLARE r record; q text; w text;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual, with_check FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%auth.uid() IS NOT NULL%' OR with_check LIKE '%auth.uid() IS NOT NULL%')
  LOOP
    q := replace(coalesce(r.qual, ''),       'auth.uid() IS NOT NULL', 'public.is_approved()');
    w := replace(coalesce(r.with_check, ''), 'auth.uid() IS NOT NULL', 'public.is_approved()');
    IF r.qual IS NOT NULL AND r.with_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s) WITH CHECK (%s)', r.policyname, r.tablename, q, w);
    ELSIF r.qual IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (%s)', r.policyname, r.tablename, q);
    ELSE
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (%s)', r.policyname, r.tablename, w);
    END IF;
  END LOOP;
END
$do$;

-- Unapproved users must still read their OWN row, or the app can't tell them
-- they're pending (permissive policy, ORs with the approved-users policy).
DROP POLICY IF EXISTS "Users can always view own profile" ON public.users;
CREATE POLICY "Users can always view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- ─── Privilege escalation guard ───────────────────────────────────────────────
-- Without this a user could UPDATE their own row and set approved = true.
-- Approvals are performed server-side with the service-role key.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (handle, bio) ON public.users TO authenticated;

-- ─── Bootstrap the owner account ──────────────────────────────────────────────
-- benhaus@gmail.com is auto-approved as admin+mod whenever it signs up,
-- so the first account is never stuck behind its own approval queue.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE is_owner boolean := (lower(NEW.email) = 'benhaus@gmail.com');
BEGIN
  INSERT INTO public.users (id, email, handle, is_admin, role, approved, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1)),
    is_owner,
    CASE WHEN is_owner THEN 'admin' ELSE 'user' END,
    is_owner,
    CASE WHEN is_owner THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- If the owner account already exists, promote it.
UPDATE public.users
  SET is_admin = true, role = 'admin', approved = true, approved_at = now()
  WHERE lower(email) = 'benhaus@gmail.com';

CREATE INDEX IF NOT EXISTS idx_users_pending ON public.users (created_at) WHERE approved = false;
