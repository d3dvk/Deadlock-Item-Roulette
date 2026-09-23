#!/usr/bin/env python3
"""
Scamlock Final Engine Generator
Transforms the stable 656ad1c engine baseline into Scamlock:
1. Scamlock Branding (zero emojis, no version suffix).
2. Soft Mode Fail-Safe (Layer 3 Inventory/Shop scan in CheckIsTargetItemPurchased + Skip button on targetCard).
3. Recalibrated Time Progression (0-5m: 65% T1, 25% T2, 8% T3, 2% T4) decoupled from souls.
4. 16-Item Draft Mode (4 T1, 6 T2, 4 T3, 2 T4 unowned priority) with Tab Bar (Roulette / Draft).
5. Clean UI (removed obsolete reroll/reset/log buttons, clean shop return button).
6. Universal Mod Manager (UMM) crash-proof integration.
"""

import sys
import subprocess
from pathlib import Path

BASE_DIR = Path("E:/Deadlock_mod")
TARGET_JS = BASE_DIR / "game/citadel/panorama/scripts/deadlock_item_roulette_engine.js"
BASELINE_JS = BASE_DIR / "scratch/working_656ad1c_engine.js"

with open(BASELINE_JS, "r", encoding="utf-8") as f:
    code = f.read()

# -------------------------------------------------------------------------
# 1. SOFT MODE LAYER 3 SCAN IN CheckIsTargetItemPurchased
# -------------------------------------------------------------------------
old_check = """        // LAYER 2: QUICKBUY QUEUE CONSUMPTION
        if (quickbuyConfirmedSeen && (Date.now() - targetSetTimestamp > 1000)) {
            if (!IsTargetInQuickbuyQueue(currentTargetItem)) {
                RouletteLogger.Log("Target item consumed from Quickbuy: " + currentTargetItem.name, "PURCHASE");
                MarkItemOwned(currentTargetItem);
                return true;
            }
        }

        return false;
    }"""

new_check = """        // LAYER 2: QUICKBUY QUEUE CONSUMPTION
        if (quickbuyConfirmedSeen && (Date.now() - targetSetTimestamp > 1000)) {
            if (!IsTargetInQuickbuyQueue(currentTargetItem)) {
                RouletteLogger.Log("Target item consumed from Quickbuy: " + currentTargetItem.name, "PURCHASE");
                MarkItemOwned(currentTargetItem);
                return true;
            }
        }

        // LAYER 3: INVENTORY & SHOP OWNERSHIP SCAN (Fail-safe for direct shop buys or Monster Rounds)
        if (IsItemOwned(currentTargetItem) || IsItemOwnedByName(currentTargetItem.name)) {
            RouletteLogger.Log("Target item confirmed owned via Inventory/Shop scan: " + currentTargetItem.name, "PURCHASE");
            return true;
        }

        return false;
    }"""

assert old_check in code, "Could not find CheckIsTargetItemPurchased block in baseline"
code = code.replace(old_check, new_check)

# -------------------------------------------------------------------------
# 2. TIME PROGRESSION RECALIBRATION (0-5m: 65% T1, 25% T2, 8% T3, 2% T4)
# -------------------------------------------------------------------------
old_weights = """    function GetTimeTierWeights(gameSeconds) {
        var m = (gameSeconds || 0) / 60.0;
        if (m < 5.0) {
            // 0 - 5 min: Tier 1 dominant (75% T1, 20% T2, 5% T3, 0% T4)
            return { 1: 0.75, 2: 0.20, 3: 0.05, 4: 0.00, phaseRu: "Тир 1 (0-5 мин)", phaseEn: "Tier 1 (0-5 min)" };
        } else if (m < 10.0) {
            // 5 - 10 min: Tier 2 dominant (20% T1, 60% T2, 15% T3, 5% T4)
            return { 1: 0.20, 2: 0.60, 3: 0.15, 4: 0.05, phaseRu: "Тир 2 (5-10 мин)", phaseEn: "Tier 2 (5-10 min)" };
        } else if (m < 15.0) {
            // 10 - 15 min: Tier 3 dominant (10% T1, 20% T2, 55% T3, 15% T4)
            return { 1: 0.10, 2: 0.20, 3: 0.55, 4: 0.15, phaseRu: "Тир 3 (10-15 мин)", phaseEn: "Tier 3 (10-15 min)" };
        } else {
            // 15+ min: Tier 4 late game (5% T1, 15% T2, 35% T3, 45% T4)
            return { 1: 0.05, 2: 0.15, 3: 0.35, 4: 0.45, phaseRu: "Тир 4 (15+ мин)", phaseEn: "Tier 4 (15+ min)" };
        }
    }"""

new_weights = """    function GetTimeTierWeights(gameSeconds) {
        var m = (gameSeconds || 0) / 60.0;
        if (m < 5.0) {
            // 0 - 5 min: Tier 1 dominant (65% T1, 25% T2, 8% T3, 2% T4)
            return { 1: 0.65, 2: 0.25, 3: 0.08, 4: 0.02, phaseRu: "Тир 1 (0-5 мин)", phaseEn: "Tier 1 (0-5 min)" };
        } else if (m < 10.0) {
            // 5 - 10 min: Tier 2 dominant (20% T1, 60% T2, 15% T3, 5% T4)
            return { 1: 0.20, 2: 0.60, 3: 0.15, 4: 0.05, phaseRu: "Тир 2 (5-10 мин)", phaseEn: "Tier 2 (5-10 min)" };
        } else if (m < 15.0) {
            // 10 - 15 min: Tier 3 dominant (10% T1, 20% T2, 55% T3, 15% T4)
            return { 1: 0.10, 2: 0.20, 3: 0.55, 4: 0.15, phaseRu: "Тир 3 (10-15 мин)", phaseEn: "Tier 3 (10-15 min)" };
        } else {
            // 15+ min: Tier 4 late game (5% T1, 15% T2, 35% T3, 45% T4)
            return { 1: 0.05, 2: 0.15, 3: 0.35, 4: 0.45, phaseRu: "Тир 4 (15+ мин)", phaseEn: "Tier 4 (15+ min)" };
        }
    }"""

assert old_weights in code, "Could not find GetTimeTierWeights block in baseline"
code = code.replace(old_weights, new_weights)

# -------------------------------------------------------------------------
# 3. DECOUPLE GetEffectiveGameTime FROM SOULS
# -------------------------------------------------------------------------
old_time = """    function GetEffectiveGameTime() {
        try {
            if (typeof Game !== "undefined") {
                if (Game.GetGameTime) {
                    var gt = Game.GetGameTime();
                    if (gt > 0) return gt;
                }
                if (Game.Time) {
                    var t = Game.Time();
                    if (t > 0) return t;
                }
            }
        } catch (e) {}

        // Fallback: estimate from player souls
        var souls = ShopPurchaseTracker.GetPlayerTotalSouls();
        if (souls >= 15000) return 960; // 16 min (Tier 4)
        if (souls >= 7000) return 660;  // 11 min (Tier 3)
        if (souls >= 2500) return 360;  // 6 min (Tier 2)
        return 120; // 2 min (Tier 1)
    }"""

