'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'analysis-commercial.js'), 'utf8');
const CATEGORY_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'commercial-categories.js'), 'utf8');
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
  const context = vm.createContext({window, Date, Map, Set});
  vm.runInContext(CATEGORY_SOURCE, context, {filename: 'commercial-categories.js'});
  vm.runInContext(SOURCE, context, {filename: 'analysis-commercial.js'});
  return {commercial: window.LumaCommercialAnalysis, loads: () => loads};
}

test('central category mapping exposes all ten commercial leaf sections including general Electrical', () => {
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
    electrical: 'Electrical',
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
    {TAG: 'K001141', Category:'Steel Structure / Substructure', Description: 'Different wording is irrelevant', 'Total Qty': 120, Unit: 'pcs'},
    {TAG: 'not-listed', Category:'Steel Structure / Substructure', Description: 'k001141 is only text here', 'Total Qty': 5, Unit: 'pcs'},
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
    {TAG: 'zero-tag', Category:'Steel Structure / Substructure', 'Total Qty': 8},
    {TAG: 'blank-price', Category:'Steel Structure / Substructure', 'Total Qty': 8},
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
  const data = commercial.buildSection('substructure', 'inactive-supplier', [{TAG: 'k001141', Category:'Steel Structure / Substructure', 'Total Qty': 120}]);
  assert.equal(data.invalidSelection, true);
  assert.equal(data.selection, null);
  assert.equal(data.rows[0].unitPrice, null);
  assert.equal(data.subtotal, 0);
});

test('Posts section rejects a complete mixed BOM and keeps only Main Post and Bearing Post rows', () => {
  const {commercial} = loadModule();
  const data = commercial.buildSection('posts', '', [
    {TAG:'k001152', Category:'Steel Structure / Post', Part:'Main Post', 'Post Kind':'Main Post', 'Total Qty':10},
    {TAG:'k001120', Category:'Steel Structure / Post', Part:'Bearing Post', 'Post Kind':'Bearing Post', 'Total Qty':40},
    {TAG:'k001162', Category:'Steel Structure / Substructure', Part:'Slew Drive Seat', 'Post Kind':0, 'Total Qty':20},
    {TAG:'k001119', Category:'Steel Structure / Substructure', Part:'Bearing Adapter', Description:'Bearing Post', 'Post Kind':0, 'Total Qty':40},
    {TAG:'legacy-seat', Category:'Steel Structure', Part:'Slew Drive Seat', Description:'2 x Main Post', 'Post Kind':0, 'Total Qty':20},
    {TAG:'k001135', Category:'Bearings', Part:'Bearing 110', 'Post Kind':0, 'Total Qty':80},
    {TAG:'k001393', Category:'Electrical', Part:'Limit Switch', 'Post Kind':0, 'Total Qty':20},
  ]);
  assert.deepEqual(data.rows.map(row => row.tag), ['k001152', 'k001120']);
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

test('PV Module procurement defaults to excluded, persists per project, and gates all commercial totals', () => {
  assert.match(APP_SOURCE, /analysis_pv_module_included:false/);
  assert.match(APP_SOURCE, /analysis_pv_module_included:isPvModuleIncluded\(p\)/);
  assert.match(APP_SOURCE, /analysis_pv_module_included=raw\?\.analysis_pv_module_included===true/);
  assert.match(APP_SOURCE, /function isAnalysisSectionIncluded\(page,project=getActiveProject\(\)\)/);
  assert.match(APP_SOURCE, /isAnalysisSectionIncluded\(page,project\)\?\{page,data:buildSupplierCostData\(page\),excluded:false\}:\{page,data:null,excluded:true\}/);
  assert.match(APP_SOURCE, /data=included\?buildSupplierCostData\(page\):window\.LumaCommercialAnalysis\.buildSection\(page,'',commercialAnalysisRows\(page\)\)/);
  assert.match(APP_SOURCE, /if\(!isAnalysisSectionIncluded\(page\)\)\{excludedPages\.push\(page\);continue;\}/);
  assert.match(APP_SOURCE, /PV Module cost excluded from the entire price calculation/);
  assert.match(APP_SOURCE, /Quotation commercial total/);
});

test('a single eligible supplier is used automatically while several still require selection', () => {
  assert.match(APP_SOURCE, /if\(!supplierId&&data\.eligibleSuppliers\.length===1\)data=window\.LumaCommercialAnalysis\.buildSection/);
  assert.match(APP_SOURCE, /The selected \$\{data\.category\} Price List contains no saved unit prices/);
  assert.match(APP_SOURCE, /none match the current \$\{data\.category\} BOM TAGs/);
});

test('commercial runtime scripts use one cache-busting release token', () => {
  const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const script of ['price-list-service.js', 'commercial-categories.js', 'analysis-commercial.js', 'app.js']) {
    assert.match(indexSource, new RegExp(`${script.replace('.', '\\.') }\\?v=20260903-project-bom-controls`));
  }
  assert.match(indexSource, /style\.css\?v=20260903-project-bom-controls/);
});

test('every Analysis table uses the shared numbered sortable and filterable table', () => {
  assert.match(APP_SOURCE, /function makeAnalysisTable\(columns,rows\)/);
  assert.match(APP_SOURCE, /return \['No\.',\.\.\.\(columns\|\|\[\]\)\.filter/);
  assert.match(APP_SOURCE, /data-analysis-sort-index/);
  assert.match(APP_SOURCE, /data-analysis-filter-index/);
  assert.match(APP_SOURCE, /function wireAnalysisTables\(root\)/);
  const analysisSource = APP_SOURCE.slice(APP_SOURCE.indexOf('function formatAnalysisNumber'), APP_SOURCE.indexOf('function projectSummaryRows'));
  assert.doesNotMatch(analysisSource, /makeArrayTable\(/);
});

test('BOM detail Analysis tables inherit all active Project BOM columns', () => {
  assert.match(APP_SOURCE, /function analysisProjectBomColumns\(extraColumns=\[\]\)/);
  assert.match(APP_SOURCE, /current\?\.bom\?\.columns\|\|\[\]/);
  assert.match(APP_SOURCE, /analysisDetailBomColumns\(page,\['Supplier Unit Price','Price Currency','Calculated Total'\]\)/);
  assert.match(APP_SOURCE, /analysisProjectBomColumns\(\['Qty \/ Package','Packages','Required Qty'\]\)/);
  assert.match(APP_SOURCE, /analysisProjectBomRow\(item\.source/);
});

test('Substructure details omit post-only geometry while Posts retains it', () => {
  for (const column of ['Post Kind','Foundation Method','Foundation Depth mm','Profile Type','Profile Details','Overall Length mm']) {
    assert.match(APP_SOURCE, new RegExp(`'${column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
  assert.match(APP_SOURCE, /function analysisDetailBomColumns\(page,extraColumns=\[\]\)/);
  assert.match(APP_SOURCE, /if\(page!==\x27substructure\x27\)return columns/);
  assert.match(APP_SOURCE, /columns\.filter\(column=>!postOnlyColumns\.has\(column\)\)/);
  assert.match(APP_SOURCE, /analysisDetailBomColumns\(page,\['Price \/ Unit','Price Currency','Calculated Cost'\]\)/);
});
