/* ------------------------------------------------------------------
   SHAH DESIGNS — Hero + interactive 5-slide Swipe Experience
   Touch swipe · mouse drag · arrows · keyboard · dots · jump menu
------------------------------------------------------------------- */
import { esc, icon, splitWords, markHl, safeUrl, $, $$ } from './ui.js';
import { state, wa, socialLinks, parallax, fitBoxes, openModal, magnetic } from './site.js';

const pad = n => String(n).padStart(2, '0');

/* ================= Hero ================= */
function heroVisual(c) {
  const about = state.data.content.about;
  const portrait = c.hero.portrait
    ? `<img src="${esc(c.hero.portrait)}" alt="${esc(about.name)} portrait">`
    : `<div class="ph"><div class="ph-label"><span>YOUR PHOTO</span><span>${icon('image', 14)}</span></div><div class="ph-figure"></div></div>`;
  return `
  <div class="vbox hv">
    <svg class="ribbons" viewBox="0 0 800 720" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="rg1" x1="0" y1="1" x2="1" y2="0"><stop offset="0" style="stop-color:var(--primary)"/><stop offset=".55" style="stop-color:var(--secondary)"/><stop offset="1" stop-color="#A9B8FF"/></linearGradient>
        <linearGradient id="rg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9FB6FF"/><stop offset="1" style="stop-color:var(--primary)"/></linearGradient>
      </defs>
      <path class="r-main" stroke="url(#rg1)" d="M -30 600 C 150 680, 250 400, 410 380 S 650 130, 830 170"/>
      <path class="r-hi" stroke="#fff" transform="translate(0 -14)" d="M -30 600 C 150 680, 250 400, 410 380 S 650 130, 830 170"/>
      <path class="r-main" stroke="url(#rg2)" style="animation-delay:.7s" d="M 160 760 C 300 640, 540 680, 610 500 S 760 330, 850 360"/>
      <path class="r-hi" stroke="#fff" style="animation-delay:.85s" transform="translate(0 -14)" d="M 160 760 C 300 640, 540 680, 610 500 S 760 330, 850 360"/>
    </svg>
    <div class="pl" data-depth="-14">
      <div class="glow-blob" style="left:300px;top:120px;width:300px;height:300px;background:var(--primary)"></div>
      <div class="glow-blob" style="left:60px;top:300px;width:200px;height:200px;background:var(--secondary)"></div>
      <div class="blob3d float" style="left:250px;top:0;width:58px;height:58px;--d:-2s"></div>
      
    </div>
    <div class="pl" data-depth="8">
      <div class="fx portrait float" style="--d:-1s">${portrait}
        <div class="tag"><span class="dot"></span><div><b>${esc(about.name)}</b><small>${esc(about.role)}</small></div></div>
      </div>
    </div>
    <div class="pl" data-depth="18">
      <div class="fx phone float" style="--d:-3s">
        <div class="phone-body"><div class="phone-screen"><span class="phone-notch"></span>
          <div class="ps-inner">
            <div class="ps-top">SHAH DESIGNS <i></i></div>
            <div class="ps-hero"><small>PORTFOLIO</small><b>Great<br>Design.</b><span class="ps-btn">VIEW WORK →</span></div>
            <div class="ps-grid">
              <i style="background:linear-gradient(140deg,#2455FF,#7366FF)"></i><i style="background:linear-gradient(140deg,#FF5A36,#FF2E83)"></i>
              <i style="background:linear-gradient(140deg,#08143C,#2455FF)"></i><i style="background:linear-gradient(140deg,#00C2A8,#2455FF)"></i>
            </div>
            <div class="ps-row"><i></i><span></span></div>
            <div class="ps-row"><i style="background:#FFD83D"></i><span></span></div>
            <div class="ps-grid"><i style="background:#DCDFFF"></i><i style="background:#08143C"></i></div>
          </div>
        </div></div>
      </div>
    </div>
    <div class="pl" data-depth="28">
      <div class="fx ficon float" style="left:0;top:70px;--d:-2.2s">${icon('pen', 28)}</div>
      <div class="fx ficon blue float" style="left:566px;top:16px;--d:-.6s">${icon('palette', 28)}</div>
      <div class="fx ficon navy float" style="left:572px;top:430px;--d:-3.4s">${icon('play', 26)}</div>
      <div class="fx ficon float" style="left:8px;top:478px;--d:-1.4s">${icon('layers', 28)}</div>
      <div class="fx fcard float" style="left:110px;top:14px;--d:-4.4s">${icon('monitor', 18)}<div><b>Website</b><small>Responsive · Fast</small></div></div>
      <div class="fx fcard float" style="left:356px;top:536px;--d:-2.8s"><span class="sw"><i style="background:var(--primary)"></i><i style="background:var(--secondary)"></i><i style="background:var(--navy)"></i><i style="background:#FFD83D"></i></span><div><b>Brand Kit</b><small>Logo · Colours · Fonts</small></div></div>
    </div>
  </div>`;
}

function heroHTML(slides) {
  const { content, social, design } = state.data;
  const h = content.hero;
  let n = 0;
  const lines = h.lines.map(l => { const html = splitWords(l, '', n); n += l.split(/\s+/).length; return `<span class="line">${html}</span>`; }).join('');
  return `
  <div class="layer hero" data-layout="${esc(design.heroLayout || 'split')}">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="eyebrow reveal">${esc(h.badge)}</span>
        <h1 class="split" aria-label="${esc(h.lines.join(' ').replace(/\*/g, ''))}">${lines}</h1>
        <p class="reveal" style="transition-delay:.35s">${esc(h.text)}</p>
        <div class="hero-actions reveal" style="transition-delay:.5s">
          <div class="swipe-pill" id="swipe-pill">
            <span class="fill"></span>
            <span class="track-label"><span>${esc(h.swipeText)} →</span></span>
            <button class="knob" type="button" aria-label="${esc(h.swipeText)} — open the five services">${icon('arrowRight', 22)}</button>
          </div>
          <a class="btn btn-ghost btn-lg magnetic" href="/portfolio">${esc(h.secondaryCta)} ${icon('arrowUpRight', 18, 'ic-arrow')}</a>
        </div>
        <div class="hero-meta reveal" style="transition-delay:.62s"><div class="socials">${socialLinks(social)}</div></div>
      </div>
      <div class="hero-visual" data-parallax>
        <div class="vwrap" data-w="640" data-h="600" data-vh-desk=".64" data-vh-mob=".31">${heroVisual(content)}</div>
      </div>
    </div>
    <div class="wrap hero-foot intro" style="--dl:.7s">
      <div class="svc-pills" role="list" aria-label="Services">
        ${slides.map((s, i) => `<button role="listitem" data-go="${i}"><b>${pad(i + 1)}</b>${esc(s.label)}</button>`).join('')}
      </div>
      <a href="#after-stage" class="scroll-ind"><span class="mouse"></span>Scroll</a>
    </div>
  </div>`;
}

