(function () {
  const STORAGE_KEY = "foodtime.foods.v1";
  const SYNC_SETTINGS_KEY = "foodtime.syncSettings.v1";
  const SYNC_LAST_AT_KEY = "foodtime.syncLastAt.v1";
  const CLEAR_ALL_AT_KEY = "foodtime.clearAllAt.v1";
  const THEME_SETTINGS_KEY = "foodtime.themeSettings.v1";
  const NOTIFICATION_SETTINGS_KEY = "foodtime.notificationSettings.v1";
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const PHOTO_THUMB_MAX_SIDE = 160;
  const PHOTO_THUMB_MIN_SIDE = 96;
  const PHOTO_THUMB_QUALITY = 0.24;
  const PHOTO_SYNC_MAX_CHARS = 28000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const screens = {
    home: ".phone-home:not(.phone-home-sheet)",
    homeSheet: ".phone-home-sheet",
    add: ".phone-add",
    stats: ".phone-stats",
    profile: ".phone-profile",
    settings: ".phone-settings",
    syncSettings: ".phone-sync-settings",
    themeSettings: ".phone-theme-settings",
    notificationSettings: ".phone-notification-settings",
    history: ".phone-history",
    fridge: ".phone-fridge-records",
    room: ".phone-room-records",
  };

  const FOOD_ICON_DEFS = [
    {
      type: "milk",
      file: "icons/food-milk.svg",
      keywords: ["奶", "牛奶", "鲜奶", "酸奶", "奶酪", "芝士", "黄油", "豆浆", "燕麦", "饮料", "果汁"],
    },
    {
      type: "chicken",
      file: "icons/food-meat.svg",
      keywords: ["鸡", "鸡胸", "鸡肉", "肉", "猪", "牛", "羊", "鱼", "虾", "海鲜", "蛋", "鸡蛋", "排骨", "火腿", "香肠", "培根"],
    },
    {
      type: "bread",
      file: "icons/food-bread.svg",
      keywords: ["面包", "吐司", "蛋糕", "饼", "包子", "馒头", "米饭", "面条", "饺子", "馄饨", "披萨", "粉"],
    },
    {
      type: "berry",
      file: "icons/food-berry.svg",
      keywords: ["草莓", "蓝莓", "莓", "樱桃", "苹果", "梨", "香蕉", "葡萄", "橙", "橘", "桃", "芒果", "西瓜", "柠檬", "番茄", "西红柿", "黄瓜", "青菜", "蔬菜", "生菜", "菠菜", "白菜", "土豆", "胡萝卜", "玉米", "豆"],
    },
  ];

  const FOOD_ICON_ALIASES = [
    { type: "berry", file: "icons/food-strawberry.svg", keywords: ["草莓"] },
    { type: "berry", file: "icons/food-apple.svg", keywords: ["苹果", "青苹果"] },
    { type: "berry", file: "icons/food-banana.svg", keywords: ["香蕉"] },
    { type: "berry", file: "icons/food-grape.svg", keywords: ["葡萄", "提子"] },
    { type: "berry", file: "icons/food-orange.svg", keywords: ["橙", "橙子", "橘", "橘子"] },
    { type: "berry", file: "icons/food-pear.svg", keywords: ["梨", "香梨"] },
    { type: "berry", file: "icons/food-peach.svg", keywords: ["桃", "桃子"] },
    { type: "berry", file: "icons/food-mango.svg", keywords: ["芒果"] },
    { type: "berry", file: "icons/food-watermelon.svg", keywords: ["西瓜"] },
    { type: "berry", file: "icons/food-lemon.svg", keywords: ["柠檬"] },
    { type: "berry", file: "icons/food-cherry.svg", keywords: ["樱桃", "车厘子"] },
    { type: "berry", file: "icons/food-blueberry.svg", keywords: ["蓝莓"] },
    { type: "berry", file: "icons/food-kiwi.svg", keywords: ["猕猴桃", "奇异果"] },
    { type: "berry", file: "icons/food-pineapple.svg", keywords: ["菠萝", "凤梨"] },
    { type: "berry", file: "icons/food-lychee.svg", keywords: ["荔枝"] },
    { type: "berry", file: "icons/food-plum.svg", keywords: ["李子", "梅子"] },
    { type: "berry", file: "icons/food-tomato.svg", keywords: ["番茄", "西红柿"] },
    { type: "berry", file: "icons/food-cucumber.svg", keywords: ["黄瓜"] },
    { type: "berry", file: "icons/food-lettuce.svg", keywords: ["生菜", "油麦菜"] },
    { type: "berry", file: "icons/food-spinach.svg", keywords: ["菠菜"] },
    { type: "berry", file: "icons/food-cabbage.svg", keywords: ["白菜", "包菜", "卷心菜"] },
    { type: "berry", file: "icons/food-potato.svg", keywords: ["土豆", "马铃薯"] },
    { type: "berry", file: "icons/food-carrot.svg", keywords: ["胡萝卜"] },
    { type: "berry", file: "icons/food-corn.svg", keywords: ["玉米"] },
    { type: "berry", file: "icons/food-broccoli.svg", keywords: ["西兰花"] },
    { type: "berry", file: "icons/food-onion.svg", keywords: ["洋葱"] },
    { type: "berry", file: "icons/food-mushroom.svg", keywords: ["蘑菇", "香菇", "菌菇"] },
    { type: "berry", file: "icons/food-pumpkin.svg", keywords: ["南瓜"] },
    { type: "berry", file: "icons/food-avocado.svg", keywords: ["牛油果"] },
    { type: "berry", file: "icons/food-pepper.svg", keywords: ["辣椒", "彩椒", "青椒"] },
    { type: "milk", file: "icons/food-fresh-milk.svg", keywords: ["鲜牛奶", "牛奶", "奶"] },
    { type: "milk", file: "icons/food-yogurt.svg", keywords: ["酸奶"] },
    { type: "milk", file: "icons/food-cheese.svg", keywords: ["奶酪", "芝士"] },
    { type: "milk", file: "icons/food-butter.svg", keywords: ["黄油"] },
    { type: "milk", file: "icons/food-soy-milk.svg", keywords: ["豆浆"] },
    { type: "chicken", file: "icons/food-egg.svg", keywords: ["鸡蛋", "蛋"] },
    { type: "chicken", file: "icons/food-chicken.svg", keywords: ["鸡肉", "鸡胸", "鸡腿", "鸡翅", "鸡"] },
    { type: "chicken", file: "icons/food-fish.svg", keywords: ["鱼", "鱼肉"] },
    { type: "chicken", file: "icons/food-shrimp.svg", keywords: ["虾"] },
    { type: "chicken", file: "icons/food-pork.svg", keywords: ["猪肉", "五花肉"] },
    { type: "chicken", file: "icons/food-beef.svg", keywords: ["牛肉"] },
    { type: "chicken", file: "icons/food-lamb.svg", keywords: ["羊肉"] },
    { type: "chicken", file: "icons/food-ribs.svg", keywords: ["排骨"] },
    { type: "chicken", file: "icons/food-sausage.svg", keywords: ["香肠", "腊肠"] },
    { type: "chicken", file: "icons/food-ham.svg", keywords: ["火腿"] },
    { type: "chicken", file: "icons/food-bacon.svg", keywords: ["培根"] },
    { type: "bread", file: "icons/food-bread.svg", keywords: ["面包"] },
    { type: "bread", file: "icons/food-toast.svg", keywords: ["吐司"] },
    { type: "bread", file: "icons/food-cake.svg", keywords: ["蛋糕"] },
    { type: "bread", file: "icons/food-bun.svg", keywords: ["包子", "馒头"] },
    { type: "bread", file: "icons/food-rice.svg", keywords: ["米饭", "剩饭"] },
    { type: "bread", file: "icons/food-noodle.svg", keywords: ["面条", "面"] },
    { type: "bread", file: "icons/food-dumpling.svg", keywords: ["饺子", "馄饨"] },
    { type: "bread", file: "icons/food-pizza.svg", keywords: ["披萨"] },
    { type: "bread", file: "icons/food-pancake.svg", keywords: ["饼", "煎饼"] },
    { type: "bread", file: "icons/food-cereal.svg", keywords: ["麦片", "燕麦"] },
    { type: "bread", file: "icons/food-tofu.svg", keywords: ["豆腐"] },
    { type: "bread", file: "icons/food-chocolate.svg", keywords: ["巧克力"] },
    { type: "milk", file: "icons/food-juice.svg", keywords: ["果汁", "饮料"] },
    { type: "milk", file: "icons/food-icecream.svg", keywords: ["冰淇淋", "雪糕"] },
  ];

  let currentScreen = "home";
  let routeStack = ["home"];
  let currentHomeFilter = "全部";
  let currentHomeFolder = "全部";
  let homeFolderExpanded = false;
  let currentHistoryFilter = "已吃完";
  let selectedFoodId = null;
  let editingFoodId = null;
  let capturedPhoto = "";
  let syncTimer = 0;
  let syncInFlight = false;
  let syncQueued = false;
  let notificationTimer = 0;

  function nowIso() {
    return new Date().toISOString();
  }

  function formatClock(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatSyncMoment(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未同步";

    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((day - today) / ONE_DAY);
    const clock = formatClock(date);
    if (diff === 0) return `今天 ${clock}`;
    if (diff === -1) return `昨天 ${clock}`;
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${clock}`;
  }

  function foodTimestamp(food) {
    return food.updatedAt || food.handledAt || food.createdAt || food.purchaseDate || "1970-01-01T00:00:00.000Z";
  }

  function normalizeFood(food) {
    return {
      ...food,
      updatedAt: foodTimestamp(food),
    };
  }

  function normalizeFoods(foods) {
    return Array.isArray(foods) ? foods.map(normalizeFood) : [];
  }

  function screenElement(name) {
    return document.querySelector(screens[name]);
  }

  function allScreens() {
    return Object.values(screens)
      .map((selector) => document.querySelector(selector))
      .filter(Boolean);
  }

  function loadFoods() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeFoods(JSON.parse(saved));
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }

    return [];
  }

  function saveFoods(foods, options = {}) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeFoods(foods)));
    scheduleNativeNotifications();
    if (!options.skipSync) {
      scheduleSync();
    }
  }

  function syncSettingsReady(settings = loadSyncSettings()) {
    return Boolean(settings.webdavUrl && settings.account && settings.password && settings.remoteFile);
  }

  function nativeSyncAvailable() {
    return Boolean(window.FoodTimeNative && typeof window.FoodTimeNative.pull === "function");
  }

  function nativeNotificationsAvailable() {
    return Boolean(window.FoodTimeNative && typeof window.FoodTimeNative.updateNotificationPlan === "function");
  }

  function scheduleNativeNotifications(options = {}) {
    if (!nativeNotificationsAvailable()) return;
    window.clearTimeout(notificationTimer);
    notificationTimer = window.setTimeout(() => {
      window.FoodTimeNative.updateNotificationPlan(
        JSON.stringify(loadNotificationSettings()),
        JSON.stringify(syncPayload()),
      );
    }, options.immediate ? 0 : 500);
  }

  function syncServiceName(settings = loadSyncSettings()) {
    const url = String(settings.webdavUrl || "").toLowerCase();
    if (!url && !settings.account) return "当前服务：未设置";
    if (url.includes("jianguoyun")) return "当前服务：坚果云 WebDAV";
    if (url) return "当前服务：WebDAV";
    return "当前服务：未完成设置";
  }

  function defaultSyncTimeLine(settings = loadSyncSettings()) {
    if (!syncSettingsReady(settings)) return "同步时间：未设置";

    const lastSyncAt = localStorage.getItem(SYNC_LAST_AT_KEY);
    if (lastSyncAt) return `同步时间：${formatSyncMoment(lastSyncAt)}`;
    return nativeSyncAvailable() ? "同步时间：尚未同步" : "同步时间：需在 APK 中执行";
  }

  function syncTimeLineFromMessage(message) {
    if (!message) return defaultSyncTimeLine();
    if (message.includes("同步中")) return "同步时间：正在同步";
    if (message.startsWith("已同步")) return defaultSyncTimeLine();
    if (message.includes("待设置") || message.includes("请先")) return "同步时间：待设置";
    if (message.includes("需在 APK")) return "同步时间：需在 APK 中执行";
    if (message.includes("失败")) return message;
    return message;
  }

  function renderSyncSummary(message = "") {
    const settings = loadSyncSettings();
    document.querySelectorAll(".sync-service-text").forEach((item) => {
      item.textContent = syncServiceName(settings);
    });
    document.querySelectorAll(".sync-time-text").forEach((item) => {
      item.textContent = syncTimeLineFromMessage(message);
    });
  }

  function updateSyncStatus(message) {
    document.querySelectorAll(".sync-status-text").forEach((item) => {
      item.textContent = message;
    });
    renderSyncSummary(message);
  }

  function syncPayload() {
    return {
      version: 1,
      updatedAt: nowIso(),
      clearedAt: localStorage.getItem(CLEAR_ALL_AT_KEY) || "",
      foods: loadFoods().map(foodForSync),
    };
  }

  function isEmbeddedPhoto(value) {
    return typeof value === "string" && value.startsWith("data:image/");
  }

  function minimalPhotoForSync(photo) {
    if (!isEmbeddedPhoto(photo)) return "";
    return photo.length <= PHOTO_SYNC_MAX_CHARS ? photo : "";
  }

  function foodForSync(food) {
    const item = normalizeFood(food);
    if (!item.photo) return item;

    const photo = minimalPhotoForSync(item.photo);
    if (photo) return { ...item, photo };
    return { ...item, photo: "", photoText: "" };
  }

  function parseRemotePayload(body) {
    if (!body) return { foods: [], clearedAt: "" };
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      return { foods: normalizeFoods(parsed), clearedAt: "" };
    }

    return {
      foods: normalizeFoods(parsed.foods),
      clearedAt: parsed.clearedAt || "",
    };
  }

  function mergeFoods(localFoods, remoteFoods) {
    const byId = new Map();

    [...normalizeFoods(localFoods), ...normalizeFoods(remoteFoods)].forEach((food) => {
      const current = byId.get(food.id);
      if (!current || Date.parse(foodTimestamp(food)) >= Date.parse(foodTimestamp(current))) {
        byId.set(food.id, food);
      }
    });

    return Array.from(byId.values()).sort((left, right) => Date.parse(foodTimestamp(right)) - Date.parse(foodTimestamp(left)));
  }

  function mergeRemotePayload(localFoods, remotePayload) {
    const localClearedAt = localStorage.getItem(CLEAR_ALL_AT_KEY) || "";
    const remoteClearedAt = remotePayload.clearedAt || "";
    const clearMillis = Math.max(Date.parse(localClearedAt) || 0, Date.parse(remoteClearedAt) || 0);
    if (clearMillis) {
      const clearIso = new Date(clearMillis).toISOString();
      if (clearIso !== localClearedAt) {
        localStorage.setItem(CLEAR_ALL_AT_KEY, clearIso);
      }
    }

    const afterClear = (food) => !clearMillis || (Date.parse(foodTimestamp(food)) || 0) > clearMillis;
    return mergeFoods(
      normalizeFoods(localFoods).filter(afterClear),
      normalizeFoods(remotePayload.foods).filter(afterClear),
    );
  }

  function scheduleSync(options = {}) {
    const settings = loadSyncSettings();
    if (!syncSettingsReady(settings)) {
      updateSyncStatus("本地数据 · WebDAV 同步待设置");
      return;
    }

    if (!nativeSyncAvailable()) {
      updateSyncStatus("同步设置已保存 · 需在 APK 中执行同步");
      return;
    }

    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(startSync, options.immediate ? 0 : 800);
  }

  function startSync() {
    const settings = loadSyncSettings();
    if (!syncSettingsReady(settings) || !nativeSyncAvailable()) return;

    if (syncInFlight) {
      syncQueued = true;
      return;
    }

    syncInFlight = true;
    updateSyncStatus("WebDAV 同步中...");
    window.FoodTimeNative.pull(JSON.stringify(settings));
  }

  function pushCloudPayload() {
    const settings = loadSyncSettings();
    if (!syncSettingsReady(settings) || !nativeSyncAvailable()) return;
    window.FoodTimeNative.push(JSON.stringify(settings), JSON.stringify(syncPayload()));
  }

  function handlePullResult(result) {
    if (!result.ok) {
      syncInFlight = false;
      updateSyncStatus(`同步失败 · ${result.message || "请检查 WebDAV 设置"}`);
      return;
    }

    if (!result.missing && result.body) {
      try {
        const merged = mergeRemotePayload(loadFoods(), parseRemotePayload(result.body));
        saveFoods(merged, { skipSync: true });
        renderAll();
      } catch (error) {
        syncInFlight = false;
        updateSyncStatus("同步失败 · 云端数据格式不正确");
        return;
      }
    }

    pushCloudPayload();
  }

  function handlePushResult(result) {
    syncInFlight = false;
    if (result.ok) {
      const syncedAt = nowIso();
      localStorage.setItem(SYNC_LAST_AT_KEY, syncedAt);
      updateSyncStatus(`已同步 · ${formatClock(syncedAt)}`);
    } else {
      updateSyncStatus(`同步失败 · ${result.message || "上传失败"}`);
    }

    if (syncQueued) {
      syncQueued = false;
      scheduleSync({ immediate: true });
    }
  }

  function onNativeSyncResult(result) {
    if (!result || !result.type) return;
    if (result.type === "pull") handlePullResult(result);
    if (result.type === "push") handlePushResult(result);
  }

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString || "";
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function daysStored(food) {
    const date = new Date(`${food.purchaseDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 0;
    return Math.max(0, Math.floor((today - date) / ONE_DAY));
  }

  function reminderAmount(value, fallback = 3) {
    const amount = Number.parseFloat(value);
    return Number.isFinite(amount) && amount > 0 ? amount : fallback;
  }

  function reminderUnit(value) {
    return ["分钟", "小时", "天", "星期", "月"].includes(value) ? value : "天";
  }

  function reminderMinutes(value, unit) {
    const amount = reminderAmount(value);
    const normalizedUnit = reminderUnit(unit);
    if (normalizedUnit === "分钟") return amount;
    if (normalizedUnit === "小时") return amount * 60;
    if (normalizedUnit === "星期") return amount * 7 * 24 * 60;
    if (normalizedUnit === "月") return amount * 30 * 24 * 60;
    return amount * 24 * 60;
  }

  function reminderDaysCompat(value, unit) {
    return Math.max(1, Math.ceil(reminderMinutes(value, unit) / (24 * 60)));
  }

  function foodReminderMinutes(food) {
    if (food.remindValue && food.remindUnit) {
      return reminderMinutes(food.remindValue, food.remindUnit);
    }
    return reminderMinutes(food.remindDays || 3, "天");
  }

  function foodPurchaseDateTime(food) {
    const date = new Date(food.purchaseAt || `${food.purchaseDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) return date;
    return new Date(`${food.purchaseDate}T00:00:00`);
  }

  function relativeExpiryLabel(remainingMs) {
    const absMs = Math.abs(remainingMs);
    if (absMs < 60 * 60 * 1000) return `${Math.max(1, Math.ceil(absMs / (60 * 1000)))} 分钟`;
    if (absMs < ONE_DAY) return `${Math.ceil(absMs / (60 * 60 * 1000))} 小时`;
    return `${Math.ceil(absMs / ONE_DAY)} 天`;
  }

  function remindInfo(food) {
    const purchasedAt = foodPurchaseDateTime(food);
    if (Number.isNaN(purchasedAt.getTime())) {
      return { label: "待计算", className: "safe", remaining: 0 };
    }

    const dueAt = new Date(purchasedAt.getTime() + foodReminderMinutes(food) * 60 * 1000);
    const remainingMs = dueAt - new Date();
    const remaining = Math.ceil(remainingMs / ONE_DAY);

    if (remainingMs < 0) {
      return { label: `已过期 ${relativeExpiryLabel(remainingMs)}`, className: "urgent", remaining };
    }
    if (remainingMs < 60 * 60 * 1000) {
      return { label: `${relativeExpiryLabel(remainingMs)}后到期`, className: "urgent", remaining };
    }
    if (remainingMs < ONE_DAY) {
      return { label: `${relativeExpiryLabel(remainingMs)}后到期`, className: "urgent", remaining };
    }

    const dueDay = new Date(dueAt);
    dueDay.setHours(0, 0, 0, 0);
    const dayRemaining = Math.ceil((dueDay - today) / ONE_DAY);
    if (dayRemaining === 0) return { label: "今天到期", className: "urgent", remaining: dayRemaining };
    if (dayRemaining === 1) return { label: "明天到期", className: "soon", remaining: dayRemaining };
    return { label: `${dayRemaining} 天后到期`, className: "safe", remaining: dayRemaining };
  }

  function classifyFood(name) {
    return foodIconDefForName(name).type;
  }

  function foodIconDefForName(name) {
    const normalized = String(name || "");
    const alias = FOOD_ICON_ALIASES.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
    if (alias) return alias;
    return FOOD_ICON_DEFS.find((item) => item.keywords.some((keyword) => normalized.includes(keyword))) || FOOD_ICON_DEFS[3];
  }

  function foodIconSrc(food) {
    if (food.icon) return food.icon;
    const namedIcon = foodIconDefForName(food.name);
    if (namedIcon?.file) return namedIcon.file;
    const type = food.type || classifyFood(food.name);
    return FOOD_ICON_DEFS.find((item) => item.type === type)?.file || FOOD_ICON_DEFS[3].file;
  }

  function thumbMarkup(food) {
    if (food.photo) {
      return `<div class="food-thumb photo-thumb"><img src="${escapeHtml(food.photo)}" alt="${escapeHtml(food.name)}" /></div>`;
    }

    const type = escapeHtml(food.type || classifyFood(food.name));
    const icon = escapeHtml(foodIconSrc(food));
    return `<div class="food-thumb icon-thumb ${type}"><img src="${icon}" alt="" /></div>`;
  }

  function activeFoods(filter = currentHomeFilter, folder = currentHomeFolder) {
    return loadFoods().filter((food) => {
      if (food.status !== "active") return false;
      if (filter !== "全部" && food.storage !== filter) return false;
      if (filter !== "全部" && folder !== "全部" && normalizedFolderName(food.folder) !== folder) return false;
      return true;
    });
  }

  function renderHomeList(screen, filter = currentHomeFilter) {
    const list = screen.querySelector(".food-list");
    if (!list) return;

    const foods = activeFoods(filter, currentHomeFolder);
    list.classList.toggle("is-empty", !foods.length);
    if (!foods.length) {
      list.innerHTML = `
        <article class="empty-row food-empty">
          <strong>🍽️</strong>
          <span>这里还没有食物</span>
        </article>
      `;
      return;
    }

    list.innerHTML = foods
      .map((food) => {
        const reminder = remindInfo(food);
        const amount = `${food.quantity || 1}${food.unit || ""}`;
        return `
          <article class="food-row ${reminder.className}" data-food-id="${escapeHtml(food.id)}">
            ${thumbMarkup(food)}
            <div class="food-info">
              <h2>${escapeHtml(food.name)}</h2>
              <p>
                <span class="food-date-line">${escapeHtml(formatDate(food.purchaseDate))}购买</span>
                <span class="food-detail-line">${escapeHtml(food.storage)} · ${escapeHtml(amount)}</span>
              </p>
            </div>
            <div class="food-actions">
              <div class="food-state">${escapeHtml(reminder.label)}</div>
              <button class="row-action" aria-label="操作${escapeHtml(food.name)}">操作</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function foldersForStorage(storage) {
    const folders = ["全部"];
    loadFoods().forEach((food) => {
      if (food.status !== "active" || food.storage !== storage) return;
      const folder = normalizedFolderName(food.folder);
      if (!folders.some((item) => item.toLocaleLowerCase() === folder.toLocaleLowerCase())) {
        folders.push(folder);
      }
    });
    return folders;
  }

  function renderHomeFolderFilter(screen) {
    const filter = screen.querySelector(".home-folder-filter");
    if (!filter) return;

    const visible = currentHomeFilter !== "全部";
    filter.classList.toggle("is-hidden", !visible);
    filter.setAttribute("aria-hidden", visible ? "false" : "true");
    if (!visible) return;

    const folders = foldersForStorage(currentHomeFilter);
    if (!folders.includes(currentHomeFolder)) currentHomeFolder = "全部";

    const toggle = filter.querySelector(".home-folder-toggle");
    const options = filter.querySelector(".home-folder-options");
    if (toggle) {
      toggle.classList.toggle("active", homeFolderExpanded || currentHomeFolder !== "全部");
      toggle.setAttribute("aria-expanded", homeFolderExpanded ? "true" : "false");
      toggle.textContent = currentHomeFolder === "全部" ? "文件夹" : currentHomeFolder;
    }
    if (options) {
      options.hidden = !homeFolderExpanded;
      options.innerHTML = folders
        .map((folder) => `<button type="button" data-folder="${escapeHtml(folder)}" class="${folder === currentHomeFolder ? "active" : ""}">${escapeHtml(folder)}</button>`)
        .join("");
    }
  }

  function renderHomeScreens() {
    ["home", "homeSheet"].forEach((name) => {
      const screen = screenElement(name);
      if (!screen) return;
      const buttons = screen.querySelectorAll(".segmented button");
      buttons.forEach((button) => {
        button.classList.toggle("active", button.textContent.trim() === currentHomeFilter);
      });
      renderHomeFolderFilter(screen);
      renderHomeList(screen, currentHomeFilter);
    });

    const visibleFoods = activeFoods(currentHomeFilter, currentHomeFolder);
    document.querySelectorAll(".hero-copy strong").forEach((item) => {
      item.textContent = visibleFoods.length ? `${visibleFoods.length} 件食物正在储存` : "所有东西都已经吃完了";
    });
  }

  function recordState(food) {
    if (food.status === "eaten") return { label: "已吃完", className: "eaten" };
    if (food.status === "spoiled") return { label: "已坏掉", className: "spoiled" };
    const reminder = remindInfo(food);
    return {
      label: reminder.className === "safe" ? "安全" : "需处理",
      className: reminder.className === "safe" ? "storing" : "spoiled",
    };
  }

  function recordDescription(food) {
    const stored = daysStored(food);
    if (food.status === "eaten") {
      return `手动标记，${formatDate(food.handledAt || food.purchaseDate)}吃完`;
    }
    if (food.status === "spoiled") {
      return `${food.storage} ${stored} 天后坏掉`;
    }
    return `${food.storage}中，已存 ${stored} 天`;
  }

  function renderRecordList(screenName, foods) {
    const screen = screenElement(screenName);
    const list = screen && screen.querySelector(".history-list");
    if (!list) return;

    if (!foods.length) {
      list.innerHTML = `<article class="empty-row">暂无记录</article>`;
      return;
    }

    list.innerHTML = foods
      .map((food) => {
        const state = recordState(food);
        const action = screenName === "history"
          ? `<button class="restore-action" type="button" data-restore-id="${escapeHtml(food.id)}">还原</button>`
          : `<strong class="record-state ${escapeHtml(state.className)}">${escapeHtml(state.label)}</strong>`;
        return `
          <article data-food-id="${escapeHtml(food.id)}">
            ${thumbMarkup(food)}
            <div>
              <h2>${escapeHtml(food.name)}</h2>
              <p>${escapeHtml(recordDescription(food))}</p>
            </div>
            ${action}
          </article>
        `;
      })
      .join("");
  }

  function renderHistory() {
    const foods = loadFoods().filter((food) => food.status === (currentHistoryFilter === "已吃完" ? "eaten" : "spoiled"));
    const nav = screenElement("history")?.querySelector(".history-filters");
    nav?.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.textContent.trim() === currentHistoryFilter);
    });
    renderRecordList("history", foods);
  }

  function renderStorageScreens() {
    renderRecordList(
      "fridge",
      loadFoods().filter((food) => food.status === "active" && food.storage === "冰箱"),
    );
    renderRecordList(
      "room",
      loadFoods().filter((food) => food.status === "active" && food.storage === "常温"),
    );
  }

  function renderStats() {
    const foods = loadFoods();
    const fridge = foods.filter((food) => food.status === "active" && food.storage === "冰箱").length;
    const room = foods.filter((food) => food.status === "active" && food.storage === "常温").length;
    const history = foods.filter((food) => food.status === "eaten" || food.status === "spoiled").length;
    const values = [fridge, room, history];

    document.querySelectorAll(".stats-grid").forEach((grid) => {
      grid.querySelectorAll("article").forEach((card, index) => {
        const value = card.querySelector("strong");
        if (value) value.textContent = String(values[index] || 0);
      });
    });
  }

  function renderAll() {
    renderHomeScreens();
    renderHistory();
    renderStorageScreens();
    renderStats();
    renderSyncSummary();
    renderThemeSummary();
    renderNotificationSummary();
  }

  function isSingleScreenMode() {
    return (
      document.documentElement.classList.contains("app-runtime") ||
      window.matchMedia("(max-width: 450px)").matches
    );
  }

  function enableRuntimeMode() {
    if (/Android/i.test(navigator.userAgent)) {
      document.documentElement.classList.add("app-runtime");
    }
  }

  function itemIndex(item, selector) {
    const parent = item.parentElement;
    if (!parent) return -1;
    return Array.from(parent.querySelectorAll(selector)).indexOf(item);
  }

  function activateItem(item, selector) {
    const parent = item.parentElement;
    if (!parent) return;
    parent.querySelectorAll(selector).forEach((candidate) => {
      candidate.classList.toggle("active", candidate === item);
    });
  }

  function syncTabbars(screenName) {
    const fridgeActive = ["home", "homeSheet", "fridge", "room"].includes(screenName);
    const profileActive = ["profile", "settings", "syncSettings", "themeSettings", "notificationSettings", "history"].includes(screenName);
    document.querySelectorAll(".tabbar").forEach((bar) => {
      const tabs = Array.from(bar.querySelectorAll("span"));
      tabs.forEach((tab, index) => {
        tab.classList.toggle(
          "active",
          (index === 0 && fridgeActive) || (index === 1 && profileActive),
        );
      });
    });
  }

  function setRoute(name, options) {
    if (options.reset) {
      routeStack = [name];
      currentScreen = name;
      return;
    }

    if (options.replace) {
      routeStack[routeStack.length - 1] = name;
      currentScreen = name;
      return;
    }

    if (routeStack[routeStack.length - 1] !== name) {
      routeStack.push(name);
    }
    currentScreen = name;
  }

  function showScreen(name, options = {}) {
    const target = screenElement(name);
    if (!target) return;

    setRoute(name, options);
    syncTabbars(name);
    renderAll();

    allScreens().forEach((screen) => {
      screen.classList.toggle("is-active", screen === target);
    });

    if (isSingleScreenMode()) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goBack() {
    if (currentScreen === "homeSheet") {
      showScreen("home", { reset: true });
      return;
    }

    while (routeStack.length > 1) {
      routeStack.pop();
      const previous = routeStack[routeStack.length - 1];
      if (screenElement(previous)) {
        showScreen(previous, { replace: true });
        return;
      }
    }

    showScreen("home", { reset: true });
  }

  function selectedOption(selector) {
    return document.querySelector(selector)?.textContent.trim() || "";
  }

  function formValue(selector) {
    return document.querySelector(selector)?.value.trim() || "";
  }

  function setChoiceValue(container, value) {
    if (!container) return;
    const input = container.parentElement?.querySelector("input[type='hidden']");
    if (input) input.value = value;
    container.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === value);
    });
  }

  function setQuantityUnit(value) {
    const add = screenElement("add");
    const safeValue = value || "斤";
    const input = add?.querySelector("[aria-label='数量单位']");
    const label = add?.querySelector(".unit-picker-label");
    if (input) input.value = safeValue;
    if (label) label.textContent = safeValue;
    add?.querySelectorAll(".unit-option-grid button").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === safeValue);
    });
  }

  function setReminderUnit(value) {
    const add = screenElement("add");
    const safeValue = reminderUnit(value);
    const input = add?.querySelector("[aria-label='提醒单位']");
    const label = add?.querySelector(".reminder-unit-picker-label");
    if (input) input.value = safeValue;
    if (label) label.textContent = safeValue;
    add?.querySelectorAll(".reminder-unit-option-grid button").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === safeValue);
    });
  }

  function normalizedFolderName(value) {
    return String(value || "").trim() || "默认";
  }

  function existingFolders() {
    const folders = ["默认"];
    loadFoods().forEach((food) => {
      const folder = normalizedFolderName(food.folder);
      if (!folders.some((item) => item.toLocaleLowerCase() === folder.toLocaleLowerCase())) {
        folders.push(folder);
      }
    });
    return folders;
  }

  function resolveFolderName(value) {
    const folder = normalizedFolderName(value);
    return existingFolders().find((item) => item.toLocaleLowerCase() === folder.toLocaleLowerCase()) || folder;
  }

  function setFolderValue(value) {
    const input = screenElement("add")?.querySelector("[aria-label='存放文件夹']");
    if (input) input.value = resolveFolderName(value);
  }

  function renderFolderOptions() {
    const grid = screenElement("add")?.querySelector(".folder-option-grid");
    if (!grid) return;
    const current = normalizedFolderName(formValue(".phone-add [aria-label='存放文件夹']"));
    grid.innerHTML = existingFolders()
      .map((folder) => `<button type="button" data-value="${escapeHtml(folder)}" class="${folder.toLocaleLowerCase() === current.toLocaleLowerCase() ? "active" : ""}">${escapeHtml(folder)}</button>`)
      .join("");
  }

  function closeUnitModal() {
    const modal = screenElement("add")?.querySelector(".unit-modal");
    if (!modal) return;
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function closeReminderUnitModal() {
    const modal = screenElement("add")?.querySelector(".reminder-unit-modal");
    if (!modal) return;
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function closeFolderModal() {
    const modal = screenElement("add")?.querySelector(".folder-modal");
    if (!modal) return;
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function openUnitModal() {
    const modal = screenElement("add")?.querySelector(".unit-modal");
    if (!modal) return;
    closeReminderUnitModal();
    closeFolderModal();
    setQuantityUnit(formValue(".phone-add [aria-label='数量单位']") || "斤");
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function openReminderUnitModal() {
    const modal = screenElement("add")?.querySelector(".reminder-unit-modal");
    if (!modal) return;
    closeUnitModal();
    closeFolderModal();
    setReminderUnit(formValue(".phone-add [aria-label='提醒单位']") || "天");
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function openFolderModal() {
    const modal = screenElement("add")?.querySelector(".folder-modal");
    if (!modal) return;
    closeUnitModal();
    closeReminderUnitModal();
    renderFolderOptions();
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function setPurchaseDateValue(value) {
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : today.toISOString().slice(0, 10);
    const visibleInput = screenElement("add")?.querySelector("[aria-label='购买时间']");
    const nativeInput = screenElement("add")?.querySelector(".native-date-input");
    if (visibleInput) visibleInput.value = normalized;
    if (nativeInput) nativeInput.value = normalized;
  }

  function requestPurchaseDate() {
    const currentDate = formValue(".phone-add [aria-label='购买时间']") || today.toISOString().slice(0, 10);
    if (typeof window.FoodTimeNative?.showDatePicker === "function") {
      window.FoodTimeNative.showDatePicker(currentDate);
      return;
    }

    const nativeInput = screenElement("add")?.querySelector(".native-date-input");
    if (!nativeInput) return;
    nativeInput.value = currentDate;
    if (typeof nativeInput.showPicker === "function") {
      nativeInput.showPicker();
    } else {
      nativeInput.click();
      nativeInput.focus();
    }
  }

  function setPhotoButtonLabel(area, label) {
    const button = area?.querySelector(".photo-area > button");
    if (!button) return;
    button.setAttribute("aria-label", label || "拍照");
    button.innerHTML = `<img class="button-icon" src="icon/相机.svg" alt="" />`;
  }

  function setAddFormMode(isEditing) {
    const add = screenElement("add");
    if (!add) return;
    const title = add.querySelector(".sub-header h1");
    const saveButton = add.querySelector(".confirm-add-button");
    if (title) title.textContent = isEditing ? "编辑食物" : "添加食物";
    if (saveButton) saveButton.setAttribute("aria-label", isEditing ? "更新食物" : "保存食物");
  }

  function updatePhotoPreviewFromName() {
    if (capturedPhoto) return;
    const add = screenElement("add");
    const area = add?.querySelector(".photo-area");
    if (!area) return;

    const name = formValue(".phone-add [aria-label='食物名称']") || "食物";
    const visual = foodIconDefForName(name);
    area.classList.add("is-icon-preview");
    area.style.setProperty("--preview-icon", `url("${visual.file}")`);
    area.dataset.previewLabel = name.slice(0, 3);
    const illustration = area.querySelector(".plate-illustration");
    if (illustration) illustration.dataset.previewLabel = name.slice(0, 3);
  }

  function clearCapturedPhoto(area) {
    capturedPhoto = "";
    area?.classList.remove("is-captured");
    area?.style.removeProperty("--captured-photo");
    setPhotoButtonLabel(area, "拍照");
    updatePhotoPreviewFromName();
  }

  function setCapturedPhoto(area, photo) {
    capturedPhoto = photo || "";
    if (!area) return;

    if (!capturedPhoto) {
      clearCapturedPhoto(area);
      return;
    }

    area.classList.add("is-captured");
    area.classList.remove("is-icon-preview");
    area.style.setProperty("--captured-photo", `url("${capturedPhoto}")`);
    setPhotoButtonLabel(area, "更换照片");
  }

  function loadThemeSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(THEME_SETTINGS_KEY) || "{}");
      const mode = ["system", "light", "dark"].includes(settings.mode) ? settings.mode : "system";
      return { mode };
    } catch (error) {
      localStorage.removeItem(THEME_SETTINGS_KEY);
      return { mode: "system" };
    }
  }

  function themeModeLabel(mode) {
    if (mode === "dark") return "夜间";
    if (mode === "light") return "浅色";
    return "跟随系统";
  }

  function applyTheme(settings = loadThemeSettings()) {
    const mode = ["system", "light", "dark"].includes(settings.mode) ? settings.mode : "system";
    document.documentElement.classList.remove("theme-system", "theme-light", "theme-dark", "theme-system-light", "theme-system-dark");
    if (mode === "system") {
      document.documentElement.classList.add("theme-system", `theme-system-${systemThemeMode()}`);
      return;
    }
    document.documentElement.classList.add(`theme-${mode}`);
  }

  function systemThemeMode() {
    try {
      const nativeTheme = window.FoodTimeNative?.systemTheme?.();
      if (nativeTheme === "dark" || nativeTheme === "light") return nativeTheme;
    } catch (error) {
      // Fall back to the browser media query below.
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function watchSystemTheme() {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return;
    const refresh = () => {
      if (loadThemeSettings().mode === "system") applyTheme();
    };
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", refresh);
    } else if (typeof query.addListener === "function") {
      query.addListener(refresh);
    }
  }

  function renderThemeSummary(settings = loadThemeSettings()) {
    document.querySelectorAll(".theme-summary-text").forEach((item) => {
      item.textContent = themeModeLabel(settings.mode);
    });
  }

  function fillThemeSettingsForm() {
    const settings = loadThemeSettings();
    screenElement("themeSettings")?.querySelectorAll(".theme-options button").forEach((button) => {
      button.classList.toggle("active", button.dataset.themeMode === settings.mode);
    });
    renderThemeSummary(settings);
  }

  function saveThemeSettings() {
    const screen = screenElement("themeSettings");
    if (!screen) return;

    const mode = screen.querySelector(".theme-options button.active")?.dataset.themeMode || "system";
    const settings = { mode, updatedAt: nowIso() };
    localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings));
    applyTheme(settings);
    renderThemeSummary(settings);

    const button = screen.querySelector(".theme-save-action");
    if (!button) return;
    button.textContent = "已保存";
    window.setTimeout(() => {
      button.textContent = "保存显示设置";
    }, 1200);
  }

  function loadNotificationSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || "{}");
      const dailyTime = /^\d{2}:\d{2}$/.test(settings.dailyTime || "") ? settings.dailyTime : "09:00";
      const emergencyDays = Math.min(30, Math.max(1, Number.parseInt(settings.emergencyDays, 10) || 3));
      return { dailyTime, emergencyDays };
    } catch (error) {
      localStorage.removeItem(NOTIFICATION_SETTINGS_KEY);
      return { dailyTime: "09:00", emergencyDays: 3 };
    }
  }

  function notificationSummary(settings = loadNotificationSettings()) {
    return `每天 ${settings.dailyTime}，紧急提醒 ${settings.emergencyDays} 天`;
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function splitDailyTime(value) {
    const normalized = /^\d{2}:\d{2}$/.test(value || "") ? value : "09:00";
    const [hour, minute] = normalized.split(":").map((item) => Number.parseInt(item, 10));
    return {
      hour: clampNumber(hour, 0, 23, 9),
      minute: clampNumber(minute, 0, 59, 0),
    };
  }

  function joinDailyTime(hour, minute) {
    const safeHour = String(clampNumber(hour, 0, 23, 9)).padStart(2, "0");
    const safeMinute = String(clampNumber(minute, 0, 59, 0)).padStart(2, "0");
    return `${safeHour}:${safeMinute}`;
  }

  function renderNotificationSummary(settings = loadNotificationSettings()) {
    document.querySelectorAll(".notification-summary-text").forEach((item) => {
      item.textContent = notificationSummary(settings);
    });
  }

  function fillNotificationSettingsForm() {
    const settings = loadNotificationSettings();
    const screen = screenElement("notificationSettings");
    if (!screen) return;

    const dailyTime = splitDailyTime(settings.dailyTime);
    const dailyHour = screen.querySelector("[aria-label='提醒小时']");
    const dailyMinute = screen.querySelector("[aria-label='提醒分钟']");
    const emergencyDays = screen.querySelector("[aria-label='紧急提醒天数']");
    if (dailyHour) dailyHour.value = dailyTime.hour;
    if (dailyMinute) dailyMinute.value = dailyTime.minute;
    if (emergencyDays) emergencyDays.value = settings.emergencyDays;
    renderNotificationSummary(settings);
  }

  function saveNotificationSettings() {
    const screen = screenElement("notificationSettings");
    if (!screen) return;

    const settings = {
      dailyTime: joinDailyTime(
        screen.querySelector("[aria-label='提醒小时']")?.value,
        screen.querySelector("[aria-label='提醒分钟']")?.value,
      ),
      emergencyDays: clampNumber(screen.querySelector("[aria-label='紧急提醒天数']")?.value, 1, 30, 3),
      emergencySchedule: [720, 360, 180, 90, 45, 30],
      updatedAt: nowIso(),
    };
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    renderNotificationSummary(settings);
    scheduleNativeNotifications({ immediate: true });

    const button = screen.querySelector(".notification-save-action");
    if (!button) return;
    button.textContent = "已保存";
    window.setTimeout(() => {
      button.textContent = "保存提醒设置";
    }, 1200);
  }

  function resetAddForm() {
    const add = screenElement("add");
    if (!add) return;
    editingFoodId = null;
    setAddFormMode(false);
    add.querySelector("[aria-label='食物名称']").value = "草莓";
    setPurchaseDateValue(today.toISOString().slice(0, 10));
    add.querySelector("[aria-label='数量']").value = "1";
    setQuantityUnit("斤");
    add.querySelector("[aria-label='提醒数值']").value = "3";
    setReminderUnit("天");
    add.querySelector("[aria-label='存放文件夹']").value = "默认";
    add.querySelectorAll(".storage-chips button").forEach((button, index) => {
      button.classList.toggle("active", index === 0);
    });
    clearCapturedPhoto(add.querySelector(".photo-area"));
  }

  function fillAddForm(food) {
    const add = screenElement("add");
    if (!add || !food) return;

    editingFoodId = food.id;
    setAddFormMode(true);
    add.querySelector("[aria-label='食物名称']").value = food.name || "";
    setPurchaseDateValue(food.purchaseDate || today.toISOString().slice(0, 10));
    add.querySelector("[aria-label='数量']").value = food.quantity || "1";
    setQuantityUnit(food.unit || "个");
    add.querySelector("[aria-label='提醒数值']").value = food.remindValue || food.remindDays || "3";
    setReminderUnit(food.remindUnit || "天");
    setFolderValue(food.folder || "默认");
    add.querySelectorAll(".storage-chips button").forEach((button) => {
      button.classList.toggle("active", button.textContent.trim() === (food.storage || "冰箱"));
    });
    setCapturedPhoto(add.querySelector(".photo-area"), food.photo || "");
    updatePhotoPreviewFromName();
  }

  function saveFoodFromForm() {
    const name = formValue(".phone-add [aria-label='食物名称']") || "未命名食物";
    const purchaseDate = formValue(".phone-add [aria-label='购买时间']") || today.toISOString().slice(0, 10);
    const quantity = formValue(".phone-add [aria-label='数量']") || "1";
    const unit = formValue(".phone-add [aria-label='数量单位']") || "个";
    const storage = selectedOption(".phone-add .storage-chips .active") || "冰箱";
    const folder = resolveFolderName(formValue(".phone-add [aria-label='存放文件夹']"));
    const remindValue = reminderAmount(formValue(".phone-add [aria-label='提醒数值']"));
    const remindUnit = reminderUnit(formValue(".phone-add [aria-label='提醒单位']"));
    const remindDays = reminderDaysCompat(remindValue, remindUnit);
    const purchaseAt = purchaseDate === today.toISOString().slice(0, 10) ? nowIso() : `${purchaseDate}T00:00:00`;
    const foods = loadFoods();
    const visual = foodIconDefForName(name);

    if (editingFoodId) {
      const food = foods.find((item) => item.id === editingFoodId);
      if (!food) {
        editingFoodId = null;
        resetAddForm();
        showScreen("home", { reset: true });
        return;
      }

      const samePurchaseDate = food.purchaseDate === purchaseDate;
      food.name = name;
      food.purchaseDate = purchaseDate;
      food.storage = storage;
      food.folder = folder;
      food.quantity = quantity;
      food.unit = unit;
      food.purchaseAt = samePurchaseDate
        ? food.purchaseAt || purchaseAt
        : purchaseAt;
      food.remindValue = remindValue;
      food.remindUnit = remindUnit;
      food.remindDays = remindDays;
      food.type = visual.type;
      food.icon = visual.file;
      food.photo = capturedPhoto;
      food.updatedAt = nowIso();
      saveFoods(foods);
      currentHomeFilter = "全部";
      currentHomeFolder = "全部";
      homeFolderExpanded = false;
      editingFoodId = null;
      resetAddForm();
      showScreen("home", { reset: true });
      return;
    }

    foods.unshift({
      id: `food-${Date.now()}`,
      name,
      purchaseDate,
      storage,
      folder,
      quantity,
      unit,
      purchaseAt,
      remindValue,
      remindUnit,
      remindDays,
      status: "active",
      type: visual.type,
      icon: visual.file,
      photo: capturedPhoto,
      photoText: "",
      createdAt: today.toISOString().slice(0, 10),
      updatedAt: nowIso(),
    });

    saveFoods(foods);
    currentHomeFilter = "全部";
    currentHomeFolder = "全部";
    homeFolderExpanded = false;
    resetAddForm();
    showScreen("home", { reset: true });
  }

  function editSelectedFood() {
    if (!selectedFoodId) return;
    const food = loadFoods().find((item) => item.id === selectedFoodId);
    if (!food) return;

    fillAddForm(food);
    selectedFoodId = null;
    showScreen("add", { replace: true });
  }

  function updateReminderDays(button) {
    const stepper = button.closest(".stepper");
    const value = stepper && stepper.querySelector("strong");
    if (!value) return;

    const buttons = Array.from(stepper.querySelectorAll("button"));
    const direction = buttons.indexOf(button) === 0 ? -1 : 1;
    const current = Number.parseInt(value.textContent, 10) || 3;
    const next = Math.min(30, Math.max(1, current + direction));
    value.textContent = `${next} 天`;
  }

  function openSheet(foodId) {
    selectedFoodId = foodId;
    const food = loadFoods().find((item) => item.id === foodId);
    if (!food) return;

    const sheet = screenElement("homeSheet")?.querySelector(".action-sheet");
    if (sheet) {
      sheet.querySelector("h2").textContent = food.name;
      sheet.querySelector(".sheet-title-row span").textContent = remindInfo(food).label;
    }

    showScreen("homeSheet");
  }

  function markSelectedFood(status) {
    if (!selectedFoodId) return;
    const foods = loadFoods();
    const food = foods.find((item) => item.id === selectedFoodId);
    if (!food) return;

    food.status = status;
    food.handledAt = today.toISOString().slice(0, 10);
    food.updatedAt = nowIso();
    saveFoods(foods);
    selectedFoodId = null;
    showScreen("home", { reset: true });
  }

  function delaySelectedFood() {
    if (!selectedFoodId) return;
    const foods = loadFoods();
    const food = foods.find((item) => item.id === selectedFoodId);
    if (!food) return;

    const delayedDays = reminderDaysCompat(foodReminderMinutes(food) + 24 * 60, "分钟");
    food.remindValue = delayedDays;
    food.remindUnit = "天";
    food.remindDays = delayedDays;
    food.updatedAt = nowIso();
    saveFoods(foods);
    selectedFoodId = null;
    showScreen("home", { reset: true });
  }

  function restoreFood(foodId) {
    const foods = loadFoods();
    const food = foods.find((item) => item.id === foodId);
    if (!food) return;

    food.status = "active";
    delete food.handledAt;
    food.updatedAt = nowIso();
    saveFoods(foods);
    renderAll();
    showScreen("history", { replace: true });
  }

  function openHistoryClearModal() {
    const modal = screenElement("history")?.querySelector(".history-clear-modal");
    if (!modal) return;
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeHistoryClearModal() {
    const modal = screenElement("history")?.querySelector(".history-clear-modal");
    if (!modal) return;
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function clearAllFoodData() {
    const count = loadFoods().length;
    if (!count) {
      updateSyncStatus("本地没有需要清除的食物数据");
      return;
    }

    localStorage.setItem(CLEAR_ALL_AT_KEY, nowIso());
    selectedFoodId = null;
    currentHomeFilter = "全部";
    currentHomeFolder = "全部";
    homeFolderExpanded = false;
    currentHistoryFilter = "已吃完";
    saveFoods([], { skipSync: true });
    renderAll();
    showScreen("history", { replace: true });
    updateSyncStatus(syncSettingsReady() ? "本地已清空 · 正在同步云端清空" : "本地已清空 · 云端清空待同步设置");
    scheduleSync({ immediate: true });
  }

  function loadSyncSettings() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_SETTINGS_KEY) || "{}");
    } catch (error) {
      localStorage.removeItem(SYNC_SETTINGS_KEY);
      return {};
    }
  }

  function fillSyncSettingsForm() {
    const settings = loadSyncSettings();
    const screen = screenElement("syncSettings");
    if (!screen) return;

    const webdav = screen.querySelector("[aria-label='WebDAV 地址']");
    const account = screen.querySelector("[aria-label='WebDAV 账号'], [aria-label='坚果云账号']");
    const password = screen.querySelector("[aria-label='WebDAV 密码'], [aria-label='坚果云应用密码']");
    const remoteFile = screen.querySelector("[aria-label='同步远程文件']");

    if (webdav) webdav.value = settings.webdavUrl || "https://dav.jianguoyun.com/dav/";
    if (account) account.value = settings.account || "";
    if (password) password.value = settings.password || "";
    if (remoteFile) remoteFile.value = settings.remoteFile || "/FoodTime/foodtime-data.json";
  }

  function saveSyncSettings() {
    const screen = screenElement("syncSettings");
    if (!screen) return;

    const settings = {
      webdavUrl: screen.querySelector("[aria-label='WebDAV 地址']")?.value.trim() || "",
      account: screen.querySelector("[aria-label='WebDAV 账号'], [aria-label='坚果云账号']")?.value.trim() || "",
      password: screen.querySelector("[aria-label='WebDAV 密码'], [aria-label='坚果云应用密码']")?.value || "",
      remoteFile: screen.querySelector("[aria-label='同步远程文件']")?.value.trim() || "",
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
    scheduleSync({ immediate: true });
    const button = screen.querySelector(".sync-save-action");
    if (!button) return;
    button.textContent = "已保存";
    window.setTimeout(() => {
      button.textContent = "保存同步设置";
    }, 1200);
  }

  function requestSyncNow(button) {
    const settings = loadSyncSettings();
    if (!syncSettingsReady(settings)) {
      updateSyncStatus("请先设置同步服务");
      fillSyncSettingsForm();
      showScreen("syncSettings");
      return;
    }

    const label = button?.querySelector("span");
    button?.classList.add("is-syncing");
    if (label) label.textContent = "同步中";
    scheduleSync({ immediate: true });
    window.setTimeout(() => {
      button?.classList.remove("is-syncing");
      if (label) label.textContent = "同步";
    }, 1200);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
  }

  function drawImageThumb(image, maxSide) {
    const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));

    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function compressPhoto(dataUrl) {
    try {
      const image = await loadImage(dataUrl);
      let best = isEmbeddedPhoto(dataUrl) && dataUrl.length <= PHOTO_SYNC_MAX_CHARS ? dataUrl : "";
      const sideSteps = [PHOTO_THUMB_MAX_SIDE, 128, PHOTO_THUMB_MIN_SIDE];
      const qualitySteps = [PHOTO_THUMB_QUALITY, 0.18, 0.12];

      for (const maxSide of sideSteps) {
        const canvas = drawImageThumb(image, maxSide);
        if (!canvas) continue;

        for (const quality of qualitySteps) {
          let candidate = canvas.toDataURL("image/webp", quality);
          if (!candidate.startsWith("data:image/webp")) {
            candidate = canvas.toDataURL("image/jpeg", quality);
          }

          if (candidate && (!best || candidate.length < best.length)) {
            best = candidate;
          }
          if (candidate && candidate.length <= PHOTO_SYNC_MAX_CHARS) {
            return candidate;
          }
        }
      }

      return best || dataUrl;
    } catch (error) {
      return dataUrl;
    }
  }

  async function compactStoredPhotos() {
    const foods = loadFoods();
    if (!foods.some((food) => isEmbeddedPhoto(food.photo) && food.photo.length > PHOTO_SYNC_MAX_CHARS)) return;

    let changed = false;
    const nextFoods = [];
    for (const food of foods) {
      if (!isEmbeddedPhoto(food.photo) || food.photo.length <= PHOTO_SYNC_MAX_CHARS) {
        nextFoods.push(food);
        continue;
      }

      const compactedPhoto = await compressPhoto(food.photo);
      if (compactedPhoto && compactedPhoto.length < food.photo.length) {
        changed = true;
        nextFoods.push({ ...food, photo: compactedPhoto, updatedAt: nowIso() });
      } else {
        nextFoods.push(food);
      }
    }

    if (changed) {
      saveFoods(nextFoods);
      renderAll();
    }
  }

  async function handlePhotoFile(file) {
    if (!file) return;
    const area = screenElement("add")?.querySelector(".photo-area");
    setPhotoButtonLabel(area, "处理中");
    try {
      const original = await readFileAsDataUrl(file);
      capturedPhoto = await compressPhoto(original);
      const area = screenElement("add")?.querySelector(".photo-area");
      if (!area) return;
      area.classList.add("is-captured");
      area.classList.remove("is-icon-preview");
      area.style.setProperty("--captured-photo", `url("${capturedPhoto}")`);
      setPhotoButtonLabel(area, "已拍照");
    } catch (error) {
      setPhotoButtonLabel(area, "拍照");
    }
  }

  function handleClick(event) {
    const target = event.target;

    const addButton = target.closest(".icon-button");
    if (addButton && addButton.closest(".app-header")) {
      resetAddForm();
      showScreen("add");
      return;
    }

    const backButton = target.closest(".back-button");
    if (backButton) {
      goBack();
      return;
    }

    const saveButton = target.closest(".phone-add .confirm-add-button");
    if (saveButton) {
      saveFoodFromForm();
      return;
    }

    const unitPicker = target.closest(".unit-picker-button");
    if (unitPicker) {
      openUnitModal();
      return;
    }

    const unitOption = target.closest(".unit-option-grid button");
    if (unitOption) {
      setQuantityUnit(unitOption.dataset.value || unitOption.textContent.trim());
      closeUnitModal();
      return;
    }

    const reminderUnitPicker = target.closest(".reminder-unit-picker-button");
    if (reminderUnitPicker) {
      openReminderUnitModal();
      return;
    }

    const reminderUnitOption = target.closest(".reminder-unit-option-grid button");
    if (reminderUnitOption) {
      setReminderUnit(reminderUnitOption.dataset.value || reminderUnitOption.textContent.trim());
      closeReminderUnitModal();
      return;
    }

    const folderMore = target.closest(".folder-more-button");
    if (folderMore) {
      openFolderModal();
      return;
    }

    const folderOption = target.closest(".folder-option-grid button");
    if (folderOption) {
      setFolderValue(folderOption.dataset.value || folderOption.textContent.trim());
      closeFolderModal();
      return;
    }

    const unitModalClose = target.closest(".unit-modal-close");
    if (unitModalClose) {
      closeUnitModal();
      closeReminderUnitModal();
      closeFolderModal();
      return;
    }

    if (target.classList?.contains("unit-modal") || target.classList?.contains("reminder-unit-modal") || target.classList?.contains("folder-modal")) {
      closeUnitModal();
      closeReminderUnitModal();
      closeFolderModal();
      return;
    }

    const datePicker = target.closest(".date-picker-button, .phone-add [aria-label='购买时间']");
    if (datePicker) {
      requestPurchaseDate();
      return;
    }

    const nativeDateInput = target.closest(".native-date-input");
    if (nativeDateInput) {
      setPurchaseDateValue(nativeDateInput.value);
      return;
    }

    const choiceOption = target.closest(".choice-options button");
    if (choiceOption) {
      setChoiceValue(choiceOption.closest(".choice-options"), choiceOption.dataset.value || choiceOption.textContent.trim());
      return;
    }

    const photoButton = target.closest(".photo-area > button");
    if (photoButton) {
      const input = photoButton.closest(".photo-area").querySelector(".camera-input");
      if (input) input.click();
      return;
    }

    const storageButton = target.closest(".storage-chips button");
    if (storageButton) {
      activateItem(storageButton, "button");
      return;
    }

    const stepperButton = target.closest(".emergency-stepper button");
    if (stepperButton) {
      updateReminderDays(stepperButton);
      return;
    }

    const rowAction = target.closest(".row-action");
    if (rowAction) {
      const row = rowAction.closest("[data-food-id]");
      openSheet(row?.dataset.foodId);
      return;
    }

    const sheetClose = target.closest(".sheet-close");
    if (sheetClose) {
      selectedFoodId = null;
      showScreen("home", { reset: true });
      return;
    }

    const sheetAction = target.closest(".action-sheet [data-sheet-action]");
    if (sheetAction) {
      const action = sheetAction.dataset.sheetAction;
      if (action === "edit") editSelectedFood();
      if (action === "eaten") markSelectedFood("eaten");
      if (action === "spoiled") markSelectedFood("spoiled");
      if (action === "delay") delaySelectedFood();
      return;
    }

    if (currentScreen === "homeSheet" && target.closest(".phone-home-sheet") && !target.closest(".action-sheet") && !target.closest(".tabbar")) {
      selectedFoodId = null;
      showScreen("home", { reset: true });
      return;
    }

    const tabItem = target.closest(".tabbar span");
    if (tabItem) {
      const index = itemIndex(tabItem, "span");
      showScreen(index === 0 ? "home" : "profile");
      return;
    }

    const homeFilter = target.closest(".phone-home .segmented button");
    if (homeFilter) {
      currentHomeFilter = homeFilter.textContent.trim();
      currentHomeFolder = "全部";
      homeFolderExpanded = false;
      renderHomeScreens();
      return;
    }

    const homeFolderToggle = target.closest(".home-folder-toggle");
    if (homeFolderToggle) {
      homeFolderExpanded = !homeFolderExpanded;
      renderHomeScreens();
      return;
    }

    const homeFolderOption = target.closest(".home-folder-options button");
    if (homeFolderOption) {
      currentHomeFolder = homeFolderOption.dataset.folder || homeFolderOption.textContent.trim() || "全部";
      renderHomeScreens();
      return;
    }

    const settingsButton = target.closest(".settings-button");
    if (settingsButton) {
      showScreen("settings");
      return;
    }

    const syncNowButton = target.closest(".sync-now-button");
    if (syncNowButton) {
      requestSyncNow(syncNowButton);
      return;
    }

    const syncEntry = target.closest(".sync-entry");
    if (syncEntry) {
      showScreen("settings");
      return;
    }

    const syncSettingsButton = target.closest(".sync-settings-button");
    if (syncSettingsButton) {
      fillSyncSettingsForm();
      showScreen("syncSettings");
      return;
    }

    const themeSettingsButton = target.closest(".theme-settings-button");
    if (themeSettingsButton) {
      fillThemeSettingsForm();
      showScreen("themeSettings");
      return;
    }

    const notificationSettingsButton = target.closest(".notification-settings-button");
    if (notificationSettingsButton) {
      fillNotificationSettingsForm();
      showScreen("notificationSettings");
      return;
    }

    const themeOption = target.closest(".theme-options button");
    if (themeOption) {
      activateItem(themeOption, "button");
      applyTheme({ mode: themeOption.dataset.themeMode || "system" });
      return;
    }

    const syncSave = target.closest(".sync-save-action");
    if (syncSave) {
      saveSyncSettings();
      return;
    }

    const themeSave = target.closest(".theme-save-action");
    if (themeSave) {
      saveThemeSettings();
      return;
    }

    const notificationSave = target.closest(".notification-save-action");
    if (notificationSave) {
      saveNotificationSettings();
      return;
    }

    const statsCard = target.closest(".phone-stats .stats-grid article, .phone-profile .stats-grid article");
    if (statsCard) {
      const index = itemIndex(statsCard, "article");
      if (index === 0) showScreen("fridge");
      if (index === 1) showScreen("room");
      if (index === 2) showScreen("history");
      return;
    }

    const recordFilter = target.closest(".phone-history .history-filters button");
    if (recordFilter) {
      currentHistoryFilter = recordFilter.textContent.trim();
      renderHistory();
      return;
    }

    const clearHistoryAction = target.closest(".history-clear-action");
    if (clearHistoryAction) {
      openHistoryClearModal();
      return;
    }

    const clearCancelAction = target.closest(".confirm-cancel-action");
    if (clearCancelAction || target.classList?.contains("history-clear-modal")) {
      closeHistoryClearModal();
      return;
    }

    const clearDeleteAction = target.closest(".confirm-delete-action");
    if (clearDeleteAction) {
      closeHistoryClearModal();
      clearAllFoodData();
      return;
    }

    const restoreAction = target.closest(".restore-action");
    if (restoreAction) {
      restoreFood(restoreAction.dataset.restoreId);
    }
  }

  function handleChange(event) {
    const input = event.target.closest(".camera-input");
    if (input) {
      handlePhotoFile(input.files && input.files[0]);
      return;
    }

    const dateInput = event.target.closest(".native-date-input");
    if (dateInput) {
      setPurchaseDateValue(dateInput.value);
    }
  }

  function handleInput(event) {
    if (event.target.closest(".phone-add [aria-label='食物名称']")) {
      updatePhotoPreviewFromName();
    }
  }

  function init() {
    enableRuntimeMode();
    applyTheme();
    watchSystemTheme();

    renderAll();
    resetAddForm();
    fillSyncSettingsForm();
    fillThemeSettingsForm();
    fillNotificationSettingsForm();
    allScreens().forEach((screen, index) => {
      screen.classList.toggle("is-active", index === 0);
    });
    syncTabbars("home");
    document.addEventListener("click", handleClick);
    document.addEventListener("change", handleChange);
    document.addEventListener("input", handleInput);
    compactStoredPhotos();
    scheduleSync({ immediate: true });
    scheduleNativeNotifications({ immediate: true });
  }

  window.FoodTimeApp = {
    onNativeSyncResult,
    onNativePurchaseDateSelected: setPurchaseDateValue,
    refreshTheme: applyTheme,
    back: goBack,
    canGoBack() {
      return currentScreen !== "home" || routeStack.length > 1;
    },
    show: showScreen,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
