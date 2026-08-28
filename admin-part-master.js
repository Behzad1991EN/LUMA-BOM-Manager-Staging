'use strict';

(function initializePartMasterAdministration(global) {
  const state = {root:null, back:null, rows:[], selected:null, search:''};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const field = (label, key, value='', type='text', extra='') => `<label>${esc(label)}<input data-pm-field="${esc(key)}" type="${type}" value="${esc(value)}" ${extra}></label>`;

  function filteredRows() {
    const query = state.search.toLowerCase();
    return query ? state.rows.filter(row => `${row.TAG} ${row.Part} ${row.Description} ${row.Category} ${row['Post Kind']} ${row['Profile Type']}`.toLowerCase().includes(query)) : state.rows;
  }

  function selectedRow() { return state.rows.find(row => row.id === state.selected) || null; }

  function shell(content) {
    state.root.innerHTML = `<div class="admin-subpage-nav"><button class="admin-back-button" type="button" data-pm-back title="Back" aria-label="Back">←</button></div>${content}`;
    state.root.querySelector('[data-pm-back]').onclick = state.back;
  }

  function renderList() {
    const rows = filteredRows();
    const selected = selectedRow();
    const activeAction = selected?.Active === false ? 'Reactivate Selected' : 'Deactivate Selected';
    shell(`<div class="analysis-title-row"><div><h2 class="table-title">Part Master</h2><p class="table-subtitle">Supabase is the authoritative engineering Part Master. Deactivation preserves historical records.</p></div></div>
      <div class="search-row"><label>Search:</label><input data-pm-search value="${esc(state.search)}"><button data-pm-add>Add Part</button><button data-pm-edit ${selected ? '' : 'disabled'}>Edit Selected</button><button class="${selected?.Active === false ? '' : 'danger'}" data-pm-active ${selected ? '' : 'disabled'}>${activeAction}</button></div>
      <div class="table-wrap"><table><thead><tr><th>TAG</th><th>Part</th><th>Description</th><th>Category</th><th>Post Kind</th><th>Foundation</th><th>Depth</th><th>Profile</th><th>Active</th></tr></thead><tbody>${rows.map(row => `<tr data-pm-id="${esc(row.id)}" class="${row.id === state.selected ? 'row-selected' : ''} ${row.Active ? '' : 'inactive-row'}"><td>${esc(row.TAG)}</td><td>${esc(row.Part)}</td><td>${esc(row.Description)}</td><td>${esc(row.Category)}</td><td>${esc(row['Post Kind'])}</td><td>${esc(row['Foundation Method'])}</td><td>${esc(row['Foundation Depth mm'])}</td><td>${esc(row['Profile Type'])}</td><td>${row.Active ? 'Active' : 'Inactive'}</td></tr>`).join('') || '<tr><td colspan="9">No matching parts.</td></tr>'}</tbody></table></div>`);
    state.root.querySelector('[data-pm-search]').oninput = event => { state.search = event.target.value; renderList(); };
    state.root.querySelectorAll('[data-pm-id]').forEach(row => row.onclick = () => { state.selected = row.dataset.pmId; renderList(); });
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
  }

  function renderForm(record) {
    const value = record || {Active:true};
    const isPost = !!value['Post Kind'];
    shell(`<h2 class="table-title">${record ? 'Edit' : 'Add'} Part Master Record</h2><div class="supplier-form-grid">
      ${field('TAG', 'TAG', value.TAG)}${field('Part', 'Part', value.Part)}${field('Description', 'Description', value.Description)}${field('Part Number', 'Part Number', value['Part Number'])}${field('Category', 'Category', value.Category)}${field('Unit', 'Unit', value.Unit)}${field('Material', 'Material', value.Material)}${field('Weight', 'Weight', value.Weight, 'number', 'step="any"')}${field('Calculation Note', 'Calculation Note', value['Calculation Note'])}
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
      if (!record && !next.TAG.trim()) { alert('TAG is required for a new Part Master record.'); return; }
      if (!next.Part.trim() || !next.Description.trim() || !next.Category.trim()) { alert('Part, Description, and Category are required.'); return; }
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

  function reset() { Object.assign(state, {root:null, back:null, rows:[], selected:null, search:''}); }

  global.LumaAdminPartMaster = Object.freeze({open, reset});
})(window);