/* ================= Slide visuals ================= */
const webPage = (mobile = false) => `
  <div class="wb-scroll">
    <div class="wp-nav">SHAH<span>${mobile ? '<i style="width:14px"></i>' : '<i></i><i></i><i></i>'}</span></div>
    <div class="wp-hero"><div><b>Grow your <em>brand</em> online.</b><br><span class="pbtn">GET STARTED</span></div><div class="art"></div></div>
    <div class="wp-cards"><i></i><i></i><i></i>${mobile ? '<i></i>' : ''}</div>
    <div class="wp-band"></div>
    <div class="wp-lines"><i></i><i></i><i></i></div>
    <div class="wp-cards"><i></i><i></i><i></i>${mobile ? '<i></i>' : ''}</div>
    <div class="wp-lines"><i></i><i></i><i></i></div>
  </div>`;

const cvPage = (tpl) => `
  <div class="cv-side"><span class="cv-photo"></span><small>CONTACT</small><i></i><i></i><i style="width:70%"></i><small>SKILLS</small>
    <span class="sk" style="--w:92%"></span><span class="sk" style="--w:78%"></span><span class="sk" style="--w:85%"></span><span class="sk" style="--w:64%"></span>
    <small>LANGUAGES</small><i></i><i style="width:60%"></i></div>
  <div class="cv-main"><div class="cv-name">Your Name</div><div class="cv-role">${tpl === 'classic' ? 'EXECUTIVE PROFILE' : tpl === 'creative' ? 'CREATIVE PROFESSIONAL' : 'PROFESSIONAL TITLE'}</div>
    <div class="cv-h">PROFILE</div><i></i><i class="m"></i><i class="s"></i>
    <div class="cv-h">EXPERIENCE</div><div class="cv-job">Job Title<span>20XX — Now</span></div><i></i><i class="m"></i>
    <div class="cv-job">Job Title<span>20XX — 20XX</span></div><i></i><i class="s"></i>
    <div class="cv-h">EDUCATION</div><div class="cv-job">Degree<span>20XX</span></div><i class="m"></i></div>`;

const GD_MAP = [
  [/visiting|business card|id card|stationery/i, 'card'],
  [/poster|advert|infographic/i, 'poster'],
  [/flyer|brochure|menu|invitation/i, 'flyer'],
  [/social|instagram|facebook|motion|presentation/i, 'social'],
  [/packag|label|product/i, 'packaging'],
  [/certificate/i, 'cert'],
];
const gdKey = name => (GD_MAP.find(([re]) => re.test(name)) || [, 'all'])[1];

