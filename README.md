# SAIM DESIGNER

Premium dark / electric-blue portfolio for **Saim Sajjad — Graphic Designer**, with a private, secure admin dashboard for managing every project, image and piece of text on the site.

- **Public site:** cinematic hero with portrait, rotating titles and ambient blue glow · About Me · Logo, Banner and YouTube Thumbnail galleries with fullscreen previews · WhatsApp contact form · floating WhatsApp button · SEO.
- **Admin (`/admin/login` → `/admin/dashboard`):** real database stats · add / edit / delete projects · drag-and-drop multi-image uploads with progress · reorder, feature, publish/unpublish · edit all website text, portrait, SEO and share image · contact & social settings · password change.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Motion for React · Lucide · Supabase (Auth, Postgres with RLS, Storage) · Zod.

---

## 1. Project structure

```text
saim-designer/
├── app/
│   ├── page.tsx                 # public homepage (ISR, revalidates on admin save)
│   ├── layout.tsx               # fonts, global SEO metadata
│   ├── sitemap.ts / robots.ts
│   ├── api/media/[...path]/     # serves images from the PRIVATE bucket, published-only
│   └── admin/
│       ├── login/               # sign-in page + rate-limited server action
│       ├── logout/              # sign-out route
│       └── dashboard/           # protected pages + server actions
│           ├── projects/        # list, new, [id] edit, actions.ts
│           ├── content/         # website content editor
│           ├── settings/        # profile, contact, social
│           └── settings-actions.ts
├── components/
│   ├── layout/ home/ portfolio/ contact/ animations/ ui/   # public UI
│   └── admin/                                             # dashboard UI
├── lib/
│   ├── supabase/   # browser, server, public (cookie-less) and middleware clients
│   ├── auth/       # requireAdminPage / requireAdminAction
│   ├── content/    # data loading + defaults
│   ├── validation/ # Zod schemas (shared by client + server)
│   ├── upload/     # browser upload with progress
│   └── utils/      # WhatsApp helpers, misc
├── supabase/migrations/20261021000000_init.sql
├── middleware.ts
├── public/         # placeholder portrait, icon, default share image
└── .env.example
```

---

## 2. Set up Supabase (one time, ~10 minutes)

