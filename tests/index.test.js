const { translateNode } = require("../src/index");
const { JSDOM } = require("jsdom");

const { document } = (new JSDOM(`<html/>`)).window;

function parseDOM(s) {
  return JSDOM.fragment(s);
}

function expectNode(dom, l10n, result) {
  let elem = document.createElement("div");
  elem.innerHTML = dom;
  translateNode(elem, l10n, parseDOM);
  expect(elem.innerHTML.trim()).toBe(result.trim());
}

function expectToThrow(dom, l10n, error) {
  let elem = document.createElement("div");
  elem.innerHTML = dom;
  expect(() => translateNode(elem, l10n, parseDOM).toThrow(error));
}

test("apply value", () => {
  let dom = ``;
  let l10n = `Foo`;
  let result = `Foo`;
  expectNode(dom, l10n, result);
});

test("handle text level semantics", () => {
  let dom = ``;
  let l10n = `<em>mr.</em> LaCroix`;
  let result = `<em>mr.</em> LaCroix`;
  expectNode(dom, l10n, result);
});

test("reject illegal elements", () => {
  let dom = ``;
  let l10n = `<em>mr.</em> LaCroix`;
  expectToThrow(dom, l10n, Error);
});

test("handle overlay elements", () => {
  let dom = `
    <a data-l10n-name="link" href="http://www.mozilla.org"/>
  `;
  let l10n = `
    Test with
    <a data-l10n-name="link">a link</a>
    and text around it.
  `;
  let result = `
    Test with
    <a data-l10n-name="link" href="http://www.mozilla.org">a link</a>
    and text around it.
  `;
  expectNode(dom, l10n, result);
});
