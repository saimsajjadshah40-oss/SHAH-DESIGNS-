#!/usr/bin/env node
/* Regenerates sitemap.xml + robots.txt for your domain, including every
   published project and service from Appwrite (public read, no API key).
   Usage: npm run sitemap -- https://yourdomain.com                      */
import { writeFileSync } from 'node:fs';
import { CONFIG } from '../assets/js/config.js';
import * as D from '../assets/js/defaults.js';

const site = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https?:\/\/[^/]+$/.test(site)) { console.error('Usage: npm run sitemap -- https://yourdomain.com'); process.exit(1); }

async function list(col) {
  if (!CONFIG.projectId) return [];
  const url = new URL(`${CONFIG.endpoint.replace(/\/$/, '')}/databases/${CONFIG.databaseId}/collections/${col}/documents`);
  url.searchParams.append('queries[]', JSON.stringify({ method: 'equal', attribute: 'published', values: [true] }));
  url.searchParams.append('queries[]', JSON.stringify({ method: 'limit', values: [500] }));
  const r = await fetch(url, { headers: { 'X-Appwrite-Project': CONFIG.projectId } });
  if (!r.ok) throw new Error(`${col}: ${r.status}`);
  return (await r.json()).documents;
}

const pages = ['/', '/about', '/services', '/portfolio', '/motion-graphics', '/contact'];
let projects = [], services = [];
try { [projects, services] = await Promise.all([list(CONFIG.collections.projects), list(CONFIG.collections.services)]); }
catch (e) { console.warn('Could not read Appwrite, using defaults only:', e.message); }
if (!services.length) services = D.SERVICES;
const urls = [...pages, ...services.map(s => `/services/${s.slug}`), ...projects.map(p => `/portfolio/${p.slug}`)];
const now = new Date().toISOString().slice(0, 10);
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${site}${u}</loc><lastmod>${now}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(`✔ sitemap.xml (${urls.length} URLs) and robots.txt written for ${site}`);
