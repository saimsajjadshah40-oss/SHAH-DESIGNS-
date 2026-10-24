# SHAH DESIGNS — Portfolio Website + Admin Dashboard

A premium, motion-rich portfolio for **SHAH DESIGNS** with a full-screen **5-slide swipe experience**, portfolio galleries, WhatsApp inquiries and a secure **admin dashboard** (Appwrite) to manage everything without touching code.

It is a **static website** (HTML + CSS + JavaScript modules). There is **no build step** to run and **no npm packages** to install, so Netlify serves it straight from GitHub.

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
- **Contact form** with validation, spam protection (hidden honeypot field, minimum fill time and a one-minute throttle), and clear success and error messages. Submissions are saved to Appwrite. Before Appwrite is connected, they are saved to Netlify Forms instead.
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
- **Account & Security:** name, avatar, email and password changes, active sessions (with sign-out for other devices) and password reset by email.

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
│   │   ├── config.js      ← your Appwrite endpoint + project ID (public values)
│   │   ├── defaults.js    built-in default content (used until you edit in admin)
│   │   ├── api.js         Appwrite REST client (auth, database, storage)
│   │   ├── site.js        layout, theming, motion system, WhatsApp widget
│   │   ├── swipe.js       hero + 5-slide swipe experience
│   │   ├── pages.js       page renderers
│   │   ├── admin.js       admin dashboard
│   │   └── admin-auth.js  login / password reset
│   └── img/               favicon, og image, sample concept artwork
├── scripts/
│   ├── setup-appwrite.mjs creates database, storage, admin account (run once)
│   ├── sitemap.mjs        regenerates sitemap.xml for your domain
│   └── dev-server.mjs     local preview server
├── netlify.toml           routes + security headers
├── robots.txt  sitemap.xml  package.json  .env.example  .gitignore
```

---

## Step 1 — Put the files on GitHub

**Option A — no tools needed**
1. Sign in at [github.com](https://github.com) and click **New repository**. Name it `shah-designs`, choose **Public** or **Private**, and click **Create repository**.
2. On the new repository page, click **uploading an existing file**.
3. Unzip `shah-designs.zip` on your computer. Open the `shah-designs` folder and drag **everything inside it** into the GitHub upload area. Include the `admin`, `assets` and `scripts` folders.
4. Click **Commit changes**.

> Hidden files such as `.gitignore` and `.env.example` may not show in your file explorer. Turn on "show hidden files" to upload them too. The site works without them, but `.gitignore` protects your secrets.

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

## Step 2 — Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com) and choose **Add new site → Import an existing project → GitHub**, then pick `shah-designs`.
2. Build settings (`netlify.toml` already sets these):
   - **Build command:** leave empty
   - **Publish directory:** `.`
3. Click **Deploy**. In about a minute your site is live at `https://something.netlify.app`.
4. Every time you push to GitHub, Netlify redeploys automatically.

At this point the website already works, using the built-in default content. The admin dashboard needs Step 4.

---

## Step 3 — Connect your own domain

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

## Step 4 — Connect Appwrite (database, storage and admin login)

