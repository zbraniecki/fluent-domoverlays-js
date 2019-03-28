const { ERROR_CODES } = require('../src/errors');
const { expectNode } = require('./head');

test.skip('nested l10n-ids', () => {
  const dom = `
    <menu data-l10n-id='foo'>
      <menuitem value='1'></menuitem>
      <menuitem value='2'></menuitem>
    </menu>`;
  const l10n = `
    Test <menu></menu> Test 2
  `;
  const result = `
    Test <menu data-l10n-id="foo">
      <menuitem value="1">
      <menuitem value="2">
    </menu> Test 2
  `;
  expectNode(dom, l10n, result);
});

test('complex nested fragment', () => {
  const dom = `
    <ul>
      <li><em>list</em></li>
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
  const errors = [
    [ERROR_CODES.ILLEGAL_ELEMENT, { name: 'img' }],
  ];
  expectNode(dom, l10n, result, errors);
});

// New from stas:
test('stas 1', () => {
  const dom = `
    <p>
      <a href="http://www.mozilla.com"></a>
    </p>

    <widget data-l10n-opaque="true">
      <subwidget></subwidget>
    </widget>
  `;
  const l10n = `
    Click on <p>
      This is <a>my</a> test.
    </p> to
    <widget title="foo"></widget>
    go.
  `;
  const result = `
    Click on <p>
      This is <a href="http://www.mozilla.com">my</a> test.
    </p> to
    <widget data-l10n-opaque="true" title="foo">
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
      <li data-l10n-pos="2">item 2</li>
      <li data-l10n-pos="1">item 1</li>
    </ul>
    `;
  const result = `
    This is a very long paragraph with
    a beautiful

    <ul>
      <li class="li-2" data-l10n-pos="2">item 2</li>
      <li class="li-1" data-l10n-pos="1">item 1</li>
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
