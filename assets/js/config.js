/* ------------------------------------------------------------------
   SHAH DESIGNS — public configuration
   ------------------------------------------------------------------
   These values are PUBLIC by design (Appwrite web apps always expose
   the endpoint and project ID). Never put an API key or password here.

   1. Create a project at https://cloud.appwrite.io
   2. Paste your endpoint + project ID below
   3. Run `npm run setup` (see README) to create the database
   Leave projectId empty and the site runs on built-in default content.
------------------------------------------------------------------- */
export const CONFIG = {
  endpoint: 'https://cloud.appwrite.io/v1', // e.g. https://fra.cloud.appwrite.io/v1
  projectId: '',                            // e.g. 66f1c2ab0012ab34cd56

  databaseId: 'shah',
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
  adminTeamId: 'admins',
};