### 2.1 Create the project
1. Go to <https://supabase.com> → **New project**. Pick a region close to Pakistan (e.g. Mumbai / Singapore).
2. Save the database password somewhere safe (you won't need it in this app).

### 2.2 Run the database migration
1. Supabase → **SQL Editor** → **New query**.
2. Paste the whole of `supabase/migrations/20261021000000_init.sql` and click **Run**.

This creates every table, constraint, index and Row Level Security policy, the private `portfolio` storage bucket with its policies (JPG/PNG/WebP only, 10 MB max), the login rate limiter, and seeds your real content (name, about text, skills, WhatsApp number). No fake projects or clients are added.

> Using the Supabase CLI instead? `supabase link --project-ref <ref>` then `supabase db push`.

### 2.3 Lock down sign-ups
Supabase → **Authentication → Sign In / Providers**:
- **Email** provider: enabled.
- **Allow new users to sign up:** **OFF**. (There is no registration page in the app, and turning this off also blocks sign-ups via the API.)
- Optional but recommended: enable **Leaked password protection** and set **Minimum password length** to 12.

Authentication → **URL Configuration**:
- **Site URL:** your production URL, e.g. `https://saimdesigner.com` (use `http://localhost:3000` while developing).

### 2.4 Create the administrator account securely
The password is never stored in this repository — you type it directly into Supabase.

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Email: `saimsajjadshah40@gmail.com` · Password: *your chosen strong password* · tick **Auto Confirm User**.
3. Grant admin rights — SQL Editor → run:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'saimsajjadshah40@gmail.com'
on conflict do nothing;
```

That's the only way to become an admin. The `admin_users` table has no insert/update/delete policies, so nobody — not even a signed-in user — can grant themselves access through the API.

### 2.5 Copy the API keys
Supabase → **Project Settings → API**: copy the **Project URL** and the **anon / publishable** key.
**Do not** copy the `service_role` key anywhere — this project doesn't need it.

---

## 3. Run locally

Requires Node.js 18.18+ (20 or 22 recommended).

```bash
cp .env.example .env.local      # then fill in the values
npm install
npm run dev                     # http://localhost:3000
```

`.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RATE_LIMIT_SALT=<output of: openssl rand -hex 32>
```

Sign in at <http://localhost:3000/admin/login>.

Quality checks: `npm run typecheck`, `npm run lint`, `npm run build`.

> Without Supabase variables the public site still renders with the built-in default text (empty galleries), and `/admin` shows a configuration notice.

---

## 4. Publish to GitHub

```bash
git init
git add .
git commit -m "SAIM DESIGNER portfolio"
git branch -M main
git remote add origin https://github.com/<your-username>/saim-designer.git
git push -u origin main
```

`.gitignore` already excludes `.env*.local`, so your keys never get committed. Before pushing, run `git status` and confirm no `.env` file is listed.

---

## 5. Deploy on Vercel

1. <https://vercel.com> → **Add New → Project** → import the GitHub repo. Framework preset: **Next.js** (auto-detected).
2. **Environment Variables** (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your final URL, e.g. `https://saimdesigner.com`
   - `RATE_LIMIT_SALT` → a new random value
3. Click **Deploy**.
4. Back in Supabase → Authentication → URL Configuration, set **Site URL** to the Vercel/production URL.

Every `git push` to `main` redeploys automatically.

## 6. Connect a custom domain

1. Buy a domain (e.g. `saimdesigner.com`) from any registrar.
2. Vercel → Project → **Settings → Domains → Add** → enter the domain.
3. At your registrar, add the DNS records Vercel shows (usually an **A record** `@ → 76.76.21.21` and a **CNAME** `www → cname.vercel-dns.com`).
4. Wait for the certificate (minutes to a few hours). HTTPS is automatic.
5. Update `NEXT_PUBLIC_SITE_URL` in Vercel and the **Site URL** in Supabase to the new domain, then redeploy.

---

## 7. Using the dashboard

| Task | Where |
|---|---|
| Add a project | **Portfolio Projects → Add new project**: title, category, description, client (optional), cover + extra images, featured, publish toggle, order → **Create project** |
| Edit / replace / remove images | Open a project → replace or remove the cover, add more images, reorder with ↑ ↓, edit alt text → **Save changes** |
| Publish / unpublish, feature, reorder | Project list → eye, star and arrow buttons |
| Delete | Trash button → confirm (deletes the project and its files permanently) |
| Hero text, portrait, About, skills, section texts, SEO, share image, footer | **Website Content** |
| WhatsApp number, contact texts | **Contact Settings** |
| Instagram / Facebook / Behance / Dribbble / LinkedIn / YouTube | **Social Media Links** — icons only appear when a link is added and set visible |
| Display name, password, logout | **Profile Settings** |

Changes go live immediately (the homepage is regenerated on every save, and otherwise at most every 60 s).

**Portrait tip:** for the cut-out hero look, upload a **PNG or WebP with a transparent background**, at least ~1200 px tall, subject centred, cropped at the chest. The bottom fades into the background automatically.

**Banner filters:** set a banner's *Sub-category* to one of the banner categories (editable under Website Content). Filter buttons appear only for categories that have published banners.

---

## 8. How security works

- **Authentication:** Supabase Auth (email + password). Sessions are HTTP cookies refreshed by `middleware.ts`; the JWT is re-validated with `getUser()` on every protected request.
- **Authorisation, three layers:**
  1. `middleware.ts` redirects signed-out visitors away from `/admin/dashboard`.
  2. Every dashboard page calls `requireAdminPage()` and every Server Action calls `requireAdminAction()`, which check the `admin_users` table via `public.is_admin()`. Signed-in non-admins are signed out and denied.
  3. **Row Level Security** on every table and on Storage: only `is_admin()` can write anything. This holds even if someone calls the Supabase API directly with the public anon key.
- **Private media:** the storage bucket is private. Images are served through `/api/media/...`, which reads them as an anonymous visitor — so RLS only lets out site assets and images of **published** projects. Drafts are visible only to the signed-in admin, and those responses are never cached.
- **Uploads:** JPG/JPEG/PNG/WebP only, max 10 MB — checked in the browser *and* enforced by the bucket configuration.
- **Login rate limiting:** 5 attempts per 15 minutes per IP and per IP+email, enforced in Postgres (salted SHA-256 keys).
- **Password change** requires the current password.
- **No secrets in code:** only the public anon key is used; no service-role key, no hard-coded passwords. Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy) are set in `next.config.ts`; `/admin` is `noindex`.
- **Contact form:** nothing is stored. The visitor reviews the generated message in WhatsApp and sends it themselves; the site shows "WhatsApp opened — pending confirmation", never a false "sent" message.

### Production security checklist
- [ ] Migration applied; every table shows **RLS enabled** (Supabase → Table Editor).
- [ ] **Allow new users to sign up** is OFF.
- [ ] Only your account is in `admin_users` (`select * from public.admin_users;`).
- [ ] Admin password is unique, 12+ characters, stored in a password manager.
- [ ] `service_role` key is **not** in Vercel, GitHub or `.env` files.
- [ ] `RATE_LIMIT_SALT` is set to a random value in Vercel.
- [ ] Supabase **Site URL** matches the production domain.
- [ ] Visiting `/admin/dashboard` in a private window redirects to the login page.
- [ ] A draft project's image URL returns 404 in a private window.
- [ ] Enable 2-step verification on your Supabase, Vercel, GitHub and domain registrar accounts.
- [ ] Optional: Supabase → Auth → enable CAPTCHA protection and leaked-password protection.

---

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| Login says "does not have access" | Run the `insert into public.admin_users …` SQL from step 2.4. |
| "Supabase is not configured" | Check the env variable names/values, then restart `npm run dev` or redeploy. |
| Upload fails with 403 | You're not in `admin_users`, or the storage policies weren't created — re-run the migration. |
| Upload fails "mime type not supported" | Only JPG, PNG and WebP are allowed. |
| New project not on the website | Make sure **Published** is on and it has a cover image. |
| Social icon not showing | The link must start with `https://` and **Visible** must be ticked. |
