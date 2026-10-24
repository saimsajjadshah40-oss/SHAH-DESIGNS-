# SHAH DESIGNS — Portfolio Website + Admin Dashboard

A premium, motion-rich portfolio for **SHAH DESIGNS** with a full-screen **5-slide swipe experience**, portfolio galleries, WhatsApp inquiries and a secure **admin dashboard** (Supabase) to manage everything without touching code.

It is a **static website** (HTML + CSS + JavaScript modules). There is **no build step** to run and **no npm packages** to install, so Vercel (or Netlify) serves it straight from GitHub.

---

## What's included

**Public website**
- **Hero** with animated headline, 3D-style composition (portrait card, tilted phone, ribbons and floating icons), mouse parallax and a working **"Swipe to Explore" control**. You can drag it or click it.
- **Swipe experience** with 5 service slides: Logo & Banner, Thumbnails, Web Development, CV & Resume, and All Graphic Design.
  - Works with touch swipe, mouse drag, the ← → keys, arrow buttons, progress dots and a "jump to service" menu.
  - Shows a `01 / 05` counter and has a Back button.
  - Slides can loop if you turn that on.
  - Each slide has its own interactive mockups: hover zoom, a before/after slider, a desktop/mobile toggle, CV page-flip and a mini category carousel.
- **Pages:** Home, About, Services, Service detail (`/services/<slug>`), Portfolio (animated filters and search), Project detail (`/portfolio/<slug>`), Motion Graphics, Contact and a custom 404 page.
- **WhatsApp:**
  - A floating button with a tooltip and a popup widget.
  - A mini inquiry form that builds a formatted message.
  - Pre-filled messages for each service, using the official `https://wa.me/923228037525?text=…` format.
  - The visitor always confirms and presses send in WhatsApp; nothing is sent automatically.
- **Contact form** with validation, spam protection (hidden honeypot field, minimum fill time and a one-minute throttle), and clear success and error messages. Submissions are saved to your Supabase database and appear in the admin **Messages** page.
- **Extras:** loading screen, scroll progress bar, custom cursor (desktop only), magnetic buttons, reveal animations, `prefers-reduced-motion` support, SEO meta tags, Open Graph image, `sitemap.xml`, `robots.txt` and JSON-LD structured data.

**Admin dashboard** (`/admin/login`, then `/admin/dashboard`)
- **Dashboard:** real database counts and the latest messages. There are no fake analytics.
- **Swipe Experience Manager:** edit every slide's
  - title, highlighted words, description and services list
  - buttons, button links and WhatsApp message
  - 3D preset or your own image
  - gradient colours and animation preset
  - order, visibility and connected portfolio category

  A **live preview** lets you check changes before publishing.
- **Portfolio Projects:**
  - Upload a cover, a gallery (drag to reorder) and a video (MP4/WebM upload or a YouTube/Vimeo link).
  - Set the category and mark projects as featured.
  - Add the client, date, tools, objectives, process, outcome and an external link.
  - Edit the slug, reorder projects, and publish or unpublish them.
- **Services:** add, edit, reorder, hide or delete services, with optional prices and a WhatsApp message for each.
- **Testimonials:** genuine reviews only. The section stays hidden until you publish one.
- **Messages:**
  - Mark messages read or unread.
  - Set a status: new, in progress, completed or archived.
  - Add internal notes.
  - Reply on WhatsApp or by email, delete messages, or export them as CSV.
- **WhatsApp settings:** number, default message, floating button on/off, widget texts, and every service-specific message in one place.
- **Media Library:**
  - Drag-and-drop upload with categories and previews.
  - Replace a file while keeping the same URL.
  - Copy a file's URL.
  - Find and delete unused files.
- **Site Content & Profile:** hero text, portrait, about text, profile photo, CV (PDF), tools, skills, process steps, call-to-action and footer.
- **Appearance customizer** with a **live preview**:
  - Colours and background presets, light or dark theme.
  - Font presets, heading size and button shape.
  - Corner radius, shadows, navigation style and hero layout.
  - Animation intensity and speed, and section spacing.
  - Home section order and visibility.
  - You can save a draft or publish.
- **SEO:** page titles and descriptions, sharing image, favicon and keywords.
- **Account & Security:** name, avatar, email and password changes, sign-out of other devices and password reset by email.

---

## Folder structure

```text
shah-designs/
├── index.html  about.html  services.html  service.html
├── portfolio.html  project.html  motion-graphics.html  contact.html  404.html
├── admin/                 login.html · reset.html · index.html (dashboard)
├── assets/
│   ├── css/               site.css · admin.css
│   ├── js/
│   │   ├── config.js      ← Supabase project URL + anon key (public values)
│   │   ├── defaults.js    built-in default content (used until you edit in admin)
│   │   ├── api.js         Supabase client (auth, database, storage)
│   │   ├── site.js        layout, theming, motion system, WhatsApp widget
│   │   ├── swipe.js       hero + 5-slide swipe experience
│   │   ├── pages.js       page renderers
│   │   ├── admin.js       admin dashboard
│   │   └── admin-auth.js  login / password reset
│   └── img/               favicon, og image, sample concept artwork
├── supabase/
│   └── schema.sql         tables, security rules, storage bucket, admin role (run once)
├── scripts/
│   ├── sitemap.mjs        regenerates sitemap.xml for your domain
│   └── dev-server.mjs     local preview server
├── vercel.json            Vercel routes + security headers
├── netlify.toml           same for Netlify (optional)
├── robots.txt  sitemap.xml  package.json  .gitignore
```

