'use strict';

(function initializePostConfiguration(global) {
  const text = value => String(value ?? '').trim();
  const normalized = value => text(value).toLowerCase().replace(/\s+/g, ' ');

  function activePostParts(parts, postKind='') {
    return (parts || []).filter(part => part?.Active !== false
      && text(part?.TAG)
      && text(part?.['Post Kind'])
      && (!postKind || normalized(part['Post Kind']) === normalized(postKind)));
  }

  function profileOptions(parts, postKind) {
    return [...new Set(activePostParts(parts, postKind).map(part => text(part['Profile Type'])).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, {numeric:true}));
  }

  function depthOptions(parts) {
    return [...new Set(activePostParts(parts).map(part => Number(part['Foundation Depth mm'])).filter(Number.isFinite))]
      .sort((a, b) => a - b).map(String);
  }

  function resolveResult(parts, {postKind, foundationMethod, foundationDepthMm, profileType}) {
    const matches = activePostParts(parts, postKind).filter(part =>
      normalized(part['Foundation Method']) === normalized(foundationMethod)
      && Number(part['Foundation Depth mm']) === Number(foundationDepthMm)
      && normalized(part['Profile Type']) === normalized(profileType));
    if (!matches.length) return {status:'missing', part:null, matches:[]};
    if (matches.length > 1) return {status:'ambiguous', part:null, matches};
    return {status:'found', part:matches[0], matches};
  }

  function resolve(parts, criteria) { return resolveResult(parts, criteria).part; }

  function selection(project, postKind) {
    const inputs = project?.inputs || {};
    return {
      postKind,
      foundationMethod:inputs.foundation_method,
      foundationDepthMm:inputs.foundation_depth_mm,
      profileType:postKind === 'Main Post' ? inputs.main_post_profile : inputs.bearing_post_profile,
    };
  }

  function missingMessage(value, postKind) {
    const item = value?.postKind ? value : selection(value, postKind);
    return `No ${item.postKind || postKind || 'post'} is configured for ${item.foundationMethod || 'the selected foundation method'}, ${item.foundationDepthMm || 'the selected depth'} mm, and ${item.profileType || 'the selected profile'}.`;
  }

  function ambiguityMessage() {
    return 'More than one active Part Master record matches this post configuration.';
  }

  function validate(project, parts) {
    const matches = {}, errors = [];
    for (const postKind of ['Main Post', 'Bearing Post']) {
      const key = postKind === 'Main Post' ? 'main' : 'bearing';
      const item = selection(project, postKind);
      const result = resolveResult(parts, item);
      matches[key] = result.part;
      if (result.status === 'missing') errors.push(missingMessage(item));
      if (result.status === 'ambiguous') errors.push(ambiguityMessage());
    }
    return {valid:errors.length === 0, errors, matches};
  }

  global.LumaPostConfiguration = Object.freeze({
    profileOptions, depthOptions, resolveResult, resolve, selection,
    missingMessage, ambiguityMessage, validate,
  });
})(globalThis);
