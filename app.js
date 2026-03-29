/* =====================================================================
   SPA NAVIGATION — main tabs + farm sub-pages
   ===================================================================== */
var FARM_PAGE_IDS = [
  "farm-hub", "farm-planting", "farm-care", "farm-timeline", "farm-finance",
  "farm-yield", "farm-harvest", "farm-advice", "farm-reports"
];
var KNOWN_PAGE_IDS = ["home", "guides", "profile"].concat(FARM_PAGE_IDS);

function showPage(pageId) {
  var pages = document.querySelectorAll(".page");
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove("active");
  var t = document.getElementById(pageId);
  if (t) t.classList.add("active");
  window.scrollTo(0, 0);
  try {
    if (KNOWN_PAGE_IDS.indexOf(pageId) >= 0) localStorage.setItem(LS_LAST_PAGE, pageId);
  } catch (e) {}

  var navBtn = null;
  if (pageId === "home") navBtn = document.querySelector('.nav button[data-nav="home"]');
  else if (pageId === "guides") navBtn = document.querySelector('.nav button[data-nav="guides"]');
  else if (pageId === "profile") navBtn = document.querySelector('.nav button[data-nav="profile"]');
  else if (FARM_PAGE_IDS.indexOf(pageId) >= 0) navBtn = document.querySelector('.nav button[data-nav="farm-hub"]');
  if (navBtn) setActive(navBtn);
  if (pageId === "farm-planting") updatePlantingNewFarmBanner();
  if (pageId === "farm-hub") refreshHubFarmCalendar();
  if (pageId === "farm-finance") {
    refreshFinanceLabourLive();
    renderCapitalLogUI();
    setCapitalLogDateDefault();
  }
  if (pageId === "home") refreshHomeFarmDashboard();
  if (pageId === "profile") syncProfileBackupEmailField();
  updateHomeReadGuidesBanner();
  updateHomeHowToBanner();
  refreshGlobalBackupBanners();
}

function setActive(btn) {
  var navButtons = document.querySelectorAll(".nav button");
  for (var j = 0; j < navButtons.length; j++) {
    navButtons[j].classList.remove("active");
    navButtons[j].removeAttribute("aria-current");
  }
  if (btn) {
    btn.classList.add("active");
    btn.setAttribute("aria-current", "page");
  }
}
window.showPage = showPage;
window.setActive = setActive;

function initAppNavigation() {
  var navTriggers = document.querySelectorAll("[data-nav]");
  for (var k = 0; k < navTriggers.length; k++) {
    navTriggers[k].addEventListener("click", function () {
      var pageId = this.getAttribute("data-nav");
      if (!pageId) return;
      showPage(pageId);
    });
  }
}

/** Hub tiles + back buttons: jump between farm-hub and farm-* sub-pages (delegation = dynamic hub content works) */
function initFarmSubNavigation() {
  var app = document.querySelector(".app");
  if (!app || app.dataset.farmSubNavBound) return;
  app.dataset.farmSubNavBound = "1";
  app.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-farm-sub]");
    if (!t || !app.contains(t)) return;
    var pid = t.getAttribute("data-farm-sub");
    if (pid) showPage(pid);
  });
}
window.initFarmSubNavigation = initFarmSubNavigation;

/* =====================================================================
   CONSTANTS — Uganda maize planning (field schedule + rule-based UI)
   ===================================================================== */
var SQFT_PER_ACRE = 43560;
/* 1×3 ft & 2×3 ft — typical Uganda hole spacing */
var PLANTS_PER_ACRE = { "1x3": 14500, "2x3": 7200 };
var SEED_KG_PER_ACRE_BASE = 10;
var BASAL_FERT_KG_PER_ACRE = 50; /* DAP/NPK at planting */
var TOPDRESS_FERT_KG_PER_ACRE = 50; /* Urea or CAN */
var FERT_KG_PER_ACRE = BASAL_FERT_KG_PER_ACRE + TOPDRESS_FERT_KG_PER_ACRE; /* total product kg/ac planning */
var BAG_KG = 100;
var BASE_BAGS_PER_ACRE = 18;

/* Spraying (knapsack program, ~per acre) */
var SPRAY_WATER_L_PER_ACRE = 200;
var SPRAY_TANK_L = 20;
var SPRAY_TANKS_PER_ACRE = 10;
var SPRAY_ML_PER_TANK_LO = 20;
var SPRAY_ML_PER_TANK_HI = 30;
var SPRAY_ML_TOTAL_ACRE_LO = 200;
var SPRAY_ML_TOTAL_ACRE_HI = 300;

/* DAP calendar anchors (midpoints inside each window — see labels for full DAP range) */
var DAP_GERM_CHECK = 7; /* window 5–10 */
var DAP_WEED1 = 17; /* 14–21 */
var DAP_TOPDRESS = 25; /* urea/CAN 21–30 */
var DAP_WEED2 = 31; /* 28–35 */
var DAP_SPRAY1 = 35; /* 30–40 */
var DAP_SPRAY2 = 50; /* 45–55 */
var DAP_TASSEL = 67; /* 60–75 */
var DAP_HARVEST_START = 100;
var DAP_HARVEST_END = 120;

var VARIETY_YIELD_FACTOR = {
  "dkc": 1.08,
  "pannar": 1.05,
  "hybrid": 1.05,
  "opv": 0.92,
  "local": 0.9,
  "default": 1
};

var LS_FARMS = "agriUltimate_farms_v1";
var LS_ACTIVE = "agriUltimate_activeFarmId";
var LS_SEASON = "agriSmartSeasonRecordV1";
var LS_TIMELINE = "agriUltimate_timeline_v1";
var LS_REMINDERS = "farmReminders";
var LS_ADVICE = "agriUltimate_lastAdvice_v1";
var LS_HOME_GUIDES_TIP = "agriSmart_home_guides_tip_dismissed";
var LS_HOME_HOWTO_TIP = "agriSmart_home_howto_tip_dismissed";
var LS_CAPITAL_LOG_PREFIX = "agriUltimate_capitalLog_v1_";
var LS_PIN_HASH = "agriUltimate_pin_hash_v1";
var LS_PIN_SALT = "agriUltimate_pin_salt_v1";
var LS_PHONE_RESET_HASH = "agriUltimate_phone_reset_hash_v1";
var LS_PHONE_RESET_SALT = "agriUltimate_phone_reset_salt_v1";
/** Unlocked for this browser tab: survives refresh; cleared when the tab/session ends or you tap Lock. */
var LS_PIN_TAB_UNLOCK = "agri_pin_tab_unlock_v1";
var SS_PIN_TAB_ID = "agri_pin_tab_id";
var SS_PIN_UNLOCK_SEAL = "agri_pin_unlock_seal";
var SS_PIN_SESSION_LEGACY = "agri_pin_session_unlocked";

var LS_BACKUP_EMAIL = "agri_backup_email_v1";
var LS_BACKUP_REMINDER_DISMISS_DATE = "agri_backup_reminder_dismiss_ymd";
var LS_STALE_BACKUP_BANNER_DISMISS_UNTIL = "agri_stale_backup_dismiss_until_ms";
var LS_LAST_BACKUP_AT = "agri_last_backup_at_ms";
var LS_LAST_PAGE = "agriUltimate_last_page_v1";

/**
 * Optional cloud backup / email recovery — requires YOUR HTTPS API with CORS.
 * Set to origin only, no trailing slash, e.g. "https://api.example.com/agri"
 * POST {BASE}/backup  body: { email, backup, client, ts }
 * POST {BASE}/recover-request  body: { email } — server emails magic link / OTP
 * Browsers cannot send or fetch backups from email without a server you control.
 * Prefer setting URL in agri-config.js (window.AGRI_CONFIG.cloudBackupBaseUrl).
 */
var AGRI_CLOUD_BACKUP_BASE_URL = "";

function getCloudBackupBaseUrl() {
  try {
    if (typeof window !== "undefined" && window.AGRI_CONFIG && window.AGRI_CONFIG.cloudBackupBaseUrl) {
      var u = String(window.AGRI_CONFIG.cloudBackupBaseUrl || "").trim();
      if (u) return u.replace(/\/$/, "");
    }
  } catch (e) {}
  return String(AGRI_CLOUD_BACKUP_BASE_URL || "").trim().replace(/\/$/, "");
}

/** Skip autosave while programmatically filling the form (load farm / season). */
var suppressFarmAutosave = false;
var farmAutosaveTimer = null;
var FARM_AUTOSAVE_MS = 450;
var lastStorageFailNotice = 0;

function safeLocalStorageSetItem(key, value) {
  try {
    if (typeof localStorage === "undefined" || localStorage === null) return false;
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function farmStorageNotifyFail() {
  var now = Date.now();
  if (now - lastStorageFailNotice < 20000) return;
  lastStorageFailNotice = now;
  try {
    alert(
      "Could not save on this device — storage may be full or blocked (e.g. private browsing). Free space or use normal mode, then try again."
    );
  } catch (e2) {}
}

function writeActiveFarmSnapshotToStorage() {
  try {
    var farms = loadFarms();
    var id = getActiveFarmId();
    var snap = collectFormSnapshot();
    var found = false;
    for (var i = 0; i < farms.length; i++) {
      if (farms[i].id === id) {
        farms[i].snapshot = snap;
        found = true;
        break;
      }
    }
    if (!found) return false;
    return safeLocalStorageSetItem(LS_FARMS, JSON.stringify(farms));
  } catch (e) {
    return false;
  }
}

function scheduleFarmAutosave() {
  if (suppressFarmAutosave) return;
  if (farmAutosaveTimer) clearTimeout(farmAutosaveTimer);
  farmAutosaveTimer = setTimeout(function () {
    farmAutosaveTimer = null;
    flushFarmAutosave(false);
  }, FARM_AUTOSAVE_MS);
}

/** @param {boolean} showAlertIfFail if true, always notify when either write fails. */
function flushFarmAutosave(showAlertIfFail) {
  if (suppressFarmAutosave) return true;
  var okFarm = writeActiveFarmSnapshotToStorage();
  var okBundle = saveFarmDataBundle();
  if (!okFarm || !okBundle) {
    if (showAlertIfFail || !okFarm) farmStorageNotifyFail();
  }
  return okFarm && okBundle;
}

function initFarmFormAutosave() {
  var root = document.getElementById("appRoot");
  if (!root || root.dataset.farmAutosaveBound) return;
  root.dataset.farmAutosaveBound = "1";
  function onEdit(ev) {
    var t = ev.target;
    if (!t || typeof t.closest !== "function") return;
    if (t.closest("#pinGate")) return;
    var tag = (t.tagName || "").toLowerCase();
    if (tag !== "input" && tag !== "select" && tag !== "textarea") return;
    scheduleFarmAutosave();
  }
  root.addEventListener("input", onEdit, true);
  root.addEventListener("change", onEdit, true);
}

function bindStorageFlushOnLeave() {
  function flushNow() {
    if (farmAutosaveTimer) {
      clearTimeout(farmAutosaveTimer);
      farmAutosaveTimer = null;
    }
    flushFarmAutosave(false);
  }
  window.addEventListener("beforeunload", flushNow);
  window.addEventListener("pagehide", flushNow);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushNow();
  });
}

var CAPITAL_LOG_CAT_LABEL = {
  tool: "Tool / equipment",
  labour_dig: "Worker — digging / prep",
  labour_plant: "Worker — planting",
  labour_weed: "Worker — weeding",
  labour_harvest: "Worker — harvest",
  labour_other: "Worker — other",
  seed: "Seed",
  fertilizer: "Fertilizer",
  spray: "Spray / chemicals",
  other: "Transport / misc."
};

var latestTotalExpenses = 0;
var latestPlannerCost = 0;
var latestProfitValue = 0;
var latestAdviceText = "";
var latestTimelineEvents = [];

function formatUGX(n) {
  return "UGX " + Number(n).toLocaleString();
}

function escapeHtml(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Structured HTML for farm module results (readable sections on mobile) */
function moWrap(html) {
  return '<div class="module-output">' + html + "</div>";
}

function moSection(heading, bodyHtml) {
  return '<section class="mo-section"><h3 class="mo-h">' + escapeHtml(heading) + "</h3>" + bodyHtml + "</section>";
}

function moKpi(label, valueInnerHtml) {
  return (
    '<div class="mo-kpi"><span class="mo-kpi-label">' + escapeHtml(label) + '</span><span class="mo-kpi-val">' + valueInnerHtml + "</span></div>"
  );
}

function moKpiGrid(inner) {
  return '<div class="mo-kpis">' + inner + "</div>";
}

function moSteps(items) {
  var lis = "";
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    lis +=
      '<li class="mo-step"><div class="mo-step-head"><span class="mo-step-title">' +
      escapeHtml(it.title) +
      '</span><span class="mo-step-when">' +
      escapeHtml(it.when) +
      '</span></div><div class="mo-step-body">' +
      it.body +
      "</div></li>";
  }
  return '<ol class="mo-steps">' + lis + "</ol>";
}

function moListCards(htmlItems) {
  var lis = "";
  for (var j = 0; j < htmlItems.length; j++) {
    lis += "<li>" + htmlItems[j] + "</li>";
  }
  return '<ul class="mo-list mo-list--cards">' + lis + "</ul>";
}

function moListPlain(strings) {
  var lis = "";
  for (var k = 0; k < strings.length; k++) {
    lis += "<li>" + escapeHtml(strings[k]) + "</li>";
  }
  return '<ul class="mo-list">' + lis + "</ul>";
}

function moRecRow(label, valueInnerHtml) {
  return "<tr><th>" + escapeHtml(label) + "</th><td>" + valueInnerHtml + "</td></tr>";
}

function moRecCard(title, rowsHtml, footnoteHtml) {
  var foot = footnoteHtml
    ? '<p class="mo-p mo-muted" style="margin-top:8px;margin-bottom:0;">' + footnoteHtml + "</p>"
    : "";
  return (
    '<div class="mo-rec-card"><h4 class="mo-rec-h">' +
    escapeHtml(title) +
    '</h4><table class="mo-rec-table">' +
    rowsHtml +
    "</table>" +
    foot +
    "</div>"
  );
}

