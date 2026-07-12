import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("app.js", "utf8").replace(
  "window.FoodTimeApp = {",
  "window.__notificationTest = { loadNotificationSettings, notificationSummary }; window.FoodTimeApp = {",
);

const storage = new Map([
  ["foodtime.notificationSettings.v1", JSON.stringify({
    dailyTimes: ["09:00", "15:00", "20:00"],
    emergencySchedule: [720, 360, 180, 90, 45, 30],
    emergencyDays: 3,
    delayDays: 1,
  })],
]);

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

const api = context.window.__notificationTest;
const migrated = api.loadNotificationSettings();
if (migrated.intervalValue !== 6 || migrated.intervalUnit !== "小时") {
  throw new Error(`old settings did not migrate to the default interval: ${JSON.stringify(migrated)}`);
}
if ("dailyTimes" in migrated || "emergencySchedule" in migrated) {
  throw new Error(`legacy reminder settings are still exposed: ${JSON.stringify(migrated)}`);
}

const summary = api.notificationSummary({ emergencyDays: 2, delayDays: 1, intervalValue: 1, intervalUnit: "天" });
if (summary !== "2 天内，每隔 1 天提醒") throw new Error(`unexpected summary: ${summary}`);

const java = fs.readFileSync("app/src/main/java/com/foodtime/app/FoodTimeNotificationScheduler.java", "utf8");
for (const legacy of ["static final String ACTION_DAILY", "handleDaily(", "scheduleDaily(", "EMERGENCY_INTERVALS", "LEVEL_PREFIX"]) {
  if (java.includes(legacy)) throw new Error(`legacy native reminder logic remains: ${legacy}`);
}
for (const required of [
  "intervalValue",
  "intervalUnit",
  "intervalMillis()",
  '"active".equals',
  "emergencyStartMillis(settings.emergencyDays) <= now",
  "setExactAndAllowWhileIdle",
  "canScheduleExactAlarms",
  ".commit()",
]) {
  if (!java.includes(required)) throw new Error(`new native reminder logic is incomplete: ${required}`);
}

const manifest = fs.readFileSync("app/src/main/AndroidManifest.xml", "utf8");
if (!manifest.includes("android.permission.SCHEDULE_EXACT_ALARM")) {
  throw new Error("exact alarm permission is missing from the Android manifest");
}

const activity = fs.readFileSync("app/src/main/java/com/foodtime/app/MainActivity.java", "utf8");
for (const required of ["ACTION_REQUEST_SCHEDULE_EXACT_ALARM", "requestExactAlarmPermissionIfNeeded", "restoreSchedules(this)"]) {
  if (!activity.includes(required)) throw new Error(`exact alarm permission flow is incomplete: ${required}`);
}

console.log("Notification settings migration and native interval checks passed.");
