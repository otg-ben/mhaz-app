CREATE TABLE public.mhaz_emails (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gmail_message_id  text UNIQUE NOT NULL,
  subject           text NOT NULL,
  sender_name       text NOT NULL DEFAULT '',
  sender_email      text NOT NULL DEFAULT '',
  body              text NOT NULL DEFAULT '',
  received_at       timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mhaz_emails_received ON public.mhaz_emails (received_at DESC);

ALTER TABLE public.mhaz_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mhaz emails"
  ON public.mhaz_emails FOR SELECT
  USING (auth.uid() IS NOT NULL);