function addDays(date, days) {
  var d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function varietyNorm(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function varietyIsLocal(name) {
  var n = varietyNorm(name);
  if (!n) return false;
  if (n.indexOf("hybrid") >= 0 || n.indexOf("single cross") >= 0 || n.indexOf("single-cross") >= 0) return false;
  if (n.indexOf("local") >= 0 || n.indexOf("opv") >= 0 || n.indexOf("landrace") >= 0) return true;
  /* Longe 1–5 sold as OPVs; Longe …H are hybrids */
  if (/longe\s*\d+h\b/.test(n)) return false;
  if (/longe\s*[1-5](\s|$)/.test(n)) return true;
  return false;
}

function varietyIsHybridLike(name) {
  if (!name || varietyIsLocal(name)) return false;
  var n = varietyNorm(name);
  if (n.indexOf("hybrid") >= 0 || n.indexOf("single cross") >= 0 || n.indexOf("single-cross") >= 0) return true;
  if (n.indexOf("dkc") >= 0 || n.indexOf("dekalb") >= 0) return true;
  if (n.indexOf("pannar") >= 0) return true;
  if (n.indexOf("pioneer") >= 0 || n.indexOf("corteva") >= 0) return true;
  if (n.indexOf("seedco") >= 0 || n.indexOf("seed co") >= 0) return true;
  if (n.indexOf("naromaize") >= 0 || n.indexOf("naro maize") >= 0) return true;
  if (/\bbh\s*3[0-9]\b/.test(n) || /\bbh31\b/.test(n) || /\bbh33\b/.test(n)) return true;
  if (n.indexOf("bazooka") >= 0 || n.indexOf("uh505") >= 0) return true;
  if (n.indexOf("tego") >= 0 || /\bwe21/.test(n)) return true;
  if (/longe\s*\d+h\b/.test(n)) return true;
  return false;
}

function varietyFactor(name) {
  if (!name) return VARIETY_YIELD_FACTOR.default;
  var n = varietyNorm(name);
  if (varietyIsLocal(name)) return VARIETY_YIELD_FACTOR.opv;
  if (n.indexOf("dkc") >= 0 || n.indexOf("dekalb") >= 0) return VARIETY_YIELD_FACTOR.dkc;
  if (n.indexOf("pannar") >= 0) return VARIETY_YIELD_FACTOR.pannar;
  if (varietyIsHybridLike(name) || n.indexOf("hybrid") >= 0) return VARIETY_YIELD_FACTOR.hybrid;
  return VARIETY_YIELD_FACTOR.default;
}

function formatDapWindow(pd, dMin, dMax) {
  return formatDate(addDays(pd, dMin)) + " – " + formatDate(addDays(pd, dMax));
}

function monthRainSeason(monthName) {
  var good = { "March": 1, "April": 1, "September": 1, "October": 1 };
  var moderate = { "May": 1, "November": 1, "February": 1 };
  if (good[monthName]) return "long_or_short_rains_good";
  if (moderate[monthName]) return "marginal";
  return "dry_or_offseason";
}

/* --- Multi-farm --- */
function loadFarms() {
  try {
    var raw = localStorage.getItem(LS_FARMS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [{ id: "default", name: "My farm", snapshot: {} }];
}

function saveFarms(list) {
  if (!safeLocalStorageSetItem(LS_FARMS, JSON.stringify(list))) {
    farmStorageNotifyFail();
    return false;
  }
  return true;
}

function getActiveFarmId() {
  return localStorage.getItem(LS_ACTIVE) || "default";
}

function setActiveFarmId(id) {
  if (!safeLocalStorageSetItem(LS_ACTIVE, id)) farmStorageNotifyFail();
}

function getActiveFarmSnapshot() {
  var farms = loadFarms();
  var id = getActiveFarmId();
  for (var i = 0; i < farms.length; i++) {
    if (farms[i].id === id) return farms[i].snapshot || {};
  }
  return {};
}

function renderFarmSelect() {
  var farms = loadFarms();
  var sel = document.getElementById("farmSelect");
  sel.innerHTML = "";
  var active = getActiveFarmId();
  for (var i = 0; i < farms.length; i++) {
    var o = document.createElement("option");
    o.value = farms[i].id;
    o.textContent = farms[i].name;
    if (farms[i].id === active) o.selected = true;
    sel.appendChild(o);
  }
  sel.onchange = function () {
    setActiveFarmId(sel.value);
    loadFarmSnapshotToForm();
    var home = document.getElementById("home");
    if (home && home.classList.contains("active")) refreshHomeFarmDashboard();
  };
  renderCompareTable(farms);
}

function addFarmProfile() {
  var name = (document.getElementById("newFarmName").value || "").trim();
  if (!name) {
    alert("Enter a farm name.");
    return;
  }
  var farms = loadFarms();
  var id = "farm_" + Date.now();
  farms.push({ id: id, name: name, snapshot: {} });
  if (!saveFarms(farms)) return;
  setActiveFarmId(id);
  document.getElementById("newFarmName").value = "";
  renderFarmSelect();
  loadFarmSnapshotToForm();
}

function snapshotModuleResultHtml(elementId, placeholderSubstring) {
  try {
    var el = document.getElementById(elementId);
    if (!el) return "";
    var inner = el.innerHTML;
    if (!inner || inner.length < 24) return "";
    if (placeholderSubstring && inner.indexOf(placeholderSubstring) !== -1) return "";
    return inner;
  } catch (e) {
    return "";
  }
}

function restoreModuleGlobalsFromSnapshot(sn) {
  if (!sn) return;
  if (sn.latestPlannerCost != null) latestPlannerCost = Number(sn.latestPlannerCost) || 0;
  if (sn.latestTotalExpenses != null) latestTotalExpenses = Number(sn.latestTotalExpenses) || 0;
  if (sn.latestProfitValue != null) latestProfitValue = Number(sn.latestProfitValue) || 0;
  if (sn.latestAdviceText != null && String(sn.latestAdviceText).length) latestAdviceText = String(sn.latestAdviceText);
}

function restoreCachedModuleOutputs(sn) {
  if (!sn) return;
  var pairs = [
    ["uiPlantingHtml", "plantingResult"],
    ["uiCropCareHtml", "cropCareResult"],
    ["uiRecordHtml", "recordResult"],
    ["uiYieldHtml", "yieldPredResult"],
    ["uiHarvestHtml", "harvestResult"],
    ["uiAdviceHtml", "adviceResult"]
  ];
  for (var i = 0; i < pairs.length; i++) {
    var html = sn[pairs[i][0]];
    if (html && typeof html === "string" && html.length > 0) {
      var node = document.getElementById(pairs[i][1]);
      if (node) node.innerHTML = html;
    }
  }
}

function collectFormSnapshot() {
  var labourSum = labourCostSumFromForm();
  return {
    plantLand: document.getElementById("plantLand").value,
    plantMethod: document.getElementById("plantMethod").value,
    plantSpacing: document.getElementById("plantSpacing").value,
    plantSeedsPerHole: document.getElementById("plantSeedsPerHole").value,
    plantDepthCm: document.getElementById("plantDepthCm").value,
    plantMonth: document.getElementById("plantMonth").value,
    plantVariety: document.getElementById("plantVariety").value,
    plantingDateMain: document.getElementById("plantingDateMain").value,
    plantActualHoles: document.getElementById("plantActualHoles").value,
    plantActualSeedKg: document.getElementById("plantActualSeedKg").value,
    plantActualBasalKg: document.getElementById("plantActualBasalKg").value,
    plantPlantingEndDate: document.getElementById("plantPlantingEndDate").value,
    plantPlantingNotes: document.getElementById("plantPlantingNotes").value,
    recordCapital: document.getElementById("recordCapital").value,
    recordSeedCost: document.getElementById("recordSeedCost").value,
    recordFertilizerCost: document.getElementById("recordFertilizerCost").value,
    recordOtherCosts: document.getElementById("recordOtherCosts").value,
    recordLabourDig: document.getElementById("recordLabourDig").value,
    recordLabourPlant: document.getElementById("recordLabourPlant").value,
    recordLabourWeed: document.getElementById("recordLabourWeed").value,
    recordLabourHarvest: document.getElementById("recordLabourHarvest").value,
    recordLabourOther: document.getElementById("recordLabourOther").value,
    recordLabourCost: String(labourSum),
    recordSprayingCost: document.getElementById("recordSprayingCost").value,
    recordRevenue: document.getElementById("recordRevenue").value,
    predLand: document.getElementById("predLand").value,
    predSpacing: document.getElementById("predSpacing").value,
    predVariety: document.getElementById("predVariety").value,
    predPrice: document.getElementById("predPrice").value,
    harvestMethod: document.getElementById("harvestMethod").value,
    harvestGrossBags: document.getElementById("harvestGrossBags").value,
    harvestMoisture: document.getElementById("harvestMoisture").value,
    uiPlantingHtml: snapshotModuleResultHtml("plantingResult", "Run analysis for schedule"),
    uiCropCareHtml: snapshotModuleResultHtml("cropCareResult", "Uses land size and planting"),
    uiRecordHtml: snapshotModuleResultHtml("recordResult", "Enter figures for totals"),
    uiYieldHtml: snapshotModuleResultHtml("yieldPredResult", "Expected bags"),
    uiHarvestHtml: snapshotModuleResultHtml("harvestResult", "Timing, drying"),
    uiAdviceHtml: snapshotModuleResultHtml("adviceResult", "Spacing, inputs"),
    latestPlannerCost: latestPlannerCost,
    latestTotalExpenses: latestTotalExpenses,
    latestProfitValue: latestProfitValue,
    latestAdviceText: latestAdviceText
  };
}

function applySnapshot(s) {
  if (!s) return;
  var keys = Object.keys(s);
  for (var i = 0; i < keys.length; i++) {
    var el = document.getElementById(keys[i]);
    if (el && s[keys[i]] != null) el.value = s[keys[i]];
  }
}

var LABOUR_FIELD_IDS = ["recordLabourDig", "recordLabourPlant", "recordLabourWeed", "recordLabourHarvest", "recordLabourOther"];

function labourCostSumFromForm() {
  var sum = 0;
  for (var i = 0; i < LABOUR_FIELD_IDS.length; i++) {
    var el = document.getElementById(LABOUR_FIELD_IDS[i]);
    sum += el ? Number(el.value) || 0 : 0;
  }
  return sum;
}

function labourTotalFromSnapshot(sn) {
  sn = sn || {};
  var sum = 0;
  for (var j = 0; j < LABOUR_FIELD_IDS.length; j++) {
    sum += Number(sn[LABOUR_FIELD_IDS[j]]) || 0;
  }
  if (sum > 0) return sum;
  return Number(sn.recordLabourCost) || 0;
}

function spendFromSnapshot(sn) {
  sn = sn || {};
  return (
    (Number(sn.recordSeedCost) || 0) +
    (Number(sn.recordFertilizerCost) || 0) +
    labourTotalFromSnapshot(sn) +
    (Number(sn.recordSprayingCost) || 0) +
    (Number(sn.recordOtherCosts) || 0)
  );
}

function migrateLegacyLabourIntoForm(sn) {
  if (!sn) return;
  var sumLines = 0;
  for (var k = 0; k < LABOUR_FIELD_IDS.length; k++) {
    sumLines += Number(sn[LABOUR_FIELD_IDS[k]]) || 0;
  }
  var legacy = Number(sn.recordLabourCost) || 0;
  if (sumLines === 0 && legacy > 0) {
    var other = document.getElementById("recordLabourOther");
    if (other && (!String(other.value).trim() || Number(other.value) === 0)) other.value = String(legacy);
  }
}

function refreshFinanceLabourLive() {
  var el = document.getElementById("financeLabourTotalLive");
  if (el) el.textContent = (labourCostSumFromForm() || 0).toLocaleString();
}

function initFinanceLabourLiveTotal() {
  var page = document.getElementById("farm-finance");
  if (!page || page.dataset.labourLiveBound) return;
  page.dataset.labourLiveBound = "1";
  var ids = [
    "recordCapital",
    "recordSeedCost",
    "recordFertilizerCost",
    "recordOtherCosts",
    "recordSprayingCost",
    "recordRevenue"
  ].concat(LABOUR_FIELD_IDS);
  function bump() {
    refreshFinanceLabourLive();
  }
  for (var i = 0; i < ids.length; i++) {
    var inp = document.getElementById(ids[i]);
    if (inp) {
      inp.addEventListener("input", bump);
      inp.addEventListener("change", bump);
    }
  }
  refreshFinanceLabourLive();
}

function financePct(part, whole) {
  if (!whole || whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

function capitalLogStorageKey() {
  return LS_CAPITAL_LOG_PREFIX + getActiveFarmId();
}

function loadCapitalLog() {
  try {
    var raw = localStorage.getItem(capitalLogStorageKey());
    if (raw) {
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }
  } catch (e) {}
  return [];
}

function saveCapitalLog(entries) {
  return safeLocalStorageSetItem(capitalLogStorageKey(), JSON.stringify(entries));
}

function aggregateCapitalLogTotals() {
  var list = loadCapitalLog();
  var sums = {
    tool: 0,
    labour_dig: 0,
    labour_plant: 0,
    labour_weed: 0,
    labour_harvest: 0,
    labour_other: 0,
    seed: 0,
    fertilizer: 0,
    spray: 0,
    other: 0
  };
  var total = 0;
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    var a = Number(e.amount) || 0;
    total += a;
    var c = e.cat;
    if (Object.prototype.hasOwnProperty.call(sums, c)) sums[c] += a;
    else sums.other += a;
  }
  return { sums: sums, total: total, count: list.length };
}

function setCapitalLogDateDefault() {
  var el = document.getElementById("capitalLogDate");
  if (!el || el.value) return;
  el.value = new Date().toISOString().slice(0, 10);
}

function removeCapitalLogEntry(entryId) {
  if (!entryId) return;
  var list = loadCapitalLog().filter(function (x) {
    return x.id !== entryId;
  });
  if (!saveCapitalLog(list)) {
    farmStorageNotifyFail();
    return;
  }
  renderCapitalLogUI();
}

function renderCapitalLogUI() {
  var summaryEl = document.getElementById("capitalLogSummary");
  var listEl = document.getElementById("capitalLogList");
  if (!summaryEl || !listEl) return;

  var agg = aggregateCapitalLogTotals();
  var s = agg.sums;
  var lines = [];
  var keys = Object.keys(s);
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    if (s[key] > 0) {
      lines.push(
        "<div><strong>" +
          escapeHtml(CAPITAL_LOG_CAT_LABEL[key] || key) +
          ":</strong> " +
          formatUGX(s[key]) +
          "</div>"
      );
    }
  }
  if (agg.count === 0) {
    summaryEl.innerHTML =
      "<strong>Log total:</strong> " +
      formatUGX(0) +
      " · <span class=\"mo-muted\">No entries yet — add tools, worker payments, or inputs above.</span>";
  } else {
    summaryEl.innerHTML =
      (lines.length ? '<div class="mo-stack" style="margin-bottom:8px;">' + lines.join("") + "</div>" : "") +
      "<strong>Log total (" +
      agg.count +
      " items):</strong> " +
      formatUGX(agg.total);
  }

  var list = loadCapitalLog().slice();
  list.sort(function (a, b) {
    return String(b.date || "").localeCompare(String(a.date || ""));
  });
  listEl.innerHTML = "";
  for (var i = 0; i < list.length; i++) {
    var e = list[i];
    var li = document.createElement("li");
    li.className = "capital-log-item";
    var catLabel = CAPITAL_LOG_CAT_LABEL[e.cat] || e.cat || "—";
    var note = (e.note || "").trim();
    li.innerHTML =
      "<div>" +
      '<div class="capital-log-item__meta">' +
      escapeHtml(e.date || "—") +
      " · " +
      escapeHtml(catLabel) +
      "</div>" +
      (note
        ? '<p class="capital-log-item__note">' + escapeHtml(note) + "</p>"
        : "") +
      "</div>" +
      '<div class="capital-log-item__amt">' +
      escapeHtml(formatUGX(Number(e.amount) || 0)) +
      "</div>" +
      '<button type="button" class="btn-outline capital-log-item__del" data-capital-log-del="' +
      escapeHtml(e.id) +
      '">Remove</button>';
    listEl.appendChild(li);
  }
}

function addCapitalLogEntry() {
  var dateEl = document.getElementById("capitalLogDate");
  var catEl = document.getElementById("capitalLogCategory");
  var noteEl = document.getElementById("capitalLogNote");
  var amtEl = document.getElementById("capitalLogAmount");
  if (!dateEl || !catEl || !amtEl) return;
  var date = dateEl.value;
  var cat = catEl.value || "other";
  var note = noteEl ? (noteEl.value || "").trim() : "";
  var amount = Number(amtEl.value) || 0;
  if (!date) {
    alert("Choose a date for this payment or purchase.");
    return;
  }
  if (amount <= 0) {
    alert("Enter an amount greater than zero.");
    return;
  }
  var list = loadCapitalLog();
  list.push({
    id: "cl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
    date: date,
    cat: cat,
    note: note,
    amount: amount
  });
  if (!saveCapitalLog(list)) {
    list.pop();
    farmStorageNotifyFail();
    return;
  }
  amtEl.value = "";
  if (noteEl) noteEl.value = "";
  renderCapitalLogUI();
}

function applyCapitalLogToFinanceForm() {
  var t = aggregateCapitalLogTotals();
  var s = t.sums;
  if (t.count === 0) {
    alert("Add at least one entry to the capital log first.");
    return;
  }
  document.getElementById("recordSeedCost").value = s.seed ? String(s.seed) : "";
  document.getElementById("recordFertilizerCost").value = s.fertilizer ? String(s.fertilizer) : "";
  document.getElementById("recordSprayingCost").value = s.spray ? String(s.spray) : "";
  document.getElementById("recordLabourDig").value = s.labour_dig ? String(s.labour_dig) : "";
  document.getElementById("recordLabourPlant").value = s.labour_plant ? String(s.labour_plant) : "";
  document.getElementById("recordLabourWeed").value = s.labour_weed ? String(s.labour_weed) : "";
  document.getElementById("recordLabourHarvest").value = s.labour_harvest ? String(s.labour_harvest) : "";
  document.getElementById("recordLabourOther").value = s.labour_other ? String(s.labour_other) : "";
  var otherInputs = (s.other || 0) + (s.tool || 0);
  document.getElementById("recordOtherCosts").value = otherInputs ? String(otherInputs) : "";
  refreshFinanceLabourLive();
  setFinanceTab("overview");
  runRecordKeeping();
}

function setFinanceTab(name) {
  var ov = document.getElementById("financePanelOverview");
  var cap = document.getElementById("financePanelCapital");
  var bO = document.getElementById("financeTabOverviewBtn");
  var bC = document.getElementById("financeTabCapitalBtn");
  if (!ov || !cap) return;
  var isOv = name !== "capital";
  ov.hidden = !isOv;
  cap.hidden = isOv;
  if (bO) {
    bO.classList.toggle("finance-tab--active", isOv);
    bO.setAttribute("aria-selected", isOv ? "true" : "false");
  }
  if (bC) {
    bC.classList.toggle("finance-tab--active", !isOv);
    bC.setAttribute("aria-selected", !isOv ? "true" : "false");
  }
  if (!isOv) {
    setCapitalLogDateDefault();
    renderCapitalLogUI();
  }
}

function initFinanceTabsAndCapitalLog() {
  var host = document.getElementById("farm-finance");
  if (!host || host.dataset.financeTabsBound) return;
  host.dataset.financeTabsBound = "1";
  host.addEventListener("click", function (ev) {
    var tab = ev.target.closest("[data-finance-tab]");
    if (!tab || !host.contains(tab)) return;
    setFinanceTab(tab.getAttribute("data-finance-tab"));
  });
  var listEl = document.getElementById("capitalLogList");
  if (listEl && !listEl.dataset.delBound) {
    listEl.dataset.delBound = "1";
    listEl.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-capital-log-del]");
      if (!btn || !listEl.contains(btn)) return;
      removeCapitalLogEntry(btn.getAttribute("data-capital-log-del"));
    });
  }
}

function saveActiveFarmSnapshot() {
  var id = getActiveFarmId();
  if (!flushFarmAutosave(true)) return;
  alert("Saved to farm profile: " + id);
  renderFarmSelect();
  refreshHubFarmCalendar();
}

function isSnapshotNewForPlanting(sn) {
  sn = sn || {};
  if (sn.plantLand == null || String(sn.plantLand).trim() === "") return true;
  var l = Number(sn.plantLand);
  return !l || l <= 0;
}

function resetPlantingTabFields() {
  var ids = [
    "plantLand",
    "plantDepthCm",
    "plantMonth",
    "plantVariety",
    "plantingDateMain",
    "plantActualHoles",
    "plantActualSeedKg",
    "plantActualBasalKg",
    "plantPlantingEndDate",
    "plantPlantingNotes"
  ];
  for (var r = 0; r < ids.length; r++) {
    var el = document.getElementById(ids[r]);
    if (el) el.value = "";
  }
  var seeds = document.getElementById("plantSeedsPerHole");
  if (seeds) seeds.value = "1";
}

function getActiveFarmName() {
  var sel = document.getElementById("farmSelect");
  if (!sel || sel.selectedIndex < 0) return "This farm";
  return (sel.options[sel.selectedIndex].textContent || "").trim() || "This farm";
}

function updatePlantingNewFarmBanner() {
  var el = document.getElementById("plantingNewFarmHint");
  if (!el) return;
  var land = Number(document.getElementById("plantLand").value);
  var show = !land || land <= 0;
  if (!show) {
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
    return;
  }
  el.hidden = false;
  el.setAttribute("aria-hidden", "false");
  el.innerHTML =
    "<strong>" +
    escapeHtml(getActiveFarmName()) +
    ' — new / empty plan</strong><span class="planting-start-banner__line">Enter <b>acres</b>, spacing, seeds/hole, <b>month</b> &amp; <b>planting date</b>, then <b>Analyze planting plan</b>. Save on Farm menu.</span>';
}

function initPlantingBannerWatch() {
  var landIn = document.getElementById("plantLand");
  if (!landIn || landIn.dataset.bannerWatch) return;
  landIn.dataset.bannerWatch = "1";
  landIn.addEventListener("input", updatePlantingNewFarmBanner);
  landIn.addEventListener("change", updatePlantingNewFarmBanner);
}

function loadFarmSnapshotToForm() {
  suppressFarmAutosave = true;
  try {
    var farms = loadFarms();
    var id = getActiveFarmId();
    for (var i = 0; i < farms.length; i++) {
      if (farms[i].id === id) {
        var sn = farms[i].snapshot || {};
        if (isSnapshotNewForPlanting(sn)) {
          resetPlantingTabFields();
        }
        applySnapshot(sn);
        migrateLegacyLabourIntoForm(sn);
        restoreModuleGlobalsFromSnapshot(sn);
        refreshFinanceLabourLive();
        renderCapitalLogUI();
        updatePlantingNewFarmBanner();
        restoreCachedModuleOutputs(sn);
        refreshSummary();
        refreshHubFarmCalendar();
        return;
      }
    }
    updatePlantingNewFarmBanner();
    refreshHubFarmCalendar();
    renderCapitalLogUI();
  } finally {
    suppressFarmAutosave = false;
  }
}

function renderCompareTable(farms) {
  var wrap = document.getElementById("farmCompareWrap");
  if (!farms || farms.length < 2) {
    wrap.innerHTML = "<p class=\"hint\">Add another farm to compare capital vs spend.</p>";
    return;
  }
  var html = "<table><thead><tr><th>Farm</th><th>Capital</th><th>Total spend</th></tr></thead><tbody>";
  for (var i = 0; i < farms.length; i++) {
    var sn = farms[i].snapshot || {};
    var cap = Number(sn.recordCapital) || 0;
    var spend = spendFromSnapshot(sn);
    html += "<tr><td>" + escapeHtml(farms[i].name) + "</td><td>" + cap.toLocaleString() + "</td><td>" + spend.toLocaleString() + "</td></tr>";
  }
  html += "</tbody></table>";
  wrap.innerHTML = html;
}

/* --- 1. Planting module --- */
function runPlantingModule() {
  var land = Number(document.getElementById("plantLand").value);
  var method = document.getElementById("plantMethod").value;
  var spacing = document.getElementById("plantSpacing").value;
  var shRaw = Number(document.getElementById("plantSeedsPerHole").value);
  var sh = !shRaw || shRaw < 1 ? 1 : shRaw > 3 ? 3 : shRaw;
  var depth = Number(document.getElementById("plantDepthCm").value);
  var month = document.getElementById("plantMonth").value;
  var variety = document.getElementById("plantVariety").value;
  var plantDateVal = document.getElementById("plantingDateMain").value;
  var out = document.getElementById("plantingResult");
  var box = document.getElementById("plantingResultBox");

  if (!land || land <= 0) {
    out.innerHTML = moWrap(moSection("Input needed", '<p class="mo-p mo-muted">Enter valid land size (acres).</p>'));
    updatePlantingNewFarmBanner();
    refreshHubFarmCalendar();
    scheduleFarmAutosave();
    return;
  }

  var plantsPerAcre = PLANTS_PER_ACRE[spacing] || PLANTS_PER_ACRE["1x3"];
  var holesTotal = plantsPerAcre * land;
  var totalPlants = holesTotal;
  var seedKgPerAcreForSpacing = SEED_KG_PER_ACRE_BASE * (spacing === "2x3" ? 1.05 : 1);
  var seedKg = land * seedKgPerAcreForSpacing * sh;
  var alerts = [];
  var optimal = [];

  if (varietyIsHybridLike(variety) && sh !== 1) {
    alerts.push("⚠️ Hybrid rule: usually <b>1 seed/hole</b> — extra seeds add cost and competition.");
  }
  if (varietyIsLocal(variety) && sh < 2) {
    alerts.push("⚠️ Local / OPV rule: often <b>2 seeds/hole</b> then thin to the strongest plant.");
  }
  if (!varietyIsHybridLike(variety) && !varietyIsLocal(variety)) {
    optimal.push("Set variety name (hybrid vs local) to unlock 1 vs 2 seeds/hole hints.");
  }
  if (spacing === "1x3" && sh !== 1 && !varietyIsLocal(variety)) {
    alerts.push("⚠️ 1×3 ft: hybrids normally 1 seed/hole; locals often 2 then thin.");
  }
  if (spacing === "2x3" && sh < 2 && varietyIsLocal(variety)) {
    alerts.push("⚠️ 2×3 ft + local: plan 2 seeds/hole unless you single-seed with high germination.");
  }
  if (sh === 1 && spacing === "2x3") {
    optimal.push("With <b>1 seed/hole</b>, <b>1×3 ft</b> is often used for higher plant population (hybrids).");
  }
  if (sh >= 2 && spacing === "1x3") {
    optimal.push("With <b>2 seeds/hole</b>, <b>2×3 ft</b> is usually easier (thin after emergence) — you chose 1×3.");
  }
  if (depth && (depth < 3 || depth > 5)) alerts.push("⚠️ Depth " + depth + " cm: target <b>3–5 cm</b> in moist soil.");
  if (!depth) optimal.push("Set depth to 3–5 cm in moist furrows.");

  var season = month ? monthRainSeason(month) : "";
  if (season === "long_or_short_rains_good") optimal.push("✅ Planting month fits main rain windows for much of Uganda.");
  if (season === "marginal") alerts.push("⚠️ Marginal season timing — monitor rains and consider short-cycle variety.");
  if (season === "dry_or_offseason" && month) alerts.push("⚠️ Off-peak month — higher drought risk unless irrigated.");

  if (method === "hoe" && land > 5) alerts.push("💡 Large area with hoe: allow extra labour days or stagger planting.");
  if (method === "mech" && land < 1) alerts.push("💡 Mechanized prep may be costly for sub-acre plots.");

  var scheduleSectionBody = "";
  if (plantDateVal) {
    var pd = new Date(plantDateVal);
    var stepItems = [
      {
        title: "Day 0 — Planting & basal",
        when: formatDate(pd),
        body:
          "1×3 ≈14,500 plants/ac; 2×3 ≈7,200/ac. Depth <b>3–5 cm</b>. Basal <b>DAP/NPK " +
          BASAL_FERT_KG_PER_ACRE +
          " kg/ac</b> in the hole <b>without touching the seed</b>."
      },
      {
        title: "Germination (5–10 DAP)",
        when: formatDapWindow(pd, 5, 10),
        body: "Check germination rate and <b>replant gaps</b>."
      },
      {
        title: "First weeding (14–21 DAP)",
        when: formatDapWindow(pd, 14, 21),
        body: "Remove weeds early; can combine with light soil loosening."
      },
      {
        title: "Top dress (21–30 DAP)",
        when: formatDapWindow(pd, 21, 30),
        body:
          "<b>Urea <i>or</i> CAN " +
          TOPDRESS_FERT_KG_PER_ACRE +
          " kg/ac</b>, 5–8 cm from plant, cover with soil."
      },
      {
        title: "Second weeding (28–35 DAP)",
        when: formatDapWindow(pd, 28, 35),
        body: "Stubborn weeds; <b>hill soil</b> around the plant for support."
      },
      {
        title: "1st spray (30–40 DAP)",
        when: formatDapWindow(pd, 30, 40),
        body:
          "FAW / leaf eaters — e.g. emamectin benzoate or lambda-cyhalothrin <b>" +
          SPRAY_ML_PER_TANK_LO +
          "–" +
          SPRAY_ML_PER_TANK_HI +
          " ml / " +
          SPRAY_TANK_L +
          " L</b> knapsack; ~<b>" +
          SPRAY_TANKS_PER_ACRE +
          " tanks</b> (~" +
          SPRAY_WATER_L_PER_ACRE +
          " L water/ac)."
      },
      {
        title: "2nd spray (45–55 DAP)",
        when: formatDapWindow(pd, 45, 55),
        body: "Repeat if pests present — same tank rate; follow label."
      },
      {
        title: "Tasselling & cob (60–75 DAP)",
        when: formatDapWindow(pd, 60, 75),
        body: "Avoid water/nutrient stress; no heavy spraying unless necessary."
      },
      {
        title: "Harvest (100–120 DAP)",
        when: formatDapWindow(pd, 100, 120),
        body: "Dry husks, hard grain — variety-dependent."
      },
      {
        title: "Drying & storage",
        when: "After harvest",
        body:
          "Sun-dry <b>2–3 weeks</b> on <b>tarpaulin</b> (not bare soil), target <b>~13%</b> moisture. Store in dry bags on a <b>raised platform</b>; optional pesticide dust per advice."
      }
    ];
    scheduleSectionBody = moSteps(stepItems);
  } else {
    scheduleSectionBody = '<p class="mo-p mo-muted">Add a <b>planting date</b> above to unlock calendar windows.</p>';
  }

  var smartRulesHtml =
    '<p class="mo-callout">No first weeding by ~day 21 → <b>yield drops</b>. Skip basal + top dress → <b>low yield</b>. No spraying → <b>high pest risk</b>. Late / off-season planting → <b>lower productivity</b>.</p>';

  var spacingAdvice = spacing === "1x3"
    ? "Higher plant population — good moisture &amp; fertility needed."
    : "Lower stand — compensate with strong weed control &amp; 2 seeds/hole if thinning.";

  var refOneSeedCard = moRecCard(
    "1 seed / hole @ 1 acre (hybrid-style)",
    moRecRow("Hole spacing", "<b>1 × 3 ft</b> (~14,500 holes/ac)") +
      moRecRow("Basal DAP/NPK", "<b>" + BASAL_FERT_KG_PER_ACRE + " kg</b> / ac") +
      moRecRow("Top dress (urea or CAN)", "<b>" + TOPDRESS_FERT_KG_PER_ACRE + " kg</b> / ac") +
      moRecRow("Seed to order", "<b>~" + SEED_KG_PER_ACRE_BASE.toFixed(0) + " kg</b> / ac <span style=\"color:#5a6f5c;font-weight:600;\">+ ~10%</span>") +
      moRecRow("Spray water (guide)", "<b>~" + SPRAY_WATER_L_PER_ACRE + " L</b> / ac · ~" + SPRAY_TANKS_PER_ACRE + " knapsacks") +
      moRecRow("Planting depth", "<b>3–5 cm</b>"),
    "Typical for hybrids: one strong plant per hole; keep basal fertiliser off the seed."
  );

  var refTwoSeedCard = moRecCard(
    "2 seeds / hole @ 1 acre (local-style)",
    moRecRow("Hole spacing", "<b>2 × 3 ft</b> (~7,200 holes/ac)") +
      moRecRow("Basal DAP/NPK", "<b>" + BASAL_FERT_KG_PER_ACRE + " kg</b> / ac") +
      moRecRow("Top dress (urea or CAN)", "<b>" + TOPDRESS_FERT_KG_PER_ACRE + " kg</b> / ac") +
      moRecRow(
        "Seed to order",
        "<b>~" +
          (SEED_KG_PER_ACRE_BASE * 1.05 * 2).toFixed(0) +
          " kg</b> / ac <span style=\"color:#5a6f5c;font-weight:600;\">+ ~10%</span>"
      ) +
      moRecRow("Spray water (guide)", "<b>~" + SPRAY_WATER_L_PER_ACRE + " L</b> / ac") +
      moRecRow("Planting depth", "<b>3–5 cm</b>"),
    "Typical for local/OPV: two seeds, then thin to the best plant per hole."
  );

  var spacingPickLabel = spacing === "1x3" ? "1 × 3 ft (~14,500 holes/ac)" : "2 × 3 ft (~7,200 holes/ac)";
  var yourPlanCard =
    '<div class="mo-rec-card mo-rec-card--yours"><h4 class="mo-rec-h">Your inputs: ' +
    land +
    " ac · " +
    sh +
    " seed(s)/hole · " +
    spacingPickLabel +
    '</h4><table class="mo-rec-table">' +
    moRecRow("Total holes (positions)", "<b>" + Math.round(holesTotal).toLocaleString() + "</b>") +
    moRecRow(
      "Basal DAP/NPK (your land)",
      "<b>" +
        (land * BASAL_FERT_KG_PER_ACRE).toFixed(0) +
        " kg</b> <span style=\"color:#5a6f5c;font-weight:600;\">(" +
        BASAL_FERT_KG_PER_ACRE +
        " kg/ac)</span>"
    ) +
    moRecRow(
      "Top dress (your land)",
      "<b>" +
        (land * TOPDRESS_FERT_KG_PER_ACRE).toFixed(0) +
        " kg</b> <span style=\"color:#5a6f5c;font-weight:600;\">(" +
        TOPDRESS_FERT_KG_PER_ACRE +
        " kg/ac)</span>"
    ) +
    moRecRow(
      "Seed to order (your land)",
      "<b>" +
        seedKg.toFixed(1) +
        " kg</b> <span style=\"color:#5a6f5c;font-weight:600;\">(" +
        (seedKg / land).toFixed(1) +
        " kg/ac plan)</span>"
    ) +
    moRecRow(
      "Spray water (guide, your land)",
      "<b>~" + (land * SPRAY_WATER_L_PER_ACRE).toFixed(0) + " L</b> <span style=\"color:#5a6f5c;font-weight:600;\">(" + SPRAY_WATER_L_PER_ACRE + " L/ac)</span>"
    ) +
    '</table><p class="mo-p mo-muted" style="margin-top:8px;margin-bottom:0;">Fertiliser and spray volumes use the Uganda table per acre, scaled by your acreage. Seed kg scales with seeds/hole and spacing.</p></div>';

  var recSectionHtml =
    '<p class="mo-p" style="margin-top:0">Below: <b>per-acre</b> packages for <b>1 seed/hole</b> vs <b>2 seeds/hole</b>, then <b>your totals</b> from the fields above.</p>' +
    '<div class="mo-rec-pair">' +
    refOneSeedCard +
    refTwoSeedCard +
    "</div>" +
    yourPlanCard;

  var summaryHtml =
    moKpiGrid(
      moKpi("Planting holes (est.)", "<b>" + Math.round(totalPlants).toLocaleString() + "</b>") +
        moKpi("Seed (plan)", "<b>" + seedKg.toFixed(1) + " kg</b><span style=\"font-size:11px;font-weight:600;color:#5a6f5c;display:block;margin-top:2px;\">" + sh + " seed(s)/hole · + ~10%</span>")
    ) +
    '<p class="mo-p"><strong>Spacing:</strong> ' +
    spacingAdvice +
    "</p>" +
    "<p class=\"mo-p\"><strong>Variety:</strong> " +
    escapeHtml(variety || "Not set") +
    " · yield factor <b>" +
    varietyFactor(variety).toFixed(2) +
    "×</b></p>";

  var holesRounded = Math.round(holesTotal);
  var totalSeedUnits = holesRounded * sh;
  var basalPlanKg = land * BASAL_FERT_KG_PER_ACRE;
  var methodLabels = { hoe: "Hoe / hand", stick: "Planting stick", mech: "Mechanized / ripper" };
  var methodText = methodLabels[method] || method;

  var actHoles = Number(document.getElementById("plantActualHoles").value) || 0;
  var actSeedRaw = document.getElementById("plantActualSeedKg").value;
  var actSeedKg = actSeedRaw !== "" && !isNaN(Number(actSeedRaw)) ? Number(actSeedRaw) : 0;
  var actBasalKg = Number(document.getElementById("plantActualBasalKg").value) || 0;
  var plantEndDateVal = document.getElementById("plantPlantingEndDate").value;
  var plantNotesVal = (document.getElementById("plantPlantingNotes").value || "").trim();

  var planDetailRows =
    moRecRow("Land area", "<b>" + land + " ac</b>") +
    moRecRow("Planting method", escapeHtml(methodText)) +
    moRecRow("Hole spacing", spacingPickLabel) +
    moRecRow("Seeds per hole", "<b>" + sh + "</b>") +
    moRecRow("Total holes (plan)", "<b>" + holesRounded.toLocaleString() + "</b>") +
    moRecRow(
      "Total seeds (plan)",
      "<b>" +
        totalSeedUnits.toLocaleString() +
        "</b> <span class=\"mo-muted\">(holes × seeds/hole)</span>"
    ) +
    moRecRow("Seed weight (plan)", "<b>" + seedKg.toFixed(1) + " kg</b>") +
    moRecRow("Basal DAP/NPK (plan)", "<b>" + basalPlanKg.toFixed(0) + " kg</b>") +
    moRecRow(
      "Top dress (plan later)",
      "<b>" +
        (land * TOPDRESS_FERT_KG_PER_ACRE).toFixed(0) +
        " kg</b> <span class=\"mo-muted\">(21–30 DAP)</span>"
    ) +
    moRecRow("Planting depth", depth ? "<b>" + depth + " cm</b>" : "—") +
    moRecRow("Planting date", plantDateVal ? escapeHtml(formatDate(new Date(plantDateVal))) : "—") +
    moRecRow("Variety", escapeHtml(variety || "—"));

  var planDetailSectionHtml =
    '<p class="mo-p mo-muted" style="margin-top:0;">From the <b>Planting plan</b> card only. The <b>Planting remembrance</b> card is ignored for these numbers and for the schedule below.</p>' +
    '<table class="mo-rec-table">' +
    planDetailRows +
    "</table>";

  var hasRemembrance =
    actHoles > 0 ||
    actSeedKg > 0 ||
    actBasalKg > 0 ||
    !!plantEndDateVal ||
    !!plantNotesVal;

  var remembranceSectionHtml;
  if (!hasRemembrance) {
    remembranceSectionHtml =
      '<p class="mo-p mo-muted" style="margin-top:0;">No remembrance entries yet. Use the <b>Planting remembrance</b> card on this page to jot what you did in the field — it is saved with your farm but <b>does not</b> change holes, seed, spacing, or calendar math.</p>';
  } else {
    var remRows = "";
    if (actHoles > 0) {
      remRows += moRecRow("Holes planted (your count)", "<b>" + actHoles.toLocaleString() + "</b>");
      var diffH = actHoles - holesRounded;
      if (diffH !== 0) {
        remRows += moRecRow(
          "Compared to plan (holes)",
          "<b>" + (diffH > 0 ? "+" : "") + diffH.toLocaleString() + "</b> <span class=\"mo-muted\">(for your notes only)</span>"
        );
      }
    }
    if (actSeedKg > 0) {
      remRows += moRecRow("Seed opened (kg)", "<b>" + actSeedKg.toFixed(1) + " kg</b>");
      var dSeed = actSeedKg - seedKg;
      if (Math.abs(dSeed) >= 0.05) {
        remRows += moRecRow(
          "Compared to plan (seed kg)",
          "<b>" + (dSeed >= 0 ? "+" : "") + dSeed.toFixed(1) + " kg</b> <span class=\"mo-muted\">(for your notes only)</span>"
        );
      }
    }
    if (actBasalKg > 0) {
      remRows += moRecRow("Basal fertiliser (your figure)", "<b>" + actBasalKg.toFixed(0) + " kg</b>");
    }
    if (plantEndDateVal) {
      try {
        remRows += moRecRow("Planting finished", escapeHtml(formatDate(new Date(plantEndDateVal))));
      } catch (e2) {}
    }
    if (plantNotesVal) {
      remRows += moRecRow("Notes", escapeHtml(plantNotesVal));
    }
    remembranceSectionHtml =
      '<p class="mo-p mo-muted" style="margin-top:0;">From <b>Planting remembrance</b> — your diary only. These values are <b>not</b> used in recommendations, summaries, or the calendar.</p>' +
      '<table class="mo-rec-table">' +
      remRows +
      "</table>";
  }

  var blocks = [
    moSection("Planned targets (plan card only)", planDetailSectionHtml),
    moSection("Recommendations for your area & seeds/hole", recSectionHtml),
    moSection("Summary", summaryHtml),
    moSection("Season calendar", scheduleSectionBody),
    moSection("Smart rules", smartRulesHtml)
  ];
  if (alerts.length) blocks.push(moSection("Alerts & warnings", moListCards(alerts)));
  if (optimal.length) blocks.push(moSection("Tips", moListPlain(optimal)));
  blocks.push(moSection("Remembrance (memory only — not planning)", remembranceSectionHtml));

  box.className = "result-box" + (alerts.length ? " alert" : "");
  out.innerHTML = moWrap(blocks.join(""));
  updatePlantingNewFarmBanner();
  refreshHubFarmCalendar();

  latestPlannerCost = land * (
    SEED_KG_PER_ACRE_BASE * 4500 +
    BASAL_FERT_KG_PER_ACRE * 3500 +
    TOPDRESS_FERT_KG_PER_ACRE * 2800 +
    SPRAY_TANKS_PER_ACRE * 8000 +
    200000
  );
  syncPredFromPlanting();
  refreshSummary();
  saveFarmDataBundle();
  refreshHomeFarmDashboardIfHome();
  scheduleFarmAutosave();
}

function syncPredFromPlanting() {
  var l = document.getElementById("plantLand").value;
  if (l) document.getElementById("predLand").value = l;
  document.getElementById("predSpacing").value = document.getElementById("plantSpacing").value;
  var v = document.getElementById("plantVariety").value;
  if (v) document.getElementById("predVariety").value = v;
}

/* --- 2. Crop care --- */
function runCropCareModule() {
  var land = Number(document.getElementById("plantLand").value) || 1;
  var month = document.getElementById("plantMonth").value;
  var basalKg = land * BASAL_FERT_KG_PER_ACRE;
  var topKg = land * TOPDRESS_FERT_KG_PER_ACRE;
  var season = month ? monthRainSeason(month) : "unknown";
  var irrig = season === "dry_or_offseason"
    ? "Limit irrigation unless you have water: prioritize moisture conservation &amp; mulch."
    : season === "marginal"
    ? "Watch soil moisture weekly; light supplementary water at tasselling if possible."
    : "Rain-fed timing looks reasonable — scout weekly still.";

  var pests = "Priority targets <b>fall armyworm &amp; leaf feeders</b> from ~30 DAP; stem borer still scout earlier. Act if damage threshold exceeded.";
  if (season === "long_or_short_rains_good") pests += " High humidity — watch leaf blight after prolonged wet.";

  var chemLo = land * SPRAY_ML_TOTAL_ACRE_LO;
  var chemHi = land * SPRAY_ML_TOTAL_ACRE_HI;

  var fertHtml =
    moKpiGrid(
      moKpi("Basal DAP/NPK", "<b>" + basalKg.toFixed(0) + " kg</b><span style=\"font-size:10px;font-weight:600;color:#5a6f5c;display:block;margin-top:2px;\">" + BASAL_FERT_KG_PER_ACRE + " kg/ac</span>") +
        moKpi("Top dress urea/CAN", "<b>" + topKg.toFixed(0) + " kg</b><span style=\"font-size:10px;font-weight:600;color:#5a6f5c;display:block;margin-top:2px;\">" + TOPDRESS_FERT_KG_PER_ACRE + " kg/ac</span>")
    ) +
    '<p class="mo-p">~<b>100 kg product/ac</b> class program. Basal <b>in hole, not on seed</b>. Top dress <b>21–30 DAP</b>, 5–8 cm from plant, cover soil; avoid dry leaves.</p>';

  var opsHtml =
    '<div class="mo-stack">' +
    '<p class="mo-line"><strong>1st weeding:</strong> 14–21 DAP — early removal; light loosening OK.</p>' +
    '<p class="mo-line"><strong>2nd weeding:</strong> 28–35 DAP — hill soil around roots.</p>' +
    '<p class="mo-line"><strong>Tasselling:</strong> 60–75 DAP — steady moisture; spray only if needed.</p>' +
    "</div>";

  var sprayHtml =
    moKpiGrid(
      moKpi("Water / acre", "<b>~" + (land * SPRAY_WATER_L_PER_ACRE).toFixed(0) + " L</b>") +
        moKpi("Knapsack fills", "<b>~" + (land * SPRAY_TANKS_PER_ACRE).toFixed(0) + "</b><span style=\"font-size:10px;font-weight:600;color:#5a6f5c;display:block;margin-top:2px;\">" + SPRAY_TANK_L + " L each</span>")
    ) +
    '<p class="mo-p">Insecticide <b>' +
    SPRAY_ML_PER_TANK_LO +
    "–" +
    SPRAY_ML_PER_TANK_HI +
    " ml/tank</b> → total chemical about <b>" +
    chemLo.toFixed(0) +
    "–" +
    chemHi.toFixed(0) +
    " ml</b> for your <b>" +
    land +
    "</b> ac (scale linearly).</p>" +
    '<p class="mo-p"><strong>Spray timing:</strong> 1st <b>30–40 DAP</b>; 2nd <b>45–55 DAP</b> if pests persist. Examples: emamectin benzoate, lambda-cyhalothrin — follow label.</p>';

  var smartCare =
    '<p class="mo-callout">Miss 1st weeding by ~day 21 → yield penalty. No fertilizer → low yield. No spray → pest risk. Late planting → lower productivity.</p>';

  var out = document.getElementById("cropCareResult");
  out.innerHTML = moWrap(
    moSection("Fertilizer", fertHtml) +
      moSection("Weeding & crop stage", opsHtml) +
      moSection("Spraying program", sprayHtml) +
      moSection("Smart rules", smartCare) +
      moSection("Pest & disease", '<p class="mo-p">' + pests + "</p>") +
      moSection("Moisture & irrigation", '<p class="mo-p">' + irrig + "</p>") +
      '<p class="hint" style="margin:0;">Future: Weather API adjusts spray &amp; irrigation text by forecast.</p>'
  );
  saveFarmDataBundle();
  scheduleFarmAutosave();
}

/* --- 3. Timeline --- */
function getTimelineDapEvents() {
  return [
    { label: "Planting + basal DAP/NPK (50 kg/ac, not on seed)", d: 0 },
    { label: "Germination check & replant gaps (5–10 DAP)", d: DAP_GERM_CHECK },
    { label: "First weeding (14–21 DAP)", d: DAP_WEED1 },
    { label: "Top dress urea or CAN (21–30 DAP, 50 kg/ac)", d: DAP_TOPDRESS },
    { label: "Second weeding + hill soil (28–35 DAP)", d: DAP_WEED2 },
    { label: "1st spray — FAW / leaf eaters (30–40 DAP)", d: DAP_SPRAY1 },
    { label: "2nd spray if pests (45–55 DAP)", d: DAP_SPRAY2 },
    { label: "Tasselling & cob formation (60–75 DAP)", d: DAP_TASSEL },
    { label: "Harvest window opens (100–120 DAP)", d: DAP_HARVEST_START },
    { label: "Harvest end / full maturity (variety)", d: DAP_HARVEST_END }
  ];
}

function computeTimelineEventsForDate(plantDateVal) {
  if (!plantDateVal) return null;
  var pd = new Date(plantDateVal);
  if (isNaN(pd.getTime())) return null;
  var events = getTimelineDapEvents();
  return events.map(function (e) {
    return { label: e.label, date: formatDate(addDays(pd, e.d)), days: e.d };
  });
}

function getUpcomingTimelineItems(plantDateVal, maxN) {
  maxN = maxN || 3;
  var list = computeTimelineEventsForDate(plantDateVal);
  if (!list || !list.length) return [];
  var today = new Date();
  today.setHours(12, 0, 0, 0);
  var pd = new Date(plantDateVal);
  if (isNaN(pd.getTime())) return [];
  pd.setHours(12, 0, 0, 0);
  var dayDiff = Math.round((today.getTime() - pd.getTime()) / 864e5);
  var upcoming = [];
  for (var i = 0; i < list.length; i++) {
    if (dayDiff <= list[i].days) upcoming.push(list[i]);
  }
  upcoming.sort(function (a, b) {
    return a.days - b.days;
  });
  return upcoming.slice(0, maxN);
}

function refreshHubFarmCalendar() {
  var wrap = document.getElementById("hubFarmCalendar");
  if (!wrap) return;
  var plantInput = document.getElementById("plantingDateMain").value;
  var farm = escapeHtml(getActiveFarmName());
  var land = Number(document.getElementById("plantLand").value);
  var acresNote =
    land > 0
      ? '<p class="hub-cal-acres">' + land + " ac in plan · planting date below drives this calendar.</p>"
      : "";

  if (!plantInput) {
    wrap.innerHTML =
      '<p class="hub-cal-farm">' +
      farm +
      '</p><p class="hint">No planting date yet for this profile. Open <b>Planting</b>, set the date (and acres), save the farm if you want it kept.</p>' +
      '<button type="button" class="btn-outline btn-sm" data-farm-sub="farm-planting">Open Planting</button>';
    return;
  }

  var list = computeTimelineEventsForDate(plantInput);
  if (!list) {
    wrap.innerHTML = "<p class=\"hint\">Could not read planting date.</p>";
    return;
  }

  var today = new Date();
  today.setHours(12, 0, 0, 0);
  var pd = new Date(plantInput);
  pd.setHours(12, 0, 0, 0);
  var dayDiff = Math.round((today.getTime() - pd.getTime()) / 864e5);

  var rows = "";
  for (var i = 0; i < list.length; i++) {
    var ev = list[i];
    var cls = "hub-cal-row";
    if (dayDiff > ev.days) cls += " hub-cal-row--past";
    else if (dayDiff === ev.days) cls += " hub-cal-row--today";
    else cls += " hub-cal-row--up";
    rows +=
      '<div class="' +
      cls +
      '"><div class="hub-cal-top"><span class="hub-cal-dap">DAP ' +
      ev.days +
      '</span><span class="hub-cal-when">' +
      escapeHtml(ev.date) +
      '</span></div><div class="hub-cal-what">' +
      escapeHtml(ev.label) +
      "</div></div>";
  }

  wrap.innerHTML =
    '<p class="hub-cal-farm">' +
    farm +
    "</p>" +
    acresNote +
    '<p class="hub-cal-dapline">Today ≈ <b>DAP ' +
    dayDiff +
    "</b> (from " +
    escapeHtml(formatDate(pd)) +
    ")</p>" +
    '<div class="hub-cal-list">' +
    rows +
    '</div><p class="hint hub-cal-see">See also: <button type="button" class="hub-cal-link" data-farm-sub="farm-timeline">Timeline &amp; reminders</button> — save reminders list on this device.</p>';
}

function buildTimelineAndReminders() {
  var plantInput = document.getElementById("plantingDateMain").value;
  if (!plantInput) {
    alert("Set planting date in Planting module.");
    return;
  }
  var list = computeTimelineEventsForDate(plantInput);
  if (!list) {
    alert("Invalid planting date.");
    return;
  }
  latestTimelineEvents = list;
  if (!safeLocalStorageSetItem(LS_TIMELINE, JSON.stringify(latestTimelineEvents))) farmStorageNotifyFail();

  var vis = document.getElementById("timelineVisual");
  vis.innerHTML = "";
  for (var i = 0; i < latestTimelineEvents.length; i++) {
    var li = document.createElement("li");
    li.innerHTML = "<span>" + escapeHtml(latestTimelineEvents[i].label) + "</span><span>" + escapeHtml(latestTimelineEvents[i].date) + "</span>";
    vis.appendChild(li);
  }

  var reminders = latestTimelineEvents.map(function (x) {
    return x.label + ": " + x.date;
  });
  if (!safeLocalStorageSetItem(LS_REMINDERS, JSON.stringify(reminders))) farmStorageNotifyFail();
  var listEl = document.getElementById("reminderList");
  listEl.innerHTML = "";
  for (var j = 0; j < reminders.length; j++) {
    var item = document.createElement("li");
    item.textContent = reminders[j];
    listEl.appendChild(item);
  }

  refreshHubFarmCalendar();
  scheduleFarmAutosave();
  /* Future PWA: navigator.serviceWorker + push subscription + periodic sync for reminders */
}

/* --- 4. Finance --- */
function runRecordKeeping() {
  var capital = Number(document.getElementById("recordCapital").value);
  var seedCost = Number(document.getElementById("recordSeedCost").value) || 0;
  var fertilizerCost = Number(document.getElementById("recordFertilizerCost").value) || 0;
  var otherInputs = Number(document.getElementById("recordOtherCosts").value) || 0;
  var sprayingCost = Number(document.getElementById("recordSprayingCost").value) || 0;
  var labourDig = Number(document.getElementById("recordLabourDig").value) || 0;
  var labourPlant = Number(document.getElementById("recordLabourPlant").value) || 0;
  var labourWeed = Number(document.getElementById("recordLabourWeed").value) || 0;
  var labourHarvest = Number(document.getElementById("recordLabourHarvest").value) || 0;
  var labourOther = Number(document.getElementById("recordLabourOther").value) || 0;
  var labourCost = labourDig + labourPlant + labourWeed + labourHarvest + labourOther;
  var revenue = Number(document.getElementById("recordRevenue").value) || 0;
  var result = document.getElementById("recordResult");
  var box = document.getElementById("recordResultBox");

  if (!capital || capital <= 0) {
    result.innerHTML = moWrap(moSection("Input needed", '<p class="mo-p mo-muted">Enter valid capital (UGX).</p>'));
    refreshHomeFarmDashboardIfHome();
    scheduleFarmAutosave();
    return;
  }
  var totalCost = seedCost + fertilizerCost + otherInputs + labourCost + sprayingCost;
  var balance = capital - totalCost;
  latestTotalExpenses = totalCost;

  var hints = [];
  if (seedCost / totalCost > 0.45 && totalCost > 0) hints.push("Seed share is high — negotiate bulk or certified volume discount.");
  if (labourCost / totalCost > 0.5 && totalCost > 0) hints.push("Labour dominates — consider work groups or staggered tasks.");
  var ac = landRough();
  var fertKgPlan = ac * FERT_KG_PER_ACRE;
  if (fertilizerCost < ac * 150000) {
    hints.push("Fertilizer spend looks low vs a full program — plan ~" + (ac * BASAL_FERT_KG_PER_ACRE).toFixed(0) + " kg basal + ~" + (ac * TOPDRESS_FERT_KG_PER_ACRE).toFixed(0) + " kg urea/CAN (~" + fertKgPlan.toFixed(0) + " kg product total).");
  }
  if (sprayingCost < ac * 50000) {
    hints.push("Spray budget modest — ~" + (ac * SPRAY_TANKS_PER_ACRE).toFixed(0) + " knapsack tanks/ac (~" + SPRAY_WATER_L_PER_ACRE + " L water) + chemical per label.");
  }

  var finKpis =
    moKpi("Total spend", "<b>" + formatUGX(totalCost) + "</b>") +
    moKpi("Balance left", "<b>" + formatUGX(balance) + "</b>") +
    (revenue > 0
      ? moKpi("Revenue (logged)", "<b>" + formatUGX(revenue) + "</b>") +
        moKpi("Net after costs", "<b>" + formatUGX(revenue - totalCost) + "</b>")
      : "");

  function row4(label, amount) {
    var ps = financePct(amount, totalCost);
    var pc = financePct(amount, capital);
    var spendCell = ps != null ? "<b>" + ps + "%</b> of spend" : "—";
    var capCell = pc != null ? "<b>" + pc + "%</b> of capital" : "—";
    return (
      "<tr><th>" +
      escapeHtml(label) +
      "</th><td><b>" +
      formatUGX(amount) +
      "</b></td><td>" +
      spendCell +
      "</td><td>" +
      capCell +
      "</td></tr>"
    );
  }

  var mainTable =
    '<table class="mo-rec-table mo-fin-split">' +
    "<thead><tr><th>Category</th><th>Amount</th><th>Share</th><th>vs capital</th></tr></thead><tbody>" +
    row4("Seed", seedCost) +
    row4("Fertilizer", fertilizerCost) +
    row4("Spraying", sprayingCost) +
    row4("Other inputs", otherInputs) +
    row4("Labour (all tasks)", labourCost) +
    '<tr class="mo-fin-total"><th>Total</th><td><b>' +
    formatUGX(totalCost) +
    '</b></td><td><b>100%</b></td><td><b>' +
    (financePct(totalCost, capital) != null ? financePct(totalCost, capital) + "%" : "—") +
    "</b></td></tr></tbody></table>";

  var labourDetailBody = "";
  if (labourCost > 0) {
    var pairs = [
      { label: "Digging / land prep", v: labourDig },
      { label: "Planting", v: labourPlant },
      { label: "Weeding & hilling", v: labourWeed },
      { label: "Harvest labour", v: labourHarvest },
      { label: "Other labour", v: labourOther }
    ];
    var lr = "";
    for (var li = 0; li < pairs.length; li++) {
      if (pairs[li].v <= 0) continue;
      var pl = financePct(pairs[li].v, labourCost);
      lr +=
        moRecRow(
          pairs[li].label,
          "<b>" + formatUGX(pairs[li].v) + "</b>" + (pl != null ? " · " + pl + "% of labour" : "")
        );
    }
    if (!lr) lr = moRecRow("Detail", '<span class="mo-muted">Enter amounts above to split labour.</span>');
    labourDetailBody =
      '<p class="mo-p mo-muted" style="margin-top:0;">How labour splits between digging, planting, weeding, and harvest.</p>' +
      '<table class="mo-rec-table">' +
      lr +
      moRecRow("Labour total", "<b>" + formatUGX(labourCost) + "</b>") +
      "</table>";
  } else {
    labourDetailBody =
      '<p class="mo-p mo-muted" style="margin-top:0;">No labour entered yet — add digging, planting, weeding, or harvest pay above.</p>';
  }

  var finBlocks = [
    moSection("Totals", moKpiGrid(finKpis)),
    moSection("Where the money goes", '<p class="mo-p mo-muted" style="margin-top:0;">Each line as a share of <b>total spend</b> and of your <b>capital</b>.</p>' + mainTable),
    moSection("Labour breakdown", labourDetailBody)
  ];
  if (hints.length) finBlocks.push(moSection("Savings & checks", moListPlain(hints)));

  box.className = "result-box" + (balance < 0 ? " alert" : "");
  result.innerHTML = moWrap(finBlocks.join(""));
  refreshFinanceLabourLive();
  refreshSummary();
  saveFarmDataBundle();
  refreshHomeFarmDashboardIfHome();
  scheduleFarmAutosave();
}

function landRough() {
  var l = Number(document.getElementById("plantLand").value);
  if (l && l > 0) return l;
  l = Number(document.getElementById("predLand").value);
  return l && l > 0 ? l : 1;
}

function collectSeasonRecord() {
  return {
    capital: Number(document.getElementById("recordCapital").value) || 0,
    seedCost: Number(document.getElementById("recordSeedCost").value) || 0,
    fertilizerCost: Number(document.getElementById("recordFertilizerCost").value) || 0,
    otherInputsCost: Number(document.getElementById("recordOtherCosts").value) || 0,
    labourCost: labourCostSumFromForm(),
    labourDig: Number(document.getElementById("recordLabourDig").value) || 0,
    labourPlant: Number(document.getElementById("recordLabourPlant").value) || 0,
    labourWeed: Number(document.getElementById("recordLabourWeed").value) || 0,
    labourHarvest: Number(document.getElementById("recordLabourHarvest").value) || 0,
    labourOther: Number(document.getElementById("recordLabourOther").value) || 0,
    sprayingCost: Number(document.getElementById("recordSprayingCost").value) || 0,
    revenue: Number(document.getElementById("recordRevenue").value) || 0,
    savedAt: new Date().toISOString()
  };
}

function saveSeasonRecord() {
  var record = collectSeasonRecord();
  if (
    !record.capital &&
    !record.seedCost &&
    !record.fertilizerCost &&
    !record.labourCost &&
    !record.sprayingCost &&
    !record.otherInputsCost
  ) {
    alert("Enter some finance data first.");
    return;
  }
  if (!safeLocalStorageSetItem(LS_SEASON, JSON.stringify(record))) {
    farmStorageNotifyFail();
    return;
  }
  runRecordKeeping();
  document.getElementById("recordResult").innerHTML +=
    '<p class="hint" style="margin-top:10px;text-align:center;"><b>Saved locally.</b></p>';
  scheduleFarmAutosave();
}

function loadSeasonRecord() {
  var raw = localStorage.getItem(LS_SEASON);
  if (!raw) return;
  try {
    var record = JSON.parse(raw);
    suppressFarmAutosave = true;
    try {
      document.getElementById("recordCapital").value = record.capital || "";
      document.getElementById("recordSeedCost").value = record.seedCost || "";
      document.getElementById("recordFertilizerCost").value = record.fertilizerCost || "";
      document.getElementById("recordOtherCosts").value = record.otherInputsCost || "";
      document.getElementById("recordSprayingCost").value = record.sprayingCost || "";
      document.getElementById("recordRevenue").value = record.revenue || "";
      var hasLines =
        (record.labourDig || 0) +
          (record.labourPlant || 0) +
          (record.labourWeed || 0) +
          (record.labourHarvest || 0) +
          (record.labourOther || 0) >
        0;
      if (hasLines) {
        document.getElementById("recordLabourDig").value = record.labourDig || "";
        document.getElementById("recordLabourPlant").value = record.labourPlant || "";
        document.getElementById("recordLabourWeed").value = record.labourWeed || "";
        document.getElementById("recordLabourHarvest").value = record.labourHarvest || "";
        document.getElementById("recordLabourOther").value = record.labourOther || "";
      } else {
        document.getElementById("recordLabourDig").value = "";
        document.getElementById("recordLabourPlant").value = "";
        document.getElementById("recordLabourWeed").value = "";
        document.getElementById("recordLabourHarvest").value = "";
        document.getElementById("recordLabourOther").value = record.labourCost || "";
      }
      refreshFinanceLabourLive();
      runRecordKeeping();
    } finally {
      suppressFarmAutosave = false;
    }
  } catch (e) {}
}

/* --- 5. Yield prediction --- */
function runYieldPrediction() {
  var land = Number(document.getElementById("predLand").value);
  var spacing = document.getElementById("predSpacing").value;
  var variety = document.getElementById("predVariety").value;
  var price = Number(document.getElementById("predPrice").value);
  var out = document.getElementById("yieldPredResult");

  if (!land || !price || land <= 0 || price <= 0) {
    out.innerHTML = moWrap(moSection("Input needed", '<p class="mo-p mo-muted">Enter land (acres) and price per 100 kg bag.</p>'));
    refreshHomeFarmDashboardIfHome();
    scheduleFarmAutosave();
    return;
  }
  var baseBags = land * BASE_BAGS_PER_ACRE;
  var popFactor = spacing === "1x3" ? 1.03 : 0.97;
  var expectedBags = baseBags * varietyFactor(variety) * popFactor;
  var revenue = expectedBags * price;
  var expenses = latestTotalExpenses > 0 ? latestTotalExpenses : land * 350000;
  var profit = revenue - expenses;
  latestProfitValue = profit;

  var advice = farmAdvice(expectedBags, profit);
  var yieldGrid =
    moKpiGrid(
      moKpi("Expected yield", "<b>" + expectedBags.toFixed(1) + "</b> bags") +
        moKpi("Bag size", "<b>" + BAG_KG + " kg</b>")
    ) +
    moKpiGrid(
      moKpi("Revenue @ " + formatUGX(price) + "/bag", "<b>" + formatUGX(revenue) + "</b>") +
        moKpi("After expenses", "<b>" + formatUGX(profit) + "</b>")
    );
  out.innerHTML = moWrap(
    moSection("Forecast", yieldGrid) +
      moSection("Note", '<p class="mo-p">' + advice + "</p>") +
      '<p class="hint" style="margin:0;">Future: live market price API per district.</p>'
  );
  refreshSummary();
  saveFarmDataBundle();
  refreshHomeFarmDashboardIfHome();
  scheduleFarmAutosave();
}

function farmAdvice(yieldBags, profit) {
  if (profit < 0) return "⚠️ Risk of loss — cut costs, improve yield drivers, or wait for better prices.";
  if (yieldBags < landRough() * 12) {
    return "📉 Yield scenario is conservative — check Uganda schedule: weeding 14–21 DAP, basal + top dress, sprays 30–40 &amp; 45–55 DAP, and variety.";
  }
  if (profit > 1500000) return "🔥 Strong margin scenario — lock in good storage to capture better prices later.";
  return "✅ Reasonable scenario — fine-tune spray timing and weed control to push yield.";
}

/* --- 6. Harvest --- */
function runHarvestModule() {
  var method = document.getElementById("harvestMethod").value;
  var gross = Number(document.getElementById("harvestGrossBags").value);
  var moisture = Number(document.getElementById("harvestMoisture").value);
  var out = document.getElementById("harvestResult");

  var harvestAdvice = "";
  if (method === "manual") harvestAdvice = "Manual picking: low shelling loss if cobs are mature (black layer); slow for large area.";
  if (method === "hoe") harvestAdvice = "Hoe/stripping: watch stalk damage; dry cobs same day if possible.";
  if (method === "tractor") harvestAdvice = "Mechanical: fast for scale; calibrate to reduce grain cracking.";

  var timing = "Uganda schedule: <b>100–120 DAP</b> depending on variety — dry husks, hard grain, black layer on kernel (check seed bag).";

  var drying = "<b>Sun-dry 2–3 weeks</b> on <b>tarpaulin</b> (not bare soil); turn grain regularly; target <b>~13%</b> moisture before bagging.";
  if (moisture && moisture > 14) drying += " ⚠️ Above ~13–14% — mould &amp; weevil risk in storage.";
  if (moisture && moisture < 12) drying += " Very dry — good for storage but watch cracking if handling roughly.";

  var storage = "Dry bags, <b>raised platform</b>, rat guards; optional pesticide dust only per label/extension; hermetic bags if available.";

  var lossPct = 0.08;
  if (moisture && moisture > 16) lossPct = 0.15;
  if (method === "tractor") lossPct += 0.02;
  var netBags = gross > 0 ? gross * (1 - lossPct) : 0;

  var netSection =
    gross > 0
      ? moSection(
          "Net yield (estimate)",
          '<p class="mo-p">After ~<b>' +
            (lossPct * 100).toFixed(0) +
            "%</b> post-harvest loss: <b>" +
            netBags.toFixed(1) +
            "</b> bags.</p>"
        )
      : moSection("Net yield", '<p class="mo-p mo-muted">Enter gross bags above to estimate net bags after losses.</p>');

  out.innerHTML = moWrap(
    moSection("Harvest method", '<p class="mo-p">' + harvestAdvice + "</p>") +
      moSection("Timing", "<p class=\"mo-p\">" + timing + "</p>") +
      moSection("Drying", "<p class=\"mo-p\">" + drying + "</p>") +
      moSection("Storage", "<p class=\"mo-p\">" + storage + "</p>") +
      netSection
  );
  saveFarmDataBundle();
  scheduleFarmAutosave();
}

/* --- 7. Advice engine --- */
function runAdviceEngine() {
  var land = Number(document.getElementById("plantLand").value) || landRough();
  var spacing = document.getElementById("plantSpacing").value;
  var month = document.getElementById("plantMonth").value;
  var variety = document.getElementById("plantVariety").value;
  var text = [];
  text.push("• Spacing " + spacing + ": 1×3 ≈14,500 plants/ac; 2×3 ≈7,200/ac — " + (spacing === "1x3" ? "needs strong fertility &amp; weed control." : "often 2 seeds/hole (local) then thin."));
  if (varietyIsHybridLike(variety)) text.push("• Hybrid: 1 seed/hole typical; depth 3–5 cm.");
  if (varietyIsLocal(variety)) text.push("• Local/OPV: often 2 seeds/hole; depth 3–5 cm.");
  text.push("• Seed order: ~" + (land * SEED_KG_PER_ACRE_BASE).toFixed(1) + " kg base + 10% buffer.");
  text.push("• Fertilizer: ~" + (land * BASAL_FERT_KG_PER_ACRE).toFixed(0) + " kg basal DAP/NPK + ~" + (land * TOPDRESS_FERT_KG_PER_ACRE).toFixed(0) + " kg urea/CAN per season (Uganda table).");
  text.push("• Spray program: ~" + SPRAY_WATER_L_PER_ACRE + " L water/ac, ~" + SPRAY_TANKS_PER_ACRE + "× " + SPRAY_TANK_L + " L tanks, " + SPRAY_ML_PER_TANK_LO + "–" + SPRAY_ML_PER_TANK_HI + " ml product/tank.");
  text.push("• Smart rules: weeding by ~21 DAP; both fertilizer passes; sprays 30–40 &amp; 45–55 DAP if needed; avoid late planting.");
  if (month) text.push("• Calendar: " + month + " — " + (monthRainSeason(month) === "long_or_short_rains_good" ? "favourable rain window." : "review rainfall risk."));
  text.push("• Finance: keep spend under capital; labour, inputs, and spray windows are your main levers.");
  if (latestProfitValue !== 0) text.push("• Last profit scenario: " + formatUGX(latestProfitValue));

  latestAdviceText = text.join("\n");
  if (!safeLocalStorageSetItem(LS_ADVICE, latestAdviceText)) farmStorageNotifyFail();
  var advBody = '<div class="mo-stack">';
  for (var a = 0; a < text.length; a++) {
    advBody += '<p class="mo-line">' + text[a].replace(/^•\s*/, "") + "</p>";
  }
  advBody += "</div>";
  document.getElementById("adviceResult").innerHTML = moWrap(moSection("Decision checklist", advBody));
  scheduleFarmAutosave();
}

/* --- Dashboard --- */
function updateDashboard(data) {
  var isProfit = Number(data.rawProfit) >= 0;
  var statusText = isProfit ? "Profit ✅" : "Loss ⚠️";
  var statusClass = isProfit ? "status-profit" : "status-loss";
  document.getElementById("summary").innerHTML =
    "Cost focus: " + data.cost + " UGX | Profit view: " + data.profit + " UGX<br>" +
    "<span class=\"status-badge " + statusClass + "\">" + statusText + "</span>";
}

function refreshSummary() {
  var costForSummary = latestTotalExpenses > 0 ? latestTotalExpenses : latestPlannerCost;
  updateDashboard({
    cost: Number(costForSummary || 0).toLocaleString(),
    profit: Number(latestProfitValue || 0).toLocaleString(),
    rawProfit: Number(latestProfitValue || 0)
  });
}

/* --- Reporting --- */
function getCleanText(id) {
  var el = document.getElementById(id);
  if (!el) return "—";
  var t = el.innerText.trim();
  return t || "—";
}

function downloadFarmReport() {
  var reportDate = new Date().toLocaleString();
  var blocks = [
    { title: "Planting", id: "plantingResult" },
    { title: "Crop care", id: "cropCareResult" },
    { title: "Timeline (saved)", text: localStorage.getItem(LS_TIMELINE) || "—" },
    { title: "Finance", id: "recordResult" },
    { title: "Yield prediction", id: "yieldPredResult" },
    { title: "Harvest", id: "harvestResult" },
    { title: "Advice", id: "adviceResult" }
  ];
  var bodyInner = "<h1>AgriSmart Uganda — Farm report</h1><div class=\"meta\">" + escapeHtml(reportDate) + "</div>";
  for (var i = 0; i < blocks.length; i++) {
    var content = blocks[i].text != null ? escapeHtml(blocks[i].text) : escapeHtml(getCleanText(blocks[i].id));
    bodyInner += "<div class=\"section\"><h3>" + escapeHtml(blocks[i].title) + "</h3><div class=\"content\">" + content + "</div></div>";
  }
  var reportHtml =
    "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Farm Report</title>" +
    "<style>body{font-family:Segoe UI,Arial,sans-serif;margin:16px;color:#1a2e1c;}" +
    "h1{color:#2e7d32;font-size:20px;}.meta{color:#666;margin-bottom:16px;font-size:13px;}" +
    ".section{border:1px solid #c5e1c8;border-radius:10px;padding:12px;margin:10px 0;}" +
    ".section h3{margin:0 0 8px;color:#1b5e20;font-size:15px;}" +
    ".content{font-size:13px;line-height:1.5;white-space:pre-wrap;}" +
    "</style></head><body>" + bodyInner +
    "<p style=\"font-size:12px;color:#888;margin-top:20px;\">PDF export: premium feature placeholder.</p>" +
    "</body></html>";

  var w = window.open("", "_blank");
  if (!w) {
    alert("Allow pop-ups to print report.");
    return;
  }
  w.document.open();
  w.document.write(reportHtml);
  w.document.close();
  w.focus();
  w.print();
}

function saveFarmDataBundle() {
  try {
    return safeLocalStorageSetItem(
      "farmData",
      JSON.stringify({
        snapshot: collectFormSnapshot(),
        advice: latestAdviceText,
        updatedAt: new Date().toISOString()
      })
    );
  } catch (e) {
    return false;
  }
}

function contact() {
  try {
    window.open("https://wa.me/256703268522", "_blank", "noopener,noreferrer");
  } catch (e) {
    window.location.href = "https://wa.me/256703268522";
  }
}

function contactCallDeveloper() {
  window.location.href = "tel:+256703268522";
}

function backupLsGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function buildAppDataBackupObject() {
  var cap = {};
  try {
    var idx;
    for (idx = localStorage.length - 1; idx >= 0; idx--) {
      var k = localStorage.key(idx);
      if (k && k.indexOf(LS_CAPITAL_LOG_PREFIX) === 0) {
        cap[k.slice(LS_CAPITAL_LOG_PREFIX.length)] = localStorage.getItem(k);
      }
    }
  } catch (e) {}
  return {
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "AgriSmart Uganda",
    activeFarmId: getActiveFarmId(),
    farms: loadFarms(),
    season: backupLsGet(LS_SEASON),
    timeline: backupLsGet(LS_TIMELINE),
    reminders: backupLsGet(LS_REMINDERS),
    advice: backupLsGet(LS_ADVICE),
    homeGuidesTip: backupLsGet(LS_HOME_GUIDES_TIP),
    homeHowToTip: backupLsGet(LS_HOME_HOWTO_TIP),
    farmDataBundle: backupLsGet("farmData"),
    capitalLogsByFarmId: cap,
    backupEmailRegistered: backupLsGet(LS_BACKUP_EMAIL) || ""
  };
}

function downloadAppDataBackup() {
  try {
    var obj = buildAppDataBackupObject();
    var json = JSON.stringify(obj, null, 2);
    var blob = new Blob([json], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "agri-smart-uganda-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    try {
      safeLocalStorageSetItem(LS_LAST_BACKUP_AT, String(Date.now()));
    } catch (e2) {}
    refreshGlobalBackupBanners();
    tryCloudBackupUpload();
  } catch (e) {
    farmStorageNotifyFail();
  }
}

function removeAllCapitalLogKeysFromStorage() {
  try {
    var idx;
    for (idx = localStorage.length - 1; idx >= 0; idx--) {
      var k = localStorage.key(idx);
      if (k && k.indexOf(LS_CAPITAL_LOG_PREFIX) === 0) localStorage.removeItem(k);
    }
  } catch (e) {}
}

function applyBackupObjectToStorage(data) {
  if (!data || data.backupVersion !== 1 || !Array.isArray(data.farms)) {
    throw new Error("bad backup");
  }
  if (!safeLocalStorageSetItem(LS_FARMS, JSON.stringify(data.farms))) {
    throw new Error("save farms");
  }
  var act = data.activeFarmId || (data.farms[0] && data.farms[0].id) || "default";
  safeLocalStorageSetItem(LS_ACTIVE, act);
  function setOrRemove(key, val) {
    try {
      if (val == null || val === "") localStorage.removeItem(key);
      else localStorage.setItem(key, val);
    } catch (e) {}
  }
  setOrRemove(LS_SEASON, data.season);
  setOrRemove(LS_TIMELINE, data.timeline);
  setOrRemove(LS_REMINDERS, data.reminders);
  setOrRemove(LS_ADVICE, data.advice);
  setOrRemove(LS_HOME_GUIDES_TIP, data.homeGuidesTip);
  setOrRemove(LS_HOME_HOWTO_TIP, data.homeHowToTip);
  setOrRemove("farmData", data.farmDataBundle);
  removeAllCapitalLogKeysFromStorage();
  var cap = data.capitalLogsByFarmId || {};
  var fids = Object.keys(cap);
  for (var i = 0; i < fids.length; i++) {
    var raw = cap[fids[i]];
    if (raw == null || raw === "") continue;
    try {
      localStorage.setItem(
        LS_CAPITAL_LOG_PREFIX + fids[i],
        typeof raw === "string" ? raw : JSON.stringify(raw)
      );
    } catch (e2) {}
  }
}

function restoreAppDataWithPinFlow(parsed) {
  function proceed() {
    if (
      !window.confirm(
        "Replace all current app data on this device with this backup? Your PIN (if any) stays the same."
      )
    ) {
      return;
    }
    try {
      applyBackupObjectToStorage(parsed);
      try {
        safeLocalStorageSetItem(LS_LAST_BACKUP_AT, String(Date.now()));
      } catch (e3) {}
      alert("Backup restored. The page will reload.");
      window.location.reload();
    } catch (e) {
      alert("Could not save restored data. Storage may be full or the file is damaged.");
    }
  }
  if (!isPinConfigured()) {
    if (window.confirm("Restore backup? This replaces all farms and records on this device.")) proceed();
    return;
  }
  var raw = window.prompt("Enter your 4-digit PIN to restore this backup:");
  if (raw == null) return;
  var pin = String(raw).replace(/\D/g, "");
  if (pin.length !== 4) {
    alert("PIN must be exactly 4 digits.");
    return;
  }
  var salt = localStorage.getItem(LS_PIN_SALT) || "";
  var stored = localStorage.getItem(LS_PIN_HASH) || "";
  hashPinWithSaltAsync(pin, salt).then(function (h) {
    if (h !== stored) {
      alert("Wrong PIN. Restore cancelled.");
      return;
    }
    proceed();
  });
}

function restoreAppDataFromBackupFile(inputEl) {
  var f = inputEl.files && inputEl.files[0];
  if (!f) return;
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var parsed = JSON.parse(reader.result);
      if (parsed.backupVersion !== 1 || !Array.isArray(parsed.farms)) {
        alert("This file is not a valid AgriSmart Uganda backup.");
        return;
      }
      restoreAppDataWithPinFlow(parsed);
    } catch (e) {
      alert("Could not read this file as a backup.");
    }
  };
  reader.onerror = function () {
    alert("Could not read the file.");
  };
  reader.readAsText(f, "UTF-8");
}