new_time = """    var matchLoadTimestamp = Date.now();

    function GetEffectiveGameTime() {
        try {
            if (typeof Game !== "undefined") {
                if (typeof Game.GetGameTime === "function") {
                    var gt = Game.GetGameTime();
                    if (gt > 0) return gt;
                }
                if (typeof Game.Time === "function") {
                    var t = Game.Time();
                    if (t > 0) return t;
                }
            }
        } catch (e) {}

        try {
            var top = GetTopRoot();
            if (top && top.IsValid()) {
                var timeLbl = top.FindChildTraverse("TimeLabel") ||
                              top.FindChildTraverse("MatchClock") ||
                              top.FindChildTraverse("GameTime");
                if (timeLbl && timeLbl.text) {
                    var clockStr = timeLbl.text.trim();
                    var parts = clockStr.split(":");
                    if (parts.length >= 2) {
                        var parsedMin = parseInt(parts[0], 10);
                        var parsedSec = parseInt(parts[1], 10);
                        if (!isNaN(parsedMin) && !isNaN(parsedSec)) {
                            return parsedMin * 60 + parsedSec;
                        }
                    }
                }
            }
        } catch (e) {}

        var elapsed = (Date.now() - matchLoadTimestamp) / 1000.0;
        return elapsed > 0 ? elapsed : 0;
    }"""

assert old_time in code, "Could not find GetEffectiveGameTime block in baseline"
code = code.replace(old_time, new_time)

# -------------------------------------------------------------------------
# 4. INSERT ScamlockDraft MODULE BEFORE ItemRoulette
# -------------------------------------------------------------------------
draft_module = """// =========================================================================
// 2.5 SCAMLOCK BALANCED 16-ITEM DRAFT GENERATOR
// =========================================================================
var ScamlockDraft = (function () {
    var currentDraft = null;

    function ShuffleArray(arr) {
        var copy = arr.slice(0);
        for (var j = copy.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var temp = copy[j];
            copy[j] = copy[k];
            copy[k] = temp;
        }
        return copy;
    }

    function PickUnowned(pool, count) {
        var unowned = [];
        for (var i = 0; i < pool.length; i++) {
            if (!ShopPurchaseTracker.IsItemOwned(pool[i])) {
                unowned.push(pool[i]);
            }
        }
        var src = (unowned.length >= count) ? unowned : pool;
        var shuffled = ShuffleArray(src);
        return shuffled.slice(0, count);
    }

    function GenerateBalancedDraft() {
        var t1 = DeadlockItemsDB.GetItemsByTier(1);
        var t2 = DeadlockItemsDB.GetItemsByTier(2);
        var t3 = DeadlockItemsDB.GetItemsByTier(3);
        var t4 = DeadlockItemsDB.GetItemsByTier(4);

        currentDraft = {
            t1: PickUnowned(t1, 4),
            t2: PickUnowned(t2, 6),
            t3: PickUnowned(t3, 4),
            t4: PickUnowned(t4, 2)
        };
        RouletteLogger.Log("Generated 16-item balanced draft (4 T1, 6 T2, 4 T3, 2 T4)", "DRAFT");
        return currentDraft;
    }

    function GetCurrentDraft() {
        if (!currentDraft) {
            GenerateBalancedDraft();
        }
        return currentDraft;
    }

    function QueueAllDraftToQuickbuy() {
        if (!currentDraft) GenerateBalancedDraft();
        var count = 0;
        var lists = [currentDraft.t1, currentDraft.t2, currentDraft.t3, currentDraft.t4];
        for (var l = 0; l < lists.length; l++) {
            var items = lists[l] || [];
            for (var i = 0; i < items.length; i++) {
                ShopPurchaseTracker.QueueItemIntoQuickbuy(items[i]);
                count++;
            }
        }
        RouletteLogger.Log("Queued " + count + " draft items into Quickbuy", "DRAFT");
        return count;
    }

    return {
        GenerateBalancedDraft: GenerateBalancedDraft,
        GetCurrentDraft: GetCurrentDraft,
        QueueAllDraftToQuickbuy: QueueAllDraftToQuickbuy
    };
})();

"""

item_roulette_marker = "// =========================================================================\n// 3. CONTINUOUS JUMP-FREE ROULETTE ENGINE"
assert item_roulette_marker in code, "Could not find ItemRoulette marker in baseline"
code = code.replace(item_roulette_marker, draft_module + item_roulette_marker)

# -------------------------------------------------------------------------
# 5. UPDATE STRINGS (SCAMLOCK, NO EMOJIS, NO VERSION SUFFIX)
# -------------------------------------------------------------------------
old_strings = """    var STRINGS = {
        ru: {
            title: "DEADLOCK ITEM ROULETTE",
            subtitle: "Случайные предметы • Закупай то, что выпало",
            souls: "Души: ",
            vanillaShop: "МАГАЗИН ➔",
            returnRoulette: "К РУЛЕТКЕ",
            spinBtn: "КРУТИТЬ РУЛЕТКУ",
            spinningBtn: "ПРОКРУТКА...",
            buyFirstBtn: "ТРЕБУЕТСЯ КУПИТЬ: ",
            rerollBtn: "РЕРОЛЛ ",
            rerollDisabled: "НЕТ РЕРОЛЛОВ",
            statusReady: "Колесо готово. Нажмите для выбора предмета.",
            statusRolling: "Колёса крутятся...",
            statusWon: "Выпало: ",
            statusWonSub: ". Загляните в лавку за покупкой.",
            statusBought: "Предмет куплен! Можно крутить дальше.",
            statusMustBuy: "Сначала купите в лавке: ",
            targetHeader: "ВЫПАВШИЙ ПРЕДМЕТ (К ПОКУПКЕ):",
            targetNone: "Пока пусто • Нажмите «Крутить рулетку»",
            resetBtn: "СБРОС",
            resetTooltip: "Аварийный сброс рулетки (в случае сбоя)",
            tier: "Тир",
            logsBtn: "ЛОГИ",
            logTitle: "Журнал событий Deadlock Roulette",
            copyLogs: "Копировать",
            clearLogs: "Очистить",
            closeLogs: "Закрыть",
            logsCopied: "Скопировано в буфер!",
            allLogsCleared: "Логи очищены",
            credits: "Deadlock Item Roulette • Автор: d3dvk • Разработано с помощью AI"
        },
        en: {
            title: "DEADLOCK ITEM ROULETTE",
            subtitle: "Random Upgrades • Buy What Drops",
            souls: "Souls: ",
            vanillaShop: "VANILLA SHOP ➔",
            returnRoulette: "TO ROULETTE",
            spinBtn: "SPIN THE WHEEL",
            spinningBtn: "ROLLING...",
            buyFirstBtn: "REQUIRED TO BUY: ",
            rerollBtn: "REROLL ",
            rerollDisabled: "NO REROLLS",
            statusReady: "Wheel ready. Click to spin for an upgrade.",
            statusRolling: "Spinning...",
            statusWon: "Won: ",
            statusWonSub: ". Purchase at the shop to continue.",
            statusBought: "Target purchased! You may spin again.",
            statusMustBuy: "Purchase required: ",
            targetHeader: "CURRENT TARGET (MUST BUY):",
            targetNone: "No active target • Click «Spin The Wheel»",
            resetBtn: "RESET",
            resetTooltip: "Emergency reset of roulette state",
            tier: "Tier",
            logsBtn: "LOGS",
            logTitle: "Deadlock Roulette Action Logs",
            copyLogs: "Copy Logs",
            clearLogs: "Clear",
            closeLogs: "Close",
            logsCopied: "Copied to clipboard!",
            allLogsCleared: "Logs cleared",
            credits: "Deadlock Item Roulette • Author: d3dvk • Built with AI"
        }
    };"""

