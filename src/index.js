const { TEXT_LEVEL_ELEMENTS, LOCALIZABLE_ATTRIBUTES } = require("./whitelist");
const { ERROR_CODES } = require("./errors");

const reOverlay = /<|&#?\w+;/;

function translateElement(elem, translation, errors) {
  let nodeName = elem.nodeName.toLowerCase();
  for(var i = 0; i < elem.attributes.length; i++) {
    let attr = elem.attributes[i];
    if (LOCALIZABLE_ATTRIBUTES["global"].includes(attr.name)) {
      elem.removeAttribute(attr.name);
    } else if (nodeName in LOCALIZABLE_ATTRIBUTES && LOCALIZABLE_ATTRIBUTES[nodeName].includes(attr.name)) {
      elem.removeAttribute(attr.name);
    }
  }
  for(var i = 0; i < translation.attributes.length; i++) {
    let attr = translation.attributes[i];
    if (LOCALIZABLE_ATTRIBUTES["global"].includes(attr.name)) {
      elem.setAttribute(attr.name, attr.value);
    } else if (nodeName in LOCALIZABLE_ATTRIBUTES && LOCALIZABLE_ATTRIBUTES[nodeName].includes(attr.name)) {
      elem.setAttribute(attr.name, attr.value);
    } else if (elem.hasAttribute("data-l10n-attrs")) {
      let allowed = elem.getAttribute("data-l10n-attrs").split(",").map(e => e.trim());
      if (allowed.includes(attr.name)) {
        elem.setAttribute(attr.name, attr.value);
      }
    }
  }
  elem.textContent = translation.textContent;
}

function sanitizeElement(elem, allowedElements, errors) {
  let nodeName = elem.nodeName.toLowerCase();
  for(var i = 0; i < elem.attributes.length; i++) {
    let attr = elem.attributes[i];
    if (LOCALIZABLE_ATTRIBUTES["global"].includes(attr.name)) {
    } else if (nodeName in LOCALIZABLE_ATTRIBUTES && LOCALIZABLE_ATTRIBUTES[nodeName].includes(attr.name)) {
    } else {
      errors.push([ERROR_CODES.FORBIDDEN_ATTRIBUTE, {name: attr.name}]);
      elem.removeAttribute(attr.name);
    }
  }

  let childElements = elem.querySelectorAll("*");
  for (let childElem of childElements) {
    let elemName = childElem.nodeName.toLowerCase();
    if (!TEXT_LEVEL_ELEMENTS.includes(elemName) && !allowedElements.has(childElem)) {
      let parent = childElem.parentNode;
      let textNode = childElem.ownerDocument.createTextNode(childElem.textContent);
      parent.replaceChild(textNode, childElem);
    }
  }
}

function translateNode(node, translation, allowedQuery, parseDOM) {
  let errors = [];

  if (!reOverlay.test(translation)) {
    if (node.children.length) {
      errors.push([ERROR_CODES.NODE_HAS_CHILDREN]);
    }
    node.textContent = translation;
    return errors;
  }

  let translationDOM = parseDOM(translation);

  let sourceNodes = new Map();
  let translationNodes = new Map();

  for (let i = 0; i < node.children.length; i++) {
    let childNode = node.children[i];
    let l10nName = childNode.getAttribute("data-l10n-name");
    sourceNodes.set(l10nName, childNode);
  }

  for (let i = 0; i < translationDOM.children.length; i++) {
    let childNode = translationDOM.children[i];
    let l10nName = childNode.getAttribute("data-l10n-name");
    translationNodes.set(l10nName, childNode);
  }

  const allowedElements = allowedQuery ? new Set(translationDOM.querySelectorAll(allowedQuery)) : new Set();

  let sourceElements = new Set();
  while (node.firstChild) {
    sourceElements.add(node.firstChild);
    node.removeChild(node.firstChild);
  }

  while (translationDOM.childNodes.length) {
    let childNode = translationDOM.childNodes[0];
    let nodeName = childNode.nodeName.toLowerCase();
    let nodeType = childNode.nodeType;
    if (nodeType == 3) {
      node.appendChild(childNode);
    } else if (nodeType == 1) {
      if (childNode.hasAttribute("data-l10n-name")) {
        let l10nName = childNode.getAttribute("data-l10n-name");
        if (sourceNodes.has(l10nName)) {
          let targetNode = sourceNodes.get(l10nName);
          sourceNodes.delete(l10nName);
          if (childNode.nodeName.toLowerCase() !== targetNode.nodeName.toLowerCase()) {
            errors.push([ERROR_CODES.NAMED_ELEMENTS_DIFFER_IN_TYPE]);
          let textNode = childNode.ownerDocument.createTextNode(childNode.textContent);
          node.appendChild(textNode);
          } else {
            translateElement(targetNode, childNode, errors);
            node.appendChild(targetNode);
          }
          translationDOM.removeChild(childNode);
        } else {
          errors.push([ERROR_CODES.UNACCOUNTED_L10NNAME, {
            name: l10nName
          }]);
          translationDOM.removeChild(childNode);
          let textNode = childNode.ownerDocument.createTextNode(childNode.textContent);
          node.appendChild(textNode);
        }
      } else if (TEXT_LEVEL_ELEMENTS.includes(nodeName) || allowedElements.has(childNode)) {
        sanitizeElement(childNode, allowedElements, errors);
        node.appendChild(childNode);
      } else {
        errors.push([ERROR_CODES.ILLEGAL_ELEMENT, {
          name: nodeName
        }]);
        translationDOM.removeChild(childNode);
        let textNode = childNode.ownerDocument.createTextNode(childNode.textContent);
        node.appendChild(textNode);
      }
    }
  }
  return errors;
}

exports.translateNode = translateNode;
