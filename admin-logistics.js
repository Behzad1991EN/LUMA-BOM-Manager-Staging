'use strict';

(function initializeLogisticsAdministration(global) {
  const state = {root:null, back:null, rates:[], selectedId:null, search:'', activeFilter:'all'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const isAdmin = () => global.LumaAuth?.isAdmin?.() === true;
  const selectedRate = () => state.rates.find(rate => rate.id === state.selectedId) || null;
  const backButton = label => `<button class="admin-back-button" type="button" data-logistics-back aria-label="${esc(label)}" title="${esc(label)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>`;
  const optionHtml = (options, value) => options.map(option => {const optionValue=typeof option==='object'?(option.code??option.value):option,optionLabel=typeof option==='object'?(option.label??global.LumaCurrencyData.optionLabel(optionValue)):option;return `<option value="${esc(optionValue)}" ${optionValue === value ? 'selected' : ''}>${esc(optionLabel)}</option>`;}).join('');
  const input = (label, name, value='', attributes='') => `<label class="supplier-form-field"><span>${esc(label)}</span><input name="${esc(name)}" value="${esc(value ?? '')}" ${attributes}></label>`;
  const select = (label, name, options, value) => `<label class="supplier-form-field"><span>${esc(label)}</span><select name="${esc(name)}">${optionHtml(options, value)}</select></label>`;

  function reset() { Object.assign(state, {root:null, back:null, rates:[], selectedId:null, search:'', activeFilter:'all'}); }
  function shell(content, back = state.back) {
    state.root.innerHTML = `<div class="admin-subpage-nav">${backButton('Back')}</div>${content}`;
    state.root.querySelector('[data-logistics-back]').onclick = back;
  }
  function filteredRates() {
    const query = state.search.trim().toLowerCase();
    return state.rates.filter(rate => {
      if (state.activeFilter === 'active' && !rate.active) return false;
      if (state.activeFilter === 'inactive' && rate.active) return false;
      return !query || `${rate.origin_country} ${rate.destination_country} ${rate.cargo_group} ${rate.revision} ${rate.currency} ${rate.notes || ''}`.toLowerCase().includes(query);
    });
  }
  function tableRows() {
    const rows = filteredRates();
    if (!rows.length) return '<tr><td class="empty-table-message" colspan="11">No Logistics rates match the current filters.</td></tr>';
    return rows.map((rate, index) => {const spec=global.LumaLogisticsCalculator.capacitySpec(rate.cargo_group),type=rate.capacity_type||spec?.type||'',unit=rate.capacity_unit||spec?.unit||'',value=rate.capacity_value??rate.container_capacity_kg;return `<tr data-logistics-id="${esc(rate.id)}" class="${rate.id === state.selectedId ? 'row-selected ' : ''}${rate.active ? '' : 'inactive-row'}"><td>${index + 1}</td><td>${esc(rate.origin_country)}</td><td>${esc(rate.destination_country)}</td><td>${esc(rate.cargo_group)}</td><td>${esc(spec?.basisLabel||type)}</td><td>${esc(value)} ${esc(unit)}</td><td>${esc(rate.revision)}</td><td>${esc(global.LumaCurrencyData.display(rate.currency))}</td><td>${esc(rate.valid_from || '—')}</td><td>${esc(rate.valid_until || '—')}</td><td><span class="supplier-status ${rate.active ? 'active' : 'inactive'}">${rate.active ? 'Active' : 'Inactive'}</span></td></tr>`;}).join('');
  }
  function updateActions() {
    const rate = selectedRate(), edit = state.root?.querySelector('[data-logistics-edit]'), active = state.root?.querySelector('[data-logistics-active]');
    if (edit) edit.disabled = !rate;
    if (active) {active.disabled = !rate;active.textContent = rate?.active ? 'Deactivate Selected' : 'Reactivate Selected';active.classList.toggle('danger', !!rate?.active);}
  }
  function bindRows() {
    state.root.querySelectorAll('[data-logistics-id]').forEach(row => row.onclick = () => {state.selectedId = row.dataset.logisticsId;renderTable();});
  }
  function renderTable() {
    const body = state.root?.querySelector('#logisticsRateBody');if (!body) return;body.innerHTML = tableRows();bindRows();updateActions();
  }
  function renderList(notice='') {
    shell(`<div class="supplier-page-header"><div><h2 class="table-title">Logistics</h2><p class="table-subtitle">Configure container capacities and country-to-country logistics rates.</p></div><button class="export" type="button" data-logistics-add>Add Logistics Rate</button></div>
      ${notice ? `<p class="supplier-notice success" role="status">${esc(notice)}</p>` : ''}
      <div class="price-list-filters"><label><span>Status</span><select data-logistics-status><option value="all">All</option><option value="active" ${state.activeFilter === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${state.activeFilter === 'inactive' ? 'selected' : ''}>Inactive</option></select></label><label><span>Search</span><input type="search" data-logistics-search value="${esc(state.search)}" placeholder="Origin, destination, revision"></label></div>
      <div class="supplier-selection-actions price-list-actions"><button type="button" data-logistics-edit disabled>Edit Selected</button><button type="button" data-logistics-active disabled>Deactivate Selected</button></div>
      <div class="table-wrap logistics-rate-table-wrap"><table class="logistics-rate-table"><thead><tr><th>No.</th><th>Origin</th><th>Destination</th><th>Cargo Group</th><th>Capacity Basis</th><th>Capacity</th><th>Revision</th><th>Currency</th><th>Valid From</th><th>Valid Until</th><th>Active</th></tr></thead><tbody id="logisticsRateBody">${tableRows()}</tbody></table></div>`);
    state.root.querySelector('[data-logistics-add]').onclick = () => renderForm();
    state.root.querySelector('[data-logistics-edit]').onclick = () => {const rate=selectedRate();if(rate)renderForm(rate);};
    state.root.querySelector('[data-logistics-active]').onclick = toggleActive;
    state.root.querySelector('[data-logistics-status]').onchange = event => {state.activeFilter=event.target.value;renderTable();};
    state.root.querySelector('[data-logistics-search]').oninput = event => {state.search=event.target.value;renderTable();};
    bindRows();updateActions();
  }
  async function load() {
    shell('<div class="supplier-loading">Loading Logistics rates...</div>');
    try {state.rates = await global.LumaLogisticsService.listRates();renderList();}
    catch (error) {shell(`<div class="supplier-error">${esc(error.message)} <button data-logistics-retry>Try Again</button></div>`);state.root.querySelector('[data-logistics-retry]').onclick = load;}
  }
  function numberValue(form, name, {required=false, positive=false}={}) {
    const raw = form.elements[name].value.trim();if (!raw && !required) return null;const number=Number(raw);
    if (!Number.isFinite(number) || number < 0 || (positive && number <= 0)) throw new Error(`${form.elements[name].closest('label').querySelector('span').textContent} must be ${positive?'greater than zero':'zero or greater'}.`);
    return raw;
  }
  function readForm(form) {
    const validFrom=form.elements.valid_from.value,validUntil=form.elements.valid_until.value;if(validFrom&&validUntil&&validUntil<validFrom)throw new Error('Valid Until cannot be before Valid From.');
    const revision=form.elements.revision.value.trim().toUpperCase();if(!revision)throw new Error('Revision is required.');
    const cargoGroup=form.elements.cargo_group.value,spec=global.LumaLogisticsCalculator.capacitySpec(cargoGroup);if(!spec)throw new Error('Select a supported Cargo Group.');
    return {origin_country:form.elements.origin_country.value,destination_country:form.elements.destination_country.value,cargo_group:cargoGroup,capacity_type:spec.type,capacity_value:numberValue(form,'capacity_value'),capacity_unit:spec.unit,currency:form.elements.currency.value,fob_per_container:numberValue(form,'fob_per_container'),cif_per_container:numberValue(form,'cif_per_container'),customs_clearance_per_container:numberValue(form,'customs_clearance_per_container'),internal_site_per_container:numberValue(form,'internal_site_per_container'),internal_warehouse_per_container:numberValue(form,'internal_warehouse_per_container'),revision,valid_from:validFrom,valid_until:validUntil,active:form.elements.active.checked,notes:form.elements.notes.value};
  }
  function renderForm(rate=null) {
    const value=rate||{origin_country:'Italy',destination_country:'Italy',cargo_group:'Steel Structure',capacity_value:'',currency:'EUR',active:false};const initialSpec=global.LumaLogisticsCalculator.capacitySpec(value.cargo_group);if(value.capacity_value===undefined)value.capacity_value=value.container_capacity_kg??'';
    shell(`<div class="supplier-form-header"><h2 class="table-title">${rate?'Edit':'Add'} Logistics Rate</h2><p class="table-subtitle">Per-container commercial values. Blank means missing; zero is preserved as an intentional cost.</p></div><form id="logisticsRateForm" class="supplier-form" novalidate><div class="supplier-form-grid">
      ${select('Origin','origin_country',global.LumaCountryData.LOGISTICS_ORIGINS,value.origin_country)}${select('Destination','destination_country',global.LumaCountryData.EUROPEAN_COUNTRIES,value.destination_country)}${select('Cargo Group','cargo_group',global.LumaLogisticsCalculator.CARGO_GROUPS,value.cargo_group)}${input('Revision','revision',value.revision,'required placeholder="2026-R01"')}<label class="supplier-form-field"><span>Capacity Basis</span><output data-capacity-basis>${esc(initialSpec?.basisLabel||'—')} (${esc(initialSpec?.unit||'')})</output></label>${input(initialSpec?.valueLabel||'Capacity','capacity_value',value.capacity_value,'type="number" min="0" step="any" placeholder="Missing" data-capacity-value')}${select('Currency','currency',global.LumaCurrencyData.OPTIONS,value.currency)}${input('FOB / Container','fob_per_container',value.fob_per_container,'type="number" min="0" step="any" placeholder="Missing"')}${input('CIF / Container','cif_per_container',value.cif_per_container,'type="number" min="0" step="any" placeholder="Missing"')}${input('Customs Clearance / Container','customs_clearance_per_container',value.customs_clearance_per_container,'type="number" min="0" step="any" placeholder="Missing"')}${input('Transportation to Site / Container','internal_site_per_container',value.internal_site_per_container,'type="number" min="0" step="any" placeholder="Missing"')}${input('Transportation to Warehouse / Container','internal_warehouse_per_container',value.internal_warehouse_per_container,'type="number" min="0" step="any" placeholder="Missing"')}${input('Valid From','valid_from',value.valid_from,'type="date"')}${input('Valid Until','valid_until',value.valid_until,'type="date"')}<label class="supplier-form-field supplier-form-wide"><span>Notes</span><textarea name="notes" rows="3">${esc(value.notes||'')}</textarea></label><label class="supplier-active-check supplier-form-wide"><input type="checkbox" name="active" ${value.active?'checked':''}><span>Active rate</span></label></div><p class="supplier-form-status" data-logistics-form-status hidden></p><div class="supplier-form-actions"><button type="button" data-logistics-cancel>Cancel</button><button class="export" type="submit">${rate?'Save Changes':'Create Rate'}</button></div></form>`, () => renderList());
    const form=state.root.querySelector('#logisticsRateForm'),syncCapacity=()=>{const spec=global.LumaLogisticsCalculator.capacitySpec(form.elements.cargo_group.value),field=form.elements.capacity_value,label=field.closest('label').querySelector('span'),basis=form.querySelector('[data-capacity-basis]');label.textContent=spec?.valueLabel||'Capacity';basis.textContent=spec?`${spec.basisLabel} (${spec.unit})`:'—';field.setAttribute('aria-label',label.textContent);};form.elements.cargo_group.addEventListener('change',syncCapacity);syncCapacity();state.root.querySelector('[data-logistics-cancel]').onclick=()=>renderList();form.onsubmit=async event=>{event.preventDefault();const status=form.querySelector('[data-logistics-form-status]');status.hidden=true;let values;try{values=readForm(form);}catch(error){status.textContent=error.message;status.hidden=false;return;}const controls=[...form.querySelectorAll('button,input,select,textarea')];controls.forEach(control=>control.disabled=true);try{await global.LumaLogisticsService.saveRate({rateId:rate?.id||null,values});state.rates=await global.LumaLogisticsService.listRates();state.selectedId=rate?.id||null;renderList('Logistics rate saved.');}catch(error){controls.forEach(control=>control.disabled=false);status.textContent=error.message;status.hidden=false;}};
  }
  async function toggleActive() {
    const rate=selectedRate();if(!rate)return;const next=!rate.active,verb=next?'Reactivate':'Deactivate';if(!confirm(`${verb} ${rate.origin_country} → ${rate.destination_country} / ${rate.cargo_group} / ${rate.revision}?`))return;
    try{await global.LumaLogisticsService.setRateActive(rate.id,next);state.rates=await global.LumaLogisticsService.listRates();renderList(`Logistics rate ${next?'reactivated':'deactivated'}.`);}catch(error){alert(error.message);}
  }
  function open(root, back) {if(!isAdmin())return;state.root=root;state.back=back;state.selectedId=null;void load();}
  global.LumaAdminLogistics = Object.freeze({open,reset});
})(window);
