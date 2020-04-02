import type Spec from './Spec';

import * as jsdom from 'jsdom';
import * as chalk from 'chalk';
import * as emd from 'ecmarkdown';
import * as fs from 'fs';

/*@internal*/
export function emdTextNode(spec: Spec, node: Node) {
  // emd strips starting and ending spaces which we want to preserve
  const startSpace = node.textContent!.match(/^\s*/)![0];
  const endSpace = node.textContent!.match(/\s*$/)![0];

  const template = spec.doc.createElement('template');
  template.innerHTML = startSpace + emd.fragment(node.textContent!) + endSpace;

  replaceTextNode(node, template.content);
}


/*@internal*/
export function htmlToDom(html: string) {
  return new (jsdom as any).JSDOM(html, { includeNodeLocations: true });
}

/*@internal*/
export function domWalkBackward(root: Node, cb: (node: Element) => boolean | undefined) {
  const childNodes = root.childNodes;
  const childLen = childNodes.length;

  for (let i = childLen - 1; i >= 0; i--) {
    const node = childNodes[i];
    if (node.nodeType !== 1) continue;

    const cont = cb(node as Element);
    if (cont === false) continue;

    domWalkBackward(node, cb);
  }
}

/*@internal*/
export function replaceTextNode(node: Node, frag: DocumentFragment) {
  // Append all the nodes
  const parent = node.parentNode;
  if (!parent) return [];

  const newXrefNodes = Array.from(frag.querySelectorAll('EMU-XREF'));
  const first = frag.childNodes[0];

  if (first.nodeType === 3) {
    node.textContent = first.textContent;
    frag.removeChild(first);
  } else {
    // set it to empty because we don't want to break iteration
    // (I think it should work to delete it... investigate possible jsdom bug)
    node.textContent = '';
  }

  parent.insertBefore(frag, node.nextSibling);

  return newXrefNodes;
}

/*@internal*/
export function logVerbose(str: string) {
  let dateString = (new Date()).toISOString();
  console.log(chalk.gray('[' + dateString + '] ') + str);
}

/*@internal*/
export function logWarning(str: string) {
  let dateString = (new Date()).toISOString();
  console.log(chalk.gray('[' + dateString + '] ') + chalk.red('Warning: ' + str));
}

/*@internal*/
export function shouldInline(node: Node) {
  let parent = node.parentNode;
  if (!parent) return false;

  while (parent && parent.parentNode &&
    (parent.nodeName === 'EMU-GRAMMAR' || parent.nodeName === 'EMU-IMPORT' || parent.nodeName === 'INS' || parent.nodeName === 'DEL')
  ) {
    parent = parent.parentNode;
  }

  return ['EMU-ANNEX', 'EMU-CLAUSE', 'EMU-INTRO', 'EMU-NOTE', 'BODY'].indexOf(parent.nodeName) === -1;
}

/*@internal*/
export function readFile(file: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => err ? reject(err) : resolve(data));
  });
}

/*@internal*/
export function writeFile(file: string, content: string) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(file, content, { encoding: 'utf8' }, err => err ? reject(err) : resolve());
  });
}

/*@internal*/
export async function copyFile(src: string, dest: string) {
  const content = await readFile(src);
  await writeFile(dest, content);
}
