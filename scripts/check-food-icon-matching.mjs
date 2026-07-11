import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("app.js", "utf8").replace(
  "window.FoodTimeApp = {",
  "window.__foodIconDefForName = foodIconDefForName; window.__foodIconSrc = foodIconSrc; window.__thumbMarkup = thumbMarkup; window.FoodTimeApp = {",
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
  ["茄皇方便面", "icons/food-noodle.svg"],
  ["燕麦", "icons/food-cereal.svg"],
  ["各种面粉", "icons/food-bread.svg"],
  ["面粉", "icons/food-bread.svg"],
  ["饼", "icons/food-pancake.svg"],
  ["豆芽", "icons/food-greens.svg"],
  ["菜花", "icons/food-broccoli.svg"],
  ["胡豆", "icons/food-peas.svg"],
]);

for (const [name, expected] of cases) {
  const actual = context.window.__foodIconDefForName(name)?.file;
  if (actual !== expected) throw new Error(`${name}: expected ${expected}, received ${actual}`);
  if (!fs.existsSync(actual)) throw new Error(`${name}: missing file ${actual}`);
  console.log(`${name} -> ${actual}`);
}

const correctedLegacyIcon = context.window.__foodIconSrc({
  name: "各种面粉",
  type: "bread",
  icon: "icons/food-noodle.svg",
});
if (correctedLegacyIcon !== "icons/food-bread.svg") {
  throw new Error(`legacy icon was not corrected: ${correctedLegacyIcon}`);
}
console.log(`历史错误图标 -> ${correctedLegacyIcon}`);

const noodleMarkup = context.window.__thumbMarkup({ name: "茄皇方便面", type: "bread", icon: "icons/food-noodle.svg" });
if (noodleMarkup.includes("<img")) throw new Error(`bundled SVG still uses an img element: ${noodleMarkup}`);
if (!noodleMarkup.includes("--food-icon") || !noodleMarkup.includes("20260711-type-class-v7")) {
  throw new Error(`bundled SVG background is not versioned: ${noodleMarkup}`);
}
console.log("内置 SVG 使用固定背景格渲染。");

for (const name of ["茄皇方便面", "燕麦", "面粉", "饼"]) {
  const markup = context.window.__thumbMarkup({ name, type: "bread" });
  const classNames = markup.match(/class="([^"]+)"/)?.[1].split(/\s+/) || [];
  if (!classNames.includes("food-type-bread")) throw new Error(`${name} missing namespaced type class: ${markup}`);
  if (classNames.includes("bread")) throw new Error(`${name} still collides with the decorative bread class: ${markup}`);
}
console.log("列表类型 class 已与插画样式隔离。");
