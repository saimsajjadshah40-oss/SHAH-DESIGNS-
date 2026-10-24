/* ------------------------------------------------------------------
   SHAH DESIGNS — page renderers (entry point for every public page)
------------------------------------------------------------------- */
import { boot, state, wa, openModal, buildInquiry, openWhatsApp, socialLinks } from './site.js';
import { initStage, initHomeSections, projectCard, toolCard } from './swipe.js';
import { esc, icon, splitWords, safeUrl, videoInfo, catLabel, $, $$ } from './ui.js';
import { isConfigured, db } from './api.js';
import { CONFIG } from './config.js';

const pageHero = (eyebrow, title, text, extra = '') => `
  <section class="page-hero"><div class="wrap">
    <div class="deco" aria-hidden="true"><span class="torus float"></span><span class="blob3d violet float" style="--d:-2s"></span></div>
    <span class="eyebrow reveal">${esc(eyebrow)}</span>
    <h1 class="split">${splitWords(title)}</h1>
    ${text ? `<p class="reveal">${esc(text)}</p>` : ''}${extra}
  </div></section>`;

const ctaBlock = () => {
  const c = state.data.content.cta;
  return `<section class="section"><div class="wrap"><div class="cta-box reveal"><span class="orb o1"></span><span class="orb o2"></span>
    <span class="eyebrow">Let's work together</span><h2>${esc(c.title)}</h2><p>${esc(c.text)}</p>
    <div class="acts"><a class="btn btn-wa btn-lg magnetic" href="${esc(wa())}" target="_blank" rel="noopener">${icon('whatsapp', 20)} ${esc(c.button)}</a></div>
  </div></div></section>`;
};

const slugFromPath = (prefix) => {
  const q = new URLSearchParams(location.search).get('slug');
  if (q) return q;
  const m = location.pathname.match(new RegExp(`^/${prefix}/([^/?#]+)`));
  return m ? decodeURIComponent(m[1]) : '';
};

function serviceCard(s, i) {
  return `<article class="svc-card">
    ${s.image ? `<div class="s-cover"><img src="${esc(s.image)}" alt="" loading="lazy"></div>` : ''}
    <span class="s-num">${String(i + 1).padStart(2, '0')}</span>
    <span class="s-ic">${icon(s.icon || 'sparkles', 26)}</span>
    <h3>${esc(s.name)}</h3><p>${esc(s.short)}</p>
    <ul>${(s.includes || []).slice(0, 5).map(x => `<li>${icon('check', 15)}${esc(x)}</li>`).join('')}</ul>
    <div class="s-foot">
      ${s.price ? `<span class="price">${esc(s.price)}</span>` : ''}
      <a class="btn btn-dark btn-sm" href="/services/${esc(s.slug)}">Details ${icon('arrowRight', 16, 'ic-arrow')}</a>
      <a class="btn btn-wa btn-sm" href="${esc(wa(s.waMessage))}" target="_blank" rel="noopener" aria-label="Ask about ${esc(s.name)} on WhatsApp">${icon('whatsapp', 16)} Ask</a>
    </div>
  </article>`;
}

