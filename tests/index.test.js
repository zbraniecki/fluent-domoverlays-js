const { translateNode } = require("../src/index");
const { JSDOM } = require("jsdom");

const { document } = (new JSDOM(`<html/>`)).window;

function parseDOM(s) {
  return JSDOM.fragment(s);
}

function expectNode(node, dom) {
  expect(node.outerHTML).toBe(dom);
}

test("apply value", () => {
  let node = document.createElement("div"); 
  translateNode(node, "Foo", parseDOM);
  expectNode(node, "<div>Foo</div>");
});

test("handle text level semantics", () => {
  let node = document.createElement("div"); 
  translateNode(node, "<em>mr.</em> LaCroix", parseDOM);
  expectNode(node, "<div><em>mr.</em> LaCroix</div>");
});

test("reject illegal elements", () => {
  let node = document.createElement("div"); 
  expect(() => translateNode(node, "<a>mr.</a> LaCroix")).toThrowError(Error);
});
