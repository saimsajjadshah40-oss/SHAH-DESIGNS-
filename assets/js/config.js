/* ------------------------------------------------------------------
   SHAH DESIGNS — public configuration (Supabase)
   ------------------------------------------------------------------
   The project URL and the anon key are PUBLIC by design: every
   Supabase web app ships them to the browser. Security comes from
   the Row Level Security policies in supabase/schema.sql.
   Never put the service_role key or any password in this file.
------------------------------------------------------------------- */
export const CONFIG = {
  supabaseUrl: 'https://laqolmdwnjgcsmjpdrdc.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhcW9sbWR3bmpnY3NtanBkcmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTk0MzksImV4cCI6MjEwODQzNTQzOX0.vHU9A3Q1dU6ddYpA2LIXoUP1ipS4WHNm-JaoNI-LOL4',

  // table names (see supabase/schema.sql)
  collections: {
    settings: 'settings',
    slides: 'slides',
    projects: 'projects',
    services: 'services',
    testimonials: 'testimonials',
    messages: 'messages',
    media: 'media',
  },
  bucketId: 'media',
};
