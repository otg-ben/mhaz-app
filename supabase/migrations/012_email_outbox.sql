-- 012: audit trail for outbound alert email
-- Every send attempt is recorded so failures are visible rather than silent —
-- alert creation deliberately never fails because of email.

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type       text NOT NULL,
  alert_id         uuid NOT NULL,
  recipient        text NOT NULL,
  subject          text NOT NULL,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error            text,
  gmail_message_id text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  sent_at          timestamptz
);

CREATE INDEX IF NOT EXISTS idx_outbox_alert ON public.email_outbox (alert_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status ON public.email_outbox (status, created_at DESC);

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

-- Written by the service role only; admins can read the log
CREATE POLICY "Admin full access on email_outbox"
  ON public.email_outbox FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