function initRestoreBackupFileInput() {
  var el = document.getElementById("restoreBackupFile");
  if (!el || el.dataset.backupBound) return;
  el.dataset.backupBound = "1";
  el.addEventListener("change", function () {
    if (el.files && el.files[0]) restoreAppDataFromBackupFile(el);
    el.value = "";
  });
}

/** Open app from email link: ?recoverToken=... or ?token=... (server must return { backup }). */
function tryApplyCloudRecoveryFromUrl() {
  try {
    var baseUrl = getCloudBackupBaseUrl();
    if (!baseUrl) return;
    var q = new URLSearchParams(window.location.search);
    var token = q.get("recoverToken") || q.get("token");
    if (!token) return;
    var base = baseUrl;
    fetch(base + "/recover-complete?token=" + encodeURIComponent(token), {
      method: "GET",
      mode: "cors",
      credentials: "omit"
    })
      .then(function (r) {
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.backup || data.backup.backupVersion !== 1) throw new Error("bad");
        try {
          var path = window.location.pathname || "/";
          var hash = window.location.hash || "";
          history.replaceState(null, "", path + hash);
        } catch (e2) {}
        restoreAppDataWithPinFlow(data.backup);
      })
      .catch(function () {
        alert("Recovery link is invalid, expired, or the server is unreachable.");
      });
  } catch (e) {}
}