function visualHTML(s) {
  if (s.image) {
    return `
      <div class="pl" data-depth="-12"><div class="torus float" style="left:440px;top:360px;width:130px;height:130px"></div><div class="blob3d violet float" style="left:30px;top:20px;width:80px;height:80px;--d:-2s"></div></div>
      <div class="pl" data-depth="12"><div class="fx sv-image mk-hover" data-open><img src="${esc(s.image)}" alt="${esc(s.label)} preview" loading="lazy"></div></div>
      <div class="pl" data-depth="24"><div class="fx fcard float" style="left:20px;top:440px">${icon('sparkles', 18)}<div><b>${esc(s.label)}</b><small>${esc((s.services || []).slice(0, 2).join(' · '))}</small></div></div></div>`;
  }
  switch (s.visual) {
    case 'logo': return `
      <div class="pl" data-depth="-14">
        <div class="deco-ring" style="left:320px;top:-30px;width:290px;height:290px"></div>
        <div class="torus float" style="left:480px;top:420px;width:110px;height:110px;--d:-2s"></div>
        <div class="blob3d float" style="left:20px;top:10px;width:70px;height:70px;--d:-1s"></div>
      </div>
      <div class="pl" data-depth="10">
        <div class="mk lg-card mk-hover float" style="--d:-3s" data-open><span class="l1"></span><div><i></i><i></i></div></div>
        <div class="mk lg-board mk-hover" data-open><div class="lg-mark"><span class="shape"></span><b>N</b></div><div class="lg-word"><b>NOVA</b><small>STUDIO</small></div></div>
      </div>
      <div class="pl" data-depth="22">
        <div class="mk lg-variant v1 mk-hover float" style="--d:-1.5s" data-open><span class="mini">N</span></div>
        <div class="mk lg-variant v2 mk-hover float" style="--d:-4s" data-open><span class="mini">N</span></div>
        <div class="mk lg-banner mk-hover" data-open><span class="bar-dec"></span><div><small>YOUTUBE BANNER</small><b>Nova Studio</b></div><span class="btnish">SUBSCRIBE</span></div>
        <div class="fx fcard float" style="left:392px;top:318px;--d:-2.5s"><span class="sw"><i style="background:var(--primary)"></i><i style="background:var(--secondary)"></i><i style="background:var(--navy)"></i><i style="background:#FFD83D"></i></span><div><b>Brand palette</b><small>Identity system</small></div></div>
      </div>`;
    case 'thumb': return `
      <div class="pl" data-depth="-12"><div class="blob3d violet float" style="left:500px;top:420px;width:84px;height:84px"></div><div class="deco-ring" style="left:-30px;top:120px;width:260px;height:260px"></div></div>
      <div class="pl" data-depth="14"><div class="fx th-grid">
        <div class="th th-a" tabindex="0" role="button" aria-label="Preview thumbnail: 10x faster"><span class="obj" style="background:linear-gradient(140deg,#FFE14A,#FF8A00)"></span><span class="play">${icon('play', 14)}</span><div class="th-in"><div class="big">10X <em>FASTER</em><br>WORKFLOW</div></div><span class="dur">12:48</span></div>
        <div class="th th-b" tabindex="0" role="button" aria-label="Preview thumbnail: I tried it"><span class="obj" style="background:linear-gradient(140deg,#fff,#9FB6FF)"></span><span class="play">${icon('play', 14)}</span><div class="th-in"><div class="big">I TRIED <em>IT</em><br>FOR 30 DAYS</div></div><span class="dur">18:02</span></div>
        <div class="th th-c" tabindex="0" role="button" aria-label="Preview thumbnail: top 5 tips"><span class="obj" style="background:linear-gradient(140deg,#FFE14A,#10C99B)"></span><div class="th-in"><div class="big">TOP <em>5</em><br>STUDY TIPS</div></div><span class="dur">9:15</span></div>
        <div class="th th-d" tabindex="0" role="button" aria-label="Preview thumbnail: podcast"><span class="obj" style="background:linear-gradient(140deg,#08143C,#2455FF)"></span><div class="th-in"><div class="big">PODCAST<br><em>EP. 12</em></div></div><span class="dur">1:02:40</span></div>
        <div class="th th-feature"><div class="ba" style="--cut:50%">
          <div class="ba-before">Plain screenshot<br><small>no design</small></div>
          <div class="ba-after"><div class="th-in"><div class="big">MY <em>SETUP</em><br>TOUR</div></div></div>
          <span class="ba-label l">BEFORE</span><span class="ba-label r">AFTER</span><span class="ba-handle"></span>
          <input type="range" min="0" max="100" value="50" aria-label="Before and after comparison slider">
        </div></div>
      </div></div>`;
    case 'web': return `
      <div class="pl" data-depth="-12"><div class="glow-blob" style="left:180px;top:100px;width:280px;height:240px;background:var(--primary);opacity:.35"></div><div class="torus float" style="left:-10px;top:-10px;width:90px;height:90px;border-width:16px"></div></div>
      <div class="pl" data-depth="10"><div class="fx wb-laptop" data-open><div class="wb-screen"><div class="wb-browser"><div class="wb-chrome"><i></i><i></i><i></i><span>yourbrand.com</span></div><div class="wb-page">${webPage()}</div></div></div><div class="wb-base"></div></div></div>
      <div class="pl" data-depth="22">
        <div class="fx wb-phone" data-open><div class="wb-browser"><div class="wb-page">${webPage(true)}</div></div></div>
        <div class="fx code-chip float" style="left:370px;top:14px;--d:-2s">&lt;<em>Hero</em> <u>responsive</u> /&gt;</div>
        <div class="fx code-chip float" style="left:250px;top:470px;--d:-4s">{ admin: <u>'dashboard'</u> }</div>
        <div class="fx wb-toggle" role="group" aria-label="Preview device">
          <button type="button" data-device="desktop" aria-pressed="true">${icon('monitor', 16)} Desktop</button>
          <button type="button" data-device="mobile" aria-pressed="false">${icon('smartphone', 16)} Mobile</button>
        </div>
      </div>`;
    case 'cv': return `
      <div class="pl" data-depth="-12"><div class="deco-ring" style="left:300px;top:250px;width:300px;height:300px"></div><div class="blob3d float" style="left:40px;top:40px;width:64px;height:64px"></div></div>
      <div class="pl" data-depth="10">
        <div class="mk cv-letter mk-hover float" style="--d:-2s" data-open><b>Cover Letter</b><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="fx cv-stack">
          <div class="cv-page back2" aria-hidden="true">${cvPage('modern')}</div>
          <div class="cv-page back1" aria-hidden="true" data-tpl="classic">${cvPage('classic')}</div>
          <div class="cv-page cv-front" data-tpl="modern" data-open>${cvPage('modern')}</div>
        </div>
      </div>
      <div class="pl" data-depth="22">
        <div class="fx cv-tabs" role="group" aria-label="CV format preview">
          <button type="button" data-tpl="modern" aria-pressed="true">Modern</button>
          <button type="button" data-tpl="classic" aria-pressed="false">Classic</button>
          <button type="button" data-tpl="creative" aria-pressed="false">Creative</button>
        </div>
        <div class="fx fcard cv-badge float" style="--d:-3s">${icon('check', 18)}<div><b>ATS-friendly layout</b><small>Clear, scannable structure</small></div></div>
      </div>`;
    case 'graphic':
    default: {
      const svcs = s.services || [];
      return `
      <div class="pl" data-depth="-12"><div class="blob3d float" style="left:520px;top:200px;width:70px;height:70px"></div><div class="blob3d violet float" style="left:190px;top:240px;width:46px;height:46px;--d:-3s"></div></div>
      <div class="pl" data-depth="10">
        <div class="mk gd-poster mk-hover" data-gd="poster" data-open><small>SUMMER<br>FESTIVAL</small><span class="sun"></span><b>LIVE<br>SHOW</b></div>
        <div class="mk gd-social mk-hover" data-gd="social" data-open><div class="img"><b>NEW<br>DROP</b></div><div class="meta">${icon('heart', 16)}<i></i></div></div>
        <div class="mk gd-cert mk-hover" data-gd="cert" data-open><div class="frame"><span class="seal"></span><b>CERTIFICATE</b><i></i></div></div>
      </div>
      <div class="pl" data-depth="22">
        <div class="mk gd-card c2 mk-hover float" style="--d:-1s" data-gd="card" data-open><b>CAFÉ</b><div><i></i><i></i></div></div>
        <div class="mk gd-card c1 mk-hover float" style="--d:-3s" data-gd="card" data-open><b>STUDIO</b><div><i></i><i></i></div></div>
        <div class="fx gd-box" data-gd="packaging"><div class="gd-cube"><i>BOX</i><i></i><i></i><i></i><i>✦</i><i></i></div></div>
        <div class="mk gd-flyer mk-hover" data-gd="flyer" data-open><div class="top"></div><b>Grand<br>Opening</b><i></i><i style="width:70%"></i></div>
      </div>
      <div class="gd-carousel">
        <button class="icon-btn gd-prev" type="button" aria-label="Scroll categories left">${icon('chevronLeft', 18)}</button>
        <div class="track" role="group" aria-label="Design categories">
          ${svcs.map(n => `<button type="button" data-k="${gdKey(n)}" aria-pressed="false">${esc(n)}</button>`).join('')}
        </div>
        <button class="icon-btn gd-next" type="button" aria-label="Scroll categories right">${icon('chevronRight', 18)}</button>
      </div>`;
    }
  }
}

