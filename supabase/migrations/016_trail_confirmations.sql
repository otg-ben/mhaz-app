-- 016: "still there" confirmations for trail issues
-- The feed filtered on created_at, treating report date as a proxy for
-- relevance. That works for a LEO sighting but not for trail damage, which
-- persists until cleared — a tree reported in August vanished from a 14-day
-- view in September even though it was still blocking the trail.

ALTER TABLE public.trail_alerts
  ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirm_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_trail_confirmed ON public.trail_alerts (last_confirmed_at DESC);

-- Who confirmed what, so a rider can't inflate the count by tapping twice
-- and the detail view can name them.
CREATE TABLE IF NOT EXISTS public.trail_confirmations (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id     uuid NOT NULL REFERENCES public.trail_alerts ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trail_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_confirmations_trail ON public.trail_confirmations (trail_id);

ALTER TABLE public.trail_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on trail_confirmations" ON public.trail_confirmations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Approved users can view confirmations" ON public.trail_confirmations
  FOR SELECT USING (public.is_approved());
CREATE POLICY "Users manage own confirmations" ON public.trail_confirmations
  FOR ALL USING (public.is_approved() AND auth.uid() = user_id)
  WITH CHECK (public.is_approved() AND auth.uid() = user_id);

-- Keep the denormalised fields on trail_alerts in step
CREATE OR REPLACE FUNCTION public.sync_trail_confirmation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE tid uuid := COALESCE(NEW.trail_id, OLD.trail_id);
BEGIN
  UPDATE public.trail_alerts t
    SET confirm_count = (SELECT count(*) FROM public.trail_confirmations c WHERE c.trail_id = tid),
        last_confirmed_at = (SELECT max(confirmed_at) FROM public.trail_confirmations c WHERE c.trail_id = tid)
    WHERE t.id = tid;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_confirmation_change
  AFTER INSERT OR DELETE ON public.trail_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.sync_trail_confirmation();
