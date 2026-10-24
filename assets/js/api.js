/* ------------------------------------------------------------------
   Minimal Supabase client (no npm needed) — Auth (GoTrue), Database
   (PostgREST) and Storage over plain fetch.

   It exposes the same small interface the site and dashboard use:
   auth · db · storage · Q · unpack/pack · loadSiteData.
   Rows are returned as "documents" with $id / $createdAt / $updatedAt.
   All access control is enforced by Row Level Security in Postgres.
------------------------------------------------------------------- */
import { CONFIG } from './config.js';
import * as D from './defaults.js';

const SESSION_KEY = 'shah_sb_session';
const C = CONFIG.collections;
const BASE = (CONFIG.supabaseUrl || '').replace(/\/$/, '');
const ANON = CONFIG.supabaseAnonKey || '';

export const isConfigured = () => Boolean(BASE && ANON);

export class ApiError extends Error {
  constructor(message, code, type) { super(message); this.code = code; this.type = type; }
}

const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* ignore */ } };

/* ================= session handling ================= */
function readSession() { try { return JSON.parse(lsGet(SESSION_KEY) || 'null'); } catch { return null; } }
function saveSession(s) {
  if (!s || !s.access_token) { lsSet(SESSION_KEY, null); return null; }
  const session = { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600), user: s.user };
  lsSet(SESSION_KEY, JSON.stringify(session));
  return session;
}

let refreshing = null;
async function validSession() {
  const s = readSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const r = await fetch(`${BASE}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
        if (!r.ok) { saveSession(null); return null; }
        return saveSession(await r.json());
      } catch { return s; } // offline: keep the old token, the request will report the error
      finally { setTimeout(() => { refreshing = null; }, 0); }
    })();
  }
  return refreshing;
}

/* ================= low-level request ================= */
function toError(status, body, fallback) {
  const msg = (body && (body.message || body.msg || body.error_description || body.error)) || fallback || 'Request failed';
  const pgCode = body && body.code;
  const errCode = body && (body.error_code || body.error);
  // map Postgres / PostgREST / GoTrue errors onto simple HTTP-like codes the UI understands
  if (pgCode === '23505') return new ApiError('This value already exists (it must be unique).', 409, 'duplicate');
  if (pgCode === '42501' || status === 403) return new ApiError('You do not have permission to do this. Please sign in as the admin again.', 401, 'unauthorized');
  if (pgCode === 'PGRST301' || pgCode === 'PGRST303' || errCode === 'bad_jwt') return new ApiError('Your session expired — please sign in again.', 401, 'jwt');
  if (pgCode === '42P01' || pgCode === 'PGRST205' || pgCode === 'PGRST202') return new ApiError('Database table not found — run supabase/schema.sql in the Supabase SQL editor.', 404, 'missing_table');
  if (errCode === 'invalid_credentials' || errCode === 'invalid_grant') return new ApiError('Incorrect email or password.', 401, 'user_invalid_credentials');
  if (errCode === 'email_not_confirmed') return new ApiError('This email address has not been confirmed yet.', 401, 'email_not_confirmed');
  if (status === 429 || errCode === 'over_request_rate_limit' || errCode === 'over_email_send_rate_limit') return new ApiError('Too many attempts — please wait a few minutes and try again.', 429, 'rate_limit');
  if (pgCode === '23514' || pgCode === '22001') return new ApiError('Some text is too long or invalid. Please shorten it and try again.', 400, 'invalid');
  return new ApiError(msg, status, errCode || pgCode);
}

async function request(method, path, { body, headers = {}, auth: useAuth = true, raw = false } = {}) {
  if (!isConfigured()) throw new ApiError('Supabase is not configured yet (assets/js/config.js).', 0, 'not_configured');
  const s = useAuth ? await validSession() : null;
  const h = { apikey: ANON, Authorization: `Bearer ${s ? s.access_token : ANON}`, ...headers };
  const init = { method, headers: h };
  if (body instanceof Blob || body instanceof FormData) init.body = body;
  else if (body !== undefined) { h['Content-Type'] = h['Content-Type'] || 'application/json'; init.body = JSON.stringify(body); }
  let res;
  try { res = await fetch(BASE + path, init); }
  catch { throw new ApiError('Network error — check your internet connection and the Supabase URL.', 0, 'network'); }
  if (raw) return res;
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw toError(res.status, data, res.statusText);
  return { data, res };
}

/* ================= queries ================= */
export const Q = {
  equal: (attribute, value) => JSON.stringify({ method: 'equal', attribute, values: Array.isArray(value) ? value : [value] }),
  orderAsc: attribute => JSON.stringify({ method: 'orderAsc', attribute }),
  orderDesc: attribute => JSON.stringify({ method: 'orderDesc', attribute }),
  limit: n => JSON.stringify({ method: 'limit', values: [n] }),
  offset: n => JSON.stringify({ method: 'offset', values: [n] }),
};

// app field name  <->  database column name
const TO_COL = { $id: 'id', $createdAt: 'created_at', $updatedAt: 'updated_at', order: 'sort_order', fileId: 'file_id' };
const FROM_COL = Object.fromEntries(Object.entries(TO_COL).map(([a, b]) => [b, a]));
const col = k => TO_COL[k] || k;
const pgVal = v => (v === null ? 'null' : typeof v === 'boolean' ? String(v) : `"${String(v).replace(/"/g, '\\"')}"`);