function isValidEmailLoose(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

function getBackupEmailStored() {
  try {
    return (localStorage.getItem(LS_BACKUP_EMAIL) || "").trim();
  } catch (e) {
    return "";
  }
}

function syncProfileBackupEmailField() {
  var inp = document.getElementById("backupEmailInput");
  if (!inp) return;
  try {
    inp.value = getBackupEmailStored();
  } catch (e) {}
  var h = document.getElementById("backupEmailSavedHint");
  if (h) h.hidden = !(inp.value || "").trim();
}

function saveBackupEmailFromProfile() {
  var inp = document.getElementById("backupEmailInput");
  var v = inp ? (inp.value || "").trim() : "";
  if (v && !isValidEmailLoose(v)) {
    alert("Please enter a valid email address.");
    return;
  }
  try {
    if (v) localStorage.setItem(LS_BACKUP_EMAIL, v);
    else localStorage.removeItem(LS_BACKUP_EMAIL);
  } catch (e) {
    farmStorageNotifyFail();
    return;
  }
  var h = document.getElementById("backupEmailSavedHint");
  if (h) h.hidden = !v;
  refreshGlobalBackupBanners();
  tryCloudBackupUpload();
  if (v) alert("Backup email saved. Reminders about adding an email will stop.");
}

function todayYmd() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function dismissDailyBackupReminder() {
  try {
    localStorage.setItem(LS_BACKUP_REMINDER_DISMISS_DATE, todayYmd());
  } catch (e) {}
}

function shouldShowDailyBackupEmailReminder() {
  if (getBackupEmailStored()) return false;
  try {
    if (localStorage.getItem(LS_BACKUP_REMINDER_DISMISS_DATE) === todayYmd()) return false;
  } catch (e) {}
  var h = new Date().getHours();
  if (h < 10) return false;
  return true;
}

function getLastBackupAtMs() {
  try {
    var t = localStorage.getItem(LS_LAST_BACKUP_AT);
    return t ? Number(t) : 0;
  } catch (e) {
    return 0;
  }
}

function dismissStaleBackupBanner() {
  try {
    localStorage.setItem(LS_STALE_BACKUP_BANNER_DISMISS_UNTIL, String(Date.now() + 24 * 60 * 60 * 1000));
  } catch (e) {}
}

function shouldShowStaleBackupBanner() {
  try {
    var until = Number(localStorage.getItem(LS_STALE_BACKUP_BANNER_DISMISS_UNTIL) || 0);
    if (until > Date.now()) return false;
  } catch (e) {}
  var last = getLastBackupAtMs();
  var weekMs = 7 * 24 * 60 * 60 * 1000;
  if (!last) return true;
  return Date.now() - last > weekMs;
}

function checkForAppUpdate() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistration().then(function (reg) {
    if (reg && reg.update) reg.update();
  });
}

