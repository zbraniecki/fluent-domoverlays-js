const { translateNode } = require('../src/index');

function parseDOM(s) {
  const div = document.createElement('div');
  div.innerHTML = s;
  return div;
}

function expectNode(dom, l10n, result, allowedQuery = null, expectedErrors = []) {
  const elem = document.createElement('div');
  elem.innerHTML = dom;
  const errors = translateNode(elem, l10n, allowedQuery, parseDOM);
  expect(elem.innerHTML.trim()).toBe(result.trim());
  expect(errors).toEqual(expectedErrors);
}

test('nested l10n-ids', () => {
  const dom = `
    <menu data-l10n-id='foo' data-l10n-name='menu'>
      <menuitem value='1'></menuitem>
      <menuitem value='2'></menuitem>
    </menu>`;
  const l10n = 'Test <menu data-l10n-name=\'menu\'></menu> Test 2';
  const result = 'Test <menu data-l10n-id=\'foo\' data-l10n-name=\'menu\'></menu> Test 2';
  expectNode(dom, l10n, result);
});

test('complex nested fragment', () => {
  const dom = '';
  const query = 'ul, ul > li';
  const l10n = `
    This is
    <ul>
      <li>A nested <img src='foo'>img</img></li>
      <li><em>list</em></li>
    </ul>
    and so on.
  `;
  const result = `
    This is
    <ul>
      <li>A nested img</li>
      <li><em>list</em></li>
    </ul>
    and so on.
    `;
  expectNode(dom, l10n, result, query);
});
