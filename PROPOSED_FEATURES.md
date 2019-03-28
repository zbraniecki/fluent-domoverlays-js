This article lists all the new features proposed for revision 3 of DOMOverlays API.

## 1. Allow all elements as children in the source

As a developer, I want to use all available HTML elements as children.


```html
<div data-l10n-id="key1">
  <ul>
    <li></li>
    <li></li>
    <li></li>
  </ul>
</div>
```

```properties
key1 = This is a list of errors with
  <ul>
    <li>Bullet 1</li>
    <li>Bullet 2</li>
    <li>Bullet 3</li>
  </ul>
```

Proposed behavior: Allow for the source to include elements that define what
elements can be used in the translation. Recursively nest into them to allow
for nested structures.

References:
* [netError.dtd model cannot be currently ported to Fluent](https://searchfox.org/mozilla-central/rev/2a6f3dde00801374d3b2a704232de54a132af389/browser/locales/en-US/chrome/overrides/netError.dtd#28-35)


## 2. Allow text-level child elments in translations

As a localizer, I want to be able to use text-level elements such as `<em>` and `<sup>` in translations even if they are not present in the source.

```html
<div data-l10n-id="key">
  Text which doesn't need italics in English.
</div>
```

```properties
key = Text which needs <em>italics</em> in another language.
```


## 3. Do not remove child elements from the DOM

As a developer, I want to be sure that a translation will not remove a child
element which is important for the functioning of the UI. For instance, if
a broken localization doesn't include the `<button>`, I still want to be able
to rely on the button being present in the DOM.


```html
<div data-l10n-id="submit-button">
  <button id="submit">Submit</button>
</div>
```

```properties
submit = No button here.
```

Proposed behavior: Child elements from the source are always inserted into the
translation. If they cannot be matched to anything in the translation, they're
added at the end.

```js
document.getElementById("main-link").setAttribute("href", "https://www.mozilla.org");
```

References:
* [Firefox Preferences JS code which currently will break Preferences on broken translation](https://searchfox.org/mozilla-central/rev/2a6f3dde00801374d3b2a704232de54a132af389/browser/components/preferences/in-content/sync.js#148)
* [Another Firefox Preferences JS code which currently will break Preferences on broken translation](https://searchfox.org/mozilla-central/rev/2a6f3dde00801374d3b2a704232de54a132af389/browser/components/preferences/in-content/findInPage.js#35)


## 4. Overlay elements based on type and position

As a developer, I don't want to have to use `data-l10n-name` for all functional
child elements.

As a localizer, I want to edit the most streamlined version of the markup
possible, without attributes which add cruft.

```html
<div data-l10n-id="key1">
  <ul>
    <li></li>
    <li><button id="..." onclick="..."></button></li>
    <li></li>
  </ul>
</div>
```

```properties
key1 = This is a list of errors with
  <ul>
    <li>Bullet 1</li>
    <li><button>Submit</button></li>
    <li>Bullet 3</li>
  </ul>
```

Proposed behavior: Allow for the source structure to be replicated in the
translation and auto-match elements on each "level" based on their type and
position.


## 5. Allow translations to overlay elements in different order

As a localizer, I want to be able to reorder two child elements on the same
nesting level.

```html
<div data-l10n-id="key1">
  <a href="https://www.mozilla.org"/>
  <a href="https://www.firefox.com"/>
</div>
```

```properties
key1 = Open <a data-l10n-pos="2">Firefox</a>, which is a <a data-l10n-pos="1">Mozilla</a> product.
```
Proposed behavior: Localization can optionally use the `data-l10n-pos`
attribute to explicitly match a different elements than it would get assigned
based on the order in DOM.


## 6. Protect opaque child element from being localized

As a developer, I want to be able to insert a child element into a translation
whose content may not be localized. This is useful for wrapping child elements
which provide extended functionality in translated content.

```html
<div data-l10n-id="key1">
  <menulist data-l10n-opaque="true"/>
</div>
```

```properties
key1 = Always <menulist/> when opening a new tab. 
```


## 7. Retain the identity of source elements

As a developer, I want to store references to child elements and attach behaviors to
them without the localization layer breaking them.

```html
<div data-l10n-id="submit-form">
  <button id="submit">Submit</button>
</div>
```

```properties
submit-form = <button>Submit</button>
```

Even after multiple retranslations, the identity of the `<button>` should
be the same. The element should not be recreated by the localization layer.

```js
let button = document.getElementById("submit");
button.addEventListener(...);

// Someplace else in the code...
// Button is still a reference to the button in the DOM.
button.style = "...";
```

Proposed solution: Child elements are re-used rather than recreated.

References:
* [Firefox Preferences JS code which currently cannot be cached](https://searchfox.org/mozilla-central/rev/2a6f3dde00801374d3b2a704232de54a132af389/browser/components/preferences/in-content/sync.js#148)
* [Another Firefox Preferences JS code which currently cannot be cached](https://searchfox.org/mozilla-central/rev/2a6f3dde00801374d3b2a704232de54a132af389/browser/components/preferences/in-content/findInPage.js#35)


## 8. Allow nested localizable elements

As a developer, I want to be able to build nested structures of localizable
elements, each with its own `data-l10n-id`.

```html
<div data-l10n-id="key1">
  <menulist>
    <menuitem data-l10n-id="menuitem1"/>
    <menuitem data-l10n-id="menuitem2"/>
    <menuitem data-l10n-id="menuitem3"/>
  </menulist>
</div>
```

```properties
key1 = Always <menulist/> when opening a new tab.
menuitem1 = sing
menuitem2 = blink
menuitem3 = play a sound 
```

## 9. Allow asymmetrically nested translations

As a localizer, I want to be able to add more nested children than are present
in the source.

As a developer, I don't want to think about all possible permutations of nested
elements which may appear in translations.

```html
<div data-l10n-id="key1" data-l10n-whitelist="ul, ul > li"></div>
```

Translation 1:
```properties
key1 = This is a list of errors with
  <ul>
    <li>Bullet 1</li>
    <li>Bullet 2</li>
    <li>Bullet 3</li>
  </ul>
```

Translation 2:
```properties
key1 = This is a list of errors with
  <ul>
    <li>Bullet 1</li>
    <li>Bullet 2</li>
    <li>Bullet 3</li>
    <li>Bullet 4</li>
  </ul>
```

Translation 3:
```properties
key1 = This is a list of errors with
  <ul>
    <li>Bullet 1</li>
    <li>Bullet 2</li>
    <li>Bullet 3</li>
  </ul>
  <ul>
    <li>Bullet 4</li>
  </ul>
```


## 10. Allow void elements

As a localizer, I want to be able to use the `<element/>` syntax.

```html
<div data-l10n-id="key1">
  <img src="logo.png"/>
</div>
```

```properties
key1 = Click on <img/> to go to the next page.
```

Proposed solution: Use an XML parser.

References:
* [HTML parser used for markup in translations breaks self-closing elements](https://github.com/projectfluent/fluent.js/issues/188)


## 11. Minimize churn

As a developer, I want to be able to apply translations, including DOM Overlays, while causing as minimal churn and number of mutations on DOM as possible.

That means in particular:

* avoid updating attributes when the value doesn't change
* avoid removing/adding attributes when value does change
* avoid removing/adding elements when content doesn't change
* avoid removing/adding text elements when content of them does change
* avoid removing/adding elements when only order changes

References:
* [DOMLocalization can cause attribute churn by removing and re-adding attributes with the same value they had before removal](https://github.com/projectfluent/fluent.js/issues/300)
* [Avoid Churn PR](https://github.com/zbraniecki/fluent-domoverlays-js/pull/3)