function tryCloudBackupUpload() {
  var baseUrl = getCloudBackupBaseUrl();
  if (!baseUrl || typeof fetch !== "function") return;
  if (!navigator.onLine) return;
  var email = getBackupEmailStored();
  if (!email) return;
  var base = baseUrl;
  var url = base + "/backup";
  var body = JSON.stringify({
    email: email,
    backup: buildAppDataBackupObject(),
    client: "AgriSmart-Uganda",
    ts: Date.now()
  });
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body,
    mode: "cors",
    credentials: "omit"
  })
    .then(function (r) {
      if (r.ok) safeLocalStorageSetItem(LS_LAST_BACKUP_AT, String(Date.now()));
    })
    .catch(function () {});
}

function requestCloudBackupRecovery() {
  var email = window.prompt("Enter the email you registered for backups:");
  if (email == null) return;
  email = email.trim();
  if (!email || !isValidEmailLoose(email)) {
    alert("Please enter a valid email.");
    return;
  }
  if (!getCloudBackupBaseUrl()) {
    alert(
      "Online recovery by email is not connected — set your API URL in agri-config.js (cloudBackupBaseUrl) or app.js (AGRI_CLOUD_BACKUP_BASE_URL). Until then: use Profile → Restore backup… with a .json file, or email yourself the backup file."
    );
    return;
  }
  var base = getCloudBackupBaseUrl();
  fetch(base + "/recover-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
    mode: "cors",
    credentials: "omit"
  })
    .then(function (r) {
      alert(
        r.ok
          ? "If your email is registered, check your inbox for recovery instructions."
          : "Recovery request failed. Try again later or use a file backup."
      );
    })
    .catch(function () {
      alert("Network error. Check your connection.");
    });
}

