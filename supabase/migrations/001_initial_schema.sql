-- MHAZ App — Initial Schema
-- Run this in Supabase SQL Editor (or via supabase db push)

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE alert_source AS ENUM ('user', 'mhaz');
CREATE TYPE trail_issue_status AS ENUM ('active', 'resolved');
CREATE TYPE trail_issue_type AS ENUM ('downed_tree', 'washout', 'closure', 'maintenance', 'hazard', 'other');
CREATE TYPE leo_agency AS ENUM (
  'Marin County Sheriff', 'MMWD', 'CA State Parks',
  'Marin Open Space & Parks (MCOSD)', 'National Park Service (NPS)',
  'California Highway Patrol (CHP)', 'Local PD', 'Other'
);
CREATE TYPE citation_infraction_type AS ENUM ('hiking_trail', 'unpermitted_trail', 'night_riding', 'ebike', 'other');
CREATE TYPE lost_found_type AS ENUM ('lost', 'found');
CREATE TYPE lost_found_status AS ENUM ('open', 'resolved');
CREATE TYPE mhaz_classification AS ENUM ('leo', 'trail_issue', 'citation', 'unclassified');
CREATE TYPE dm_status AS ENUM ('sent', 'read');
CREATE TYPE alert_type_enum AS ENUM ('leo', 'trail', 'citation', 'lost_found');

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  handle      text UNIQUE NOT NULL,
  email       text UNIQUE NOT NULL,
  bio         text,
  is_admin    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-create user profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, handle)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── LEO Alerts ──────────────────────────────────────────────────────────────
CREATE TABLE public.leo_alerts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  lat             numeric(10, 7) NOT NULL,
  long            numeric(10, 7) NOT NULL,
  agency          leo_agency NOT NULL,
  description     text NOT NULL DEFAULT '',
  source          alert_source NOT NULL DEFAULT 'user',
  mhaz_email_id   uuid,
  expires_at      timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leo_alerts_created ON public.leo_alerts (created_at DESC);
CREATE INDEX idx_leo_alerts_expires ON public.leo_alerts (expires_at);
CREATE INDEX idx_leo_alerts_user ON public.leo_alerts (user_id);

