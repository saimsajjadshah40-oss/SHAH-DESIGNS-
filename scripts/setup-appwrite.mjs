#!/usr/bin/env node
/* ------------------------------------------------------------------
   SHAH DESIGNS — Appwrite setup (no dependencies, Node 18+)

   Creates (idempotently — safe to run again):
     • database "shah" with all collections, attributes and indexes
     • storage bucket "media" with file type/size limits
     • team "admins" and your administrator account (added to the team)
     • default settings, slides and services

   Usage:
     1. Copy .env.example to .env and fill it in (never commit .env)
     2. npm run setup
   Options:
     --update-password   also set ADMIN_PASSWORD on an existing admin user
------------------------------------------------------------------- */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- minimal .env loader ---
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const { CONFIG } = await import('../assets/js/config.js');
const D = await import('../assets/js/defaults.js');

const ENDPOINT = (process.env.APPWRITE_ENDPOINT || CONFIG.endpoint || '').replace(/\/$/, '');
const PROJECT = process.env.APPWRITE_PROJECT_ID || CONFIG.projectId;
const KEY = process.env.APPWRITE_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'saimsajjadshah40@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_NAME = process.env.ADMIN_NAME || 'SHAH DESIGNS Admin';
const UPDATE_PASSWORD = process.argv.includes('--update-password');

if (!ENDPOINT || !PROJECT || !KEY) {
  console.error('\n✖ Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID or APPWRITE_API_KEY. See .env.example and README.\n');
  process.exit(1);
}

const DB = CONFIG.databaseId;
const COL = CONFIG.collections;
const TEAM = CONFIG.adminTeamId;
const A = r => `${r}("team:${TEAM}")`;
const ADMIN_ALL = ['read', 'create', 'update', 'delete'].map(A);

const c = { g: s => `\x1b[32m${s}\x1b[0m`, y: s => `\x1b[33m${s}\x1b[0m`, r: s => `\x1b[31m${s}\x1b[0m`, b: s => `\x1b[1m${s}\x1b[0m` };
const log = (sym, msg) => console.log(`${sym} ${msg}`);

