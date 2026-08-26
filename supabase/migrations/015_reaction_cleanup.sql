-- 015: clean up reactions when their target disappears
-- reactions is polymorphic, so it has no foreign key and gets no ON DELETE
-- CASCADE. Deleting a thread or reply left its reaction rows behind.

CREATE OR REPLACE FUNCTION public.cleanup_reactions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.reactions
    WHERE target_type = TG_ARGV[0] AND target_id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_discussion_delete_cleanup_reactions
  AFTER DELETE ON public.discussions
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_reactions('discussion');

CREATE TRIGGER on_reply_delete_cleanup_reactions
  AFTER DELETE ON public.discussion_replies
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_reactions('reply');

-- Sweep anything already orphaned
DELETE FROM public.reactions r
  WHERE (r.target_type = 'discussion' AND NOT EXISTS (SELECT 1 FROM public.discussions d WHERE d.id = r.target_id))
     OR (r.target_type = 'reply'      AND NOT EXISTS (SELECT 1 FROM public.discussion_replies p WHERE p.id = r.target_id));