---

## Step 1 — Put the files on GitHub

**Option A — no tools needed**
1. Sign in at [github.com](https://github.com) and click **New repository**. Name it `shah-designs`, choose **Public** or **Private**, and click **Create repository**.
2. On the new repository page, click **uploading an existing file**.
3. Unzip `shah-designs.zip` on your computer. Open the `shah-designs` folder and drag **everything inside it** into the GitHub upload area. Include the `admin`, `assets` and `scripts` folders.
4. Click **Commit changes**.

> Hidden files such as `.gitignore` may not show in your file explorer. Turn on "show hidden files" to upload them too. The site works without it, but it keeps junk files out of GitHub.

**Option B — with Git**
```bash
cd shah-designs
git init
git add .
git commit -m "SHAH DESIGNS website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/shah-designs.git
git push -u origin main
```

---

## Step 2 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com), sign in with GitHub, then click **Add New… → Project** and **Import** the `shah-designs` repository.
2. Settings on the import screen:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./` (leave as is)
   - **Build Command / Output Directory / Install Command:** leave empty (don't override)
   - **Environment variables:** none needed — the Supabase URL and anon key are already in `assets/js/config.js`.
3. Click **Deploy**. In about a minute your site is live at `https://shah-designs.vercel.app` (or similar).
4. Every push to GitHub redeploys automatically. `vercel.json` sets up the page routes (`/portfolio/<slug>`, `/services/<slug>`, `/admin/dashboard`) and security headers.

**Custom domain on Vercel:** open the project → **Settings → Domains → Add**, type `yourdomain.com`, and add the DNS records Vercel shows you at your registrar (usually an `A` record for `@` and a `CNAME` for `www`). HTTPS is automatic.

> Prefer Netlify? `netlify.toml` is included too — import the repo in Netlify with an empty build command and publish directory `.`.

---

## Step 3 — Connect your own domain (if you use Netlify — Vercel users see Step 2)

If you don't own a domain yet, buy one from any registrar (Namecheap, GoDaddy, Cloudflare, PKNIC for `.pk`, …) or directly in Netlify.

1. In Netlify, open your site and go to **Domain management → Add a domain**. Enter `yourdomain.com` and confirm.
2. Choose **one** of these options:
   - **Netlify DNS (easiest).** Click **Set up Netlify DNS**. Netlify shows 4 nameservers such as `dns1.p01.nsone.net`. Log in to your registrar and replace the domain's nameservers with those 4.
   - **Keep your registrar's DNS.** Add these records at your registrar:

     | Type | Host / Name | Value |
     |---|---|---|
     | `A` (or ALIAS/ANAME if offered) | `@` | `75.2.60.5` (ALIAS value: `apex-loadbalancer.netlify.com`) |
     | `CNAME` | `www` | `your-site-name.netlify.app` |
3. Wait for DNS to update. This can take a few minutes, or up to 24 hours.
4. Netlify then issues a free **HTTPS certificate** automatically. You can check under **Domain management → HTTPS**.
5. Update your sitemap for the new domain (see "Sitemap" below).

---

## Step 4 — Connect Supabase (database, storage and admin login)

Your Supabase project URL and anon key are **already filled in** `assets/js/config.js`. Both are public by design — every Supabase website ships them to the browser. What keeps your data safe is the security rules created in step 4.2. Never put the `service_role` key or any password in the code.

Open your project at [supabase.com/dashboard](https://supabase.com/dashboard) (project `laqolmdwnjgcsmjpdrdc`).

### 4.1 Create your admin user
1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter `saimsajjadshah40@gmail.com` and your private password (12+ characters).
3. Tick **Auto Confirm User**, then click **Create user**.

### 4.2 Create the database
1. Go to **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this project, copy all of it, paste it in, and click **Run**.
3. The result at the bottom should show one row: your email with `is admin`. If the result is empty, you skipped 4.1. Create the user, then run the file again (it is safe to re-run).

This creates the tables, the Row Level Security rules, the `media` storage bucket (images, MP4/WebM, PDF, max 50 MB) and marks your account as the administrator.

### 4.3 Allow the password-reset link
Go to **Authentication → URL Configuration**:
- **Site URL:** `https://yourdomain.com`
- **Redirect URLs:** add `https://yourdomain.com/admin/reset`, `https://your-project.vercel.app/admin/reset` and `http://localhost:3000/admin/reset`

### 4.4 Turn off public sign-ups (recommended)
Go to **Authentication → Sign In / Providers → Email** and switch off **Allow new users to sign up**. Even with sign-ups on, other accounts cannot change anything — only accounts in the `admins` table can — but switching it off keeps your user list clean.

### 4.5 Sign in and load the starter content
1. Open `https://yourdomain.com/admin/login` and sign in.
2. Go to **Swipe Experience** and click **Import the 5 default slides**.
3. Go to **Services** and click **Import the default services**.
4. Work through the **Setup checklist** on the dashboard.

> Forgot your password? Use **Forgot password?** on `/admin/login`. You can also set a new one in Supabase → Authentication → Users → your user → **Send password recovery**.

---

## How security works

- **Every protected operation is enforced by Supabase on the server** with Postgres Row Level Security. Hiding a button in the browser is not what keeps content safe.
  - Website content (slides, projects, services, testimonials, settings, media) can only be created, changed or deleted by users listed in the **`admins`** table. Only your account is in it.
  - Unpublished items are invisible to visitors, even through the API.
  - Contact messages can be **sent** by anyone (only as a new, unread message) but **read** only by the admin.
  - The storage bucket only accepts images, MP4/WebM videos and PDFs up to 50 MB, and only the admin can upload, replace or delete files.
- Database rules also limit text lengths and check email formats, so oversized or malformed submissions are rejected.
- Passwords and the `service_role` key **never** appear in the website code, GitHub or Netlify.
- Sign out from **Account & Security** at any time, on this device or all others.
- `netlify.toml` adds security headers (CSP, HSTS, X-Frame-Options and more) and keeps `/admin` out of search engines.

---

## Everyday use

| I want to… | Go to |
|---|---|
| Change a swipe slide | Admin → **Swipe Experience** → edit → **Preview** → **Publish** |
| Add a portfolio project | Admin → **Portfolio Projects** → **New project** |
| Change colours/fonts | Admin → **Appearance** (live preview) → **Publish** |
| Change WhatsApp number/messages | Admin → **WhatsApp** |
| Update hero text, About, photo, CV | Admin → **Site Content & Profile** |
| Read client inquiries | Admin → **Messages** |

- **Drafts:** "Save draft" keeps the change private, and "Publish" makes it live.
- **When changes appear:** visitors see published changes on their next visit. A browser tab that is already open can keep the old version for up to 5 minutes.
- **Sample projects:** the portfolio shows labelled *Sample concept* projects until you publish your first real project. After that, only your own projects are shown.

### Sitemap
After connecting your domain (and whenever you add projects), regenerate the sitemap, then commit and push:
```bash
npm run sitemap -- https://yourdomain.com
```

### Preview locally (optional)
```bash
npm run dev        # http://localhost:3000
```

---

## Content rules built in

- No invented clients, awards, years of experience, statistics or testimonials.
- Sample projects are clearly labelled "Sample concept — not a client project".
- The testimonials section only appears once you publish a real one.
- CV services never promise interviews, jobs or ATS approval.

---

## Troubleshooting

- **"Database table not found"** in the dashboard: run `supabase/schema.sql` in the SQL Editor (Step 4.2).
- **"This account is not an administrator"**: the user didn't exist when you ran the SQL. Run the file again after creating the user.
- **"This email is not confirmed yet"**: in Authentication → Users, confirm the user (or recreate it with **Auto Confirm User** ticked).
- **Password reset email doesn't arrive**: check spam. Supabase's built-in email service only sends a few emails per hour; for more, add your own SMTP under Authentication → Emails. The link must point to a URL listed in Step 4.3.
- **Upload fails**: allowed types are JPG, PNG, WebP, GIF, AVIF, MP4, WebM and PDF, up to 50 MB each (images and PDFs up to 15 MB in the dashboard).
- **The site suddenly shows only default content**: free Supabase projects pause after a period of inactivity. Open the Supabase dashboard and click **Restore project**.

---

## Technical notes

- **Why a static site rather than Next.js?** It deploys on Netlify with zero build configuration, has no dependency versions to maintain, and loads fast. All dynamic content comes from Supabase at runtime.
- **Supabase access** uses its standard REST APIs (Auth, PostgREST and Storage) directly with `fetch`, so no SDK needs to be bundled.
- **Animations** use CSS transforms and the Web Animations API (GPU-friendly). They reduce automatically on touch devices and respect `prefers-reduced-motion`. The admin **Animation intensity** setting can turn them off entirely.
- **Data model:**

  | Table | What it stores |
  |---|---|
  | `settings` | design, whatsapp, content, social and seo rows, each with a published and a draft version |
  | `slides`, `projects`, `services`, `testimonials` | ordering/publishing columns (sort_order, published, slug, category, featured) plus the rest of the item as JSON |
  | `messages` | contact form submissions |
  | `media` | library index for the `media` storage bucket |
  | `admins` | which user accounts may manage the website |
