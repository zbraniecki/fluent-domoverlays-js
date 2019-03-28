const { ERROR_CODES } = require('../src/errors');
const { expectNode } = require('./head');

test.skip('nested l10n-ids', () => {
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
    <ul data-l10n-name="list">
      <li data-l10n-name="li1"><em>list</em></li>
      <li data-l10n-name="li2"></li>
    </ul>
  `;
  const l10n = `
    This is
    <ul data-l10n-name="list">
      <li data-l10n-name="li1">A nested <img src='foo'>img</img></li>
      <li data-l10n-name="li2"><em>list</em></li>
    </ul>
    and so on.
  `;
  const result = `
    This is
    <ul data-l10n-name="list">
      <li data-l10n-name="li1">A nested img</li>
      <li data-l10n-name="li2"><em>list</em></li>
    </ul>
    and so on.
    `;
  const errors = [
    [ERROR_CODES.ILLEGAL_ELEMENT, { name: 'img' }],
  ];
  expectNode(dom, l10n, result, errors);
});

// New from stas:
test('stas 1', () => {
  const dom = `
    <p data-l10n-id="faa" data-l10n-name="p1">
      <a href="http://www.mozilla.com"></a>
    </p>

    <widget data-l10n-opaque="true" data-l10n-name="widget">
      <subwidget></subwidget>
    </widget>
  `;
  const l10n = `
    Click on <p data-l10n-name="p1"></p> to
    <widget data-l10n-name="widget" title="foo"></widget>
    go.
  `;
  const result = `
    Click on <p data-l10n-id="faa" data-l10n-name="p1">
      <a href="http://www.mozilla.com"></a>
    </p> to
    <widget data-l10n-opaque="true" data-l10n-name="widget" title="foo">
      <subwidget></subwidget>
    </widget>
    go.
  `;
  expectNode(dom, l10n, result);
});

test('stas 2', () => {
  const dom = `
    <ul data-l10n-name="list">
      <li class="li-1" data-l10n-name="li1"></li>
      <li class="li-2" data-l10n-name="li2"></li>
    </ul>
    <img/>
  `;
  const l10n = `
    This is a very long paragraph with
    a beautiful

    <ul data-l10n-name="list">
      <li data-l10n-name="li2">item 2</li>
      <li data-l10n-name="li1">item 1</li>
    </ul>
    `;
  const result = `
    This is a very long paragraph with
    a beautiful

    <ul data-l10n-name="list">
      <li class="li-2" data-l10n-name="li2">item 2</li>
      <li class="li-1" data-l10n-name="li1">item 1</li>
    </ul>
    <img>
  `;
  expectNode(dom, l10n, result);
});

test('bench', () => {
  const dom = `
  <a href="mozilla.org" data-l10n-name="foo"></a>
  `;
  const l10n = `
  This is a simple <a data-l10n-name="foo">example</a>.
    `;
  const result = `
  This is a simple <a href="mozilla.org" data-l10n-name="foo">example</a>.
  `;
  expectNode(dom, l10n, result);
});