new_strings = """    var STRINGS = {
        ru: {
            title: "SCAMLOCK",
            subtitle: "Случайный закуп и драфты в Deadlock",
            souls: "Души: ",
            vanillaShop: "МАГАЗИН",
            returnRoulette: "ВЕРНУТЬСЯ В SCAMLOCK",
            tabRoulette: "РУЛЕТКА",
            tabDraft: "ДРАФТ (16)",
            spinBtn: "КРУТИТЬ РУЛЕТКУ",
            spinningBtn: "ПРОКРУТКА...",
            buyFirstBtn: "ТРЕБУЕТСЯ КУПИТЬ: ",
            statusReady: "Колесо готово. Нажмите для выбора предмета.",
            statusRolling: "Колёса крутятся...",
            statusWon: "Выпало: ",
            statusWonSub: ". Загляните в лавку за покупкой.",
            statusBought: "Предмет куплен! Можно крутить дальше.",
            statusMustBuy: "Сначала купите в лавке: ",
            targetHeader: "ВЫПАВШИЙ ПРЕДМЕТ (К ПОКУПКЕ):",
            targetNone: "Пока пусто • Нажмите «Крутить рулетку»",
            skipTarget: "СКИП",
            tier: "Тир",
            draftTitle: "ДРАФТ НА МАТЧ (16 ПРЕДМЕТОВ)",
            draftReroll: "ПЕРЕСОБРАТЬ ДРАФТ",
            draftQuickbuy: "В QUICKBUY ВСЕ (16)",
            draftQueued: "Все 16 предметов добавлены в Quickbuy!",
            t1Header: "ТИР 1 - РАННЯЯ ИГРА (4 ПРЕДМЕТА)",
            t2Header: "ТИР 2 - ОСНОВА (6 ПРЕДМЕТОВ)",
            t3Header: "ТИР 3 - ПИК СИЛЫ (4 ПРЕДМЕТА)",
            t4Header: "ТИР 4 - ФИНАЛ (2 ПРЕДМЕТА)",
            credits: "Scamlock • Автор: d3dvk • Разработано для сообщества Deadlock"
        },
        en: {
            title: "SCAMLOCK",
            subtitle: "Random Upgrades & Drafts for Deadlock",
            souls: "Souls: ",
            vanillaShop: "VANILLA SHOP",
            returnRoulette: "RETURN TO SCAMLOCK",
            tabRoulette: "ROULETTE",
            tabDraft: "DRAFT (16)",
            spinBtn: "SPIN THE WHEEL",
            spinningBtn: "ROLLING...",
            buyFirstBtn: "REQUIRED TO BUY: ",
            statusReady: "Wheel ready. Click to spin for an upgrade.",
            statusRolling: "Spinning...",
            statusWon: "Won: ",
            statusWonSub: ". Purchase at the shop to continue.",
            statusBought: "Target purchased! You may spin again.",
            statusMustBuy: "Purchase required: ",
            targetHeader: "CURRENT TARGET (MUST BUY):",
            targetNone: "No active target • Click «Spin The Wheel»",
            skipTarget: "SKIP",
            tier: "Tier",
            draftTitle: "MATCH DRAFT (16 BALANCED ITEMS)",
            draftReroll: "REROLL DRAFT",
            draftQuickbuy: "QUEUE ALL (16) TO QUICKBUY",
            draftQueued: "All 16 draft items queued to Quickbuy!",
            t1Header: "TIER 1 - EARLY GAME (4 ITEMS)",
            t2Header: "TIER 2 - CORE ITEMS (6 ITEMS)",
            t3Header: "TIER 3 - POWER SPIKE (4 ITEMS)",
            t4Header: "TIER 4 - LUXURY (2 ITEMS)",
            credits: "Scamlock • Author: d3dvk • Built for Deadlock Community"
        }
    };"""

assert old_strings in code, "Could not find STRINGS block in baseline"
code = code.replace(old_strings, new_strings)

# -------------------------------------------------------------------------
# 6. REPLACE READY LOG STRING
# -------------------------------------------------------------------------
code = code.replace('"Deadlock Item Roulette ready!"', '"Scamlock (Скамлок) ready!"')

# -------------------------------------------------------------------------
# 7. ADD TAB STATE & DRAFT PANELS TO ItemRoulette VARIABLES
# -------------------------------------------------------------------------
old_dom_vars = """    // DOM Elements
    var overlayPanel = null;
    var mainModalContent = null;
    var reelPanel = null;
    var carouselContainer = null;
    var spinButton = null;
    var spinBtnText = null;
    var rerollBtn = null;
    var rerollBtnText = null;
    var emergencyResetBtn = null;
    var emergencyResetLbl = null;
    var langToggleBtn = null;
    var langToggleText = null;
    var logToggleBtn = null;
    var logToggleText = null;
    var statusLabel = null;
    var phaseBadge = null;
    var soulsLabel = null;
    var soulsTitleLabel = null;
    var titleLabel = null;
    var subtitleLabel = null;
    var toggleShopLabel = null;
    var targetCard = null;
    var targetIcon = null;
    var targetName = null;
    var targetHeader = null;
    var targetProgressFill = null;
    var targetProgressText = null;
    var returnToRouletteBtn = null;
    var returnToRouletteLbl = null;
    var logViewerModal = null;
    var logViewerText = null;
    var copyLogsBtn = null;
    var copyLogsLbl = null;
    var clearLogsBtn = null;
    var clearLogsLbl = null;
    var closeLogsBtn = null;
    var closeLogsLbl = null;
    var logModalTitle = null;
    var creditsLabel = null;
    var initialized = false;"""

new_dom_vars = """    // Tab and View State
    var currentTab = "roulette";
    var tabRouletteBtn = null;
    var tabRouletteLbl = null;
    var tabDraftBtn = null;
    var tabDraftLbl = null;
    var rouletteViewPanel = null;
    var draftViewPanel = null;
    var draftStatusLabel = null;
    var draftTitleLbl = null;
    var draftRerollBtn = null;
    var draftRerollLbl = null;
    var draftQuickbuyBtn = null;
    var draftQuickbuyLbl = null;
    var draftGridContainer = null;
    var targetSkipBtn = null;
    var targetSkipLbl = null;

    // DOM Elements
    var overlayPanel = null;
    var mainModalContent = null;
    var reelPanel = null;
    var carouselContainer = null;
    var spinButton = null;
    var spinBtnText = null;
    var langToggleBtn = null;
    var langToggleText = null;
    var statusLabel = null;
    var phaseBadge = null;
    var soulsLabel = null;
    var soulsTitleLabel = null;
    var titleLabel = null;
    var subtitleLabel = null;
    var toggleShopLabel = null;
    var targetCard = null;
    var targetIcon = null;
    var targetName = null;
    var targetHeader = null;
    var targetProgressFill = null;
    var targetProgressText = null;
    var returnToRouletteBtn = null;
    var returnToRouletteLbl = null;
    var creditsLabel = null;
    var initialized = false;"""

assert old_dom_vars in code, "Could not find old DOM variables block in baseline"
code = code.replace(old_dom_vars, new_dom_vars)

