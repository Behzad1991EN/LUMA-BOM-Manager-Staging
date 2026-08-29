'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'commercial-categories.js'), 'utf8');

function loadCategories() {
  const window = {};
  vm.runInContext(source, vm.createContext({window, Object, String}), {filename:'commercial-categories.js'});
  return window.LumaCommercialCategories;
}

test('legacy category names normalize centrally without a TAG mapping', () => {
  const categories = loadCategories();
  assert.equal(categories.normalizeCategoryKey('Steel Structure'), 'substructure');
  assert.equal(categories.normalizeCategoryKey('Bearings'), 'bearing');
  assert.equal(categories.normalizeCategoryKey('Fasteners / Limit Switch'), 'fasteners');
  assert.doesNotMatch(source, /k\d{6}/i);
});

test('Part Master fields resolve the intended commercial leaf categories', () => {
  const categories = loadCategories();
  const fixtures = [
    [{Category:'Steel Structure', Part:'Main Post', 'Post Kind':'Main Post'}, 'posts'],
    [{Category:'Steel Structure', Part:'Main Tube A'}, 'substructure'],
    [{Category:'Steel Structure', Part:'Limit Switch Holder'}, 'limit_switch'],
    [{Category:'Electrical', Part:'SOLTRK 3.0'}, 'soltrk'],
    [{Category:'Bearings', Part:'Bearing'}, 'bearing'],
    [{Category:'Fasteners / Junction Box', Part:'Bolt'}, 'fasteners'],
  ];
  for (const [record, expected] of fixtures) assert.equal(categories.leafKeyForPart(record), expected);
  assert.equal(categories.partMatchesCategory(fixtures[0][0], 'Posts'), true);
  assert.equal(categories.partMatchesCategory(fixtures[0][0], 'Substructure'), false);
  assert.equal(categories.partMatchesCategory({category:'Electrical', part:'Cable Gland'}, 'Electrical'), true);
});
