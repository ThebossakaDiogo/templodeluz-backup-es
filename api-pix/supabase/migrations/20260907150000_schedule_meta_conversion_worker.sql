create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'process-meta-conversions';

select cron.schedule(
  'process-meta-conversions',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://opftmzegcvfyoinjfmcj.supabase.co/functions/v1/process-meta-conversions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZnRtemVnY3ZmeW9pbmpmbWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzgyMDksImV4cCI6MjEwMzg1NDIwOX0.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoib3BmdG16ZWdjdmZ5b2luamZtY2oiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4ODI3ODIwOSwiZXhwIjoyMTAzODU0MjA5fQ.VpQitxh7x5v_0k5q35hhMz3eAATUHGERubdmA_TnR24'
    ),
    body := '{"limit":100}'::jsonb,
    timeout_milliseconds := 20000
  );
  $cron$
);
