'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const seed = require('../tools/generate-part-master-seed.js');

test('legacy Part Master and generated migration seed have exact record and TAG parity', () => {
  const records = seed.loadLegacyRecords();
  const migration = read('supabase/migrations/20260827000500_create_part_master.sql');
  const result = seed.verifyParity(records, migration);
  assert.equal(result.recordCount, 81);
  assert.equal(result.assignedTagCount, 78);
  assert.equal(result.tags.size, 78);
  assert.equal(records.filter(record => !record.TAG).length, 3);
  assert.equal(records.filter(record => record.TAG === 'k001152').length, 1);
  assert.equal(records.filter(record => record.TAG === 'k060356').length, 1);
});

test('runtime does not import the legacy archive or retain a hard-coded fallback', () => {
  const html = read('index.html');
  const app = read('app.js');
  const data = read('data.js');
  assert.doesNotMatch(html, /legacy\/part-master-hardcoded-backup\.js/);
  assert.doesNotMatch(app, /INTERNAL_PART_MASTER|loadInternalPartMaster|Bundled Read-only Fallback/);
  assert.doesNotMatch(data, /INTERNAL_PART_MASTER_RAW/);
  assert.match(data, /PART_MASTER_COLUMNS/);
  assert.match(app, /Central Part Master unavailable\. BOM generation has been disabled/);
});

test('Part Master migration provides schema, known post attributes, audit, and RLS contracts', () => {
  const migration = read('supabase/migrations/20260827000500_create_part_master.sql');
  assert.match(migration, /create table public\.part_master/);
  assert.match(migration, /profile_details text/);
  assert.match(migration, /Authenticated users can read Part Master records/);
  assert.match(migration, /for select to authenticated using \(true\)/);
  assert.match(migration, /Admins can create Part Master records/);
  assert.match(migration, /Admins can update Part Master records/);
  assert.match(migration, /Admins can delete Part Master records/);
  assert.match(migration, /new\.updated_by := \(select auth\.uid\(\)\)/);
  assert.match(migration, /where tag in \('k001120', 'k060356'\)/);
});

test('Part Master service caches one database load and resolves exact active post configurations', async () => {
  const rows = [
    {id:'1',part:'Main Post',tag:'k001152',description:'Main',category:'Steel Structure',active:true,post_kind:'Main Post',foundation_method:'Ramming',foundation_depth_mm:2000,profile_type:'HEA 140'},
    {id:'2',part:'Bearing Post',tag:'k001120',description:'Bearing',category:'Steel Structure',active:true,post_kind:'Bearing Post',foundation_method:'Ramming',foundation_depth_mm:2000,profile_type:'C'},
    {id:'3',part:'Old',tag:'old',description:'Old',category:'Steel Structure',active:false},
  ];
  let requests = 0;
  const query = {select(){requests += 1; return this;}, order(){return this;}, then(resolve){resolve({data:rows,error:null});}};
  const window = {LumaSupabase:{getClient:()=>({from:()=>query})}, LumaAuth:{isAdmin:()=>false}};
  vm.runInContext(read('part-master-service.js'), vm.createContext({window,console,Object,Array,String,Number,Map,Set,Error}));
  await window.LumaPartMasterService.loadPartMaster();
  await window.LumaPartMasterService.loadPartMaster();
  assert.equal(requests, 1);
  assert.equal(window.LumaPartMasterService.getAllParts().length, 3);
  assert.equal(window.LumaPartMasterService.getActiveParts().length, 2);
  assert.equal(window.LumaPartMasterService.getPartByTag('K001152').Part, 'Main Post');
  const match = window.LumaPartMasterService.findPostConfiguration({postKind:'Main Post',foundationMethod:'Ramming',foundationDepthMm:2000,profileType:'HEA 140'});
  assert.equal(match.status, 'found');
  assert.equal(match.part.TAG, 'k001152');
});

test('existing BOM quantities are preserved while known post TAGs resolve from data attributes', () => {
  const context = {globalThis:{}};
  vm.createContext(context);
  vm.runInContext(read('legacy/part-master-hardcoded-backup.js'), context);
  vm.runInContext(read('post-configuration-service.js'), context);
  vm.runInContext(read('engine.js'), context);
  const engine = context.globalThis.LumaEngine;
  const parts = engine.normalizePartMasterData(context.globalThis.INTERNAL_PART_MASTER_COLUMNS, context.globalThis.INTERNAL_PART_MASTER_RAW).rows;
  const project = {inputs:{...engine.DEFAULT_INPUTS}, tracker_quantities:engine.defaultTrackerQuantities(), bearing_rules:{}, manual_parts:engine.defaultManualParts(), soltrk_version:'2.0', bom_overrides:{}, equipment_quantity_overrides:{}};
  project.tracker_quantities['14'] = 1;
  const calculation = engine.calculateProject(project, parts, context.globalThis.INTERNAL_PART_MASTER_COLUMNS);
  assert.deepEqual(Array.from(calculation.engineeringErrors), []);
  assert.equal(calculation.bom.rows.find(row => row.TAG === 'k001152')['Total Qty'], 1);
  assert.equal(calculation.bom.rows.find(row => row.TAG === 'k001120')['Total Qty'], 2);
  project.inputs.foundation_depth_mm = '2300';
  const deeper = engine.calculateProject(project, parts, context.globalThis.INTERNAL_PART_MASTER_COLUMNS);
  assert.equal(deeper.bom.rows.find(row => row.TAG === 'k050376')['Total Qty'], 1);
  assert.equal(deeper.bom.rows.find(row => row.TAG === 'k060356')['Total Qty'], 2);
});

test('Part Master UI is rendered only for admins and supports deactivate/reactivate', () => {
  const app = read('app.js');
  const admin = read('admin-part-master.js');
  assert.match(app, /isAdmin\?\.\(\)\?\[\.\.\.TABS,PART_MASTER_ADMIN_TAB,ADMINISTRATION_TAB\]:TABS/);
  assert.match(admin, /Reactivate Selected/);
  assert.match(admin, /setPartActive/);
  assert.doesNotMatch(admin, /\.delete\(/);
});