# -------------------------------------------------------------------------
# 8. ADD SwitchTab AND RenderDraftGrid METHODS
# -------------------------------------------------------------------------
tab_switch_methods = """    function SwitchTab(tabName) {
        currentTab = tabName;
        if (tabName === "draft") {
            if (rouletteViewPanel) rouletteViewPanel.style.visibility = "collapse";
            if (draftViewPanel) {
                draftViewPanel.style.visibility = "visible";
                RenderDraftGrid();
            }
            if (tabDraftBtn) {
                tabDraftBtn.style.backgroundColor = "#2563eb";
                tabDraftBtn.style.border = "1px solid #60a5fa";
            }
            if (tabRouletteBtn) {
                tabRouletteBtn.style.backgroundColor = "#1f2937";
                tabRouletteBtn.style.border = "1px solid #374151";
            }
        } else {
            if (draftViewPanel) draftViewPanel.style.visibility = "collapse";
            if (rouletteViewPanel) rouletteViewPanel.style.visibility = "visible";
            if (tabRouletteBtn) {
                tabRouletteBtn.style.backgroundColor = "#2563eb";
                tabRouletteBtn.style.border = "1px solid #60a5fa";
            }
            if (tabDraftBtn) {
                tabDraftBtn.style.backgroundColor = "#1f2937";
                tabDraftBtn.style.border = "1px solid #374151";
            }
        }
    }

    function RenderDraftGrid() {
        if (!draftGridContainer || !draftGridContainer.IsValid()) return;
        draftGridContainer.RemoveAndDeleteChildren();

        var draft = ScamlockDraft.GetCurrentDraft();
        if (!draft) return;

        var sections = [
            { tier: 1, title: STRINGS[currentLang].t1Header, items: draft.t1, color: "#10b981" },
            { tier: 2, title: STRINGS[currentLang].t2Header, items: draft.t2, color: "#3b82f6" },
            { tier: 3, title: STRINGS[currentLang].t3Header, items: draft.t3, color: "#8b5cf6" },
            { tier: 4, title: STRINGS[currentLang].t4Header, items: draft.t4, color: "#f59e0b" }
        ];

        for (var s = 0; s < sections.length; s++) {
            var sec = sections[s];
            var secWrap = $.CreatePanel("Panel", draftGridContainer, "DraftSec_" + sec.tier);
            ApplyStyles(secWrap, {
                "flow-children": "down",
                "width": "100%",
                "margin-top": "6px"
            });

            var headerLbl = $.CreatePanel("Label", secWrap, "");
            headerLbl.text = sec.title;
            ApplyStyles(headerLbl, {
                "color": sec.color,
                "font-size": "10.5px",
                "font-weight": "bold",
                "letter-spacing": "0.5px",
                "margin-bottom": "4px"
            });

            var row = $.CreatePanel("Panel", secWrap, "DraftRow_" + sec.tier);
            ApplyStyles(row, {
                "flow-children": "right",
                "width": "100%"
            });

            for (var c = 0; c < sec.items.length; c++) {
                (function (it) {
                    var card = $.CreatePanel("Button", row, "");
                    var cardW = (sec.tier === 2) ? "120px" : "185px";
                    ApplyStyles(card, {
                        "width": cardW,
                        "background-color": "#111827",
                        "border": "1px solid #1f2937",
                        "border-radius": "4px",
                        "padding": "4px 6px",
                        "margin-right": "6px",
                        "flow-children": "right"
                    });

                    var img = $.CreatePanel("Image", card, "");
                    img.SetImage(it.image);
                    ApplyStyles(img, {
                        "width": "28px",
                        "height": "28px",
                        "border-radius": "3px",
                        "vertical-align": "center"
                    });

                    var info = $.CreatePanel("Panel", card, "");
                    ApplyStyles(info, {
                        "flow-children": "down",
                        "margin-left": "6px",
                        "vertical-align": "center",
                        "width": "fill-parent-flow(1.0)"
                    });

                    var nameLbl = $.CreatePanel("Label", info, "");
                    nameLbl.text = (currentLang === "ru" && it.ruName) ? it.ruName : it.name;
                    ApplyStyles(nameLbl, {
                        "color": "#ffffff",
                        "font-size": "10px",
                        "font-weight": "bold"
                    });

                    var costLbl = $.CreatePanel("Label", info, "");
                    costLbl.text = it.cost + " Souls";
                    ApplyStyles(costLbl, {
                        "color": "#9ca3af",
                        "font-size": "9px"
                    });

                    card.SetPanelEvent("onmouseover", function () {
                        card.style.brightness = "1.25";
                        card.style.border = "1px solid #60a5fa";
                    });
                    card.SetPanelEvent("onmouseout", function () {
                        card.style.brightness = "1.0";
                        card.style.border = "1px solid #1f2937";
                    });
                    card.SetPanelEvent("onactivate", function () {
                        PlaySound("UI.MainMenu.Activate");
                        ShopPurchaseTracker.QueueItemIntoQuickbuy(it);
                        if (draftStatusLabel) {
                            draftStatusLabel.text = "+ " + ((currentLang === "ru" && it.ruName) ? it.ruName : it.name) + " -> Quickbuy";
                            draftStatusLabel.style.color = "#10b981";
                        }
                    });
                })(sec.items[c]);
            }
        }
    }
"""

toggle_lang_marker = "    function ToggleLanguage() {"
assert toggle_lang_marker in code, "Could not find ToggleLanguage in baseline"
code = code.replace(toggle_lang_marker, tab_switch_methods + "\n" + toggle_lang_marker)

# -------------------------------------------------------------------------
# 9. UPDATE ToggleLanguage TO REFRESH DRAFT STRINGS
# -------------------------------------------------------------------------
old_toggle_lang_body = """        if (titleLabel) titleLabel.text = s.title;
        if (subtitleLabel) subtitleLabel.text = s.subtitle;
        if (soulsTitleLabel) soulsTitleLabel.text = s.souls;
        if (toggleShopLabel) toggleShopLabel.text = s.vanillaShop;
        if (returnToRouletteLbl) returnToRouletteLbl.text = s.returnRoulette;
        if (emergencyResetLbl) emergencyResetLbl.text = s.resetBtn;
        if (langToggleText) langToggleText.text = (currentLang === "ru") ? "RU" : "EN";
        if (logToggleText) logToggleText.text = s.logsBtn;
        if (targetHeader) targetHeader.text = s.targetHeader;
        if (logModalTitle) logModalTitle.text = s.logTitle;
        if (copyLogsLbl) copyLogsLbl.text = s.copyLogs;
        if (clearLogsLbl) clearLogsLbl.text = s.clearLogs;
        if (closeLogsLbl) closeLogsLbl.text = s.closeLogs;
        if (creditsLabel) creditsLabel.text = s.credits;"""

