const { TEXT_LEVEL_ELEMENTS } = require("./whitelist");

const reOverlay = /<|&#?\w+;/;

function translateElement(elem, translation) {
  for(var i = 0; i < translation.attributes.length - 1; i++) {
    let attr = translation.attributes[i];
    elem.setAttribute(attr.name, attr.value);
  }
  elem.textContent = translation.textContent;
}

function translateNode(node, translation, parseDOM) {
  if (!reOverlay.test(translation)) {
    if (node.childNodes.length) {
      throw new Error("Cannot apply simple translation on a node with child nodes.");
    }
    node.textContent = translation;
    return;
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

  let sourceElements = new Set();
  while (node.firstChild) {
    sourceElements.add(node.firstChild);
    node.removeChild(node.firstChild);
  }

  while (translationDOM.childNodes.length) {
    let childNode = translationDOM.childNodes[0];
    let nodeName = childNode.nodeName.toLowerCase();
    let nodeType = childNode.nodeType;
    if (nodeType == 3 || TEXT_LEVEL_ELEMENTS.includes(nodeName)) {
      node.appendChild(childNode);
    } else if (nodeType == 1) {
      let l10nName = childNode.getAttribute("data-l10n-name");
      if (sourceNodes.has(l10nName)) {
        let targetNode = sourceNodes.get(l10nName);
        translateElement(targetNode, childNode);
        node.appendChild(targetNode);
        translationDOM.removeChild(childNode);
      } else {
        throw new Error(`No such l10nName in the source: ${l10nName}`);
      }
    } else {
      throw new Error(`Illegal element: ${nodeName}`);
    }
  }
}

exports.translateNode = translateNode;
