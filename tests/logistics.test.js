'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const CURRENCY_SOURCE = fs.readFileSync(path.join(ROOT, 'currency-data.js'), 'utf8');
const COUNTRY_SOURCE = fs.readFileSync(path.join(ROOT, 'country-data.js'), 'utf8');
const CALCULATOR_SOURCE = fs.readFileSync(path.join(ROOT, 'logistics-calculator.js'), 'utf8');
const SERVICE_SOURCE = fs.readFileSync(path.join(ROOT, 'logistics-service.js'), 'utf8');
const APP_SOURCE = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const ADMIN_SOURCE = fs.readFileSync(path.join(ROOT, 'admin-logistics.js'), 'utf8');
const ADMIN_HOME_SOURCE = fs.readFileSync(path.join(ROOT, 'admin-suppliers.js'), 'utf8');
const PRICE_SERVICE_SOURCE = fs.readFileSync(path.join(ROOT, 'price-list-service.js'), 'utf8');
const INDEX_SOURCE = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const MIGRATION_SOURCE = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '20260829001000_create_logistics_rates.sql'), 'utf8');
const CAPACITY_MIGRATION_SOURCE = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '20260829001200_generalize_logistics_capacities.sql'), 'utf8');
const BLANK_CAPACITY_MIGRATION_SOURCE = fs.readFileSync(path.join(ROOT, 'supabase', 'migrations', '20260829001300_preserve_blank_and_zero_capacities.sql'), 'utf8');

function loadCalculator() {
  const window = {};
  const context = vm.createContext({window, Date, Map, Set, Object, Array, String, Number, Math});
  vm.runInContext(COUNTRY_SOURCE, context, {filename: 'country-data.js'});
  vm.runInContext(CALCULATOR_SOURCE, context, {filename: 'logistics-calculator.js'});
  return {countries: window.LumaCountryData, calculator: window.LumaLogisticsCalculator};
}

test('countries are centralized, canonicalized, and Italy is excluded only from the secondary selector', () => {
  const {countries} = loadCalculator();
  assert.equal(countries.EUROPEAN_COUNTRIES.includes('Italy'), true);
  assert.equal(countries.OTHER_EUROPEAN_COUNTRIES.includes('Italy'), false);
  assert.deepEqual([...countries.LOGISTICS_ORIGINS], ['Italy', 'Egypt', 'Turkey', 'China']);
  assert.equal(countries.canonicalCountry('Türkiye'), 'Turkey');
  assert.equal(countries.resolveProjectDestination({project_country_type: 'Italy'}), 'Italy');
  assert.equal(countries.resolveProjectDestination({project_country_type: 'Other European Country', destination_country: 'Spain'}), 'Spain');
  assert.equal(countries.resolveProjectDestination({project_country_type: 'Other European Country', destination_country: ''}), '');
});

test('container count always rounds upward and zero weight needs zero containers', () => {
  const {calculator} = loadCalculator();
  const base = {containerCapacityKg: 22000, fob_per_container: 0, cif_per_container: 0, customs_clearance_per_container: 0, internal_site_per_container: 0};
  for (const [weight, expected] of [[18000, 1], [22000, 1], [22001, 2], [44000, 2], [44001, 3], [0, 0]]) {
    assert.equal(calculator.calculate({...base, totalWeightKg: weight}).containerCount, expected, `${weight} kg`);
  }
});

test('general container helper supports weight and quantity without inventing capacity', () => {
  const {calculator} = loadCalculator();
  assert.equal(calculator.calculateContainerCount({capacityType:'weight', shipmentWeightKg:44001, capacityValue:22000}).containerCount, 3);
  assert.equal(calculator.calculateContainerCount({capacityType:'quantity', shipmentQuantity:61, capacityValue:60}).containerCount, 2);
  assert.equal(calculator.calculateContainerCount({capacityType:'quantity', shipmentQuantity:101, capacityValue:100}).containerCount, 2);
  assert.equal(calculator.calculateContainerCount({capacityType:'quantity', shipmentQuantity:0, capacityValue:100}).containerCount, 0);
  assert.equal(calculator.calculateContainerCount({capacityType:'quantity', shipmentQuantity:10, capacityValue:''}).complete, false);
  assert.equal(calculator.calculateContainerCount({capacityType:'quantity', shipmentQuantity:10, capacityValue:''}).missingFields.includes('capacityValue'), true);
  assert.equal(calculator.calculateContainerCount({capacityType:'quantity', shipmentQuantity:10, capacityValue:0}).missingFields.includes('capacityValuePositive'), true);
  assert.deepEqual({...calculator.capacitySpec('Steel Structure')}, {type:'weight', unit:'kg', basisLabel:'Weight', valueLabel:'Container Capacity'});
  assert.equal(calculator.capacitySpec('Slew Drive').type, 'quantity');
  assert.equal(calculator.capacitySpec('Bearing').unit, 'pcs');
});

test('external totals and the selected Site or Warehouse internal rate are calculated separately', () => {
  const {calculator} = loadCalculator();
  const values = {totalWeightKg: 22001, containerCapacityKg: 22000, fob_per_container: 10, cif_per_container: 20, customs_clearance_per_container: 5, internal_site_per_container: 7, internal_warehouse_per_container: 11};
  const site = calculator.calculate({...values, deliveryPoint: 'Site'});
  const warehouse = calculator.calculate({...values, deliveryPoint: 'Warehouse'});
  assert.equal(site.externalLogisticsTotal, 70);
  assert.equal(site.internalLogisticsTotal, 14);
  assert.equal(site.totalLogisticsCost, 84);
  assert.equal(warehouse.externalLogisticsTotal, 70);
  assert.equal(warehouse.internalLogisticsTotal, 22);
  assert.equal(warehouse.totalLogisticsCost, 92);
});

