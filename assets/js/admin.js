/* ------------------------------------------------------------------
   SHAH DESIGNS — Admin dashboard (Appwrite-backed CMS)
   Every action below calls Appwrite. Access is enforced server-side
   by collection/bucket permissions granted only to the "admins" team.
------------------------------------------------------------------- */
import { CONFIG } from './config.js';
import { auth, db, storage, call, Q, isConfigured, unpack, pack, INDEXED, clearSiteCache, deepMerge } from './api.js';
import * as D from './defaults.js';
import { esc, icon, slugify, toast, waLink, ICON_NAMES, videoInfo } from './ui.js';

const C = CONFIG.collections;
const app = document.getElementById('app');
const S = { user: null, unread: 0, mediaCache: null };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const clone = o => JSON.parse(JSON.stringify(o));
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, p, v) => { const ks = p.split('.'); let c = o; ks.slice(0, -1).forEach(k => { if (typeof c[k] !== 'object' || c[k] === null) c[k] = {}; c = c[k]; }); c[ks.at(-1)] = v; };
const fmtDate = d => d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const errMsg = e => e.code === 401 ? 'Your session expired or you lack permission — please sign in again.' : (e.message || 'Something went wrong');
const PUB_PERMS = ['read("any")'];

/* ================================================================
   UI primitives: modal, confirm, drawer
   ================================================================ */
function modal({ title, body, foot = '', size = '' }) {
  const wrap = el(`<div class="modal-wrap" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal ${size}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="Close">${icon('x', 18)}</button></div>
    <div class="modal-body"></div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div></div>`);
  const b = $('.modal-body', wrap);
  typeof body === 'string' ? (b.innerHTML = body) : b.appendChild(body);
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('[data-x]', wrap).addEventListener('click', close);
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
  return { wrap, body: b, close };
}

function confirmBox(text, { ok = 'Delete', danger = true } = {}) {
  return new Promise(res => {
    const m = modal({ title: 'Please confirm', body: `<p>${esc(text)}</p>`, foot: `<button class="btn btn-ghost" data-c>Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(ok)}</button>` });
    let done = false;
    const fin = v => { if (done) return; done = true; m.close(); res(v); };
    $('[data-c]', m.wrap).onclick = () => fin(false);
    $('[data-ok]', m.wrap).onclick = () => fin(true);
    $('[data-x]', m.wrap).addEventListener('click', () => fin(false));
    $('[data-ok]', m.wrap).focus();
  });
}

function drawer(title) {
  const wrap = el(`<div class="drawer-wrap"><div class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="drawer-head"><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="Close">${icon('x', 18)}</button></div>
    <div class="drawer-body"></div><div class="drawer-foot"></div></div></div>`);
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('open'));
  let dirty = false;
  const close = async (force) => {
    if (dirty && !force && !(await confirmBox('Discard unsaved changes?', { ok: 'Discard' }))) return;
    wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 300); document.removeEventListener('keydown', onKey);
  };
  const onKey = e => { if (e.key === 'Escape' && !document.querySelector('.modal-wrap')) close(); };
  document.addEventListener('keydown', onKey);
  $('[data-x]', wrap).onclick = () => close();
  wrap.addEventListener('mousedown', e => { if (e.target === wrap) close(); });
  const body = $('.drawer-body', wrap);
  body.addEventListener('input', () => { dirty = true; });
  return { wrap, body, foot: $('.drawer-foot', wrap), close, clean: () => { dirty = false; } };
}

function busy(btn, on, label) {
  if (on) { btn._label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin${btn.classList.contains('btn-ghost') ? ' dark' : ''}"></span>${label ? ' ' + esc(label) : ''}`; }
  else { btn.disabled = false; if (btn._label) btn.innerHTML = btn._label; }
}

/* ================================================================
   Media: validation, upload, picker
   ================================================================ */
const ACCEPT = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  video: ['video/mp4', 'video/webm'],
  document: ['application/pdf'],
};
const MAX = { image: 15, video: 50, document: 15 }; // MB — keep in sync with the bucket limit
const kindOf = mime => Object.keys(ACCEPT).find(k => ACCEPT[k].includes(mime));

function validateFile(f, allowed) {
  const kind = kindOf(f.type);
  if (!kind || (allowed && !allowed.includes(kind))) return `${f.name}: file type not allowed (${f.type || 'unknown'}).`;
  if (f.size > MAX[kind] * 1048576) return `${f.name}: too large (max ${MAX[kind]} MB for ${kind}s).`;
  return null;
}

async function uploadFiles(files, { category = 'general', allowed, onProgress } = {}) {
  const out = [];
  for (const [i, f] of [...files].entries()) {
    const bad = validateFile(f, allowed);
    if (bad) { toast(bad, 'err'); continue; }
    try {
      const file = await storage.upload(f, p => onProgress && onProgress((i + p) / files.length, f));
      const url = storage.url(file.$id);
      const doc = await db.create(C.media, { name: f.name.slice(0, 200), fileId: file.$id, url, category: category.slice(0, 60), kind: kindOf(f.type), mime: f.type, size: f.size });
      out.push(unpack(doc));
    } catch (e) { toast(`${f.name}: ${errMsg(e)}`, 'err'); }
  }
  S.mediaCache = null;
  return out;
}

async function loadMedia(force) {
  if (S.mediaCache && !force) return S.mediaCache;
  S.mediaCache = (await db.all(C.media, [Q.orderDesc('$createdAt')])).map(unpack);
  return S.mediaCache;
}

