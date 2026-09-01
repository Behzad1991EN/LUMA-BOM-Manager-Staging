'use strict';

(function initializeCommercialCategories(global) {
  const SECTION_CATEGORIES = Object.freeze({
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

  const normalizeText = value => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const CATEGORY_ALIASES = Object.freeze({
    posts: 'posts',
    post: 'posts',
    substructure: 'substructure',
    steelstructure: 'substructure',
    bearing: 'bearing',
    bearings: 'bearing',
    slewdrive: 'slew_drive',
    pvmodule: 'pv_module',
    limitswitch: 'limit_switch',
    soltrk: 'soltrk',
    junctionbox: 'junction_box',
    fastener: 'fasteners',
    fasteners: 'fasteners',
    electrical: 'electrical',
  });
  // Compatibility while the category-correction migration is pending in an
  // environment. The same values are stored authoritatively by the migration.
  const CATEGORY_OVERRIDES_BY_TAG = Object.freeze({
    k001479: 'substructure',
    k001576: 'substructure',
  });

  function normalizeCategoryKey(value) {
    const normalized = normalizeText(value);
    if (normalized.startsWith('fastener')) return 'fasteners';
    return CATEGORY_ALIASES[normalized] || normalized;
  }

  function recordValue(record, appKey, serviceKey) {
    return record?.[appKey] ?? record?.[serviceKey] ?? '';
  }

  function leafKeyForPart(record) {
    const category = normalizeText(recordValue(record, 'Category', 'category'));
    const postKind = normalizeText(recordValue(record, 'Post Kind', 'postKind'));
    const tag = String(recordValue(record, 'TAG', 'tag')).trim().toLowerCase();
    const identity = normalizeText(`${recordValue(record, 'Part Name', 'part')} ${recordValue(record, 'Part', 'part')} ${recordValue(record, 'Description', 'description')}`);

    if (CATEGORY_OVERRIDES_BY_TAG[tag]) return CATEGORY_OVERRIDES_BY_TAG[tag];
    if (category.startsWith('fastener')) return 'fasteners';
    if (postKind || identity.includes('mainpost') || identity.includes('bearingpost')) return 'posts';
    // Steel Structure is the authoritative Part Master category. Everything in
    // it except configured Posts belongs to the commercial Substructure list,
    // including holders, adapters, seats, triggers, and connection pieces.
    if (category.includes('steelstructure')) return 'substructure';
    if (category.startsWith('pvmodule') || identity === 'pvmodule') return 'pv_module';
    if (identity.includes('limitswitch')) return 'limit_switch';
    if (identity.includes('soltrk')) return 'soltrk';
    if (identity.includes('junctionbox') || identity.includes('jbox')) return 'junction_box';
    if (category.includes('bearing') || identity.startsWith('bearing')) return 'bearing';
    if (category.includes('slewdrive') || identity.includes('slewdrive')) return 'slew_drive';
    return normalizeCategoryKey(category);
  }

  function partMatchesCategory(record, category) {
    const requested = normalizeCategoryKey(category);
    if (!requested) return false;
    const stored = normalizeCategoryKey(recordValue(record, 'Category', 'category'));
    if (requested === 'electrical') return stored === 'electrical';
    return leafKeyForPart(record) === requested;
  }

  function categoryLabel(value) {
    const key = normalizeCategoryKey(value);
    return SECTION_CATEGORIES[key] || (key === 'electrical' ? 'Electrical' : String(value ?? '').trim());
  }

  global.LumaCommercialCategories = Object.freeze({
    SECTION_CATEGORIES,
    normalizeCategoryKey,
    categoryLabel,
    leafKeyForPart,
    partMatchesCategory,
  });
})(window);
