'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

test('profile service updates only the allowed profile fields for the signed-in user', async () => {
  const source = fs.readFileSync(path.join(ROOT, 'profile-service.js'), 'utf8');
  let updatePayload;
  let filteredUserId;
  const returned = {id: 'user-1', role: 'user', full_name: 'Updated Name'};
  const builder = {
    update(payload) { updatePayload = payload; return this; },
    eq(column, value) { assert.equal(column, 'id'); filteredUserId = value; return this; },
    select() { return this; },
    async single() { return {data: returned, error: null}; },
  };
  const window = {
    LumaAuth: {getSession: () => ({user: {id: 'user-1'}})},
    LumaSupabase: {getClient: () => ({from(table) { assert.equal(table, 'profiles'); return builder; }})},
  };
  vm.runInContext(source, vm.createContext({window}), {filename: 'profile-service.js'});

  const result = await window.LumaProfileService.updateCurrentProfile({
    full_name: ' Updated Name ',
    job_title: '',
    company: 'KSI',
    phone: '123',
    role: 'admin',
    id: 'another-user',
  });

  assert.deepEqual(JSON.parse(JSON.stringify(updatePayload)), {
    full_name: 'Updated Name',
    job_title: null,
    company: 'KSI',
    phone: '123',
  });
  assert.equal(filteredUserId, 'user-1');
  assert.equal(result, returned);
});

test('profile migration combines own-row RLS, column grants, and immutable security fields', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '20260829001400_extend_user_profiles.sql'), 'utf8');
  assert.match(sql, /using\s*\(\(select auth\.uid\(\)\) = id\)/i);
  assert.match(sql, /with check\s*\(\(select auth\.uid\(\)\) = id\)/i);
  assert.match(sql, /grant update \(full_name, job_title, company, phone\)/i);
  assert.match(sql, /new\.role is distinct from old\.role/i);
  assert.match(sql, /new\.id is distinct from old\.id/i);
  assert.doesNotMatch(sql, /grant update \([^)]*role/i);
});

test('auth flow uses recovery events, CAPTCHA tokens, and native current-password verification', () => {
  const source = fs.readFileSync(path.join(ROOT, 'auth.js'), 'utf8');
  assert.match(source, /event === 'PASSWORD_RECOVERY'/);
  assert.match(source, /resetPasswordForEmail\([^]*captchaToken:/);
  assert.match(source, /current_password:\s*elements\.currentPassword\.value/);
  assert.match(source, /GENERIC_RESET_CONFIRMATION/);
  assert.doesNotMatch(source, /console\.error\([^\n]*password/i);
});

test('browser auth configuration contains no privileged Supabase or Turnstile secret', () => {
  const config = fs.readFileSync(path.join(ROOT, 'auth-config.js'), 'utf8');
  const client = fs.readFileSync(path.join(ROOT, 'supabase-client.js'), 'utf8');
  assert.doesNotMatch(config, /service_role|database password/i);
  assert.doesNotMatch(client, /service_role|secret key|database password/i);
  assert.match(client, /sb_publishable_/);
});

test('password-reset redirects follow the current static deployment origin and path', () => {
  const source = fs.readFileSync(path.join(ROOT, 'auth-config.js'), 'utf8');
  for (const location of [
    {origin: 'http://127.0.0.1:5500', pathname: '/'},
    {origin: 'https://example.github.io', pathname: '/LUMA-BOM-Manager-Staging/'},
    {origin: 'https://example.github.io', pathname: '/LUMA-BOM-Manager/'},
  ]) {
    const window = {location};
    vm.runInContext(source, vm.createContext({window}), {filename: 'auth-config.js'});
    assert.equal(window.LumaAuthConfig.getPasswordResetRedirectUrl(), `${location.origin}${location.pathname}`);
  }
});

test('signed-in profile menu is at the top of the left column without a Sidebar title', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const accountPosition = html.indexOf('class="sidebar-account-section"');
  const workspacePosition = html.indexOf('class="sidebar-section"');
  const headerStart = html.indexOf('class="app-header"');
  const headerEnd = html.indexOf('</header>', headerStart);
  assert.ok(accountPosition > -1 && accountPosition < workspacePosition);
  assert.doesNotMatch(html, />\s*Sidebar\s*</i);
  assert.doesNotMatch(html.slice(headerStart, headerEnd), /id="accountMenuBtn"/);
});
