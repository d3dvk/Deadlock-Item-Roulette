#!/usr/bin/env python3
"""
Deadlock Item Roulette Mod - Unified Bundle Builder
Assembles the complete mod package, compiles .vjs_c, includes .vxml_c, and produces pak05_dir.vpk.
"""

import os
import sys
import struct
import zlib
from pathlib import Path

# Paths
BASE_DIR = Path("e:/Deadlock_mod")
ADDONS_DIR = Path("E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/addons")

def get_roulette_engine_js():
    return """
// =========================================================================
// DEADLOCK ITEM ROULETTE ENGINE & DYNAMIC UI
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
        Log("Initializing Roulette UI in context: " + ($.GetContextPanel() ? $.GetContextPanel().id : "none"));
        var context = $.GetContextPanel();
        if (!context) {
            $.Schedule(0.2, Init);
            return;
        }

        var shop = context.FindChildTraverse("Shop");
        if (!shop) {
            // Shop panel not yet instantiated by C++, retry
            $.Schedule(0.2, Init);
            return;
        }

        if (initialized) return;
        initialized = true;

        // Build or fetch overlay
        BuildRouletteDOM(context, shop);

        // Start purchase tracker
        ShopPurchaseTracker.StartTracker();
        ShopPurchaseTracker.OnPurchase(OnTargetItemPurchased);

        // Populate initial idle reel
        BuildInitialReel();
        UpdateUIState();

        // Start monitoring loop for gold, phase, and shop visibility
        MonitorLoop();

        Log("Initialization complete! Ready for spins.");
    }

    function BuildRouletteDOM(context, shop) {
        Log("Building dynamic Roulette UI DOM elements...");

        // Floating Return Button inside Vanilla Shop
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
                Log("Return to Roulette button clicked");
                SetShopMode(false);
            });
        }

        // Overlay Root Panel
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

        // 1. Header Bar
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
        ApplyStyles(titleBox, { "flow-children": "down", "width": "400px" });

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

        // Spacer to push toggle button right
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

        // 2. Viewport / Carousel Reel Box
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

        // Golden Laser Needles (Top & Bottom)
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

        // The Strip / Reel Panel
        reelPanel = $.CreatePanel("Panel", carouselContainer, "RouletteReel");
        ApplyStyles(reelPanel, {
            "flow-children": "right",
            "height": "100%",
            "vertical-align": "center",
            "transform": "translateX(0px)"
        });

        // 3. Status Text & Spin Button Section
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

        // 4. Current Target (Autobuy Progress) Box
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

        // Progress Bar
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

        // Center reel on card 0
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

        // Tier tag
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

        // Item Icon
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

        // Item Name
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

        // Cost Label
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
                statusLabel.text = "Сначала накопите души и купите: " + activeTarget.name + "!";
                statusLabel.style.color = "#e63946";
            }
            return;
        }

        isSpinning = true;
        Log("==========================================");
        Log("STARTING ROULETTE SPIN");

        // Pick winning item based on player total souls
        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var owned = ShopPurchaseTracker.GetOwnedItemNames();
        var winningItem = DeadlockItemsDB.PickRandomWeightedItem(owned, totalSouls);
        Log("Winning Item picked: " + winningItem.name + " (Tier " + winningItem.tier + ", Cost " + winningItem.cost + ")");

        // Rebuild reel cards around winning index
        reelPanel.RemoveAndDeleteChildren();
        var pool = DeadlockItemsDB.GetCandidateItems(owned, totalSouls);
        if (!pool || pool.length === 0) pool = DeadlockItemsDB.ITEMS;

        for (var i = 0; i < TOTAL_CARDS; i++) {
            var item = (i === WINNING_INDEX) ? winningItem : pool[Math.floor(Math.random() * pool.length)];
            CreateCardPanel(i, item);
        }

        // Reset reel to start without transition
        CenterReelOnCard(0, false);

        // Update Button and status
        if (spinButton) {
            ApplyStyles(spinButton, { "background-color": "#30363d" });
            if (spinBtnText) spinBtnText.text = "РУЛЕТКА КРУТИТСЯ...";
        }
        if (statusLabel) {
            statusLabel.text = "Испытываем удачу...";
            statusLabel.style.color = "#e2b96f";
        }

        // Animate spin after a tick
        $.Schedule(0.05, function () {
            CenterReelOnCard(WINNING_INDEX, true);
            PlaySpinTickSounds(SPIN_DURATION, WINNING_INDEX);
        });

        // Finish spin callback
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
                try {
                    PlaySoundEffect("UI.Shop.Mod.Starred.Click");
                } catch (e) {}
            }

            $.Schedule(0.025, Step);
        }
        Step();
    }

    function OnSpinCompleted(winningItem) {
        isSpinning = false;
        Log("Spin completed! Won item: " + winningItem.name);

        // Sound fanfare
        try {
            PlaySoundEffect("UI.HeroDraft.LockIn");
        } catch (e) {}

        // Set target item
        ShopPurchaseTracker.SetTargetItem(winningItem);

        if (statusLabel) {
            statusLabel.text = "ВЫ ВЫИГРАЛИ: " + winningItem.name + "! Фармите души.";
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

        try {
            PlaySoundEffect("UI.HeroDraft.LockIn");
        } catch (e) {}

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
            // If shop has gShopOpen or visible
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

// Auto-run when shop context loads
(function () {
    ItemRoulette.Init();
})();
"""

