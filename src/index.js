const { TEXT_LEVEL_ELEMENTS, LOCALIZABLE_ATTRIBUTES } = require('./whitelist');
const { ERROR_CODES } = require('./errors');

const reOverlay = /<|&#?\w+;/;

function attributeLocalizable(elemName, attrName, allowed = null) {
  return (allowed !== null && allowed.includes(attrName)) ||
    LOCALIZABLE_ATTRIBUTES.global.includes(attrName) ||
    (LOCALIZABLE_ATTRIBUTES.hasOwnProperty(elemName) &&
     LOCALIZABLE_ATTRIBUTES[elemName].includes(attrName));
}

/**
 * Function which applies a translation DOM onto
 * a source DOM, adding any encountered
 * errors to the error array.
 */
function localizeElement(source, translation, errors) {
  const nodeName = source.nodeName.toLowerCase();
  const allowedAttrs = source.hasAttribute('data-l10n-attrs')
    ? source.getAttribute('data-l10n-attrs')
        .split(',')
        .map(e => e.trim())
    : null;

  // 1. Iterate over source DOM looking for localizable
  //    attributes to be removed from the source.
  for (let attr of source.attributes) {
    if (attributeLocalizable(nodeName, attr.name, allowedAttrs)) {
      source.removeAttribute(attr.name);
      errors.push([ERROR_CODES.LOCALIZABLE_ATTRIBUTE_IN_SOURCE]);
    }
  }


  // 2. Iterate over translation DOM applying all
  //    localizable attributes onto the source DOM.
  for (let attr of translation.attributes) {
    if (attr.name === 'data-l10n-name') {
      continue;
    }

    if (attributeLocalizable(nodeName, attr.name, allowedAttrs)) {
      source.setAttribute(attr.name, attr.value);
    } else {
      errors.push([ERROR_CODES.ILLEGAL_ATTRIBUTE_IN_L10N]);
    }
  }

  // 3. Optionally, localize the value of the element.
  if (!source.hasAttribute('data-l10n-opaque')) {
    source.textContent = translation.textContent;
  }
}

function sanitizeElement(elem, errors) {
  for (let i = elem.attributes.length - 1; i >= 0; i--) {
    const attr = elem.attributes[i];
    if (!LOCALIZABLE_ATTRIBUTES.global.includes(attr.name)) {
      errors.push([ERROR_CODES.FORBIDDEN_ATTRIBUTE, { name: attr.name }]);
      elem.removeAttribute(attr.name);
    }
  }

  const childElements = elem.querySelectorAll('*');
  for (const childElem of childElements) {
    const elemName = childElem.nodeName.toLowerCase();
    if (!TEXT_LEVEL_ELEMENTS.includes(elemName)) {
      const parent = childElem.parentNode;
      const textNode = childElem.ownerDocument.createTextNode(childElem.textContent);
      parent.replaceChild(textNode, childElem);
    }
  }
}

function translateNode(node, translation, parseDOM) {
  const errors = [];

  if (typeof translation === 'string') {
    if (!reOverlay.test(translation)) {
      if (node.children.length) {
        errors.push([ERROR_CODES.NODE_HAS_CHILDREN]);
      }
      // XXX: Should we really override an element with
      // children with a translation here?
      node.textContent = translation;
      return errors;
    }
  }

  const translationDOM = typeof translation === 'string'
    ? parseDOM(translation) : translation;

  const sourceNodes = new Map();
  const translationNodes = new Map();

  for (let i = 0; i < node.children.length; i++) {
    const childNode = node.children[i];
    const l10nName = childNode.getAttribute('data-l10n-name');
    sourceNodes.set(l10nName, childNode);
  }

  for (let i = 0; i < translationDOM.children.length; i++) {
    const childNode = translationDOM.children[i];
    const l10nName = childNode.getAttribute('data-l10n-name');
    translationNodes.set(l10nName, childNode);
  }

  const sourceElements = new Set();
  while (node.firstChild) {
    sourceElements.add(node.firstChild);
    node.removeChild(node.firstChild);
  }

  while (translationDOM.childNodes.length) {
    const childNode = translationDOM.childNodes[0];
    const nodeName = childNode.nodeName.toLowerCase();
    const { nodeType } = childNode;
    if (nodeType === 1) {
      if (childNode.hasAttribute('data-l10n-name')) {
        const l10nName = childNode.getAttribute('data-l10n-name');
        if (sourceNodes.has(l10nName)) {
          const targetNode = sourceNodes.get(l10nName);
          sourceNodes.delete(l10nName);
          sourceElements.delete(targetNode);
          if (childNode.nodeName.toLowerCase() !== targetNode.nodeName.toLowerCase()) {
            errors.push([ERROR_CODES.NAMED_ELEMENTS_DIFFER_IN_TYPE]);
            const textNode = childNode.ownerDocument.createTextNode(childNode.textContent);
            node.appendChild(textNode);
          } else {
            if (!targetNode.hasAttribute('data-l10n-id')) {
              localizeElement(targetNode, childNode, errors);
            }
            node.appendChild(targetNode);
          }
          translationDOM.removeChild(childNode);
        } else {
          errors.push([ERROR_CODES.UNACCOUNTED_L10NNAME, {
            name: l10nName,
          }]);
          translationDOM.removeChild(childNode);
          const textNode = childNode.ownerDocument.createTextNode(childNode.textContent);
          node.appendChild(textNode);
        }
      } else if (TEXT_LEVEL_ELEMENTS.includes(nodeName)) {
        sanitizeElement(childNode, errors);
        node.appendChild(childNode);
      } else {
        const matchingElements = [];
        for (const sourceElement of sourceElements) {
          if (sourceElement.nodeName.toLowerCase() === nodeName) {
            matchingElements.push(sourceElement);
          }
        }

        const pos = childNode.hasAttribute('data-l10n-pos')
          ? parseInt(childNode.getAttribute('data-l10n-pos'), 10) : 1;

        const targetElement = matchingElements[pos - 1];

        if (targetElement) {
          sourceElements.delete(targetElement);
          node.appendChild(targetElement);
          translationDOM.removeChild(childNode);
          if (targetElement.hasAttribute('data-l10n-opaque')) {
            localizeElement(targetElement, childNode, errors);
          } else if (!targetElement.hasAttribute('data-l10n-id')) {
            translateNode(targetElement, childNode, parseDOM);
          }
        } else {
          errors.push([ERROR_CODES.ILLEGAL_ELEMENT, {
            name: nodeName,
          }]);
          translationDOM.removeChild(childNode);
          const textNode = childNode.ownerDocument.createTextNode(childNode.textContent);
          node.appendChild(textNode);
        }
      }
    } else {
      node.appendChild(childNode);
    }
  }

  for (const sourceElement of sourceElements) {
    if (sourceElement.nodeType === 1) {
      node.appendChild(sourceElement);
    }
  }
  return errors;
}

exports.translateNode = translateNode;
