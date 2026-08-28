'use strict';

(function initializeAuthentication(global) {
  const USER_ROLES = Object.freeze({
    USER: 'user',
    ADMIN: 'admin',
  });
  const VALID_ROLES = new Set(Object.values(USER_ROLES));
  const MIN_PASSWORD_LENGTH = 8;
  const ACCOUNT_SETUP_STORAGE_KEY = 'luma_auth_account_setup_user_id';
  const state = {
    session: null,
    role: null,
    appInitialized: false,
    invitationLinkDetected: false,
    authorizationRequestId: 0,
    authorizingUserId: null,
  };

  function getElements() {
    return {
      authRoot: document.getElementById('authRoot'),
      authLoading: document.getElementById('authLoading'),
      authLoginHeading: document.getElementById('authLoginHeading'),
      loginForm: document.getElementById('loginForm'),
      loginEmail: document.getElementById('loginEmail'),
      loginPassword: document.getElementById('loginPassword'),
      loginSubmitBtn: document.getElementById('loginSubmitBtn'),
      loginStatus: document.getElementById('loginStatus'),
      accountSetupForm: document.getElementById('accountSetupForm'),
      accountSetupEmail: document.getElementById('accountSetupEmail'),
      newPassword: document.getElementById('newPassword'),
      confirmPassword: document.getElementById('confirmPassword'),
      setPasswordBtn: document.getElementById('setPasswordBtn'),
      accountSetupStatus: document.getElementById('accountSetupStatus'),
      appShell: document.getElementById('appShell'),
      authenticatedUserEmail: document.getElementById('authenticatedUserEmail'),
      logoutBtn: document.getElementById('logoutBtn'),
    };
  }

  function storageGet(key) {
    try { return global.localStorage.getItem(key); } catch { return null; }
  }

  function storageSet(key, value) {
    try { global.localStorage.setItem(key, value); } catch {}
  }

  function storageRemove(key) {
    try { global.localStorage.removeItem(key); } catch {}
  }

  function getAuthLinkParameters() {
    const search = new URLSearchParams(global.location.search);
    const hash = new URLSearchParams(global.location.hash.replace(/^#/, ''));
    return {
      type: search.get('type') || hash.get('type') || '',
      error: search.get('error_description') || hash.get('error_description') || '',
    };
  }

  function detectInvitationLink() {
    const parameters = getAuthLinkParameters();
    state.invitationLinkDetected = parameters.type === 'invite';
    if (state.invitationLinkDetected) storageSet(ACCOUNT_SETUP_STORAGE_KEY, 'pending');
    return parameters;
  }

  function requiresAccountSetup(session) {
    if (!session?.user) return false;
    const marker = storageGet(ACCOUNT_SETUP_STORAGE_KEY);
    return state.invitationLinkDetected || marker === 'pending' || marker === session.user.id;
  }

  function markAccountSetupRequired(session) {
    if (session?.user?.id) storageSet(ACCOUNT_SETUP_STORAGE_KEY, session.user.id);
  }

  function clearAccountSetupRequirement() {
    state.invitationLinkDetected = false;
    storageRemove(ACCOUNT_SETUP_STORAGE_KEY);
  }

  function clearInvitationParametersFromUrl() {
    const url = new URL(global.location.href);
    ['type', 'code', 'token_hash', 'access_token', 'refresh_token', 'expires_at', 'expires_in', 'token_type'].forEach(key => url.searchParams.delete(key));
    url.hash = '';
    global.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
  }

  function normalizeDatabaseRole(role) {
    const databaseRole = String(role || '').toLowerCase();
    return VALID_ROLES.has(databaseRole) ? databaseRole : USER_ROLES.USER;
  }

  function setRuntimeRole(role) {
    state.role = role === null ? null : normalizeDatabaseRole(role);
    document.body.dataset.authRole = state.role || '';
  }

  async function loadCurrentUserRole(session) {
    const client = global.LumaSupabase.getClient();
    const { data, error } = await client
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;
    return normalizeDatabaseRole(data?.role);
  }

  function setLoginStatus(message = '', kind = 'error') {
    const { loginStatus } = getElements();
    loginStatus.textContent = message;
    loginStatus.className = `login-status ${kind}`;
    loginStatus.hidden = !message;
  }

  function setLoginBusy(isBusy) {
    const { loginEmail, loginPassword, loginSubmitBtn } = getElements();
    loginEmail.disabled = isBusy;
    loginPassword.disabled = isBusy;
    loginSubmitBtn.disabled = isBusy;
    loginSubmitBtn.textContent = isBusy ? 'Signing In...' : 'Sign In';
  }

  function setAccountSetupStatus(message = '', kind = 'error') {
    const { accountSetupStatus } = getElements();
    accountSetupStatus.textContent = message;
    accountSetupStatus.className = `login-status ${kind}`;
    accountSetupStatus.hidden = !message;
  }

  function setAccountSetupBusy(isBusy) {
    const { newPassword, confirmPassword, setPasswordBtn } = getElements();
    newPassword.disabled = isBusy;
    confirmPassword.disabled = isBusy;
    setPasswordBtn.disabled = isBusy;
    setPasswordBtn.textContent = isBusy ? 'Setting Password...' : 'Set Password';
  }

  function showLogin(message = '') {
    const { authRoot, authLoading, authLoginHeading, loginForm, loginEmail, accountSetupForm, appShell, authenticatedUserEmail } = getElements();
    state.authorizationRequestId += 1;
    state.authorizingUserId = null;
    state.session = null;
    global.LumaCommercialAnalysis?.reset?.();
    setRuntimeRole(null);
    authenticatedUserEmail.textContent = '';
    appShell.hidden = true;
    if (state.appInitialized) global.LumaApp.refreshAuthorization();
    authRoot.hidden = false;
    authLoading.hidden = true;
    authLoginHeading.hidden = false;
    loginForm.hidden = false;
    accountSetupForm.hidden = true;
    setLoginBusy(false);
    setLoginStatus(message);
    setAccountSetupStatus('');
    requestAnimationFrame(() => loginEmail.focus());
  }

  function showAccountSetup(session) {
    const { authRoot, authLoading, authLoginHeading, loginForm, accountSetupForm, accountSetupEmail, newPassword, appShell } = getElements();
    state.session = session;
    state.authorizingUserId = null;
    setRuntimeRole(null);
    if (state.appInitialized) global.LumaApp.refreshAuthorization();
    markAccountSetupRequired(session);
    if (state.invitationLinkDetected) clearInvitationParametersFromUrl();
    appShell.hidden = true;
    authRoot.hidden = false;
    authLoading.hidden = true;
    authLoginHeading.hidden = true;
    loginForm.hidden = true;
    accountSetupForm.hidden = false;
    accountSetupEmail.textContent = session.user.email || 'your invited account';
    setLoginStatus('');
    setAccountSetupBusy(false);
    setAccountSetupStatus('');
    requestAnimationFrame(() => newPassword.focus());
  }

  function showAuthorizationLoading(session) {
    const { authRoot, authLoading, authLoginHeading, loginForm, accountSetupForm, appShell } = getElements();
    state.session = session;
    setRuntimeRole(null);
    appShell.hidden = true;
    if (state.appInitialized) global.LumaApp.refreshAuthorization();
    authRoot.hidden = false;
    authLoading.textContent = 'Loading your access...';
    authLoading.hidden = false;
    authLoginHeading.hidden = true;
    loginForm.hidden = true;
    accountSetupForm.hidden = true;
  }

  function showAuthenticatedApp(session, role) {
    const { authRoot, authLoading, accountSetupForm, appShell, authenticatedUserEmail } = getElements();
    state.session = session;
    setRuntimeRole(role);
    authenticatedUserEmail.textContent = session.user.email || 'Authenticated user';
    authenticatedUserEmail.title = session.user.email || '';
    authLoading.hidden = true;
    authRoot.hidden = true;
    accountSetupForm.hidden = true;
    setLoginStatus('');
    setAccountSetupStatus('');
    if (!state.appInitialized) {
      global.LumaApp.init();
      state.appInitialized = true;
    } else {
      global.LumaApp.refreshAuthorization();
    }
    appShell.hidden = false;
  }

  async function routeAuthenticatedSession(session) {
    if (requiresAccountSetup(session)) {
      state.authorizationRequestId += 1;
      showAccountSetup(session);
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      showLogin();
      return;
    }

    if (state.session?.user?.id === userId && state.role !== null && state.appInitialized) {
      state.session = session;
      return;
    }

    if (state.authorizingUserId === userId) {
      state.session = session;
      return;
    }

    const requestId = state.authorizationRequestId + 1;
    state.authorizationRequestId = requestId;
    state.authorizingUserId = userId;
    showAuthorizationLoading(session);

    let role = USER_ROLES.USER;
    try {
      role = await loadCurrentUserRole(session);
    } catch {
      console.error('Unable to load the authorization role. Standard user access will be used.');
    }

    try {
      if (requestId !== state.authorizationRequestId || state.session?.user?.id !== userId) return;
      showAuthenticatedApp(session, role);
    } finally {
      if (requestId === state.authorizationRequestId && state.authorizingUserId === userId) state.authorizingUserId = null;
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const { loginEmail, loginPassword } = getElements();
    setLoginStatus('');
    setLoginBusy(true);
    try {
      const client = global.LumaSupabase.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: loginEmail.value.trim(),
        password: loginPassword.value,
      });
      loginPassword.value = '';
      if (error || !data.session) {
        setLoginStatus('Unable to sign in. Check your email and password.');
        return;
      }
      await routeAuthenticatedSession(data.session);
    } catch (error) {
      console.error('Authentication sign-in failed.', error);
      setLoginStatus('Unable to reach the authentication service. Please try again.');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleAccountSetup(event) {
    event.preventDefault();
    const { newPassword, confirmPassword } = getElements();
    const password = newPassword.value;
    const confirmation = confirmPassword.value;
    setAccountSetupStatus('');

    if (!password.trim()) {
      setAccountSetupStatus('Enter a new password.');
      newPassword.focus();
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setAccountSetupStatus(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      newPassword.focus();
      return;
    }
    if (password !== confirmation) {
      setAccountSetupStatus('The passwords do not match.');
      confirmPassword.focus();
      return;
    }

    setAccountSetupBusy(true);
    try {
      const client = global.LumaSupabase.getClient();
      const { data, error } = await client.auth.updateUser({ password });
      if (error) throw error;
      if (data.user && state.session) state.session = {...state.session, user:data.user};
      newPassword.value = '';
      confirmPassword.value = '';
      clearAccountSetupRequirement();
      clearInvitationParametersFromUrl();
      setAccountSetupStatus('Password created successfully. Opening LUMA BOM Manager...', 'success');
      await new Promise(resolve => setTimeout(resolve, 900));
      await routeAuthenticatedSession(state.session);
    } catch (error) {
      console.error('Invited-user password setup failed.', error);
      setAccountSetupStatus(error?.message || 'Could not set the password. Request a new invitation and try again.');
    } finally {
      setAccountSetupBusy(false);
    }
  }

  async function handleLogout() {
    const { logoutBtn } = getElements();
    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Signing Out...';
    try {
      const client = global.LumaSupabase.getClient();
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
      showLogin();
    } catch (error) {
      console.error('Authentication sign-out failed.', error);
      alert('Could not sign out. Please try again.');
    } finally {
      logoutBtn.disabled = false;
      logoutBtn.textContent = 'Sign Out';
    }
  }

  async function startAuthentication() {
    const { loginForm, accountSetupForm, logoutBtn } = getElements();
    const authLinkParameters = detectInvitationLink();
    loginForm.addEventListener('submit', handleLogin);
    accountSetupForm.addEventListener('submit', handleAccountSetup);
    logoutBtn.addEventListener('click', handleLogout);

    if (!global.LumaSupabase?.isConfigured()) {
      showLogin('Authentication setup is incomplete. Add the Supabase publishable key in supabase-client.js.');
      const { loginEmail, loginPassword, loginSubmitBtn } = getElements();
      loginEmail.disabled = true;
      loginPassword.disabled = true;
      loginSubmitBtn.disabled = true;
      return;
    }

    try {
      const client = global.LumaSupabase.getClient();
      client.auth.onAuthStateChange((event, session) => {
        if (session) {
          void routeAuthenticatedSession(session);
        } else if (event === 'SIGNED_OUT') {
          clearAccountSetupRequirement();
          showLogin();
        }
      });
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) {
        await routeAuthenticatedSession(data.session);
      } else {
        clearAccountSetupRequirement();
        showLogin(authLinkParameters.error ? 'This invitation link is invalid or has expired. Request a new invitation.' : '');
      }
    } catch (error) {
      console.error('Authentication initialization failed.', error);
      showLogin('Unable to initialize authentication. Please refresh and try again.');
    }
  }

  global.LumaAuth = Object.freeze({
    roles: USER_ROLES,
    getSession: () => state.session,
    getRole: () => state.role,
    isAdmin: () => state.role === USER_ROLES.ADMIN,
  });

  document.addEventListener('DOMContentLoaded', startAuthentication);
})(window);