test('blank costs are incomplete while intentional zero costs are complete', () => {
  const {calculator} = loadCalculator();
  const base = {totalWeightKg: 1000, containerCapacityKg: 22000, fob_per_container: 0, cif_per_container: 0, customs_clearance_per_container: 0, internal_site_per_container: 0};
  assert.equal(calculator.calculate(base).complete, true);
  const missing = calculator.calculate({...base, cif_per_container: ''});
  assert.equal(missing.complete, false);
  assert.equal(missing.missingFields.includes('cif_per_container'), true);
});

test('route selection is canonical, date-aware, and never invents a missing route', () => {
  const {calculator} = loadCalculator();
  const rate = {id: 'rate-1', active: true, origin_country: 'Turkey', destination_country: 'Spain', cargo_group: 'Steel Structure', valid_from: '2026-01-01', valid_until: '2026-12-31'};
  assert.equal(calculator.findRate([rate], {originCountry: 'Türkiye', destinationCountry: 'Spain', cargoGroup: 'Steel Structure', date: new Date('2026-08-29T00:00:00Z')}).rate.id, 'rate-1');
  assert.equal(calculator.findRate([rate], {originCountry: 'China', destinationCountry: 'Spain', cargoGroup: 'Steel Structure', date: new Date('2026-08-29T00:00:00Z')}).status, 'missing');
});

test('normal users cannot start Logistics writes in the service', async () => {
  let called = false;
  const currencyWindow = {};
  vm.runInContext(CURRENCY_SOURCE, vm.createContext({window:currencyWindow}), {filename: 'currency-data.js'});
  const window = {
    LumaAuth: {isAdmin: () => false},
    LumaSupabase: {getClient: () => ({from() { called = true; }})},
    LumaCountryData: loadCalculator().countries,
    LumaCurrencyData: currencyWindow.LumaCurrencyData,
  };
  vm.runInContext(SERVICE_SOURCE, vm.createContext({window, console: {error() {}}}), {filename: 'logistics-service.js'});
  await assert.rejects(window.LumaLogisticsService.saveRate({values: {}}), error => error.code === 'forbidden');
  assert.equal(called, false);
});

test('migration provides versioned rates, audit identity, active-route uniqueness, and RLS', () => {
  const fragments = [
    'create table public.logistics_rates',
    'container_capacity_kg numeric not null',
    'fob_per_container numeric',
    'internal_site_per_container numeric',
    'internal_warehouse_per_container numeric',
    'unique (origin_country, destination_country, cargo_group, revision)',
    'create unique index logistics_rates_one_active_route',
    'new.created_by := (select auth.uid())',
    'new.updated_by := (select auth.uid())',
    'alter table public.logistics_rates enable row level security',
    'authenticated users can read logistics rates',
    'admins can create logistics rates',
    'admins can update logistics rates',
    'admins can delete logistics rates',
    'with check ((select private.is_admin()))',
  ];
  for (const fragment of fragments) assert.equal(MIGRATION_SOURCE.toLowerCase().includes(fragment.toLowerCase()), true, fragment);
  assert.doesNotMatch(MIGRATION_SOURCE, /insert\s+into\s+public\.logistics_rates/i);
});

test('capacity migration preserves Steel Structure data and constrains each cargo basis', () => {
  for (const fragment of ['add column capacity_type text','add column capacity_value numeric','add column capacity_unit text',"set capacity_type = 'weight'",'capacity_value = container_capacity_kg',"cargo_group in ('Steel Structure', 'Slew Drive', 'Bearing')", "capacity_type = 'quantity'", "capacity_unit = 'pcs'"]) {
    assert.equal(CAPACITY_MIGRATION_SOURCE.includes(fragment), true, fragment);
  }
  assert.doesNotMatch(CAPACITY_MIGRATION_SOURCE, /insert\s+into\s+public\.logistics_rates/i);
  assert.match(BLANK_CAPACITY_MIGRATION_SOURCE, /alter column capacity_value drop not null/);
  assert.match(BLANK_CAPACITY_MIGRATION_SOURCE, /capacity_value is null or capacity_value >= 0/);
});

test('UI integration keeps Logistics modular and derives structural, Slew Drive, and Bearing shipments', () => {
  assert.match(INDEX_SOURCE, /src="country-data\.js"[\s\S]*src="logistics-calculator\.js"[\s\S]*src="logistics-service\.js"/);
  assert.match(ADMIN_HOME_SOURCE, /data-admin-page="logistics"/);
  assert.match(ADMIN_SOURCE, /Add Logistics Rate/);
  assert.match(APP_SOURCE, /page:'slew_drive',cargoGroup:'Slew Drive'/);
  assert.match(APP_SOURCE, /page:'bearing',cargoGroup:'Bearing'/);
  assert.match(APP_SOURCE, /quantity\*weight/);
  assert.match(APP_SOURCE, /logisticsQuantityData/);
  assert.match(APP_SOURCE, /Missing Part Master Weight for TAG\(s\)/);
  assert.match(APP_SOURCE, /No active logistics rate configured for/);
  assert.match(APP_SOURCE, /project_country_type==='Other European Country'\?selectRow\('European Country'/);
  assert.match(APP_SOURCE, /selectRow\('Delivery Point','delivery_point'/);
  assert.match(PRICE_SERVICE_SOURCE, /supplier_name, country, active/);
  assert.doesNotMatch(APP_SOURCE, /supabase\.from\(['"]logistics_rates/);
});