function refreshGlobalBackupBanners() {
  var host = document.getElementById("globalBackupBanners");
  if (!host) return;
  var parts = [];
  if (shouldShowDailyBackupEmailReminder()) {
    parts.push({
      type: "info",
      id: "daily-email",
      html:
        "<strong>Daily backup reminder (after 10:00).</strong> Add a <strong>backup email</strong> in Profile, or tap <strong>Download backup</strong>. When a server is connected, the same email can be used for recovery."
    });
  }
  if (shouldShowStaleBackupBanner()) {
    parts.push({
      type: "warn",
      id: "stale-backup",
      html:
        "<strong>It’s been 7+ days since a backup.</strong> Open Profile → <strong>Download backup</strong> or stay online for automatic upload when the developer enables the cloud URL."
    });
  }
  if (!parts.length) {
    host.innerHTML = "";
    host.hidden = true;
    return;
  }
  host.hidden = false;
  var i;
  var out = "";
  for (i = 0; i < parts.length; i++) {
    var p = parts[i];
    var cls = p.type === "warn" ? "global-backup-banner--warn" : "global-backup-banner--info";
    out +=
      '<div class="global-backup-banner ' +
      cls +
      '" data-banner-id="' +
      escapeHtml(p.id) +
      '"><div class="global-backup-banner__text">' +
      p.html +
      ' <button type="button" class="hub-cal-link" data-nav="profile" style="margin-left:2px;">Open Profile</button></div><button type="button" class="global-backup-banner__x" data-banner-dismiss="' +
      escapeHtml(p.id) +
      '" aria-label="Dismiss">&times;</button></div>';
  }
  host.innerHTML = out;
  var navBtns = host.querySelectorAll("[data-nav]");
  for (i = 0; i < navBtns.length; i++) {
    navBtns[i].addEventListener("click", function (ev) {
      var pid = ev.currentTarget.getAttribute("data-nav");
      if (pid) showPage(pid);
    });
  }
  var dismissBtns = host.querySelectorAll("[data-banner-dismiss]");
  for (i = 0; i < dismissBtns.length; i++) {
    dismissBtns[i].addEventListener("click", function (ev) {
      var id = ev.currentTarget.getAttribute("data-banner-dismiss");
      if (id === "daily-email") dismissDailyBackupReminder();
      else if (id === "stale-backup") dismissStaleBackupBanner();
      refreshGlobalBackupBanners();
    });
  }
}

