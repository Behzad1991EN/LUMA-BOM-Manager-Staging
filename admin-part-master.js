'use strict';

(function initializePartMasterAdministration(global) {
  const COLUMNS = Object.freeze([
    {key:'__number', label:'No.', type:'number'},
    {key:'TAG', label:'TAG'},
    {key:'Part', label:'Part'},
    {key:'Description', label:'Description'},
    {key:'Part Number', label:'Part Number'},
    {key:'Unit', label:'Unit', type:'select'},
    {key:'Category', label:'Category', type:'select'},
    {key:'Material', label:'Material'},
    {key:'Weight', label:'Weight (kg)', type:'number'},
    {key:'Calculation Note', label:'Calculation Note'},
    {key:'Active', label:'Active', type:'active'},
    {key:'Post Kind', label:'Post Kind', type:'select'},
    {key:'Foundation Method', label:'Foundation Method', type:'select'},
    {key:'Foundation Depth mm', label:'Foundation Depth (mm)', type:'number'},
    {key:'Profile Type', label:'Profile Type', type:'select'},
    {key:'Profile Details', label:'Profile Details'},
    {key:'Overall Length mm', label:'Overall Length (mm)', type:'number'},
  ]);
  const state = {root:null, back:null, rows:[], selected:null, search:'', filters:{}, sortKey:'TAG', sortDirection:'asc'};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const field = (label, key, value='', type='text', extra='') => `<label>${esc(label)}<input data-pm-field="${esc(key)}" type="${type}" value="${esc(value)}" ${extra}></label>`;

  function selectedRow() { return state.rows.find(row => row.id === state.selected) || null; }
  function cellValue(row, key) { return key === 'Active' ? (row.Active === false ? 'Inactive' : 'Active') : row[key] ?? ''; }

  function matchesNumeric(value, filter) {
    const source = String(filter || '').trim();
    if (!source) return true;
    const match = source.match(/^(<=|>=|<|>|=)?\s*(-?\d+(?:\.\d+)?)$/);
    if (!match) return String(value ?? '').toLowerCase().includes(source.toLowerCase());
    const actual = Number(value);
    const expected = Number(match[2]);
    if (!Number.isFinite(actual)) return false;
    return ({'<':actual < expected, '<=':actual <= expected, '>':actual > expected, '>=':actual >= expected, '=':actual === expected})[match[1] || '='];
  }

  function rowMatchesFilters(row) {
    const query = state.search.trim().toLowerCase();
    if (query && !COLUMNS.slice(1).some(column => String(cellValue(row, column.key)).toLowerCase().includes(query))) return false;
    return COLUMNS.every(column => {
      const filter = String(state.filters[column.key] || '').trim();
      if (!filter || column.key === '__number') return true;
      const value = cellValue(row, column.key);
      if (column.type === 'number') return matchesNumeric(value, filter);
      if (column.type === 'select' || column.type === 'active') return String(value).toLowerCase() === filter.toLowerCase();
      return String(value).toLowerCase().includes(filter.toLowerCase());
    });
  }

  function compareValues(left, right, type) {
    if (type === 'number') {
      const a = Number(left); const b = Number(right);
      if (Number.isFinite(a) || Number.isFinite(b)) return (Number.isFinite(a) ? a : Number.POSITIVE_INFINITY) - (Number.isFinite(b) ? b : Number.POSITIVE_INFINITY);
    }
    if (type === 'active') return Number(left !== 'Inactive') - Number(right !== 'Inactive');
    return String(left ?? '').localeCompare(String(right ?? ''), undefined, {numeric:true, sensitivity:'base'});
  }

  function visibleRows() {
    const filtered = state.rows.map((row, originalIndex) => ({row, originalIndex})).filter(entry => rowMatchesFilters(entry.row));
    const column = COLUMNS.find(item => item.key === state.sortKey) || COLUMNS[1];
    filtered.sort((left, right) => {
      const leftValue = column.key === '__number' ? left.originalIndex : cellValue(left.row, column.key);
      const rightValue = column.key === '__number' ? right.originalIndex : cellValue(right.row, column.key);
      const result = compareValues(leftValue, rightValue, column.type);
      return (state.sortDirection === 'desc' ? -result : result) || left.originalIndex - right.originalIndex;
    });
    return filtered.map(entry => entry.row);
  }

  function shell(content) {
    state.root.innerHTML = `<div class="admin-subpage-nav"><button class="admin-back-button" type="button" data-pm-back title="Back to Administration" aria-label="Back to Administration"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button></div>${content}`;
    state.root.querySelector('[data-pm-back]').onclick = state.back;
  }

  function filterOptions(column) {
    if (column.type === 'active') return ['Active', 'Inactive'];
    return [...new Set(state.rows.map(row => String(cellValue(row, column.key)).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, {numeric:true, sensitivity:'base'}));
  }

  function headerHtml(column) {
    const sorted = state.sortKey === column.key;
    const direction = sorted ? state.sortDirection : 'none';
    const arrow = sorted ? (direction === 'asc' ? '▲' : '▼') : '↕';
    return `<th aria-sort="${direction === 'none' ? 'none' : direction === 'asc' ? 'ascending' : 'descending'}"><button class="pm-sort-button" type="button" data-pm-sort="${esc(column.key)}">${esc(column.label)} <span aria-hidden="true">${arrow}</span></button></th>`;
  }

  function filterHtml(column) {
    if (column.key === '__number') return '<th></th>';
    const value = state.filters[column.key] || '';
    if (column.type === 'select' || column.type === 'active') {
      return `<th><select data-pm-filter="${esc(column.key)}" aria-label="Filter ${esc(column.label)}"><option value="">All</option>${filterOptions(column).map(option => `<option value="${esc(option)}" ${option === value ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></th>`;
    }
    const placeholder = column.type === 'number' ? '=, >, <' : 'Filter';
    return `<th><input data-pm-filter="${esc(column.key)}" value="${esc(value)}" placeholder="${placeholder}" aria-label="Filter ${esc(column.label)}"></th>`;
  }

  function rowHtml(row, number) {
    return `<tr data-pm-id="${esc(row.id)}" class="${row.id === state.selected ? 'row-selected' : ''} ${row.Active ? '' : 'inactive-row'}">${COLUMNS.map(column => {
      const value = column.key === '__number' ? number : cellValue(row, column.key);
      return `<td>${value === '' ? '—' : esc(value)}</td>`;
    }).join('')}</tr>`;
  }

  function updateActions() {
    const selected = selectedRow();
    const edit = state.root?.querySelector('[data-pm-edit]');
    const active = state.root?.querySelector('[data-pm-active]');
    if (edit) edit.disabled = !selected;
    if (active) {
      active.disabled = !selected;
      active.textContent = selected?.Active === false ? 'Reactivate Selected' : 'Deactivate Selected';
      active.classList.toggle('danger', !!selected && selected.Active !== false);
    }
  }

  function bindRows() {
    state.root.querySelectorAll('[data-pm-id]').forEach(row => row.onclick = () => {
      state.selected = row.dataset.pmId;
      renderTableBody();
    });
  }

  function renderTableBody() {
    const body = state.root?.querySelector('#partMasterTableBody');
    if (!body) return;
    const rows = visibleRows();
    body.innerHTML = rows.map((row, index) => rowHtml(row, index + 1)).join('') || `<tr><td class="empty-table-message" colspan="${COLUMNS.length}">No Part Master records match the current filters.</td></tr>`;
    const count = state.root.querySelector('[data-pm-visible-count]');
    if (count) count.textContent = `${rows.length} of ${state.rows.length} records`;
    bindRows();
    updateActions();
  }

  function renderList() {
    const selected = selectedRow();
    shell(`<div class="supplier-page-header"><div><h2 class="table-title">Part Master</h2><p class="table-subtitle">Manage authoritative engineering Part Master records.</p></div><button class="export" type="button" data-pm-add>Add Part</button></div>
      <div class="part-master-list-controls"><label class="supplier-search"><span>Search all columns</span><input type="search" data-pm-search value="${esc(state.search)}" placeholder="TAG, part, description, material, category..."></label><span class="part-master-visible-count" data-pm-visible-count></span><div class="supplier-selection-actions"><button data-pm-edit ${selected ? '' : 'disabled'}>Edit Selected</button><button class="${selected?.Active === false ? '' : 'danger'}" data-pm-active ${selected ? '' : 'disabled'}>${selected?.Active === false ? 'Reactivate Selected' : 'Deactivate Selected'}</button></div></div>
      <div class="table-wrap part-master-table-wrap"><table class="part-master-admin-table"><thead><tr>${COLUMNS.map(headerHtml).join('')}</tr><tr class="pm-filter-row">${COLUMNS.map(filterHtml).join('')}</tr></thead><tbody id="partMasterTableBody"></tbody></table></div>`);
    state.root.querySelector('[data-pm-search]').oninput = event => { state.search = event.target.value; renderTableBody(); };
    state.root.querySelectorAll('[data-pm-filter]').forEach(control => {
      const eventName = control.tagName === 'SELECT' ? 'change' : 'input';
      control.addEventListener(eventName, () => { state.filters[control.dataset.pmFilter] = control.value; renderTableBody(); });
    });
    state.root.querySelectorAll('[data-pm-sort]').forEach(button => button.onclick = () => {
      const key = button.dataset.pmSort;
      if (state.sortKey === key) state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDirection = 'asc'; }
      renderList();
    });
    state.root.querySelector('[data-pm-add]').onclick = () => renderForm(null);
    state.root.querySelector('[data-pm-edit]').onclick = () => renderForm(selectedRow());
    state.root.querySelector('[data-pm-active]').onclick = async () => {
      const record = selectedRow();
      if (!record) return;
      const nextActive = record.Active === false;
      const action = nextActive ? 'Reactivate' : 'Deactivate';
      if (!confirm(`${action} ${record.TAG || record.Part} — ${record.Part}?`)) return;
      try {
        await global.LumaPartMasterService.setPartActive(record.id, nextActive);
        await global.LumaApp?.reloadPartMaster?.({force:false});
        await load();
      } catch (error) { alert(error.message); }
    };
    renderTableBody();
  }

  function renderForm(record) {
    const value = record || {Active:true};
    const isPost = !!value['Post Kind'];
    shell(`<div class="supplier-form-header"><h2 class="table-title">${record ? 'Edit' : 'Add'} Part Master Record</h2><p class="table-subtitle">${record ? 'Update the selected authoritative Part Master record.' : 'Create an authoritative engineering Part Master record.'}</p></div><div class="supplier-form-grid">
      ${field('TAG', 'TAG', value.TAG)}${field('Part', 'Part', value.Part)}${field('Description', 'Description', value.Description)}${field('Part Number', 'Part Number', value['Part Number'])}${field('Category', 'Category', value.Category)}${field('Unit', 'Unit', value.Unit)}${field('Material', 'Material', value.Material)}${field('Weight (kg)', 'Weight', value.Weight, 'number', 'step="any"')}${field('Calculation Note', 'Calculation Note', value['Calculation Note'])}
      <label>Post Kind<select data-pm-field="Post Kind"><option value="">Not a post</option>${['Main Post', 'Bearing Post'].map(option => `<option ${value['Post Kind'] === option ? 'selected' : ''}>${option}</option>`).join('')}</select></label>
      <div class="pm-post-fields" data-pm-post-fields ${isPost ? '' : 'hidden'}>
        <label>Foundation Method<select data-pm-field="Foundation Method"><option value=""></option>${['Ramming', 'Foundation'].map(option => `<option ${value['Foundation Method'] === option ? 'selected' : ''}>${option}</option>`).join('')}</select></label>
        ${field('Foundation Depth (mm)', 'Foundation Depth mm', value['Foundation Depth mm'], 'number', 'min="1" step="1"')}${field('Profile Type', 'Profile Type', value['Profile Type'])}${field('Profile Details', 'Profile Details', value['Profile Details'])}${field('Overall Length (mm)', 'Overall Length mm', value['Overall Length mm'], 'number', 'min="1" step="1"')}
      </div>
      <label class="supplier-checkbox"><input data-pm-active-checkbox type="checkbox" ${value.Active !== false ? 'checked' : ''}> Active</label></div>
      <div class="modal-actions"><button data-pm-cancel>Cancel</button><button data-pm-save>Save Part</button></div>`);
    const postKind = state.root.querySelector('[data-pm-field="Post Kind"]');
    const postFields = state.root.querySelector('[data-pm-post-fields]');
    postKind.onchange = () => { postFields.hidden = !postKind.value; };
    state.root.querySelector('[data-pm-cancel]').onclick = renderList;
    state.root.querySelector('[data-pm-save]').onclick = async () => {
      const next = {...value};
      state.root.querySelectorAll('[data-pm-field]').forEach(element => { next[element.dataset.pmField] = element.value; });
      next.Active = state.root.querySelector('[data-pm-active-checkbox]').checked;
      if (!record && !String(next.TAG || '').trim()) { alert('TAG is required for a new Part Master record.'); return; }
      if (!String(next.Part || '').trim() || !String(next.Description || '').trim() || !String(next.Category || '').trim()) { alert('Part, Description, and Category are required.'); return; }
      if (next['Post Kind'] && (!next['Foundation Method'] || !next['Foundation Depth mm'] || !next['Profile Type'] || !next['Overall Length mm'])) {
        alert('Complete Foundation Method, Foundation Depth, Profile Type, and Overall Length for a post record.');
        return;
      }
      try {
        await global.LumaPartMasterService.save(next);
        await global.LumaApp?.reloadPartMaster?.({force:false});
        await load();
      } catch (error) { alert(error.message); }
    };
  }

  async function load() {
    shell('<div class="supplier-loading">Loading Part Master...</div>');
    try {
      state.rows = await global.LumaPartMasterService.list({includeInactive:true});
      renderList();
    } catch (error) {
      shell(`<div class="supplier-error">${esc(error.message)} <button data-pm-retry>Try Again</button></div>`);
      state.root.querySelector('[data-pm-retry]').onclick = () => void load();
    }
  }

  function open(root, back) {
    if (!global.LumaAuth?.isAdmin?.()) return;
    state.root = root;
    state.back = back;
    state.selected = null;
    void load();
  }

  function reset() { Object.assign(state, {root:null, back:null, rows:[], selected:null, search:'', filters:{}, sortKey:'TAG', sortDirection:'asc'}); }

  global.LumaAdminPartMaster = Object.freeze({open, reset});
})(window);
