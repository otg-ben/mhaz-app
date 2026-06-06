-- MHAZ — RLS Policy Update
-- Admins: full god-mode access on all tables
-- Authenticated users: read all, write own, resolve trail/L&F
-- Unauthenticated: no access whatsoever
--
-- Run in Supabase SQL Editor after 001_initial_schema.sql

-- ─── Admin helper function ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  )
$$;

-- ─── Users ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users are publicly viewable" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Admin full access on users"
  ON public.users FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view all profiles"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id AND NOT public.is_admin())
  WITH CHECK (auth.uid() = id);

-- ─── LEO Alerts ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "LEO alerts are publicly viewable" ON public.leo_alerts;
DROP POLICY IF EXISTS "Authenticated users can create LEO alerts" ON public.leo_alerts;
DROP POLICY IF EXISTS "Owner can update within 24h" ON public.leo_alerts;
DROP POLICY IF EXISTS "Owner can delete within 24h" ON public.leo_alerts;

CREATE POLICY "Admin full access on leo_alerts"
  ON public.leo_alerts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view LEO alerts"
  ON public.leo_alerts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create LEO alerts"
  ON public.leo_alerts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owner can update LEO alert within 24h"
  ON public.leo_alerts FOR UPDATE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete LEO alert within 24h"
  ON public.leo_alerts FOR DELETE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');

-- ─── Trail Alerts ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Trail alerts are publicly viewable" ON public.trail_alerts;
DROP POLICY IF EXISTS "Authenticated users can create trail alerts" ON public.trail_alerts;
DROP POLICY IF EXISTS "Owner can update within 24h" ON public.trail_alerts;
DROP POLICY IF EXISTS "Any user can resolve trail alerts" ON public.trail_alerts;
DROP POLICY IF EXISTS "Owner can delete within 24h" ON public.trail_alerts;

CREATE POLICY "Admin full access on trail_alerts"
  ON public.trail_alerts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view trail alerts"
  ON public.trail_alerts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create trail alerts"
  ON public.trail_alerts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owner can update trail alert within 24h"
  ON public.trail_alerts FOR UPDATE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Any authenticated user can resolve trail alert"
  ON public.trail_alerts FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owner can delete trail alert within 24h"
  ON public.trail_alerts FOR DELETE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');

-- ─── Citations ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Citations are publicly viewable" ON public.citations;
DROP POLICY IF EXISTS "Authenticated users can create citations" ON public.citations;
DROP POLICY IF EXISTS "Owner can update within 24h" ON public.citations;
DROP POLICY IF EXISTS "Owner can delete within 24h" ON public.citations;

CREATE POLICY "Admin full access on citations"
  ON public.citations FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view citations"
  ON public.citations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create citations"
  ON public.citations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owner can update citation within 24h"
  ON public.citations FOR UPDATE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete citation within 24h"
  ON public.citations FOR DELETE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');

-- ─── Comments ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Comments are publicly viewable" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Owner can delete own comments" ON public.comments;

CREATE POLICY "Admin full access on comments"
  ON public.comments FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owner can delete own comment"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Alert Follows ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own follows" ON public.alert_follows;

CREATE POLICY "Admin full access on alert_follows"
  ON public.alert_follows FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users manage own follows"
  ON public.alert_follows FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Lost & Found ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Lost & Found is publicly viewable" ON public.lost_found;
DROP POLICY IF EXISTS "Authenticated users can create L&F posts" ON public.lost_found;
DROP POLICY IF EXISTS "Owner can update own L&F" ON public.lost_found;
DROP POLICY IF EXISTS "Any user can resolve L&F" ON public.lost_found;
DROP POLICY IF EXISTS "Owner can delete own L&F" ON public.lost_found;

CREATE POLICY "Admin full access on lost_found"
  ON public.lost_found FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view lost & found"
  ON public.lost_found FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create L&F posts"
  ON public.lost_found FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owner can update and resolve own L&F post"
  ON public.lost_found FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own L&F post"
  ON public.lost_found FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Direct Messages ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own DMs" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send DMs" ON public.direct_messages;

CREATE POLICY "Admin full access on direct_messages"
  ON public.direct_messages FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own DMs"
  ON public.direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send DMs"
  ON public.direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ─── MHAZ Queue ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage MHAZ queue" ON public.mhaz_queue;

CREATE POLICY "Admin full access on mhaz_queue"
  ON public.mhaz_queue FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ─── Message Board ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Message board publicly viewable" ON public.message_board_posts;
DROP POLICY IF EXISTS "Authenticated users can post to board" ON public.message_board_posts;

CREATE POLICY "Admin full access on message_board"
  ON public.message_board_posts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view message board"
  ON public.message_board_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can post to board"
  ON public.message_board_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ─── Planned Rides ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Planned rides publicly viewable" ON public.planned_rides;
DROP POLICY IF EXISTS "Authenticated users can create rides" ON public.planned_rides;

CREATE POLICY "Admin full access on planned_rides"
  ON public.planned_rides FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view planned rides"
  ON public.planned_rides FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create rides"
  ON public.planned_rides FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
