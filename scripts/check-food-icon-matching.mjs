import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("app.js", "utf8").replace(
  "window.FoodTimeApp = {",
  "window.__foodIconDefForName = foodIconDefForName; window.FoodTimeApp = {",
);

const context = {
  window: {
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    setTimeout,
    clearTimeout,
  },
  document: {
    readyState: "loading",
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    documentElement: { classList: { contains: () => false, add() {}, remove() {}, toggle() {} } },
  },
  navigator: { userAgent: "" },
  localStorage: {
    getItem: () => null,
    setItem() {},
    removeItem() {},
  },
  console,
  setTimeout,
  clearTimeout,
};
context.window.window = context.window;
vm.runInNewContext(source, context);

const cases = new Map([
  ["饺子皮", "icons/food-dumpling.svg"],
  ["白菜猪肉饺子", "icons/food-dumpling.svg"],
  ["牛肉面", "icons/food-noodle.svg"],
  ["鱼豆腐", "icons/food-tofu.svg"],
  ["番茄炒蛋", "icons/food-tomato-egg.svg"],
  ["西红柿炒鸡蛋", "icons/food-tomato-egg.svg"],
  ["蛋炒饭", "icons/food-fried-rice.svg"],
  ["鸡胸肉", "icons/food-chicken-cut.svg"],
  ["小笼包", "icons/food-bun.svg"],
  ["排骨汤", "icons/food-soup.svg"],
  ["娃娃菜", "icons/food-cabbage.svg"],
  ["哈密瓜", "icons/food-melon.svg"],
]);

for (const [name, expected] of cases) {
  const actual = context.window.__foodIconDefForName(name)?.file;
  if (actual !== expected) throw new Error(`${name}: expected ${expected}, received ${actual}`);
  if (!fs.existsSync(actual)) throw new Error(`${name}: missing file ${actual}`);
  console.log(`${name} -> ${actual}`);
}
