-- 010: LEO advisories — mod-posted, longer-lived, always visible on the map
-- Lives inside leo_alerts rather than a new table: same shape, same pins,
-- just a longer fuse and a different icon.

ALTER TABLE public.leo_alerts
  ADD COLUMN IF NOT EXISTS is_advisory boolean NOT NULL DEFAULT false;

-- Only mods may create one; regular user reports keep the 24h expiry.
-- The API enforces this too, but RLS is the backstop.
DROP POLICY IF EXISTS "Authenticated users can create LEO alerts" ON public.leo_alerts;
CREATE POLICY "Approved users can create LEO alerts"
  ON public.leo_alerts FOR INSERT
  WITH CHECK (
    public.is_approved()
    AND auth.uid() = user_id
    AND (is_advisory = false OR public.is_mod())
  );

CREATE INDEX IF NOT EXISTS idx_leo_advisory
  ON public.leo_alerts (expires_at) WHERE is_advisory = true;