new_toggle_lang_body = """        if (titleLabel) titleLabel.text = s.title;
        if (subtitleLabel) subtitleLabel.text = s.subtitle;
        if (soulsTitleLabel) soulsTitleLabel.text = s.souls;
        if (toggleShopLabel) toggleShopLabel.text = s.vanillaShop;
        if (returnToRouletteLbl) returnToRouletteLbl.text = s.returnRoulette;
        if (langToggleText) langToggleText.text = (currentLang === "ru") ? "RU" : "EN";
        if (targetHeader) targetHeader.text = s.targetHeader;
        if (tabRouletteLbl) tabRouletteLbl.text = s.tabRoulette;
        if (tabDraftLbl) tabDraftLbl.text = s.tabDraft;
        if (targetSkipLbl) targetSkipLbl.text = s.skipTarget;
        if (draftTitleLbl) draftTitleLbl.text = s.draftTitle;
        if (draftRerollLbl) draftRerollLbl.text = s.draftReroll;
        if (draftQuickbuyLbl) draftQuickbuyLbl.text = s.draftQuickbuy;
        if (creditsLabel) creditsLabel.text = s.credits;
        if (currentTab === "draft") RenderDraftGrid();"""

assert old_toggle_lang_body in code, "Could not find old ToggleLanguage body in baseline"
code = code.replace(old_toggle_lang_body, new_toggle_lang_body)

# -------------------------------------------------------------------------
# 10. UPDATE ReturnToRouletteBtn STYLING & POSITIONING
# -------------------------------------------------------------------------
old_return_btn_styles = """                ApplyStyles(returnToRouletteBtn, {
                    "vertical-align": "center",
                    "margin-left": "20px",
                    "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#f59e0b), to(#d97706))",
                    "border": "1px solid #fbbf24",
                    "border-radius": "6px",
                    "padding": "8px 16px",
                    "visibility": "collapse"
                });"""

new_return_btn_styles = """                ApplyStyles(returnToRouletteBtn, {
                    "horizontal-align": "right",
                    "vertical-align": "top",
                    "margin-top": "18px",
                    "margin-right": "32px",
                    "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#f59e0b), to(#d97706))",
                    "border": "1.5px solid #fbbf24",
                    "border-radius": "6px",
                    "padding": "8px 18px",
                    "box-shadow": "0px 2px 10px rgba(0, 0, 0, 0.5)",
                    "z-index": "1000",
                    "visibility": "collapse"
                });"""

assert old_return_btn_styles in code, "Could not find old return button styles in baseline"
code = code.replace(old_return_btn_styles, new_return_btn_styles)

# -------------------------------------------------------------------------
# 11. INSERT TAB BAR AFTER titleBox AND REMOVE OBSOLETE BUTTONS
# -------------------------------------------------------------------------
old_spacer_anchor = """        var spacer = $.CreatePanel("Panel", header, "HeaderSpacer");"""

new_tab_bar_and_spacer = """        var tabBar = $.CreatePanel("Panel", header, "ScamlockTabBar");
        ApplyStyles(tabBar, {
            "flow-children": "right",
            "margin-left": "24px",
            "vertical-align": "center",
            "background-color": "#111827",
            "border-radius": "6px",
            "padding": "3px"
        });

        tabRouletteBtn = $.CreatePanel("Button", tabBar, "TabRouletteBtn");
        ApplyStyles(tabRouletteBtn, {
            "background-color": "#2563eb",
            "border": "1px solid #60a5fa",
            "border-radius": "4px",
            "padding": "5px 14px"
        });
        tabRouletteLbl = $.CreatePanel("Label", tabRouletteBtn, "");
        tabRouletteLbl.text = STRINGS[currentLang].tabRoulette;
        ApplyStyles(tabRouletteLbl, {
            "color": "#ffffff",
            "font-size": "11px",
            "font-weight": "bold",
            "hittest": "false"
        });
        tabRouletteBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            SwitchTab("roulette");
        });

        tabDraftBtn = $.CreatePanel("Button", tabBar, "TabDraftBtn");
        ApplyStyles(tabDraftBtn, {
            "background-color": "#1f2937",
            "border": "1px solid #374151",
            "border-radius": "4px",
            "padding": "5px 14px",
            "margin-left": "4px"
        });
        tabDraftLbl = $.CreatePanel("Label", tabDraftBtn, "");
        tabDraftLbl.text = STRINGS[currentLang].tabDraft;
        ApplyStyles(tabDraftLbl, {
            "color": "#9ca3af",
            "font-size": "11px",
            "font-weight": "bold",
            "hittest": "false"
        });
        tabDraftBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            SwitchTab("draft");
        });

        var spacer = $.CreatePanel("Panel", header, "HeaderSpacer");"""

assert old_spacer_anchor in code, "Could not find old spacer anchor in baseline"
code = code.replace(old_spacer_anchor, new_tab_bar_and_spacer)

old_emergency_and_log = """        // Emergency Reset Button
        emergencyResetBtn = $.CreatePanel("Button", header, "EmergencyResetBtn");
        ApplyStyles(emergencyResetBtn, {
            "background-color": "#1f2937",
            "border": "1px solid #4b5563",
            "border-radius": "6px",
            "padding": "5px 10px",
            "vertical-align": "center",
            "margin-right": "6px"
        });
        emergencyResetLbl = $.CreatePanel("Label", emergencyResetBtn, "");
        emergencyResetLbl.text = STRINGS[currentLang].resetBtn;
        emergencyResetLbl.hittest = false;
        ApplyStyles(emergencyResetLbl, {
            "color": "#9ca3af",
            "font-size": "11px",
            "font-weight": "bold",
            "letter-spacing": "1px",
            "hittest": "false"
        });
        emergencyResetBtn.SetPanelEvent("onmouseover", function () {
            emergencyResetBtn.style.brightness = "1.25";
            emergencyResetBtn.style.borderColor = "#f87171";
            if (emergencyResetLbl) emergencyResetLbl.style.color = "#f87171";
        });
        emergencyResetBtn.SetPanelEvent("onmouseout", function () {
            emergencyResetBtn.style.brightness = "1.0";
            emergencyResetBtn.style.borderColor = "#4b5563";
            if (emergencyResetLbl) emergencyResetLbl.style.color = "#9ca3af";
        });
        emergencyResetBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            ResetSession("User clicked RESET button");
        });

        // Logs Viewer Toggle Button
        logToggleBtn = $.CreatePanel("Button", header, "LogToggleBtn");
        ApplyStyles(logToggleBtn, {
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#1e293b), to(#0f172a))",
            "border": "1px solid #38bdf8",
            "border-radius": "6px",
            "padding": "5px 10px",
            "vertical-align": "center",
            "margin-right": "6px"
        });
        logToggleText = $.CreatePanel("Label", logToggleBtn, "");
        logToggleText.text = STRINGS[currentLang].logsBtn;
        logToggleText.hittest = false;
        ApplyStyles(logToggleText, {
            "color": "#38bdf8",
            "font-size": "11px",
            "font-weight": "bold",
            "letter-spacing": "1px",
            "hittest": "false"
        });
        logToggleBtn.SetPanelEvent("onmouseover", function () {
            logToggleBtn.style.brightness = "1.25";
            logToggleBtn.style.borderColor = "#7dd3fc";
        });
        logToggleBtn.SetPanelEvent("onmouseout", function () {
            logToggleBtn.style.brightness = "1.0";
            logToggleBtn.style.borderColor = "#38bdf8";
        });
        logToggleBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            ToggleLogViewer();
        });"""

new_emergency_and_log = """        // Obsolete reset and log buttons removed for ultra-clean UI"""
assert old_emergency_and_log in code, "Could not find old emergency and log buttons in baseline"
code = code.replace(old_emergency_and_log, new_emergency_and_log)