def compile_js_to_vjs_c(js_code: str, red2_template: bytes) -> bytes:
    js_bytes = js_code.encode("utf-8")
    data_bytes = b"\x00\x00\x00\x00" + js_bytes
    data_size = len(data_bytes)
    red2_size = len(red2_template)

    abs_red2 = 44
    rel_red2 = abs_red2 - 16 # 28

    end_red2 = abs_red2 + red2_size # 44 + 790 = 834
    pad_len = 844 - end_red2 # exactly 10 bytes padding to reach 844
    abs_data = 844
    rel_data = abs_data - 28 # 816

    pad_bytes = b"\x00\xdd\xee\xff" + b"\x00" * (pad_len - 4)
    total_size = abs_data + data_size

    header = struct.pack("<IHHI I", total_size, 12, 4, 8, 2)
    b0 = b"RED2" + struct.pack("<II", rel_red2, red2_size)
    b1 = b"DATA" + struct.pack("<II", rel_data, data_size)

    result = header + b0 + b1 + b"\x00\x00\x00\x00" + red2_template + pad_bytes + data_bytes
    assert len(result) == total_size
    return result

def pack_vpk_files(files_dict, output_vpk_path):
    """
    Packs a dict of { internal_vpk_path: file_bytes } into a valid VPK v2 archive.
    """
    # Group by ext -> dir -> stem
    files_tree = {}
    file_entries = []
    file_blobs = []
    current_offset = 0

    for internal_path, content in files_dict.items():
        p = Path(internal_path)
        ext = p.suffix.lstrip(".").lower() or " "
        dir_path = str(p.parent).replace("\\", "/").lower()
        if dir_path == ".": dir_path = ""
        stem = p.stem.lower()

        if ext not in files_tree: files_tree[ext] = {}
        if dir_path not in files_tree[ext]: files_tree[ext][dir_path] = []

        crc = zlib.crc32(content) & 0xFFFFFFFF
        length = len(content)

        files_tree[ext][dir_path].append((stem, crc, length, current_offset))
        file_blobs.append(content)
        current_offset += length

    # Build tree
    tree_bytes = bytearray()
    for ext, dirs in sorted(files_tree.items()):
        tree_bytes.extend(ext.encode("utf-8") + b"\x00")
        for d, file_list in sorted(dirs.items()):
            d_encoded = d.encode("utf-8") if d else b" "
            tree_bytes.extend(d_encoded + b"\x00")
            for stem, crc, length, offset in sorted(file_list):
                tree_bytes.extend(stem.encode("utf-8") + b"\x00")
                # 18 bytes record
                record = struct.pack("<IHHIIH", crc, 0, 0x7FFF, offset, length, 0xFFFF)
                tree_bytes.extend(record)
            tree_bytes.extend(b"\x00")
        tree_bytes.extend(b"\x00")
    tree_bytes.extend(b"\x00")

    tree_size = len(tree_bytes)
    data_size = sum(len(b) for b in file_blobs)

    header = struct.pack("<IIIIIII", 0x55aa1234, 2, tree_size, data_size, 0, 0, 0)

    output_path = Path(output_vpk_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(header)
        f.write(tree_bytes)
        for blob in file_blobs:
            f.write(blob)

    print(f"Created VPK {output_vpk_path}: {len(header) + tree_size + data_size} bytes")

def main():
    print("Building Deadlock Item Roulette Mod...")

    # 1. Read base components
    with open(BASE_DIR / "icons_red2.bin", "rb") as f:
        red2_bytes = f.read()

    with open(BASE_DIR / "original_icons.js", "r", encoding="utf-8") as f:
        icons_js = f.read()

    with open(BASE_DIR / "game/citadel/panorama/scripts/deadlock_items_db.js", "r", encoding="utf-8") as f:
        db_js = f.read()

    with open(BASE_DIR / "game/citadel/panorama/scripts/shop_purchase_tracker.js", "r", encoding="utf-8") as f:
        tracker_js = f.read()

    roulette_ui_js = get_roulette_engine_js()

    # 2. Combine into unified script
    combined_js = (
        icons_js + "\n\n" +
        "// =========================================================================\n" +
        "// DEADLOCK ITEM ROULETTE MOD INJECTION\n" +
        "// =========================================================================\n\n" +
        db_js + "\n\n" +
        tracker_js + "\n\n" +
        roulette_ui_js
    )

    print(f"Combined JS size: {len(combined_js)} chars")

    # 3. Compile to .vjs_c
    vjs_c_bytes = compile_js_to_vjs_c(combined_js, red2_bytes)
    print(f"Compiled vjs_c size: {len(vjs_c_bytes)} bytes")

    # 4. Read layout .vxml_c (scratch_shop.vxml_c)
    with open(BASE_DIR / "scratch_shop.vxml_c", "rb") as f:
        vxml_c_bytes = f.read()
    print(f"Layout vxml_c size: {len(vxml_c_bytes)} bytes")

    # 5. Pack into pak05_dir.vpk
    files_to_pack = {
        "panorama/layout/citadel_hud_hero_shop.vxml_c": vxml_c_bytes,
        "panorama/scripts/qollite_recent_purchase_icons.vjs_c": vjs_c_bytes
    }

    # Output in workspace
    workspace_vpk = BASE_DIR / "pak05_dir.vpk"
    pack_vpk_files(files_to_pack, workspace_vpk)

    # Output directly in game addons if directory exists
    if ADDONS_DIR.is_dir():
        game_vpk = ADDONS_DIR / "pak05_dir.vpk"
        pack_vpk_files(files_to_pack, game_vpk)
        print(f"Installed pak05_dir.vpk directly to: {game_vpk}")

        # Remove old pak85_dir.vpk if present
        old_pak85 = ADDONS_DIR / "pak85_dir.vpk"
        if old_pak85.is_file():
            old_pak85.unlink()
            print("Removed deprecated pak85_dir.vpk from addons folder.")

    print("SUCCESS: Mod build and installation complete!")

if __name__ == "__main__":
    main()
