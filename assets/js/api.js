/* ------------------------------------------------------------------
   Minimal Appwrite REST client (no npm needed).
   Mirrors the official Web SDK's session handling, including the
   X-Fallback-Cookies mechanism for browsers that block 3rd-party
   cookies. All access control is enforced by Appwrite permissions.
------------------------------------------------------------------- */
import { CONFIG } from './config.js';
import * as D from './defaults.js';

const FALLBACK_KEY = 'shah_cookieFallback';
const C = CONFIG.collections;

export const isConfigured = () => Boolean(CONFIG.endpoint && CONFIG.projectId);

export class ApiError extends Error {
  constructor(message, code, type) { super(message); this.code = code; this.type = type; }
}

function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } }

export async function call(method, path, body, extraHeaders = {}) {
  if (!isConfigured()) throw new ApiError('Appwrite is not configured yet (assets/js/config.js).', 0, 'not_configured');
  const url = new URL(CONFIG.endpoint.replace(/\/$/, '') + path);
  const headers = { 'X-Appwrite-Project': CONFIG.projectId, ...extraHeaders };
  const fb = lsGet(FALLBACK_KEY);
  if (fb) headers['X-Fallback-Cookies'] = fb;
  const init = { method, headers, credentials: 'include' };

  if (method === 'GET' && body) {
    for (const [k, v] of Object.entries(body)) {
      if (Array.isArray(v)) v.forEach(x => url.searchParams.append(`${k}[]`, x));
      else if (v !== undefined && v !== null) url.searchParams.set(k, v);
    }
  } else if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let res;
  try { res = await fetch(url, init); }
  catch (e) { throw new ApiError('Network error — check your connection and the Appwrite endpoint / platform settings.', 0, 'network'); }

  const fallback = res.headers.get('X-Fallback-Cookies');
  if (fallback) lsSet(FALLBACK_KEY, fallback);

  const type = res.headers.get('content-type') || '';
  const data = type.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError((data && data.message) || res.statusText, res.status, data && data.type);
  return data;
}

/* ---------- queries (Appwrite 1.5+ JSON format) ---------- */
export const Q = {
  equal: (attribute, value) => JSON.stringify({ method: 'equal', attribute, values: Array.isArray(value) ? value : [value] }),
  orderAsc: attribute => JSON.stringify({ method: 'orderAsc', attribute }),
  orderDesc: attribute => JSON.stringify({ method: 'orderDesc', attribute }),
  limit: n => JSON.stringify({ method: 'limit', values: [n] }),
  offset: n => JSON.stringify({ method: 'offset', values: [n] }),
};

export const Perm = {
  readAny: 'read("any")',
};

export const uid = () => {
  const t = Date.now().toString(16);
  const r = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('');
  return (t + r).slice(0, 20);
};

/* ---------- auth ---------- */
export const auth = {
  login: (email, password) => call('POST', '/account/sessions/email', { email, password }),
  logout: async () => { try { await call('DELETE', '/account/sessions/current'); } finally { lsSet(FALLBACK_KEY, ''); } },
  me: () => call('GET', '/account'),
  teams: () => call('GET', '/teams'),
  async isAdmin() {
    const t = await call('GET', '/teams');
    return (t.teams || []).some(x => x.$id === CONFIG.adminTeamId);
  },
  recover: (email, url) => call('POST', '/account/recovery', { email, url }),
  completeRecovery: (userId, secret, password) => call('PUT', '/account/recovery', { userId, secret, password }),
  updatePassword: (password, oldPassword) => call('PATCH', '/account/password', { password, oldPassword }),
  updateEmail: (email, password) => call('PATCH', '/account/email', { email, password }),
  updateName: name => call('PATCH', '/account/name', { name }),
  updatePrefs: prefs => call('PATCH', '/account/prefs', { prefs }),
  sessions: () => call('GET', '/account/sessions'),
  logoutAll: () => call('DELETE', '/account/sessions'),
};

/* ---------- documents ---------- */
const docPath = (col, id) => `/databases/${CONFIG.databaseId}/collections/${col}/documents${id ? '/' + id : ''}`;

export const db = {
  list: (col, queries = []) => call('GET', docPath(col), { queries }),
  get: (col, id) => call('GET', docPath(col, id)),
  create: (col, data, permissions, id) => call('POST', docPath(col), { documentId: id || uid(), data, ...(permissions ? { permissions } : {}) }),
  update: (col, id, data, permissions) => call('PATCH', docPath(col, id), { data, ...(permissions ? { permissions } : {}) }),
  remove: (col, id) => call('DELETE', docPath(col, id)),
  async count(col, queries = []) {
    const r = await call('GET', docPath(col), { queries: [...queries, Q.limit(1)] });
    return r.total;
  },
  async all(col, queries = []) {
    const out = [];
    let offset = 0;
    for (;;) {
      const r = await call('GET', docPath(col), { queries: [...queries, Q.limit(100), Q.offset(offset)] });
      out.push(...r.documents);
      offset += r.documents.length;
      if (!r.documents.length || offset >= r.total) break;
    }
    return out;
  },
};

