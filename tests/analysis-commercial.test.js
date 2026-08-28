'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'analysis-commercial.js'), 'utf8');
const APP_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function fixture() {
  return {
    suppliers: [
      {id: 'steel-ok', supplier_code: 'SUP-001', supplier_name: 'ABC Steel', active: true, supplier_categories: [{category: 'Substructure', active: true, delivery_time_days: 42}]},
      {id: 'wrong-category', supplier_code: 'SUP-002', supplier_name: 'Electrical Only', active: true, supplier_categories: [{category: 'Electrical', active: true, delivery_time_days: 14}]},
      {id: 'inactive-assignment', supplier_code: 'SUP-003', supplier_name: 'Inactive Category', active: true, supplier_categories: [{category: 'Substructure', active: false, delivery_time_days: 30}]},
      {id: 'inactive-supplier', supplier_code: 'SUP-004', supplier_name: 'Inactive Supplier', active: false, supplier_categories: [{category: 'Substructure', active: true, delivery_time_days: 10}]},
      {id: 'no-list', supplier_code: 'SUP-005', supplier_name: 'No Active List', active: true, supplier_categories: [{category: 'Substructure', active: true, delivery_time_days: 20}]},
    ],
    priceLists: [
      {id: 'list-1', supplier_id: 'steel-ok', category: 'Substructure', revision: '2026-R01', currency: 'EUR', valid_from: '2026-08-01', valid_until: '2026-10-31', active: true, price_list_items: [
        {tag: 'k001141', unit: 'pcs', unit_price: '177.25'},
        {tag: 'zero-tag', unit: 'pcs', unit_price: '0'},
        {tag: 'blank-price', unit: 'pcs', unit_price: null},
      ]},
      {id: 'inactive-list', supplier_id: 'no-list', category: 'Substructure', revision: 'OLD', currency: 'EUR', active: false, price_list_items: []},
    ],
  };
}

function loadModule(data = fixture()) {
  let loads = 0;
  const window = {LumaPriceListService: {async loadActiveAnalysisData() { loads += 1; return data; }}};
  vm.runInContext(SOURCE, vm.createContext({window, Date, Map, Set}), {filename: 'analysis-commercial.js'});
  return {commercial: window.LumaCommercialAnalysis, loads: () => loads};
}

test('central category mapping exposes the nine commercial leaf sections', () => {
  const {commercial} = loadModule();
  assert.deepEqual({...commercial.SECTION_CATEGORIES}, {
    posts: 'Posts',
    substructure: 'Substructure',
    bearing: 'Bearing',
    slew_drive: 'Slew Drive',
    pv_module: 'PV Module',
    limit_switch: 'Limit Switch',
    soltrk: 'SOLTRK',
    junction_box: 'Junction Box',
    fasteners: 'Fasteners',
  });
  assert.equal(commercial.SECTION_CATEGORIES.major, undefined);
});

test('eligible supplier requires active supplier, category assignment, and active category Price List', async () => {
  const {commercial, loads} = loadModule();
  await commercial.load();
  await commercial.load();
  const data = commercial.buildSection('substructure', '', []);
  assert.deepEqual(data.eligibleSuppliers.map(entry => entry.supplier.id), ['steel-ok']);
  assert.equal(loads(), 1, 'ready commercial data should be reused without another query');
});

test('TAG matching calculates quantity times unit price without matching descriptions', async () => {
  const {commercial} = loadModule();
  await commercial.load();
  const data = commercial.buildSection('substructure', 'steel-ok', [
    {TAG: 'K001141', Description: 'Different wording is irrelevant', 'Total Qty': 120, Unit: 'pcs'},
    {TAG: 'not-listed', Description: 'k001141 is only text here', 'Total Qty': 5, Unit: 'pcs'},
  ]);
  assert.equal(data.rows[0].unitPrice, 177.25);
  assert.equal(data.rows[0].total, 21270);
  assert.equal(data.rows[1].unitPrice, null);
  assert.equal(data.missingPriceRows.length, 1);
  assert.equal(data.subtotal, 21270);
});

test('deliberate zero and missing prices remain distinct', async () => {
  const {commercial} = loadModule();
  await commercial.load();
  const data = commercial.buildSection('substructure', 'steel-ok', [
    {TAG: 'zero-tag', 'Total Qty': 8},
    {TAG: 'blank-price', 'Total Qty': 8},
  ]);
  assert.equal(data.rows[0].unitPrice, 0);
  assert.equal(data.rows[0].total, 0);
  assert.equal(data.rows[0].missingPrice, false);
  assert.equal(data.rows[1].unitPrice, null);
  assert.equal(data.rows[1].total, null);
  assert.equal(data.rows[1].missingPrice, true);
});

test('invalid restored supplier selection is flagged and never priced', async () => {
  const {commercial} = loadModule();
  await commercial.load();
  const data = commercial.buildSection('substructure', 'inactive-supplier', [{TAG: 'k001141', 'Total Qty': 120}]);
  assert.equal(data.invalidSelection, true);
  assert.equal(data.selection, null);
  assert.equal(data.rows[0].unitPrice, null);
  assert.equal(data.subtotal, 0);
});

test('validity status reports future and expired dates without rejecting active lists', () => {
  const {commercial} = loadModule();
  const today = new Date(2026, 7, 27);
  assert.equal(commercial.validityStatus({valid_from: '2026-09-01'}, today), 'Not Yet Valid');
  assert.equal(commercial.validityStatus({valid_until: '2026-08-01'}, today), 'Expired');
  assert.equal(commercial.validityStatus({valid_from: '2026-08-01', valid_until: '2026-10-31'}, today), 'Current');
});

test('workspace project payload persists stable supplier IDs for each mapped section', () => {
  assert.match(APP_SOURCE, /analysis_supplier_selections:normalizeAnalysisSupplierSelections\(p\.analysis_supplier_selections\)/);
  assert.match(APP_SOURCE, /p\.analysis_supplier_selections=normalizeAnalysisSupplierSelections\(raw\?\.analysis_supplier_selections\)/);
  assert.match(APP_SOURCE, /p\.analysis_supplier_selections\[page\]=event\.target\.value/);
});
