-- 014: community discussion threads with emoji reactions

CREATE TABLE public.discussions (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  -- Optional so a one-line question doesn't need a title invented for it
  title          text,
  body           text NOT NULL,
  photos         text[] NOT NULL DEFAULT '{}',
  -- Bumped by replies so active threads float back up
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discussions_active ON public.discussions (last_active_at DESC);

CREATE TABLE public.discussion_replies (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id uuid NOT NULL REFERENCES public.discussions ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_replies_discussion ON public.discussion_replies (discussion_id, created_at);

-- Polymorphic so the same table serves threads and replies. One reaction per
-- emoji per user per target; tapping again removes the row.
CREATE TABLE public.reactions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES public.users ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('discussion', 'reply')),
  target_id   uuid NOT NULL,
  emoji       text NOT NULL CHECK (emoji IN ('👍', '🔥', '😂', '👀', '❤️')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, emoji)
);

CREATE INDEX idx_reactions_target ON public.reactions (target_type, target_id);

-- Keep threads ordered by real activity
CREATE OR REPLACE FUNCTION public.bump_discussion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.discussions
    SET last_active_at = now()
    WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reply_bump_discussion
  AFTER INSERT ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.bump_discussion();

ALTER TABLE public.discussions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on discussions" ON public.discussions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Approved users can view discussions" ON public.discussions
  FOR SELECT USING (public.is_approved());
CREATE POLICY "Approved users can post discussions" ON public.discussions
  FOR INSERT WITH CHECK (public.is_approved() AND auth.uid() = user_id);
CREATE POLICY "Owner can update own discussion" ON public.discussions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can delete own discussion" ON public.discussions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on replies" ON public.discussion_replies
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Approved users can view replies" ON public.discussion_replies
  FOR SELECT USING (public.is_approved());
CREATE POLICY "Approved users can reply" ON public.discussion_replies
  FOR INSERT WITH CHECK (public.is_approved() AND auth.uid() = user_id);
CREATE POLICY "Owner can delete own reply" ON public.discussion_replies
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admin full access on reactions" ON public.reactions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Approved users can view reactions" ON public.reactions
  FOR SELECT USING (public.is_approved());
CREATE POLICY "Users manage own reactions" ON public.reactions
  FOR ALL USING (public.is_approved() AND auth.uid() = user_id)
  WITH CHECK (public.is_approved() AND auth.uid() = user_id);
