-- 009: mod/admin popup announcements, shown once per user

CREATE TABLE public.announcements (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  -- future starts_at = scheduled; it stays invisible until then
  starts_at  timestamptz NOT NULL DEFAULT now(),
  ends_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_window ON public.announcements (starts_at, ends_at);

CREATE TABLE public.announcement_dismissals (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id uuid NOT NULL REFERENCES public.announcements ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  dismissed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

ALTER TABLE public.announcements            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on announcements"
  ON public.announcements FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Scheduled announcements stay hidden until their start time
CREATE POLICY "Approved users can view live announcements"
  ON public.announcements FOR SELECT
  USING (public.is_approved() AND starts_at <= now());

-- Mods need to see their own scheduled posts before they go live
CREATE POLICY "Mods can view all announcements"
  ON public.announcements FOR SELECT
  USING (public.is_mod());

CREATE POLICY "Mods can create announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (public.is_mod() AND auth.uid() = user_id);

CREATE POLICY "Mods can update announcements"
  ON public.announcements FOR UPDATE
  USING (public.is_mod()) WITH CHECK (public.is_mod());

CREATE POLICY "Mods can delete announcements"
  ON public.announcements FOR DELETE
  USING (public.is_mod());

CREATE POLICY "Admin full access on dismissals"
  ON public.announcement_dismissals FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users manage own dismissals"
  ON public.announcement_dismissals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