function buildQuery(queries = []) {
  const p = new URLSearchParams();
  const order = [];
  let limit = null, offset = null;
  for (const raw of queries) {
    const q = JSON.parse(raw);
    if (q.method === 'equal') {
      const vals = q.values;
      if (vals.length === 1) p.append(col(q.attribute), vals[0] === null ? 'is.null' : `eq.${vals[0]}`);
      else p.append(col(q.attribute), `in.(${vals.map(pgVal).join(',')})`);
    } else if (q.method === 'orderAsc') order.push(`${col(q.attribute)}.asc`);
    else if (q.method === 'orderDesc') order.push(`${col(q.attribute)}.desc`);
    else if (q.method === 'limit') limit = q.values[0];
    else if (q.method === 'offset') offset = q.values[0];
  }
  if (order.length) p.set('order', order.join(','));
  return { params: p, limit, offset };
}

const fromRow = row => {
  if (!row) return row;
  const d = {};
  for (const [k, v] of Object.entries(row)) d[FROM_COL[k] || k] = v;
  return d;
};
const toRow = obj => {
  const r = {};
  for (const [k, v] of Object.entries(obj)) { if (k === '$id') continue; r[col(k)] = v; }
  return r;
};
const totalFrom = res => { const m = (res.headers.get('content-range') || '').match(/\/(\d+|\*)$/); return m && m[1] !== '*' ? +m[1] : 0; };

export const uid = () => {
  const t = Date.now().toString(16);
  const r = Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('');
  return (t + r).slice(0, 20);
};

