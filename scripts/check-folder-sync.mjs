import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("app.js", "utf8").replace(
  "window.FoodTimeApp = {",
  `window.__folderSyncTest = {
    existingFolders,
    saveFolderNames,
    loadFolderChanges,
    saveFolderChanges,
    mergeFolderChanges,
    setFolderState,
    syncPayload,
  }; window.FoodTimeApp = {`,
);

const storage = new Map();
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
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
  console,
  setTimeout,
  clearTimeout,
};
context.window.window = context.window;
vm.runInNewContext(source, context);

const api = context.window.__folderSyncTest;
api.setFolderState("零食", false);
api.saveFolderNames(["默认", "零食"], { skipSync: true });
if (!api.existingFolders().includes("零食")) throw new Error("active folder is missing");

api.setFolderState("零食", true);
api.saveFolderNames(["默认"], { skipSync: true });
if (api.existingFolders().includes("零食")) throw new Error("deleted folder remains locally");

api.saveFolderNames(["默认", "零食"], { skipSync: true });
if (api.existingFolders().includes("零食")) throw new Error("old remote folder resurrected");

const payload = api.syncPayload();
const tombstone = payload.folderChanges.find((change) => change.name === "零食");
if (!tombstone?.deleted) throw new Error("deletion state missing from sync payload");

const restoredAt = new Date(Date.now() + 1000).toISOString();
api.saveFolderChanges(api.mergeFolderChanges(api.loadFolderChanges(), [
  { name: "零食", deleted: false, updatedAt: restoredAt },
]));
api.saveFolderNames(["默认", "零食"], { skipSync: true });
if (!api.existingFolders().includes("零食")) throw new Error("newer folder restore was ignored");

console.log("Folder deletion tombstone and newer restore checks passed.");