function slideHTML(s, i, total) {
  const svcs = s.services || [];
  const show = 6;
  return `
  <article class="slide" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}: ${esc(s.label)}">
    <div class="slide-copy">
      <span class="eyebrow a-in">${esc(s.eyebrow)}</span>
      <h2>${splitWords(s.title, s.highlight)}</h2>
      <p class="desc a-in">${esc(s.description)}</p>
      <div class="slide-svcs a-in">
        ${svcs.slice(0, show).map(n => `<span class="chip">${icon('check', 13)}${esc(n)}</span>`).join('')}
        ${svcs.length > show ? `<a class="chip more" href="${esc(safeUrl(s.ctaLink) || '/services')}">+${svcs.length - show} more</a>` : ''}
      </div>
      <div class="slide-actions a-in">
        <a class="btn btn-primary magnetic" href="${esc(safeUrl(s.ctaLink) || '/portfolio')}">${esc(s.ctaText)} ${icon('arrowRight', 18, 'ic-arrow')}</a>
        <a class="btn btn-wa magnetic" href="${esc(wa(s.waMessage))}" target="_blank" rel="noopener">${icon('whatsapp', 18)} ${esc(s.waText || 'Order on WhatsApp')}</a>
      </div>
    </div>
    <div class="slide-visual" data-parallax>
      <div class="vwrap" data-w="600" data-h="540" data-vh-desk=".66" data-vh-mob=".33"><div class="vbox sv" data-visual="${esc(s.visual)}" data-device="desktop">${visualHTML(s)}</div></div>
    </div>
  </article>`;
}

function xpHTML(slides) {
  return `
  <div class="layer xp" aria-hidden="true" inert>
    <div class="xp-bg" aria-hidden="true">${slides.map((s, i) => `<i data-i="${i}" style="background:linear-gradient(135deg, ${esc(s.bgFrom || 'var(--bg1)')}, ${esc(s.bgTo || 'var(--bg2)')})"></i>`).join('')}</div>
    <div class="wrap xp-top">
      <button class="xp-exit" type="button" id="xp-exit">${icon('arrowLeft', 18)}<span>Back</span></button>
      <div class="xp-count" aria-live="polite"><b id="xp-num">01</b>/ ${pad(slides.length)}</div>
      <div class="xp-name" id="xp-name">${esc(slides[0]?.label || '')}</div>
      <div class="grow"></div>
      <div class="xp-jump" id="xp-jump">
        <button class="icon-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Jump to a service">${icon('grid', 18)}</button>
        <div class="xp-jump-menu" role="menu">${slides.map((s, i) => `<button role="menuitem" type="button" data-go="${i}"><b>${pad(i + 1)}</b>${esc(s.label)}</button>`).join('')}
          <a href="#after-stage" role="menuitem" class="xp-jump-out" style="display:flex;gap:12px;padding:11px 12px;font-weight:600;font-size:14px;color:var(--muted)">${icon('chevronDown', 18)} Explore the rest of the site</a></div>
      </div>
    </div>
    <div class="wrap slides" id="slides" tabindex="0" aria-roledescription="carousel" aria-label="SHAH DESIGNS services">
      ${slides.map((s, i) => slideHTML(s, i, slides.length)).join('')}
    </div>
    <div class="wrap xp-bottom">
      <div class="xp-dots" role="tablist" aria-label="Choose service">
        ${slides.map((s, i) => `<button type="button" role="tab" data-go="${i}" aria-label="${esc(s.label)}"><i></i><span>${esc(s.label)}</span></button>`).join('')}
      </div>
      <span class="xp-hint">${esc(state.data.content.swipe.hint)}</span>
      <div class="xp-arrows">
        <button class="icon-btn prev" type="button" aria-label="Previous service">${icon('arrowLeft')}</button>
        <button class="icon-btn next" type="button" aria-label="Next service">${icon('arrowRight')}</button>
      </div>
    </div>
  </div>`;
}

