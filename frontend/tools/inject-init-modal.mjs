#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "frontend");
const EXTS = /\.html?$/i;
const IGN = new Set(["node_modules", "dist", "build", ".git", ".cache"]);

const CSS1 = '<link rel="stylesheet" href="./style/icons.css">';
const CSS2 = '<link rel="stylesheet" href="./style/unsaved-changes-modal.css">';
const JS = '<script type="module" src="./js/init-unsaved-modal.js"></script>';

async function walk(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (IGN.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (EXTS.test(p)) out.push(p);
  }
  return out;
}

function ensureHeadLinks(html) {
  if (!html.includes(CSS1))
    html = html.replace(/<\/head>/i, `  ${CSS1}\n</head>`);
  if (!html.includes(CSS2))
    html = html.replace(/<\/head>/i, `  ${CSS2}\n</head>`);
  return html;
}
function ensureBodyScript(html) {
  if (!html.includes(JS)) html = html.replace(/<\/body>/i, `  ${JS}\n</body>`);
  return html;
}

let changed = 0;
for (const file of await walk(ROOT)) {
  let txt = await fs.readFile(file, "utf8");
  const orig = txt;
  txt = ensureHeadLinks(txt);
  txt = ensureBodyScript(txt);
  if (txt !== orig) {
    await fs.writeFile(file, txt);
    changed++;
  }
}
console.log(`Injected into ${changed} HTML file(s).`);
