'use strict';

(function initializeOverheadService(global) {
  const DEFAULTS = Object.freeze({
    ksi_annual_overhead_eur: 1000000,
    ksi_annual_project_capacity_mwp: 120,
  });
  let cache = {status: 'idle', settings: {...DEFAULTS}, error: null, promise: null};

  class OverheadServiceError extends Error {
    constructor(code, message) { super(message); this.name = 'OverheadServiceError'; this.code = code; }
  }

  const getClient = () => global.LumaSupabase.getClient();
  const isAdmin = () => global.LumaAuth?.isAdmin?.() === true;

  function number(value, fallback) {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeSettings(value) {
    const source = value && typeof value === 'object' ? value : {};
    return {
      ksi_annual_overhead_eur: number(source.ksi_annual_overhead_eur, DEFAULTS.ksi_annual_overhead_eur),
      ksi_annual_project_capacity_mwp: number(source.ksi_annual_project_capacity_mwp, DEFAULTS.ksi_annual_project_capacity_mwp),
    };
  }

  function validateSettings(value) {
    const settings = normalizeSettings(value);
    if (settings.ksi_annual_overhead_eur < 0) throw new OverheadServiceError('invalid_overhead', 'KSI Annual Overhead must be zero or greater.');
    if (settings.ksi_annual_project_capacity_mwp <= 0) throw new OverheadServiceError('invalid_capacity', 'KSI Project Capacity per Year must be greater than zero.');
    return settings;
  }

  function mapError(operation, error) {
    if (error instanceof OverheadServiceError) return error;
    console.error(`Overhead settings ${operation} failed.`, {code: error?.code || 'unknown'});
    if (error?.code === '42501' || error?.code === 'PGRST301') return new OverheadServiceError('forbidden', 'You do not have permission to change Overhead settings.');
    if (error?.code === '23514' || error?.code === '22P02') return new OverheadServiceError('invalid_value', 'The Overhead settings contain an invalid value.');
    return new OverheadServiceError('unavailable', 'Overhead settings are unavailable. Please try again.');
  }

  function snapshot() {
    return {status: cache.status, settings: {...cache.settings}, error: cache.error};
  }

  function invalidate() {
    cache = {status: 'idle', settings: {...DEFAULTS}, error: null, promise: null};
  }

  async function loadSettings({force = false} = {}) {
    if (cache.status === 'loading' && cache.promise) return cache.promise;
    if (!force && cache.status === 'ready') return {...cache.settings};
    cache.status = 'loading';
    cache.error = null;
    cache.promise = getClient().from('commercial_settings')
      .select('setting_value')
      .eq('area', 'overhead')
      .eq('setting_key', 'defaults')
      .eq('active', true)
      .maybeSingle()
      .then(({data, error}) => {
        if (error) throw error;
        if (!data?.setting_value) throw new OverheadServiceError('missing', 'Overhead settings have not been configured.');
        cache.settings = validateSettings(data.setting_value);
        cache.status = 'ready';
        cache.error = null;
        cache.promise = null;
        return {...cache.settings};
      })
      .catch(error => {
        cache.status = 'error';
        cache.error = mapError('load', error);
        cache.promise = null;
        throw cache.error;
      });
    return cache.promise;
  }

  async function saveSettings(values) {
    if (!isAdmin()) throw new OverheadServiceError('forbidden', 'You do not have permission to change Overhead settings.');
    const settings = validateSettings(values);
    try {
      const {data, error} = await getClient().from('commercial_settings').upsert({
        area: 'overhead',
        setting_key: 'defaults',
        setting_value: settings,
        active: true,
      }, {onConflict: 'area,setting_key'}).select('setting_value').single();
      if (error) throw error;
      cache = {status: 'ready', settings: validateSettings(data?.setting_value || settings), error: null, promise: null};
      global.LumaApp?.refreshOverhead?.();
      return {...cache.settings};
    } catch (error) {
      throw mapError('save', error);
    }
  }

  global.LumaOverheadService = Object.freeze({DEFAULTS, OverheadServiceError, normalizeSettings, validateSettings, snapshot, invalidate, loadSettings, saveSettings});
})(window);
