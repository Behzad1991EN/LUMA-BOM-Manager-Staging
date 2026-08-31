'use strict';

(function initializeOverheadAdministration(global) {
  const state = {root: null, back: null};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const isAdmin = () => global.LumaAuth?.isAdmin?.() === true;
  const formatNumber = (value, digits = 2) => Number(value).toLocaleString(undefined, {minimumFractionDigits: digits, maximumFractionDigits: digits});
  const backButton = () => '<button class="admin-back-button" type="button" data-overhead-back aria-label="Back to Administration" title="Back to Administration"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>';

  function reset() { state.root = null; state.back = null; }

  function shell(content) {
    if (!state.root || !isAdmin()) return;
    state.root.innerHTML = `<div class="admin-subpage-nav">${backButton()}</div>${content}`;
    state.root.querySelector('[data-overhead-back]').onclick = state.back;
  }

  function renderLoading() {
    shell('<div class="supplier-loading" role="status">Loading Overhead settings...</div>');
  }

  function coefficientText(overhead, capacity) {
    const annualOverhead = Number(overhead), annualCapacity = Number(capacity);
    if (!Number.isFinite(annualOverhead) || annualOverhead < 0 || !Number.isFinite(annualCapacity) || annualCapacity <= 0) return 'Configuration required';
    return `€${formatNumber(annualOverhead / annualCapacity)} / MWp`;
  }

  function renderForm(settings, notice = '') {
    if (!state.root || !isAdmin()) return;
    shell(`<div class="supplier-page-header"><div><h2 class="table-title">Overhead</h2><p class="table-subtitle">Configure KSI overhead constants and commercial overhead parameters.</p></div></div>
      ${notice ? `<p class="supplier-notice success" role="status">${esc(notice)}</p>` : ''}
      <form id="overheadSettingsForm" class="supplier-form overhead-settings-form" novalidate>
        <div class="supplier-form-grid">
          <label class="supplier-form-field"><span>KSI Annual Overhead</span><span class="overhead-input-with-unit"><span>€</span><input name="ksi_annual_overhead_eur" type="number" min="0" step="any" required value="${esc(settings.ksi_annual_overhead_eur)}"><em>/ Year</em></span></label>
          <label class="supplier-form-field"><span>KSI Project Capacity per Year</span><span class="overhead-input-with-unit"><input name="ksi_annual_project_capacity_mwp" type="number" min="0.000001" step="any" required value="${esc(settings.ksi_annual_project_capacity_mwp)}"><em>MWp / Year</em></span></label>
          <div class="supplier-form-field overhead-coefficient-preview"><span>Coefficient A</span><output data-overhead-coefficient>${esc(coefficientText(settings.ksi_annual_overhead_eur, settings.ksi_annual_project_capacity_mwp))}</output><small>Derived automatically: Annual Overhead ÷ Annual Project Capacity</small></div>
        </div>
        <p class="supplier-form-status" data-overhead-status hidden></p>
        <div class="supplier-form-actions"><button type="button" data-overhead-cancel>Cancel</button><button class="export" type="submit">Save Overhead Settings</button></div>
      </form>`);
    const form = state.root.querySelector('#overheadSettingsForm');
    const status = form.querySelector('[data-overhead-status]');
    const syncCoefficient = () => {form.querySelector('[data-overhead-coefficient]').textContent = coefficientText(form.elements.ksi_annual_overhead_eur.value, form.elements.ksi_annual_project_capacity_mwp.value);};
    form.elements.ksi_annual_overhead_eur.addEventListener('input', syncCoefficient);
    form.elements.ksi_annual_project_capacity_mwp.addEventListener('input', syncCoefficient);
    state.root.querySelector('[data-overhead-cancel]').onclick = state.back;
    form.onsubmit = async event => {
      event.preventDefault();
      status.hidden = true;
      const overheadRaw = form.elements.ksi_annual_overhead_eur.value.trim();
      const capacityRaw = form.elements.ksi_annual_project_capacity_mwp.value.trim();
      const annualOverhead = Number(overheadRaw), annualCapacity = Number(capacityRaw);
      if (!overheadRaw || !Number.isFinite(annualOverhead) || annualOverhead < 0) {status.textContent = 'KSI Annual Overhead is required and must be zero or greater.'; status.hidden = false; return;}
      if (!capacityRaw || !Number.isFinite(annualCapacity) || annualCapacity <= 0) {status.textContent = 'KSI Project Capacity per Year is required and must be greater than zero.'; status.hidden = false; return;}
      const controls = [...form.querySelectorAll('button,input')]; controls.forEach(control => control.disabled = true);
      try {
        const saved = await global.LumaOverheadService.saveSettings({ksi_annual_overhead_eur: annualOverhead, ksi_annual_project_capacity_mwp: annualCapacity});
        renderForm(saved, 'Overhead settings saved.');
      } catch (error) {
        controls.forEach(control => control.disabled = false);
        status.textContent = error.message;
        status.hidden = false;
      }
    };
  }

  async function load() {
    renderLoading();
    try { renderForm(await global.LumaOverheadService.loadSettings({force: true})); }
    catch (error) { shell(`<div class="supplier-error" role="alert"><strong>Overhead settings could not be loaded.</strong><span>${esc(error.message)}</span><button type="button" data-overhead-retry>Try Again</button></div>`); state.root.querySelector('[data-overhead-retry]').onclick = load; }
  }

  function open(root, back) {
    if (!isAdmin()) return;
    state.root = root;
    state.back = back;
    void load();
  }

  global.LumaAdminOverhead = Object.freeze({open, reset});
})(window);
