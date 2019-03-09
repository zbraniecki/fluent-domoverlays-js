const { Benchmark } = require('benchmark');
const { JSDOM } = require('jsdom');
const { translateNode } = require('../src/index');

const { document } = (new JSDOM('')).window;

function parseDOM(s) {
  const div = document.createElement('div');
  div.innerHTML = s;
  return div;
}

const dom = parseDOM(`
  <a href="mozilla.org" data-l10n-name="foo"></a>
`);
const l10n = parseDOM(`
  This is a simple <a data-l10n-name="foo">example</a>.
`);

const bench = new Benchmark('simple case', () => {
  translateNode(dom, l10n);
}, {
  // onCycle: function(event) { console.log(String(event.target)); },
  onComplete: (event) => { console.log(`ops/sec: ${event.target}`); },
});

bench.run({ async: true });
