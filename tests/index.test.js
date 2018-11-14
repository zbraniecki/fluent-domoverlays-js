const { translateNode } = require("../src/index");
const { ERROR_CODES } = require("../src/errors");

function parseDOM(s) {
  let div = document.createElement("div");
  div.innerHTML = s;
  return div;
}

function expectNode(dom, l10n, result, expectedErrors = []) {
  let elem = document.createElement("div");
  elem.innerHTML = dom;
  let errors = translateNode(elem, l10n, null, parseDOM);
  expect(elem.innerHTML.trim()).toBe(result.trim());
  expect(errors).toEqual(expectedErrors);
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

describe("failures", () => {
  test("reject non-whitelisted and unnamed elements", () => {
    let dom = ``;
    let l10n = `Foo <img src="img.png"/>`;
    let result = `Foo `;
    let errors = [
      [ERROR_CODES.ILLEGAL_ELEMENT, {name: "img"}]
    ];
    expectNode(dom, l10n, result, errors);
  });

  test("reject non-whitelisted and unaccounted elements", () => {
    let dom = ``;
    let l10n = `<a data-l10n-name="link">mr.</a> LaCroix`;
    let result = `mr. LaCroix`;
    let errors = [
      [ERROR_CODES.UNACCOUNTED_L10NNAME, {name: "link"}]
    ];
    expectNode(dom, l10n, result, errors);
  });

  test("reject forbidden attribute on elements", () => {
    let dom = ``;
    let l10n = `<em class="foo" title="bar">mr.</em> LaCroix`;
    let result = `<em title="bar">mr.</em> LaCroix`;
    let errors = [
      [ERROR_CODES.FORBIDDEN_ATTRIBUTE, {name: "class"}]
    ];
    expectNode(dom, l10n, result, errors);
  });

  test("elements with same l10n-name must be of the same type", () => {
    let dom = `<button data-l10n-name="button"/>`;
    let l10n = `Click <input data-l10n-name="button"/>`;
    let result = `Click `;
    let errors = [
      [ERROR_CODES.NAMED_ELEMENTS_DIFFER_IN_TYPE]
    ];
    expectNode(dom, l10n, result, errors);
  });
});
