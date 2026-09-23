import os
import sys
from pathlib import Path

BASE_DIR = Path("E:/Deadlock_mod")

# Read items DB
with open(BASE_DIR / "game/citadel/panorama/scripts/deadlock_items_db.js", "r", encoding="utf-8") as f:
    db_js = f.read()

# Update DB exports and methods if needed
db_fix = """
    function GetCandidateItems(ownedItemIds, totalSouls) {
        var ownedSet = {};
        if (ownedItemIds && ownedItemIds.length) {
            for (var i = 0; i < ownedItemIds.length; i++) {
                ownedSet[ownedItemIds[i].toLowerCase()] = true;
            }
        }
        var pool = [];
        for (var j = 0; j < ITEMS.length; j++) {
            var item = ITEMS[j];
            if (!ownedSet[item.id.toLowerCase()] && !ownedSet[item.name.toLowerCase()]) {
                pool.push(item);
            }
        }
        return pool.length > 0 ? pool : ITEMS;
    }

    return {
        ITEMS: ITEMS,
        TIER_COSTS: TIER_COSTS,
        TIER_COLORS: TIER_COLORS,
        TIER_NAMES: TIER_NAMES,
        GetTierWeights: GetTierWeights,
        PickRandomWinningItem: PickRandomWinningItem,
        PickRandomWeightedItem: function (owned, totalSouls) {
            return PickRandomWinningItem(totalSouls, owned);
        },
        GetCandidateItems: GetCandidateItems
    };
})();
"""

# Replace the end of deadlock_items_db
db_js_clean = db_js[:db_js.rfind("return {")] + db_fix

# Read purchase tracker
with open(BASE_DIR / "game/citadel/panorama/scripts/shop_purchase_tracker.js", "r", encoding="utf-8") as f:
    tracker_js = f.read()

tracker_fix = """
    return {
        StartTracker: StartTracker,
        GetPlayerGold: GetPlayerGold,
        GetPlayerTotalSouls: GetPlayerTotalSouls,
        GetOwnedItemIds: GetOwnedItemIds,
        GetOwnedItemNames: GetOwnedItemIds,
        SetTargetItem: SetTargetItem,
        GetTargetItem: GetTargetItem,
        QueueItemForAutoBuy: QueueItemForAutoBuy,
        OnPurchase: OnPurchase
    };
})();
"""
tracker_js_clean = tracker_js[:tracker_js.rfind("return {")] + tracker_fix

