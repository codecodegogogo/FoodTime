import fs from "node:fs";
import path from "node:path";

const COLLECTION_ID = 43742;
const ROOT_DIR = process.cwd();
const ROOT_ICON_DIR = path.join(ROOT_DIR, "icons");
const ASSET_ICON_DIR = path.join(ROOT_DIR, "app", "src", "main", "assets", "icons");
const MANIFEST_FILES = [
  path.join(ROOT_ICON_DIR, "iconfont-manifest.json"),
  path.join(ASSET_ICON_DIR, "iconfont-manifest.json"),
];

const collectionImports = [
  { id: 34137095, file: "food-pudding.svg", keywords: ["布丁", "果冻"] },
  { id: 34137100, file: "food-mustard.svg", keywords: ["芥末", "芥末酱"] },
  { id: 34137107, file: "food-hamburger.svg", keywords: ["汉堡", "汉堡包"] },
  { id: 34137112, file: "food-croissant.svg", keywords: ["牛角包", "可颂"] },
  { id: 34137120, file: "food-peas.svg", keywords: ["豌豆", "青豆"] },
  { id: 34137122, file: "food-sushi.svg", keywords: ["寿司"] },
  { id: 34137127, file: "food-donut.svg", keywords: ["甜甜圈"] },
  { id: 34137129, file: "food-eggplant.svg", keywords: ["茄子"] },
  { id: 34137131, file: "food-cookie.svg", keywords: ["曲奇", "曲奇饼干"] },
  { id: 34137132, file: "food-cupcake.svg", keywords: ["纸杯蛋糕", "杯子蛋糕"] },
  { id: 34137133, file: "food-melon.svg", keywords: ["甜瓜", "哈密瓜", "香瓜"] },
];

const searchImports = [
  { query: "饺子", id: 3874542, file: "food-dumpling.svg", keywords: ["饺子皮", "饺子", "水饺", "蒸饺", "锅贴"] },
  { query: "包子", id: 3869426, file: "food-bun.svg", keywords: ["包子", "肉包", "菜包", "小笼包", "灌汤包", "馒头"] },
  { query: "米饭", id: 5184509, file: "food-rice.svg", keywords: ["米饭", "白米饭", "大米饭", "剩饭"] },
  { query: "面条", id: 5184713, file: "food-noodle.svg", keywords: ["面条", "挂面", "拉面", "方便面", "泡面", "米线", "粉丝", "粉条"] },
  { query: "豆腐", id: 47040084, file: "food-tofu.svg", keywords: ["豆腐", "豆干", "香干", "千张", "豆皮"] },
  { query: "鱼", id: 1713580, file: "food-fish.svg", keywords: ["鱼", "鱼肉", "鲫鱼", "鲈鱼", "草鱼", "带鱼"] },
  { query: "虾", id: 1404288, file: "food-shrimp.svg", keywords: ["虾", "大虾", "基围虾", "虾仁"] },
  { query: "白菜", id: 3195578, file: "food-cabbage.svg", keywords: ["白菜", "大白菜", "娃娃菜"] },
  { query: "猪肉", id: 7826835, file: "food-pork.svg", keywords: ["猪肉", "五花肉", "里脊", "肉馅"] },
  { query: "牛肉", id: 47040074, file: "food-beef.svg", keywords: ["牛肉", "牛排", "肥牛"] },
  { query: "排骨", id: 47040060, file: "food-ribs.svg", keywords: ["排骨", "肋排", "小排"] },
  { query: "青菜", id: 47040057, file: "food-greens.svg", keywords: ["青菜", "上海青", "油菜", "菜心"] },
  { query: "鸡肉", id: 47040067, file: "food-chicken-cut.svg", keywords: ["鸡肉", "鸡胸", "鸡胸肉"] },
  { query: "火锅", id: 3869518, file: "food-hotpot.svg", keywords: ["火锅", "涮锅"] },
  { query: "汤", id: 4185104, file: "food-soup.svg", keywords: ["汤", "鸡汤", "骨头汤", "排骨汤", "紫菜汤"] },
  { query: "炒饭", id: 40195949, file: "food-fried-rice.svg", keywords: ["炒饭", "蛋炒饭", "扬州炒饭"] },
  { query: "番茄炒蛋", id: 20861386, file: "food-tomato-egg.svg", keywords: ["番茄炒蛋", "西红柿炒鸡蛋"] },
];

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  const payload = await response.json();
  if (payload.code !== 200) throw new Error(payload.message || `Iconfont error: ${url}`);
  return payload.data;
}

function cleanSvg(showSvg) {
  const viewBox = showSvg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 1024 1024";
  const inner = showSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<svg overflow="hidden" viewBox="${viewBox}" version="1.1" xmlns="http://www.w3.org/2000/svg">${inner}</svg>\n`;
}

function writeIcon(file, svg) {
  fs.writeFileSync(path.join(ROOT_ICON_DIR, file), svg);
  fs.writeFileSync(path.join(ASSET_ICON_DIR, file), svg);
}

const collection = await fetchJson(`https://www.iconfont.cn/api/collection/detail.json?id=${COLLECTION_ID}`);
const collectionById = new Map(collection.icons.map((icon) => [icon.id, icon]));
const imported = [];

for (const item of collectionImports) {
  const icon = collectionById.get(item.id);
  if (!icon) throw new Error(`Collection icon not found: ${item.id}`);
  writeIcon(item.file, cleanSvg(icon.show_svg));
  imported.push({ ...item, name: icon.name, source: `iconfont.cn collection ${COLLECTION_ID}` });
}

for (const item of searchImports) {
  const body = new URLSearchParams({
    q: item.query,
    page: "1",
    pageSize: "20",
    fromCollection: "-1",
    sortType: "updated_at",
  });
  const result = await fetchJson("https://www.iconfont.cn/api/icon/search.json", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const icon = result.icons.find((candidate) => candidate.id === item.id);
  if (!icon) throw new Error(`Search icon not found: ${item.id} (${item.query})`);
  writeIcon(item.file, cleanSvg(icon.show_svg));
  imported.push({ ...item, name: icon.name, source: `iconfont.cn repository ${icon.repositorie_id}` });
}

for (const manifestFile of MANIFEST_FILES) {
  let manifest = [];
  try {
    manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  } catch {
    manifest = [];
  }
  const importedFiles = new Set(imported.map((item) => item.file));
  const retained = manifest.filter((item) => !importedFiles.has(item.file));
  const entries = imported.map(({ id, file, name, keywords, source }) => ({
    id,
    file,
    name,
    keyword: keywords.join("、"),
    source,
  }));
  fs.writeFileSync(manifestFile, `${JSON.stringify([...retained, ...entries], null, 2)}\n`);
}

console.log(`Imported ${imported.length} Iconfont food SVGs.`);
