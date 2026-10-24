/* ------------------------------------------------------------------
   SHAH DESIGNS — site bootstrap
   Layout (header/footer), theming, motion system, WhatsApp widget.
------------------------------------------------------------------- */
import { loadSiteData, deepMerge } from './api.js';
import { esc, icon, waLink, safeUrl, reducedMotion, $, $$ } from './ui.js';

export const state = { data: null, page: document.body.dataset.page || '' };

/* ================= Theming ================= */
const FONT_CACHE = new Set(['Space Grotesk', 'Inter']);
export const FONTS = ['Space Grotesk', 'Sora', 'Inter', 'Manrope', 'Outfit', 'Poppins', 'DM Sans', 'Plus Jakarta Sans', 'Syne', 'Urbanist'];

function loadFont(name) {
  if (!name || FONT_CACHE.has(name)) return;
  FONT_CACHE.add(name);
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(l);
}

export function applyDesign(d) {
  const r = document.documentElement;
  const set = (k, v) => v !== undefined && v !== null && v !== '' && r.style.setProperty(k, v);
  set('--primary', d.primary); set('--secondary', d.secondary); set('--navy', d.navy);
  set('--bg1', d.bg1); set('--bg2', d.bg2); set('--lavender', d.lavender);
  set('--radius', (d.radius ?? 24) + 'px');
  set('--hscale', d.headingScale ?? 1);
  set('--space', d.spacing ?? 1);
  set('--speed', d.animSpeed ?? 1);
  loadFont(d.headingFont); loadFont(d.bodyFont);
  set('--font-head', `'${d.headingFont || 'Space Grotesk'}', 'Sora', system-ui, sans-serif`);
  set('--font-body', `'${d.bodyFont || 'Inter'}', system-ui, sans-serif`);
  r.dataset.theme = d.theme === 'dark' || d.gradient === 'midnight' ? 'dark' : 'light';
  r.dataset.btn = d.buttonShape || 'pill';
  r.dataset.shadow = d.shadow || 'soft';
  r.dataset.nav = d.navStyle || 'glass';
  r.dataset.motion = reducedMotion() ? '0' : String(d.animIntensity ?? 2);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = r.dataset.theme === 'dark' ? '#060D2C' : (d.bg1 || '#E9EBFF');
}

function applySeo(seo, pageKey) {
  const p = (seo.pages || {})[pageKey] || {};
  if (p.title) document.title = p.title;
  const desc = p.description || seo.description;
  const setMeta = (sel, attr, val) => { const m = document.querySelector(sel); if (m && val) m.setAttribute(attr, val); };
  setMeta('meta[name="description"]', 'content', desc);
  setMeta('meta[property="og:description"]', 'content', desc);
  setMeta('meta[property="og:title"]', 'content', p.title || seo.siteTitle);
  if (seo.ogImage) setMeta('meta[property="og:image"]', 'content', new URL(seo.ogImage, location.origin).href);
  if (seo.keywords) setMeta('meta[name="keywords"]', 'content', seo.keywords);
  if (seo.favicon) { const f = document.querySelector('link[rel="icon"]'); if (f) f.href = seo.favicon; }
}

/* ================= Layout ================= */
const NAV = [
  ['home', 'Home', '/'],
  ['about', 'About', '/about'],
  ['services', 'Services', '/services'],
  ['portfolio', 'Portfolio', '/portfolio'],
  ['motion', 'Motion Graphics', '/motion-graphics'],
  ['contact', 'Contact', '/contact'],
];
const LOGO_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M17 7.6C16.2 6 14.4 5 12 5 9 5 7 6.5 7 8.7c0 4.8 10.2 2.6 10.2 7.6 0 2.3-2.2 3.7-5.2 3.7-2.6 0-4.6-1-5.4-2.8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
export const logoHTML = () => `<a href="/" class="logo" aria-label="SHAH DESIGNS home"><span class="logo-mark">${LOGO_SVG}</span><span>SHAH<small>DESIGNS</small></span></a>`;

export function socialLinks(social) {
  const map = [['instagram', 'Instagram'], ['behance', 'Behance'], ['linkedin', 'LinkedIn'], ['dribbble', 'Dribbble'], ['facebook', 'Facebook'], ['youtube', 'YouTube']];
  return map.filter(([k]) => safeUrl(social[k])).map(([k, label]) =>
    `<a href="${esc(safeUrl(social[k]))}" target="_blank" rel="noopener" aria-label="${label}">${icon(k, 18)}</a>`).join('');
}