# Roulette Engine with safe sounds and dynamic UI
roulette_engine = """
// =========================================================================
// DEADLOCK ITEM ROULETTE ENGINE & DYNAMIC UI (STANDALONE)
// =========================================================================

var ItemRoulette = (function () {
    var CARD_WIDTH = 140; // card width (130px) + margin (10px)
    var TOTAL_CARDS = 60;
    var WINNING_INDEX = 48;
    var SPIN_DURATION = 5.2; // seconds

    var isSpinning = false;
    var isVanillaShopMode = false;
    var overlayPanel = null;
    var reelPanel = null;
    var spinButton = null;
    var spinBtnText = null;
    var statusLabel = null;
    var phaseBadge = null;
    var soulsLabel = null;
    var targetCard = null;
    var targetIcon = null;
    var targetName = null;
    var targetCost = null;
    var targetProgressFill = null;
    var targetProgressText = null;
    var returnToRouletteBtn = null;
    var initialized = false;

    function Log(msg) {
        try {
            $.Msg("[DEADLOCK ROULETTE] " + msg);
        } catch (e) {}
    }

    function PlaySound(soundName) {
        try {
            $.DispatchEvent("PlaySoundEffect", soundName);
        } catch (e) {}
    }

    function ApplyStyles(panel, styles) {
        if (!panel || !styles) return;
        for (var prop in styles) {
            if (styles.hasOwnProperty(prop)) {
                try {
                    panel.style[prop] = styles[prop];
                } catch (e) {}
            }
        }
    }

    function Init() {
        var context = $.GetContextPanel();
        Log("Init check. Context: " + (context ? context.id : "null"));
        if (!context) {
            $.Schedule(0.2, Init);
            return;
        }

        var shop = context.FindChildTraverse("Shop");
        if (!shop) {
            $.Schedule(0.2, Init);
            return;
        }

        if (initialized) return;
        initialized = true;

        Log("Building Roulette DOM elements...");
        BuildRouletteDOM(context, shop);

        ShopPurchaseTracker.StartTracker();
        ShopPurchaseTracker.OnPurchase(OnTargetItemPurchased);

        BuildInitialReel();
        UpdateUIState();
        MonitorLoop();

        Log("SUCCESS: Standalone Item Roulette initialized and ready!");
    }

    function BuildRouletteDOM(context, shop) {
        // 0. Floating Return Button inside Vanilla Shop
        returnToRouletteBtn = context.FindChildTraverse("RouletteReturnFloatingBtn");
        if (!returnToRouletteBtn) {
            returnToRouletteBtn = $.CreatePanel("Button", shop, "RouletteReturnFloatingBtn");
            ApplyStyles(returnToRouletteBtn, {
                "horizontal-align": "right",
                "vertical-align": "top",
                "margin-top": "15px",
                "margin-right": "80px",
                "background-color": "#2c1c08ee",
                "border": "2px solid #f7b267",
                "border-radius": "6px",
                "padding": "8px 18px",
                "box-shadow": "0px 0px 15px rgba(247, 178, 103, 0.4)",
                "z-index": "999"
            });
            var retLbl = $.CreatePanel("Label", returnToRouletteBtn, "");
            retLbl.text = "🎲 ВЕРНУТЬСЯ К РУЛЕТКЕ";
            ApplyStyles(retLbl, {
                "color": "#f7b267",
                "font-size": "15px",
                "font-weight": "bold",
                "letter-spacing": "1px"
            });
            returnToRouletteBtn.SetPanelEvent("onactivate", function () {
                Log("Return to Roulette clicked");
                SetShopMode(false);
            });
        }

        // 1. Overlay Root Panel
        overlayPanel = context.FindChildTraverse("ItemRouletteOverlay");
        if (!overlayPanel) {
            overlayPanel = $.CreatePanel("Panel", context, "ItemRouletteOverlay");
        }
        ApplyStyles(overlayPanel, {
            "width": "100%",
            "height": "100%",
            "background-color": "#090c10fc",
            "flow-children": "down",
            "padding": "25px 50px",
            "z-index": "100"
        });

        // 2. Header Bar
        var header = $.CreatePanel("Panel", overlayPanel, "RouletteHeader");
        ApplyStyles(header, {
            "width": "100%",
            "height": "65px",
            "flow-children": "right",
            "vertical-align": "center",
            "border-bottom": "2px solid #21262d",
            "padding-bottom": "10px"
        });

        var titleBox = $.CreatePanel("Panel", header, "TitleBox");
        ApplyStyles(titleBox, { "flow-children": "down", "width": "420px" });

        var titleLabel = $.CreatePanel("Label", titleBox, "RouletteTitle");
        titleLabel.text = "DEADLOCK ITEM ROULETTE";
        ApplyStyles(titleLabel, {
            "color": "#e2b96f",
            "font-size": "24px",
            "font-weight": "bold",
            "letter-spacing": "2px",
            "text-shadow": "0px 0px 10px rgba(226, 185, 111, 0.5)"
        });

        var subTitle = $.CreatePanel("Label", titleBox, "RouletteSubTitle");
        subTitle.text = "Случайный предмет • Авто-покупка • Совместимо с модами";
        ApplyStyles(subTitle, {
            "color": "#8b949e",
            "font-size": "12px",
            "margin-top": "2px"
        });

        // Phase Badge
        phaseBadge = $.CreatePanel("Label", header, "RoulettePhaseBadge");
        phaseBadge.text = "РАННЯЯ ИГРА (T1)";
        ApplyStyles(phaseBadge, {
            "background-color": "rgba(82, 183, 136, 0.15)",
            "border": "1px solid #52b788",
            "border-radius": "16px",
            "padding": "4px 14px",
            "color": "#52b788",
            "font-size": "13px",
            "font-weight": "bold",
            "vertical-align": "center",
            "margin-left": "25px"
        });

        // Souls Display
        var soulsBox = $.CreatePanel("Panel", header, "RouletteSoulsBox");
        ApplyStyles(soulsBox, {
            "flow-children": "right",
            "vertical-align": "center",
            "margin-left": "30px",
            "background-color": "rgba(226, 185, 111, 0.1)",
            "border": "1px solid rgba(226, 185, 111, 0.3)",
            "border-radius": "6px",
            "padding": "5px 12px"
        });
        var soulsTitle = $.CreatePanel("Label", soulsBox, "");
        soulsTitle.text = "Души: ";
        ApplyStyles(soulsTitle, { "color": "#8b949e", "font-size": "14px" });
        soulsLabel = $.CreatePanel("Label", soulsBox, "PlayerSoulsValue");
        soulsLabel.text = "0";
        ApplyStyles(soulsLabel, { "color": "#f7b267", "font-size": "16px", "font-weight": "bold" });

        var spacer = $.CreatePanel("Panel", header, "HeaderSpacer");
        ApplyStyles(spacer, { "width": "fill-parent-flow(1.0)" });

        // Toggle Vanilla Shop Button
        var toggleShopBtn = $.CreatePanel("Button", header, "ToggleVanillaShopBtn");
        ApplyStyles(toggleShopBtn, {
            "background-color": "#1f242c",
            "border": "1px solid #484f58",
            "border-radius": "6px",
            "padding": "8px 18px",
            "vertical-align": "center"
        });
        var toggleLbl = $.CreatePanel("Label", toggleShopBtn, "ToggleVanillaShopLabel");
        toggleLbl.text = "ОБЫЧНЫЙ МАГАЗИН ➔";
        ApplyStyles(toggleLbl, {
            "color": "#c9d1d9",
            "font-size": "14px",
            "font-weight": "bold"
        });
        toggleShopBtn.SetPanelEvent("onactivate", function () {
            Log("Toggle Vanilla Shop clicked");
            SetShopMode(true);
        });

        // 3. Carousel Viewport Reel Box
        var carouselContainer = $.CreatePanel("Panel", overlayPanel, "CarouselContainer");
        ApplyStyles(carouselContainer, {
            "width": "1120px",
            "height": "220px",
            "horizontal-align": "center",
            "margin-top": "35px",
            "position": "relative",
            "background-color": "#0d1117",
            "border": "2px solid #30363d",
            "border-radius": "10px",
            "overflow": "clip",
            "box-shadow": "inset 0px 0px 40px rgba(0, 0, 0, 0.8)"
        });

        // Laser Needles
        var pointerTop = $.CreatePanel("Panel", carouselContainer, "PointerTop");
        ApplyStyles(pointerTop, {
            "width": "4px",
            "height": "28px",
            "background-color": "#f7b267",
            "horizontal-align": "center",
            "vertical-align": "top",
            "z-index": "50",
            "box-shadow": "0px 0px 12px #f7b267"
        });
        var pointerBottom = $.CreatePanel("Panel", carouselContainer, "PointerBottom");
        ApplyStyles(pointerBottom, {
            "width": "4px",
            "height": "28px",
            "background-color": "#f7b267",
            "horizontal-align": "center",
            "vertical-align": "bottom",
            "z-index": "50",
            "box-shadow": "0px 0px 12px #f7b267"
        });
        var laserLine = $.CreatePanel("Panel", carouselContainer, "CenterLaserLine");
        ApplyStyles(laserLine, {
            "width": "2px",
            "height": "100%",
            "background-color": "rgba(247, 178, 103, 0.35)",
            "horizontal-align": "center",
            "z-index": "40"
        });

        // The Strip Reel Panel
        reelPanel = $.CreatePanel("Panel", carouselContainer, "RouletteReel");
        ApplyStyles(reelPanel, {
            "flow-children": "right",
            "height": "100%",
            "vertical-align": "center",
            "transform": "translateX(0px)"
        });

        // 4. Spin Button & Controls
        var controlArea = $.CreatePanel("Panel", overlayPanel, "ControlArea");
        ApplyStyles(controlArea, {
            "width": "100%",
            "flow-children": "down",
            "horizontal-align": "center",
            "margin-top": "20px"
        });

        spinButton = $.CreatePanel("Button", controlArea, "SpinButton");
        ApplyStyles(spinButton, {
            "width": "340px",
            "height": "60px",
            "horizontal-align": "center",
            "background-color": "#e2b96f",
            "border-radius": "8px",
            "box-shadow": "0px 4px 20px rgba(226, 185, 111, 0.4)"
        });
        spinBtnText = $.CreatePanel("Label", spinButton, "SpinButtonText");
        spinBtnText.text = "КРУТИТЬ РУЛЕТКУ";
        ApplyStyles(spinBtnText, {
            "color": "#0b0e14",
            "font-size": "20px",
            "font-weight": "bold",
            "letter-spacing": "2px",
            "horizontal-align": "center",
            "vertical-align": "center"
        });
        spinButton.SetPanelEvent("onactivate", function () {
            StartSpin();
        });

        statusLabel = $.CreatePanel("Label", controlArea, "RouletteStatusLabel");
        statusLabel.text = "Нажмите 'Крутить' чтобы получить случайный предмет";
        ApplyStyles(statusLabel, {
            "color": "#8b949e",
            "font-size": "15px",
            "horizontal-align": "center",
            "margin-top": "10px"
        });

        // 5. Current Target Card
        targetCard = $.CreatePanel("Panel", overlayPanel, "TargetItemContainer");
        ApplyStyles(targetCard, {
            "width": "680px",
            "horizontal-align": "center",
            "margin-top": "25px",
            "background-color": "#161b22",
            "border": "1px solid #30363d",
            "border-radius": "8px",
            "padding": "15px 20px",
            "flow-children": "right"
        });

        targetIcon = $.CreatePanel("Panel", targetCard, "TargetItemIcon");
        ApplyStyles(targetIcon, {
            "width": "64px",
            "height": "64px",
            "border-radius": "6px",
            "border": "2px solid #52b788",
            "background-size": "contain",
            "background-repeat": "no-repeat",
            "background-position": "center center",
            "margin-right": "18px"
        });

        var targetInfo = $.CreatePanel("Panel", targetCard, "TargetInfo");
        ApplyStyles(targetInfo, {
            "flow-children": "down",
            "width": "fill-parent-flow(1.0)",
            "vertical-align": "center"
        });

        var targetHeaderLbl = $.CreatePanel("Label", targetInfo, "");
        targetHeaderLbl.text = "ТЕКУЩАЯ ЦЕЛЬ ДЛЯ ПОКУПКИ (QUICKBUY)";
        ApplyStyles(targetHeaderLbl, {
            "color": "#8b949e",
            "font-size": "11px",
            "font-weight": "bold",
            "letter-spacing": "1px"
        });

        targetName = $.CreatePanel("Label", targetInfo, "TargetItemName");
        targetName.text = "Предмет не выбран — крутите рулетку!";
        ApplyStyles(targetName, {
            "color": "#f0f6fc",
            "font-size": "18px",
            "font-weight": "bold",
            "margin-top": "2px"
        });

        var progressTrack = $.CreatePanel("Panel", targetInfo, "ProgressBarTrack");
        ApplyStyles(progressTrack, {
            "width": "100%",
            "height": "12px",
            "background-color": "#21262d",
            "border-radius": "6px",
            "margin-top": "8px",
            "overflow": "clip"
        });
        targetProgressFill = $.CreatePanel("Panel", progressTrack, "ProgressBarFill");
        ApplyStyles(targetProgressFill, {
            "width": "0%",
            "height": "100%",
            "background-color": "#52b788",
            "border-radius": "6px"
        });

        targetProgressText = $.CreatePanel("Label", targetInfo, "TargetProgressText");
        targetProgressText.text = "0 / 0 Душ (0%)";
        ApplyStyles(targetProgressText, {
            "color": "#8b949e",
            "font-size": "12px",
            "margin-top": "4px"
        });
    }

    function SetShopMode(vanilla) {
        isVanillaShopMode = vanilla;
        var context = $.GetContextPanel();
        if (!context) return;
        var shop = context.FindChildTraverse("Shop");

        if (isVanillaShopMode) {
            if (overlayPanel) overlayPanel.style.visibility = "collapse";
            if (shop) shop.style.visibility = "visible";
            if (returnToRouletteBtn) returnToRouletteBtn.style.visibility = "visible";
            Log("Switched to Vanilla Deadlock Shop view");
        } else {
            if (overlayPanel) overlayPanel.style.visibility = "visible";
            if (shop) shop.style.visibility = "collapse";
            if (returnToRouletteBtn) returnToRouletteBtn.style.visibility = "collapse";
            Log("Switched to Item Roulette view");
        }
    }

    function BuildInitialReel() {
        if (!reelPanel) return;
        reelPanel.RemoveAndDeleteChildren();
        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var pool = DeadlockItemsDB.GetCandidateItems([], totalSouls);
        if (!pool || pool.length === 0) pool = DeadlockItemsDB.ITEMS;

        for (var i = 0; i < TOTAL_CARDS; i++) {
            var item = pool[Math.floor(Math.random() * pool.length)];
            CreateCardPanel(i, item);
        }
        CenterReelOnCard(0, false);
    }

    function CreateCardPanel(index, item) {
        var card = $.CreatePanel("Panel", reelPanel, "Card_" + index);
        var tierBorder = GetTierColor(item.tier);
        ApplyStyles(card, {
            "width": "130px",
            "height": "200px",
            "margin": "0px 5px",
            "background-color": "#161b22",
            "border": "2px solid " + tierBorder,
            "border-radius": "8px",
            "flow-children": "down",
            "vertical-align": "center",
            "box-shadow": "0px 4px 10px rgba(0, 0, 0, 0.5)"
        });

        var tierTag = $.CreatePanel("Label", card, "");
        tierTag.text = "T" + item.tier;
        ApplyStyles(tierTag, {
            "color": tierBorder,
            "font-size": "10px",
            "font-weight": "bold",
            "horizontal-align": "right",
            "margin-top": "6px",
            "margin-right": "8px"
        });

        var icon = $.CreatePanel("Panel", card, "");
        ApplyStyles(icon, {
            "width": "75px",
            "height": "75px",
            "horizontal-align": "center",
            "margin-top": "4px",
            "background-image": 'url("' + item.image + '")',
            "background-size": "contain",
            "background-repeat": "no-repeat",
            "background-position": "center center"
        });

        var nameLbl = $.CreatePanel("Label", card, "");
        nameLbl.text = item.ruName || item.name;
        ApplyStyles(nameLbl, {
            "color": "#f0f6fc",
            "font-size": "12px",
            "font-weight": "bold",
            "text-align": "center",
            "horizontal-align": "center",
            "margin-top": "8px",
            "height": "32px"
        });

        var costLbl = $.CreatePanel("Label", card, "");
        costLbl.text = item.cost + " душ";
        ApplyStyles(costLbl, {
            "color": "#f7b267",
            "font-size": "11px",
            "horizontal-align": "center",
            "margin-top": "2px"
        });

        return card;
    }

    function GetTierColor(tier) {
        switch (tier) {
            case 1: return "#52b788";
            case 2: return "#4ea8de";
            case 3: return "#b5179e";
            case 4: return "#f7b267";
            default: return "#8b949e";
        }
    }

    function CenterReelOnCard(cardIndex, animate) {
        if (!reelPanel) return;
        var viewportWidth = 1120;
        var centerOffset = (viewportWidth / 2) - (CARD_WIDTH / 2);
        var targetX = -(cardIndex * CARD_WIDTH) + centerOffset;

        if (animate) {
            reelPanel.style.transition = "transform " + SPIN_DURATION + "s cubic-bezier(0.12, 0.98, 0.24, 1.0)";
        } else {
            reelPanel.style.transition = "none";
        }
        reelPanel.style.transform = "translateX(" + Math.round(targetX) + "px)";
    }

    function StartSpin() {
        if (isSpinning) {
            Log("Spin already in progress");
            return;
        }

        var activeTarget = ShopPurchaseTracker.GetTargetItem();
        if (activeTarget) {
            Log("Cannot spin: Active target not purchased yet (" + activeTarget.name + ")");
            if (statusLabel) {
                statusLabel.text = "Сначала накопите души и купите: " + (activeTarget.ruName || activeTarget.name) + "!";
                statusLabel.style.color = "#e63946";
            }
            return;
        }

        isSpinning = true;
        Log("==========================================");
        Log("STARTING ROULETTE SPIN");

        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var owned = ShopPurchaseTracker.GetOwnedItemNames();
        var winningItem = DeadlockItemsDB.PickRandomWeightedItem(owned, totalSouls);
        Log("Winning Item: " + winningItem.name + " (T" + winningItem.tier + ", " + winningItem.cost + ")");

        reelPanel.RemoveAndDeleteChildren();
        var pool = DeadlockItemsDB.GetCandidateItems(owned, totalSouls);
        if (!pool || pool.length === 0) pool = DeadlockItemsDB.ITEMS;

        for (var i = 0; i < TOTAL_CARDS; i++) {
            var item = (i === WINNING_INDEX) ? winningItem : pool[Math.floor(Math.random() * pool.length)];
            CreateCardPanel(i, item);
        }

        CenterReelOnCard(0, false);

        if (spinButton) {
            ApplyStyles(spinButton, { "background-color": "#30363d" });
            if (spinBtnText) spinBtnText.text = "РУЛЕТКА КРУТИТСЯ...";
        }
        if (statusLabel) {
            statusLabel.text = "Испытываем удачу...";
            statusLabel.style.color = "#e2b96f";
        }

        $.Schedule(0.05, function () {
            CenterReelOnCard(WINNING_INDEX, true);
            PlaySpinTickSounds(SPIN_DURATION, WINNING_INDEX);
        });

        $.Schedule(SPIN_DURATION + 0.3, function () {
            OnSpinCompleted(winningItem);
        });
    }

    function PlaySpinTickSounds(duration, totalPassed) {
        var startTime = Game.Time();
        var lastCard = -1;

        function Step() {
            if (!isSpinning) return;
            var elapsed = Game.Time() - startTime;
            if (elapsed >= duration) return;

            var t = elapsed / duration;
            var progress = 1 - Math.pow(1 - t, 3.5);
            var currentPos = progress * (totalPassed * CARD_WIDTH);
            var cardIdx = Math.floor(currentPos / CARD_WIDTH);

            if (cardIdx !== lastCard && cardIdx < totalPassed + 2) {
                lastCard = cardIdx;
                PlaySound("UI.Shop.Mod.Starred.Click");
            }

            $.Schedule(0.025, Step);
        }
        Step();
    }

    function OnSpinCompleted(winningItem) {
        isSpinning = false;
        Log("Spin completed! Won item: " + winningItem.name);

        PlaySound("Stinger.LevelUp");
        ShopPurchaseTracker.SetTargetItem(winningItem);

        if (statusLabel) {
            statusLabel.text = "ВЫ ВЫИГРАЛИ: " + (winningItem.ruName || winningItem.name) + "! Фармите души.";
            statusLabel.style.color = "#52b788";
        }

        UpdateUIState();
    }

    function OnTargetItemPurchased(purchasedItem) {
        Log("Target item purchased: " + (purchasedItem ? purchasedItem.name : ""));
        if (statusLabel) {
            statusLabel.text = "ПРЕДМЕТ КУПЛЕН! Слот свободен, можно крутить снова.";
            statusLabel.style.color = "#52b788";
        }

        PlaySound("Stinger.LevelUp");
        UpdateUIState();
    }

    function UpdateUIState() {
        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var currentGold = ShopPurchaseTracker.GetPlayerGold();
        var weights = DeadlockItemsDB.GetTierWeights(totalSouls);

        if (phaseBadge && weights && weights.phaseName) {
            phaseBadge.text = weights.phaseName;
        }

        if (soulsLabel) {
            soulsLabel.text = FormatNumber(currentGold);
        }

        var target = ShopPurchaseTracker.GetTargetItem();
        if (target) {
            if (targetName) targetName.text = target.name + " (" + (target.ruName || "") + ")";
            if (targetIcon) {
                targetIcon.style.backgroundImage = 'url("' + target.image + '")';
                targetIcon.style.borderColor = GetTierColor(target.tier);
            }
            var pct = Math.min(100, Math.floor((currentGold / target.cost) * 100));
            if (targetProgressFill) targetProgressFill.style.width = pct + "%";
            if (targetProgressText) {
                targetProgressText.text = FormatNumber(currentGold) + " / " + FormatNumber(target.cost) + " Душ (" + pct + "%)";
            }
            if (spinButton && !isSpinning) {
                ApplyStyles(spinButton, { "background-color": "#30363d" });
                if (spinBtnText) spinBtnText.text = "ФАРМИТЕ ДУШИ (" + pct + "%)";
            }
        } else {
            if (targetName) targetName.text = "Предмет не выбран — крутите рулетку!";
            if (targetIcon) {
                targetIcon.style.backgroundImage = "none";
                targetIcon.style.borderColor = "#30363d";
            }
            if (targetProgressFill) targetProgressFill.style.width = "0%";
            if (targetProgressText) targetProgressText.text = "0 / 0 Душ (0%)";

            if (spinButton && !isSpinning) {
                ApplyStyles(spinButton, { "background-color": "#e2b96f" });
                if (spinBtnText) spinBtnText.text = "КРУТИТЬ РУЛЕТКУ";
            }
        }
    }

    function MonitorLoop() {
        var context = $.GetContextPanel();
        if (context) {
            var shop = context.FindChildTraverse("Shop");
            if (!isVanillaShopMode) {
                if (overlayPanel && overlayPanel.style.visibility !== "visible") {
                    overlayPanel.style.visibility = "visible";
                }
                if (shop && shop.style.visibility !== "collapse") {
                    shop.style.visibility = "collapse";
                }
            }
        }

        if (!isSpinning) {
            UpdateUIState();
        }
        $.Schedule(0.25, MonitorLoop);
    }

    function FormatNumber(num) {
        if (!num) return "0";
        return num.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, " ");
    }

    return {
        Init: Init,
        StartSpin: StartSpin,
        SetShopMode: SetShopMode
    };
})();

// Compatibility stub for any external mods checking QOL icons
if (typeof this.QOL_LITE_PURCHASE_ICONS === "undefined") {
    this.QOL_LITE_PURCHASE_ICONS = {};
}

// Auto-run when shop context loads
(function () {
    ItemRoulette.Init();
})();
"""

standalone_full_js = (
    '"use strict";\n\n'
    '// DEADLOCK ITEM ROULETTE MOD - STANDALONE ENGINE\n\n' +
    db_js_clean + '\n\n' +
    tracker_js_clean + '\n\n' +
    roulette_engine
)

out_file = BASE_DIR / "game/citadel/panorama/scripts/deadlock_item_roulette_engine.js"
with open(out_file, "w", encoding="utf-8") as f:
    f.write(standalone_full_js)

print("Generated standalone script:", out_file, "length:", len(standalone_full_js))