function dropzone({ multiple = true, allowed, category = () => 'general', onDone, label = 'Drop files here or click to upload' }) {
  const accept = (allowed || Object.keys(ACCEPT)).flatMap(k => ACCEPT[k]).join(',');
  const z = el(`<div class="dropzone" tabindex="0" role="button" aria-label="${esc(label)}">${icon('upload', 26)}<div style="margin-top:8px"><b>${esc(label)}</b></div>
    <small>${(allowed || ['image', 'video', 'document']).map(k => `${k}s ≤ ${MAX[k]} MB`).join(' · ')}</small><input type="file" hidden ${multiple ? 'multiple' : ''} accept="${accept}"><div class="progress-bar hidden"><i></i></div></div>`);
  const input = $('input', z), bar = $('.progress-bar', z);
  const go = async files => {
    if (!files.length) return;
    bar.classList.remove('hidden');
    const res = await uploadFiles(files, { category: category(), allowed, onProgress: p => ($('i', bar).style.width = Math.round(p * 100) + '%') });
    $('i', bar).style.width = '100%';
    setTimeout(() => { bar.classList.add('hidden'); $('i', bar).style.width = '0'; }, 600);
    if (res.length) { toast(`Uploaded ${res.length} file${res.length > 1 ? 's' : ''}`); onDone && onDone(res); }
  };
  z.addEventListener('click', e => { if (e.target !== input) input.click(); });
  z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  input.addEventListener('change', () => { go(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => z.addEventListener(ev, e => { e.preventDefault(); z.classList.remove('over'); }));
  z.addEventListener('drop', e => go(e.dataTransfer.files));
  return z;
}

const mediaPreview = m => m.kind === 'video' ? `<video src="${esc(m.url)}" muted preload="metadata"></video>` : m.kind === 'document' ? icon('file', 28) : '';

/** Opens the media library to choose one or many files. Resolves with an array of URLs. */
function pickMedia({ multiple = false, kinds = ['image'] } = {}) {
  return new Promise(async res => {
    const body = el(`<div class="stack"><div class="toolbar" style="margin:0"><div class="search">${icon('search', 18)}<input placeholder="Search files…" data-s></div><div class="grow"></div><input class="select-sm" placeholder="Category for uploads" data-cat value="general" style="width:180px"></div><div data-dz></div><div class="mgrid" data-grid><div class="skeleton"></div></div></div>`);
    const m = modal({ title: multiple ? 'Choose files' : 'Choose a file', body, size: 'lg', foot: `<span class="muted" data-n style="margin-right:auto;font-size:13px"></span><button class="btn btn-ghost" data-c>Cancel</button><button class="btn btn-primary" data-ok disabled>Use selected</button>` });
    const sel = new Set();
    let items = [];
    const paint = () => {
      const q = $('[data-s]', body).value.toLowerCase();
      const list = items.filter(x => kinds.includes(x.kind) && (!q || (x.name + ' ' + x.category).toLowerCase().includes(q)));
      $('[data-grid]', body).innerHTML = list.length ? list.map(x => `<button type="button" class="mitem ${sel.has(x.url) ? 'sel' : ''}" data-u="${esc(x.url)}"><div class="mprev" style="${x.kind === 'image' ? `background-image:url('${esc(x.url)}')` : ''}">${mediaPreview(x)}</div><div class="minfo"><b>${esc(x.name)}</b><small>${esc(x.category)} · ${fmtSize(x.size || 0)}</small></div></button>`).join('')
        : `<div class="empty" style="grid-column:1/-1">${icon('image', 30)}No files yet — upload above.</div>`;
      $('[data-n]', m.wrap).textContent = sel.size ? `${sel.size} selected` : '';
      $('[data-ok]', m.wrap).disabled = !sel.size;
    };
    $('[data-dz]', body).appendChild(dropzone({ allowed: kinds, category: () => $('[data-cat]', body).value || 'general', onDone: async up => { items = await loadMedia(true); if (!multiple) sel.clear(); up.forEach(u => sel.add(u.url)); paint(); } }));
    $('[data-s]', body).addEventListener('input', paint);
    $('[data-grid]', body).addEventListener('click', e => {
      const b = e.target.closest('[data-u]'); if (!b) return;
      const u = b.dataset.u;
      if (!multiple) sel.clear();
      sel.has(u) ? sel.delete(u) : sel.add(u);
      paint();
    });
    $('[data-grid]', body).addEventListener('dblclick', e => { const b = e.target.closest('[data-u]'); if (b && !multiple) { m.close(); res([b.dataset.u]); } });
    let done = false;
    $('[data-c]', m.wrap).onclick = () => { done = true; m.close(); res([]); };
    $('[data-ok]', m.wrap).onclick = () => { done = true; m.close(); res([...sel]); };
    $('[data-x]', m.wrap).addEventListener('click', () => { if (!done) res([]); });
    try { items = await loadMedia(); paint(); } catch (e) { $('[data-grid]', body).innerHTML = `<div class="alert alert-err">${esc(errMsg(e))}</div>`; }
  });
}

/* ================================================================
   Form builder
   field: { key, label, type, hint, options, full, placeholder, rows, fields(sub), min, max, step, from(slug source), kinds }
   ================================================================ */
function buildForm(schema, values) {
  const v = clone(values || {});
  const root = el('<div class="grid2"></div>');
  const getters = [];
  const listeners = [];
  const changed = () => listeners.forEach(f => f(v));

  const opt = o => Array.isArray(o) ? o : [o, o];
  for (const f of schema) {
    if (f.type === 'section') { root.appendChild(el(`<h4 class="full" style="margin:10px 0 -4px;font-size:.95rem">${esc(f.label)}</h4>`)); continue; }
    const wrap = el(`<div class="fld ${f.full || ['textarea', 'images', 'lines', 'repeat', 'tags'].includes(f.type) ? 'full' : ''}"></div>`);
    const id = 'f_' + f.key.replace(/\W/g, '_') + '_' + Math.random().toString(36).slice(2, 6);
    const lbl = `<label for="${id}">${esc(f.label)}${f.hint ? ` <span class="hint">${esc(f.hint)}</span>` : ''}</label>`;
    const cur = getPath(v, f.key);
    const set = val => { setPath(v, f.key, val); changed(); };

    switch (f.type) {
      case 'textarea':
        wrap.innerHTML = lbl + `<textarea id="${id}" rows="${f.rows || 4}" placeholder="${esc(f.placeholder || '')}" maxlength="${f.max || 20000}">${esc(cur ?? '')}</textarea>`;
        $('textarea', wrap).addEventListener('input', e => set(e.target.value));
        break;
      case 'lines':
        wrap.innerHTML = lbl.replace('</label>', ' <span class="hint">one per line</span></label>') + `<textarea id="${id}" rows="${f.rows || 5}">${esc((cur || []).join('\n'))}</textarea>`;
        $('textarea', wrap).addEventListener('input', e => set(e.target.value.split('\n').map(s => s.trim()).filter(Boolean)));
        break;
      case 'select':
        wrap.innerHTML = lbl + `<select id="${id}">${(f.options || []).map(o => { const [val, l] = opt(o); return `<option value="${esc(val)}" ${String(cur) === String(val) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
        $('select', wrap).addEventListener('change', e => set(e.target.value));
        break;
      case 'icon':
        wrap.innerHTML = lbl + `<div style="display:flex;gap:10px;align-items:center"><span class="avatar" style="border-radius:12px" data-p>${icon(cur || 'sparkles', 18)}</span><select id="${id}">${ICON_NAMES.map(n => `<option ${n === cur ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
        $('select', wrap).addEventListener('change', e => { set(e.target.value); $('[data-p]', wrap).innerHTML = icon(e.target.value, 18); });
        break;
      case 'toggle':
        wrap.innerHTML = `<span class="lbl">${esc(f.label)}</span><label class="switch"><input type="checkbox" id="${id}" ${cur ? 'checked' : ''}><span class="t"></span><span>${esc(f.hint || '')}</span></label>`;
        $('input', wrap).addEventListener('change', e => set(e.target.checked));
        break;
      case 'number':
        wrap.innerHTML = lbl + `<input id="${id}" type="number" value="${esc(cur ?? '')}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} step="${f.step || 1}">`;
        $('input', wrap).addEventListener('input', e => set(e.target.value === '' ? '' : +e.target.value));
        break;
      case 'range':
        wrap.innerHTML = `<label for="${id}">${esc(f.label)} <span class="hint" data-o>${cur ?? ''}${f.unit || ''}</span></label><input id="${id}" type="range" value="${esc(cur ?? f.min ?? 0)}" min="${f.min}" max="${f.max}" step="${f.step || 1}">`;
        $('input', wrap).addEventListener('input', e => { set(+e.target.value); $('[data-o]', wrap).textContent = e.target.value + (f.unit || ''); });
        break;
      case 'color':
        wrap.innerHTML = lbl + `<div class="color-row"><input type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#2455FF')}" aria-label="${esc(f.label)} picker"><input id="${id}" type="text" value="${esc(cur ?? '')}" maxlength="7" placeholder="#2455FF"></div>`;
        {
          const [pk, tx] = $$('input', wrap);
          pk.addEventListener('input', () => { tx.value = pk.value.toUpperCase(); set(tx.value); });
          tx.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(tx.value)) { pk.value = tx.value; set(tx.value.toUpperCase()); } else if (!tx.value) set(''); });
        }
        break;
      case 'tags': {
        wrap.innerHTML = lbl + `<div class="tags"><input id="${id}" placeholder="Type and press Enter"></div>`;
        const box = $('.tags', wrap), inp = $('input', wrap);
        let arr = Array.isArray(cur) ? [...cur] : [];
        const paint = () => { $$('.tag', box).forEach(t => t.remove()); arr.forEach((t, i) => inp.before(el(`<span class="tag">${esc(t)}<button type="button" data-i="${i}" aria-label="Remove ${esc(t)}">${icon('x', 12)}</button></span>`))); set([...arr]); };
        inp.addEventListener('keydown', e => {
          if ((e.key === 'Enter' || e.key === ',') && inp.value.trim()) { e.preventDefault(); arr.push(inp.value.trim().replace(/,$/, '')); inp.value = ''; paint(); }
          else if (e.key === 'Backspace' && !inp.value && arr.length) { arr.pop(); paint(); }
        });
        inp.addEventListener('blur', () => { if (inp.value.trim()) { arr.push(inp.value.trim()); inp.value = ''; paint(); } });
        box.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { arr.splice(+b.dataset.i, 1); paint(); } else inp.focus(); });
        paint();
        break;
      }
      case 'image': case 'video': case 'file': {
        const kinds = f.kinds || (f.type === 'image' ? ['image'] : f.type === 'video' ? ['video'] : ['document']);
        wrap.innerHTML = lbl + `<div class="media-field"><div class="media-thumb" data-t></div><div class="stack" style="flex:1;min-width:220px;gap:8px">
          <input id="${id}" type="url" placeholder="${f.type === 'video' ? 'Paste a YouTube / Vimeo link, or upload an MP4/WebM' : 'Paste a URL or choose from the library'}" value="${esc(cur || '')}">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-ghost btn-sm" data-pick>${icon('image', 15)} Library</button><button type="button" class="btn btn-ghost btn-sm" data-up>${icon('upload', 15)} Upload</button><button type="button" class="btn btn-ghost btn-sm" data-clear>${icon('x', 15)} Clear</button></div></div></div>
          <input type="file" hidden accept="${kinds.flatMap(k => ACCEPT[k]).join(',')}">`;
        const t = $('[data-t]', wrap), inp = $('input[type="url"]', wrap), file = $('input[type="file"]', wrap);
        const paint = () => {
          const u = inp.value.trim();
          t.className = 'media-thumb' + (u ? ' has' : '');
          t.style.backgroundImage = '';
          t.innerHTML = '';
          if (!u) { t.innerHTML = icon(f.type === 'video' ? 'video' : f.type === 'file' ? 'file' : 'image', 22); return; }
          const vi = f.type === 'video' && videoInfo(u);
          if (vi && vi.type === 'file') t.innerHTML = `<video src="${esc(u)}" muted preload="metadata"></video>`;
          else if (vi && vi.thumb) t.style.backgroundImage = `url('${vi.thumb}')`;
          else if (vi) t.innerHTML = icon('play', 22);
          else if (f.type === 'file') t.innerHTML = icon('file', 22);
          else t.style.backgroundImage = `url('${u.replace(/'/g, '%27')}')`;
        };
        inp.addEventListener('input', () => { set(inp.value.trim()); paint(); });
        $('[data-clear]', wrap).onclick = () => { inp.value = ''; set(''); paint(); };
        $('[data-pick]', wrap).onclick = async () => { const [u] = await pickMedia({ kinds }); if (u) { inp.value = u; set(u); paint(); } };
        $('[data-up]', wrap).onclick = () => file.click();
        file.addEventListener('change', async () => {
          const btn = $('[data-up]', wrap); busy(btn, true, 'Uploading');
          const [m] = await uploadFiles(file.files, { category: f.category || 'general', allowed: kinds });
          busy(btn, false); file.value = '';
          if (m) { inp.value = m.url; set(m.url); paint(); }
        });
        paint();
        break;
      }
      case 'images': {
        wrap.innerHTML = lbl.replace('</label>', ' <span class="hint">drag to reorder</span></label>') + `<div class="media-multi" data-m></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px"><button type="button" class="btn btn-ghost btn-sm" data-pick>${icon('image', 15)} Add from library</button><button type="button" class="btn btn-ghost btn-sm" data-up>${icon('upload', 15)} Upload images</button></div><input type="file" hidden multiple accept="${ACCEPT.image.join(',')}">`;
        let arr = Array.isArray(cur) ? [...cur] : [];
        const box = $('[data-m]', wrap), file = $('input[type="file"]', wrap);
        let dragI = null;
        const paint = () => {
          box.innerHTML = arr.length ? arr.map((u, i) => `<div class="media-thumb has" draggable="true" data-i="${i}" style="background-image:url('${esc(u)}')"><button type="button" class="x" data-del="${i}" aria-label="Remove image">${icon('x', 12)}</button></div>`).join('') : '<span class="muted" style="font-size:13px">No images yet.</span>';
          set([...arr]);
        };
        box.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { arr.splice(+b.dataset.del, 1); paint(); } });
        box.addEventListener('dragstart', e => { const t = e.target.closest('[data-i]'); if (t) dragI = +t.dataset.i; });
        box.addEventListener('dragover', e => e.preventDefault());
        box.addEventListener('drop', e => { e.preventDefault(); const t = e.target.closest('[data-i]'); if (t == null || dragI == null) return; const to = +t.dataset.i; const [x] = arr.splice(dragI, 1); arr.splice(to, 0, x); dragI = null; paint(); });
        $('[data-pick]', wrap).onclick = async () => { const us = await pickMedia({ multiple: true }); if (us.length) { arr.push(...us); paint(); } };
        $('[data-up]', wrap).onclick = () => file.click();
        file.addEventListener('change', async () => {
          const btn = $('[data-up]', wrap); busy(btn, true, 'Uploading');
          const up = await uploadFiles(file.files, { category: f.category || 'portfolio', allowed: ['image'] });
          busy(btn, false); file.value = '';
          arr.push(...up.map(m => m.url)); paint();
        });
        paint();
        break;
      }
      case 'repeat': {
        wrap.innerHTML = `<span class="lbl">${esc(f.label)}${f.hint ? ` <span class="hint">${esc(f.hint)}</span>` : ''}</span><div class="stack" data-list style="gap:10px"></div><button type="button" class="btn btn-ghost btn-sm" data-add style="justify-self:start">${icon('plus', 15)} Add ${esc(f.itemLabel || 'item')}</button>`;
        let arr = Array.isArray(cur) ? clone(cur) : [];
        const list = $('[data-list]', wrap);
        const paint = () => {
          list.innerHTML = '';
          arr.forEach((item, i) => {
            const box = el(`<div class="repeat-item"><div class="ri-head">${esc(f.itemLabel || 'Item')} ${i + 1}<span class="grow"></span>
              <button type="button" class="icon-btn" data-up aria-label="Move up" ${i === 0 ? 'disabled' : ''}>${icon('arrowUp', 15)}</button>
              <button type="button" class="icon-btn danger" data-rm aria-label="Remove">${icon('trash', 15)}</button></div></div>`);
            const sub = buildForm(f.fields, item);
            sub.onChange(val => { arr[i] = val; set(clone(arr)); });
            box.appendChild(sub.el);
            $('[data-rm]', box).onclick = () => { arr.splice(i, 1); paint(); set(clone(arr)); };
            $('[data-up]', box).onclick = () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; paint(); set(clone(arr)); };
            list.appendChild(box);
          });
        };
        $('[data-add]', wrap).onclick = () => { arr.push(clone(f.blank || {})); paint(); set(clone(arr)); };
        paint();
        break;
      }
      case 'slug':
        wrap.innerHTML = lbl + `<div style="display:flex;gap:8px"><input id="${id}" value="${esc(cur || '')}" maxlength="80" pattern="[a-z0-9-]+"><button type="button" class="btn btn-ghost btn-sm" style="height:44px" data-gen title="Generate from title">${icon('refresh', 15)}</button></div>`;
        {
          const inp = $('input', wrap);
          inp.addEventListener('input', () => set(slugify(inp.value)));
          inp.addEventListener('blur', () => { inp.value = slugify(inp.value); set(inp.value); });
          $('[data-gen]', wrap).onclick = () => { inp.value = slugify(getPath(v, f.from) || ''); set(inp.value); };
          wrap._autoslug = inp;
        }
        break;
      default:
        wrap.innerHTML = lbl + `<input id="${id}" type="${f.type === 'url' ? 'url' : f.type === 'email' ? 'email' : 'text'}" value="${esc(cur ?? '')}" placeholder="${esc(f.placeholder || '')}" maxlength="${f.max || 500}">`;
        $('input', wrap).addEventListener('input', e => set(e.target.value));
    }
    root.appendChild(wrap);
  }
  // auto-slug: fill slug from source while slug is empty / untouched
  const slugField = schema.find(f => f.type === 'slug');
  if (slugField) {
    const inp = $$('.fld', root).map(w => w._autoslug).find(Boolean);
    let touched = !!getPath(v, slugField.key);
    inp?.addEventListener('input', () => { touched = true; });
    listeners.push(val => { if (!touched && inp) { const s = slugify(getPath(val, slugField.from) || ''); if (inp.value !== s) { inp.value = s; setPath(v, slugField.key, s); } } });
  }
  return { el: root, get: () => clone(v), onChange: fn => listeners.push(fn) };
}

/* ================================================================
   Settings documents (design, whatsapp, content, social, seo)
   Stored as { data: published JSON, draft: draft JSON }
   ================================================================ */
const SETTING_DEFAULTS = { design: D.DESIGN, whatsapp: D.WHATSAPP, content: D.CONTENT, social: D.SOCIAL, seo: D.SEO };

async function readSetting(key) {
  try {
    const doc = await db.get(C.settings, key);
    const pub = JSON.parse(doc.data || '{}');
    const draft = doc.draft ? JSON.parse(doc.draft) : null;
    return { exists: true, published: deepMerge(SETTING_DEFAULTS[key], pub), draft: draft ? deepMerge(SETTING_DEFAULTS[key], draft) : null, updated: doc.$updatedAt };
  } catch (e) {
    if (e.code === 404) return { exists: false, published: clone(SETTING_DEFAULTS[key]), draft: null };
    throw e;
  }
}

async function writeSetting(key, value, { publish }) {
  const json = JSON.stringify(value);
  const data = publish ? { data: json, draft: '' } : { draft: json };
  try { await db.update(C.settings, key, data); }
  catch (e) {
    if (e.code !== 404) throw e;
    await db.create(C.settings, publish ? { data: json, draft: '' } : { data: JSON.stringify(SETTING_DEFAULTS[key]), draft: json }, undefined, key);
  }
  clearSiteCache();
}

/* ================================================================
   Live preview (same-origin iframe, shares sessionStorage)
   ================================================================ */
