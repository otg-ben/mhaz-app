-- 007: rides & events feed with RSVPs

-- planned_rides was a stub with no UI, no data, and the wrong shape
-- (no end time, image, host, or location text). Replaced by events.
DROP TABLE IF EXISTS public.planned_rides;

CREATE TABLE public.events (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  hosted_by     text,
  image_url     text,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz,
  location_text text,
  lat           numeric(10, 7),
  long          numeric(10, 7),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_starts ON public.events (starts_at);
CREATE INDEX idx_events_user   ON public.events (user_id);

CREATE TABLE public.event_rsvps (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id   uuid NOT NULL REFERENCES public.events ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  status     text NOT NULL CHECK (status IN ('going', 'not_going')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_rsvps_event ON public.event_rsvps (event_id);

ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Same shape as every other table: admin god-mode, approved users read,
-- owners write their own rows.
CREATE POLICY "Admin full access on events"
  ON public.events FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Approved users can view events"
  ON public.events FOR SELECT
  USING (public.is_approved());

CREATE POLICY "Approved users can create events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_approved() AND auth.uid() = user_id);

CREATE POLICY "Owner can update own event"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own event"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on event_rsvps"
  ON public.event_rsvps FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Everyone approved sees the full RSVP list (counts + who's going)
CREATE POLICY "Approved users can view rsvps"
  ON public.event_rsvps FOR SELECT
  USING (public.is_approved());

CREATE POLICY "Users manage own rsvp"
  ON public.event_rsvps FOR ALL
  USING (public.is_approved() AND auth.uid() = user_id)
  WITH CHECK (public.is_approved() AND auth.uid() = user_id);
