const { TEXT_LEVEL_ELEMENTS, LOCALIZABLE_ATTRIBUTES } = require('./whitelist');
const { ERROR_CODES } = require('./errors');

function extractTextNodeFromElement(elem) {
  return elem.ownerDocument.createTextNode(elem.textContent);
}

function attributeLocalizable(elemName, attrName, allowed = null) {
  return (allowed !== null && allowed.includes(attrName))
    || LOCALIZABLE_ATTRIBUTES.global.includes(attrName)
    || (LOCALIZABLE_ATTRIBUTES.hasOwnProperty(elemName)
      && LOCALIZABLE_ATTRIBUTES[elemName].includes(attrName));
}

function translateAttributes(source, attributes, errors) {
  const nodeName = source.nodeName.toLowerCase();
  const l10nAttr = source.getAttribute('data-l10n-attrs');
  const explicitlyAllowed = l10nAttr ? l10nAttr.split(',').map(e => e.trim()) : null;

  for (const { name } of source.attributes) {
    if (attributeLocalizable(nodeName, name, explicitlyAllowed)) {
      if (!attributes || !(name in attributes)) {
        source.removeAttribute(name);
      }
    }
  }

  if (attributes) {
    for (const { name, value } of attributes) {
      if (name === 'data-l10n-name' || name === 'data-l10n-pos') {
        continue;
      }
      if (attributeLocalizable(nodeName, name, explicitlyAllowed)) {
        if (source.getAttribute(name) !== value) {
          source.setAttribute(name, value);
        }
      } else {
        errors.push([ERROR_CODES.ILLEGAL_ATTRIBUTE_IN_L10N, { name }]);
      }
    }
  }
}

function getNamedElement(elementName, elementCollection) {
  for (const element of elementCollection) {
    const name = element.getAttribute('data-l10n-name');
    if (name !== null && name === elementName) {
      return element;
    }
  }
  return undefined;
}


function getMatchingElement(childNodes, element, pos) {
  const matchingElements = [];
  for (const childNode of childNodes) {
    if (childNode.nodeType === Node.ELEMENT_NODE && childNode.nodeName === element.nodeName) {
      const childNodePos = childNode.getAttribute('data-l10n-pos');

      if (childNodePos) {
        matchingElements[childNodePos - 1] = childNode;
      } else {
        childNode.setAttribute('data-l10n-pos', matchingElements.length + 1);
        matchingElements.push(childNode);
      }
    }
  }
  return matchingElements[pos];
}


function getMatchingNode(nodeList, node, startPos) {
  const listLength = nodeList.length;
  const { nodeType } = node;

  for (let i = startPos; i < listLength; i++) {
    const item = nodeList.item(i);
    if (item.nodeType === nodeType
      && (nodeType === Node.TEXT_NODE || item.nodeName === node.nodeName)) {
      return item;
    }
  }
  return undefined;
}

function translateContent(source, l10nNodes, errors) {
  let sourceChildPtr = 0;

  for (const l10nNode of l10nNodes) {
    const { nodeType } = l10nNode;

    const sourceNode = source.childNodes[sourceChildPtr];

    switch (nodeType) {
      case Node.TEXT_NODE: {
        let matchingNode = getMatchingNode(source.childNodes, l10nNode, sourceChildPtr);

        if (matchingNode === undefined) {
          matchingNode = source.ownerDocument.createTextNode(l10nNode.data);
        } else if (matchingNode.data !== l10nNode.data) {
          matchingNode.data = l10nNode.data;
        }
        if (matchingNode !== sourceNode) {
          source.insertBefore(matchingNode, sourceNode);
        }
        break;
      }
      case Node.ELEMENT_NODE: {
        let matchingElement;

        const l10nName = l10nNode.getAttribute('data-l10n-name');
        if (l10nName !== null) {
          const namedElement = getNamedElement(l10nName, source.children);

          if (namedElement && namedElement.nodeName === l10nNode.nodeName) {
            matchingElement = namedElement;
          } else if (!namedElement) {
            errors.push([ERROR_CODES.UNACCOUNTED_L10NNAME, { name: l10nName }]);
          } else {
            errors.push([ERROR_CODES.NAMED_ELEMENTS_DIFFER_IN_TYPE]);
          }
        } else if (l10nNode.hasAttribute('data-l10n-pos')) {
          const pos = parseInt(l10nNode.getAttribute('data-l10n-pos'), 10);
          matchingElement = getMatchingElement(source.childNodes, l10nNode, pos - 1);
        } else {
          matchingElement = getMatchingNode(source.childNodes, l10nNode, sourceChildPtr);
        }

        if (!matchingElement && TEXT_LEVEL_ELEMENTS.includes(l10nNode.nodeName.toLowerCase())) {
          const newElement = source.ownerDocument.createElement(l10nNode.nodeName);
          matchingElement = newElement;
        }

        if (matchingElement) {
          if (!matchingElement.hasAttribute('data-l10n-id')) {
            translateElement(matchingElement, l10nNode, errors);
          }
          if (matchingElement !== sourceNode) {
            source.insertBefore(matchingElement, sourceNode);
          }
        } else {
          if (!l10nName) {
            errors.push([ERROR_CODES.ILLEGAL_ELEMENT, {
              name: l10nNode.nodeName.toLowerCase(),
            }]);
          }
          const textNode = extractTextNodeFromElement(l10nNode);
          source.insertBefore(textNode, sourceNode);
        }
        break;
      }
      default: throw new Error('Unknown node type');
    }
    sourceChildPtr += 1;
  }

  while (sourceChildPtr < source.childNodes.length) {
    const sourceNode = source.childNodes[sourceChildPtr];
    if (sourceNode.nodeType === Node.TEXT_NODE
      || TEXT_LEVEL_ELEMENTS.includes(sourceNode.nodeName.toLowerCase())) {
      source.removeChild(sourceNode);
    } else {
      sourceChildPtr += 1;
    }
  }
}

function translateElement(element, translation, errors) {
  if (!element.hasAttribute('data-l10n-opaque')) {
    translateContent(element, translation.childNodes, errors);
  }
  translateAttributes(element, translation.attributes, errors);
}

const reOverlay = /<|&#?\w+;/;

function parseDOM(element, value) {
  if (!reOverlay.test(value)) {
    return [element.ownerDocument.createTextNode(value)];
  }
  const d = element.ownerDocument.createElement('template');
  d.innerHTML = value;
  return d.content.childNodes;
}

function localizeElement(element, translation) {
  const errors = [];
  if (translation.value) {
    const l10n = parseDOM(element, translation.value);
    translateContent(element, l10n, errors);
  }
  if (element.attributes) {
    translateAttributes(element, translation.attributes, errors);
  }
  return errors;
}

exports.parseDOM = parseDOM;
exports.localizeElement = localizeElement;