var globalBackupBannerIntervalId = null;

function initGlobalBackupBanners() {
  if (document.documentElement.dataset.globalBackupBannersInit) return;
  document.documentElement.dataset.globalBackupBannersInit = "1";
  window.addEventListener("online", function () {
    tryCloudBackupUpload();
    checkForAppUpdate();
    refreshGlobalBackupBanners();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      tryCloudBackupUpload();
      checkForAppUpdate();
      refreshGlobalBackupBanners();
    }
  });
  refreshGlobalBackupBanners();
  if (globalBackupBannerIntervalId) clearInterval(globalBackupBannerIntervalId);
  globalBackupBannerIntervalId = setInterval(refreshGlobalBackupBanners, 60000);
}

/* --- App PIN (device privacy; hashed in localStorage) --- */
function randomSaltHex() {
  var a = new Uint8Array(16);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
  else for (var r = 0; r < 16; r++) a[r] = Math.floor(Math.random() * 256);
  return Array.from(a).map(function (x) {
    return x.toString(16).padStart(2, "0");
  }).join("");
}

function hashPinFallback(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return "fb_" + (h >>> 0).toString(16) + "_" + s.length;
}

function hashPinWithSaltAsync(pin, salt) {
  var s = salt + "|" + pin;
  if (window.crypto && crypto.subtle) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (buf) {
      return Array.from(new Uint8Array(buf))
        .map(function (b) {
          return b.toString(16).padStart(2, "0");
        })
        .join("");
    });
  }
  return Promise.resolve(hashPinFallback(s));
}

function isPinConfigured() {
  try {
    return !!(localStorage.getItem(LS_PIN_HASH) && localStorage.getItem(LS_PIN_SALT));
  } catch (e) {
    return false;
  }
}

function pinEnsureTabId() {
  try {
    var t = sessionStorage.getItem(SS_PIN_TAB_ID);
    if (!t) {
      t = "t_" + Math.random().toString(36).slice(2, 12) + "_" + Date.now().toString(36);
      sessionStorage.setItem(SS_PIN_TAB_ID, t);
    }
    return t;
  } catch (e) {
    return "";
  }
}

function pinMarkUnlocked() {
  try {
    safeLocalStorageSetItem(LS_PIN_TAB_UNLOCK, "1");
    var tab = pinEnsureTabId();
    if (tab) sessionStorage.setItem(SS_PIN_UNLOCK_SEAL, tab);
  } catch (e) {}
}

function pinClearUnlock() {
  try {
    localStorage.removeItem(LS_PIN_TAB_UNLOCK);
    sessionStorage.removeItem(SS_PIN_UNLOCK_SEAL);
  } catch (e) {}
}

function migrateLegacyPinSessionUnlock() {
  try {
    if (sessionStorage.getItem(SS_PIN_SESSION_LEGACY) === "1") {
      pinMarkUnlocked();
      sessionStorage.removeItem(SS_PIN_SESSION_LEGACY);
    }
  } catch (e) {}
}

function isPinSessionUnlocked() {
  try {
    if (localStorage.getItem(LS_PIN_TAB_UNLOCK) !== "1") return false;
    var tab = sessionStorage.getItem(SS_PIN_TAB_ID);
    var seal = sessionStorage.getItem(SS_PIN_UNLOCK_SEAL);
    return !!tab && !!seal && seal === tab;
  } catch (e) {
    return false;
  }
}

function hidePinGate() {
  var g = document.getElementById("pinGate");
  var app = document.getElementById("appRoot");
  if (g) g.hidden = true;
  if (app) app.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("pin-session-unlocked");
}

function showPinGateLocked() {
  var g = document.getElementById("pinGate");
  var app = document.getElementById("appRoot");
  if (g) g.hidden = false;
  if (app) app.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("pin-session-unlocked");
}

function pinGateHideOptionalPanels() {
  var reg = document.getElementById("pinGateRegisterPhone");
  var rec = document.getElementById("pinGateRecovery");
  if (reg) reg.hidden = true;
  if (rec) rec.hidden = true;
}

function normalizePhoneDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

function isValidPhoneDigits(d) {
  return d.length >= 9 && d.length <= 15;
}

function persistRegisteredPhone(digits) {
  var salt = randomSaltHex();
  return hashPinWithSaltAsync(digits, salt).then(function (hash) {
    if (!safeLocalStorageSetItem(LS_PHONE_RESET_SALT, salt) || !safeLocalStorageSetItem(LS_PHONE_RESET_HASH, hash)) {
      return Promise.reject(new Error("storage"));
    }
  });
}

function isPhoneResetConfigured() {
  try {
    return !!(localStorage.getItem(LS_PHONE_RESET_HASH) && localStorage.getItem(LS_PHONE_RESET_SALT));
  } catch (e) {
    return false;
  }
}

function showRegisterPhonePanel() {
  var g = document.getElementById("pinGate");
  var setup = document.getElementById("pinGateSetup");
  var u = document.getElementById("pinGateUnlock");
  var reg = document.getElementById("pinGateRegisterPhone");
  if (g) g.setAttribute("aria-labelledby", "pinRegisterPhoneTitle");
  pinGateHideOptionalPanels();
  if (setup) setup.hidden = true;
  if (u) u.hidden = true;
  if (reg) reg.hidden = false;
  var e1 = document.getElementById("pinRegPhone1");
  var e2 = document.getElementById("pinRegPhone2");
  var err = document.getElementById("pinRegPhoneError");
  if (e1) e1.value = "";
  if (e2) e2.value = "";
  if (err) err.textContent = "";
  if (e1) e1.focus();
  showPinGateLocked();
}

function showPinSetup() {
  var g = document.getElementById("pinGate");
  var s = document.getElementById("pinGateSetup");
  var u = document.getElementById("pinGateUnlock");
  if (g) g.setAttribute("aria-labelledby", "pinGateTitle");
  pinGateHideOptionalPanels();
  if (s) s.hidden = false;
  if (u) u.hidden = true;
  var err = document.getElementById("pinSetupError");
  if (err) err.textContent = "";
  showPinGateLocked();
  var f = document.getElementById("pinSetupFirst");
  if (f) f.focus();
}

function showPinUnlock() {
  var g = document.getElementById("pinGate");
  var s = document.getElementById("pinGateSetup");
  var u = document.getElementById("pinGateUnlock");
  if (g) g.setAttribute("aria-labelledby", "pinUnlockTitle");
  pinGateHideOptionalPanels();
  if (s) s.hidden = true;
  if (u) u.hidden = false;
  var inp = document.getElementById("pinUnlockInput");
  if (inp) {
    inp.value = "";
    inp.focus();
  }
  var err = document.getElementById("pinUnlockError");
  if (err) err.textContent = "";
  showPinGateLocked();
}

function persistNewPin(pin) {
  var salt = randomSaltHex();
  return hashPinWithSaltAsync(pin, salt).then(function (hash) {
    if (!safeLocalStorageSetItem(LS_PIN_SALT, salt) || !safeLocalStorageSetItem(LS_PIN_HASH, hash)) {
      return Promise.reject(new Error("storage"));
    }
  });
}

function onPinSessionComplete() {
  pinMarkUnlocked();
  hidePinGate();
}

function onRegisterPhoneContinue() {
  var a = normalizePhoneDigits(document.getElementById("pinRegPhone1").value);
  var b = normalizePhoneDigits(document.getElementById("pinRegPhone2").value);
  var err = document.getElementById("pinRegPhoneError");
  if (err) err.textContent = "";
  if (!isValidPhoneDigits(a) || !isValidPhoneDigits(b)) {
    if (err) err.textContent = "Enter a valid phone number (9–15 digits).";
    return;
  }
  if (a !== b) {
    if (err) err.textContent = "Numbers do not match.";
    return;
  }
  persistRegisteredPhone(a).then(
    function () {
      onPinSessionComplete();
    },
    function () {
      if (err) err.textContent = "Could not save phone — storage full or blocked. Try again.";
      farmStorageNotifyFail();
    }
  );
}

function showPinRecoveryReset() {
  var g = document.getElementById("pinGate");
  var setup = document.getElementById("pinGateSetup");
  var u = document.getElementById("pinGateUnlock");
  var rec = document.getElementById("pinGateRecovery");
  var reg = document.getElementById("pinGateRegisterPhone");
  if (g) g.setAttribute("aria-labelledby", "pinRecoveryResetTitle");
  if (setup) setup.hidden = true;
  if (u) u.hidden = true;
  if (reg) reg.hidden = true;
  if (rec) rec.hidden = false;
  var err = document.getElementById("pinRecoveryError");
  if (err) err.textContent = "";
  var ph = document.getElementById("pinResetPhoneInput");
  var n = document.getElementById("pinRecoveryNew");
  var co = document.getElementById("pinRecoveryConfirm");
  if (ph) ph.value = "";
  if (n) n.value = "";
  if (co) co.value = "";
  if (ph) ph.focus();
  showPinGateLocked();
}

function phoneDigitsClean(el, maxLen) {
  maxLen = maxLen || 15;
  if (!el) return;
  el.addEventListener("input", function () {
    var v = normalizePhoneDigits(el.value).slice(0, maxLen);
    if (normalizePhoneDigits(el.value) !== v) el.value = v;
  });
}

function pinDigitsOnly(el, maxLen) {
  maxLen = maxLen || 4;
  if (!el) return;
  el.addEventListener("input", function () {
    var v = (el.value || "").replace(/\D/g, "").slice(0, maxLen);
    if (el.value !== v) el.value = v;
  });
}

function onPinSave() {
  var err = document.getElementById("pinSetupError");
  var a = (document.getElementById("pinSetupFirst").value || "").replace(/\D/g, "");
  var b = (document.getElementById("pinSetupConfirm").value || "").replace(/\D/g, "");
  if (err) err.textContent = "";
  if (a.length !== 4 || b.length !== 4) {
    if (err) err.textContent = "Enter exactly 4 digits in both fields.";
    return;
  }
  if (a !== b) {
    if (err) err.textContent = "PINs do not match — try again.";
    return;
  }
  persistNewPin(a).then(
    function () {
      showRegisterPhonePanel();
    },
    function () {
      if (err) err.textContent = "Could not save PIN — storage full or blocked. Try again.";
      farmStorageNotifyFail();
    }
  );
}

function onPinUnlock() {
  var pin = (document.getElementById("pinUnlockInput").value || "").replace(/\D/g, "");
  var err = document.getElementById("pinUnlockError");
  if (err) err.textContent = "";
  if (pin.length !== 4) {
    if (err) err.textContent = "Enter 4 digits.";
    return;
  }
  var salt = localStorage.getItem(LS_PIN_SALT) || "";
  var stored = localStorage.getItem(LS_PIN_HASH) || "";
  hashPinWithSaltAsync(pin, salt).then(function (h) {
    if (h === stored) {
      onPinSessionComplete();
    } else {
      if (err) err.textContent = "Wrong PIN. Try again.";
    }
  });
}

function onPinRecoveryModeClick() {
  if (!isPhoneResetConfigured()) {
    alert(
      "No phone number registered for PIN reset. Unlock with your PIN once, then open Profile → Update registered phone."
    );
    return;
  }
  showPinRecoveryReset();
}

function onPinRecoveryBack() {
  showPinUnlock();
}

function onPinRecoverySubmit() {
  var phoneIn = normalizePhoneDigits(document.getElementById("pinResetPhoneInput").value);
  var nu = (document.getElementById("pinRecoveryNew").value || "").replace(/\D/g, "");
  var co = (document.getElementById("pinRecoveryConfirm").value || "").replace(/\D/g, "");
  var err = document.getElementById("pinRecoveryError");
  if (err) err.textContent = "";
  if (!isValidPhoneDigits(phoneIn) || nu.length !== 4 || co.length !== 4) {
    if (err) err.textContent = "Enter your registered phone (9–15 digits) and a 4-digit new PIN.";
    return;
  }
  if (nu !== co) {
    if (err) err.textContent = "New PINs do not match.";
    return;
  }
  var psalt = localStorage.getItem(LS_PHONE_RESET_SALT) || "";
  var pstored = localStorage.getItem(LS_PHONE_RESET_HASH) || "";
  hashPinWithSaltAsync(phoneIn, psalt).then(function (h) {
    if (h !== pstored) {
      if (err) err.textContent = "Phone number does not match the one you registered.";
      return;
    }
    persistNewPin(nu).then(
      function () {
        onPinSessionComplete();
      },
      function () {
        if (err) err.textContent = "Could not save new PIN — storage full or blocked.";
        farmStorageNotifyFail();
      }
    );
  });
}

function createOrReplaceRegisteredPhone() {
  var raw = prompt("Enter your current 4-digit PIN:");
  if (raw == null) return;
  var pin = String(raw).replace(/\D/g, "");
  if (pin.length !== 4) {
    alert("PIN must be exactly 4 digits.");
    return;
  }
  var salt = localStorage.getItem(LS_PIN_SALT) || "";
  var stored = localStorage.getItem(LS_PIN_HASH) || "";
  hashPinWithSaltAsync(pin, salt).then(function (h) {
    if (h !== stored) {
      alert("Wrong PIN.");
      return;
    }
    var p1 = prompt("Enter your new phone number (digits only, 9–15 digits):");
    if (p1 == null) return;
    var d1 = normalizePhoneDigits(p1);
    if (!isValidPhoneDigits(d1)) {
      alert("Enter a valid phone number length.");
      return;
    }
    var p2 = prompt("Confirm the same phone number:");
    if (p2 == null) return;
    var d2 = normalizePhoneDigits(p2);
    if (d1 !== d2) {
      alert("Numbers do not match.");
      return;
    }
    persistRegisteredPhone(d1).then(
      function () {
        alert("Registered phone updated. Use this number if you forget your PIN.");
      },
      function () {
        farmStorageNotifyFail();
      }
    );
  });
}

function bindPinGateEvents() {
  var root = document.getElementById("pinGate");
  if (!root || root.dataset.bound) return;
  root.dataset.bound = "1";
  var save = document.getElementById("pinSaveBtn");
  var unb = document.getElementById("pinUnlockBtn");
  var uni = document.getElementById("pinUnlockInput");
  var recMode = document.getElementById("pinRecoveryModeBtn");
  var recBack = document.getElementById("pinRecoveryBackBtn");
  var recSub = document.getElementById("pinRecoverySubmitBtn");
  var regCont = document.getElementById("pinRegPhoneContinueBtn");
  if (save) save.addEventListener("click", onPinSave);
  if (unb) unb.addEventListener("click", onPinUnlock);
  if (recMode) recMode.addEventListener("click", onPinRecoveryModeClick);
  if (recBack) recBack.addEventListener("click", onPinRecoveryBack);
  if (recSub) recSub.addEventListener("click", onPinRecoverySubmit);
  if (regCont) regCont.addEventListener("click", onRegisterPhoneContinue);
  if (uni) {
    uni.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") onPinUnlock();
    });
  }
  pinDigitsOnly(document.getElementById("pinSetupFirst"), 4);
  pinDigitsOnly(document.getElementById("pinSetupConfirm"), 4);
  pinDigitsOnly(uni, 4);
  phoneDigitsClean(document.getElementById("pinRegPhone1"), 15);
  phoneDigitsClean(document.getElementById("pinRegPhone2"), 15);
  phoneDigitsClean(document.getElementById("pinResetPhoneInput"), 15);
  pinDigitsOnly(document.getElementById("pinRecoveryNew"), 4);
  pinDigitsOnly(document.getElementById("pinRecoveryConfirm"), 4);
  pinDigitsOnly(document.getElementById("pinChangeOld"), 4);
  pinDigitsOnly(document.getElementById("pinChangeNew"), 4);
  pinDigitsOnly(document.getElementById("pinChangeConfirm"), 4);
}

