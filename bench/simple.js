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
  <ul>
    <li></li>
    <li></li>
  </ul>
`);
const l10n = parseDOM(`
  This is
  <ul>
    <li>A nested <img src='foo'>img</img></li>
    <li><em>list</em></li>
  </ul>
  and so on.
`);

const bench = new Benchmark('simple case', () => {
  translateNode(dom, l10n);
}, {
  // onCycle: function(event) { console.log(String(event.target)); },
  onComplete: (event) => { console.log(`ops/sec: ${event.target}`); },
});

bench.run({ async: true });
