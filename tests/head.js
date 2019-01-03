const fuzzer = require('fuzzer');
const { translateNode } = require('../src/index');

const FUZZ = false;

function parseDOM(s) {
  const div = document.createElement('div');
  div.innerHTML = s;
  return div;
}

fuzzer.seed(0);

function expectNode(dom, l10n, result, expectedErrors = []) {
  if (FUZZ) {
    for (let i = 0; i < 10000; i++) {
      const elem = parseDOM(dom);
      const fuzzedL10n = fuzzer.mutate.string(l10n);
      translateNode(elem, parseDOM(fuzzedL10n));

      translateNode(elem, parseDOM(l10n));
      expect(elem.innerHTML.trim()).toBe(result.trim());
    }
  } else {
    const elem = parseDOM(dom);
    const errors = translateNode(elem, parseDOM(l10n));
    expect(elem.innerHTML.trim()).toBe(result.trim());
    expect(errors).toEqual(expectedErrors);
  }
}

exports.expectNode = expectNode;
