const { translateNode } = require('../src/index');

function parseDOM(s) {
  const div = document.createElement('div');
  div.innerHTML = s;
  return div;
}

function expectNode(dom, l10n, result, expectedErrors = []) {
  const elem = document.createElement('div');
  elem.innerHTML = dom;
  const errors = translateNode(elem, l10n, parseDOM);
  expect(elem.innerHTML.trim()).toBe(result.trim());
  expect(errors).toEqual(expectedErrors);
}

test('nested l10n-ids', () => {
  const dom = `
    <menu data-l10n-id='foo' data-l10n-name='menu'>
      <menuitem value='1'></menuitem>
      <menuitem value='2'></menuitem>
    </menu>`;
  const l10n = `
    Test <menu data-l10n-name='menu'></menu> Test 2
  `;
  const result = `
    Test <menu data-l10n-id="foo" data-l10n-name="menu">
      <menuitem value="1">
      <menuitem value="2">
    </menu> Test 2
  `;
  expectNode(dom, l10n, result);
});

test('complex nested fragment', () => {
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
  const result = `
    This is
    <ul>
      <li>A nested img</li>
      <li><em>list</em></li>
    </ul>
    and so on.
    `;
  expectNode(dom, l10n, result);
});


// New from stas:
test('stas 1', () => {
  const dom = `
    <p data-l10n-id="faa">
      <a href="http://www.mozilla.com"/></a>
    </p>

    <widget data-l10n-opaque>
      <subwidget></subwidget>
    </widget>
  `;
  const l10n = `
    Click on <p></p> to
    <widget title="foo"></widget>
    go.
  `;
  const result = `
    Click on <p data-l10n-id="faa">
      <a href="http://www.mozilla.com"></a>
    </p> to
    <widget data-l10n-opaque="" title="foo">
      <subwidget></subwidget>
    </widget>
    go.
  `;
  expectNode(dom, l10n, result);
});

test('stas 2', () => {
  const dom = `
    <ul>
      <li class="li-1"></li>
      <li class="li-2"></li>
    </ul>
    <img/>
  `;
  const l10n = `
    This is a very long paragraph with
    a beautiful

    <ul>
      <li data-l10n-pos=2>item 2</li>
      <li data-l10n-pos=1>item 1</li>
    </ul>
  `;
  const result = `
    This is a very long paragraph with
    a beautiful

    <ul>
      <li class="li-2">item 2</li>
      <li class="li-1">item 1</li>
    </ul>
  <img>
  `;
  expectNode(dom, l10n, result);
});
