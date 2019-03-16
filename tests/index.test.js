const { ERROR_CODES } = require('../src/errors');
const { expectNode } = require('./head');

test('apply value', () => {
  const dom = '';
  const l10n = 'Foo';
  const result = 'Foo';
  expectNode(dom, l10n, result);
});

test('handle text level semantics', () => {
  const dom = '';
  const l10n = '<em>mr.</em> LaCroix';
  const result = '<em>mr.</em> LaCroix';
  expectNode(dom, l10n, result);
});

test('handle overlay elements', () => {
  const dom = `
    <a data-l10n-name="link" href="http://www.mozilla.org"/>
  `;
  const l10n = `
    Test with
    <a data-l10n-name="link">a link</a>
    and text around it.
  `;
  const result = `
    Test with
    <a data-l10n-name="link" href="http://www.mozilla.org">a link</a>
    and text around it.
  `;
  expectNode(dom, l10n, result);
});

describe('failures', () => {
  test('remove localizable attributes from source', () => {
    const dom = `
      <img data-l10n-name="img" title="source title"/>
      <a data-l10n-name="link" download="source download"></a>
      <input data-l10n-name="input"/>
      <img data-l10n-name="img2" data-l10n-attrs="src"/>
    `;
    const l10n = `
      <img data-l10n-name="img" title="l10n title"/>
      <a data-l10n-name="link"></a>
      <input data-l10n-name="input" alt="foo" src="foo"/>
      <img data-l10n-name="img2" src="http://l10n.mozilla.org" onclick="foo"/>
    `;
    const result = `
      <img data-l10n-name="img" title="l10n title">
      <a data-l10n-name="link"></a>
      <input data-l10n-name="input" alt="foo">
      <img data-l10n-name="img2" data-l10n-attrs="src" src="http://l10n.mozilla.org">
    `;
    const errors = [
      [ERROR_CODES.ILLEGAL_ATTRIBUTE_IN_L10N, { name: 'src' }],
      [ERROR_CODES.ILLEGAL_ATTRIBUTE_IN_L10N, { name: 'onclick' }],
    ];
    expectNode(dom, l10n, result, errors);
  });

  test('reject simple translation for DOM with children', () => {
    const dom = '<img src="foo"/>';
    const l10n = 'Foo';
    const result = 'Foo<img src="foo">';
    const errors = [];
    expectNode(dom, l10n, result, errors);
  });

  test('reject non-whitelisted and unnamed elements', () => {
    const dom = '';
    const l10n = 'Foo <img src="img.png"/>';
    const result = 'Foo ';
    const errors = [
      [ERROR_CODES.ILLEGAL_ELEMENT, { name: 'img' }],
    ];
    expectNode(dom, l10n, result, errors);
  });

  test('reject non-whitelisted and unaccounted elements', () => {
    const dom = '';
    const l10n = '<a data-l10n-name="link">mr.</a> LaCroix';
    const result = 'mr. LaCroix';
    const errors = [
      [ERROR_CODES.UNACCOUNTED_L10NNAME, { name: 'link' }],
    ];
    expectNode(dom, l10n, result, errors);
  });

  test('reject forbidden attribute on elements', () => {
    const dom = '';
    const l10n = '<em class="foo" title="bar">mr.</em> LaCroix';
    const result = '<em title="bar">mr.</em> LaCroix';
    const errors = [
      [ERROR_CODES.ILLEGAL_ATTRIBUTE_IN_L10N, { name: 'class' }],
    ];
    expectNode(dom, l10n, result, errors);
  });

  test('elements with same l10n-name must be of the same type', () => {
    const dom = '<button data-l10n-name="button"/>';
    const l10n = 'Click <input data-l10n-name="button"/>';
    const result = 'Click <button data-l10n-name="button"></button>';
    const errors = [
      [ERROR_CODES.NAMED_ELEMENTS_DIFFER_IN_TYPE],
    ];
    expectNode(dom, l10n, result, errors);
  });
});