function setPreview(over) {
  try { const cur = JSON.parse(sessionStorage.getItem('shah_preview') || '{}'); sessionStorage.setItem('shah_preview', JSON.stringify({ ...cur, ...over })); } catch { /* ignore */ }
}
function clearPreview() { try { sessionStorage.removeItem('shah_preview'); } catch { /* ignore */ } }

function previewModal(path, over) {
  clearPreview(); setPreview(over);
  const body = el(`<div class="preview-frame" style="height:100%;display:flex;flex-direction:column;box-shadow:none;border:0;border-radius:0"><div class="preview-bar"><i></i><i></i><i></i><span class="grow muted" style="font-size:12px">Preview — not published yet</span>
    <div class="seg"><button aria-pressed="true" data-d="d">${icon('monitor', 14)}</button><button aria-pressed="false" data-d="m">${icon('smartphone', 14)}</button></div></div>
    <div style="flex:1;display:flex;justify-content:center;background:#E4E7F2"><iframe title="Site preview" src="${esc(path)}" style="width:100%;height:100%;border:0;background:#fff"></iframe></div></div>`);
  const m = modal({ title: 'Live preview', body, size: 'xl' });
  m.body.style.cssText = 'padding:0;flex:1;display:flex;flex-direction:column';
  $$('[data-d]', body).forEach(b => b.onclick = () => { $$('[data-d]', body).forEach(x => x.setAttribute('aria-pressed', x === b)); $('iframe', body).style.width = b.dataset.d === 'm' ? '400px' : '100%'; });
}

/* ================================================================
   Generic collection manager
   ================================================================ */