### 4.1 Create the Appwrite project
1. Create a free account at [cloud.appwrite.io](https://cloud.appwrite.io), then **Create project** and name it `SHAH DESIGNS`.
2. On the project's **Overview** page, note the **Project ID** and the **API endpoint** (for example `https://fra.cloud.appwrite.io/v1`).
3. **Add platform → Web app.** Add one platform for each hostname that will open the site:
   - `yourdomain.com`
   - `www.yourdomain.com`
   - `your-site-name.netlify.app`
   - `localhost` (for local testing)

   *If you skip this step, the browser blocks the requests with a CORS error.*

### 4.2 Put the public IDs in the code
Edit `assets/js/config.js` (you can do this directly on GitHub with the pencil icon):
```js
endpoint: 'https://fra.cloud.appwrite.io/v1',   // your endpoint
projectId: 'your-project-id',
```
Commit the change. These two values are **public by design**. Never put an API key or password in this file.

### 4.3 Run the one-time setup on your computer
This creates the database, collections, permissions, storage bucket and your admin account.

1. Install **Node.js 18 or newer** from [nodejs.org](https://nodejs.org).
2. In Appwrite, go to **Overview → API keys → Create API key**. Name it `setup` and grant all scopes, or at least:
   - `databases`, `collections`, `attributes`, `indexes` and `documents` (read + write)
   - `buckets` (read + write)
   - `users` and `teams` (read + write)
3. In the project folder, copy `.env.example` to a new file named `.env` and fill it in:
   ```ini
   APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
   APPWRITE_PROJECT_ID=your-project-id
   APPWRITE_API_KEY=the-key-you-just-created
   ADMIN_EMAIL=saimsajjadshah40@gmail.com
   ADMIN_PASSWORD=your-private-password-min-12-characters
   ```
4. Open a terminal in the project folder and run:
   ```bash
   npm run setup
   ```
   You should see green ✔ lines and **Setup complete**. Running it again is safe, because it skips anything that already exists.
5. **Clean up the secrets:**
   - Delete the `ADMIN_PASSWORD` line from `.env`, or the whole file.
   - In Appwrite, delete the `setup` API key.

   `.env` is in `.gitignore`, so it is never uploaded to GitHub.

> Forgot the password later? Use **Forgot password?** on `/admin/login`. You can also run `npm run setup -- --update-password` with a new `ADMIN_PASSWORD` in `.env`.

### 4.4 Sign in
Open `https://yourdomain.com/admin/login` and sign in with your admin email and password. Start with the **Setup checklist** on the dashboard.

---

## How security works

- **Every protected operation is enforced by Appwrite on the server.** Hiding a button in the browser is not what keeps content safe.
  - Website content (slides, projects, services, testimonials, settings, media) can only be created, changed or deleted by members of the **`admins` team**. Only your account is in that team.
  - Unpublished items have no public read permission, so visitors cannot load them even through the API.
  - Contact messages can be **created** by anyone but **read** only by admins.
  - The storage bucket only accepts images, MP4/WebM videos and PDFs up to 50 MB, and only admins can upload.
- There is **no public sign-up**. The admin account is created by the setup script only.
- Sessions use Appwrite's secure session cookie, with the same cookie fallback the official SDK uses. Sign out from **Account & Security** at any time, on this device or all others.
- Passwords and API keys **never** appear in the website code, GitHub or Netlify.
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

- **Admin login says "Network error"**, or the browser console shows **CORS**: add your exact hostname as a **Web platform** in Appwrite (Step 4.1).
- **"This account is not an administrator"**: run `npm run setup` again so your user is added to the `admins` team.
- **Dashboard shows "Collection could not be found"**: the setup script hasn't run against this project. Check that `APPWRITE_PROJECT_ID` matches `config.js`.
- **Password reset email doesn't arrive**: check spam. The reset link opens `/admin/reset`, so your domain must be a registered Web platform.
- **Upload fails**: allowed types are JPG, PNG, WebP, GIF, AVIF, MP4, WebM and PDF, up to 50 MB each (images and PDFs up to 15 MB).
- **Contact form messages before Appwrite is set up**: these are stored in Netlify under **Forms**.

---

## Technical notes

- **Why a static site rather than Next.js?** It deploys on Netlify with zero build configuration, has no dependency versions to maintain, and loads fast. All dynamic content comes from Appwrite at runtime.
- **Animations** use CSS transforms and the Web Animations API (GPU-friendly). They reduce automatically on touch devices and respect `prefers-reduced-motion`. The admin **Animation intensity** setting can turn them off entirely.
- **Appwrite API:** the site uses Appwrite's Databases (collections/documents) REST API, which Appwrite keeps supported alongside its newer TablesDB API.
- **Data model:**

  | Collection | What it stores |
  |---|---|
  | `settings` | design, whatsapp, content, social and seo documents, each with a published and a draft version |
  | `slides`, `projects`, `services`, `testimonials` | indexed fields (order, published, slug, category, featured) plus the rest of the item as JSON |
  | `messages` | contact form submissions |
  | `media` | library index for the `media` storage bucket |