async function api(method, path, body) {
  const url = new URL(ENDPOINT + path);
  const init = { method, headers: { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': KEY } };
  if (method === 'GET' && body) {
    for (const [k, v] of Object.entries(body)) (Array.isArray(v) ? v : [v]).forEach(x => url.searchParams.append(Array.isArray(v) ? `${k}[]` : k, x));
  } else if (body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
  const res = await fetch(url, init);
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) { const e = new Error(`${method} ${path} → ${res.status} ${data?.message || text}`); e.code = res.status; e.type = data?.type; throw e; }
  return data;
}
async function ensure(label, fn) {
  try { await fn(); log(c.g('✔'), label); return 'created'; }
  catch (e) { if (e.code === 409) { log(c.y('•'), `${label} ${c.y('(already exists)')}`); return 'exists'; } throw e; }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const q = { equal: (a, v) => JSON.stringify({ method: 'equal', attribute: a, values: [v] }), limit: n => JSON.stringify({ method: 'limit', values: [n] }) };

/* ---------------- schema ---------------- */
const str = (key, size, extra = {}) => ({ t: 'string', key, size, required: false, default: null, ...extra });
const int = (key, extra = {}) => ({ t: 'integer', key, required: false, default: 0, min: 0, max: 1000000, ...extra });
const bool = (key, def = false) => ({ t: 'boolean', key, required: false, default: def });

const COLLECTIONS = [
  { id: COL.settings, name: 'Site settings', perms: ['read("any")', A('create'), A('update'), A('delete')], docSec: false,
    attrs: [str('data', 200000), str('draft', 200000)], indexes: [] },
  { id: COL.slides, name: 'Swipe slides', perms: ADMIN_ALL, docSec: true,
    attrs: [int('order'), bool('published'), str('data', 60000)],
    indexes: [['order_idx', 'key', ['order']], ['published_idx', 'key', ['published']]] },
  { id: COL.projects, name: 'Portfolio projects', perms: ADMIN_ALL, docSec: true,
    attrs: [str('slug', 100), str('category', 40), bool('published'), bool('featured'), int('order'), str('data', 100000)],
    indexes: [['slug_unique', 'unique', ['slug']], ['category_idx', 'key', ['category']], ['published_idx', 'key', ['published']], ['order_idx', 'key', ['order']]] },
  { id: COL.services, name: 'Services', perms: ADMIN_ALL, docSec: true,
    attrs: [str('slug', 100), bool('published'), int('order'), str('data', 60000)],
    indexes: [['slug_unique', 'unique', ['slug']], ['published_idx', 'key', ['published']], ['order_idx', 'key', ['order']]] },
  { id: COL.testimonials, name: 'Testimonials', perms: ADMIN_ALL, docSec: true,
    attrs: [bool('published'), int('order'), str('data', 20000)],
    indexes: [['published_idx', 'key', ['published']], ['order_idx', 'key', ['order']]] },
  { id: COL.messages, name: 'Contact messages', perms: ['create("any")', A('read'), A('update'), A('delete')], docSec: false,
    attrs: [str('name', 100, { required: true, default: undefined }), str('email', 254, { required: true, default: undefined }), str('phone', 40), str('service', 100, { required: true, default: undefined }),
      str('budget', 60), str('details', 5000, { required: true, default: undefined }), str('status', 20, { default: 'new' }), str('notes', 5000), bool('read'), str('source', 20)],
    indexes: [['read_idx', 'key', ['read']], ['status_idx', 'key', ['status']]] },
  { id: COL.media, name: 'Media library', perms: ADMIN_ALL, docSec: false,
    attrs: [str('name', 200), str('fileId', 64), str('url', 600), str('category', 60), str('kind', 20), str('mime', 100), int('size', { max: 2000000000 })],
    indexes: [['category_idx', 'key', ['category']], ['kind_idx', 'key', ['kind']]] },
];

async function createAttr(col, a) {
  const base = `/databases/${DB}/collections/${col}/attributes`;
  const body = { key: a.key, required: a.required };
  if (!a.required && a.default !== undefined) body.default = a.default;
  if (a.t === 'string') Object.assign(body, { size: a.size });
  if (a.t === 'integer') Object.assign(body, { min: a.min, max: a.max });
  return ensure(`  attribute ${col}.${a.key}`, () => api('POST', `${base}/${a.t}`, body));
}
async function waitAttrs(col, keys) {
  for (let i = 0; i < 60; i++) {
    const r = await api('GET', `/databases/${DB}/collections/${col}/attributes`);
    const pending = r.attributes.filter(a => keys.includes(a.key) && a.status !== 'available');
    const failed = r.attributes.filter(a => keys.includes(a.key) && a.status === 'failed');
    if (failed.length) throw new Error(`Attribute(s) failed on ${col}: ${failed.map(f => f.key).join(', ')}`);
    if (!pending.length) return;
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for attributes on ${col}`);
}

/* ---------------- run ---------------- */
console.log(c.b(`\nSHAH DESIGNS · Appwrite setup\n${ENDPOINT} · project ${PROJECT}\n`));

try {
  await ensure(`database "${DB}"`, () => api('POST', '/databases', { databaseId: DB, name: 'SHAH DESIGNS' }));

  for (const col of COLLECTIONS) {
    await ensure(`collection "${col.id}"`, () => api('POST', `/databases/${DB}/collections`, { collectionId: col.id, name: col.name, permissions: col.perms, documentSecurity: col.docSec, enabled: true }));
    // keep permissions in sync on re-runs
    await api('PUT', `/databases/${DB}/collections/${col.id}`, { name: col.name, permissions: col.perms, documentSecurity: col.docSec, enabled: true });
    for (const a of col.attrs) await createAttr(col.id, a);
    await waitAttrs(col.id, col.attrs.map(a => a.key));
    for (const [key, type, attributes] of col.indexes) {
      await ensure(`  index ${col.id}.${key}`, () => api('POST', `/databases/${DB}/collections/${col.id}/indexes`, { key, type, attributes, orders: attributes.map(() => 'ASC') }));
    }
  }

  const bucket = {
    name: 'Media', permissions: ['read("any")', A('create'), A('update'), A('delete')], fileSecurity: false, enabled: true,
    maximumFileSize: 50 * 1000 * 1000, allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'mp4', 'webm', 'pdf'],
    compression: 'none', encryption: false, antivirus: true,
  };
  const b = await ensure(`storage bucket "${CONFIG.bucketId}"`, () => api('POST', '/storage/buckets', { bucketId: CONFIG.bucketId, ...bucket }));
  if (b === 'exists') await api('PUT', `/storage/buckets/${CONFIG.bucketId}`, bucket);

  await ensure(`team "${TEAM}"`, () => api('POST', '/teams', { teamId: TEAM, name: 'Administrators' }));

  // admin user
  let user;
  const found = await api('GET', '/users', { queries: [q.equal('email', ADMIN_EMAIL), q.limit(1)] });
  if (found.users.length) {
    user = found.users[0];
    log(c.y('•'), `admin user ${ADMIN_EMAIL} ${c.y('(already exists)')}`);
    if (UPDATE_PASSWORD) {
      if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
      await api('PATCH', `/users/${user.$id}/password`, { password: ADMIN_PASSWORD });
      log(c.g('✔'), 'admin password updated');
    }
  } else {
    if (ADMIN_PASSWORD.length < 12) throw new Error('Set ADMIN_PASSWORD (min. 12 characters) in .env to create the admin account.');
    user = await api('POST', '/users', { userId: 'unique()', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME });
    log(c.g('✔'), `admin user ${ADMIN_EMAIL} created`);
  }
  const mem = await api('GET', `/teams/${TEAM}/memberships`, { queries: [q.limit(100)] });
  if (mem.memberships.some(m => m.userId === user.$id)) log(c.y('•'), `admin already in team "${TEAM}"`);
  else { await api('POST', `/teams/${TEAM}/memberships`, { userId: user.$id, roles: ['owner'] }); log(c.g('✔'), `admin added to team "${TEAM}"`); }

  // seed settings
  const SETTINGS = { design: D.DESIGN, whatsapp: D.WHATSAPP, content: D.CONTENT, social: D.SOCIAL, seo: D.SEO };
  for (const [id, val] of Object.entries(SETTINGS)) {
    await ensure(`settings "${id}"`, () => api('POST', `/databases/${DB}/collections/${COL.settings}/documents`, { documentId: id, data: { data: JSON.stringify(val), draft: '' } }));
  }

  // seed slides + services when empty
  const seed = async (col, list, indexed) => {
    const existing = await api('GET', `/databases/${DB}/collections/${col}/documents`, { queries: [q.limit(1)] });
    if (existing.total) { log(c.y('•'), `${col}: ${existing.total} document(s) already present — not seeding`); return; }
    for (const item of list) {
      const { $id, ...rest } = item;
      const data = {}; const extra = {};
      for (const [k, v] of Object.entries(rest)) (indexed.includes(k) ? data : extra)[k] = v;
      data.data = JSON.stringify(extra);
      await api('POST', `/databases/${DB}/collections/${col}/documents`, { documentId: $id, data, permissions: item.published ? ['read("any")'] : [] });
    }
    log(c.g('✔'), `${col}: seeded ${list.length} default document(s)`);
  };
  await seed(COL.slides, D.SLIDES, ['order', 'published']);
  await seed(COL.services, D.SERVICES, ['slug', 'published', 'order']);

  console.log(c.b(`\n✔ Setup complete.`));
  console.log(`Next: in the Appwrite console → your project → Overview → "Add platform" → Web,
and add your site's hostname (e.g. your-site.netlify.app, yourdomain.com and localhost).
Then sign in at /admin/login with ${ADMIN_EMAIL}.\n`);
} catch (e) {
  console.error(c.r(`\n✖ ${e.message}\n`));
  if (e.code === 401) console.error('Check that the API key has these scopes: databases.read/write, collections.read/write, attributes.read/write, indexes.read/write, documents.read/write, buckets.read/write, users.read/write, teams.read/write.\n');
  process.exit(1);
}