/* ================= database ================= */
export const db = {
  async list(table, queries = []) {
    const { params, limit, offset } = buildQuery(queries);
    params.set('select', '*');
    params.set('limit', limit ?? 25);
    if (offset) params.set('offset', offset);
    const { data, res } = await request('GET', `/rest/v1/${table}?${params}`, { headers: { Prefer: 'count=exact' } });
    return { total: totalFrom(res) || (data || []).length, documents: (data || []).map(fromRow) };
  },
  async get(table, id) {
    const { data } = await request('GET', `/rest/v1/${table}?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    if (!data || !data.length) throw new ApiError('Not found', 404, 'document_not_found');
    return fromRow(data[0]);
  },
  async create(table, data, _permissions, id) {
    const row = toRow(data);
    if (id) row.id = id;
    const signedIn = !!readSession();
    // visitors (contact form) may insert but not read back, so ask for no representation
    const { data: out } = await request('POST', `/rest/v1/${table}`, { body: row, headers: { Prefer: signedIn ? 'return=representation' : 'return=minimal' } });
    return out && out[0] ? fromRow(out[0]) : { ...data, $id: id || null };
  },
  async update(table, id, data) {
    const { data: out } = await request('PATCH', `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { body: toRow(data), headers: { Prefer: 'return=representation' } });
    if (!out || !out.length) throw new ApiError('Not found (or no permission)', 404, 'document_not_found');
    return fromRow(out[0]);
  },
  async remove(table, id) {
    const { data: out } = await request('DELETE', `/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { headers: { Prefer: 'return=representation' } });
    if (!out || !out.length) throw new ApiError('Not found (or no permission)', 404, 'document_not_found');
  },
  async count(table, queries = []) {
    const { params } = buildQuery(queries);
    params.set('select', 'id');
    params.set('limit', 1);
    const { res } = await request('GET', `/rest/v1/${table}?${params}`, { headers: { Prefer: 'count=exact' } });
    return totalFrom(res);
  },
  async all(table, queries = []) {
    const out = [];
    for (let off = 0; ; off += 500) {
      const r = await db.list(table, [...queries, Q.limit(500), Q.offset(off)]);
      out.push(...r.documents);
      if (r.documents.length < 500) break;
    }
    return out;
  },
};

/* ================= auth ================= */
const mapUser = u => u && ({
  ...u,
  $id: u.id,
  name: (u.user_metadata || {}).name || '',
  prefs: u.user_metadata || {},
  emailVerification: !!u.email_confirmed_at,
  mfa: (u.factors || []).some(f => f.status === 'verified'),
  passwordUpdate: u.updated_at,
});

async function passwordGrant(email, password) {
  const { data } = await request('POST', '/auth/v1/token?grant_type=password', { body: { email, password }, auth: false });
  return data;
}

export const auth = {
  async login(email, password) {
    const data = await passwordGrant(email, password);
    saveSession(data);
    return mapUser(data.user);
  },
  async logout(scope = 'local') {
    const s = readSession();
    try { if (s) await request('POST', `/auth/v1/logout?scope=${scope}`); }
    finally { if (scope !== 'others') saveSession(null); }
  },
  async me() {
    if (!readSession()) throw new ApiError('Not signed in', 401, 'no_session');
    const { data } = await request('GET', '/auth/v1/user');
    return mapUser(data);
  },
  async isAdmin() {
    if (!readSession()) return false;
    const { data } = await request('POST', '/rest/v1/rpc/is_admin', { body: {} });
    return data === true;
  },
  /** Sends a password-reset email. The link opens `redirectTo` with the session in the URL hash. */
  recover: (email, redirectTo) => request('POST', `/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { body: { email }, auth: false }),
  /** Used on /admin/reset: stores the session that arrived in the recovery link. */
  setSession(access_token, refresh_token, expires_in) { return saveSession({ access_token, refresh_token, expires_in: +expires_in || 3600 }); },
  async setPassword(password) { const { data } = await request('PUT', '/auth/v1/user', { body: { password } }); return mapUser(data); },
  async updatePassword(password, oldPassword) {
    const u = await auth.me();
    saveSession(await passwordGrant(u.email, oldPassword)); // verifies the current password
    return auth.setPassword(password);
  },
  async updateEmail(email, password) {
    const u = await auth.me();
    saveSession(await passwordGrant(u.email, password));
    const { data } = await request('PUT', '/auth/v1/user', { body: { email } });
    return mapUser(data);
  },
  async updateName(name) { const u = await auth.me(); const { data } = await request('PUT', '/auth/v1/user', { body: { data: { ...(u.user_metadata || {}), name } } }); return mapUser(data); },
  async updatePrefs(prefs) { const u = await auth.me(); const { data } = await request('PUT', '/auth/v1/user', { body: { data: { ...(u.user_metadata || {}), ...prefs } } }); return mapUser(data); },
  logoutOthers: () => request('POST', '/auth/v1/logout?scope=others'),
};

/* ================= storage ================= */
const objPath = id => String(id).split('/').map(encodeURIComponent).join('/');
export const storage = {
  url: fileId => `${BASE}/storage/v1/object/public/${CONFIG.bucketId}/${objPath(fileId)}`,
  /** Uploads a file (with progress). `fixedId` overwrites an existing object so its URL stays the same. */
  async upload(file, onProgress, fixedId) {
    const ext = ((file.name || '').match(/\.([a-z0-9]{1,5})$/i) || [, 'bin'])[1].toLowerCase();
    const fileId = fixedId || `${uid()}.${ext}`;
    const s = await validSession();
    if (!s) throw new ApiError('Please sign in again.', 401, 'no_session');
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE}/storage/v1/object/${CONFIG.bucketId}/${objPath(fileId)}`);
      xhr.setRequestHeader('apikey', ANON);
      xhr.setRequestHeader('Authorization', `Bearer ${s.access_token}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('Cache-Control', '3600');
      if (fixedId) xhr.setRequestHeader('x-upsert', 'true');
      xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress && onProgress(1); resolve(); return; }
        let body = null; try { body = JSON.parse(xhr.responseText); } catch { /* ignore */ }
        const code = +(body && body.statusCode) || xhr.status;
        reject(code === 413 || /size/i.test(body?.message || '') ? new ApiError('File is larger than the storage limit.', 413, 'too_large')
          : code === 415 || /mime/i.test(body?.message || '') ? new ApiError('This file type is not allowed.', 415, 'bad_type')
          : toError(code === 400 && /security/i.test(body?.message || '') ? 403 : code, body, 'Upload failed'));
      };
      xhr.onerror = () => reject(new ApiError('Network error during upload.', 0, 'network'));
      xhr.send(file);
    });
    return { $id: fileId, name: file.name, sizeOriginal: file.size };
  },
  async remove(fileId) {
    const { data } = await request('DELETE', `/storage/v1/object/${CONFIG.bucketId}`, { body: { prefixes: [fileId] } });
    if (Array.isArray(data) && !data.length) throw new ApiError('File not found', 404, 'file_not_found');
  },
};

/* ================= content helpers ================= */
export function unpack(doc) {
  let data = {};
  try { data = typeof doc.data === 'string' ? JSON.parse(doc.data || '{}') : (doc.data || {}); } catch { /* keep empty */ }
  const { data: _d, draft: _dr, ...meta } = doc;
  return { ...data, ...meta };
}

/** Builds the stored row from an editor object.
 *  Indexed fields are real columns; everything else goes into the `data` JSON text. */
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

/* ================= public site data (defaults + cache) ================= */
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
    const out = { ...base, source: 'supabase' };
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
