#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, "..");
const KEEP = new Set(["neue-auftrag.html", "auftragsdetail.html"]);
const TAG = '<script type="module" src="./js/init-unsaved-modal.js"></script>';

async function walk(dir, out = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (
      e.name.startsWith(".") ||
      ["tools", "img", "js", "style", "components"].includes(e.name)
    ) {
      if (!e.isDirectory()) continue;
    }
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of await walk(FRONTEND)) {
  let html = await fs.readFile(file, "utf8"),
    orig = html;
  const name = path.basename(file);
  if (KEEP.has(name)) {
    if (!html.includes(TAG))
      html = html.replace(/<\/body>/i, `  ${TAG}\n</body>`);
  } else {
    html = html.replace(
      new RegExp(TAG.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      ""
    );
  }
  if (html !== orig) {
    await fs.writeFile(file, html);
    changed++;
  }
}
console.log(`Updated ${changed} HTML file(s).`);