export const wa = (msg) => waLink(state.data.whatsapp.number, msg || state.data.whatsapp.defaultMessage);

function renderHeader() {
  const { whatsapp, social } = state.data;
  const host = document.getElementById('site-header');
  if (!host) return;
  host.outerHTML = `
  <header class="site-header" id="site-header">
    <div class="bar-bg"></div>
    <div class="wrap bar">
      ${logoHTML()}
      <nav class="nav" aria-label="Main">
        ${NAV.map(([k, l, h]) => `<a href="${h}" ${k === state.page ? 'aria-current="page"' : ''}>${l}</a>`).join('')}
      </nav>
      <a class="btn btn-primary btn-sm header-cta magnetic" href="${esc(wa())}" target="_blank" rel="noopener">${icon('whatsapp', 18)} ${esc(whatsapp.navCta || "Let's Talk")}</a>
      <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span><span></span></button>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    ${NAV.map(([k, l, h], i) => `<a class="m-link" href="${h}" style="transition-delay:${0.08 + i * 0.05}s" ${k === state.page ? 'aria-current="page"' : ''}>${l} ${icon('arrowUpRight', 26)}</a>`).join('')}
    <div class="m-foot">
      <a class="btn btn-wa btn-lg" href="${esc(wa())}" target="_blank" rel="noopener">${icon('whatsapp', 20)} ${esc(whatsapp.navCta || "Let's Talk")}</a>
      <div class="socials">${socialLinks(social)}</div>
    </div>
  </div>`;
  const header = $('#site-header');
  const burger = $('.burger', header);
  const menu = $('#mobile-menu');
  const toggle = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
  };
  burger.addEventListener('click', () => toggle(!document.documentElement.classList.contains('menu-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

  let last = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 20);
    header.classList.toggle('hide', y > 300 && y > last && !document.documentElement.classList.contains('menu-open'));
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function renderFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  const { content, social, whatsapp, services } = state.data;
  const year = new Date().getFullYear();
  host.outerHTML = `
  <footer class="site-footer" id="site-footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>${logoHTML()}<p>${esc(content.footer.tagline)}</p><div class="socials">${socialLinks(social)}</div></div>
        <div><h4>Explore</h4>${NAV.map(([, l, h]) => `<a href="${h}">${l}</a>`).join('')}</div>
        <div><h4>Services</h4>${services.slice(0, 6).map(s => `<a href="/services/${esc(s.slug)}">${esc(s.name)}</a>`).join('')}</div>
        <div><h4>Contact</h4>
          <a href="${esc(wa())}" target="_blank" rel="noopener">WhatsApp: ${esc(whatsapp.display)}</a>
          ${social.email ? `<a href="mailto:${esc(social.email)}">${esc(social.email)}</a>` : ''}
          <a href="/contact">Project form</a>
        </div>
      </div>
      <div class="big-word" aria-hidden="true">SHAH DESIGNS</div>
      <div class="footer-bottom">
        <span>© ${year} ${esc(content.footer.copyright)}. All rights reserved.</span>
        <a href="#top" class="to-top" id="to-top">Back to top <span>${icon('arrowUp', 18)}</span></a>
      </div>
    </div>
  </footer>`;
  $('#to-top').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); });
}