function initPinGate() {
  if (!document.getElementById("pinGate")) return;
  bindPinGateEvents();
  migrateLegacyPinSessionUnlock();
  pinEnsureTabId();
  if (isPinSessionUnlocked()) {
    hidePinGate();
    return;
  }
  if (!isPinConfigured()) {
    showPinSetup();
  } else {
    showPinUnlock();
  }
}

function lockAppNow() {
  pinClearUnlock();
  document.documentElement.classList.remove("pin-session-unlocked");
  if (!document.getElementById("pinGate")) return;
  if (!isPinConfigured()) {
    showPinSetup();
    return;
  }
  showPinUnlock();
}

function clearAllAppStorageAndResetUI() {
  var keys = [
    LS_FARMS,
    LS_ACTIVE,
    LS_SEASON,
    LS_TIMELINE,
    LS_REMINDERS,
    LS_ADVICE,
    LS_HOME_GUIDES_TIP,
    LS_HOME_HOWTO_TIP,
    LS_PIN_HASH,
    LS_PIN_SALT,
    LS_PHONE_RESET_HASH,
    LS_PHONE_RESET_SALT,
    LS_PIN_TAB_UNLOCK,
    "farmData",
    LS_BACKUP_EMAIL,
    LS_BACKUP_REMINDER_DISMISS_DATE,
    LS_STALE_BACKUP_BANNER_DISMISS_UNTIL,
    LS_LAST_BACKUP_AT
  ];
  for (var i = 0; i < keys.length; i++) {
    try {
      localStorage.removeItem(keys[i]);
    } catch (e) {}
  }
  try {
    var j;
    for (j = localStorage.length - 1; j >= 0; j--) {
      var k = localStorage.key(j);
      if (k && k.indexOf(LS_CAPITAL_LOG_PREFIX) === 0) localStorage.removeItem(k);
    }
  } catch (e2) {}
  try {
    sessionStorage.clear();
  } catch (e3) {}
  try {
    document.documentElement.classList.remove("pin-session-unlocked");
    document.documentElement.classList.remove("home-banner-guides-off");
    document.documentElement.classList.remove("home-banner-howto-off");
  } catch (e4) {}
  window.location.reload();
}

function clearAppDataWithPinConfirm() {
  if (!isPinConfigured()) {
    if (
      !window.confirm(
        "No PIN is set on this device yet. Erase all app data saved here anyway? This cannot be undone."
      )
    ) {
      return;
    }
    clearAllAppStorageAndResetUI();
    return;
  }
  var raw = window.prompt(
    "Enter your 4-digit PIN to erase everything: farms, finance log, timeline, PIN, registered phone hash, and all settings on this device."
  );
  if (raw == null) return;
  var pin = String(raw).replace(/\D/g, "");
  if (pin.length !== 4) {
    alert("PIN must be exactly 4 digits.");
    return;
  }
  var salt = localStorage.getItem(LS_PIN_SALT) || "";
  var stored = localStorage.getItem(LS_PIN_HASH) || "";
  hashPinWithSaltAsync(pin, salt).then(function (h) {
    if (h !== stored) {
      alert("Wrong PIN. Nothing was deleted.");
      return;
    }
    if (
      !window.confirm(
        "Final step: all data for this app on this device will be removed, including your PIN and farm records. The page will reload and you start fresh. Continue?"
      )
    ) {
      return;
    }
    clearAllAppStorageAndResetUI();
  });
}

function changeAppPin() {
  var oldEl = document.getElementById("pinChangeOld");
  var newEl = document.getElementById("pinChangeNew");
  var coEl = document.getElementById("pinChangeConfirm");
  if (!oldEl || !newEl || !coEl) return;
  var old = (oldEl.value || "").replace(/\D/g, "");
  var nu = (newEl.value || "").replace(/\D/g, "");
  var co = (coEl.value || "").replace(/\D/g, "");
  if (old.length !== 4 || nu.length !== 4 || co.length !== 4) {
    alert("Enter exactly 4 digits in each field.");
    return;
  }
  if (nu !== co) {
    alert("New PIN and confirmation do not match.");
    return;
  }
  var salt = localStorage.getItem(LS_PIN_SALT) || "";
  var stored = localStorage.getItem(LS_PIN_HASH) || "";
  hashPinWithSaltAsync(old, salt).then(function (h) {
    if (h !== stored) {
      alert("Current PIN is wrong.");
      return;
    }
    persistNewPin(nu).then(
      function () {
        alert("PIN changed. Use the new PIN next time you unlock.");
        oldEl.value = "";
        newEl.value = "";
        coEl.value = "";
      },
      function () {
        farmStorageNotifyFail();
      }
    );
  });
}

function homeGuidesTipDismissed() {
  try {
    return localStorage.getItem(LS_HOME_GUIDES_TIP) === "1";
  } catch (e) {
    return false;
  }
}

function updateHomeReadGuidesBanner() {
  var dismissed = homeGuidesTipDismissed();
  if (dismissed) document.documentElement.classList.add("home-banner-guides-off");
  else document.documentElement.classList.remove("home-banner-guides-off");
  var bar = document.getElementById("homeReadGuidesBanner");
  if (!bar) return;
  bar.hidden = dismissed;
}

function initHomeReadGuidesBanner() {
  var bar = document.getElementById("homeReadGuidesBanner");
  var closeBtn = document.getElementById("homeReadGuidesDismiss");
  if (!bar) return;
  updateHomeReadGuidesBanner();
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = "1";
    closeBtn.addEventListener("click", function () {
      try {
        localStorage.setItem(LS_HOME_GUIDES_TIP, "1");
      } catch (e) {}
      document.documentElement.classList.add("home-banner-guides-off");
      bar.hidden = true;
    });
  }
}

function homeHowToTipDismissed() {
  try {
    return localStorage.getItem(LS_HOME_HOWTO_TIP) === "1";
  } catch (e) {
    return false;
  }
}

function updateHomeHowToBanner() {
  var dismissed = homeHowToTipDismissed();
  if (dismissed) document.documentElement.classList.add("home-banner-howto-off");
  else document.documentElement.classList.remove("home-banner-howto-off");
  var bar = document.getElementById("homeHowToBanner");
  if (!bar) return;
  bar.hidden = dismissed;
}

function initHomeHowToBanner() {
  var bar = document.getElementById("homeHowToBanner");
  var closeBtn = document.getElementById("homeHowToDismiss");
  if (!bar) return;
  updateHomeHowToBanner();
  if (closeBtn && !closeBtn.dataset.bound) {
    closeBtn.dataset.bound = "1";
    closeBtn.addEventListener("click", function () {
      try {
        localStorage.setItem(LS_HOME_HOWTO_TIP, "1");
      } catch (e) {}
      document.documentElement.classList.add("home-banner-howto-off");
      bar.hidden = true;
    });
  }
}

function refreshHomeFarmDashboard() {
  var wrap = document.getElementById("homeFarmDashboardBody");
  if (!wrap) return;
  var snap = collectFormSnapshot();
  var farmName = getActiveFarmName();
  var capital = Number(snap.recordCapital) || 0;
  var spend = spendFromSnapshot(snap);
  var balance = capital - spend;
  var land = Number(snap.plantLand) || 0;
  var variety = (snap.plantVariety || "").trim();
  var plantDate = snap.plantingDateMain || "";
  var revenue = Number(snap.recordRevenue) || 0;

  var balClass = "home-farm-dash__tile-val";
  if (capital > 0 && balance < 0) balClass += " home-farm-dash__tile-val--warn";
  else if (capital > 0 && balance >= 0) balClass += " home-farm-dash__tile-val--ok";

  var capTxt = capital > 0 ? formatUGX(capital) : "Not set";
  var spendTxt = spend > 0 ? formatUGX(spend) : "—";
  var balTxt = capital > 0 ? formatUGX(balance) : "—";

  var dapLine = "";
  if (plantDate) {
    var pdd = new Date(plantDate);
    if (!isNaN(pdd.getTime())) {
      pdd.setHours(12, 0, 0, 0);
      var todayD = new Date();
      todayD.setHours(12, 0, 0, 0);
      dapLine = "Today ≈ DAP " + Math.round((todayD.getTime() - pdd.getTime()) / 864e5);
    }
  }

  var plantInfo = "";
  if (land > 0) {
    plantInfo = land + " ac" + (variety ? " · " + escapeHtml(variety) : "");
    if (plantDate) {
      var pdx = new Date(plantDate);
      if (!isNaN(pdx.getTime())) plantInfo += " · planted " + escapeHtml(formatDate(pdx));
    }
  } else {
    plantInfo = '<span class="mo-muted">Set land &amp; variety in Planting.</span>';
  }

  var nextBlock = "";
  if (plantDate) {
    var up = getUpcomingTimelineItems(plantDate, 4);
    if (up.length) {
      var lis = "";
      for (var u = 0; u < up.length; u++) {
        lis +=
          "<li><span class=\"home-farm-dash__next-meta\">DAP " +
          up[u].days +
          " · " +
          escapeHtml(up[u].date) +
          "</span>" +
          escapeHtml(up[u].label) +
          "</li>";
      }
      nextBlock =
        '<p style="margin:12px 0 6px;font-size:11px;font-weight:800;color:#1b5e20;text-transform:uppercase;letter-spacing:0.05em;">Next activities</p><ul class="home-farm-dash__next">' +
        lis +
        "</ul>";
    } else {
      nextBlock =
        '<p class="home-farm-dash__hint" style="margin-top:10px;">Season milestones look complete for this planting date — check <b>Harvest</b> or plan the next crop.</p>';
    }
  } else {
    nextBlock =
      '<p class="home-farm-dash__hint" style="margin-top:10px;">Add a <b>planting date</b> in Planting to see your next tasks here.</p>' +
      '<button type="button" class="btn-outline btn-sm" data-farm-sub="farm-planting" style="margin-top:8px;">Open Planting</button>';
  }

  var profitLine = "";
  if (latestProfitValue !== 0) {
    profitLine =
      '<p class="home-farm-dash__hint" style="margin-top:10px;">Last yield run (profit): <strong>' +
      formatUGX(latestProfitValue) +
      "</strong></p>";
  }

  var revRow = "";
  if (revenue > 0) {
    revRow =
      '<div class="home-farm-dash__tile" style="grid-column: 1 / -1;"><span class="home-farm-dash__tile-label">Revenue logged</span><span class="home-farm-dash__tile-val">' +
      formatUGX(revenue) +
      "</span></div>";
  }

  wrap.innerHTML =
    '<p class="home-farm-dash__farm">' +
    escapeHtml(farmName) +
    "</p>" +
    '<p style="margin:0 0 8px;font-size:12px;line-height:1.45;">' +
    plantInfo +
    "</p>" +
    '<div class="home-farm-dash__grid">' +
    '<div class="home-farm-dash__tile"><span class="home-farm-dash__tile-label">Capital</span><span class="home-farm-dash__tile-val">' +
    capTxt +
    "</span></div>" +
    '<div class="home-farm-dash__tile"><span class="home-farm-dash__tile-label">Total spend</span><span class="home-farm-dash__tile-val">' +
    spendTxt +
    "</span></div>" +
    '<div class="home-farm-dash__tile"><span class="home-farm-dash__tile-label">Balance</span><span class="' +
    balClass +
    '">' +
    balTxt +
    "</span></div>" +
    '<div class="home-farm-dash__tile"><span class="home-farm-dash__tile-label">Crop stage</span><span class="home-farm-dash__tile-val" style="font-size:13px;">' +
    (dapLine ? escapeHtml(dapLine) : "—") +
    "</span></div>" +
    revRow +
    "</div>" +
    nextBlock +
    profitLine;
}

function refreshHomeFarmDashboardIfHome() {
  var h = document.getElementById("home");
  if (h && h.classList.contains("active")) refreshHomeFarmDashboard();
}

/* =====================================================================
   INIT
   Future: Weather API, market prices, PDF library, auth, push subscriptions
   ===================================================================== */
window.runPlantingModule = runPlantingModule;
window.runCropCareModule = runCropCareModule;
window.buildTimelineAndReminders = buildTimelineAndReminders;
window.runRecordKeeping = runRecordKeeping;
window.saveSeasonRecord = saveSeasonRecord;
window.runYieldPrediction = runYieldPrediction;
window.runHarvestModule = runHarvestModule;
window.runAdviceEngine = runAdviceEngine;
window.downloadFarmReport = downloadFarmReport;
window.addFarmProfile = addFarmProfile;
window.saveActiveFarmSnapshot = saveActiveFarmSnapshot;
window.contact = contact;
window.contactCallDeveloper = contactCallDeveloper;
window.clearAppDataWithPinConfirm = clearAppDataWithPinConfirm;
window.downloadAppDataBackup = downloadAppDataBackup;
window.saveBackupEmailFromProfile = saveBackupEmailFromProfile;
window.requestCloudBackupRecovery = requestCloudBackupRecovery;
window.addCapitalLogEntry = addCapitalLogEntry;
window.applyCapitalLogToFinanceForm = applyCapitalLogToFinanceForm;
window.lockAppNow = lockAppNow;
window.changeAppPin = changeAppPin;
window.createOrReplaceRegisteredPhone = createOrReplaceRegisteredPhone;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js?v=26")
    .then(function (reg) { reg.update(); });
}

initPinGate();
initAppNavigation();
initFarmSubNavigation();
renderFarmSelect();
loadFarmSnapshotToForm();
syncProfileBackupEmailField();
refreshHomeFarmDashboard();
initPlantingBannerWatch();
loadSeasonRecord();
initHomeReadGuidesBanner();
initHomeHowToBanner();
initFinanceLabourLiveTotal();
initFinanceTabsAndCapitalLog();
renderCapitalLogUI();
initFarmFormAutosave();
bindStorageFlushOnLeave();
initRestoreBackupFileInput();
initGlobalBackupBanners();
checkForAppUpdate();
tryCloudBackupUpload();

window.addEventListener("load", function () {
  tryApplyCloudRecoveryFromUrl();

  /* Deep links: index.html#guides or #farm */
  var h = (window.location.hash || "").replace(/^#/, "");
  if (h === "guides") showPage("guides");
  else if (h === "farm" || h === "farm-hub") showPage("farm-hub");
  else if (h === "profile") showPage("profile");
  else {
    try {
      var lastPg = localStorage.getItem(LS_LAST_PAGE);
      if (lastPg && KNOWN_PAGE_IDS.indexOf(lastPg) >= 0 && document.getElementById(lastPg)) showPage(lastPg);
    } catch (eNav) {}
  }

  var t = localStorage.getItem(LS_TIMELINE);
  if (t) {
    try {
      latestTimelineEvents = JSON.parse(t);
      var vis = document.getElementById("timelineVisual");
      vis.innerHTML = "";
      for (var i = 0; i < latestTimelineEvents.length; i++) {
        var li = document.createElement("li");
        li.innerHTML = "<span>" + escapeHtml(latestTimelineEvents[i].label) + "</span><span>" + escapeHtml(latestTimelineEvents[i].date) + "</span>";
        vis.appendChild(li);
      }
    } catch (e) {}
  }
  var r = localStorage.getItem(LS_REMINDERS);
  if (r) {
    try {
      var arr = JSON.parse(r);
      var listEl = document.getElementById("reminderList");
      listEl.innerHTML = "";
      for (var j = 0; j < arr.length; j++) {
        var item = document.createElement("li");
        item.textContent = arr[j];
        listEl.appendChild(item);
      }
    } catch (e) {}
  }
  var snAdvice = getActiveFarmSnapshot();
  var adv = localStorage.getItem(LS_ADVICE);
  if (adv && !(snAdvice.uiAdviceHtml && String(snAdvice.uiAdviceHtml).length > 0)) {
    latestAdviceText = adv;
    document.getElementById("adviceResult").textContent = adv;
  }
  refreshSummary();
  refreshHubFarmCalendar();
  updateHomeReadGuidesBanner();
  updateHomeHowToBanner();
  refreshHomeFarmDashboard();
  refreshGlobalBackupBanners();
  checkForAppUpdate();
  tryCloudBackupUpload();
}); 