# -------------------------------------------------------------------------
# 12. SPLIT MAIN CONTENT INTO rouletteViewPanel AND draftViewPanel
# -------------------------------------------------------------------------
old_carousel_setup = """        carouselContainer = $.CreatePanel("Panel", mainModalContent, "CarouselContainer");"""
new_carousel_setup = """        rouletteViewPanel = $.CreatePanel("Panel", mainModalContent, "RouletteViewPanel");
        ApplyStyles(rouletteViewPanel, {
            "flow-children": "down",
            "width": "100%",
            "visibility": "visible"
        });

        carouselContainer = $.CreatePanel("Panel", rouletteViewPanel, "CarouselContainer");"""

assert old_carousel_setup in code, "Could not find carouselContainer in baseline"
code = code.replace(old_carousel_setup, new_carousel_setup)

# Change parent of controlArea and targetCard to rouletteViewPanel
code = code.replace('var controlArea = $.CreatePanel("Panel", mainModalContent, "RouletteControls");',
                    'var controlArea = $.CreatePanel("Panel", rouletteViewPanel, "RouletteControls");')

code = code.replace('targetCard = $.CreatePanel("Panel", mainModalContent, "TargetCard");',
                    'targetCard = $.CreatePanel("Panel", rouletteViewPanel, "TargetCard");')

# -------------------------------------------------------------------------
# 13. REMOVE REROLL BUTTON FROM CONTROLS ROW (REDUNDANT WITH SKIP BUTTON)
# -------------------------------------------------------------------------
old_reroll_button = """        // Reroll Button (3 Charges per Match)
        rerollBtn = $.CreatePanel("Button", buttonsRow, "RouletteRerollBtn");
        ApplyStyles(rerollBtn, {
            "min-width": "165px",
            "height": "50px",
            "padding": "0px 18px",
            "margin-left": "12px",
            "background-color": "#1e293b",
            "border": "2px solid #334155",
            "border-radius": "8px",
            "overflow": "noclip",
            "opacity": "0.45"
        });

        rerollBtnText = $.CreatePanel("Label", rerollBtn, "RerollBtnText");
        rerollBtnText.text = STRINGS[currentLang].rerollBtn + "(" + remainingRerolls + "/" + MAX_REROLLS + ")";
        rerollBtnText.hittest = false;
        ApplyStyles(rerollBtnText, {
            "color": "#94a3b8",
            "font-size": "13px",
            "font-weight": "bold",
            "letter-spacing": "1px",
            "horizontal-align": "center",
            "vertical-align": "center",
            "hittest": "false"
        });

        rerollBtn.SetPanelEvent("onmouseover", function () {
            if (ShopPurchaseTracker.GetTargetItem() && remainingRerolls > 0 && !isSpinning) {
                rerollBtn.style.brightness = "1.25";
                rerollBtn.style.borderColor = "#a5b4fc";
                rerollBtn.style.boxShadow = "0px 4px 22px rgba(99, 102, 241, 0.65)";
            }
        });
        rerollBtn.SetPanelEvent("onmouseout", function () {
            if (ShopPurchaseTracker.GetTargetItem() && remainingRerolls > 0 && !isSpinning) {
                rerollBtn.style.brightness = "1.0";
                rerollBtn.style.borderColor = "#818cf8";
                rerollBtn.style.boxShadow = "0px 3px 16px rgba(99, 102, 241, 0.45)";
            }
        });
        rerollBtn.SetPanelEvent("onactivate", function () {
            if (isSpinning) return;
            var active = ShopPurchaseTracker.GetTargetItem();
            if (!active || remainingRerolls <= 0) {
                PlaySound("UI.LaneSwap.DenyRequest");
                return;
            }

            remainingRerolls--;
            PlaySound("UI.ItemDraft.Start");
            PlaySound("UI.MainMenu.Activate");
            RouletteLogger.Log("Reroll used! Remaining: " + remainingRerolls + "/" + MAX_REROLLS, "REROLL");

            // Cleanly remove previous item from quickbuy and tracker
            ShopPurchaseTracker.ClearTarget();
            UpdateUIState();

            // Immediately roll for a new item!
            StartSpin(true);
        });"""

new_reroll_button = """        // Reroll button removed in favor of direct [СКИП] button on active target card"""
assert old_reroll_button in code, "Could not find old reroll button in baseline"
code = code.replace(old_reroll_button, new_reroll_button)

# -------------------------------------------------------------------------
# 14. ADD SKIP BUTTON ON targetCard AND ADD draftViewPanel RIGHT AFTER targetCard
# -------------------------------------------------------------------------
old_target_card_end = """        targetProgressText = $.CreatePanel("Label", targetInfo, "TargetProgressText");
        targetProgressText.text = "0 / 0 Souls (0%)";
        ApplyStyles(targetProgressText, {
            "color": "#9ca3af",
            "font-size": "9.5px",
            "margin-top": "3px"
        });"""

