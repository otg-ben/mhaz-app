-- 013: scheduled inbound email sync (applied via the Supabase SQL editor)
-- Replace <CRON_SECRET> with the value from CRON_SECRET before running.

-- Secrets live here rather than inline in cron.job, whose command text is
-- visible to anything that can read the cron catalog.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_secrets (
  name  text primary key,
  value text not null
);
revoke all on private.app_secrets from public, anon, authenticated;

insert into private.app_secrets (name, value)
values ('cron_secret', '<CRON_SECRET>')
on conflict (name) do update set value = excluded.value;

select cron.unschedule('mhaz-sync-email')
where exists (select 1 from cron.job where jobname = 'mhaz-sync-email');

-- Fires every 5 minutes. The endpoint decides whether a tick actually runs:
-- every tick 6am-10pm Pacific, every 15 minutes overnight.
select cron.schedule(
  'mhaz-sync-email',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://mhaz-app.vercel.app/api/cron/sync-email',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select value from private.app_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 55000
  );
  $$
);
