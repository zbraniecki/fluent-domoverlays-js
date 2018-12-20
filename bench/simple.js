const { Benchmark } = require('benchmark');
const { translateNode } = require('../src/index');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { document } = (new JSDOM(``)).window;

var suite = new Benchmark.Suite;

function parseDOM(s) {
  const div = document.createElement('div');
  div.innerHTML = s;
  return div;
}

const bench = new Benchmark('simple case', function() {
  const dom = `
    <ul>
      <li></li>
      <li></li>
    </ul>
  `;
  const l10n = `
    This is
    <ul>
      <li>A nested <img src='foo'>img</img></li>
      <li><em>list</em></li>
    </ul>
    and so on.
  `;
  let errors = translateNode(parseDOM(dom), parseDOM(l10n));
}, {
  //'onCycle': function(event) { console.log(String(event.target)); },
  'onComplete': function(event) { console.log(`ops/sec: ${event.target}`) },
});

bench.run({ 'async': true });
