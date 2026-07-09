import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const root = path.dirname(fileURLToPath(import.meta.url));
const html = path.join(root, "foodtime-redesign.html");
const outDir = path.join(root, "foodtime-redesign-renders");

const screens = [
  "01-home",
  "02-profile",
  "03-sheet",
  "04-home-empty",
  "05-add",
  "06-settings",
  "07-fridge",
  "08-room-empty",
  "09-history-empty",
];

await mkdir(outDir, { recursive: true });

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({
  viewport: { width: 921, height: 2048 },
  deviceScaleFactor: 1,
});

for (const screen of screens) {
  const url = `${pathToFileURL(html).href}?screen=${screen}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".active-screen").screenshot({
    path: path.join(outDir, `${screen}.png`),
  });
}

await browser.close();
console.log(outDir);
