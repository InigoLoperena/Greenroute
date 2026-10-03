# Deployment

## Supabase

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --dry-run
supabase db push
supabase functions deploy send-invitation
```

Configure Edge Function secrets only in Supabase:

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set APP_URL=https://YOUR_PRODUCTION_DOMAIN
```

## Vercel

Import the repository as a Vite project.

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Set in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` in Vercel.

## Authentication URLs

In Supabase Authentication > URL Configuration, set your Vercel/custom production URL as Site URL and add preview URLs if needed.
