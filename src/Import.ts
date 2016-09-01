import utils = require('./utils');
import Path = require('path');
import Builder = require('./Builder');
var __awaiter = require("./awaiter");

/*@internal*/
class Import extends Builder {
  async build(rootDir: string) {
    const href = this.node.getAttribute('href');
    const importPath = Path.join(rootDir || this.spec.rootDir, href);
    this.spec.imports.push(importPath);

    const html = await this.spec.fetch(importPath);
    const importDoc = await utils.htmlToDoc(html);
    const nodes = importDoc.body.childNodes;
    const parent = this.node.parentNode;
    const frag = this.spec.doc.createDocumentFragment();

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const importedNode = this.spec.doc.importNode(node, true);
      frag.appendChild(importedNode);
    }

    const imports = frag.querySelectorAll('emu-import') as NodeListOf<HTMLElement>;
    this.node.appendChild(frag);

    await this.spec.buildAll(imports, Import, { buildArgs: [Path.dirname(importPath)] });
  }
}

/*@internal*/
export = Import;