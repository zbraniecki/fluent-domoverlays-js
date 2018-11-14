const { translateNode } = require("../src/index");
const { ERROR_CODES } = require("../src/errors");

function parseDOM(s) {
  let div = document.createElement("div");
  div.innerHTML = s;
  return div;
}

function expectNode(dom, l10n, result, allowedQuery = null, expectedErrors = []) {
  let elem = document.createElement("div");
  elem.innerHTML = dom;
  let errors = translateNode(elem, l10n, allowedQuery, parseDOM);
  expect(elem.innerHTML.trim()).toBe(result.trim());
  expect(errors).toEqual(expectedErrors);
}

test("nested l10n-ids", () => {
  let dom = `
    <menu data-l10n-id="foo" data-l10n-name="menu">
      <menuitem value="1"></menuitem>
      <menuitem value="2"></menuitem>
    </menu>`;
  let l10n = `Test <menu data-l10n-name="menu"></menu> Test 2`;
  let result = `Test <menu data-l10n-id="foo" data-l10n-name="menu"></menu> Test 2`;
  expectNode(dom, l10n, result);
});

test("complex nested fragment", () => {
  let dom = ``;
  let query = `ul, ul > li`;
  let l10n = `
    This is
    <ul>
      <li>A nested <img src="foo">img</img></li>
      <li><em>list</em></li>
    </ul>
    and so on.
  `;
  let result = `
    This is
    <ul>
      <li>A nested img</li>
      <li><em>list</em></li>
    </ul>
    and so on.
    `;
  expectNode(dom, l10n, result, query);
});