-- ─── Trail Alerts ─────────────────────────────────────────────────────────────
CREATE TABLE public.trail_alerts (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  lat               numeric(10, 7) NOT NULL,
  long              numeric(10, 7) NOT NULL,
  issue_type        trail_issue_type NOT NULL,
  description       text NOT NULL DEFAULT '',
  status            trail_issue_status NOT NULL DEFAULT 'active',
  photos            text[] NOT NULL DEFAULT '{}',
  source            alert_source NOT NULL DEFAULT 'user',
  mhaz_email_id     uuid,
  resolved_by       uuid REFERENCES public.users,
  resolved_at       timestamptz,
  resolution_notes  text,
  map_expires_at    timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trail_alerts_created ON public.trail_alerts (created_at DESC);
CREATE INDEX idx_trail_alerts_status ON public.trail_alerts (status);
CREATE INDEX idx_trail_alerts_user ON public.trail_alerts (user_id);

-- ─── Citations ────────────────────────────────────────────────────────────────
CREATE TABLE public.citations (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  lat                 numeric(10, 7) NOT NULL,
  long                numeric(10, 7) NOT NULL,
  agency              leo_agency NOT NULL,
  incident_date       timestamptz NOT NULL,
  infraction_type     citation_infraction_type NOT NULL DEFAULT 'other',
  description         text NOT NULL DEFAULT '',
  source              alert_source NOT NULL DEFAULT 'user',
  mhaz_email_id       uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_citations_created ON public.citations (created_at DESC);
CREATE INDEX idx_citations_user ON public.citations (user_id);

-- ─── Comments (polymorphic) ───────────────────────────────────────────────────
CREATE TABLE public.comments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  alert_type  text NOT NULL CHECK (alert_type IN ('leo', 'trail', 'citation', 'lost_found')),
  alert_id    uuid NOT NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_alert ON public.comments (alert_type, alert_id);
CREATE INDEX idx_comments_user ON public.comments (user_id);

-- ─── Alert Follows (polymorphic) ─────────────────────────────────────────────
CREATE TABLE public.alert_follows (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  alert_type  text NOT NULL CHECK (alert_type IN ('leo', 'trail', 'citation', 'lost_found')),
  alert_id    uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, alert_type, alert_id)
);

CREATE INDEX idx_follows_alert ON public.alert_follows (alert_type, alert_id);

-- ─── Lost & Found ─────────────────────────────────────────────────────────────
CREATE TABLE public.lost_found (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  type            lost_found_type NOT NULL,
  description     text NOT NULL,
  location_text   text,
  lat             numeric(10, 7),
  long            numeric(10, 7),
  photos          text[] NOT NULL DEFAULT '{}',
  status          lost_found_status NOT NULL DEFAULT 'open',
  resolved_by     uuid REFERENCES public.users,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lost_found_created ON public.lost_found (created_at DESC);
CREATE INDEX idx_lost_found_status ON public.lost_found (status);

-- ─── Direct Messages ─────────────────────────────────────────────────────────
CREATE TABLE public.direct_messages (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  recipient_id  uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  body          text NOT NULL,
  status        dm_status NOT NULL DEFAULT 'sent',
  created_at    timestamptz NOT NULL DEFAULT now(),
  read_at       timestamptz
);

CREATE INDEX idx_dm_recipient ON public.direct_messages (recipient_id, created_at DESC);
CREATE INDEX idx_dm_sender ON public.direct_messages (sender_id, created_at DESC);

-- ─── MHAZ Ingestion Queue ─────────────────────────────────────────────────────
CREATE TABLE public.mhaz_queue (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_email_body  text NOT NULL,
  subject         text NOT NULL,
  sender          text NOT NULL,
  received_at     timestamptz NOT NULL,
  classification  mhaz_classification NOT NULL DEFAULT 'unclassified',
  confidence      numeric(4, 3),
  reviewed_by     uuid REFERENCES public.users,
  reviewed_at     timestamptz,
  approved        boolean,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Message Board (stub) ─────────────────────────────────────────────────────
CREATE TABLE public.message_board_posts (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  title       text NOT NULL,
  body        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Planned Rides (stub) ─────────────────────────────────────────────────────
CREATE TABLE public.planned_rides (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  ride_date   timestamptz NOT NULL,
  lat         numeric(10, 7),
  long        numeric(10, 7),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Row Level Security ──────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mhaz_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_rides ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users are publicly viewable" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- LEO Alerts
CREATE POLICY "LEO alerts are publicly viewable" ON public.leo_alerts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create LEO alerts" ON public.leo_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can update within 24h" ON public.leo_alerts FOR UPDATE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');
CREATE POLICY "Owner can delete within 24h" ON public.leo_alerts FOR DELETE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');

-- Trail Alerts
CREATE POLICY "Trail alerts are publicly viewable" ON public.trail_alerts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create trail alerts" ON public.trail_alerts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can update within 24h" ON public.trail_alerts FOR UPDATE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');
CREATE POLICY "Any user can resolve trail alerts" ON public.trail_alerts FOR UPDATE
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can delete within 24h" ON public.trail_alerts FOR DELETE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');

-- Citations
CREATE POLICY "Citations are publicly viewable" ON public.citations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create citations" ON public.citations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can update within 24h" ON public.citations FOR UPDATE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');
CREATE POLICY "Owner can delete within 24h" ON public.citations FOR DELETE
  USING (auth.uid() = user_id AND created_at > now() - interval '24 hours');

-- Comments
CREATE POLICY "Comments are publicly viewable" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Alert follows
CREATE POLICY "Users manage own follows" ON public.alert_follows FOR ALL USING (auth.uid() = user_id);

-- Lost & Found
CREATE POLICY "Lost & Found is publicly viewable" ON public.lost_found FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create L&F posts" ON public.lost_found FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can update own L&F" ON public.lost_found FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Any user can resolve L&F" ON public.lost_found FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owner can delete own L&F" ON public.lost_found FOR DELETE USING (auth.uid() = user_id);

-- Direct Messages
CREATE POLICY "Users can view own DMs" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send DMs" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- MHAZ Queue (admin only — use service role key in admin routes)
CREATE POLICY "Admins can manage MHAZ queue" ON public.mhaz_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
  );

-- Message board (public read)
CREATE POLICY "Message board publicly viewable" ON public.message_board_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post to board" ON public.message_board_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Planned rides (public read)
CREATE POLICY "Planned rides publicly viewable" ON public.planned_rides FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rides" ON public.planned_rides FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── Updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leo_alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.trail_alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.citations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lost_found FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
