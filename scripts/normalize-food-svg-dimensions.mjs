import fs from "node:fs";
import path from "node:path";

const iconDirectories = [
  path.resolve("icons"),
  path.resolve("app", "src", "main", "assets", "icons"),
];

let changed = 0;

for (const directory of iconDirectories) {
  for (const file of fs.readdirSync(directory)) {
    if (!/^food-.*\.svg$/i.test(file)) continue;
    const filePath = path.join(directory, file);
    const source = fs.readFileSync(filePath, "utf8");
    const normalized = source.replace(/<svg\b[^>]*>/i, (tag) => {
      let next = tag.replace(/\s+(?:width|height)="[^"]*"/gi, "");
      if (!/\soverflow=/i.test(next)) next = next.replace("<svg", '<svg overflow="hidden"');
      return next;
    });
    if (normalized === source) continue;
    fs.writeFileSync(filePath, normalized);
    changed += 1;
  }
}

console.log(`Normalized ${changed} food SVG files.`);