/* ================= WhatsApp widget ================= */
function renderWhatsApp() {
  const w = state.data.whatsapp;
  if (!w.floatEnabled) return;
  const opts = state.data.slides.map(s => s.label);
  const el = document.createElement('div');
  el.className = 'wa-float';
  el.innerHTML = `
    <div class="wa-panel" role="dialog" aria-label="${esc(w.widgetTitle)}" aria-hidden="true">
      <div class="wa-head"><span class="av">SD</span><div><b>${esc(w.widgetTitle)}</b><small>Typically replies on WhatsApp</small></div>
        <button class="x" aria-label="Close">${icon('x', 16)}</button></div>
      <div class="wa-body">
        <div class="wa-bubble">${esc(w.widgetText)}</div>
        <a class="btn btn-wa" style="width:100%" href="${esc(wa())}" target="_blank" rel="noopener">${icon('whatsapp', 18)} ${esc(w.ctaText)}</a>
        <div style="text-align:center;margin-top:12px"><button class="wa-toggle-form" type="button" aria-expanded="false">${icon('edit', 14)} Or describe your project first</button></div>
        <form class="wa-form" hidden novalidate>
          <input name="name" placeholder="Your name" maxlength="80" required autocomplete="name">
          <select name="service" required><option value="">Required service…</option>${opts.map(o => `<option>${esc(o)}</option>`).join('')}<option>Other</option></select>
          <textarea name="details" placeholder="Project details" maxlength="1500" required></textarea>
          <input name="budget" placeholder="Budget (optional)" maxlength="60">
          <button class="btn btn-wa" type="submit">${icon('whatsapp', 18)} Open in WhatsApp</button>
          <p class="wa-note">WhatsApp will open with your message ready — you review it and press send.</p>
        </form>
      </div>
    </div>
    <button class="wa-btn" aria-label="${esc(w.tooltip)}" aria-expanded="false">${icon('whatsapp', 30)}<span class="wa-tip">${esc(w.tooltip)}</span></button>`;
  document.body.appendChild(el);
  const btn = $('.wa-btn', el), panel = $('.wa-panel', el), form = $('.wa-form', el);
  const set = open => { el.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); panel.setAttribute('aria-hidden', !open); };
  btn.addEventListener('click', () => set(!el.classList.contains('open')));
  $('.x', el).addEventListener('click', () => set(false));
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  const tf = $('.wa-toggle-form', el);
  tf.addEventListener('click', () => { form.hidden = !form.hidden; tf.setAttribute('aria-expanded', !form.hidden); if (!form.hidden) form.name.focus(); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form));
    let bad = false;
    ['name', 'service', 'details'].forEach(k => { const ok = String(f[k] || '').trim().length > 1; form[k].style.borderColor = ok ? '' : '#E5293D'; if (!ok) bad = true; });
    if (bad) return;
    openWhatsApp(buildInquiry(f));
  });
}

export function buildInquiry(f) {
  return [
    'Hello SHAH DESIGNS,',
    '',
    `Name: ${f.name.trim()}`,
    `Service: ${f.service}`,
    f.budget && f.budget.trim() ? `Budget: ${f.budget.trim()}` : '',
    '',
    'Project details:',
    f.details.trim(),
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
}

export function openWhatsApp(message) {
  const url = wa(message);
  // (window.open with 'noopener' always returns null, so detach opener manually)
  const win = window.open(url, '_blank');
  if (win) { try { win.opener = null; } catch { /* ignore */ } } else location.href = url;
}

/* ================= Motion system ================= */
export function observe(root = document) {
  const io = state.io || (state.io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }));
  $$('.stagger', root).forEach(el => [...el.children].forEach((c, i) => c.style.setProperty('--i', i)));
  $$('.reveal, .reveal-mask, .stagger, .split, .process', root).forEach(el => {
    if (document.documentElement.dataset.motion === '0') el.classList.add('in'); else io.observe(el);
  });
}

function progressBar() {
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  let ticking = false;
  const upd = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
}

function cursor() {
  if (!state.data.design.cursor || !matchMedia('(pointer: fine)').matches || document.documentElement.dataset.motion === '0') return;
  const dot = document.createElement('div'); dot.className = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  document.documentElement.classList.add('has-cursor');
  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    const t = e.target;
    ring.classList.toggle('drag', !!t.closest?.('.slides') && !t.closest('a, button, input, .th, .ba'));
    ring.classList.toggle('hover', !!t.closest?.('a, button, [role="button"], .th, label, select'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => { x = y = -100; });
  const loop = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(loop); };
  loop();
}

export function magnetic(root = document) {
  if (!matchMedia('(pointer: fine)').matches || document.documentElement.dataset.motion === '0') return;
  $$('.magnetic', root).forEach(el => {
    if (el._mag) return; el._mag = true;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/** Mouse parallax: [data-parallax] container, children .pl[data-depth] */
export function parallax(root) {
  if (!matchMedia('(pointer: fine)').matches || document.documentElement.dataset.motion !== '2') return;
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
  const layers = $$('.pl[data-depth]', root);
  root.addEventListener('pointermove', e => {
    const r = root.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(tick);
  });
  root.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(tick); });
  function tick() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    layers.forEach(l => { const d = +l.dataset.depth; l.style.transform = `translate3d(${cx * d}px, ${cy * d}px, 0)`; });
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : 0;
  }
}

/** Fit fixed-size compositions (.vwrap[data-w][data-h]) into the layout */
export function fitBoxes() {
  $$('.vwrap[data-w]').forEach(w => {
    const bw = +w.dataset.w, bh = +w.dataset.h;
    const mobile = innerWidth < 961;
    const frac = +(mobile ? w.dataset.vhMob : w.dataset.vhDesk) || 0.7;
    const maxH = Math.max(220, innerHeight * frac);
    const k = Math.min(w.clientWidth / bw, maxH / bh, +(w.dataset.max || 1.2));
    w.style.setProperty('--k', k.toFixed(4));
  });
}

