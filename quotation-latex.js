'use strict';

(function initializeQuotationLatex(global) {
  const registry = global.LumaQuotationFields;
  if (!registry) throw new Error('Quotation field definitions must load before quotation LaTeX generation.');

  const LATEX_ESCAPES = Object.freeze({
    '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
    '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
  });

  function escapeLatex(value) {
    return Array.from(String(value ?? ''), character => LATEX_ESCAPES[character] || character).join('');
  }

  function fixed(value, digits = 2) {
    if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) return '';
    return Number(value).toFixed(digits);
  }

  function european(value, digits = 2) {
    const raw = fixed(value, digits);
    if (!raw) return '';
    const [integer, decimals] = raw.split('.');
    return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${digits ? `,${decimals}` : ''}`;
  }

  function buildVariables(model) {
    const values = model?.fields || {};
    return registry.FIELDS.map(definition => {
      const value = values[definition.id] ?? definition.exampleValue;
      return `\\newcommand{\\${registry.commandName(definition.id)}}{${escapeLatex(value)}}`;
    }).join('\n') + '\n';
  }

  const decimal = value => Number(value).toFixed(2).replace(/\.00$/, '');
  const weight = definition => definition.text.fontWeight === 'bold' ? '\\bfseries' : '\\mdseries';
  const content = definition => `${escapeLatex(definition.text.prefix)}\\${registry.commandName(definition.id)}{}${escapeLatex(definition.text.suffix)}`;

  function approximateWidthMm(definition, value, fontSizePt = definition.text.fontSizePt) {
    return Array.from(value).reduce((sum, character) => sum + (character === ' ' ? 0.22 : 0.42), 0) * fontSizePt * 25.4 / 72;
  }

  function fittedFontSize(definition, value) {
    const normalWidth = approximateWidthMm(definition, value);
    if (normalWidth <= definition.text.widthMm) return definition.text.fontSizePt;
    return Math.max(definition.text.minFontSizePt, definition.text.fontSizePt * definition.text.widthMm / normalWidth);
  }

  function pageOverlay(page, model) {
    const pageNames = {1:'One',4:'Four',5:'Five',6:'Six',11:'Eleven'};
    const commands = registry.FIELDS.filter(definition => definition.page === page).map(definition => {
      const e = definition.erase;
      const t = definition.text;
      const fieldValue = `${t.prefix}${model?.fields?.[definition.id] ?? definition.exampleValue}${t.suffix}`;
      const fittedSize = fittedFontSize(definition, fieldValue);
      const background = e.background === 'peach' ? 'QuotationPeach' : 'QuotationWhite';
      return [
        `    \\QErase{${decimal(e.xMm)}}{${decimal(e.yMm)}}{${decimal(e.widthMm)}}{${decimal(e.heightMm)}}{${background}}`,
        `    \\QText{${t.anchor}}{${definition.id}}{${decimal(t.xMm)}}{${decimal(t.baselineYMm)}}{${decimal(t.widthMm)}}{${decimal(fittedSize)}}{${decimal(t.minFontSizePt)}}{${t.color}}{${weight(definition)} ${content(definition)}}`,
      ].join('\n');
    });
    return `\\renewcommand{\\QuotationPage${pageNames[page]}Overlay}{%\n  \\begin{tikzpicture}[remember picture,overlay]\n${commands.join('\n')}\n  \\end{tikzpicture}%\n}`;
  }

  function buildLayout(baseLayout, model) {
    const debug = registry.LAYOUT_DEBUG ? '\\QuotationLayoutDebugtrue' : '\\QuotationLayoutDebugfalse';
    const overlays = [1,4,5,6,11].map(page => pageOverlay(page, model)).join('\n\n');
    return `${String(baseLayout || '').trim()}\n${debug}\n\n${overlays}\n`;
  }

  function overflowWarnings(model) {
    const values = model?.fields || {};
    return registry.FIELDS.flatMap(definition => {
      const value = `${definition.text.prefix}${values[definition.id] ?? definition.exampleValue}${definition.text.suffix}`;
      const minimumWidthMm = approximateWidthMm(definition, value, definition.text.minFontSizePt);
      return minimumWidthMm > definition.text.widthMm
        ? [`${definition.label} is longer than its safe PDF field width and may be clipped. Shorten the value.`]
        : [];
    });
  }

  global.LumaQuotationLatex = Object.freeze({escapeLatex, buildVariables, buildLayout, overflowWarnings, formatEuropeanNumber:european});
})(window);
