-- Add gmail_message_id to mhaz_queue for deduplication
ALTER TABLE public.mhaz_queue
  ADD COLUMN IF NOT EXISTS gmail_message_id text UNIQUE;
