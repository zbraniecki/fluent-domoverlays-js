const { Benchmark } = require('benchmark');
const { JSDOM } = require('jsdom');
const { translateNode } = require('../src/index');
const assert = require('assert');

const { document } = (new JSDOM('')).window;

function parseDOM(s) {
  const div = document.createElement('div');
  div.innerHTML = s;
  return div;
}

const source = `
  <a href="mozilla.org" data-l10n-name="foo"></a>
`;
const l10n = `
  This is a simple <a data-l10n-name="foo">example</a>.
`;
const output = `
  This is a simple <a href="mozilla.org" data-l10n-name="foo">example</a>.
`;

{
  // Sanity check
  const sourceDOM = parseDOM(source);
  const l10nDOM = parseDOM(l10n);

  translateNode(sourceDOM, l10nDOM);
  assert.strictEqual(sourceDOM.innerHTML, output);
}

{
  let sourceDOM = parseDOM(source);
  let l10nDOM = parseDOM(l10n);

  const bench = new Benchmark('simple case', () => {
    translateNode(sourceDOM, l10nDOM);
  }, {
    onCycle: () => {
      // Rest input values
      sourceDOM = parseDOM(source);
      l10nDOM = parseDOM(l10n);
    },
    onComplete: (event) => { console.log(`ops/sec: ${event.target}`); },
  });

  bench.run({ async: true });
}