/* ================= pages ================= */
const PAGES = {
  home() {
    initStage($('#stage'));
    initHomeSections($('#home-sections'));
  },

  about() {
    const { content, services } = state.data;
    const a = content.about;
    $('#main').innerHTML = pageHero('About', a.intro.length < 80 ? a.intro : `About *${a.name}*`, a.role) + `
    <section class="section" style="padding-top:20px"><div class="wrap about-grid">
      <div class="about-photo reveal-mask">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}">` : `<div class="ph"><div><div class="initials">SD</div><small>Profile photo — add it in Admin → Profile</small></div></div>`}</div>
      <div class="about-copy">
        <span class="eyebrow reveal">Who I am</span>
        <h2 class="split">${splitWords('Clear ideas, *crafted* visuals')}</h2>
        <p class="reveal">${esc(a.overview)}</p>
        <h3 class="reveal" style="margin:28px 0 10px">Design philosophy</h3>
        <p class="reveal">${esc(a.philosophy)}</p>
        ${a.location ? `<p class="reveal">${icon('globe', 16)} ${esc(a.location)}</p>` : ''}
        <div class="spec-list stagger">${a.specializations.map(s => `<span class="chip">${icon('sparkles', 14)}${esc(s)}</span>`).join('')}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap" class="reveal">
          ${safeUrl(a.resume) ? `<a class="btn btn-primary magnetic" href="${esc(safeUrl(a.resume))}" target="_blank" rel="noopener" download>${icon('download', 18)} Download CV</a>` : ''}
          <a class="btn btn-wa magnetic" href="${esc(wa())}" target="_blank" rel="noopener">${icon('whatsapp', 18)} Chat on WhatsApp</a>
        </div>
      </div>
    </div></section>
    <section class="section"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow reveal">Toolkit</span><h2 class="split">${splitWords('Tools & *software*')}</h2></div></div>
      <div class="tools stagger">${content.tools.filter(t => t.visible !== false).map(toolCard).join('')}</div>
      <div class="skills-row stagger">${content.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
    </div></section>
    <section class="section"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow reveal">Services</span><h2 class="split">${splitWords('What I *create*')}</h2></div><a class="btn btn-dark btn-sm" href="/services">All services ${icon('arrowRight', 16, 'ic-arrow')}</a></div>
      <div class="svc-grid stagger">${services.slice(0, 6).map(serviceCard).join('')}</div>
    </div></section>
    <section class="section"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow reveal">Process</span><h2 class="split">${splitWords('How we *work* together')}</h2></div></div>
      <div class="process stagger"><span class="line-fill"></span>${content.process.map((s, i) => `<div class="step"><div class="num">${String(i + 1).padStart(2, '0')}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
    </div></section>` + ctaBlock();
  },

  services() {
    const { services } = state.data;
    $('#main').innerHTML = pageHero('Services', 'Everything your brand *needs*', 'Logos, thumbnails, websites, CVs and every kind of graphic design — pick a service to see what’s included.',
      `<div class="reveal" style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary magnetic" href="/#explore">${icon('sparkles', 18)} Open the swipe experience</a><a class="btn btn-ghost" href="/portfolio">See portfolio</a></div>`) + `
    <section class="section" style="padding-top:10px"><div class="wrap"><div class="svc-grid stagger">${services.map(serviceCard).join('')}</div></div></section>` + ctaBlock();
  },

  service() {
    const { services, projects, categories } = state.data;
    const slug = slugFromPath('services');
    const s = services.find(x => x.slug === slug);
    if (!s) return notFound('This service could not be found.');
    document.title = `${s.name} — SHAH DESIGNS`;
    const rel = projects.filter(p => p.category === s.category).slice(0, 6);
    $('#main').innerHTML = pageHero('Service', s.name, s.short) + `
    <section class="section" style="padding-top:10px"><div class="wrap svc-detail">
      <div>
        ${s.image ? `<div class="proj-cover reveal-mask" style="margin-bottom:34px"><img src="${esc(s.image)}" alt="${esc(s.name)}"></div>` : ''}
        <p class="lead reveal">${esc(s.description)}</p>
        ${rel.length ? `<h3 class="reveal" style="margin:48px 0 20px">Related work</h3><div class="svc-grid stagger" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))">${rel.map(p => projectCard(p, categories)).join('')}</div>` : ''}
      </div>
      <aside class="panel reveal">
        <span class="s-ic" style="width:56px;height:56px;border-radius:16px;display:grid;place-items:center;color:#fff;background:linear-gradient(140deg,var(--primary),var(--secondary))">${icon(s.icon || 'sparkles', 24)}</span>
        <h3 style="margin-top:18px">What’s included</h3>
        <ul>${(s.includes || []).map(x => `<li>${icon('check', 16)}${esc(x)}</li>`).join('')}</ul>
        ${s.price ? `<p style="margin-bottom:18px"><span class="price">${esc(s.price)}</span></p>` : '<p class="muted" style="margin-bottom:18px;font-size:14px">Pricing depends on scope — message for a quote.</p>'}
        <a class="btn btn-wa" style="width:100%" href="${esc(wa(s.waMessage))}" target="_blank" rel="noopener">${icon('whatsapp', 18)} Order on WhatsApp</a>
        <a class="btn btn-ghost" style="width:100%;margin-top:10px" href="/portfolio?cat=${esc(s.category)}">View ${esc(catLabel(categories, s.category))}</a>
      </aside>
    </div></section>
    <section class="section" style="padding-top:0"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow reveal">More services</span></div></div>
      <div class="svc-grid stagger">${services.filter(x => x.slug !== s.slug).slice(0, 3).map(serviceCard).join('')}</div>
    </div></section>`;
  },

  portfolio() {
    const { projects, categories } = state.data;
    const params = new URLSearchParams(location.search);
    let cat = params.get('cat') || 'all';
    let q = params.get('q') || '';
    const counts = Object.fromEntries(categories.map(c => [c.key, projects.filter(p => p.category === c.key).length]));
    $('#main').innerHTML = pageHero('Portfolio', 'Work that *stands out*', projects.some(p => p.sample) ? 'Sample concepts are labelled — real client projects appear here as they are published.' : 'A selection of projects across branding, thumbnails, web, CVs and graphic design.') + `
    <section class="section" style="padding-top:10px"><div class="wrap">
      <div class="filters reveal" role="toolbar" aria-label="Filter projects">
        <button type="button" data-cat="all" aria-pressed="true">All Projects <span class="n">${projects.length}</span></button>
        ${categories.map(c => `<button type="button" data-cat="${esc(c.key)}" aria-pressed="false">${esc(c.label)} <span class="n">${counts[c.key] || 0}</span></button>`).join('')}
        <label class="search-box"><span class="sr-only">Search projects</span>${icon('search', 18)}<input type="search" id="pf-search" placeholder="Search projects…" value="${esc(q)}"></label>
      </div>
      <div class="masonry" id="pf-grid" aria-live="polite"></div>
    </div></section>` + ctaBlock();
    const grid = $('#pf-grid');
    const render = (animate = true) => {
      const ql = q.trim().toLowerCase();
      const list = projects.filter(p => (cat === 'all' || p.category === cat) &&
        (!ql || [p.title, p.description, p.client, ...(p.tools || [])].join(' ').toLowerCase().includes(ql)));
      $$('.filters [data-cat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === cat));
      const paint = () => {
        grid.innerHTML = list.length ? list.map(p => projectCard(p, categories)).join('') : `<div class="empty" style="column-span:all">No projects match yet. <a class="hl" href="/portfolio">Clear filters</a></div>`;
        $$('.pcard', grid).forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(30px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: i * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
      };
      const old = $$('.pcard', grid);
      if (animate && old.length && document.documentElement.dataset.motion !== '0') {
        Promise.all(old.map(c => c.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.94)' }], { duration: 220, fill: 'forwards' }).finished)).then(paint);
      } else paint();
      const u = new URL(location.href);
      cat === 'all' ? u.searchParams.delete('cat') : u.searchParams.set('cat', cat);
      q ? u.searchParams.set('q', q) : u.searchParams.delete('q');
      history.replaceState(null, '', u);
    };
    $$('.filters [data-cat]').forEach(b => b.addEventListener('click', () => { cat = b.dataset.cat; render(); }));
    let t; $('#pf-search').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { q = e.target.value; render(); }, 220); });
    render(false);
  },

  project() {
    const { projects, categories } = state.data;
    const slug = slugFromPath('portfolio');
    const p = projects.find(x => x.slug === slug);
    if (!p) return notFound('This project could not be found or is not published.');
    document.title = `${p.title} — SHAH DESIGNS`;
    const desc = document.querySelector('meta[name="description"]'); if (desc && p.description) desc.content = p.description;
    const gallery = (p.gallery || []).filter(Boolean);
    const v = videoInfo(p.video);
    const rel = projects.filter(x => x.category === p.category && x.slug !== p.slug).slice(0, 3);
    const meta = [['Category', catLabel(categories, p.category)], ['Client', p.client], ['Date', p.date], ['Tools', (p.tools || []).join(', ')]].filter(([, val]) => val);
    $('#main').innerHTML = `
    <section class="proj-hero"><div class="wrap">
      <a href="/portfolio" class="chip reveal">${icon('arrowLeft', 14)} Portfolio</a>
      ${p.sample ? `<span class="chip reveal" style="margin-left:6px;background:var(--navy);color:#fff">${icon('sparkles', 14)} Sample concept — not a client project</span>` : ''}
      <h1 class="split">${splitWords(p.title)}</h1>
      <p class="reveal muted" style="font-size:1.15rem;max-width:60ch">${esc(p.description)}</p>
      <div class="proj-meta stagger">${meta.map(([k, val]) => `<div><small>${k}</small><b>${esc(val)}</b></div>`).join('')}</div>
    </div></section>
    <section><div class="wrap">
      ${v ? `<div class="video-frame reveal" id="pvideo">${v.type === 'file'
        ? `<video src="${esc(v.src)}" controls playsinline preload="metadata" ${p.cover ? `poster="${esc(p.cover)}"` : ''}></video>`
        : `<div class="video-poster" role="button" tabindex="0" aria-label="Play video" style="background-image:url('${esc(p.cover || v.thumb)}')"><span class="pbtn">${icon('play', 32)}</span></div>`}</div>`
        : `<div class="proj-cover reveal-mask"><img src="${esc(p.cover)}" alt="${esc(p.title)}"></div>`}
    </div></section>
    <section class="section"><div class="wrap proj-body">
      <div class="sticky reveal">
        <h3>Project</h3><p class="muted" style="font-size:1.05rem">${esc(p.description)}</p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:26px">
          <a class="btn btn-wa" href="${esc(wa(`Hello SHAH DESIGNS, I saw "${p.title}" in your portfolio and would like something similar.`))}" target="_blank" rel="noopener">${icon('whatsapp', 18)} Ask about a similar project</a>
          ${safeUrl(p.link) ? `<a class="btn btn-ghost" href="${esc(safeUrl(p.link))}" target="_blank" rel="noopener">${icon('external', 18)} View live project</a>` : ''}
        </div>
      </div>
      <div>
        ${p.objectives ? `<div class="blk reveal"><h3>Objectives</h3><p>${esc(p.objectives)}</p></div>` : ''}
        ${p.process ? `<div class="blk reveal"><h3>Creative process</h3><p>${esc(p.process)}</p></div>` : ''}
        ${p.outcome ? `<div class="blk reveal"><h3>Outcome</h3><p>${esc(p.outcome)}</p></div>` : ''}
        <div class="gallery">${gallery.map((g, i) => `<button class="reveal" data-g="${i}" aria-label="Open image ${i + 1}"><img src="${esc(g)}" alt="${esc(p.title)} — image ${i + 1}" loading="lazy"></button>`).join('')}</div>
      </div>
    </div></section>
    ${rel.length ? `<section class="section" style="padding-top:0"><div class="wrap"><div class="sec-head"><div><span class="eyebrow reveal">Related projects</span></div></div><div class="svc-grid stagger">${rel.map(x => projectCard(x, categories)).join('')}</div></div></section>` : ''}`;
    const items = gallery.map((src, i) => ({ src, caption: `${p.title} — ${i + 1}/${gallery.length}` }));
    $$('[data-g]').forEach(b => b.addEventListener('click', () => openModal(items, +b.dataset.g)));
    const poster = $('#pvideo .video-poster');
    if (poster) {
      const play = () => { $('#pvideo').innerHTML = `<iframe src="${esc(v.embed)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${esc(p.title)}"></iframe>`; };
      poster.addEventListener('click', play);
      poster.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
    }
  },

  motion() {
    const { projects } = state.data;
    const vids = projects.filter(p => p.category === 'motion' || p.video);
    $('#main').innerHTML = pageHero('Motion Graphics', 'Design in *motion*', 'Logo reveals, animated posts and short motion pieces. Tap a video to play it full screen.') + `
    <section class="section" style="padding-top:10px"><div class="wrap">
      ${vids.length ? `<div class="vgrid stagger">${vids.map((p, i) => {
        const v = videoInfo(p.video);
        const thumb = p.cover || (v && v.thumb) || '';
        return `<article class="vcard">
          <button class="vthumb" data-v="${i}" aria-label="Play ${esc(p.title)}">${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy">` : ''}<span class="pbtn">${icon(v ? 'play' : 'eye', 26)}</span></button>
          <div class="vb">${p.sample ? `<span class="chip" style="margin-bottom:10px;background:var(--navy);color:#fff;font-size:11px">${icon('sparkles', 12)} Sample</span>` : ''}<h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
            <a class="hl" style="display:inline-flex;gap:6px;align-items:center;margin-top:12px;font-weight:600;font-size:14px" href="/portfolio/${esc(p.slug)}">Project details ${icon('arrowRight', 15)}</a></div>
        </article>`;
      }).join('')}</div>` : `<div class="empty">Motion projects will appear here once they are published from the admin dashboard.</div>`}
    </div></section>` + ctaBlock();
    $$('[data-v]').forEach(b => b.addEventListener('click', () => {
      const p = vids[+b.dataset.v];
      const v = videoInfo(p.video);
      if (!v) return void (location.href = `/portfolio/${p.slug}`);
      openModal([v.type === 'file' ? { video: v.src, caption: p.title } : { embed: v.embed, caption: p.title }], 0);
    }));
  },

  contact() {
    const { whatsapp, social, slides, services } = state.data;
    const form = $('#contact-form');
    $('#contact-cards').innerHTML = `
      <a class="ccard reveal" href="${esc(wa())}" target="_blank" rel="noopener"><span class="ci wa">${icon('whatsapp', 24)}</span><div><small>WhatsApp (fastest)</small><b>${esc(whatsapp.display)}</b></div></a>
      ${social.email ? `<a class="ccard reveal" href="mailto:${esc(social.email)}"><span class="ci">${icon('mail', 22)}</span><div><small>Email</small><b>${esc(social.email)}</b></div></a>` : ''}
      <div class="ccard reveal"><span class="ci" style="background:var(--navy)">${icon('globe', 22)}</span><div><small>Follow</small><div class="socials" style="margin-top:6px">${socialLinks(social) || '<span class="muted" style="font-size:14px">Social links coming soon</span>'}</div></div></div>`;
    const sel = form.service;
    const names = [...new Set([...slides.map(s => s.label), ...services.map(s => s.name)])];
    sel.innerHTML = '<option value="">Select a service…</option>' + names.map(n => `<option>${esc(n)}</option>`).join('') + '<option>Other</option>';
    const pre = new URLSearchParams(location.search).get('service');
    if (pre) sel.value = pre;
    const started = Date.now();
    const status = $('#form-status');

    const rules = {
      name: v => v.trim().length >= 2 || 'Please enter your name.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      phone: v => !v.trim() || /^[+\d][\d\s()-]{6,20}$/.test(v.trim()) || 'Please enter a valid phone / WhatsApp number.',
      service: v => !!v || 'Please choose a service.',
      details: v => v.trim().length >= 10 || 'Please describe your project (at least 10 characters).',
    };
    const check = k => {
      const field = form[k].closest('.field');
      const r = rules[k](form[k].value);
      field.classList.toggle('invalid', r !== true);
      $('.err', field).textContent = r === true ? '' : r;
      return r === true;
    };
    const validate = () => {
      const bad = Object.keys(rules).filter(k => !check(k));
      if (bad.length) form[bad[0]].focus();
      return !bad.length;
    };
    // re-check a field while the user fixes it (never moves focus)
    Object.keys(rules).forEach(k => ['blur', 'input', 'change'].forEach(ev => form[k].addEventListener(ev, () => { if (form[k].closest('.field').classList.contains('invalid')) check(k); })));
    const values = () => Object.fromEntries(new FormData(form));

    $('#wa-instead').addEventListener('click', () => {
      const f = values();
      if (!f.name || !f.details) { status.className = 'form-status err'; status.textContent = 'Add your name and project details first, then open WhatsApp.'; return; }
      openWhatsApp(buildInquiry({ name: f.name, service: f.service || 'Not sure yet', budget: f.budget, details: f.details }));
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.className = 'form-status';
      if (!validate()) return;
      const f = values();
      if (f.company_website || Date.now() - started < 2500) { status.className = 'form-status ok'; status.textContent = 'Thanks! Your message was received.'; form.reset(); return; } // bot
      try { const last = +localStorage.getItem('shah_last_submit') || 0; if (Date.now() - last < 60000) { status.className = 'form-status err'; status.textContent = 'You just sent a message — please wait a minute before sending another.'; return; } } catch { /* ignore */ }
      const btn = $('button[type="submit"]', form);
      btn.disabled = true; const label = btn.innerHTML; btn.innerHTML = 'Sending…';
      const payload = {
        name: f.name.trim().slice(0, 100), email: f.email.trim().slice(0, 254), phone: (f.phone || '').trim().slice(0, 40),
        service: f.service.slice(0, 100), budget: (f.budget || '').slice(0, 60), details: f.details.trim().slice(0, 5000),
        status: 'new', notes: '', source: 'website',
      };
      try {
        if (isConfigured()) {
          await db.create(CONFIG.collections.messages, payload);
        } else {
          const { status: _s, notes: _n, source: _src, ...fields } = payload;
          const body = new URLSearchParams({ 'form-name': 'contact', ...fields });
          const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
          if (!r.ok) throw new Error('Form service unavailable');
        }
        try { localStorage.setItem('shah_last_submit', String(Date.now())); } catch { /* ignore */ }
        status.className = 'form-status ok';
        status.innerHTML = `${icon('check', 16)} Thank you, ${esc(payload.name.split(' ')[0])}! Your project details were received — I’ll reply by email or WhatsApp. For a faster answer, <a class="hl" style="font-weight:600" href="${esc(wa())}" target="_blank" rel="noopener">message on WhatsApp</a>.`;
        form.reset();
      } catch (err) {
        status.className = 'form-status err';
        status.innerHTML = `Sorry — the message could not be sent (${esc(err.message)}). Please try again or <a class="hl" href="${esc(wa())}" target="_blank" rel="noopener">contact me on WhatsApp</a>.`;
      } finally { btn.disabled = false; btn.innerHTML = label; }
    });
  },

  notfound() {},
};

function notFound(msg) {
  $('#main').innerHTML = `<section class="nf"><div><div class="code">404</div><h1>Page not found</h1><p>${esc(msg)}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a class="btn btn-primary" href="/">${icon('home', 18)} Back home</a><a class="btn btn-ghost" href="/portfolio">Portfolio</a></div></div></section>`;
}

boot(async st => {
  const fn = PAGES[st.page];
  if (fn) await fn();
}).catch(err => {
  console.error(err);
  document.body.classList.add('ready');
});