new_target_card_end = """        targetProgressText = $.CreatePanel("Label", targetInfo, "TargetProgressText");
        targetProgressText.text = "0 / 0 Souls (0%)";
        ApplyStyles(targetProgressText, {
            "color": "#9ca3af",
            "font-size": "9.5px",
            "margin-top": "3px"
        });

        targetSkipBtn = $.CreatePanel("Button", targetCard, "TargetSkipBtn");
        ApplyStyles(targetSkipBtn, {
            "vertical-align": "center",
            "margin-left": "10px",
            "background-color": "rgba(239, 68, 68, 0.15)",
            "border": "1px solid rgba(239, 68, 68, 0.4)",
            "border-radius": "6px",
            "padding": "6px 14px"
        });
        targetSkipLbl = $.CreatePanel("Label", targetSkipBtn, "");
        targetSkipLbl.text = STRINGS[currentLang].skipTarget;
        ApplyStyles(targetSkipLbl, {
            "color": "#f87171",
            "font-size": "11px",
            "font-weight": "bold",
            "hittest": "false"
        });
        targetSkipBtn.SetPanelEvent("onmouseover", function () {
            targetSkipBtn.style.backgroundColor = "rgba(239, 68, 68, 0.35)";
        });
        targetSkipBtn.SetPanelEvent("onmouseout", function () {
            targetSkipBtn.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
        });
        targetSkipBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            var skipped = ShopPurchaseTracker.GetTargetItem();
            RouletteLogger.Log("Target skipped by player: " + (skipped ? skipped.name : "none"), "SKIP");
            ShopPurchaseTracker.ClearTarget();
            if (statusLabel) {
                statusLabel.text = STRINGS[currentLang].statusReady;
                statusLabel.style.color = "#10b981";
            }
            UpdateUIState();
        });

        // -----------------------------------------------------------------
        // DRAFT VIEW PANEL (16 Items)
        // -----------------------------------------------------------------
        draftViewPanel = $.CreatePanel("Panel", mainModalContent, "DraftViewPanel");
        ApplyStyles(draftViewPanel, {
            "flow-children": "down",
            "width": "100%",
            "padding": "8px 12px",
            "visibility": "collapse"
        });

        var draftActionsRow = $.CreatePanel("Panel", draftViewPanel, "DraftActionsRow");
        ApplyStyles(draftActionsRow, {
            "flow-children": "right",
            "width": "100%",
            "margin-bottom": "6px",
            "vertical-align": "center"
        });

        draftTitleLbl = $.CreatePanel("Label", draftActionsRow, "DraftTitleLabel");
        draftTitleLbl.text = STRINGS[currentLang].draftTitle;
        ApplyStyles(draftTitleLbl, {
            "color": "#f3f4f6",
            "font-size": "12px",
            "font-weight": "bold",
            "vertical-align": "center"
        });

        draftStatusLabel = $.CreatePanel("Label", draftActionsRow, "DraftStatusLabel");
        draftStatusLabel.text = "";
        ApplyStyles(draftStatusLabel, {
            "color": "#10b981",
            "font-size": "11px",
            "margin-left": "12px",
            "vertical-align": "center"
        });

        var draftSpacer = $.CreatePanel("Panel", draftActionsRow, "");
        ApplyStyles(draftSpacer, { "width": "fill-parent-flow(1.0)" });

        draftRerollBtn = $.CreatePanel("Button", draftActionsRow, "DraftRerollBtn");
        ApplyStyles(draftRerollBtn, {
            "background-color": "#374151",
            "border": "1px solid #4b5563",
            "border-radius": "4px",
            "padding": "5px 12px",
            "margin-right": "8px"
        });
        draftRerollLbl = $.CreatePanel("Label", draftRerollBtn, "");
        draftRerollLbl.text = STRINGS[currentLang].draftReroll;
        ApplyStyles(draftRerollLbl, {
            "color": "#e5e7eb",
            "font-size": "10px",
            "font-weight": "bold",
            "hittest": "false"
        });
        draftRerollBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.ItemDraft.Start");
            ScamlockDraft.GenerateBalancedDraft();
            RenderDraftGrid();
            if (draftStatusLabel) {
                draftStatusLabel.text = STRINGS[currentLang].draftReroll + " OK";
                draftStatusLabel.style.color = "#10b981";
            }
        });

        draftQuickbuyBtn = $.CreatePanel("Button", draftActionsRow, "DraftQuickbuyBtn");
        ApplyStyles(draftQuickbuyBtn, {
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#2563eb), to(#1d4ed8))",
            "border": "1px solid #60a5fa",
            "border-radius": "4px",
            "padding": "5px 14px"
        });
        draftQuickbuyLbl = $.CreatePanel("Label", draftQuickbuyBtn, "");
        draftQuickbuyLbl.text = STRINGS[currentLang].draftQuickbuy;
        ApplyStyles(draftQuickbuyLbl, {
            "color": "#ffffff",
            "font-size": "10px",
            "font-weight": "bold",
            "hittest": "false"
        });
        draftQuickbuyBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            var count = ScamlockDraft.QueueAllDraftToQuickbuy();
            if (draftStatusLabel) {
                draftStatusLabel.text = STRINGS[currentLang].draftQueued;
                draftStatusLabel.style.color = "#10b981";
            }
        });

        draftGridContainer = $.CreatePanel("Panel", draftViewPanel, "DraftGridContainer");
        ApplyStyles(draftGridContainer, {
            "flow-children": "down",
            "width": "100%"
        });"""

assert old_target_card_end in code, "Could not find targetProgressText in baseline"
code = code.replace(old_target_card_end, new_target_card_end)

# -------------------------------------------------------------------------
# 15. REMOVE OBSOLETE LOG VIEWER MODAL CREATION
# -------------------------------------------------------------------------
old_log_viewer_modal = """        logViewerModal = $.CreatePanel("Panel", overlayPanel, "LogViewerModal");
        ApplyStyles(logViewerModal, {
            "width": "640px",
            "height": "420px",
            "align": "center center",
            "background-color": "#0a0e17",
            "border": "1px solid #3b82f6",
            "border-radius": "10px",
            "padding": "16px",
            "flow-children": "down",
            "z-index": "9999",
            "visibility": "collapse"
        });

        var logHeader = $.CreatePanel("Panel", logViewerModal, "");
        ApplyStyles(logHeader, { "width": "100%", "flow-children": "right", "margin-bottom": "12px" });

        logModalTitle = $.CreatePanel("Label", logHeader, "");
        logModalTitle.text = STRINGS[currentLang].logTitle;
        ApplyStyles(logModalTitle, { "color": "#f3f4f6", "font-size": "15px", "font-weight": "bold", "vertical-align": "center" });

        var logSpacer = $.CreatePanel("Panel", logHeader, "");
        ApplyStyles(logSpacer, { "width": "fill-parent-flow(1.0)" });

        closeLogsBtn = $.CreatePanel("Button", logHeader, "");
        ApplyStyles(closeLogsBtn, {
            "background-color": "#1f2937",
            "border": "1px solid #374151",
            "border-radius": "6px",
            "padding": "4px 10px",
            "vertical-align": "center"
        });
        closeLogsLbl = $.CreatePanel("Label", closeLogsBtn, "");
        closeLogsLbl.text = STRINGS[currentLang].closeLogs;
        closeLogsLbl.hittest = false;
        ApplyStyles(closeLogsLbl, { "color": "#9ca3af", "font-size": "11px", "font-weight": "bold" });
        closeLogsBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            logViewerModal.style.visibility = "collapse";
        });

        var logScroll = $.CreatePanel("Panel", logViewerModal, "LogScrollArea");
        ApplyStyles(logScroll, {
            "width": "100%",
            "height": "300px",
            "background-color": "#030712",
            "border": "1px solid #1f2937",
            "border-radius": "6px",
            "padding": "10px",
            "overflow": "squish scroll"
        });

        logViewerText = $.CreatePanel("Label", logScroll, "LogViewerContent");
        logViewerText.text = "";
        ApplyStyles(logViewerText, {
            "color": "#4ade80",
            "font-size": "11px",
            "font-family": "monospace",
            "width": "100%"
        });

        var logFooter = $.CreatePanel("Panel", logViewerModal, "");
        ApplyStyles(logFooter, { "width": "100%", "flow-children": "right", "margin-top": "12px" });

        copyLogsBtn = $.CreatePanel("Button", logFooter, "");
        ApplyStyles(copyLogsBtn, {
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#10b981), to(#059669))",
            "border": "1px solid #34d399",
            "border-radius": "6px",
            "padding": "6px 14px",
            "margin-right": "8px"
        });
        copyLogsLbl = $.CreatePanel("Label", copyLogsBtn, "");
        copyLogsLbl.text = STRINGS[currentLang].copyLogs;
        copyLogsLbl.hittest = false;
        ApplyStyles(copyLogsLbl, { "color": "#ffffff", "font-size": "12px", "font-weight": "bold" });
        copyLogsBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            try {
                var fullLog = RouletteLogger.GetLogsText();
                if (typeof Game !== "undefined" && Game.SetClipboardText) {
                    Game.SetClipboardText(fullLog);
                }
                copyLogsLbl.text = STRINGS[currentLang].logsCopied;
                $.Schedule(2.0, function () {
                    if (copyLogsLbl) copyLogsLbl.text = STRINGS[currentLang].copyLogs;
                });
            } catch (e) {}
        });

        clearLogsBtn = $.CreatePanel("Button", logFooter, "");
        ApplyStyles(clearLogsBtn, {
            "background-color": "#374151",
            "border": "1px solid #4b5563",
            "border-radius": "6px",
            "padding": "6px 14px"
        });
        clearLogsLbl = $.CreatePanel("Label", clearLogsBtn, "");
        clearLogsLbl.text = STRINGS[currentLang].clearLogs;
        clearLogsLbl.hittest = false;
        ApplyStyles(clearLogsLbl, { "color": "#e5e7eb", "font-size": "12px", "font-weight": "bold" });
        clearLogsBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            RouletteLogger.Clear();
            if (logViewerText) logViewerText.text = "";
        });

        RouletteLogger.OnLog(function (line) {
            if (logViewerModal && logViewerModal.style.visibility === "visible" && logViewerText) {
                logViewerText.text = RouletteLogger.GetLogsText();
            }
        });"""