/* ---------- storage ---------- */
const CHUNK = 5 * 1024 * 1024;
export const storage = {
  url: fileId => `${CONFIG.endpoint.replace(/\/$/, '')}/storage/buckets/${CONFIG.bucketId}/files/${fileId}/view?project=${CONFIG.projectId}`,
  list: (queries = []) => call('GET', `/storage/buckets/${CONFIG.bucketId}/files`, { queries }),
  remove: fileId => call('DELETE', `/storage/buckets/${CONFIG.bucketId}/files/${fileId}`),
  async upload(file, onProgress, fixedId) {
    const path = `/storage/buckets/${CONFIG.bucketId}/files`;
    const fileId = fixedId || uid();
    if (file.size <= CHUNK) {
      const fd = new FormData();
      fd.append('fileId', fileId);
      fd.append('file', file);
      const r = await call('POST', path, fd);
      onProgress && onProgress(1);
      return r;
    }
    let result;
    for (let start = 0; start < file.size; start += CHUNK) {
      const end = Math.min(start + CHUNK, file.size);
      const fd = new FormData();
      fd.append('fileId', fileId);
      fd.append('file', file.slice(start, end), file.name);
      const headers = { 'Content-Range': `bytes ${start}-${end - 1}/${file.size}` };
      if (start > 0) headers['x-appwrite-id'] = fileId;
      result = await call('POST', path, fd, headers);
      onProgress && onProgress(end / file.size);
    }
    return result;
  },
};

/* ---------- content helpers ---------- */
export function unpack(doc) {
  let data = {};
  try { data = JSON.parse(doc.data || '{}'); } catch { /* keep empty */ }
  const { data: _d, draft: _dr, $collectionId, $databaseId, $permissions, ...meta } = doc;
  return { ...data, ...meta };
}

/** Builds the stored document from an editor object.
 *  Indexed fields live as real attributes; everything else goes into `data` JSON. */
export function pack(obj, fields) {
  const out = {};
  const rest = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (fields.includes(k)) out[k] = v; else rest[k] = v;
  }
  out.data = JSON.stringify(rest);
  return out;
}

export const INDEXED = {
  slides: ['order', 'published'],
  projects: ['slug', 'category', 'published', 'featured', 'order'],
  services: ['slug', 'published', 'order'],
  testimonials: ['published', 'order'],
};

/* Settings documents: design, whatsapp, content, social, seo */
export async function getSetting(key, { draft = false } = {}) {
  const doc = await db.get(C.settings, key);
  const raw = draft && doc.draft ? doc.draft : doc.data;
  return JSON.parse(raw || '{}');
}

/* ---------- public site data (with defaults + cache) ---------- */
const CACHE_KEY = 'shah_site_v1';
const deepMerge = (base, over) => {
  if (!over || typeof over !== 'object' || Array.isArray(over)) return over ?? base;
  const out = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = (base && typeof base[k] === 'object' && !Array.isArray(base[k]) && v && typeof v === 'object' && !Array.isArray(v))
      ? deepMerge(base[k], v) : v;
  }
  return out;
};

export function defaultsBundle() {
  return {
    design: D.DESIGN, whatsapp: D.WHATSAPP, content: D.CONTENT, social: D.SOCIAL, seo: D.SEO,
    slides: D.SLIDES, services: D.SERVICES, projects: D.PROJECTS, testimonials: D.TESTIMONIALS,
    categories: D.CATEGORIES, source: 'defaults',
  };
}

function readCache() {
  try { const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null'); return c && Date.now() - c.t < 5 * 60 * 1000 ? c.v : null; }
  catch { return null; }
}
function writeCache(v) { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v })); } catch { /* ignore */ } }
export function clearSiteCache() { try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ } }

export async function loadSiteData() {
  const base = defaultsBundle();
  if (!isConfigured()) return base;
  const cached = readCache();
  if (cached) return cached;
  try {
    const pub = [Q.equal('published', true), Q.orderAsc('order')];
    const [settings, slides, services, projects, testimonials] = await Promise.all([
      db.list(C.settings, [Q.limit(25)]).catch(() => ({ documents: [] })),
      db.all(C.slides, pub).catch(() => []),
      db.all(C.services, pub).catch(() => []),
      db.all(C.projects, pub).catch(() => []),
      db.all(C.testimonials, pub).catch(() => []),
    ]);
    const out = { ...base, source: 'appwrite' };
    for (const doc of settings.documents || []) {
      try {
        const val = JSON.parse(doc.data || '{}');
        if (doc.$id in out) out[doc.$id] = deepMerge(out[doc.$id], val);
      } catch { /* ignore bad json */ }
    }
    if (slides.length) out.slides = slides.map(unpack);
    if (services.length) out.services = services.map(unpack);
    if (projects.length) out.projects = projects.map(unpack);
    out.testimonials = testimonials.map(unpack);
    writeCache(out);
    return out;
  } catch (e) {
    console.warn('[SHAH] Falling back to defaults:', e.message);
    return base;
  }
}

export { deepMerge };