/* ================= Lightbox / modal ================= */
let modal;
export function openModal(items, index = 0) {
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<button class="icon-btn m-close" aria-label="Close">${icon('x')}</button>
      <button class="icon-btn m-prev" aria-label="Previous">${icon('chevronLeft')}</button>
      <button class="icon-btn m-next" aria-label="Next">${icon('chevronRight')}</button>
      <div class="modal-inner"><div class="modal-media"></div><div class="modal-cap"></div></div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    $('.m-close', modal).addEventListener('click', closeModal);
    $('.m-prev', modal).addEventListener('click', () => show(modal._i - 1));
    $('.m-next', modal).addEventListener('click', () => show(modal._i + 1));
    addEventListener('keydown', e => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') show(modal._i - 1);
      if (e.key === 'ArrowRight') show(modal._i + 1);
    });
  }
  modal._items = items;
  const show = i => {
    const n = modal._items.length;
    modal._i = (i + n) % n;
    const it = modal._items[modal._i];
    const media = $('.modal-media', modal);
    if (it.embed) media.innerHTML = `<iframe src="${esc(it.embed)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${esc(it.caption || 'Video')}"></iframe>`;
    else if (it.video) media.innerHTML = `<video src="${esc(it.video)}" controls autoplay playsinline></video>`;
    else if (it.html) media.innerHTML = it.html;
    else media.innerHTML = `<img src="${esc(it.src)}" alt="${esc(it.caption || '')}">`;
    $('.modal-cap', modal).textContent = it.caption || '';
    $('.m-prev', modal).hidden = $('.m-next', modal).hidden = n < 2;
  };
  modal._show = show;
  show(index);
  modal._prevFocus = document.activeElement;
  modal.classList.add('open');
  document.documentElement.style.overflow = 'hidden';
  $('.m-close', modal).focus();
}
export function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  $('.modal-media', modal).innerHTML = '';
  document.documentElement.style.overflow = '';
  modal._prevFocus?.focus?.();
}

/* ================= Loader ================= */
function loader() {
  let seen = false;
  try { seen = sessionStorage.getItem('shah_seen') === '1'; sessionStorage.setItem('shah_seen', '1'); } catch { /* ignore */ }
  if (seen || document.documentElement.dataset.motion === '0' || state.preview) return Promise.resolve();
  const el = document.createElement('div');
  el.className = 'loader';
  el.innerHTML = '<div class="loader-inner"><div class="loader-word"><span>SHAH</span><span>DESIGNS</span></div><div class="loader-bar"><i></i></div></div>';
  document.body.appendChild(el);
  return new Promise(res => setTimeout(() => { el.classList.add('done'); setTimeout(() => el.remove(), 1000); res(); }, 1250));
}

/* ================= Preview mode (admin live preview) ================= */
function previewOverrides(data) {
  if (!new URLSearchParams(location.search).has('preview')) return data;
  state.preview = true;
  try {
    const o = JSON.parse(sessionStorage.getItem('shah_preview') || 'null');
    if (o) {
      for (const k of ['design', 'whatsapp', 'content', 'social', 'seo']) if (o[k]) data[k] = deepMerge(data[k], o[k]);
      if (o.slides) data.slides = o.slides;
    }
  } catch { /* ignore */ }
  addEventListener('message', e => {
    if (e.origin !== location.origin || !e.data || e.data.type !== 'shah:design') return;
    state.data.design = deepMerge(state.data.design, e.data.design);
    applyDesign(state.data.design);
    fitBoxes();
  });
  return data;
}

/* ================= Boot ================= */
export async function boot(pageInit) {
  const r = document.documentElement;
  r.dataset.motion = reducedMotion() ? '0' : '2';
  let data = await loadSiteData();
  data = previewOverrides(structuredClone(data));
  state.data = data;
  applyDesign(data.design);
  applySeo(data.seo, state.page);
  renderHeader();
  renderFooter();
  renderWhatsApp();
  const loaded = loader();
  if (pageInit) await pageInit(state);
  fitBoxes();
  addEventListener('resize', () => requestAnimationFrame(fitBoxes));
  progressBar();
  cursor();
  magnetic();
  await loaded;
  observe();
  document.body.classList.add('ready');
}