new_log_viewer_modal = """        // Obsolete log viewer modal removed for ultra-clean UI"""
assert old_log_viewer_modal in code, "Could not find old log viewer modal in baseline"
code = code.replace(old_log_viewer_modal, new_log_viewer_modal)

# -------------------------------------------------------------------------
# 16. REMOVE ToggleLogViewer FUNCTION
# -------------------------------------------------------------------------
old_toggle_log_func = """    function ToggleLogViewer() {
        if (!logViewerModal) return;
        var isVisible = (logViewerModal.style.visibility === "visible");
        if (isVisible) {
            logViewerModal.style.visibility = "collapse";
        } else {
            if (logViewerText) logViewerText.text = RouletteLogger.GetLogsText();
            logViewerModal.style.visibility = "visible";
        }
    }"""
new_toggle_log_func = """    // ToggleLogViewer removed"""
assert old_toggle_log_func in code, "Could not find ToggleLogViewer in baseline"
code = code.replace(old_toggle_log_func, new_toggle_log_func)

# -------------------------------------------------------------------------
# 17. UPDATE ItemRoulette EXPORTS
# -------------------------------------------------------------------------
old_roulette_exports = """    return {
        Init: Init,
        StartSpin: StartSpin,
        ResetState: ResetState,
        ResetSession: ResetSession,
        ToggleLanguage: ToggleLanguage
    };"""

new_roulette_exports = """    return {
        Init: Init,
        StartSpin: StartSpin,
        ResetState: ResetState,
        ResetSession: ResetSession,
        ToggleLanguage: ToggleLanguage,
        SwitchTab: SwitchTab,
        GetModalContent: function () { return mainModalContent; }
    };"""

assert old_roulette_exports in code, "Could not find ItemRoulette exports in baseline"
code = code.replace(old_roulette_exports, new_roulette_exports)

# -------------------------------------------------------------------------
# 18. ATTACH ScamlockUMM AFTER ItemRoulette
# -------------------------------------------------------------------------
umm_module = """
// =========================================================================
// 4. CRASH-PROOF UNIVERSAL MOD MANAGER (UMM) INTEGRATION
// =========================================================================
var ScamlockUMM = (function () {
    var UMM_CHANNEL = "ClientUI_FireOutput";
    var UMM_PROTOCOL = 1;
    var currentAspectRatio = "16:9";
    var autoQuickbuyEnabled = true;

    function SendToUMM(payload) {
        try {
            if (typeof $.DispatchEvent === "function") {
                var msg = JSON.stringify(payload);
                $.DispatchEvent(UMM_CHANNEL, msg);
            }
        } catch (e) {}
    }

    function RegisterMod() {
        try {
            var regPayload = {
                umm: UMM_PROTOCOL,
                t: "register",
                id: "scamlock",
                name: "Scamlock (Скамлок)",
                version: "1.0.0",
                author: "d3dvk",
                desc: "Случайный закуп и драфты в Deadlock. Режим Soft Mode с защитой от софтлоков.",
                settings: [
                    {
                        id: "aspect_ratio",
                        name: "Соотношение сторон",
                        type: "enum",
                        values: ["16:9", "16:10", "4:3"],
                        default: "16:9"
                    },
                    {
                        id: "auto_quickbuy",
                        name: "Авто-добавление в Quickbuy",
                        type: "bool",
                        default: true
                    }
                ]
            };
            SendToUMM(regPayload);
        } catch (e) {}
    }

    function ApplyAspectRatio(ratio) {
        try {
            currentAspectRatio = ratio || "16:9";
            var modal = ItemRoulette.GetModalContent();
            if (!modal || !modal.IsValid()) return;

            if (currentAspectRatio === "16:10") {
                modal.style.width = "780px";
                modal.style.uiScale = "95%";
            } else if (currentAspectRatio === "4:3") {
                modal.style.width = "720px";
                modal.style.uiScale = "88%";
            } else {
                modal.style.width = "820px";
                modal.style.uiScale = "100%";
            }
        } catch (e) {}
    }

    function HandleUMMMessage(raw) {
        try {
            if (!raw) return;
            var data = (typeof raw === "string") ? JSON.parse(raw) : raw;
            if (!data || data.umm !== UMM_PROTOCOL) return;

            if (data.t === "hello") {
                RegisterMod();
            } else if (data.t === "set" && data.id === "scamlock") {
                if (data.key === "aspect_ratio") {
                    ApplyAspectRatio(data.val);
                } else if (data.key === "auto_quickbuy") {
                    autoQuickbuyEnabled = !!data.val;
                }
            }
        } catch (e) {}
    }

    function Init() {
        try {
            if (typeof $.RegisterForUnhandledEvent === "function") {
                $.RegisterForUnhandledEvent(UMM_CHANNEL, function (msg) {
                    HandleUMMMessage(msg);
                });
            }
        } catch (e) {}

        try {
            $.Schedule(1.5, RegisterMod);
        } catch (e) {}
    }

    return {
        Init: Init,
        IsAutoQuickbuyEnabled: function () { return autoQuickbuyEnabled; },
        GetAspectRatio: function () { return currentAspectRatio; },
        ApplyAspectRatio: ApplyAspectRatio
    };
})();
"""

entrypoint_marker = "// Entry point with fallback polling"
assert entrypoint_marker in code, "Could not find entry point in baseline"
code = code.replace(entrypoint_marker, umm_module + "\n" + entrypoint_marker)

# Also call ScamlockUMM.Init() in ItemRoulette.Init()
old_init_tail = """        BuildInitialReel();
        UpdateUIState();

        MonitorLoop();"""

new_init_tail = """        BuildInitialReel();
        UpdateUIState();

        try {
            ScamlockUMM.Init();
        } catch (e) {}

        MonitorLoop();"""

assert old_init_tail in code, "Could not find init tail in baseline"
code = code.replace(old_init_tail, new_init_tail)

# Also update InitializeRoulette name to InitializeScamlock
code = code.replace("function InitializeRoulette()", "function InitializeScamlock()")
code = code.replace("InitializeRoulette);", "InitializeScamlock);")

# -------------------------------------------------------------------------
# WRITE TO TARGET JS FILE
# -------------------------------------------------------------------------
with open(TARGET_JS, "w", encoding="utf-8") as f:
    f.write(code)

print(f"[SUCCESS] Generated Scamlock Engine JS: {TARGET_JS} ({len(code)} bytes, {len(code.splitlines())} lines)")

# Validate with Node.js
res = subprocess.run(["node", "-c", str(TARGET_JS)], capture_output=True, text=True)
if res.returncode != 0:
    print(f"[ERROR] Node syntax check failed: {res.stderr}")
    sys.exit(1)
print("[SUCCESS] Node syntax check PASSED cleanly!")
