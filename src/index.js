const { TEXT_LEVEL_ELEMENTS, LOCALIZABLE_ATTRIBUTES } = require('./whitelist');
const { ERROR_CODES } = require('./errors');

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

function attributeLocalizable(elemName, attrName, allowed = null) {
  return (allowed !== null && allowed.includes(attrName))
    || LOCALIZABLE_ATTRIBUTES.global.includes(attrName)
    || (LOCALIZABLE_ATTRIBUTES.hasOwnProperty(elemName)
    && LOCALIZABLE_ATTRIBUTES[elemName].includes(attrName));
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
  for (const attr of source.attributes) {
    if (attributeLocalizable(nodeName, attr.name, allowedAttrs)) {
      source.removeAttribute(attr.name);
      errors.push([ERROR_CODES.LOCALIZABLE_ATTRIBUTE_IN_SOURCE]);
    }
  }


  // 2. Iterate over translation DOM applying all
  //    localizable attributes onto the source DOM.
  for (const attr of translation.attributes) {
    if (attr.name === 'data-l10n-name'
      || attr.name === 'data-l10n-pos') {
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
    localizeDOM(source, translation, errors);
  }
}

function getMatchingElements(nodes, nodeName) {
  const matchingElements = [];
  for (const node of nodes) {
    if (node.nodeType === 1 && node.nodeName === nodeName) {
      matchingElements.push(node);
    }
  }
  return matchingElements;
}

function getNamedElements(nodes) {
  // XXX: Cache
  const namedElements = {};
  for (const node of nodes) {
    if (node.nodeType === 1 && node.hasAttribute('data-l10n-name')) {
      const name = node.getAttribute('data-l10n-name');
      namedElements[name] = node;
    }
  }
  return namedElements;
}

function localizeDOM(source, translation, errors) {
  const sourceNodes = new Set();
  while (source.firstChild) {
    sourceNodes.add(source.firstChild);
    source.removeChild(source.firstChild);
  }

  while (translation.firstChild) {
    const translationNode = translation.firstChild;
    const { nodeType } = translationNode;
    switch (nodeType) {
      case 1: {
        const elementName = translationNode.nodeName;
        if (translationNode.hasAttribute('data-l10n-name')) {
          const name = translationNode.getAttribute('data-l10n-name');
          const namedElements = getNamedElements(sourceNodes);
          if (namedElements.hasOwnProperty(name)) {
            const namedElement = namedElements[name];
            sourceNodes.delete(namedElement);
            if (namedElement.nodeName !== translationNode.nodeName) {
              errors.push([ERROR_CODES.NAMED_ELEMENTS_DIFFER_IN_TYPE]);
              const textNode = source.ownerDocument.createTextNode(translationNode.textContent);
              source.appendChild(textNode);
            } else {
              if (!namedElement.hasAttribute('data-l10n-id')) {
                localizeElement(namedElement, translationNode, errors);
              }
              source.appendChild(namedElement);
            }
          } else {
            errors.push([ERROR_CODES.UNACCOUNTED_L10NNAME, {
              name,
            }]);
            const textNode = source.ownerDocument.createTextNode(translationNode.textContent);
            source.appendChild(textNode);
          }
          translation.removeChild(translationNode);
        } else {
          const matchingElements = getMatchingElements(sourceNodes, elementName);
          const pos = translationNode.hasAttribute('data-l10n-pos')
            ? translationNode.getAttribute('data-l10n-pos')
            : 1;
          const matchingElement = matchingElements[pos - 1];

          if (matchingElement) {
            sourceNodes.delete(matchingElement);
            if (!matchingElement.hasAttribute('data-l10n-id')) {
              localizeElement(matchingElement, translationNode, errors);
            }
            source.appendChild(matchingElement);
            translation.removeChild(translationNode);

          } else if (TEXT_LEVEL_ELEMENTS.includes(elementName.toLowerCase())) {
            sanitizeElement(translationNode, errors);
            source.appendChild(translationNode);
          } else {
            errors.push([ERROR_CODES.ILLEGAL_ELEMENT, {
              name: elementName.toLowerCase(),
            }]);
            const textNode = source.ownerDocument.createTextNode(translationNode.textContent);
            source.appendChild(textNode);
            translation.removeChild(translationNode);
          }
        }
        break;
      }
      case 3: {
        source.appendChild(translationNode);
        break;
      }
      default: {
        translation.removeChild(translationNode);
        break;
      }
    }
  }

  for (const sourceNode of sourceNodes) {
    if (sourceNode.nodeType === 1) {
      source.appendChild(sourceNode);
    }
  }
}

function translateNode(node, translation, parseDOM) {
  const errors = [];

  const translationDOM = typeof translation === 'string'
    ? parseDOM(translation) : translation;

  localizeDOM(node, translationDOM, errors);
  return errors;
}

exports.translateNode = translateNode;
