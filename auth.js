'use strict';

(function initializeAuthentication(global) {
  const USER_ROLES = Object.freeze({USER: 'user', ADMIN: 'admin'});
  const VALID_ROLES = new Set(Object.values(USER_ROLES));
  const config = global.LumaAuthConfig || Object.freeze({
    PASSWORD_MIN_LENGTH: 8,
    TURNSTILE_SITE_KEY: '',
    isCaptchaConfigured: () => false,
    getPasswordResetRedirectUrl: () => `${global.location.origin}${global.location.pathname}`,
  });
  const MIN_PASSWORD_LENGTH = config.PASSWORD_MIN_LENGTH || 8;
  const ACCOUNT_SETUP_STORAGE_KEY = 'luma_auth_account_setup_user_id';
  const RECOVERY_STORAGE_KEY = 'luma_auth_password_recovery_user_id';
  const GENERIC_RESET_CONFIRMATION = 'If an eligible account exists for that email, password-reset instructions have been sent.';
  const state = {
    session: null,
    role: null,
    profile: null,
    appInitialized: false,
    invitationLinkDetected: false,
    recoveryLinkDetected: false,
    authorizationRequestId: 0,
    authorizingUserId: null,
    loginBusy: false,
    forgotBusy: false,
    captcha: {
      login: {widgetId: null, token: '', renderAttempts: 0},
      forgot: {widgetId: null, token: '', renderAttempts: 0},
    },
  };

  function getElements() {
    const ids = [
      'authRoot', 'authLoading', 'authLoginHeading', 'loginForm', 'loginEmail', 'loginPassword',
      'loginTurnstile', 'loginSubmitBtn', 'forgotPasswordBtn', 'loginStatus', 'accountSetupForm',
      'accountSetupEmail', 'newPassword', 'confirmPassword', 'setPasswordBtn', 'accountSetupStatus',
      'forgotPasswordForm', 'forgotPasswordEmail', 'forgotTurnstile', 'forgotPasswordSubmitBtn',
      'forgotPasswordBackBtn', 'forgotPasswordStatus', 'recoveryPasswordForm', 'recoveryPasswordEmail',
      'recoveryNewPassword', 'recoveryConfirmPassword', 'recoveryPasswordSubmitBtn',
      'recoveryPasswordStatus', 'invalidRecoveryPanel', 'invalidRecoveryMessage',
      'invalidRecoveryRequestBtn', 'invalidRecoveryBackBtn', 'appShell', 'authenticatedUserName',
      'authenticatedUserEmail', 'accountMenuBtn', 'accountMenu', 'myProfileBtn', 'changePasswordBtn',
      'logoutBtn', 'accountModalBackdrop', 'accountModalTitle', 'accountModalCloseBtn', 'profileForm',
      'profileFullName', 'profileJobTitle', 'profileCompany', 'profilePhone', 'profileEmail',
      'profileRole', 'profileStatus', 'profileSaveBtn', 'profileChangePasswordBtn', 'changePasswordForm',
      'currentPassword', 'changeNewPassword', 'changeConfirmPassword', 'changePasswordStatus',
      'changePasswordCancelBtn', 'changePasswordSubmitBtn',
    ];
    return Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  }

  function storageGet(key) { try { return global.localStorage.getItem(key); } catch { return null; } }
  function storageSet(key, value) { try { global.localStorage.setItem(key, value); } catch {} }
  function storageRemove(key) { try { global.localStorage.removeItem(key); } catch {} }

  function getAuthLinkParameters() {
    const search = new URLSearchParams(global.location.search);
    const hash = new URLSearchParams(global.location.hash.replace(/^#/, ''));
    return {
      type: search.get('type') || hash.get('type') || '',
      hasError: Boolean(search.get('error') || hash.get('error') || search.get('error_description') || hash.get('error_description')),
    };
  }

  function detectAuthLink() {
    const parameters = getAuthLinkParameters();
    state.invitationLinkDetected = parameters.type === 'invite';
    state.recoveryLinkDetected = parameters.type === 'recovery';
    if (state.invitationLinkDetected) storageSet(ACCOUNT_SETUP_STORAGE_KEY, 'pending');
    if (state.recoveryLinkDetected) storageSet(RECOVERY_STORAGE_KEY, 'pending');
    return parameters;
  }

  function requiresAccountSetup(session) {
    if (!session?.user || state.recoveryLinkDetected) return false;
    const marker = storageGet(ACCOUNT_SETUP_STORAGE_KEY);
    return state.invitationLinkDetected || marker === 'pending' || marker === session.user.id;
  }

  function requiresPasswordRecovery(session) {
    if (!session?.user) return false;
    const marker = storageGet(RECOVERY_STORAGE_KEY);
    return state.recoveryLinkDetected || marker === 'pending' || marker === session.user.id;
  }

  function markAccountSetupRequired(session) { if (session?.user?.id) storageSet(ACCOUNT_SETUP_STORAGE_KEY, session.user.id); }
  function markRecoveryRequired(session) { if (session?.user?.id) storageSet(RECOVERY_STORAGE_KEY, session.user.id); }
  function clearAccountSetupRequirement() { state.invitationLinkDetected = false; storageRemove(ACCOUNT_SETUP_STORAGE_KEY); }
  function clearRecoveryRequirement() { state.recoveryLinkDetected = false; storageRemove(RECOVERY_STORAGE_KEY); }

  function clearAuthParametersFromUrl() {
    const url = new URL(global.location.href);
    ['type', 'code', 'token_hash', 'access_token', 'refresh_token', 'expires_at', 'expires_in', 'token_type', 'error', 'error_code', 'error_description'].forEach(key => url.searchParams.delete(key));
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

  function logSafeError(context, error) {
    console.error(context, {name: String(error?.name || 'Error'), code: String(error?.code || ''), status: Number(error?.status || 0) || undefined});
  }

  async function loadCurrentUserRole(session) {
    const {data, error} = await global.LumaSupabase.getClient().from('profiles').select('role').eq('id', session.user.id).single();
    if (error) throw error;
    return normalizeDatabaseRole(data?.role);
  }

  function setStatus(element, message = '', kind = 'error') {
    element.textContent = message;
    element.className = `login-status ${kind}`;
    element.hidden = !message;
  }

  function hideAuthPanels() {
    const elements = getElements();
    ['loginForm', 'accountSetupForm', 'forgotPasswordForm', 'recoveryPasswordForm', 'invalidRecoveryPanel'].forEach(id => { elements[id].hidden = true; });
  }

  function updateLoginSubmitAvailability() {
    getElements().loginSubmitBtn.disabled = state.loginBusy || (config.isCaptchaConfigured() && !state.captcha.login.token);
  }

  function updateForgotSubmitAvailability() {
    getElements().forgotPasswordSubmitBtn.disabled = state.forgotBusy || !config.isCaptchaConfigured() || !state.captcha.forgot.token;
  }

  function setLoginBusy(isBusy) {
    const {loginEmail, loginPassword, loginSubmitBtn} = getElements();
    state.loginBusy = isBusy;
    loginEmail.disabled = isBusy;
    loginPassword.disabled = isBusy;
    loginSubmitBtn.textContent = isBusy ? 'Signing In...' : 'Sign In';
    updateLoginSubmitAvailability();
  }

  function setForgotBusy(isBusy) {
    const {forgotPasswordEmail, forgotPasswordSubmitBtn} = getElements();
    state.forgotBusy = isBusy;
    forgotPasswordEmail.disabled = isBusy;
    forgotPasswordSubmitBtn.textContent = isBusy ? 'Sending...' : 'Send Reset Link';
    updateForgotSubmitAvailability();
  }

  function setPasswordFormBusy(prefix, isBusy) {
    const elements = getElements();
    const map = prefix === 'recovery'
      ? ['recoveryNewPassword', 'recoveryConfirmPassword', 'recoveryPasswordSubmitBtn', 'Updating...', 'Update Password']
      : ['newPassword', 'confirmPassword', 'setPasswordBtn', 'Setting Password...', 'Set Password'];
    elements[map[0]].disabled = isBusy;
    elements[map[1]].disabled = isBusy;
    elements[map[2]].disabled = isBusy;
    elements[map[2]].textContent = isBusy ? map[3] : map[4];
  }

  function resetCaptcha(kind) {
    const captcha = state.captcha[kind];
    captcha.token = '';
    if (captcha.widgetId !== null && global.turnstile?.reset) {
      try { global.turnstile.reset(captcha.widgetId); } catch {}
    }
    if (kind === 'login') updateLoginSubmitAvailability(); else updateForgotSubmitAvailability();
  }

  function renderCaptcha(kind) {
    if (!config.isCaptchaConfigured()) {
      if (kind === 'login') {
        getElements().loginTurnstile.hidden = true;
        updateLoginSubmitAvailability();
      } else {
        setStatus(getElements().forgotPasswordStatus, 'Password reset verification is not configured. Contact the application administrator.');
        updateForgotSubmitAvailability();
      }
      return;
    }
    const captcha = state.captcha[kind];
    const container = kind === 'login' ? getElements().loginTurnstile : getElements().forgotTurnstile;
    container.hidden = false;
    if (captcha.widgetId !== null) return;
    if (!global.turnstile?.render) {
      captcha.renderAttempts += 1;
      if (captcha.renderAttempts <= 50) global.setTimeout(() => renderCaptcha(kind), 100);
      else setStatus(kind === 'login' ? getElements().loginStatus : getElements().forgotPasswordStatus, 'Security verification could not load. Refresh the page and try again.');
      return;
    }
    captcha.widgetId = global.turnstile.render(container, {
      sitekey: config.TURNSTILE_SITE_KEY,
      callback(token) {
        captcha.token = token;
        if (kind === 'login') updateLoginSubmitAvailability(); else updateForgotSubmitAvailability();
      },
      'expired-callback'() { resetCaptcha(kind); },
      'error-callback'() {
        captcha.token = '';
        setStatus(kind === 'login' ? getElements().loginStatus : getElements().forgotPasswordStatus, 'Security verification failed. Please try again.');
        if (kind === 'login') updateLoginSubmitAvailability(); else updateForgotSubmitAvailability();
      },
      theme: 'light',
    });
  }

  function closeAccountMenu() {
    const {accountMenu, accountMenuBtn} = getElements();
    accountMenu.hidden = true;
    accountMenuBtn.setAttribute('aria-expanded', 'false');
  }

  function closeAccountModal() {
    const {accountModalBackdrop, currentPassword, changeNewPassword, changeConfirmPassword} = getElements();
    accountModalBackdrop.hidden = true;
    currentPassword.value = '';
    changeNewPassword.value = '';
    changeConfirmPassword.value = '';
  }

  function resetAuthenticatedUi() {
    const {authenticatedUserEmail, authenticatedUserName} = getElements();
    state.profile = null;
    authenticatedUserEmail.textContent = '';
    authenticatedUserName.textContent = '';
    closeAccountMenu();
    closeAccountModal();
  }

  function showLogin(message = '') {
    const {authRoot, authLoading, authLoginHeading, loginForm, loginEmail, appShell, loginStatus} = getElements();
    state.authorizationRequestId += 1;
    state.authorizingUserId = null;
    state.session = null;
    global.LumaCommercialAnalysis?.reset?.();
    setRuntimeRole(null);
    resetAuthenticatedUi();
    appShell.hidden = true;
    if (state.appInitialized) global.LumaApp.refreshAuthorization();
    authRoot.hidden = false;
    authLoading.hidden = true;
    authLoginHeading.hidden = false;
    hideAuthPanels();
    loginForm.hidden = false;
    setLoginBusy(false);
    setStatus(loginStatus, message);
    renderCaptcha('login');
    requestAnimationFrame(() => loginEmail.focus());
  }

  function showForgotPassword() {
    const {authRoot, authLoading, authLoginHeading, forgotPasswordForm, forgotPasswordEmail, forgotPasswordStatus, loginEmail, appShell} = getElements();
    state.session = null;
    setRuntimeRole(null);
    appShell.hidden = true;
    authRoot.hidden = false;
    authLoading.hidden = true;
    authLoginHeading.hidden = true;
    hideAuthPanels();
    forgotPasswordForm.hidden = false;
    forgotPasswordEmail.value = loginEmail.value.trim();
    setStatus(forgotPasswordStatus, '');
    setForgotBusy(false);
    renderCaptcha('forgot');
    requestAnimationFrame(() => forgotPasswordEmail.focus());
  }

  function showAccountSetup(session) {
    const {authRoot, authLoading, authLoginHeading, accountSetupForm, accountSetupEmail, newPassword, appShell, accountSetupStatus} = getElements();
    state.session = session;
    state.authorizingUserId = null;
    setRuntimeRole(null);
    if (state.appInitialized) global.LumaApp.refreshAuthorization();
    markAccountSetupRequired(session);
    appShell.hidden = true;
    authRoot.hidden = false;
    authLoading.hidden = true;
    authLoginHeading.hidden = true;
    hideAuthPanels();
    accountSetupForm.hidden = false;
    accountSetupEmail.textContent = session.user.email || 'your invited account';
    setPasswordFormBusy('invite', false);
    setStatus(accountSetupStatus, '');
    requestAnimationFrame(() => newPassword.focus());
  }

  function showRecoveryPassword(session) {
    const {authRoot, authLoading, authLoginHeading, recoveryPasswordForm, recoveryPasswordEmail, recoveryNewPassword, recoveryPasswordStatus, appShell} = getElements();
    state.session = session;
    state.authorizingUserId = null;
    setRuntimeRole(null);
    if (state.appInitialized) global.LumaApp.refreshAuthorization();
    markRecoveryRequired(session);
    appShell.hidden = true;
    authRoot.hidden = false;
    authLoading.hidden = true;
    authLoginHeading.hidden = true;
    hideAuthPanels();
    recoveryPasswordForm.hidden = false;
    recoveryPasswordEmail.textContent = session.user.email || 'your account';
    setPasswordFormBusy('recovery', false);
    setStatus(recoveryPasswordStatus, '');
    requestAnimationFrame(() => recoveryNewPassword.focus());
  }

  function showInvalidRecovery() {
    const {authRoot, authLoading, authLoginHeading, invalidRecoveryPanel, appShell} = getElements();
    state.session = null;
    setRuntimeRole(null);
    appShell.hidden = true;
    authRoot.hidden = false;
    authLoading.hidden = true;
    authLoginHeading.hidden = true;
    hideAuthPanels();
    invalidRecoveryPanel.hidden = false;
  }

  function showAuthorizationLoading(session) {
    const {authRoot, authLoading, authLoginHeading, appShell} = getElements();
    state.session = session;
    setRuntimeRole(null);
    appShell.hidden = true;
    if (state.appInitialized) global.LumaApp.refreshAuthorization();
    authRoot.hidden = false;
    authLoading.textContent = 'Loading your access...';
    authLoading.hidden = false;
    authLoginHeading.hidden = true;
    hideAuthPanels();
  }

  function updateAccountIdentity(profile = state.profile) {
    const {authenticatedUserEmail, authenticatedUserName} = getElements();
    const email = state.session?.user?.email || 'Authenticated user';
    const displayName = String(profile?.full_name || '').trim() || email;
    authenticatedUserName.textContent = displayName;
    authenticatedUserName.title = displayName;
    authenticatedUserEmail.textContent = email;
    authenticatedUserEmail.title = email;
  }

  function showAuthenticatedApp(session, role) {
    const {authRoot, authLoading, appShell} = getElements();
    state.session = session;
    setRuntimeRole(role);
    updateAccountIdentity();
    authLoading.hidden = true;
    authRoot.hidden = true;
    hideAuthPanels();
    if (!state.appInitialized) {
      global.LumaApp.init();
      state.appInitialized = true;
    } else {
      global.LumaApp.refreshAuthorization();
    }
    appShell.hidden = false;
  }

  async function routeAuthenticatedSession(session) {
    if (requiresPasswordRecovery(session)) {
      state.authorizationRequestId += 1;
      showRecoveryPassword(session);
      return;
    }
    if (requiresAccountSetup(session)) {
      state.authorizationRequestId += 1;
      showAccountSetup(session);
      return;
    }
    const userId = session?.user?.id;
    if (!userId) { showLogin(); return; }
    if (state.session?.user?.id === userId && state.role !== null && state.appInitialized) {
      state.session = session;
      updateAccountIdentity();
      return;
    }
    if (state.authorizingUserId === userId) { state.session = session; return; }
    const requestId = state.authorizationRequestId + 1;
    state.authorizationRequestId = requestId;
    state.authorizingUserId = userId;
    showAuthorizationLoading(session);
    let role = USER_ROLES.USER;
    try { role = await loadCurrentUserRole(session); }
    catch (error) { logSafeError('Unable to load the authorization role. Standard user access will be used.', error); }
    try {
      if (requestId !== state.authorizationRequestId || state.session?.user?.id !== userId) return;
      showAuthenticatedApp(session, role);
    } finally {
      if (requestId === state.authorizationRequestId && state.authorizingUserId === userId) state.authorizingUserId = null;
    }
  }

  function validateNewPassword(password, confirmation) {
    if (!password.trim()) return 'Enter a new password.';
    if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (password !== confirmation) return 'The passwords do not match.';
    return '';
  }

  function passwordUpdateMessage(error, context) {
    const code = String(error?.code || '').toLowerCase();
    if (code.includes('weak_password')) return `The new password does not meet the password policy. Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (code.includes('same_password')) return 'Choose a password different from your current password.';
    if (code.includes('invalid_credentials') || code.includes('reauthentication_not_valid') || code.includes('current_password_mismatch')) return 'The current password is incorrect.';
    if (code.includes('current_password_required')) return 'Enter your current password.';
    if (code.includes('session_not_found') || code.includes('reauthentication_needed')) return context === 'recovery'
      ? 'This password-reset link is invalid or has expired. Request a new reset link.'
      : 'Your session is no longer valid. Sign in again and retry.';
    return context === 'change' ? 'Could not change the password. Verify the current password and try again.' : 'Could not update the password. Request a new link and try again.';
  }

  function isCaptchaError(error) {
    return `${error?.code || ''} ${error?.message || ''}`.toLowerCase().includes('captcha');
  }

  async function handleLogin(event) {
    event.preventDefault();
    const {loginEmail, loginPassword, loginStatus} = getElements();
    setStatus(loginStatus, '');
    if (config.isCaptchaConfigured() && !state.captcha.login.token) {
      setStatus(loginStatus, 'Complete the security verification before signing in.');
      return;
    }
    setLoginBusy(true);
    try {
      const credentials = {email: loginEmail.value.trim(), password: loginPassword.value};
      if (config.isCaptchaConfigured()) credentials.options = {captchaToken: state.captcha.login.token};
      const {data, error} = await global.LumaSupabase.getClient().auth.signInWithPassword(credentials);
      loginPassword.value = '';
      if (error || !data.session) {
        setStatus(loginStatus, isCaptchaError(error) ? 'Security verification failed. Please try again.' : 'Unable to sign in. Check your email and password.');
        return;
      }
      await routeAuthenticatedSession(data.session);
    } catch (error) {
      logSafeError('Authentication sign-in failed.', error);
      setStatus(loginStatus, 'Unable to reach the authentication service. Please try again.');
    } finally {
      if (config.isCaptchaConfigured()) resetCaptcha('login');
      setLoginBusy(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    const {forgotPasswordEmail, forgotPasswordStatus} = getElements();
    setStatus(forgotPasswordStatus, '');
    if (!config.isCaptchaConfigured()) {
      setStatus(forgotPasswordStatus, 'Password reset verification is not configured. Contact the application administrator.');
      return;
    }
    if (!state.captcha.forgot.token) {
      setStatus(forgotPasswordStatus, 'Complete the security verification before requesting a reset link.');
      return;
    }
    setForgotBusy(true);
    try {
      const {error} = await global.LumaSupabase.getClient().auth.resetPasswordForEmail(forgotPasswordEmail.value.trim(), {
        redirectTo: config.getPasswordResetRedirectUrl(),
        captchaToken: state.captcha.forgot.token,
      });
      if (error && isCaptchaError(error)) setStatus(forgotPasswordStatus, 'Security verification failed. Please try again.');
      else {
        if (error) logSafeError('Password reset request was not accepted.', error);
        setStatus(forgotPasswordStatus, GENERIC_RESET_CONFIRMATION, 'success');
      }
    } catch (error) {
      logSafeError('Password reset request failed.', error);
      setStatus(forgotPasswordStatus, GENERIC_RESET_CONFIRMATION, 'success');
    } finally {
      resetCaptcha('forgot');
      setForgotBusy(false);
    }
  }

  async function handleAccountSetup(event) {
    event.preventDefault();
    const {newPassword, confirmPassword, accountSetupStatus} = getElements();
    const validation = validateNewPassword(newPassword.value, confirmPassword.value);
    setStatus(accountSetupStatus, validation);
    if (validation) return;
    setPasswordFormBusy('invite', true);
    try {
      const {data, error} = await global.LumaSupabase.getClient().auth.updateUser({password: newPassword.value});
      if (error) throw error;
      if (data.user && state.session) state.session = {...state.session, user: data.user};
      newPassword.value = '';
      confirmPassword.value = '';
      clearAccountSetupRequirement();
      clearAuthParametersFromUrl();
      setStatus(accountSetupStatus, 'Password created successfully. Opening LUMA BOM Manager...', 'success');
      await new Promise(resolve => global.setTimeout(resolve, 700));
      await routeAuthenticatedSession(state.session);
    } catch (error) {
      logSafeError('Invited-user password setup failed.', error);
      setStatus(accountSetupStatus, passwordUpdateMessage(error, 'invite'));
    } finally { setPasswordFormBusy('invite', false); }
  }

  async function handleRecoveryPassword(event) {
    event.preventDefault();
    const {recoveryNewPassword, recoveryConfirmPassword, recoveryPasswordStatus} = getElements();
    const validation = validateNewPassword(recoveryNewPassword.value, recoveryConfirmPassword.value);
    setStatus(recoveryPasswordStatus, validation);
    if (validation) return;
    setPasswordFormBusy('recovery', true);
    try {
      const {data, error} = await global.LumaSupabase.getClient().auth.updateUser({password: recoveryNewPassword.value});
      if (error) throw error;
      if (data.user && state.session) state.session = {...state.session, user: data.user};
      recoveryNewPassword.value = '';
      recoveryConfirmPassword.value = '';
      clearRecoveryRequirement();
      clearAuthParametersFromUrl();
      setStatus(recoveryPasswordStatus, 'Password updated successfully. Opening LUMA BOM Manager...', 'success');
      await new Promise(resolve => global.setTimeout(resolve, 700));
      await routeAuthenticatedSession(state.session);
    } catch (error) {
      logSafeError('Password recovery update failed.', error);
      setStatus(recoveryPasswordStatus, passwordUpdateMessage(error, 'recovery'));
    } finally { setPasswordFormBusy('recovery', false); }
  }

  function showProfilePanel() {
    const {accountModalTitle, profileForm, changePasswordForm} = getElements();
    accountModalTitle.textContent = 'My Profile';
    profileForm.hidden = false;
    changePasswordForm.hidden = true;
  }

  function showChangePasswordPanel() {
    const {accountModalBackdrop, accountModalTitle, profileForm, changePasswordForm, currentPassword, changePasswordStatus} = getElements();
    closeAccountMenu();
    accountModalBackdrop.hidden = false;
    accountModalTitle.textContent = 'Change Password';
    profileForm.hidden = true;
    changePasswordForm.hidden = false;
    setStatus(changePasswordStatus, '');
    requestAnimationFrame(() => currentPassword.focus());
  }

  function populateProfileForm(profile) {
    const elements = getElements();
    elements.profileFullName.value = profile?.full_name || '';
    elements.profileJobTitle.value = profile?.job_title || '';
    elements.profileCompany.value = profile?.company || '';
    elements.profilePhone.value = profile?.phone || '';
    elements.profileEmail.value = state.session?.user?.email || '';
    elements.profileRole.value = state.role === USER_ROLES.ADMIN ? 'Administrator' : 'User';
  }

  async function openProfileModal() {
    const {accountModalBackdrop, profileStatus, profileSaveBtn} = getElements();
    closeAccountMenu();
    accountModalBackdrop.hidden = false;
    showProfilePanel();
    populateProfileForm(state.profile);
    setStatus(profileStatus, 'Loading profile...', 'success');
    profileSaveBtn.disabled = true;
    try {
      state.profile = await global.LumaProfileService.getCurrentProfile();
      populateProfileForm(state.profile);
      updateAccountIdentity(state.profile);
      setStatus(profileStatus, '');
    } catch (error) {
      logSafeError('Profile loading failed.', error);
      setStatus(profileStatus, 'Could not load your profile. Please try again.');
    } finally { profileSaveBtn.disabled = false; }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    const elements = getElements();
    setStatus(elements.profileStatus, '');
    elements.profileSaveBtn.disabled = true;
    elements.profileSaveBtn.textContent = 'Saving...';
    try {
      state.profile = await global.LumaProfileService.updateCurrentProfile({
        full_name: elements.profileFullName.value,
        job_title: elements.profileJobTitle.value,
        company: elements.profileCompany.value,
        phone: elements.profilePhone.value,
      });
      populateProfileForm(state.profile);
      updateAccountIdentity(state.profile);
      setStatus(elements.profileStatus, 'Profile saved.', 'success');
    } catch (error) {
      logSafeError('Profile update failed.', error);
      setStatus(elements.profileStatus, 'Could not save your profile. Please try again.');
    } finally {
      elements.profileSaveBtn.disabled = false;
      elements.profileSaveBtn.textContent = 'Save Profile';
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    const elements = getElements();
    setStatus(elements.changePasswordStatus, '');
    if (!elements.currentPassword.value) {
      setStatus(elements.changePasswordStatus, 'Enter your current password.');
      return;
    }
    const validation = validateNewPassword(elements.changeNewPassword.value, elements.changeConfirmPassword.value);
    if (validation) { setStatus(elements.changePasswordStatus, validation); return; }
    elements.currentPassword.disabled = true;
    elements.changeNewPassword.disabled = true;
    elements.changeConfirmPassword.disabled = true;
    elements.changePasswordSubmitBtn.disabled = true;
    elements.changePasswordSubmitBtn.textContent = 'Changing Password...';
    try {
      const {data, error} = await global.LumaSupabase.getClient().auth.updateUser({
        email: state.session.user.email,
        current_password: elements.currentPassword.value,
        password: elements.changeNewPassword.value,
      });
      if (error) throw error;
      if (data.user && state.session) state.session = {...state.session, user: data.user};
      elements.currentPassword.value = '';
      elements.changeNewPassword.value = '';
      elements.changeConfirmPassword.value = '';
      setStatus(elements.changePasswordStatus, 'Password changed successfully.', 'success');
    } catch (error) {
      logSafeError('Authenticated password change failed.', error);
      setStatus(elements.changePasswordStatus, passwordUpdateMessage(error, 'change'));
    } finally {
      elements.currentPassword.disabled = false;
      elements.changeNewPassword.disabled = false;
      elements.changeConfirmPassword.disabled = false;
      elements.changePasswordSubmitBtn.disabled = false;
      elements.changePasswordSubmitBtn.textContent = 'Change Password';
    }
  }

  async function handleLogout() {
    const {logoutBtn} = getElements();
    closeAccountMenu();
    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Signing Out...';
    try {
      const {error} = await global.LumaSupabase.getClient().auth.signOut({scope: 'local'});
      if (error) throw error;
      clearAccountSetupRequirement();
      clearRecoveryRequirement();
      showLogin();
    } catch (error) {
      logSafeError('Authentication sign-out failed.', error);
      alert('Could not sign out. Please try again.');
    } finally {
      logoutBtn.disabled = false;
      logoutBtn.textContent = 'Sign Out';
    }
  }

  function wireUiEvents() {
    const elements = getElements();
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.forgotPasswordBtn.addEventListener('click', showForgotPassword);
    elements.forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    elements.forgotPasswordBackBtn.addEventListener('click', () => showLogin());
    elements.accountSetupForm.addEventListener('submit', handleAccountSetup);
    elements.recoveryPasswordForm.addEventListener('submit', handleRecoveryPassword);
    elements.invalidRecoveryRequestBtn.addEventListener('click', showForgotPassword);
    elements.invalidRecoveryBackBtn.addEventListener('click', () => showLogin());
    elements.accountMenuBtn.addEventListener('click', () => {
      const willOpen = elements.accountMenu.hidden;
      elements.accountMenu.hidden = !willOpen;
      elements.accountMenuBtn.setAttribute('aria-expanded', String(willOpen));
    });
    elements.myProfileBtn.addEventListener('click', () => void openProfileModal());
    elements.changePasswordBtn.addEventListener('click', showChangePasswordPanel);
    elements.logoutBtn.addEventListener('click', handleLogout);
    elements.accountModalCloseBtn.addEventListener('click', closeAccountModal);
    elements.accountModalBackdrop.addEventListener('click', event => { if (event.target === elements.accountModalBackdrop) closeAccountModal(); });
    elements.profileForm.addEventListener('submit', handleProfileSave);
    elements.profileChangePasswordBtn.addEventListener('click', showChangePasswordPanel);
    elements.changePasswordForm.addEventListener('submit', handleChangePassword);
    elements.changePasswordCancelBtn.addEventListener('click', () => { showProfilePanel(); setStatus(elements.changePasswordStatus, ''); });
    document.addEventListener('click', event => {
      if (!elements.accountMenu.hidden && !elements.accountMenu.contains(event.target) && !elements.accountMenuBtn.contains(event.target)) closeAccountMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeAccountMenu();
        if (!elements.accountModalBackdrop.hidden) closeAccountModal();
      }
    });
  }

  async function startAuthentication() {
    const authLinkParameters = detectAuthLink();
    wireUiEvents();
    if (!global.LumaSupabase?.isConfigured()) {
      showLogin('Authentication setup is incomplete. Add the Supabase publishable key in supabase-client.js.');
      const {loginEmail, loginPassword, loginSubmitBtn} = getElements();
      loginEmail.disabled = true;
      loginPassword.disabled = true;
      loginSubmitBtn.disabled = true;
      return;
    }
    try {
      const client = global.LumaSupabase.getClient();
      client.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          state.recoveryLinkDetected = true;
          markRecoveryRequired(session);
          showRecoveryPassword(session);
          return;
        }
        if (session) void routeAuthenticatedSession(session);
        else if (event === 'SIGNED_OUT') {
          clearAccountSetupRequirement();
          clearRecoveryRequirement();
          showLogin();
        }
      });
      const {data, error} = await client.auth.getSession();
      if (error) throw error;
      if (data.session) await routeAuthenticatedSession(data.session);
      else if (state.recoveryLinkDetected || (authLinkParameters.hasError && storageGet(RECOVERY_STORAGE_KEY))) showInvalidRecovery();
      else {
        clearAccountSetupRequirement();
        if (authLinkParameters.hasError) clearRecoveryRequirement();
        showLogin(authLinkParameters.hasError ? 'This authentication link is invalid or has expired. Request a new link.' : '');
      }
    } catch (error) {
      logSafeError('Authentication initialization failed.', error);
      if (state.recoveryLinkDetected) showInvalidRecovery();
      else showLogin('Unable to initialize authentication. Please refresh and try again.');
    }
  }

  global.LumaAuth = Object.freeze({
    roles: USER_ROLES,
    getSession: () => state.session,
    getRole: () => state.role,
    getProfile: () => state.profile,
    isAdmin: () => state.role === USER_ROLES.ADMIN,
    openProfile: () => openProfileModal(),
  });

  document.addEventListener('DOMContentLoaded', startAuthentication);
})(window);
