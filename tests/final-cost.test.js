'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'commercial-cost-calculator.js'), 'utf8');
const APP_SOURCE = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const INDEX_SOURCE = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function calculator() {
  const window = {};
  vm.runInContext(SOURCE, vm.createContext({window, Object, Number, Set, Array}), {filename:'commercial-cost-calculator.js'});
  return window.LumaCommercialCostCalculator;
}

test('VAT is applied exactly once after base and logistics costs', () => {
  const calc = calculator();
  for (const [rate, expected] of [[0, 100000], [0.10, 110000], [0.22, 122000]]) {
    const result = calc.buildResult({baseCosts:{EUR:70000}, externalLogistics:{EUR:20000}, internalLogistics:{EUR:10000}, vatRate:rate, baseGapCount:0, logisticsComplete:true});
    assert.equal(result.subtotalBeforeVat, 100000);
    assert.equal(result.vat.amount, 100000 * rate);
    assert.equal(result.finalCostIncludingVat, expected);
  }
});

test('unsupported VAT safely defaults to zero', () => {
  const calc = calculator();
  assert.equal(calc.normalizeVatRate(0.15), 0);
  assert.deepEqual([...calc.VAT_RATES], [0, 0.1, 0.22]);
});

test('mixed currencies are never combined into a misleading final number', () => {
  const result = calculator().buildResult({baseCosts:{EUR:100}, externalLogistics:{USD:20}, internalLogistics:{USD:5}, vatRate:0.1, logisticsComplete:true});
  assert.equal(result.currencyMismatch, true);
  assert.equal(result.finalCostIncludingVat, null);
  assert.equal(result.byCurrency.EUR.finalCostIncludingVat, 110);
  assert.equal(result.byCurrency.USD.finalCostIncludingVat, 27.5);
  assert.match(result.warnings[0], /No combined final total/);
});

test('VAT persists in workspace state and detailed final cost is admin-gated', () => {
  assert.match(APP_SOURCE, /vat_rate:normalizeVatRate\(p\.vat_rate\)/);
  assert.match(APP_SOURCE, /p\.vat_rate=normalizeVatRate\(raw\?\.vat_rate\)/);
  assert.match(APP_SOURCE, /LumaAuth\?\.isAdmin\?\.\(\)/);
  assert.match(APP_SOURCE, /Final Cost Calculation/);
  assert.match(INDEX_SOURCE, /src="commercial-cost-calculator\.js"/);
  assert.match(APP_SOURCE, /id="analysisVatRate"/);
  assert.match(APP_SOURCE, /All calculated prices \+ VAT = Final Price/);
  assert.doesNotMatch(APP_SOURCE, /id="projectVatRate"/);
});
