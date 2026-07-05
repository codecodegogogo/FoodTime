(function () {
  const screens = {
    home: ".phone-home:not(.phone-home-sheet)",
    homeSheet: ".phone-home-sheet",
    add: ".phone-add",
    stats: ".phone-stats",
    history: ".phone-history",
    fridge: ".phone-fridge-records",
    room: ".phone-room-records",
  };

  let currentScreen = "home";
  let routeStack = ["home"];

  function screenElement(name) {
    return document.querySelector(screens[name]);
  }

  function allScreens() {
    return Object.values(screens)
      .map((selector) => document.querySelector(selector))
      .filter(Boolean);
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
    document.querySelectorAll(".tabbar").forEach((bar) => {
      const tabs = Array.from(bar.querySelectorAll("span"));
      tabs.forEach((tab, index) => {
        tab.classList.toggle(
          "active",
          (index === 0 && fridgeActive) || (index === 1 && screenName === "stats"),
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

  function applyRecordFilter(nav, buttonIndex) {
    const list = nav.nextElementSibling;
    if (!list || !list.classList.contains("history-list")) return;

    const owner = nav.closest(".phone");
    const isHistory = owner && owner.matches(screens.history);
    const rows = Array.from(list.querySelectorAll("article"));

    rows.forEach((row) => {
      const state = row.querySelector(".record-state");
      const isStoring = state && state.classList.contains("storing");
      const isEaten = state && state.classList.contains("eaten");
      const isSpoiled = state && state.classList.contains("spoiled");
      const isReminder =
        isSpoiled || (state && /[\u63d0\u9192\u5904\u7406]/.test(state.textContent));
      let visible = true;

      if (isHistory) {
        visible =
          (buttonIndex === 0 && isStoring) ||
          (buttonIndex === 1 && isEaten) ||
          (buttonIndex === 2 && isSpoiled);
      } else if (buttonIndex === 1) {
        visible = Boolean(isReminder);
      } else if (buttonIndex === 2) {
        visible = !isReminder;
      }

      row.classList.toggle("is-hidden", !visible);
    });
  }

  function selectRecordFilter(screenName, filterIndex) {
    const screen = screenElement(screenName);
    const nav = screen && screen.querySelector(".history-filters");
    const button = nav && nav.querySelectorAll("button")[filterIndex];
    if (!button) return;

    activateItem(button, "button");
    applyRecordFilter(nav, filterIndex);
  }

  function updateReminderDays(button) {
    const stepper = button.closest(".stepper");
    const value = stepper && stepper.querySelector("strong");
    if (!value) return;

    const buttons = Array.from(stepper.querySelectorAll("button"));
    const direction = buttons.indexOf(button) === 0 ? -1 : 1;
    const current = Number.parseInt(value.textContent, 10) || 3;
    const next = Math.min(30, Math.max(1, current + direction));
    value.textContent = `${next} \u5929`;
  }

  function handleClick(event) {
    const target = event.target;

    const addButton = target.closest(".icon-button");
    if (addButton && addButton.closest(".app-header")) {
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
      showScreen("home", { reset: true });
      return;
    }

    const photoButton = target.closest(".photo-area > button");
    if (photoButton) {
      photoButton.textContent = "\u5df2\u62cd\u7167";
      photoButton.closest(".photo-area").classList.add("is-captured");
      return;
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
      showScreen("homeSheet");
      return;
    }

    const sheetClose = target.closest(".sheet-close");
    if (sheetClose) {
      showScreen("home", { reset: true });
      return;
    }

    const sheetAction = target.closest(".sheet-actions button");
    if (sheetAction) {
      const index = itemIndex(sheetAction, "button");
      if (index === 2) {
        showScreen("home", { reset: true });
        return;
      }

      showScreen("history", { replace: true });
      selectRecordFilter("history", index === 0 ? 1 : 2);
      return;
    }

    const tabItem = target.closest(".tabbar span");
    if (tabItem) {
      const index = itemIndex(tabItem, "span");
      showScreen(index === 0 ? "home" : "stats");
      return;
    }

    const homeFilter = target.closest(".phone-home .segmented button");
    if (homeFilter) {
      const index = itemIndex(homeFilter, "button");
      activateItem(homeFilter, "button");
      if (index === 0) showScreen("home", { reset: true });
      if (index === 1) showScreen("fridge");
      if (index === 2) showScreen("room");
      return;
    }

    const statsCard = target.closest(".phone-stats .stats-grid article");
    if (statsCard) {
      const index = itemIndex(statsCard, "article");
      if (index === 0) showScreen("fridge");
      if (index === 1) showScreen("room");
      if (index === 2) showScreen("history");
      return;
    }

    const recordFilter = target.closest(".history-filters button");
    if (recordFilter) {
      const index = itemIndex(recordFilter, "button");
      activateItem(recordFilter, "button");
      applyRecordFilter(recordFilter.parentElement, index);
    }
  }

  function init() {
    enableRuntimeMode();
    allScreens().forEach((screen, index) => {
      screen.classList.toggle("is-active", index === 0);
    });
    document.querySelectorAll(".history-filters").forEach((nav) => {
      const active = nav.querySelector(".active") || nav.querySelector("button");
      if (!active) return;
      applyRecordFilter(nav, itemIndex(active, "button"));
    });
    syncTabbars("home");
    document.addEventListener("click", handleClick);
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