function collectionPage(cfg) {
  return async (view) => {
    const { col, schema, meta, blank, seed, singular } = cfg;
    view.innerHTML = `
      ${cfg.intro ? `<div class="alert alert-info" style="margin-bottom:16px">${icon('sparkles', 16)}<span>${cfg.intro}</span></div>` : ''}
      <div class="toolbar">
        <div class="search">${icon('search', 18)}<input placeholder="Search ${esc(cfg.plural)}…" data-s></div>
        <select class="select-sm" data-f><option value="all">All</option><option value="pub">Published</option><option value="draft">Drafts / hidden</option>${cfg.filters || ''}</select>
        <div class="grow"></div>
        ${cfg.previewPath ? `<button class="btn btn-ghost" data-prev>${icon('eye', 16)} Preview</button>` : ''}
        <button class="btn btn-primary" data-new>${icon('plus', 16)} New ${esc(singular)}</button>
      </div>
      <div class="card"><div class="rows" data-rows>${'<div class="skeleton"></div>'.repeat(4)}</div></div>`;
    let items = [];
    const rows = $('[data-rows]', view);

    async function load() {
      try {
        items = (await db.all(col, [Q.orderAsc('order')])).map(unpack);
        paint();
      } catch (e) { rows.innerHTML = `<div class="empty">${icon('x', 30)}<p>${esc(errMsg(e))}</p></div>`; }
    }

    function paint() {
      const q = $('[data-s]', view).value.toLowerCase();
      const f = $('[data-f]', view).value;
      const list = items.filter(it => {
        if (f === 'pub' && !it.published) return false;
        if (f === 'draft' && it.published) return false;
        if (f.startsWith('cat:') && it.category !== f.slice(4)) return false;
        return !q || JSON.stringify(it).toLowerCase().includes(q);
      });
      if (!items.length) {
        rows.innerHTML = `<div class="empty">${icon(cfg.icon || 'folder', 34)}<p>No ${esc(cfg.plural)} in the database yet.</p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px"><button class="btn btn-primary" data-new2>${icon('plus', 16)} Add ${esc(singular)}</button>${seed ? `<button class="btn btn-ghost" data-seed>${icon('download', 16)} ${esc(cfg.seedLabel || 'Import defaults')}</button>` : ''}</div></div>`;
        $('[data-new2]', rows).onclick = () => edit(null);
        if (seed) $('[data-seed]', rows).onclick = async e => {
          busy(e.target.closest('button'), true, 'Importing');
          try { for (const [i, s] of seed().entries()) await save({ ...s, order: i + 1 }, null, true); toast('Imported'); await load(); }
          catch (er) { toast(errMsg(er), 'err'); busy(e.target.closest('button'), false); }
        };
        return;
      }
      const canDrag = !q && f === 'all';
      rows.innerHTML = list.length ? list.map((it) => {
        const m = meta(it);
        return `<div class="row" data-id="${esc(it.$id)}" ${canDrag ? 'draggable="true"' : ''}>
          <span class="handle" title="${canDrag ? 'Drag to reorder' : 'Clear filters to reorder'}">${icon('drag', 16)}</span>
          <span class="thumb" style="${m.thumb ? `background-image:url('${esc(m.thumb)}')` : ''}">${m.thumb ? '' : icon(m.icon || cfg.icon || 'image', 18)}</span>
          <span class="ttl"><b>${esc(m.title || '(untitled)')}</b><small>${esc(m.sub || '')}</small></span>
          <span class="acts">${it.published ? '<span class="pill pub">Published</span>' : '<span class="pill draft">Draft</span>'}${(m.pills || []).join('')}
            <button class="icon-btn" data-mv="-1" aria-label="Move up">${icon('arrowUp', 15)}</button>
            <button class="icon-btn" data-pub aria-label="${it.published ? 'Unpublish' : 'Publish'}" title="${it.published ? 'Unpublish' : 'Publish'}">${icon(it.published ? 'eye' : 'eyeOff', 16)}</button>
            <button class="icon-btn" data-edit aria-label="Edit">${icon('edit', 16)}</button>
            <button class="icon-btn danger" data-del aria-label="Delete">${icon('trash', 16)}</button></span>
        </div>`;
      }).join('') : '<div class="empty">Nothing matches your search.</div>';
    }

    async function persistOrder(ordered) {
      const changes = ordered.map((it, i) => ({ it, order: i + 1 })).filter(x => x.it.order !== x.order);
      changes.forEach(x => (x.it.order = x.order));
      items.sort((a, b) => a.order - b.order);
      paint();
      try { await Promise.all(changes.map(x => db.update(col, x.it.$id, { order: x.order }))); clearSiteCache(); if (changes.length) toast('Order saved'); }
      catch (e) { toast(errMsg(e), 'err'); load(); }
    }

    async function save(obj, id, quiet) {
      const data = pack(obj, INDEXED[col]);
      if (INDEXED[col].includes('order') && (data.order === undefined || data.order === '')) data.order = items.length + 1;
      const perms = obj.published ? PUB_PERMS : [];
      const doc = id ? await db.update(col, id, data, perms) : await db.create(col, data, perms);
      clearSiteCache();
      if (!quiet) toast(obj.published ? 'Saved & published' : 'Saved as draft');
      return unpack(doc);
    }

    function edit(item) {
      const isNew = !item;
      const dw = drawer(isNew ? `New ${singular}` : `Edit ${singular}`);
      const form = buildForm(schema, item || blank());
      dw.body.appendChild(form.el);
      dw.foot.innerHTML = `${!isNew ? `<button class="btn btn-danger" data-del>${icon('trash', 16)} Delete</button>` : ''}<span class="grow"></span>
        ${cfg.previewPath ? `<button class="btn btn-ghost" data-prev>${icon('eye', 16)} Preview</button>` : ''}
        <button class="btn btn-ghost" data-draft>Save draft</button><button class="btn btn-primary" data-pub>${icon('check', 16)} Publish</button>`;
      const run = async (publish, btn) => {
        const val = form.get();
        val.published = publish;
        const err = cfg.validate && cfg.validate(val, items.filter(x => x.$id !== item?.$id));
        if (err) { toast(err, 'err'); return; }
        busy(btn, true);
        try { await save({ ...val, order: item?.order ?? val.order }, item?.$id); dw.clean(); dw.close(true); await load(); }
        catch (e) { toast(errMsg(e), 'err'); busy(btn, false); }
      };
      $('[data-draft]', dw.foot).onclick = e => run(false, e.currentTarget);
      $('[data-pub]', dw.foot).onclick = e => run(true, e.currentTarget);
      if (!isNew) $('[data-del]', dw.foot).onclick = async () => { if (await remove(item)) dw.close(true); };
      if (cfg.previewPath) $('[data-prev]', dw.foot).onclick = () => { const v = form.get(); previewModal(cfg.previewPath(v), cfg.previewData ? cfg.previewData(v, items, item) : {}); };
    }

    async function remove(item) {
      if (!(await confirmBox(`Delete “${meta(item).title}”? This cannot be undone.`))) return false;
      try { await db.remove(col, item.$id); clearSiteCache(); toast('Deleted'); await load(); return true; }
      catch (e) { toast(errMsg(e), 'err'); return false; }
    }

    // events
    $('[data-new]', view).onclick = () => edit(null);
    $('[data-s]', view).addEventListener('input', paint);
    $('[data-f]', view).addEventListener('change', paint);
    if (cfg.previewPath) $('[data-prev]', view).onclick = () => previewModal(cfg.previewPath(null), cfg.previewData ? cfg.previewData(null, items) : {});
    rows.addEventListener('click', async e => {
      const row = e.target.closest('.row'); if (!row) return;
      const item = items.find(x => x.$id === row.dataset.id);
      if (e.target.closest('[data-edit]') || (e.target.closest('.ttl') || e.target.closest('.thumb'))) return edit(item);
      if (e.target.closest('[data-del]')) return remove(item);
      if (e.target.closest('[data-pub]')) {
        const b = e.target.closest('[data-pub]'); busy(b, true);
        try { await db.update(col, item.$id, { published: !item.published }, !item.published ? PUB_PERMS : []); item.published = !item.published; clearSiteCache(); toast(item.published ? 'Published' : 'Unpublished'); paint(); }
        catch (er) { toast(errMsg(er), 'err'); busy(b, false); }
        return;
      }
      const mv = e.target.closest('[data-mv]');
      if (mv) {
        const i = items.indexOf(item); if (i <= 0) return;
        const arr = [...items]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        persistOrder(arr);
      }
    });
    let dragId = null;
    rows.addEventListener('dragstart', e => { const r = e.target.closest('.row'); if (!r) return; dragId = r.dataset.id; r.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    rows.addEventListener('dragend', () => { $$('.row', rows).forEach(r => r.classList.remove('dragging', 'drop-before')); });
    rows.addEventListener('dragover', e => { e.preventDefault(); $$('.row', rows).forEach(r => r.classList.remove('drop-before')); e.target.closest('.row')?.classList.add('drop-before'); });
    rows.addEventListener('drop', e => {
      e.preventDefault();
      const t = e.target.closest('.row'); if (!t || !dragId || t.dataset.id === dragId) return;
      const arr = items.filter(x => x.$id !== dragId);
      arr.splice(arr.findIndex(x => x.$id === t.dataset.id), 0, items.find(x => x.$id === dragId));
      dragId = null;
      persistOrder(arr);
    });
    await load();
  };
}

/* ================================================================
   Schemas
   ================================================================ */
const CAT_OPTS = D.CATEGORIES.map(c => [c.key, c.label]);
const PROJECT_SCHEMA = [
  { key: 'title', label: 'Project title', max: 140 },
  { key: 'slug', label: 'URL slug', type: 'slug', from: 'title', hint: '/portfolio/…' },
  { key: 'category', label: 'Category', type: 'select', options: CAT_OPTS },
  { key: 'featured', label: 'Featured', type: 'toggle', hint: 'Show in “Selected projects” on the home page' },
  { key: 'cover', label: 'Cover image', type: 'image', full: true, category: 'portfolio' },
  { key: 'gallery', label: 'Gallery images', type: 'images', category: 'portfolio' },
  { key: 'video', label: 'Video (optional)', type: 'video', full: true, hint: 'YouTube, Vimeo or uploaded MP4/WebM', category: 'video' },
  { key: 'client', label: 'Client name', placeholder: 'Leave empty or write “Self-initiated”' },
  { key: 'date', label: 'Project date', placeholder: 'e.g. March 2026' },
  { key: 'tools', label: 'Design tools used', type: 'tags' },
  { key: 'link', label: 'External project link', type: 'url', placeholder: 'https://…' },
  { key: 'description', label: 'Short description', type: 'textarea', rows: 3, max: 1000 },
  { key: 'objectives', label: 'Project objectives', type: 'textarea', rows: 3 },
  { key: 'process', label: 'Creative process', type: 'textarea', rows: 4 },
  { key: 'outcome', label: 'Project outcome', type: 'textarea', rows: 3 },
];
const SERVICE_SCHEMA = [
  { key: 'name', label: 'Service name', max: 120 },
  { key: 'slug', label: 'URL slug', type: 'slug', from: 'name', hint: '/services/…' },
  { key: 'icon', label: 'Icon', type: 'icon' },
  { key: 'category', label: 'Portfolio category', type: 'select', options: CAT_OPTS },
  { key: 'short', label: 'Short description', type: 'textarea', rows: 2, max: 300 },
  { key: 'description', label: 'Full description', type: 'textarea', rows: 5 },
  { key: 'includes', label: 'What’s included', type: 'lines' },
  { key: 'price', label: 'Price (optional)', placeholder: 'e.g. From PKR 3,000' },
  { key: 'waMessage', label: 'WhatsApp message', type: 'textarea', rows: 2, max: 500 },
  { key: 'image', label: 'Cover image (optional)', type: 'image', full: true, category: 'services' },
];
const SLIDE_SCHEMA = [
  { key: 'label', label: 'Slide name (navigation)', max: 40 },
  { key: 'eyebrow', label: 'Highlighted text (pill)', max: 60 },
  { key: 'title', label: 'Headline', full: true, max: 120 },
  { key: 'highlight', label: 'Words to highlight in blue', hint: 'must appear in the headline', full: true },
  { key: 'description', label: 'Description', type: 'textarea', rows: 3, max: 400 },
  { key: 'services', label: 'Services listed on the slide', type: 'lines', rows: 6 },
  { type: 'section', label: 'Buttons' },
  { key: 'ctaText', label: 'Primary button text' },
  { key: 'ctaLink', label: 'Primary button link', placeholder: '/portfolio?cat=logos' },
  { key: 'waText', label: 'WhatsApp button text' },
  { key: 'category', label: 'Connected portfolio category', type: 'select', options: CAT_OPTS },
  { key: 'waMessage', label: 'WhatsApp prefilled message', type: 'textarea', rows: 2, max: 500 },
  { type: 'section', label: 'Visual & motion' },
  { key: 'visual', label: '3D composition preset', type: 'select', options: [['logo', 'Logo & banner mockups'], ['thumb', 'Thumbnail cards'], ['web', 'Laptop + phone'], ['cv', 'CV documents'], ['graphic', 'Graphic design collage']] },
  { key: 'animation', label: 'Animation preset', type: 'select', options: [['depth', 'Depth (3D push)'], ['slide', 'Slide'], ['rise', 'Rise'], ['zoom', 'Zoom']] },
  { key: 'image', label: 'Main image (optional — replaces the preset composition)', type: 'image', full: true, category: 'homepage' },
  { key: 'bgFrom', label: 'Background gradient — from', type: 'color' },
  { key: 'bgTo', label: 'Background gradient — to', type: 'color' },
];
const TESTIMONIAL_SCHEMA = [
  { key: 'name', label: 'Client name', max: 100 },
  { key: 'company', label: 'Company / role', max: 120 },
  { key: 'review', label: 'Review (exactly as the client wrote it)', type: 'textarea', rows: 5, max: 1500 },
  { key: 'rating', label: 'Rating (optional)', type: 'select', options: [['', 'No rating'], ['5', '★★★★★'], ['4', '★★★★'], ['3', '★★★'], ['2', '★★'], ['1', '★']] },
  { key: 'project', label: 'Associated project (optional)' },
  { key: 'photo', label: 'Client photo (optional)', type: 'image', full: true, category: 'testimonials' },
];

const slugCheck = (field, label) => (v, others) => {
  if (!String(v[label] || '').trim()) return 'Please fill in the title / name.';
  if (!/^[a-z0-9-]{2,80}$/.test(v[field] || '')) return 'The URL slug can only contain lowercase letters, numbers and dashes.';
  if (others.some(o => o[field] === v[field])) return 'Another item already uses this URL slug.';
  return null;
};

/* ================================================================
   Pages
   ================================================================ */
const ROUTES = {
  overview: { title: 'Dashboard', icon: 'home', group: 'Overview', render: renderOverview },
  slides: {
    title: 'Swipe Experience', icon: 'layers', group: 'Content',
    render: collectionPage({
      col: C.slides, singular: 'slide', plural: 'slides', icon: 'layers', schema: SLIDE_SCHEMA,
      intro: 'These are the five full-screen service slides on the home page. Drag to reorder, hide with the eye icon, and use <b>Preview</b> to see changes before publishing.',
      blank: () => ({ ...clone(D.SLIDES[0]), $id: undefined, label: 'New slide', title: 'New headline', highlight: '', services: [], image: '', published: false }),
      meta: s => ({ title: `${s.label} — ${s.title}`, sub: s.eyebrow, thumb: s.image, icon: 'layers' }),
      seed: () => D.SLIDES.map(s => { const { $id, ...rest } = s; return rest; }), seedLabel: 'Import the 5 default slides',
      validate: v => (!v.label || !v.title ? 'Slide name and headline are required.' : v.highlight && !v.title.toLowerCase().includes(v.highlight.toLowerCase()) ? 'The highlighted words must appear in the headline.' : null),
      previewPath: (v) => '/?preview=1#explore',
      previewData: (v, items, item) => {
        const list = items.map(x => (item && x.$id === item.$id ? { ...x, ...v, published: true } : x)).filter(x => x.published);
        if (v && !item) list.push({ ...v, published: true, order: 999 });
        return { slides: list };
      },
    }),
  },
  projects: {
    title: 'Portfolio Projects', icon: 'briefcase', group: 'Content',
    render: collectionPage({
      col: C.projects, singular: 'project', plural: 'projects', icon: 'briefcase', schema: PROJECT_SCHEMA,
      filters: CAT_OPTS.map(([k, l]) => `<option value="cat:${k}">${esc(l)}</option>`).join(''),
      intro: 'Until you publish your first project, the website shows clearly-labelled sample concepts. Use real work only — never invented clients.',
      blank: () => ({ title: '', slug: '', category: 'logos', featured: false, cover: '', gallery: [], video: '', client: '', date: '', tools: [], description: '', objectives: '', process: '', outcome: '', link: '' }),
      meta: p => ({ title: p.title, sub: `${(D.CATEGORIES.find(c => c.key === p.category) || {}).label || p.category} · /portfolio/${p.slug}`, thumb: p.cover, pills: [p.featured ? '<span class="pill feat">Featured</span>' : '', p.video ? '<span class="pill">Video</span>' : ''] }),
      validate: slugCheck('slug', 'title'),
      seed: () => D.PROJECTS.map(p => { const { $id, ...rest } = p; return { ...rest, published: false }; }), seedLabel: 'Import sample projects (as drafts)',
    }),
  },
  services: {
    title: 'Services', icon: 'grid', group: 'Content',
    render: collectionPage({
      col: C.services, singular: 'service', plural: 'services', icon: 'grid', schema: SERVICE_SCHEMA,
      blank: () => ({ name: '', slug: '', icon: 'sparkles', category: 'graphic', short: '', description: '', includes: [], price: '', waMessage: 'Hello SHAH DESIGNS, I am interested in your services.', image: '' }),
      meta: s => ({ title: s.name, sub: `/services/${s.slug}${s.price ? ' · ' + s.price : ''}`, thumb: s.image, icon: s.icon }),
      validate: slugCheck('slug', 'name'),
      seed: () => D.SERVICES.map(s => { const { $id, ...rest } = s; return rest; }), seedLabel: 'Import the default services',
    }),
  },
  testimonials: {
    title: 'Testimonials', icon: 'quote', group: 'Content',
    render: collectionPage({
      col: C.testimonials, singular: 'testimonial', plural: 'testimonials', icon: 'quote', schema: TESTIMONIAL_SCHEMA,
      intro: 'Only add genuine reviews from real clients (ideally with their permission). The testimonials section stays hidden until at least one is published.',
      blank: () => ({ name: '', company: '', review: '', rating: '', project: '', photo: '' }),
      meta: t => ({ title: t.name, sub: (t.review || '').slice(0, 90), thumb: t.photo, icon: 'quote' }),
      validate: v => (!v.name || !v.review ? 'Client name and review are required.' : null),
    }),
  },
  messages: { title: 'Messages', icon: 'message', group: 'Clients', render: renderMessages },
  whatsapp: { title: 'WhatsApp', icon: 'whatsapp', group: 'Clients', render: renderWhatsApp },
  media: { title: 'Media Library', icon: 'image', group: 'Assets', render: renderMedia },
  content: { title: 'Site Content & Profile', icon: 'edit', group: 'Website', render: renderContent },
  appearance: { title: 'Appearance', icon: 'palette', group: 'Website', render: renderAppearance },
  social: { title: 'Social Links', icon: 'globe', group: 'Website', render: v => settingsPage(v, 'social', SOCIAL_SCHEMA) },
  seo: { title: 'SEO', icon: 'search', group: 'Website', render: v => settingsPage(v, 'seo', SEO_SCHEMA, { note: 'Each project’s URL slug is edited inside the project itself. Search engines read the titles below after they render the page; the static titles in the HTML files are the fallback.' }) },
  settings: { title: 'Account & Security', icon: 'settings', group: 'Account', render: renderAccount },
};

/* ---------- Overview ---------- */
async function renderOverview(view) {
  view.innerHTML = `<div class="stats">${'<div class="card stat"><div class="skeleton" style="height:90px;border:0"></div></div>'.repeat(6)}</div>`;
  const safe = p => p.catch(() => null);
  const [projects, published, services, unread, messages, testimonials, media, slides, recent] = await Promise.all([
    safe(db.count(C.projects)), safe(db.count(C.projects, [Q.equal('published', true)])), safe(db.count(C.services)),
    safe(db.count(C.messages, [Q.equal('read', false)])), safe(db.count(C.messages)), safe(db.count(C.testimonials)),
    safe(storage.list([Q.limit(1)]).then(r => r.total)), safe(db.count(C.slides)),
    safe(db.list(C.messages, [Q.orderDesc('$createdAt'), Q.limit(5)])),
  ]);
  const content = await readSetting('content').catch(() => null);
  const social = await readSetting('social').catch(() => null);
  const n = x => (x == null ? '—' : x);
  const stat = (ic, val, label, href, accent) => `<a class="card stat ${accent ? 'accent' : ''}" href="#${href}"><span class="si">${icon(ic, 20)}</span><div><b>${n(val)}</b><br><small>${label}</small></div></a>`;
  const checks = [
    [slides > 0, 'Swipe slides are stored in the database', 'slides'],
    [services > 0, 'Services are stored in the database', 'services'],
    [published > 0, 'At least one real project is published', 'projects'],
    [!!content?.published?.about?.photo, 'Profile photo added', 'content'],
    [!!content?.published?.hero?.portrait, 'Hero portrait added', 'content'],
    [social && Object.entries(social.published).some(([k, v]) => k !== 'email' && v), 'Social media links added', 'social'],
  ];
  view.innerHTML = `
    <div class="stats">
      ${stat('briefcase', projects, 'Total projects', 'projects', true)}
      ${stat('eye', published, 'Published projects', 'projects')}
      ${stat('grid', services, 'Services', 'services')}
      ${stat('message', unread, 'Unread messages', 'messages')}
      ${stat('mail', messages, 'Contact requests', 'messages')}
      ${stat('quote', testimonials, 'Testimonials', 'testimonials')}
      ${stat('image', media, 'Uploaded files', 'media')}
    </div>
    <div class="two-col">
      <div class="card"><div class="card-head"><h3>Latest messages</h3><span class="grow"></span><a class="btn btn-ghost btn-sm" href="#messages">View all</a></div>
        <div class="rows">${recent && recent.documents.length ? recent.documents.map(m => `<a class="row ${m.read ? '' : 'unread'}" href="#messages/${esc(m.$id)}" style="grid-template-columns:44px minmax(0,1fr) auto"><span class="avatar">${esc((m.name || '?')[0].toUpperCase())}</span><span class="ttl"><b>${esc(m.name)}</b><small>${esc(m.service)} · ${esc((m.details || '').slice(0, 70))}</small></span><span class="muted" style="font-size:12px">${fmtDate(m.$createdAt)}</span></a>`).join('') : `<div class="empty">${icon('message', 30)}<p>No messages yet. Submissions from the contact form appear here.</p></div>`}</div></div>
      <div class="card card-pad"><h3 style="margin-bottom:14px">Setup checklist</h3>
        <ul class="list-check">${checks.map(([ok, t, h]) => `<li><span class="${ok ? 'ok' : 'no'}">${icon(ok ? 'check' : 'sparkles', 18)}</span><a href="#${h}">${esc(t)}</a></li>`).join('')}</ul>
        <div class="alert alert-info" style="margin-top:18px">${icon('lock', 16)}<span>Analytics are not shown here on purpose — no fake numbers. Connect a privacy-friendly provider (e.g. Plausible or Netlify Analytics) if you want visitor stats.</span></div>
      </div>
    </div>`;
}

/* ---------- Messages ---------- */
const STATUS = [['new', 'New'], ['in_progress', 'In progress'], ['completed', 'Completed'], ['archived', 'Archived']];
const statusPill = s => `<span class="pill ${{ new: 'new', in_progress: 'progress', completed: 'done', archived: 'arch' }[s] || ''}">${esc((STATUS.find(x => x[0] === s) || [, s])[1])}</span>`;

async function renderMessages(view, param) {
  view.innerHTML = `<div class="toolbar">
      <div class="search">${icon('search', 18)}<input placeholder="Search name, email, details…" data-s></div>
      <select class="select-sm" data-st><option value="">All statuses</option>${STATUS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
      <label class="switch" style="margin-left:4px"><input type="checkbox" data-unread><span class="t"></span>Unread only</label>
      <div class="grow"></div>
      <button class="btn btn-ghost" data-csv>${icon('download', 16)} Export CSV</button>
    </div>
    <div class="alert alert-info" style="margin-bottom:16px">${icon('whatsapp', 16)}<span>These are contact-form submissions. WhatsApp chats stay in your WhatsApp app — they cannot be read here without an official WhatsApp Business Platform integration.</span></div>
    <div class="card"><div class="rows" data-rows>${'<div class="skeleton"></div>'.repeat(4)}</div></div>`;
  let items = [];
  const rows = $('[data-rows]', view);
  const load = async () => {
    try { items = await db.all(C.messages, [Q.orderDesc('$createdAt')]); paint(); }
    catch (e) { rows.innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; }
  };
  const filtered = () => {
    const q = $('[data-s]', view).value.toLowerCase(), st = $('[data-st]', view).value, un = $('[data-unread]', view).checked;
    return items.filter(m => (!st || m.status === st) && (!un || !m.read) && (!q || [m.name, m.email, m.phone, m.service, m.details, m.notes].join(' ').toLowerCase().includes(q)));
  };
  const paint = () => {
    const list = filtered();
    rows.innerHTML = list.length ? list.map(m => `<div class="row ${m.read ? '' : 'unread'}" data-id="${esc(m.$id)}" style="grid-template-columns:44px minmax(0,1fr) auto;cursor:pointer">
      <span class="avatar">${esc((m.name || '?')[0].toUpperCase())}</span>
      <span class="ttl"><b>${esc(m.name)} <span class="muted" style="font-weight:400">· ${esc(m.email)}</span></b><small>${esc(m.service)}${m.budget ? ' · ' + esc(m.budget) : ''} — ${esc((m.details || '').slice(0, 100))}</small></span>
      <span class="acts">${statusPill(m.status)}<span class="muted" style="font-size:12px;min-width:120px;text-align:right">${fmtDate(m.$createdAt)}</span></span></div>`).join('')
      : `<div class="empty">${icon('message', 30)}<p>${items.length ? 'No messages match these filters.' : 'No messages yet.'}</p></div>`;
  };
  const open = async (m) => {
    if (!m.read) { try { await db.update(C.messages, m.$id, { read: true }); m.read = true; S.unread = Math.max(0, S.unread - 1); updateBadge(); paint(); } catch { /* ignore */ } }
    const dw = drawer(`Message from ${m.name}`);
    dw.body.innerHTML = `<div class="msg-meta">
        <div><small>Email</small><a href="mailto:${esc(m.email)}">${esc(m.email)}</a></div>
        <div><small>WhatsApp / phone</small>${esc(m.phone || '—')}</div>
        <div><small>Service</small>${esc(m.service)}</div>
        <div><small>Budget</small>${esc(m.budget || '—')}</div>
        <div><small>Received</small>${fmtDate(m.$createdAt)}</div>
      </div>
      <h4 style="margin-bottom:8px">Project requirements</h4>
      <div class="msg-body">${esc(m.details)}</div>
      <div class="grid2" style="margin-top:18px">
        <div class="fld"><label for="m-st">Inquiry status</label><select id="m-st">${STATUS.map(([k, l]) => `<option value="${k}" ${m.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="fld"><span class="lbl">Read</span><label class="switch"><input type="checkbox" id="m-read" ${m.read ? 'checked' : ''}><span class="t"></span>Marked as read</label></div>
        <div class="fld full"><label for="m-notes">Internal notes <span class="hint">only visible to you</span></label><textarea id="m-notes" rows="4">${esc(m.notes || '')}</textarea></div>
      </div>`;
    const wa = m.phone ? waLink(m.phone.replace(/^0(?=3)/, '92'), `Hello ${m.name.split(' ')[0]}, thank you for contacting SHAH DESIGNS about ${m.service}.`) : '';
    dw.foot.innerHTML = `<button class="btn btn-danger" data-del>${icon('trash', 16)} Delete</button><span class="grow"></span>
      ${wa ? `<a class="btn btn-wa" href="${esc(wa)}" target="_blank" rel="noopener">${icon('whatsapp', 16)} Reply on WhatsApp</a>` : ''}
      <a class="btn btn-ghost" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your ' + m.service + ' project — SHAH DESIGNS')}">${icon('mail', 16)} Email</a>
      <button class="btn btn-primary" data-save>${icon('check', 16)} Save</button>`;
    $('[data-save]', dw.foot).onclick = async e => {
      const b = e.currentTarget; busy(b, true);
      const upd = { status: $('#m-st', dw.body).value, read: $('#m-read', dw.body).checked, notes: $('#m-notes', dw.body).value.slice(0, 5000) };
      try { await db.update(C.messages, m.$id, upd); Object.assign(m, upd); toast('Saved'); dw.clean(); dw.close(true); paint(); refreshUnread(); }
      catch (er) { toast(errMsg(er), 'err'); busy(b, false); }
    };
    $('[data-del]', dw.foot).onclick = async () => {
      if (!(await confirmBox(`Delete the message from ${m.name}?`))) return;
      try { await db.remove(C.messages, m.$id); items = items.filter(x => x !== m); toast('Deleted'); dw.close(true); paint(); refreshUnread(); }
      catch (er) { toast(errMsg(er), 'err'); }
    };
  };
  rows.addEventListener('click', e => { const r = e.target.closest('.row'); if (r) open(items.find(x => x.$id === r.dataset.id)); });
  ['input', 'change'].forEach(ev => view.addEventListener(ev, e => { if (e.target.matches('[data-s],[data-st],[data-unread]')) paint(); }));
  $('[data-csv]', view).onclick = () => {
    const list = filtered();
    if (!list.length) return toast('Nothing to export', 'err');
    const cols = ['$createdAt', 'name', 'email', 'phone', 'service', 'budget', 'status', 'read', 'details', 'notes'];
    const cell = v => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const csv = '﻿' + [cols.map(c => c.replace('$createdAt', 'received')).join(','), ...list.map(m => cols.map(c => cell(m[c])).join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `shah-designs-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  await load();
  if (param) { const m = items.find(x => x.$id === param); if (m) open(m); }
}

/* ---------- Media library ---------- */
async function renderMedia(view) {
  view.innerHTML = `<div class="card card-pad" style="margin-bottom:16px"><div class="grid2" style="align-items:end;margin-bottom:14px">
      <div class="fld"><label for="up-cat">Category for new uploads</label><input id="up-cat" value="general" list="cat-list" maxlength="60"><datalist id="cat-list"></datalist></div>
      <div class="muted" style="font-size:13px">Images (JPG, PNG, WebP, GIF, AVIF), videos (MP4, WebM) and PDFs (e.g. your CV). Files are stored in Appwrite Storage and served publicly by URL.</div></div><div data-dz></div></div>
    <div class="toolbar"><div class="search">${icon('search', 18)}<input placeholder="Search files…" data-s></div>
      <select class="select-sm" data-k><option value="">All types</option><option value="image">Images</option><option value="video">Videos</option><option value="document">Documents</option></select>
      <select class="select-sm" data-c><option value="">All categories</option></select>
      <div class="grow"></div><button class="btn btn-ghost" data-scan>${icon('search', 16)} Find unused files</button></div>
    <div class="mgrid" data-grid><div class="skeleton"></div></div>`;
  let items = [], unused = null;
  const grid = $('[data-grid]', view);
  const paintCats = () => {
    const cats = [...new Set(items.map(i => i.category).filter(Boolean))].sort();
    $('#cat-list', view).innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
    const sel = $('[data-c]', view), cur = sel.value;
    sel.innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option ${c === cur ? 'selected' : ''}>${esc(c)}</option>`).join('');
  };
  const paint = () => {
    const q = $('[data-s]', view).value.toLowerCase(), k = $('[data-k]', view).value, c = $('[data-c]', view).value;
    const list = items.filter(m => (!k || m.kind === k) && (!c || m.category === c) && (!q || (m.name + ' ' + m.category).toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(m => `<button class="mitem" data-id="${esc(m.$id)}"><div class="mprev" style="${m.kind === 'image' ? `background-image:url('${esc(m.url)}')` : ''}">${mediaPreview(m)}</div>
      <span class="pill mtag">${esc(m.kind)}</span>${unused && unused.has(m.$id) ? '<span class="pill new unused">Unused</span>' : ''}
      <div class="minfo"><b>${esc(m.name)}</b><small>${esc(m.category)} · ${fmtSize(m.size || 0)}</small></div></button>`).join('')
      : `<div class="empty" style="grid-column:1/-1">${icon('image', 30)}<p>${items.length ? 'No files match.' : 'No files uploaded yet.'}</p></div>`;
  };
  const load = async () => {
    try { items = await loadMedia(true); paintCats(); paint(); }
    catch (e) { grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(errMsg(e))}</div>`; }
  };
  $('[data-dz]', view).appendChild(dropzone({ category: () => $('#up-cat', view).value.trim() || 'general', onDone: load }));
  ['input', 'change'].forEach(ev => view.addEventListener(ev, e => { if (e.target.matches('[data-s],[data-k],[data-c]')) paint(); }));

  $('[data-scan]', view).onclick = async e => {
    const b = e.currentTarget; busy(b, true, 'Scanning');
    try {
      const [settings, ...cols] = await Promise.all([db.list(C.settings, [Q.limit(50)]), db.all(C.slides), db.all(C.projects), db.all(C.services), db.all(C.testimonials)]);
      const blob = JSON.stringify([settings.documents, cols]);
      unused = new Set(items.filter(m => !blob.includes(m.fileId)).map(m => m.$id));
      paint();
      busy(b, false);
      if (!unused.size) return toast('Every file is in use');
      if (await confirmBox(`${unused.size} file(s) are not used anywhere on the website. Delete them permanently?`, { ok: `Delete ${unused.size} unused` })) {
        for (const id of unused) { const m = items.find(x => x.$id === id); try { await storage.remove(m.fileId); } catch { /* already gone */ } await db.remove(C.media, id).catch(() => {}); }
        toast('Unused files deleted'); unused = null; await load();
      }
    } catch (er) { toast(errMsg(er), 'err'); busy(b, false); }
  };

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    const m = items.find(x => x.$id === b.dataset.id);
    const body = el(`<div class="stack">
      <div style="border-radius:14px;overflow:hidden;background:#EEF1FB;display:grid;place-items:center;max-height:420px">${m.kind === 'image' ? `<img src="${esc(m.url)}" alt="" style="max-height:420px">` : m.kind === 'video' ? `<video src="${esc(m.url)}" controls style="max-height:420px;width:100%"></video>` : `<a class="btn btn-ghost" style="margin:40px" href="${esc(m.url)}" target="_blank" rel="noopener">${icon('file', 18)} Open PDF</a>`}</div>
      <div class="grid2"><div class="fld"><label for="mn">Name</label><input id="mn" value="${esc(m.name)}" maxlength="200"></div><div class="fld"><label for="mc">Category</label><input id="mc" value="${esc(m.category)}" maxlength="60"></div>
      <div class="fld full"><label for="mu">Public URL</label><div style="display:flex;gap:8px"><input id="mu" value="${esc(m.url)}" readonly><button class="btn btn-ghost" data-copy>${icon('copy', 16)}</button></div></div></div>
      <small class="muted">${esc(m.mime || '')} · ${fmtSize(m.size || 0)} · uploaded ${fmtDate(m.$createdAt)}</small>
      <input type="file" hidden data-rep accept="${(ACCEPT[m.kind] || []).join(',')}"></div>`);
    const md = modal({ title: 'File details', body, size: 'lg', foot: `<button class="btn btn-danger" data-del>${icon('trash', 16)} Delete</button><span style="flex:1"></span><button class="btn btn-ghost" data-replace>${icon('refresh', 16)} Replace file</button><button class="btn btn-primary" data-save>Save</button>` });
    $('[data-copy]', body).onclick = () => { navigator.clipboard?.writeText(m.url).then(() => toast('URL copied')); };
    $('[data-save]', md.wrap).onclick = async () => {
      try { await db.update(C.media, m.$id, { name: $('#mn', body).value.trim() || m.name, category: $('#mc', body).value.trim() || 'general' }); toast('Saved'); md.close(); load(); }
      catch (er) { toast(errMsg(er), 'err'); }
    };
    $('[data-replace]', md.wrap).onclick = () => $('[data-rep]', body).click();
    $('[data-rep]', body).addEventListener('change', async ev => {
      const f = ev.target.files[0]; if (!f) return;
      const bad = validateFile(f, [m.kind]); if (bad) return toast(bad, 'err');
      if (!(await confirmBox('Replace this file? The URL stays the same, so everywhere it is used updates automatically (browsers may show the old version until they refresh).', { ok: 'Replace', danger: false }))) return;
      const btn = $('[data-replace]', md.wrap); busy(btn, true, 'Uploading');
      try {
        await storage.remove(m.fileId);
        await storage.upload(f, null, m.fileId);
        await db.update(C.media, m.$id, { name: f.name.slice(0, 200), mime: f.type, size: f.size });
        toast('File replaced'); md.close(); load();
      } catch (er) { toast(errMsg(er), 'err'); busy(btn, false); }
    });
    $('[data-del]', md.wrap).onclick = async () => {
      if (!(await confirmBox(`Delete “${m.name}”? Any page still using it will show a broken image.`))) return;
      try { await storage.remove(m.fileId).catch(er => { if (er.code !== 404) throw er; }); await db.remove(C.media, m.$id); toast('Deleted'); md.close(); load(); }
      catch (er) { toast(errMsg(er), 'err'); }
    };
  });
  await load();
}

/* ---------- Generic settings page ---------- */
async function settingsPage(view, key, schema, { note, extra, previewPath = '/?preview=1', after } = {}) {
  view.innerHTML = '<div class="card card-pad"><div class="skeleton" style="border:0"></div></div>';
  let st;
  try { st = await readSetting(key); } catch (e) { view.innerHTML = `<div class="alert alert-err">${esc(errMsg(e))}</div>`; return; }
  const start = st.draft || st.published;
  view.innerHTML = `${note ? `<div class="alert alert-info" style="margin-bottom:16px">${icon('sparkles', 16)}<span>${esc(note)}</span></div>` : ''}
    ${st.draft ? `<div class="alert alert-warn" style="margin-bottom:16px">${icon('edit', 16)}<span>You have an unpublished draft. Publish it to make it live, or discard it.</span><button class="btn btn-ghost btn-sm" style="margin-left:auto" data-discard>Discard draft</button></div>` : ''}
    <div class="card"><div class="card-pad" data-form></div>
    <div class="drawer-foot" style="border-radius:0 0 var(--r) var(--r)"><span class="muted" style="font-size:13px">${st.updated ? 'Last saved ' + fmtDate(st.updated) : 'Using built-in defaults'}</span><span class="grow"></span>
      <button class="btn btn-ghost" data-prev>${icon('eye', 16)} Preview</button><button class="btn btn-ghost" data-draft>Save draft</button><button class="btn btn-primary" data-pub>${icon('check', 16)} Publish</button></div></div>
    <div data-extra style="margin-top:20px"></div>`;
  const form = buildForm(schema, start);
  $('[data-form]', view).appendChild(form.el);
  const run = async (publish, btn) => {
    busy(btn, true);
    try { await writeSetting(key, form.get(), { publish }); toast(publish ? 'Published — live on the website' : 'Draft saved'); route(); }
    catch (e) { toast(errMsg(e), 'err'); busy(btn, false); }
  };
  $('[data-draft]', view).onclick = e => run(false, e.currentTarget);
  $('[data-pub]', view).onclick = e => run(true, e.currentTarget);
  $('[data-prev]', view).onclick = () => previewModal(previewPath, { [key]: form.get() });
  $('[data-discard]', view)?.addEventListener('click', async () => {
    if (!(await confirmBox('Discard the unpublished draft?', { ok: 'Discard' }))) return;
    try { await db.update(C.settings, key, { draft: '' }); toast('Draft discarded'); route(); } catch (e) { toast(errMsg(e), 'err'); }
  });
  if (after) await after($('[data-extra]', view), form);
  return form;
}

const SOCIAL_SCHEMA = [
  { key: 'instagram', label: 'Instagram', type: 'url', placeholder: 'https://instagram.com/…' },
  { key: 'behance', label: 'Behance', type: 'url', placeholder: 'https://behance.net/…' },
  { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://linkedin.com/in/…' },
  { key: 'dribbble', label: 'Dribbble', type: 'url', placeholder: 'https://dribbble.com/…' },
  { key: 'facebook', label: 'Facebook', type: 'url', placeholder: 'https://facebook.com/…' },
  { key: 'youtube', label: 'YouTube', type: 'url', placeholder: 'https://youtube.com/@…' },
  { key: 'email', label: 'Public email', type: 'email' },
];
const SEO_SCHEMA = [
  { key: 'siteTitle', label: 'Site name' },
  { key: 'keywords', label: 'Keywords', hint: 'comma separated' },
  { key: 'description', label: 'Default meta description', type: 'textarea', rows: 2, max: 300 },
  { key: 'ogImage', label: 'Social sharing image (1200×630)', type: 'image', full: true, category: 'seo' },
  { key: 'favicon', label: 'Favicon (square PNG/SVG)', type: 'image', full: true, category: 'seo' },
  ...['home', 'about', 'services', 'portfolio', 'motion', 'contact'].flatMap(p => [
    { type: 'section', label: `${p[0].toUpperCase() + p.slice(1)} page` },
    { key: `pages.${p}.title`, label: 'Page title', max: 120 },
    { key: `pages.${p}.description`, label: 'Meta description', max: 300 },
  ]),
];

/* ---------- WhatsApp ---------- */
async function renderWhatsApp(view) {
  const schema = [
    { key: 'number', label: 'WhatsApp number (international, digits only)', placeholder: '923228037525', hint: 'e.g. 923228037525' },
    { key: 'display', label: 'Number as displayed', placeholder: '+92 322 8037525' },
    { key: 'defaultMessage', label: 'Default message', type: 'textarea', rows: 2, max: 500 },
    { key: 'floatEnabled', label: 'Floating WhatsApp button', type: 'toggle', hint: 'Show on every page' },
    { key: 'tooltip', label: 'Button tooltip' },
    { key: 'navCta', label: 'Header button text' },
    { key: 'widgetTitle', label: 'Widget title' },
    { key: 'ctaText', label: 'Widget button text' },
    { key: 'widgetText', label: 'Widget message', type: 'textarea', rows: 2 },
  ];
  await settingsPage(view, 'whatsapp', schema, {
    after: async (box, form) => {
      box.innerHTML = `<div class="card"><div class="card-head"><h3>Service-specific messages</h3><span class="grow"></span><button class="btn btn-ghost btn-sm" data-test>${icon('external', 14)} Test default link</button><button class="btn btn-primary btn-sm" data-save-msgs>${icon('check', 14)} Save messages</button></div><div class="card-pad stack" data-list><div class="skeleton" style="border:0"></div></div></div>`;
      $('[data-test]', box).onclick = () => { const v = form.get(); window.open(waLink(v.number, v.defaultMessage), '_blank'); };
      let slides = [], services = [];
      try { [slides, services] = await Promise.all([db.all(C.slides, [Q.orderAsc('order')]), db.all(C.services, [Q.orderAsc('order')])]); }
      catch (e) { $('[data-list]', box).innerHTML = `<div class="alert alert-err">${esc(errMsg(e))}</div>`; return; }
      const rows = [...slides.map(d => ({ col: C.slides, d: unpack(d), label: 'Slide: ' + unpack(d).label })), ...services.map(d => ({ col: C.services, d: unpack(d), label: 'Service: ' + unpack(d).name }))];
      $('[data-list]', box).innerHTML = rows.length ? rows.map((r, i) => `<div class="fld"><label for="wm${i}">${esc(r.label)}</label><div style="display:flex;gap:8px"><textarea id="wm${i}" rows="2" data-i="${i}" maxlength="500">${esc(r.d.waMessage || '')}</textarea><a class="btn btn-ghost btn-sm" style="height:auto" data-try="${i}" title="Test link">${icon('external', 14)}</a></div></div>`).join('')
        : '<p class="muted">Import the default slides and services first (Swipe Experience / Services pages).</p>';
      box.addEventListener('click', e => { const t = e.target.closest('[data-try]'); if (t) { e.preventDefault(); window.open(waLink(form.get().number, $(`[data-i="${t.dataset.try}"]`, box).value), '_blank'); } });
      $('[data-save-msgs]', box).onclick = async e => {
        const b = e.currentTarget; busy(b, true);
        try {
          await Promise.all(rows.map(async (r, i) => {
            const msg = $(`[data-i="${i}"]`, box).value.trim();
            if (msg === (r.d.waMessage || '')) return;
            r.d.waMessage = msg;
            await db.update(r.col, r.d.$id, pack(r.d, INDEXED[r.col]));
          }));
          clearSiteCache(); toast('Messages saved');
        } catch (er) { toast(errMsg(er), 'err'); }
        busy(b, false);
      };
    },
  });
}

/* ---------- Site content & profile ---------- */
const CONTENT_TABS = {
  hero: ['Hero', [
    { key: 'hero.badge', label: 'Badge text' },
    { key: 'hero.swipeText', label: 'Swipe button text' },
    { key: 'hero.lines', label: 'Headline lines', type: 'lines', rows: 3, hint: 'wrap words in *stars* to make them blue' },
    { key: 'hero.text', label: 'Supporting text', type: 'textarea', rows: 2 },
    { key: 'hero.secondaryCta', label: 'Second button text' },
    { key: 'swipe.loop', label: 'Loop slides', type: 'toggle', hint: 'After the last slide, go back to the first' },
    { key: 'swipe.hint', label: 'Swipe hint text', full: true },
    { key: 'hero.portrait', label: 'Hero portrait (your photo)', type: 'image', full: true, category: 'homepage' },
  ]],
  about: ['About & Profile', [
    { key: 'about.name', label: 'Name / studio name' },
    { key: 'about.role', label: 'Professional title' },
    { key: 'about.location', label: 'Location (optional)' },
    { key: 'about.resume', label: 'CV / résumé (PDF)', type: 'file', full: true, category: 'documents' },
    { key: 'about.intro', label: 'Short introduction', type: 'textarea', rows: 2 },
    { key: 'about.overview', label: 'Professional overview', type: 'textarea', rows: 4 },
    { key: 'about.philosophy', label: 'Design philosophy', type: 'textarea', rows: 3 },
    { key: 'about.specializations', label: 'Core specialisations', type: 'lines' },
    { key: 'about.photo', label: 'Profile photo', type: 'image', full: true, category: 'profile' },
  ]],
  skills: ['Tools & Skills', [
    { key: 'tools', label: 'Software tools', type: 'repeat', itemLabel: 'tool', hint: 'Only show tools you actually use', blank: { name: '', short: '', color: '#FFFFFF', bg: '#2455FF', visible: true },
      fields: [{ key: 'name', label: 'Name' }, { key: 'short', label: 'Badge letters', max: 4 }, { key: 'bg', label: 'Badge colour', type: 'color' }, { key: 'color', label: 'Letter colour', type: 'color' }, { key: 'visible', label: 'Visible', type: 'toggle' }] },
    { key: 'skills', label: 'Skills', type: 'lines' },
  ]],
  process: ['Design Process', [
    { key: 'process', label: 'Process steps', type: 'repeat', itemLabel: 'step', blank: { title: '', text: '' }, fields: [{ key: 'title', label: 'Title' }, { key: 'text', label: 'Description', type: 'textarea', rows: 2 }] },
  ]],
  cta: ['CTA & Footer', [
    { key: 'cta.title', label: 'CTA title' },
    { key: 'cta.button', label: 'CTA button text' },
    { key: 'cta.text', label: 'CTA text', type: 'textarea', rows: 2 },
    { key: 'footer.tagline', label: 'Footer tagline', type: 'textarea', rows: 2 },
    { key: 'footer.copyright', label: 'Copyright name' },
  ]],
};
async function renderContent(view, tab = 'hero') {
  if (!CONTENT_TABS[tab]) tab = 'hero';
  const wrap = el(`<div><div class="seg" style="margin-bottom:16px">${Object.entries(CONTENT_TABS).map(([k, [l]]) => `<button aria-pressed="${k === tab}" data-tab="${k}">${esc(l)}</button>`).join('')}</div><div data-v></div></div>`);
  view.innerHTML = ''; view.appendChild(wrap);
  $$('[data-tab]', wrap).forEach(b => b.onclick = () => { location.hash = `content/${b.dataset.tab}`; });
  await settingsPage($('[data-v]', wrap), 'content', CONTENT_TABS[tab][1], { previewPath: tab === 'about' ? '/about?preview=1' : '/?preview=1' });
}

/* ---------- Appearance (live customizer) ---------- */
const GRADIENTS = {
  lavender: { label: 'Lavender', bg1: '#E9EBFF', bg2: '#F5F8FF', lavender: '#DCDFFF', theme: 'light' },
  ice: { label: 'Ice blue', bg1: '#E4EEFF', bg2: '#FFFFFF', lavender: '#D4E2FF', theme: 'light' },
  dusk: { label: 'Dusk', bg1: '#ECE5FF', bg2: '#FFF0E6', lavender: '#E3D9FF', theme: 'light' },
  midnight: { label: 'Midnight', bg1: '#0A1440', bg2: '#060D2C', lavender: '#1B2A6B', theme: 'dark' },
};
const TYPE_PRESETS = { modern: ['Space Grotesk', 'Inter'], geometric: ['Sora', 'Inter'], friendly: ['Outfit', 'DM Sans'], bold: ['Syne', 'Manrope'], clean: ['Plus Jakarta Sans', 'Plus Jakarta Sans'], classic: ['Poppins', 'Poppins'] };
const FONTS = ['Space Grotesk', 'Sora', 'Inter', 'Manrope', 'Outfit', 'Poppins', 'DM Sans', 'Plus Jakarta Sans', 'Syne', 'Urbanist'];
const SECTION_LABELS = { featured: 'Featured projects', about: 'About preview', process: 'Design process', skills: 'Tools & skills', testimonials: 'Testimonials', cta: 'Contact CTA' };

async function renderAppearance(view) {
  view.innerHTML = '<div class="card card-pad"><div class="skeleton" style="border:0"></div></div>';
  let st;
  try { st = await readSetting('design'); } catch (e) { view.innerHTML = `<div class="alert alert-err">${esc(errMsg(e))}</div>`; return; }
  let d = clone(st.draft || st.published);
  d.sections = d.sections || clone(D.DESIGN.sections);
  Object.keys(SECTION_LABELS).forEach(k => { if (!d.sections.order.includes(k)) d.sections.order.push(k); });
  clearPreview(); setPreview({ design: d });

  view.innerHTML = `
    ${st.draft ? `<div class="alert alert-warn" style="margin-bottom:16px">${icon('edit', 16)}<span>Showing your unpublished draft.</span></div>` : ''}
    <div class="appear">
      <div class="controls">
        <div class="fset"><h4>${icon('palette', 16)} Colours</h4><div class="grid2" data-colors></div>
          <div class="fld" style="margin-top:14px"><span class="lbl">Background preset</span><div class="presets">${Object.entries(GRADIENTS).map(([k, g]) => `<button type="button" data-grad="${k}" aria-pressed="${d.gradient === k}" style="background:linear-gradient(135deg,${g.bg1},${g.bg2});color:${g.theme === 'dark' ? '#fff' : '#0B1640'}">${g.label}</button>`).join('')}</div></div>
          <div class="fld" style="margin-top:14px"><span class="lbl">Theme</span><div class="seg" data-seg="theme"><button data-v="light">Light</button><button data-v="dark">Dark</button></div></div>
        </div>
        <div class="fset"><h4>${icon('edit', 16)} Typography</h4>
          <div class="fld" style="margin-bottom:12px"><span class="lbl">Presets</span><div class="seg" data-typo>${Object.keys(TYPE_PRESETS).map(k => `<button data-t="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div></div>
          <div class="grid2"><div class="fld"><label for="hf">Heading font</label><select id="hf" data-k="headingFont">${FONTS.map(f => `<option>${f}</option>`).join('')}</select></div>
          <div class="fld"><label for="bf">Body font</label><select id="bf" data-k="bodyFont">${FONTS.map(f => `<option>${f}</option>`).join('')}</select></div></div>
          <div class="fld" style="margin-top:12px"><label for="hs">Heading size <span class="hint" data-o="headingScale"></span></label><input id="hs" type="range" min="0.8" max="1.3" step="0.05" data-k="headingScale"></div>
        </div>
        <div class="fset"><h4>${icon('grid', 16)} Shapes & layout</h4>
          <div class="fld"><span class="lbl">Button style</span><div class="seg" data-seg="buttonShape"><button data-v="pill">Pill</button><button data-v="rounded">Rounded</button><button data-v="square">Square</button></div></div>
          <div class="fld" style="margin-top:12px"><label for="rad">Card corner radius <span class="hint" data-o="radius"></span></label><input id="rad" type="range" min="0" max="40" step="2" data-k="radius"></div>
          <div class="fld" style="margin-top:12px"><span class="lbl">Card shadow</span><div class="seg" data-seg="shadow"><button data-v="none">Flat</button><button data-v="soft">Soft</button><button data-v="deep">Deep</button></div></div>
          <div class="fld" style="margin-top:12px"><span class="lbl">Navigation bar</span><div class="seg" data-seg="navStyle"><button data-v="glass">Glass</button><button data-v="solid">Solid</button></div></div>
          <div class="fld" style="margin-top:12px"><span class="lbl">Hero layout</span><div class="seg" data-seg="heroLayout"><button data-v="split">Split (text + 3D visual)</button><button data-v="centered">Centered text</button></div></div>
          <div class="fld" style="margin-top:12px"><label for="sp">Section spacing <span class="hint" data-o="spacing"></span></label><input id="sp" type="range" min="0.7" max="1.4" step="0.05" data-k="spacing"></div>
        </div>
        <div class="fset"><h4>${icon('sparkles', 16)} Motion</h4>
          <div class="fld"><span class="lbl">Animation intensity</span><div class="seg" data-seg="animIntensity"><button data-v="0">Off</button><button data-v="1">Subtle</button><button data-v="2">Full</button></div></div>
          <div class="fld" style="margin-top:12px"><label for="as">Animation speed <span class="hint" data-o="animSpeed"></span></label><input id="as" type="range" min="0.5" max="1.8" step="0.1" data-k="animSpeed"><span class="hint">lower = faster</span></div>
          <label class="switch" style="margin-top:12px"><input type="checkbox" data-k="cursor"><span class="t"></span>Custom cursor on desktop</label>
        </div>
        <div class="fset"><h4>${icon('layers', 16)} Home sections <span class="hint" style="font-weight:400">order & visibility (below the swipe experience)</span></h4><div class="sec-list" data-secs></div></div>
      </div>
      <div class="preview">
        <div class="preview-frame" data-frame><div class="preview-bar"><i></i><i></i><i></i><span class="grow muted" style="font-size:12px">Live preview</span>
          <div class="seg"><button aria-pressed="true" data-dev="d" aria-label="Desktop">${icon('monitor', 14)}</button><button aria-pressed="false" data-dev="m" aria-label="Mobile">${icon('smartphone', 14)}</button></div>
          <button class="icon-btn" data-reload aria-label="Reload preview">${icon('refresh', 15)}</button></div>
          <iframe title="Live preview" src="/?preview=1"></iframe></div>
        <div class="drawer-foot card" style="margin-top:14px;border-radius:16px"><button class="btn btn-ghost" data-reset>Reset to defaults</button><span class="grow"></span><button class="btn btn-ghost" data-draft>Save draft</button><button class="btn btn-primary" data-pub>${icon('check', 16)} Publish</button></div>
      </div>
    </div>`;
  const frame = $('iframe', view);
  let reloadT;
  const push = (reload) => {
    setPreview({ design: d });
    try { frame.contentWindow.postMessage({ type: 'shah:design', design: d }, location.origin); } catch { /* ignore */ }
    if (reload) { clearTimeout(reloadT); reloadT = setTimeout(() => frame.contentWindow.location.reload(), 350); }
  };
  const colors = [['primary', 'Primary'], ['secondary', 'Secondary'], ['navy', 'Navy / dark'], ['bg1', 'Background 1'], ['bg2', 'Background 2'], ['lavender', 'Soft accent']];
  const cbox = $('[data-colors]', view);
  const paintColors = () => {
    cbox.innerHTML = '';
    const f = buildForm(colors.map(([k, l]) => ({ key: k, label: l, type: 'color' })), d);
    f.onChange(v => { colors.forEach(([k]) => (d[k] = v[k])); d.gradient = 'custom'; $$('[data-grad]', view).forEach(b => b.setAttribute('aria-pressed', 'false')); push(); });
    [...f.el.children].forEach(c => cbox.appendChild(c));
  };
  const sync = () => {
    $$('[data-seg]', view).forEach(s => $$('button', s).forEach(b => b.setAttribute('aria-pressed', String(d[s.dataset.seg]) === b.dataset.v)));
    $$('[data-k]', view).forEach(i => { if (i.type === 'checkbox') i.checked = !!d[i.dataset.k]; else i.value = d[i.dataset.k]; });
    $$('[data-o]', view).forEach(o => { const v = d[o.dataset.o]; o.textContent = o.dataset.o === 'radius' ? v + 'px' : '×' + v; });
    $$('[data-t]', view).forEach(b => { const [h, bo] = TYPE_PRESETS[b.dataset.t]; b.setAttribute('aria-pressed', d.headingFont === h && d.bodyFont === bo); });
    const secs = $('[data-secs]', view);
    secs.innerHTML = d.sections.order.filter(k => SECTION_LABELS[k]).map((k, i, arr) => `<div class="sec-item"><span class="grow">${esc(SECTION_LABELS[k])}</span>
      <button class="icon-btn" data-sm="${k}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${icon('arrowUp', 15)}</button>
      <button class="icon-btn" data-sm="${k}" data-dir="1" ${i === arr.length - 1 ? 'disabled' : ''} aria-label="Move down" style="transform:rotate(180deg)">${icon('arrowUp', 15)}</button>
      <label class="switch"><input type="checkbox" data-vis="${k}" ${d.sections.hidden.includes(k) ? '' : 'checked'}><span class="t"></span></label></div>`).join('');
  };
  paintColors(); sync();

  view.addEventListener('click', e => {
    const g = e.target.closest('[data-grad]');
    if (g) { const p = GRADIENTS[g.dataset.grad]; Object.assign(d, { bg1: p.bg1, bg2: p.bg2, lavender: p.lavender, theme: p.theme, gradient: g.dataset.grad }); $$('[data-grad]', view).forEach(b => b.setAttribute('aria-pressed', b === g)); paintColors(); sync(); push(); return; }
    const sb = e.target.closest('[data-seg] button');
    if (sb) { const k = sb.closest('[data-seg]').dataset.seg; const raw = sb.dataset.v; d[k] = /^\d+$/.test(raw) ? +raw : raw; if (k === 'theme' && raw === 'light' && d.gradient === 'midnight') { Object.assign(d, GRADIENTS.lavender, { gradient: 'lavender' }); delete d.label; paintColors(); } sync(); push(k === 'heroLayout' || k === 'animIntensity'); return; }
    const tb = e.target.closest('[data-t]');
    if (tb) { [d.headingFont, d.bodyFont] = TYPE_PRESETS[tb.dataset.t]; sync(); push(); return; }
    const sm = e.target.closest('[data-sm]');
    if (sm) { const o = d.sections.order, i = o.indexOf(sm.dataset.sm), j = i + +sm.dataset.dir; if (j >= 0 && j < o.length) { [o[i], o[j]] = [o[j], o[i]]; sync(); push(true); } return; }
    const dv = e.target.closest('[data-dev]');
    if (dv) { $$('[data-dev]', view).forEach(b => b.setAttribute('aria-pressed', b === dv)); $('[data-frame]', view).classList.toggle('mobile', dv.dataset.dev === 'm'); return; }
    if (e.target.closest('[data-reload]')) frame.contentWindow.location.reload();
  });
  view.addEventListener('input', e => {
    const k = e.target.dataset.k;
    if (k) { d[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'range' ? +e.target.value : e.target.value; sync(); push(k === 'cursor'); }
    if (e.target.dataset.vis) { const key = e.target.dataset.vis; d.sections.hidden = e.target.checked ? d.sections.hidden.filter(x => x !== key) : [...d.sections.hidden, key]; push(true); }
  });
  view.addEventListener('change', e => { if (e.target.dataset.k && e.target.tagName === 'SELECT') { d[e.target.dataset.k] = e.target.value; sync(); push(); } });
  $('[data-reset]', view).onclick = async () => { if (!(await confirmBox('Reset all appearance settings to the original SHAH DESIGNS defaults? (Not published until you press Publish.)', { ok: 'Reset', danger: false }))) return; d = clone(D.DESIGN); paintColors(); sync(); push(true); };
  const run = async (publish, btn) => {
    busy(btn, true);
    try { await writeSetting('design', d, { publish }); toast(publish ? 'Appearance published' : 'Draft saved'); }
    catch (e) { toast(errMsg(e), 'err'); }
    busy(btn, false);
  };
  $('[data-draft]', view).onclick = e => run(false, e.currentTarget);
  $('[data-pub]', view).onclick = e => run(true, e.currentTarget);
}

/* ---------- Account & security ---------- */
async function renderAccount(view) {
  const u = await auth.me();
  S.user = u;
  view.innerHTML = `<div class="two-col">
    <div class="stack">
      <div class="card card-pad"><h3 style="margin-bottom:16px">Profile</h3><div class="grid2">
        <div class="fld"><label for="nm">Display name</label><input id="nm" value="${esc(u.name || '')}" maxlength="128"></div>
        <div class="fld"><span class="lbl">Profile picture</span><div style="display:flex;gap:10px;align-items:center"><span class="avatar" data-av style="width:44px;height:44px;${u.prefs?.avatar ? `background-image:url('${esc(u.prefs.avatar)}')` : ''}">${u.prefs?.avatar ? '' : esc((u.name || u.email)[0].toUpperCase())}</span><button class="btn btn-ghost btn-sm" data-pick>Change</button></div></div>
      </div><div style="margin-top:14px"><button class="btn btn-primary" data-save-name>Save profile</button></div></div>
      <div class="card card-pad"><h3 style="margin-bottom:16px">Change email</h3><div class="grid2">
        <div class="fld"><label for="em">New email</label><input id="em" type="email" value="${esc(u.email)}" autocomplete="email"></div>
        <div class="fld"><label for="emp">Current password</label><input id="emp" type="password" autocomplete="current-password"></div>
      </div><div style="margin-top:14px"><button class="btn btn-primary" data-save-email>Update email</button></div></div>
      <div class="card card-pad"><h3 style="margin-bottom:16px">Change password</h3><div class="grid2">
        <div class="fld"><label for="op">Current password</label><input id="op" type="password" autocomplete="current-password"></div>
        <div class="fld"><label for="np">New password <span class="hint">min. 12 characters</span></label><input id="np" type="password" autocomplete="new-password" minlength="12"></div>
      </div><div style="margin-top:14px"><button class="btn btn-primary" data-save-pass>Update password</button></div></div>
    </div>
    <div class="stack">
      <div class="card card-pad"><h3 style="margin-bottom:14px">Security review</h3><ul class="list-check">
        <li><span class="${u.emailVerification ? 'ok' : 'no'}">${icon(u.emailVerification ? 'check' : 'sparkles', 18)}</span>${u.emailVerification ? 'Email verified' : 'Email not verified (optional — verify in the Appwrite console)'}</li>
        <li><span class="${u.mfa ? 'ok' : 'no'}">${icon(u.mfa ? 'check' : 'sparkles', 18)}</span>${u.mfa ? 'Multi-factor authentication on' : 'MFA off — you can enable it for this user in the Appwrite console'}</li>
        <li><span class="ok">${icon('lock', 18)}</span>Admin access is limited to the “${esc(CONFIG.adminTeamId)}” team</li>
        <li><span class="ok">${icon('check', 18)}</span>Password last changed ${fmtDate(u.passwordUpdate)}</li>
      </ul></div>
      <div class="card"><div class="card-head"><h3>Active sessions</h3><span class="grow"></span><button class="btn btn-ghost btn-sm" data-others>Sign out other devices</button></div><div class="rows" data-sessions><div class="skeleton"></div></div></div>
      <div class="card card-pad"><h3 style="margin-bottom:10px">Forgot your password?</h3><p class="muted" style="font-size:14px;margin:0 0 12px">Send a reset link to ${esc(u.email)}.</p><button class="btn btn-ghost" data-recover>Email me a reset link</button></div>
    </div></div>`;
  const sess = async () => {
    try {
      const r = await auth.sessions();
      $('[data-sessions]', view).innerHTML = r.sessions.map(s => `<div class="row" style="grid-template-columns:38px minmax(0,1fr) auto"><span class="avatar" style="background:#EEF1FB;color:var(--primary)">${icon(s.deviceName === 'smartphone' ? 'smartphone' : 'monitor', 16)}</span><span class="ttl"><b>${esc([s.clientName, s.osName].filter(Boolean).join(' on ') || 'Unknown device')}</b><small>${esc([s.countryName, s.ip].filter(Boolean).join(' · '))} · ${fmtDate(s.$createdAt)}</small></span><span class="acts">${s.current ? '<span class="pill pub">This device</span>' : `<button class="icon-btn danger" data-kill="${esc(s.$id)}" aria-label="Sign out this session">${icon('logout', 15)}</button>`}</span></div>`).join('');
    } catch (e) { $('[data-sessions]', view).innerHTML = `<div class="empty">${esc(errMsg(e))}</div>`; }
  };
  sess();
  $('[data-save-name]', view).onclick = async e => { const b = e.currentTarget; busy(b, true); try { await auth.updateName($('#nm', view).value.trim()); toast('Profile saved'); renderTopUser(); } catch (er) { toast(errMsg(er), 'err'); } busy(b, false); };
  $('[data-pick]', view).onclick = async () => { const [url] = await pickMedia(); if (!url) return; try { await auth.updatePrefs({ ...(u.prefs || {}), avatar: url }); u.prefs = { ...(u.prefs || {}), avatar: url }; const av = $('[data-av]', view); av.style.backgroundImage = `url('${url}')`; av.textContent = ''; toast('Picture updated'); renderTopUser(); } catch (er) { toast(errMsg(er), 'err'); } };
  $('[data-save-email]', view).onclick = async e => { const b = e.currentTarget; busy(b, true); try { await auth.updateEmail($('#em', view).value.trim(), $('#emp', view).value); $('#emp', view).value = ''; toast('Email updated'); } catch (er) { toast(errMsg(er), 'err'); } busy(b, false); };
  $('[data-save-pass]', view).onclick = async e => {
    const np = $('#np', view).value; if (np.length < 12) return toast('Use at least 12 characters for the new password.', 'err');
    const b = e.currentTarget; busy(b, true);
    try { await auth.updatePassword(np, $('#op', view).value); $('#op', view).value = $('#np', view).value = ''; toast('Password updated'); } catch (er) { toast(errMsg(er), 'err'); } busy(b, false);
  };
  $('[data-recover]', view).onclick = async e => { const b = e.currentTarget; busy(b, true); try { await auth.recover(u.email, `${location.origin}/admin/reset`); toast('Reset link sent'); } catch (er) { toast(errMsg(er), 'err'); } busy(b, false); };
  view.addEventListener('click', async e => {
    const k = e.target.closest('[data-kill]');
    if (k) { try { await deleteSession(k.dataset.kill); toast('Session signed out'); sess(); } catch (er) { toast(errMsg(er), 'err'); } }
  });
  $('[data-others]', view).onclick = async () => {
    if (!(await confirmBox('Sign out of every other device?', { ok: 'Sign out others', danger: false }))) return;
    try { const r = await auth.sessions(); await Promise.all(r.sessions.filter(s => !s.current).map(s => deleteSession(s.$id))); toast('Other sessions signed out'); sess(); } catch (er) { toast(errMsg(er), 'err'); }
  };
}
const deleteSession = id => call('DELETE', `/account/sessions/${id}`);

/* ================================================================
   Shell, routing, boot
   ================================================================ */
function shell() {
  const groups = {};
  Object.entries(ROUTES).forEach(([k, r]) => (groups[r.group] = groups[r.group] || []).push([k, r]));
  app.innerHTML = `<div class="shell">
    <aside class="side" aria-label="Admin navigation">
      <a class="brand" href="#overview"><span class="mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 7.6C16.2 6 14.4 5 12 5 9 5 7 6.5 7 8.7c0 4.8 10.2 2.6 10.2 7.6 0 2.3-2.2 3.7-5.2 3.7-2.6 0-4.6-1-5.4-2.8" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></span><span>SHAH<small>ADMIN</small></span></a>
      ${Object.entries(groups).map(([g, items]) => `<div class="grp">${esc(g)}</div>${items.map(([k, r]) => `<a class="nav" href="#${k}" data-r="${k}">${icon(r.icon, 18)}<span>${esc(r.title)}</span>${k === 'messages' ? '<span class="count hidden" data-unread></span>' : ''}</a>`).join('')}`).join('')}
      <div class="foot"><a class="nav" href="/" target="_blank" rel="noopener">${icon('external', 18)}<span>View website</span></a><a class="nav" href="#" data-logout>${icon('logout', 18)}<span>Sign out</span></a></div>
    </aside>
    <div class="scrim" data-scrim></div>
    <div class="main">
      <header class="topbar"><button class="icon-btn menu-btn" data-menu aria-label="Open navigation">${icon('menu', 20)}</button><h1 data-title></h1><span class="grow"></span><div class="who" data-who></div></header>
      <section class="content" data-view tabindex="-1"></section>
    </div></div>`;
  $('[data-logout]').onclick = async e => { e.preventDefault(); try { await auth.logout(); } catch { /* ignore */ } location.replace('/admin/login'); };
  $('[data-menu]').onclick = () => document.body.classList.toggle('side-open');
  $('[data-scrim]').onclick = () => document.body.classList.remove('side-open');
  renderTopUser();
}
function renderTopUser() {
  auth.me().then(u => {
    S.user = u;
    const av = u.prefs?.avatar;
    $('[data-who]').innerHTML = `<span>${esc(u.name || u.email)}</span><a href="#settings" class="avatar" style="${av ? `background-image:url('${esc(av)}')` : ''}" aria-label="Account">${av ? '' : esc((u.name || u.email)[0].toUpperCase())}</a>`;
  }).catch(() => {});
}
function updateBadge() { const b = $('[data-unread]'); if (!b) return; b.textContent = S.unread; b.classList.toggle('hidden', !S.unread); }
async function refreshUnread() { try { S.unread = await db.count(C.messages, [Q.equal('read', false)]); updateBadge(); } catch { /* ignore */ } }

let routeToken = 0;
async function route() {
  const [key, param] = (location.hash.slice(1) || 'overview').split('/');
  const r = ROUTES[key] || ROUTES.overview;
  const k = ROUTES[key] ? key : 'overview';
  const token = ++routeToken;
  document.body.classList.remove('side-open');
  $$('[data-r]').forEach(a => a.setAttribute('aria-current', a.dataset.r === k ? 'page' : 'false'));
  $('[data-title]').textContent = r.title;
  document.title = `${r.title} — SHAH DESIGNS Admin`;
  const view = $('[data-view]');
  const fresh = view.cloneNode(false); view.replaceWith(fresh); // drop old listeners
  fresh.innerHTML = '<div class="card card-pad"><div class="skeleton" style="border:0"></div></div>';
  refreshUnread();
  try { await r.render(fresh, param); }
  catch (e) {
    if (token !== routeToken) return;
    if (e.code === 401) { location.replace('/admin/login'); return; }
    fresh.innerHTML = `<div class="alert alert-err">${icon('x', 16)}<span>${esc(errMsg(e))}${e.code === 404 ? ' — has the database been created? Run <code>npm run setup</code> (see README).' : ''}</span></div>`;
  }
}

function setupScreen() {
  app.innerHTML = `<div class="setup-card card card-pad"><div class="brand" style="margin-bottom:20px"><span class="mark">${icon('settings', 18)}</span><span>Connect Appwrite</span></div>
    <p>The dashboard needs an Appwrite project to store content securely. The public website already works with built-in default content.</p>
    <ol><li>Create a free project at <a href="https://cloud.appwrite.io" target="_blank" rel="noopener" style="color:var(--primary)">cloud.appwrite.io</a>.</li>
      <li>Add a <b>Web platform</b> for your domain (and <code>localhost</code> for testing).</li>
      <li>Put the endpoint and project ID in <code>assets/js/config.js</code>.</li>
      <li>Run <code>npm run setup</code> on your computer with an API key — it creates the database, storage and your admin account.</li>
      <li>Deploy, then sign in at <code>/admin/login</code>.</li></ol>
    <p class="muted">Full step-by-step instructions are in <b>README.md</b>.</p></div>`;
}

async function boot() {
  if (!isConfigured()) return setupScreen();
  try { S.user = await auth.me(); }
  catch { location.replace('/admin/login'); return; }
  let admin = false;
  try { admin = await auth.isAdmin(); } catch { /* treat as not admin */ }
  if (!admin) {
    await auth.logout().catch(() => {});
    app.innerHTML = `<div class="setup-card card card-pad"><h2>Access denied</h2><p class="muted">This account is not a member of the administrators team.</p><a class="btn btn-primary" href="/admin/login">Back to sign in</a></div>`;
    return;
  }
  shell();
  addEventListener('hashchange', route);
  await route();
  refreshUnread();
  setInterval(refreshUnread, 60000);
}

boot();
