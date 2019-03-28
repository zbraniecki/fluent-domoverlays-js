const { Benchmark } = require('benchmark');
const { JSDOM } = require('jsdom');
const { localizeElement } = require('../src/index');
const assert = require('assert');

const { document } = (new JSDOM('')).window;

global.Node = {
  TEXT_NODE: 3,
  ELEMENT_NODE: 1,
}

function parseDOM(s) {
  const t = document.createElement('template');
  t.innerHTML = s;
  return t;
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

  localizeElement(sourceDOM.content, {value: l10n});
  assert.strictEqual(sourceDOM.innerHTML, output);
}

{
  let sourceDOM = parseDOM(source);

  const bench = new Benchmark('simple case', () => {
    localizeElement(sourceDOM.content, {value: l10n});
  }, {
    onCycle: () => {
      // Rest input values
      sourceDOM = parseDOM(source);
    },
    onComplete: (event) => { console.log(`ops/sec: ${event.target}`); },
  });

  bench.run({ async: true });
}
