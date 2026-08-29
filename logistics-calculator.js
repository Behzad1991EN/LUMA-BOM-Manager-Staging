'use strict';

(function initializeLogisticsCalculator(global) {
  const CARGO_CAPACITIES = Object.freeze({
    'Steel Structure': Object.freeze({type:'weight', unit:'kg', basisLabel:'Weight', valueLabel:'Container Capacity'}),
    'Slew Drive': Object.freeze({type:'quantity', unit:'pcs', basisLabel:'Quantity', valueLabel:'Slew Drives per Container'}),
    'Bearing': Object.freeze({type:'quantity', unit:'pcs', basisLabel:'Quantity', valueLabel:'Bearings per Container'}),
  });
  const CARGO_GROUPS = Object.freeze(Object.keys(CARGO_CAPACITIES));
  const REQUIRED_EXTERNAL_FIELDS = Object.freeze([
    'fob_per_container', 'cif_per_container', 'customs_clearance_per_container',
  ]);

  function configuredNumber(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function internalField(deliveryPoint) {
    return deliveryPoint === 'Warehouse' ? 'internal_warehouse_per_container' : 'internal_site_per_container';
  }

  function capacitySpec(cargoGroup) {
    return CARGO_CAPACITIES[String(cargoGroup || '')] || null;
  }

  function calculateContainerCount({capacityType, shipmentWeightKg, shipmentQuantity, capacityValue} = {}) {
    const type = capacityType === 'quantity' ? 'quantity' : capacityType === 'weight' ? 'weight' : '';
    const capacity = configuredNumber(capacityValue);
    const amount = configuredNumber(type === 'weight' ? shipmentWeightKg : type === 'quantity' ? shipmentQuantity : null);
    const missingFields = [];
    if (!type) missingFields.push('capacityType');
    if (capacity === null) missingFields.push('capacityValue');
    else if (capacity === 0) missingFields.push('capacityValuePositive');
    if (amount === null) missingFields.push(type === 'quantity' ? 'shipmentQuantity' : 'shipmentWeightKg');
    if (missingFields.length) return {complete:false, capacityType:type, capacityValue:capacity, shipmentAmount:amount, missingFields};
    return {complete:true, capacityType:type, capacityValue:capacity, shipmentAmount:amount, containerCount:amount === 0 ? 0 : Math.ceil(amount / capacity), missingFields:[]};
  }

  function calculate(values) {
    const capacityType = values?.capacityType || (values?.containerCapacityKg !== undefined ? 'weight' : '');
    const capacityValue = values?.capacityValue ?? values?.containerCapacityKg;
    const containerResult = calculateContainerCount({
      capacityType,
      shipmentWeightKg:values?.shipmentWeightKg ?? values?.totalWeightKg,
      shipmentQuantity:values?.shipmentQuantity,
      capacityValue,
    });
    const deliveryPoint = values?.deliveryPoint === 'Warehouse' ? 'Warehouse' : 'Site';
    const selectedInternalField = internalField(deliveryPoint);
    const costs = Object.fromEntries([...REQUIRED_EXTERNAL_FIELDS, selectedInternalField].map(field => [field, configuredNumber(values?.[field])]));
    const missingFields = [];
    missingFields.push(...containerResult.missingFields);
    for (const [field, value] of Object.entries(costs)) if (value === null) missingFields.push(field);
    if (missingFields.length) return {complete:false, deliveryPoint, missingFields};
    const containerCount = containerResult.containerCount;
    const fobTotal = containerCount * costs.fob_per_container;
    const cifTotal = containerCount * costs.cif_per_container;
    const customsClearanceTotal = containerCount * costs.customs_clearance_per_container;
    const externalLogisticsTotal = fobTotal + cifTotal + customsClearanceTotal;
    const internalCostPerContainer = costs[selectedInternalField];
    const internalLogisticsTotal = containerCount * internalCostPerContainer;
    return {
      complete:true, deliveryPoint, capacityType:containerResult.capacityType,
      capacityValue:containerResult.capacityValue, shipmentAmount:containerResult.shipmentAmount,
      totalWeightKg:containerResult.capacityType === 'weight' ? containerResult.shipmentAmount : null,
      shipmentQuantity:containerResult.capacityType === 'quantity' ? containerResult.shipmentAmount : null,
      containerCapacityKg:containerResult.capacityType === 'weight' ? containerResult.capacityValue : null,
      containerCount, fobPerContainer:costs.fob_per_container, fobTotal,
      cifPerContainer:costs.cif_per_container, cifTotal,
      customsClearancePerContainer:costs.customs_clearance_per_container,
      customsClearanceTotal, externalLogisticsTotal, internalCostPerContainer,
      internalLogisticsTotal, totalLogisticsCost:externalLogisticsTotal + internalLogisticsTotal,
      missingFields:[],
    };
  }

  function rateIsCurrent(rate, date = new Date()) {
    const day = date.toISOString().slice(0, 10);
    return rate?.active === true && (!rate.valid_from || rate.valid_from <= day) && (!rate.valid_until || rate.valid_until >= day);
  }

  function findRate(rates, {originCountry, destinationCountry, cargoGroup, date = new Date()}) {
    const countries = global.LumaCountryData;
    const origin = countries.canonicalLogisticsOrigin(originCountry);
    const destination = countries.canonicalEuropeanCountry(destinationCountry);
    const matches = (Array.isArray(rates) ? rates : []).filter(rate =>
      rateIsCurrent(rate, date) &&
      countries.canonicalLogisticsOrigin(rate.origin_country) === origin &&
      countries.canonicalEuropeanCountry(rate.destination_country) === destination &&
      String(rate.cargo_group || '') === String(cargoGroup || '')
    );
    return {status:matches.length === 1 ? 'found' : matches.length > 1 ? 'conflict' : 'missing', rate:matches.length === 1 ? matches[0] : null, matches};
  }

  global.LumaLogisticsCalculator = Object.freeze({CARGO_CAPACITIES, CARGO_GROUPS, capacitySpec, calculateContainerCount, calculate, findRate, rateIsCurrent});
})(window);
