-- 008: direct message policy fixes
-- 001 shipped direct_messages with SELECT and INSERT only, so marking a
-- message read updated zero rows without raising an error.

CREATE POLICY "Recipient can mark DMs read"
  ON public.direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Unapproved accounts could still send DMs — the insert policy only checked
-- that the sender matched, not that they'd been let into the app.
DROP POLICY IF EXISTS "Users can send DMs" ON public.direct_messages;
CREATE POLICY "Approved users can send DMs"
  ON public.direct_messages FOR INSERT
  WITH CHECK (public.is_approved() AND auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS idx_dm_unread
  ON public.direct_messages (recipient_id) WHERE status = 'sent';
