const { TEXT_LEVEL_ELEMENTS, LOCALIZABLE_ATTRIBUTES } = require('./whitelist');
const { ERROR_CODES } = require('./errors');

/**
 * Helper function which extracts a textNode out of
 * an element.
 */
function extractTextNodeFromElement(elem) {
  return elem.ownerDocument.createTextNode(elem.textContent);
}

/**
 * Helper function which takes an elements from
 * the translation and cleans it up to be safe
 * to be included into the source.
 */
function sanitizeElement(elem, errors) {
  // 1. Iterate over attributes and remove
  //    non-localizable ones.
  for (const attr of Array.from(elem.attributes)) {
    const { name } = attr;
    if (!attributeLocalizable(elem.nodeName, name, null)) {
      errors.push([ERROR_CODES.FORBIDDEN_ATTRIBUTE, { name }]);
      elem.removeAttribute(name);
    }
  }

  // 2. Iterate over child elements and sanitize them.
  for (const childElem of elem.children) {
    const elemName = childElem.nodeName.toLowerCase();
    if (TEXT_LEVEL_ELEMENTS.includes(elemName)) {
      sanitizeElement(childElem, errors);
    } else {
      const parent = childElem.parentNode;
      const textNode = extractTextNodeFromElement(childElem);
      parent.replaceChild(textNode, childElem);
    }
  }
}

/**
 * Helper function which tests if the attribute is
 * localizable in the given context.
 */
function attributeLocalizable(elemName, attrName, allowed = null) {
  return (allowed !== null && allowed.includes(attrName))
    || LOCALIZABLE_ATTRIBUTES.global.includes(attrName)
    || (LOCALIZABLE_ATTRIBUTES.hasOwnProperty(elemName)
      && LOCALIZABLE_ATTRIBUTES[elemName].includes(attrName));
}

/**
 * Function which applies a translation element onto
 * a source element.
 *
 * It performs three steps:
 *   1) Remove localizable attributes from source.
 *   2) Apply localizable attributes from translation
 *   3) (optionally) localize the content of the element.
 */
function localizeElement(source, translation, errors) {
  const nodeName = source.nodeName.toLowerCase();
  const allowedAttrs = source.hasAttribute('data-l10n-attrs')
    ? source.getAttribute('data-l10n-attrs')
      .split(',')
      .map(e => e.trim())
    : null;

  // 1. Iterate over source element looking for localizable
  //    attributes to be removed from the source.
  for (const attr of Array.from(source.attributes)) {
    const { name } = attr;
    if (attributeLocalizable(nodeName, name, allowedAttrs)) {
      if (!translation.hasAttribute(name)) {
        source.removeAttribute(name);
      }
    }
  }


  // 2. Iterate over translation element applying all
  //    localizable attributes onto the source element.
  for (const attr of translation.attributes) {
    const { name } = attr;
    if (name === 'data-l10n-name'
      || name === 'data-l10n-pos') {
      continue;
    }

    if (attributeLocalizable(nodeName, name, allowedAttrs)) {
      if (source.getAttribute(name) !== attr.value) {
        source.setAttribute(name, attr.value);
      }
    } else {
      errors.push([ERROR_CODES.ILLEGAL_ATTRIBUTE_IN_L10N, { name }]);
    }
  }

  // 3. Optionally, localize the value of the element.
  if (!source.hasAttribute('data-l10n-opaque')) {
    localizeDOM(source, translation, errors);
  }
}

/**
 * Helper function used to retrieve all child elements
 * of the given type in the source.
 * This is used for element matching based on the element name.
 */
function getMatchingElements(elements, elementName) {
  const matchingElements = [];
  for (const element of elements) {
    if (element.nodeName === elementName) {
      matchingElements.push(element);
    }
  }
  return matchingElements;
}

/**
 * Helper function used to retrieve elements that match
 * a given l10n-name.
 */
function getNamedElements(elements) {
  // XXX: We should cache it.
  // XXX: Should we allow for named elements to match anywhere in the
  //      source, instead of just on the same level?
  const namedElements = {};
  for (const element of elements) {
    if (element.hasAttribute('data-l10n-name')) {
      const name = element.getAttribute('data-l10n-name');
      namedElements[name] = element;
    }
  }
  return namedElements;
}

/**
 * Main function which localizes a DOM Fragment, using a DOM
 * Fragment from the translation.
 *
 * It performs the following steps:
 * 1) Remove all nodes from the source.
 * 2) Iterate over the translation inserting text nodes and
 *    localized elements.
 * 2.1) For elements with `data-l10n-name` it looks up an elements with that name.
 * 2.2) For elements with `data-l10n-pos` it looks up an elements of the same type
 *      at the requested position.
 * 2.3) For other elements it looks up the first element of the same type.
 * 2.4) For text level elements it sanitizes them.
 * 2.5) For any remaining elements, their text content is extracted and inserted.
 * 3) Insert any remaining elements from the source that were not
 *    inserted in step (2).
 */
function localizeDOM(source, translation, errors) {
  const sourceElements = new Set();
  while (source.firstChild) {
    if (source.firstChild.nodeType === 1) {
      sourceElements.add(source.firstChild);
    }
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
          const namedElements = getNamedElements(sourceElements);
          if (namedElements.hasOwnProperty(name)) {
            const namedElement = namedElements[name];
            if (namedElement.nodeName !== translationNode.nodeName) {
              errors.push([ERROR_CODES.NAMED_ELEMENTS_DIFFER_IN_TYPE]);
              const textNode = extractTextNodeFromElement(translationNode);
              source.appendChild(textNode);
            } else {
              if (!namedElement.hasAttribute('data-l10n-id')) {
                localizeElement(namedElement, translationNode, errors);
              }
              source.appendChild(namedElement);
              sourceElements.delete(namedElement);
            }
          } else {
            errors.push([ERROR_CODES.UNACCOUNTED_L10NNAME, { name }]);
            const textNode = extractTextNodeFromElement(translationNode);
            source.appendChild(textNode);
          }
          translation.removeChild(translationNode);
        } else {
          const matchingElements = getMatchingElements(sourceElements, elementName);
          const pos = translationNode.hasAttribute('data-l10n-pos')
            ? parseInt(translationNode.getAttribute('data-l10n-pos'), 10)
            : 1;
          let matchingElement = null;
          for (const element of matchingElements) {
            // XXX: We definitely don't want to use
            //      an attr here, but WeakSet didn't work in
            //      Node+JSDOM.
            if (element.pos === pos) {
              matchingElement = element;
              break;
            }
          }
          if (matchingElement === null) {
            matchingElement = matchingElements[pos - 1];
          }

          if (matchingElement) {
            matchingElement.pos = pos;
            sourceElements.delete(matchingElement);
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
            const textNode = extractTextNodeFromElement(translationNode);
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

  for (const sourceNode of sourceElements) {
    if (!TEXT_LEVEL_ELEMENTS.includes(sourceNode.nodeName.toLowerCase())) {
      source.appendChild(sourceNode);
    }
  }
}

function translateNode(node, translation, errors = []) {
  localizeDOM(node, translation, errors);
  return errors;
}

exports.translateNode = translateNode;
