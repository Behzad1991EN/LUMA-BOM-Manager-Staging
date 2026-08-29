'use strict';

(function initializeCommercialCostCalculator(global) {
  const VAT_RATES = Object.freeze([0, 0.10, 0.22]);

  function normalizeVatRate(value) {
    const rate = Number(value);
    return VAT_RATES.includes(rate) ? rate : 0;
  }

  function numericTotals(source) {
    const totals = {};
    for (const [currency, value] of Object.entries(source || {})) {
      const amount = Number(value);
      if (currency && Number.isFinite(amount)) totals[currency] = amount;
    }
    return totals;
  }

  function amountFor(totals, currency) {
    const amount = Number(totals?.[currency]);
    return Number.isFinite(amount) ? amount : 0;
  }

  function buildResult({baseCosts, externalLogistics, internalLogistics, vatRate, baseGapCount = 0, logisticsComplete = false} = {}) {
    const normalizedBase = numericTotals(baseCosts);
    const normalizedExternal = numericTotals(externalLogistics);
    const normalizedInternal = numericTotals(internalLogistics);
    const rate = normalizeVatRate(vatRate);
    const currencies = [...new Set([
      ...Object.keys(normalizedBase),
      ...Object.keys(normalizedExternal),
      ...Object.keys(normalizedInternal),
    ])].sort((a, b) => a.localeCompare(b));
    const byCurrency = {};

    for (const currency of currencies) {
      const baseCommercialCost = amountFor(normalizedBase, currency);
      const externalLogisticsTotal = amountFor(normalizedExternal, currency);
      const internalLogisticsTotal = amountFor(normalizedInternal, currency);
      const logisticsTotal = externalLogisticsTotal + internalLogisticsTotal;
      const subtotalBeforeVat = baseCommercialCost + logisticsTotal;
      const vatAmount = subtotalBeforeVat * rate;
      byCurrency[currency] = Object.freeze({
        currency,
        baseCommercialCost,
        externalLogisticsTotal,
        internalLogisticsTotal,
        logisticsTotal,
        subtotalBeforeVat,
        vatRate: rate,
        vatAmount,
        finalCostIncludingVat: subtotalBeforeVat + vatAmount,
      });
    }

    const currencyMismatch = currencies.length > 1;
    const single = currencies.length === 1 ? byCurrency[currencies[0]] : null;
    const warnings = [];
    if (currencyMismatch) warnings.push('Commercial and Logistics amounts use multiple currencies. No combined final total has been produced because no authoritative FX rate is configured.');
    if (Number(baseGapCount) > 0) warnings.push('Base commercial pricing is incomplete. Priced-item subtotals are shown, but the final cost is incomplete.');
    if (!logisticsComplete) warnings.push('Logistics is incomplete. Configure every required route, capacity, and per-container rate before relying on the final cost.');

    return Object.freeze({
      baseCosts: Object.freeze(normalizedBase),
      logistics: Object.freeze({
        external: Object.freeze(normalizedExternal),
        internal: Object.freeze(normalizedInternal),
      }),
      currencies: Object.freeze(currencies),
      byCurrency: Object.freeze(byCurrency),
      currencyMismatch,
      subtotalBeforeVat: single?.subtotalBeforeVat ?? null,
      vat: Object.freeze({rate, amount: single?.vatAmount ?? null}),
      finalCostIncludingVat: single?.finalCostIncludingVat ?? null,
      currency: single?.currency || '',
      complete: Boolean(single && Number(baseGapCount) === 0 && logisticsComplete),
      warnings: Object.freeze(warnings),
    });
  }

  global.LumaCommercialCostCalculator = Object.freeze({VAT_RATES, normalizeVatRate, buildResult});
})(window);
