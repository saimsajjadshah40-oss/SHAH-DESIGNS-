/* Admin login, password recovery and reset */
import { auth, isConfigured } from './api.js';
import { esc, icon } from './ui.js';

const $ = s => document.querySelector(s);
const msg = (el, text, type = 'err') => { $(el).innerHTML = text ? `<div class="alert alert-${type}">${icon(type === 'ok' ? 'check' : type === 'info' ? 'sparkles' : 'x', 16)}<span>${text}</span></div>` : ''; };

function friendly(e) {
  if (e.type === 'not_configured') return 'Supabase is not configured yet. Add your project URL and anon key in <code>assets/js/config.js</code> (see README).';
  if (e.type === 'user_invalid_credentials') return 'Incorrect email or password.';
  if (e.type === 'email_not_confirmed') return 'This email is not confirmed yet. In Supabase → Authentication → Users, confirm the user (or create it with “Auto Confirm User”).';
  if (e.type === 'missing_table') return 'The database is not set up yet — run <code>supabase/schema.sql</code> in the Supabase SQL editor.';
  if (e.code === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (e.type === 'network') return esc(e.message);
  return esc(e.message || 'Something went wrong.');
}

async function initLogin() {
  if (!isConfigured()) {
    msg('#cfg-alert', 'Supabase is not connected yet. Follow the README “Supabase setup” section, then reload this page.', 'warn');
  } else {
    try { await auth.me(); if (await auth.isAdmin()) { location.replace('/admin/dashboard'); return; } } catch { /* not signed in */ }
  }
  const form = $('#login-form'), forgot = $('#forgot-form');
  $('#show-forgot').addEventListener('click', () => { form.classList.add('hidden'); forgot.classList.remove('hidden'); forgot.email.value = form.email.value; forgot.email.focus(); });
  $('#back-login').addEventListener('click', () => { forgot.classList.add('hidden'); form.classList.remove('hidden'); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg('#login-msg', '');
    const email = form.email.value.trim(), password = form.password.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) { msg('#login-msg', 'Enter a valid email and password (min. 8 characters).'); return; }
    const btn = form.querySelector('[type="submit"]'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    try {
      try { await auth.logout(); } catch { /* no active session */ }
      await auth.login(email, password);
      if (!(await auth.isAdmin())) {
        await auth.logout().catch(() => {});
        msg('#login-msg', 'This account is not an administrator of this website. Run the last statement of <code>supabase/schema.sql</code> to make it the admin.');
        return;
      }
      location.replace('/admin/dashboard');
    } catch (err) { msg('#login-msg', friendly(err)); }
    finally { btn.disabled = false; btn.textContent = 'Sign in'; }
  });

  forgot.addEventListener('submit', async e => {
    e.preventDefault();
    const email = forgot.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg('#forgot-msg', 'Enter a valid email.'); return; }
    const btn = forgot.querySelector('[type="submit"]'); btn.disabled = true;
    try {
      await auth.recover(email, `${location.origin}/admin/reset`);
      msg('#forgot-msg', 'If this email belongs to the admin account, a reset link is on its way. Check your inbox (and spam).', 'ok');
    } catch (err) {
      // do not reveal whether the account exists
      if (err.code === 404) msg('#forgot-msg', 'If this email belongs to the admin account, a reset link is on its way.', 'ok');
      else msg('#forgot-msg', friendly(err));
    } finally { btn.disabled = false; }
  });
}

function initReset() {
  // Supabase recovery links arrive as /admin/reset#access_token=…&refresh_token=…&type=recovery
  const h = new URLSearchParams(location.hash.slice(1));
  const form = $('#reset-form');
  if (h.get('error_description') || h.get('error')) {
    msg('#reset-msg', `${esc(h.get('error_description') || h.get('error'))}. Request a new reset link from the sign-in page.`);
    form.querySelector('[type="submit"]').disabled = true; return;
  }
  if (h.get('access_token')) {
    auth.setSession(h.get('access_token'), h.get('refresh_token'), h.get('expires_in'));
    history.replaceState(null, '', location.pathname); // remove tokens from the address bar
  } else {
    try { if (!localStorage.getItem('shah_sb_session')) throw 0; } catch {
      msg('#reset-msg', 'This reset link is incomplete or expired. Request a new one from the sign-in page.');
      form.querySelector('[type="submit"]').disabled = true; return;
    }
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const a = form.password.value, b = form.confirm.value;
    if (a.length < 12) { msg('#reset-msg', 'Use at least 12 characters.'); return; }
    if (a !== b) { msg('#reset-msg', 'The passwords do not match.'); return; }
    const btn = form.querySelector('[type="submit"]'); btn.disabled = true;
    try {
      await auth.setPassword(a);
      msg('#reset-msg', 'Password updated. <a href="/admin/dashboard" style="text-decoration:underline">Open the dashboard</a>.', 'ok');
      form.reset();
    } catch (err) {
      msg('#reset-msg', err.code === 401 ? 'This reset link has expired. Request a new one from the sign-in page.' : friendly(err));
      btn.disabled = false;
    }
  });
}

document.body.dataset.view === 'reset' ? initReset() : initLogin();
