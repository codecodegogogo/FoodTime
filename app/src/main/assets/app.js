(function () {
  const STORAGE_KEY = "foodtime.foods.v1";
  const SYNC_SETTINGS_KEY = "foodtime.syncSettings.v1";
  const ONE_DAY = 24 * 60 * 60 * 1000;
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
    history: ".phone-history",
    fridge: ".phone-fridge-records",
    room: ".phone-room-records",
  };

  const defaultFoods = [
    {
      id: "milk-001",
      name: "鲜牛奶",
      purchaseDate: "2026-07-03",
      storage: "冰箱",
      quantity: "1",
      unit: "瓶",
      remindDays: 2,
      status: "active",
      type: "milk",
      photoText: "鲜牛奶",
      createdAt: "2026-07-03",
    },
    {
      id: "berry-001",
      name: "草莓",
      purchaseDate: "2026-07-04",
      storage: "冰箱",
      quantity: "1",
      unit: "斤",
      remindDays: 3,
      status: "active",
      type: "berry",
      photoText: "草莓",
      createdAt: "2026-07-04",
    },
    {
      id: "chicken-001",
      name: "鸡胸肉",
      purchaseDate: "2026-07-05",
      storage: "冰箱",
      quantity: "2",
      unit: "袋",
      remindDays: 3,
      status: "active",
      type: "chicken",
      photoText: "鸡肉",
      createdAt: "2026-07-05",
    },
    {
      id: "banana-001",
      name: "香蕉",
      purchaseDate: "2026-07-03",
      storage: "常温",
      quantity: "6",
      unit: "个",
      remindDays: 3,
      status: "active",
      type: "berry",
      photoText: "香蕉",
      createdAt: "2026-07-03",
    },
    {
      id: "bread-001",
      name: "面包",
      purchaseDate: "2026-07-02",
      storage: "常温",
      quantity: "1",
      unit: "袋",
      remindDays: 3,
      status: "active",
      type: "chicken",
      photoText: "面包",
      createdAt: "2026-07-02",
    },
    {
      id: "strawberry-eaten",
      name: "草莓",
      purchaseDate: "2026-06-18",
      storage: "冰箱",
      quantity: "1",
      unit: "盒",
      remindDays: 3,
      status: "eaten",
      type: "berry",
      photoText: "草莓",
      handledAt: "2026-06-21",
      createdAt: "2026-06-18",
    },
    {
      id: "fish-spoiled",
      name: "鱼肉",
      purchaseDate: "2026-06-18",
      storage: "冰箱",
      quantity: "1",
      unit: "袋",
      remindDays: 3,
      status: "spoiled",
      type: "chicken",
      photoText: "鱼肉",
      handledAt: "2026-06-21",
      createdAt: "2026-06-18",
    },
  ];

  let currentScreen = "home";
  let routeStack = ["home"];
  let currentHomeFilter = "全部";
  let currentHistoryFilter = "已吃完";
  let selectedFoodId = null;
  let capturedPhoto = "";

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
      if (saved) return JSON.parse(saved);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }

    saveFoods(defaultFoods);
    return defaultFoods.slice();
  }

  function saveFoods(foods) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(foods));
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

  function remindInfo(food) {
    const purchasedAt = new Date(`${food.purchaseDate}T00:00:00`);
    if (Number.isNaN(purchasedAt.getTime())) {
      return { label: "待计算", className: "safe", remaining: 0 };
    }

    const remindDays = Number(food.remindDays || 3);
    const dueAt = new Date(purchasedAt);
    dueAt.setDate(dueAt.getDate() + remindDays);
    const remaining = Math.ceil((dueAt - today) / ONE_DAY);

    if (remaining < 0) {
      return { label: `已过期 ${Math.abs(remaining)} 天`, className: "urgent", remaining };
    }
    if (remaining === 0) return { label: "今天到期", className: "urgent", remaining };
    if (remaining === 1) return { label: "明天到期", className: "soon", remaining };
    return { label: `${remaining} 天后到期`, className: "safe", remaining };
  }

  function classifyFood(name) {
    if (/奶|酸奶|牛奶|燕麦/.test(name)) return "milk";
    if (/鸡|肉|鱼|蛋/.test(name)) return "chicken";
    return "berry";
  }

  function thumbMarkup(food) {
    if (food.photo) {
      return `<div class="food-thumb photo-thumb"><img src="${escapeHtml(food.photo)}" alt="${escapeHtml(food.name)}" /></div>`;
    }

    if (food.photoText) {
      return `<div class="food-thumb text-thumb ${escapeHtml(food.type || "berry")}"><span>${escapeHtml(food.photoText)}</span></div>`;
    }

    return `<div class="food-thumb ${escapeHtml(food.type || classifyFood(food.name))}"></div>`;
  }

  function activeFoods(filter = currentHomeFilter) {
    return loadFoods().filter((food) => {
      if (food.status !== "active") return false;
      return filter === "全部" || food.storage === filter;
    });
  }

  function renderHomeList(screen, filter = currentHomeFilter) {
    const list = screen.querySelector(".food-list");
    if (!list) return;

    const foods = activeFoods(filter);
    if (!foods.length) {
      list.innerHTML = `<article class="empty-row">这里还没有食物</article>`;
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
              <p>${escapeHtml(formatDate(food.purchaseDate))}购买 · ${escapeHtml(food.storage)} · ${escapeHtml(amount)}</p>
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

  function renderHomeScreens() {
    ["home", "homeSheet"].forEach((name) => {
      const screen = screenElement(name);
      if (!screen) return;
      const buttons = screen.querySelectorAll(".segmented button");
      buttons.forEach((button) => {
        button.classList.toggle("active", button.textContent.trim() === currentHomeFilter);
      });
      renderHomeList(screen, currentHomeFilter);
    });

    const dueCount = activeFoods().filter((food) => remindInfo(food).className === "urgent").length;
    document.querySelectorAll(".hero-copy strong").forEach((item) => {
      item.textContent = `${dueCount || 0} 件食物快到提醒日`;
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
        return `
          <article data-food-id="${escapeHtml(food.id)}">
            ${thumbMarkup(food)}
            <div>
              <h2>${escapeHtml(food.name)}</h2>
              <p>${escapeHtml(recordDescription(food))}</p>
            </div>
            <strong class="record-state ${escapeHtml(state.className)}">${escapeHtml(state.label)}</strong>
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
    const profileActive = ["profile", "settings", "syncSettings"].includes(screenName);
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

  function resetAddForm() {
    const add = screenElement("add");
    if (!add) return;
    add.querySelector("[aria-label='食物名称']").value = "草莓";
    add.querySelector("[aria-label='购买时间']").value = today.toISOString().slice(0, 10);
    add.querySelector("[aria-label='数量']").value = "1";
    add.querySelector("[aria-label='数量单位']").value = "斤";
    add.querySelector(".stepper strong").textContent = "3 天";
    add.querySelectorAll(".storage-chips button").forEach((button, index) => {
      button.classList.toggle("active", index === 0);
    });
    add.querySelector(".photo-area").classList.remove("is-captured");
    add.querySelector(".photo-area").style.removeProperty("--captured-photo");
    add.querySelector(".photo-area > button").textContent = "拍照";
    add.querySelector(".quantity-picker-toggle").setAttribute("aria-expanded", "false");
    add.querySelector(".quantity-picker").classList.remove("is-open");
    add.querySelectorAll(".quantity-wheel button").forEach((button, index) => {
      button.classList.toggle("active", index === 0);
    });
    capturedPhoto = "";
  }

  function saveFoodFromForm() {
    const name = formValue(".phone-add [aria-label='食物名称']") || "未命名食物";
    const purchaseDate = formValue(".phone-add [aria-label='购买时间']") || today.toISOString().slice(0, 10);
    const quantity = formValue(".phone-add [aria-label='数量']") || "1";
    const unit = formValue(".phone-add [aria-label='数量单位']") || "个";
    const storage = selectedOption(".phone-add .storage-chips .active") || "冰箱";
    const remindDays = Number.parseInt(document.querySelector(".phone-add .stepper strong")?.textContent, 10) || 3;
    const foods = loadFoods();

    foods.unshift({
      id: `food-${Date.now()}`,
      name,
      purchaseDate,
      storage,
      quantity,
      unit,
      remindDays,
      status: "active",
      type: classifyFood(name),
      photo: capturedPhoto,
      photoText: capturedPhoto ? "" : name.slice(0, 3),
      createdAt: today.toISOString().slice(0, 10),
    });

    saveFoods(foods);
    currentHomeFilter = "全部";
    resetAddForm();
    showScreen("home", { reset: true });
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

  function closeQuantityPicker() {
    const add = screenElement("add");
    if (!add) return;
    add.querySelector(".quantity-picker")?.classList.remove("is-open");
    add.querySelector(".quantity-picker-toggle")?.setAttribute("aria-expanded", "false");
  }

  function toggleQuantityPicker(button) {
    const picker = button.nextElementSibling;
    if (!picker || !picker.classList.contains("quantity-picker")) return;
    const willOpen = !picker.classList.contains("is-open");
    picker.classList.toggle("is-open", willOpen);
    button.setAttribute("aria-expanded", String(willOpen));
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
    saveFoods(foods);
    selectedFoodId = null;
    showScreen("home", { reset: true });
  }

  function delaySelectedFood() {
    if (!selectedFoodId) return;
    const foods = loadFoods();
    const food = foods.find((item) => item.id === selectedFoodId);
    if (!food) return;

    food.remindDays = Number(food.remindDays || 3) + 1;
    saveFoods(foods);
    selectedFoodId = null;
    showScreen("home", { reset: true });
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
    const account = screen.querySelector("[aria-label='坚果云账号']");
    const password = screen.querySelector("[aria-label='坚果云应用密码']");
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
      account: screen.querySelector("[aria-label='坚果云账号']")?.value.trim() || "",
      password: screen.querySelector("[aria-label='坚果云应用密码']")?.value || "",
      remoteFile: screen.querySelector("[aria-label='同步远程文件']")?.value.trim() || "",
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
    const button = screen.querySelector(".sync-save-action");
    if (!button) return;
    button.textContent = "已保存";
    window.setTimeout(() => {
      button.textContent = "保存同步设置";
    }, 1200);
  }

  function handlePhotoFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      capturedPhoto = String(reader.result || "");
      const area = screenElement("add")?.querySelector(".photo-area");
      if (!area) return;
      area.classList.add("is-captured");
      area.style.setProperty("--captured-photo", `url("${capturedPhoto}")`);
      area.querySelector(".photo-area > button").textContent = "已拍照";
    };
    reader.readAsDataURL(file);
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

    const saveButton = target.closest(".phone-add .primary-action");
    if (saveButton) {
      saveFoodFromForm();
      return;
    }

    const photoButton = target.closest(".photo-area > button");
    if (photoButton) {
      const input = photoButton.closest(".photo-area").querySelector(".camera-input");
      if (input) input.click();
      return;
    }

    const quantityToggle = target.closest(".quantity-picker-toggle");
    if (quantityToggle) {
      toggleQuantityPicker(quantityToggle);
      return;
    }

    const quantityChoice = target.closest(".quantity-wheel button");
    if (quantityChoice) {
      const input = document.querySelector(".phone-add [aria-label='数量']");
      if (input) input.value = quantityChoice.textContent.trim();
      activateItem(quantityChoice, "button");
      closeQuantityPicker();
      return;
    }

    if (!target.closest(".quantity-picker") && !target.closest(".quantity-picker-toggle")) {
      closeQuantityPicker();
    }

    const storageButton = target.closest(".storage-chips button");
    if (storageButton) {
      activateItem(storageButton, "button");
      return;
    }

    const stepperButton = target.closest(".stepper button");
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

    const sheetAction = target.closest(".sheet-actions button");
    if (sheetAction) {
      const index = itemIndex(sheetAction, "button");
      if (index === 0) markSelectedFood("eaten");
      if (index === 1) markSelectedFood("spoiled");
      if (index === 2) delaySelectedFood();
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
      renderHomeScreens();
      return;
    }

    const settingsButton = target.closest(".settings-button");
    if (settingsButton) {
      showScreen("settings");
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

    const syncSave = target.closest(".sync-save-action");
    if (syncSave) {
      saveSyncSettings();
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
    }
  }

  function handleChange(event) {
    const input = event.target.closest(".camera-input");
    if (input) {
      handlePhotoFile(input.files && input.files[0]);
    }
  }

  function handleInput(event) {
    const input = event.target.closest(".quantity-input");
    if (!input) return;

    document.querySelectorAll(".quantity-wheel button").forEach((button) => {
      button.classList.toggle("active", button.textContent.trim() === input.value.trim());
    });
  }

  function init() {
    enableRuntimeMode();
    const purchaseInput = document.querySelector(".phone-add [aria-label='购买时间']");
    if (purchaseInput) purchaseInput.type = "date";

    renderAll();
    resetAddForm();
    fillSyncSettingsForm();
    allScreens().forEach((screen, index) => {
      screen.classList.toggle("is-active", index === 0);
    });
    syncTabbars("home");
    document.addEventListener("click", handleClick);
    document.addEventListener("change", handleChange);
    document.addEventListener("input", handleInput);
  }

  window.FoodTimeApp = {
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
