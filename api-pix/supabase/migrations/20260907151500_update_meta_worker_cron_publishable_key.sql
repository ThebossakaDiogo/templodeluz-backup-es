select cron.unschedule(jobid)
from cron.job
where jobname = 'process-meta-conversions';

select vault.create_secret(
  'https://opftmzegcvfyoinjfmcj.supabase.co',
  'meta_worker_project_url',
  'Project URL used by the Meta conversions retry worker'
);

select vault.create_secret(
  'sb_publishable_QUVM0xTRlp-_GU7T0M2IYA_p0IxKffU',
  'meta_worker_publishable_key',
  'Publishable key used only to authenticate the fixed outbox worker endpoint'
);

select cron.schedule(
  'process-meta-conversions',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'meta_worker_project_url')
      || '/functions/v1/process-meta-conversions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'meta_worker_publishable_key')
    ),
    body := '{"limit":100}'::jsonb,
    timeout_milliseconds := 20000
  );
  $cron$
);
