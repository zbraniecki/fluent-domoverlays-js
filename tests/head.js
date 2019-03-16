const fuzzer = require('fuzzer');
const { localizeElement } = require('../src/index');

const FUZZ = false;

fuzzer.seed(0);

function parseDOM(value) {
  const t = document.createElement('template');
  t.innerHTML = value;
  return t;
}

function expectNode(dom, l10n, result, expectedErrors = []) {
  if (FUZZ) {
    for (let i = 0; i < 10000; i++) {
      const elem = parseDOM(dom);
      const fuzzedL10n = fuzzer.mutate.string(l10n);
      localizeElement(elem, { value: fuzzedL10n });

      localizeElement(elem, { value: l10n });
      expect(elem.innerHTML.trim()).toBe(result.trim());
    }
  } else {
    const elem = parseDOM(dom);
    const errors = localizeElement(elem.content, { value: l10n });
    expect(elem.innerHTML.trim()).toBe(result.trim());
    expect(errors).toEqual(expectedErrors);
  }
}

exports.expectNode = expectNode;
