'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const AUTH_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');

function createElement() {
  const listeners = new Map();
  return {
    hidden: false,
    disabled: false,
    textContent: '',
    title: '',
    value: '',
    className: '',
    addEventListener(type, listener) { listeners.set(type, listener); },
    async dispatch(type) { return listeners.get(type)?.({preventDefault() {}}); },
    focus() {},
  };
}

async function startAuth({session = null, role = 'user', roleError = null} = {}) {
  const ids = [
    'authRoot', 'authLoading', 'authLoginHeading', 'loginForm', 'loginEmail',
    'loginPassword', 'loginSubmitBtn', 'loginStatus', 'accountSetupForm',
    'accountSetupEmail', 'newPassword', 'confirmPassword', 'setPasswordBtn',
    'accountSetupStatus', 'appShell', 'authenticatedUserEmail', 'logoutBtn',
  ];
  const elements = Object.fromEntries(ids.map(id => [id, createElement()]));
  elements.loginForm.hidden = true;
  elements.accountSetupForm.hidden = true;
  elements.appShell.hidden = true;

  let onAuthStateChange = null;
  let roleReads = 0;
  const appCalls = {init: 0, refreshAuthorization: 0};
  const client = {
    auth: {
      onAuthStateChange(callback) { onAuthStateChange = callback; },
      async getSession() { return {data: {session}, error: null}; },
      async signOut() { return {error: null}; },
    },
    from(table) {
      assert.equal(table, 'profiles');
      return {
        select(columns) { assert.equal(columns, 'role'); return this; },
        eq(column, value) {
          assert.equal(column, 'id');
          assert.equal(value, session.user.id);
          return this;
        },
        async single() {
          roleReads += 1;
          return roleError ? {data: null, error: roleError} : {data: {role}, error: null};
        },
      };
    },
  };
  const storage = new Map();
  let domReady;
  const document = {
    body: {dataset: {}},
    title: 'LUMA BOM Manager',
    getElementById(id) { return elements[id]; },
    addEventListener(type, listener) { if (type === 'DOMContentLoaded') domReady = listener; },
  };
  const window = {
    document,
    location: {
      search: '',
      hash: '',
      href: 'http://127.0.0.1:5500/',
    },
    history: {replaceState() {}},
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
      removeItem(key) { storage.delete(key); },
    },
    LumaSupabase: {
      isConfigured: () => true,
      getClient: () => client,
    },
    LumaApp: {
      init() { appCalls.init += 1; },
      refreshAuthorization() { appCalls.refreshAuthorization += 1; },
    },
  };
  const context = vm.createContext({
    window,
    document,
    URL,
    URLSearchParams,
    requestAnimationFrame: callback => callback(),
    setTimeout,
    console: {error() {}},
  });

  vm.runInContext(AUTH_SOURCE, context, {filename: 'auth.js'});
  await domReady();

  return {window, elements, appCalls, getRoleReads: () => roleReads, getAuthCallback: () => onAuthStateChange};
}

function authenticatedSession(id = 'user-id') {
  return {user: {id, email: `${id}@example.com`}};
}

test('unauthenticated visitors see only the login screen', async () => {
  const result = await startAuth();
  assert.equal(result.elements.authRoot.hidden, false);
  assert.equal(result.elements.loginForm.hidden, false);
  assert.equal(result.elements.appShell.hidden, true);
  assert.equal(result.window.LumaAuth.getRole(), null);
  assert.equal(result.appCalls.init, 0);
});

test('a restored user session loads least-privileged application access', async () => {
  const result = await startAuth({session: authenticatedSession(), role: 'user'});
  assert.equal(result.elements.appShell.hidden, false);
  assert.equal(result.window.LumaAuth.getRole(), 'user');
  assert.equal(result.window.LumaAuth.isAdmin(), false);
  assert.equal(result.appCalls.init, 1);
});

test('a restored admin session is recognized from the profiles result', async () => {
  const result = await startAuth({session: authenticatedSession('admin-id'), role: 'admin'});
  assert.equal(result.elements.appShell.hidden, false);
  assert.equal(result.window.LumaAuth.getRole(), 'admin');
  assert.equal(result.window.LumaAuth.isAdmin(), true);
});

test('invalid or failed role results never grant admin access', async () => {
  const invalid = await startAuth({session: authenticatedSession(), role: 'owner'});
  assert.equal(invalid.window.LumaAuth.getRole(), 'user');
  assert.equal(invalid.window.LumaAuth.isAdmin(), false);

  const failed = await startAuth({session: authenticatedSession(), roleError: new Error('lookup failed')});
  assert.equal(failed.window.LumaAuth.getRole(), 'user');
  assert.equal(failed.window.LumaAuth.isAdmin(), false);
  assert.equal(failed.elements.appShell.hidden, false);
});

test('logout clears runtime role and returns to login', async () => {
  const result = await startAuth({session: authenticatedSession('admin-id'), role: 'admin'});
  await result.elements.logoutBtn.dispatch('click');
  assert.equal(result.window.LumaAuth.getRole(), null);
  assert.equal(result.window.LumaAuth.isAdmin(), false);
  assert.equal(result.elements.appShell.hidden, true);
  assert.equal(result.elements.loginForm.hidden, false);
  assert.equal(result.appCalls.refreshAuthorization > 0, true);
});

test('token refresh for the current user does not hide or reauthorize the application', async () => {
  const session = authenticatedSession('stable-user');
  const result = await startAuth({session, role: 'admin'});
  const callback = result.getAuthCallback();
  callback('TOKEN_REFRESHED', {...session, access_token: 'refreshed-token'});
  await Promise.resolve();
  assert.equal(result.elements.appShell.hidden, false);
  assert.equal(result.elements.authRoot.hidden, true);
  assert.equal(result.appCalls.init, 1);
  assert.equal(result.appCalls.refreshAuthorization, 0);
  assert.equal(result.getRoleReads(), 1);
  assert.equal(result.window.LumaAuth.getSession().access_token, 'refreshed-token');
});