/* ================= Interactions inside visuals ================= */
function wireVisual(slideEl, s) {
  const cat = s.category;
  const projects = state.data.projects.filter(p => p.category === cat);
  const gallery = projects.flatMap(p => (p.gallery && p.gallery.length ? p.gallery : [p.cover]).filter(Boolean).map(src => ({ src, caption: p.title + (p.sample ? ' — sample concept' : '') })));
  const openCat = (extra) => {
    const items = extra ? [extra, ...gallery] : gallery;
    if (items.length) openModal(items, 0);
    else location.href = safeUrl(s.ctaLink) || '/portfolio';
  };
  $$('[data-open]', slideEl).forEach(el => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', e => { if (!slideEl._dragged) openCat(); });
  });
  // thumbnails → detailed preview
  $$('.th[role="button"]', slideEl).forEach(th => {
    const open = () => {
      const clone = th.cloneNode(true);
      clone.removeAttribute('tabindex'); clone.removeAttribute('role');
      clone.style.cssText = 'position:relative;left:auto;top:auto;width:min(960px,90vw);transform:none;cursor:default;font-size:2.4em;outline:none';
      clone.querySelector('.big').style.fontSize = 'clamp(40px,7vw,86px)';
      openCat({ html: clone.outerHTML, caption: 'Thumbnail preview — designed at 1280×720' });
    };
    th.addEventListener('click', () => { if (!slideEl._dragged) open(); });
    th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  // before / after
  $$('.ba', slideEl).forEach(ba => {
    const input = $('input', ba);
    input.addEventListener('input', () => ba.style.setProperty('--cut', input.value + '%'));
    ba.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = ba.getBoundingClientRect();
      const v = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      ba.style.setProperty('--cut', v + '%'); input.value = v;
    });
  });
  // web device toggle
  $$('.wb-toggle button', slideEl).forEach(b => b.addEventListener('click', () => {
    const sv = $('.sv', slideEl);
    sv.dataset.device = b.dataset.device;
    $$('.wb-toggle button', slideEl).forEach(x => x.setAttribute('aria-pressed', x === b));
  }));
  // CV templates + auto page-flip
  const front = $('.cv-front', slideEl);
  if (front) {
    const tabs = $$('.cv-tabs button', slideEl);
    const order = ['modern', 'classic', 'creative'];
    let auto = true;
    const setTpl = (tpl) => {
      front.classList.add('flip');
      setTimeout(() => {
        front.dataset.tpl = tpl;
        front.innerHTML = cvPage(tpl);
        front.classList.remove('flip');
      }, 420 * (+getComputedStyle(document.documentElement).getPropertyValue('--speed') || 1));
      tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.tpl === tpl));
    };
    tabs.forEach(t => t.addEventListener('click', () => { auto = false; setTpl(t.dataset.tpl); }));
    slideEl._tick = () => {
      if (!auto || document.documentElement.dataset.motion === '0') return;
      const cur = order.indexOf(front.dataset.tpl);
      setTpl(order[(cur + 1) % order.length]);
    };
  }
  // graphic mini-carousel
  const track = $('.gd-carousel .track', slideEl);
  if (track) {
    $('.gd-prev', slideEl).addEventListener('click', () => track.scrollBy({ left: -220 }));
    $('.gd-next', slideEl).addEventListener('click', () => track.scrollBy({ left: 220 }));
    const items = $$('[data-gd]', slideEl);
    $$('button', track).forEach(b => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      $$('button', track).forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', on);
      items.forEach(it => it.classList.toggle('dim', on && b.dataset.k !== 'all' && it.dataset.gd !== b.dataset.k));
      if (on && b.dataset.k !== 'all') {
        const target = items.find(it => it.dataset.gd === b.dataset.k);
        target?.animate([{ scale: 1 }, { scale: 1.08 }, { scale: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    }));
  }
}

/* ================= Transition engine ================= */
function animOpts(d, delay = 0) {
  const sp = +getComputedStyle(document.documentElement).getPropertyValue('--speed') || 1;
  return { duration: d * sp, delay: delay * sp, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' };
}

function parts(slide) {
  return {
    words: $$('h2 .w > span', slide),
    items: $$('.a-in', slide),
    vis: $('.slide-visual', slide),
    kids: $$('.sv > .pl > *, .sv > .gd-carousel', slide),
  };
}

function visualKeyframes(preset, dir, out, strong) {
  const x = (strong ? 160 : 60) * dir * (out ? -1 : 1);
  const blur = strong ? 'blur(10px)' : 'blur(0px)';
  const from = {
    depth: { transform: `translateX(${x}px) scale(${out ? 0.78 : 0.82}) rotateY(${out ? -12 * dir : 12 * dir}deg)`, filter: blur, opacity: 0 },
    slide: { transform: `translateX(${x * 1.8}px)`, filter: 'blur(0px)', opacity: 0 },
    rise: { transform: `translateY(${out ? -80 : 80}px) scale(.94)`, filter: blur, opacity: 0 },
    zoom: { transform: `scale(${out ? 1.18 : 0.7})`, filter: blur, opacity: 0 },
  }[preset] || { transform: `translateX(${x}px)`, opacity: 0 };
  const rest = { transform: 'none', filter: 'blur(0px)', opacity: 1 };
  return out ? [rest, from] : [from, rest];
}

function animateOut(slide, dir, preset) {
  const strong = document.documentElement.dataset.motion === '2';
  const p = parts(slide);
  const anims = [];
  p.items.forEach((el, i) => anims.push(el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-40 * dir}px)` }], animOpts(380, i * 35))));
  p.words.forEach((el, i) => anims.push(el.animate([{ transform: 'none' }, { transform: 'translateY(-110%)' }], animOpts(420, i * 18))));
  if (p.vis) anims.push(p.vis.animate(visualKeyframes(preset, dir, true, strong), animOpts(520)));
  return Promise.all(anims.map(a => a.finished.catch(() => {}))).then(() => anims);
}

function animateIn(slide, dir, preset) {
  const strong = document.documentElement.dataset.motion === '2';
  const p = parts(slide);
  const anims = [];
  if (p.vis) anims.push(p.vis.animate(visualKeyframes(preset, dir, false, strong), animOpts(900)));
  p.kids.forEach((el, i) => anims.push(el.animate([{ opacity: 0, translate: `0 ${strong ? 50 : 20}px` }, { opacity: 1, translate: '0 0' }], animOpts(900, 140 + i * 55))));
  p.words.forEach((el, i) => anims.push(el.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], animOpts(800, 120 + i * 45))));
  p.items.forEach((el, i) => anims.push(el.animate([{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], animOpts(800, 260 + i * 80))));
  return Promise.all(anims.map(a => a.finished.catch(() => {}))).then(() => anims.forEach(a => a.cancel()));
}

/* ================= Controller ================= */
export function initStage(root) {
  const slides = [...state.data.slides].filter(s => s.published !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!slides.length) { root.remove(); return; }
  root.innerHTML = heroHTML(slides) + xpHTML(slides);
  const loop = state.data.content.swipe.loop !== false;
  const hero = $('.hero', root), xp = $('.xp', root), track = $('#slides', root);
  const slideEls = $$('.slide', root), bgEls = $$('.xp-bg i', root), dots = $$('.xp-dots button', root);
  const prevBtn = $('.xp-arrows .prev', root), nextBtn = $('.xp-arrows .next', root);
  const jump = $('#xp-jump', root), jumpBtn = $('button', jump);
  let index = 0, busy = false, queued = null, tickTimer = null;

  slideEls.forEach((el, i) => wireVisual(el, slides[i]));
  parallax($('.hero-visual', root));
  slideEls.forEach(el => parallax($('.slide-visual', el)));
  magnetic(root);

  function updateUI() {
    $('#xp-num', root).textContent = pad(index + 1);
    $('#xp-name', root).textContent = slides[index].label;
    dots.forEach((d, i) => { d.setAttribute('aria-current', i === index); d.setAttribute('aria-selected', i === index); d.classList.toggle('done', i < index); });
    $$('.xp-jump-menu [data-go]', root).forEach((b, i) => b.setAttribute('aria-current', i === index));
    bgEls.forEach((b, i) => b.classList.toggle('on', i === index));
    prevBtn.disabled = !loop && index === 0;
    nextBtn.disabled = !loop && index === slides.length - 1;
    slideEls.forEach((el, i) => { el.classList.toggle('active', i === index); el.setAttribute('aria-hidden', i !== index); el.inert = i !== index; });
    clearInterval(tickTimer);
    const cur = slideEls[index];
    if (cur._tick) tickTimer = setInterval(cur._tick, 3800);
  }

  async function go(to, dir) {
    const n = slides.length;
    if (!loop && (to < 0 || to >= n)) { bump(dir); return; }
    to = (to + n) % n;
    if (to === index) return;
    if (busy) { queued = [to, dir]; return; }
    busy = true;
    dir = dir || (to > index ? 1 : -1);
    const from = slideEls[index], next = slideEls[to];
    const motion = document.documentElement.dataset.motion;
    if (motion === '0') { index = to; updateUI(); busy = false; return; }
    const outAnims = await animateOut(from, dir, slides[index].animation);
    index = to;
    updateUI();
    outAnims.forEach(a => a.cancel());
    fitBoxes();
    await animateIn(next, dir, slides[to].animation);
    busy = false;
    if (queued) { const q = queued; queued = null; go(q[0], q[1]); }
  }
  const next = () => go(index + 1, 1);
  const prev = () => go(index - 1, -1);

  function bump(dir) {
    const v = $('.sv', slideEls[index]);
    v?.animate([{ translate: '0 0' }, { translate: `${-24 * dir}px 0` }, { translate: '0 0' }], { duration: 380, easing: 'ease-out' });
  }

  /* --- enter / exit --- */
  function enter(i = 0) {
    root.dataset.mode = 'xp';
    hero.setAttribute('aria-hidden', 'true'); hero.inert = true;
    xp.setAttribute('aria-hidden', 'false'); xp.inert = false;
    document.body.classList.add('xp-active');
    const r = root.getBoundingClientRect();
    if (Math.abs(r.top) > 4) scrollTo({ top: scrollY + r.top, behavior: 'smooth' });
    const prevIndex = index;
    index = i;
    updateUI();
    fitBoxes();
    if (document.documentElement.dataset.motion !== '0') animateIn(slideEls[i], i >= prevIndex ? 1 : -1, slides[i].animation);
    setTimeout(() => track.focus({ preventScroll: true }), 50);
  }
  function exit() {
    root.dataset.mode = 'hero';
    xp.setAttribute('aria-hidden', 'true'); xp.inert = true;
    hero.setAttribute('aria-hidden', 'false'); hero.inert = false;
    document.body.classList.remove('xp-active');
    clearInterval(tickTimer);
    resetPill();
    setTimeout(() => $('.knob', root)?.focus({ preventScroll: true }), 60);
  }

  $('#xp-exit', root).addEventListener('click', exit);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  $$('.svc-pills [data-go]', root).forEach(b => b.addEventListener('click', () => enter(+b.dataset.go)));
  jumpBtn.addEventListener('click', () => { const o = !jump.classList.contains('open'); jump.classList.toggle('open', o); jumpBtn.setAttribute('aria-expanded', o); });
  $$('.xp-jump-menu [data-go]', root).forEach(b => b.addEventListener('click', () => { jump.classList.remove('open'); jumpBtn.setAttribute('aria-expanded', false); go(+b.dataset.go); }));
  $('.xp-jump-out', root).addEventListener('click', () => jump.classList.remove('open'));
  document.addEventListener('click', e => { if (!jump.contains(e.target)) { jump.classList.remove('open'); jumpBtn.setAttribute('aria-expanded', false); } });

  /* --- keyboard --- */
  addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const r = root.getBoundingClientRect();
    if (r.bottom < innerHeight * 0.3 || r.top > innerHeight * 0.7) return;
    if (document.querySelector('.modal.open')) return;
    if (root.dataset.mode === 'xp') {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Escape') exit();
      else if (e.key === 'Home') go(0); else if (e.key === 'End') go(slides.length - 1);
    } else if (e.key === 'ArrowRight' && !e.target.closest?.('a, button')) enter(0);
  });

  /* --- drag / swipe on slides --- */
  let sx = 0, sy = 0, dx = 0, t0 = 0, dragging = false, locked = null, pid = null;
  const ignore = t => t.closest('a, button, input, select, textarea, .ba, .gd-carousel, .th');
  track.addEventListener('pointerdown', e => {
    if (e.button !== 0 || busy || ignore(e.target)) return;
    sx = e.clientX; sy = e.clientY; dx = 0; t0 = performance.now(); dragging = true; locked = null; pid = e.pointerId;
    slideEls[index]._dragged = false;
  });
  track.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== pid) return;
    const mx = e.clientX - sx, my = e.clientY - sy;
    if (locked === null && Math.hypot(mx, my) > 8) {
      locked = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (locked === 'x') { try { track.setPointerCapture(pid); } catch { /* ignore */ } track.classList.add('dragging'); slideEls[index]._dragged = true; }
    }
    if (locked !== 'x') return;
    dx = mx;
    const cur = slideEls[index];
    const damp = (!loop && ((index === 0 && dx > 0) || (index === slides.length - 1 && dx < 0))) ? 0.2 : 0.55;
    $('.slide-copy', cur).style.transform = `translateX(${dx * damp * 0.5}px)`;
    $('.slide-visual', cur).style.transform = `translateX(${dx * damp}px) rotate(${dx * 0.006}deg)`;
  });
  const end = e => {
    if (!dragging || (e && e.pointerId !== pid)) return;
    dragging = false;
    track.classList.remove('dragging');
    const cur = slideEls[index];
    const copy = $('.slide-copy', cur), vis = $('.slide-visual', cur);
    if (locked === 'x') {
      const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      const threshold = Math.min(120, track.clientWidth * 0.14);
      const reset = () => { [copy, vis].forEach(el => { el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; setTimeout(() => (el.style.transition = ''), 500); }); };
      if (Math.abs(dx) > threshold || v > 0.55) { copy.style.transform = vis.style.transform = ''; dx < 0 ? next() : prev(); }
      else reset();
      setTimeout(() => { cur._dragged = false; }, 60);
    }
    locked = null;
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
  track.addEventListener('lostpointercapture', end);
  track.addEventListener('click', e => { if (slideEls[index]._dragged) { e.preventDefault(); e.stopPropagation(); } }, true);

  /* --- hero: swipe pill + swipe-left gesture --- */
  const pill = $('#swipe-pill', root), knob = $('.knob', pill), fill = $('.fill', pill);
  let kx = 0, kStart = 0, kDrag = false, kMoved = false;
  const maxX = () => pill.clientWidth - knob.offsetWidth - 12;
  function setKnob(x) { kx = x; knob.style.transform = `translateX(${x}px)`; fill.style.width = `${x + 66}px`; }
  function resetPill() { pill.classList.add('snap'); setKnob(0); setTimeout(() => pill.classList.remove('snap'), 450); }
  knob.addEventListener('pointerdown', e => { kDrag = true; kMoved = false; kStart = e.clientX - kx; knob.setPointerCapture(e.pointerId); pill.classList.remove('snap'); });
  knob.addEventListener('pointermove', e => {
    if (!kDrag) return;
    const x = Math.max(0, Math.min(maxX(), e.clientX - kStart));
    if (Math.abs(x - kx) > 2) kMoved = true;
    setKnob(x);
  });
  knob.addEventListener('pointerup', () => {
    if (!kDrag) return;
    kDrag = false;
    if (!kMoved || kx > maxX() * 0.55) { pill.classList.add('snap'); setKnob(maxX()); setTimeout(() => enter(0), 260); }
    else resetPill();
  });
  knob.addEventListener('pointercancel', () => { kDrag = false; resetPill(); });
  knob.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); enter(0); } });
  knob.addEventListener('click', e => { if (e.detail === 0) enter(0); }); // keyboard Enter/Space
  pill.addEventListener('click', e => { if (e.target === pill || e.target.closest('.track-label')) enter(0); });

  // horizontal swipe on hero (touch) also opens the experience
  let hx = 0, hy = 0, hTracking = false;
  hero.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || e.target.closest('a, button, .swipe-pill')) return; hx = e.clientX; hy = e.clientY; hTracking = true; });
  hero.addEventListener('pointerup', e => {
    if (!hTracking) return; hTracking = false;
    const mx = e.clientX - hx, my = e.clientY - hy;
    if (mx < -70 && Math.abs(mx) > Math.abs(my) * 1.4) enter(0);
  });

  updateUI();
  root.dataset.mode = 'hero';
  const fromHash = () => { const m = location.hash.match(/^#explore(?:-(\d))?$/); if (m) enter(Math.min(slides.length - 1, Math.max(0, (+m[1] || 1) - 1))); };
  fromHash();
  addEventListener('hashchange', fromHash);
  return { enter, exit, go };
}

/* ================= Rest of home page ================= */
export function initHomeSections(root) {
  const { content, projects, testimonials, categories, design } = state.data;
  const featured = projects.filter(p => p.featured).concat(projects.filter(p => !p.featured)).slice(0, 8);
  const sections = {
    featured: `
      <section class="section" data-sec="featured" aria-labelledby="feat-h">
        <div class="wrap">
          <div class="sec-head"><div><span class="eyebrow reveal">Featured work</span><h2 id="feat-h" class="split">${splitWords('Selected *projects*')}</h2></div>
            <div style="display:flex;gap:10px;align-items:center"><button class="icon-btn" data-hs="-1" aria-label="Scroll left">${icon('arrowLeft')}</button><button class="icon-btn" data-hs="1" aria-label="Scroll right">${icon('arrowRight')}</button><a class="btn btn-dark btn-sm magnetic" href="/portfolio">All projects ${icon('arrowRight', 16, 'ic-arrow')}</a></div></div>
          <div class="h-scroll stagger" id="feat-track">${featured.map(p => projectCard(p, categories)).join('')}</div>
        </div>
      </section>`,
    about: `
      <section class="section" data-sec="about" aria-labelledby="about-h">
        <div class="wrap about-grid">
          <div class="about-photo reveal-mask">${content.about.photo ? `<img src="${esc(content.about.photo)}" alt="${esc(content.about.name)}" loading="lazy">` : `<div class="ph"><div><div class="initials">SD</div><small>Profile photo — add it in Admin → Profile</small></div></div>`}
            <div class="stamp" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="circ" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"/></defs><circle cx="60" cy="60" r="58" fill="var(--primary)"/><text fill="#fff" font-size="11" font-weight="700" letter-spacing="3.2" font-family="var(--font-head)"><textPath href="#circ">SHAH DESIGNS • CREATIVE STUDIO • </textPath></text><path d="M52 60h16M62 54l6 6-6 6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg></div>
          </div>
          <div class="about-copy">
            <span class="eyebrow reveal">About</span>
            <h2 class="split">${splitWords(content.about.intro.length < 70 ? content.about.intro : 'Design that *speaks* for your brand')}</h2>
            <p class="reveal">${esc(content.about.overview)}</p>
            <div class="spec-list stagger">${content.about.specializations.map(s => `<span class="chip">${icon('sparkles', 14)}${esc(s)}</span>`).join('')}</div>
            <a class="btn btn-primary magnetic reveal" href="/about">More about me ${icon('arrowRight', 18, 'ic-arrow')}</a>
          </div>
        </div>
      </section>`,
    process: `
      <section class="section" data-sec="process" aria-labelledby="proc-h">
        <div class="wrap">
          <div class="sec-head"><div><span class="eyebrow reveal">How it works</span><h2 id="proc-h" class="split">${splitWords('A simple *4-step* process')}</h2></div><p class="reveal">Clear steps, regular updates and final files in every format you need.</p></div>
          <div class="process stagger"><span class="line-fill"></span>${content.process.map((s, i) => `<div class="step"><div class="num">${pad(i + 1)}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>
        </div>
      </section>`,
    skills: `
      <section class="section" data-sec="skills" aria-labelledby="skills-h">
        <div class="wrap">
          <div class="sec-head"><div><span class="eyebrow reveal">Toolkit</span><h2 id="skills-h" class="split">${splitWords('Creative *tools* & skills')}</h2></div></div>
          <div class="tools stagger">${content.tools.filter(t => t.visible !== false).map(toolCard).join('')}</div>
          <div class="skills-row stagger">${content.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
        </div>
      </section>`,
    testimonials: testimonials.length ? `
      <section class="section" data-sec="testimonials" aria-labelledby="t-h">
        <div class="wrap t-wrap">
          <div class="sec-head"><div><span class="eyebrow reveal">Kind words</span><h2 id="t-h" class="split">${splitWords('What *clients* say')}</h2></div>
            <div class="t-nav"><button class="icon-btn" data-ts="-1" aria-label="Previous testimonial">${icon('arrowLeft')}</button><button class="icon-btn" data-ts="1" aria-label="Next testimonial">${icon('arrowRight')}</button></div></div>
          <div class="t-track" id="t-track">${testimonials.map(testimonialCard).join('')}</div>
        </div>
      </section>` : '',
    cta: `
      <section class="section" data-sec="cta">
        <div class="wrap"><div class="cta-box reveal"><span class="orb o1"></span><span class="orb o2"></span>
          <span class="eyebrow">Let's work together</span>
          <h2>${esc(content.cta.title)}</h2><p>${esc(content.cta.text)}</p>
          <div class="acts"><a class="btn btn-wa btn-lg magnetic" href="${esc(wa())}" target="_blank" rel="noopener">${icon('whatsapp', 20)} ${esc(content.cta.button)}</a><a class="btn btn-ghost btn-lg" style="color:#fff;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18)" href="/contact">Send project details</a></div>
        </div></div>
      </section>`,
  };
  const order = (design.sections?.order || Object.keys(sections)).filter(k => k in sections);
  Object.keys(sections).forEach(k => { if (!order.includes(k)) order.push(k); });
  const hidden = design.sections?.hidden || [];
  const marquee = `<div class="marquee" aria-hidden="true"><div class="marquee-track">${[...Array(2)].map(() => state.data.slides.map(s => `<span>${esc(s.label)}</span>`).join('')).join('')}</div></div>`;
  root.innerHTML = marquee + order.filter(k => !hidden.includes(k)).map(k => sections[k]).join('');

  $$('[data-hs]', root).forEach(b => b.addEventListener('click', () => $('#feat-track', root).scrollBy({ left: +b.dataset.hs * 460, behavior: 'smooth' })));
  $$('[data-ts]', root).forEach(b => b.addEventListener('click', () => $('#t-track', root).scrollBy({ left: +b.dataset.ts * 540, behavior: 'smooth' })));
}

export function projectCard(p, categories) {
  const cat = (categories.find(c => c.key === p.category) || {}).label || p.category;
  return `<a class="pcard" href="/portfolio/${esc(p.slug)}" data-cat="${esc(p.category)}">
    <div class="pimg">${p.sample ? `<span class="badge sample">${icon('sparkles', 12)} Sample concept</span>` : ''}${p.video ? `<span class="badge vid">${icon('play', 12)} Video</span>` : ''}
      <img src="${esc(p.cover || '/assets/img/placeholder.svg')}" alt="${esc(p.title)}" loading="lazy" decoding="async"></div>
    <div class="pbody"><div><h3>${esc(p.title)}</h3><small>${esc(cat)}</small></div><span class="go">${icon('arrowUpRight', 18)}</span></div>
  </a>`;
}

export function toolCard(t) {
  return `<div class="tool"><span class="logo-sq" style="background:${esc(t.bg || 'var(--navy)')};color:${esc(t.color || '#fff')}">${esc(t.short || t.name.slice(0, 2))}</span><b>${esc(t.name)}</b></div>`;
}

export function testimonialCard(t) {
  const initials = (t.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rating = Math.max(0, Math.min(5, +t.rating || 0));
  return `<figure class="tcard">
    <span class="q">${icon('quote', 30)}</span>
    ${rating ? `<div class="stars" aria-label="${rating} out of 5">${Array.from({ length: rating }, () => icon('star', 16)).join('')}</div>` : ''}
    <blockquote style="margin:0"><p>${esc(t.review)}</p></blockquote>
    <figcaption class="who">${t.photo ? `<img src="${esc(t.photo)}" alt="" loading="lazy">` : `<span class="av">${esc(initials)}</span>`}
      <div><b>${esc(t.name)}</b><small>${esc([t.company, t.project].filter(Boolean).join(' · '))}</small></div></figcaption>
  </figure>`;
}

export { markHl };
