"use strict";

/**
 * Deadlock Item Roulette Engine
 * Manages the reel animation, sound effects, item generation, and UI state.
 */
var ItemRoulette = (function () {
    var CARD_WIDTH = 140; // width + horizontal margin in px
    var TOTAL_CARDS = 60;
    var WINNING_INDEX = 48;
    var SPIN_DURATION = 5.2; // seconds

    var isSpinning = false;
    var isVanillaShopMode = false;
    var overlayPanel = null;
    var reelPanel = null;
    var spinButton = null;
    var statusLabel = null;
    var currentWinningItem = null;
    var soundTimer = null;

    function Init() {
        $.Msg("[ItemRoulette] Initializing Item Roulette Mod...");
        overlayPanel = $.GetContextPanel().FindChildTraverse("ItemRouletteOverlay");
        reelPanel = $.GetContextPanel().FindChildTraverse("RouletteReel");
        spinButton = $.GetContextPanel().FindChildTraverse("SpinButton");
        statusLabel = $.GetContextPanel().FindChildTraverse("RouletteStatusLabel");

        if (!overlayPanel || !reelPanel || !spinButton) {
            // Context might still be loading, retry in 0.2s
            $.Schedule(0.2, Init);
            return;
        }

        // Start purchase tracker
        ShopPurchaseTracker.StartTracker();
        ShopPurchaseTracker.OnPurchase(OnTargetItemPurchased);

        // Bind Emergency Toggle button
        var toggleBtn = $.GetContextPanel().FindChildTraverse("ToggleVanillaShopBtn");
        if (toggleBtn) {
            toggleBtn.SetPanelEvent("onactivate", ToggleVanillaShop);
        }

        // Bind Spin button
        spinButton.SetPanelEvent("onactivate", function () {
            StartSpin();
        });

        // Populate initial idle reel
        BuildInitialReel();
        UpdateUIState();

        // Start souls & status monitor loop
        MonitorLoop();
    }

    function MonitorLoop() {
        if (!isSpinning) {
            UpdateProgressionBadge();
            UpdateTargetProgress();
        }
        $.Schedule(0.2, MonitorLoop);
    }

    function UpdateProgressionBadge() {
        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var weights = DeadlockItemsDB.GetTierWeights(totalSouls);
        var badge = $.GetContextPanel().FindChildTraverse("RoulettePhaseBadge");
        if (badge && weights && weights.phaseName) {
            badge.text = weights.phaseName;
        }

        var soulsLabel = $.GetContextPanel().FindChildTraverse("PlayerSoulsValue");
        if (soulsLabel) {
            soulsLabel.text = FormatNumber(ShopPurchaseTracker.GetPlayerGold());
        }
    }

    function UpdateTargetProgress() {
        var target = ShopPurchaseTracker.GetTargetItem();
        var targetPanel = $.GetContextPanel().FindChildTraverse("TargetItemContainer");
        if (!targetPanel) return;

        if (target) {
            targetPanel.RemoveClass("NoTarget");
            targetPanel.AddClass("HasTarget");

            var nameLabel = targetPanel.FindChildTraverse("TargetItemName");
            if (nameLabel) nameLabel.text = target.name + " (" + (target.ruName || "") + ")";

            var costLabel = targetPanel.FindChildTraverse("TargetItemCost");
            if (costLabel) costLabel.text = target.cost + " душ";

            var iconPanel = targetPanel.FindChildTraverse("TargetItemIcon");
            if (iconPanel) iconPanel.style.backgroundImage = 'url("' + target.image + '")';

            var currentGold = ShopPurchaseTracker.GetPlayerGold();
            var pct = Math.min(100, Math.floor((currentGold / target.cost) * 100));

            var progressBar = targetPanel.FindChildTraverse("TargetProgressBarInner");
            if (progressBar) progressBar.style.width = pct + "%";

            var progressText = targetPanel.FindChildTraverse("TargetProgressText");
            if (progressText) {
                progressText.text = currentGold + " / " + target.cost + " душ (" + pct + "%)";
            }

            if (spinButton) {
                spinButton.SetHasClass("Disabled", true);
                if (statusLabel) {
                    if (currentGold >= target.cost) {
                        statusLabel.text = "ДУШИ НАКОПЛЕНЫ! Ожидание закупки у торговца...";
                        statusLabel.style.color = "#52b788";
                    } else {
                        statusLabel.text = "ЦЕЛЬ ВЫБРАНА: копите души на предмет";
                        statusLabel.style.color = "#ffd166";
                    }
                }
            }
        } else {
            targetPanel.RemoveClass("HasTarget");
            targetPanel.AddClass("NoTarget");

            if (spinButton) {
                spinButton.SetHasClass("Disabled", false);
                if (statusLabel) {
                    statusLabel.text = "ГОТОВО К ПРОКРУТКЕ";
                    statusLabel.style.color = "#e2e8f0";
                }
            }
        }
    }

    function BuildInitialReel() {
        if (!reelPanel) return;
        reelPanel.RemoveAndDeleteChildren();
        reelPanel.style.transform = "translateX(0px)";

        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var owned = ShopPurchaseTracker.GetOwnedItemIds();

        for (var i = 0; i < 15; i++) {
            var item = DeadlockItemsDB.PickRandomWinningItem(totalSouls, owned);
            CreateCardPanel(reelPanel, item, i);
        }
    }

    function CreateCardPanel(parent, item, index) {
        var card = $.CreatePanel("Panel", parent, "Card_" + index);
        card.AddClass("RouletteCard");
        card.AddClass("Tier_" + item.tier);
        card.AddClass(item.category);

        // Tier indicator bar
        var tierBar = $.CreatePanel("Panel", card, "TierBar");
        tierBar.AddClass("CardTierBar");
        tierBar.style.backgroundColor = DeadlockItemsDB.TIER_COLORS[item.tier];

        // Item icon
        var icon = $.CreatePanel("Panel", card, "ItemIcon");
        icon.AddClass("CardItemIcon");
        icon.style.backgroundImage = 'url("' + item.image + '")';

        // Item info container
        var info = $.CreatePanel("Panel", card, "CardInfo");
        info.AddClass("CardInfo");

        var name = $.CreatePanel("Label", info, "ItemName");
        name.AddClass("CardItemName");
        name.text = item.name;

        var cost = $.CreatePanel("Label", info, "ItemCost");
        cost.AddClass("CardItemCost");
        cost.text = item.cost + " душ";
        cost.style.color = DeadlockItemsDB.TIER_COLORS[item.tier];

        return card;
    }

    function StartSpin() {
        if (isSpinning) return;

        // Check if player already has an unpurchased target item
        if (ShopPurchaseTracker.GetTargetItem()) {
            $.Msg("[ItemRoulette] Cannot spin: target item already pending purchase!");
            try {
                PlaySoundEffect("UI.Default.Click");
            } catch (e) {}
            return;
        }

        isSpinning = true;
        spinButton.SetHasClass("Disabled", true);
        if (statusLabel) {
            statusLabel.text = "КРУТИМ РУЛЕТКУ...";
            statusLabel.style.color = "#4ea8de";
        }

        // Determine winning item based on total souls and unowned items
        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var owned = ShopPurchaseTracker.GetOwnedItemIds();
        var winningItem = DeadlockItemsDB.PickRandomWinningItem(totalSouls, owned);
        currentWinningItem = winningItem;

        // Populate 60 items into the reel
        reelPanel.RemoveAndDeleteChildren();
        reelPanel.style.transition = "none";
        reelPanel.style.transform = "translateX(0px)";

        var reelItems = [];
        for (var i = 0; i < TOTAL_CARDS; i++) {
            var cardItem;
            if (i === WINNING_INDEX) {
                cardItem = winningItem;
            } else {
                cardItem = DeadlockItemsDB.PickRandomWinningItem(totalSouls, owned);
            }
            reelItems.push(cardItem);
            CreateCardPanel(reelPanel, cardItem, i);
        }

        // Calculate target scroll position
        // Center of viewport (viewport width 960px -> center is 480px)
        // Center of card 48 = WINNING_INDEX * CARD_WIDTH + CARD_WIDTH / 2
        var viewportCenter = 480;
        var jitter = (Math.random() - 0.5) * 60; // +/- 30px random offset
        var targetX = (WINNING_INDEX * CARD_WIDTH) + (CARD_WIDTH / 2) - viewportCenter + jitter;

        // Start sound tick scheduler
        StartAudioTicks(SPIN_DURATION, WINNING_INDEX);

        // Force layout update before starting transition
        $.Schedule(0.05, function () {
            reelPanel.style.transition = "transform " + SPIN_DURATION + "s cubic-bezier(0.12, 0.98, 0.24, 1.0)";
            reelPanel.style.transform = "translateX(-" + targetX + "px)";
        });

        // End of spin callback
        $.Schedule(SPIN_DURATION + 0.15, function () {
            OnSpinCompleted(winningItem);
        });
    }

    function StartAudioTicks(duration, totalPassed) {
        var startTime = Game.Time();
        var lastCardIndex = -1;

        function AudioTick() {
            if (!isSpinning) return;
            var elapsed = Game.Time() - startTime;
            if (elapsed >= duration) return;

            // Progress from 0 to 1 with cubic-bezier approximation
            var t = elapsed / duration;
            // cubic-bezier(0.12, 0.98, 0.24, 1.0) approx:
            var progress = 1 - Math.pow(1 - t, 3.5);
            var currentPos = progress * (totalPassed * CARD_WIDTH);
            var currentCard = Math.floor(currentPos / CARD_WIDTH);

            if (currentCard !== lastCardIndex && currentCard < totalPassed + 2) {
                lastCardIndex = currentCard;
                try {
                    PlaySoundEffect("UI.Shop.Mod.Starred.Click");
                } catch (e) {}
            }

            $.Schedule(0.025, AudioTick);
        }

        AudioTick();
    }

    function OnSpinCompleted(winningItem) {
        isSpinning = false;
        $.Msg("[ItemRoulette] Spin completed! Won item: " + winningItem.name);

        // Highlight winning card
        var winningCard = reelPanel.FindChildTraverse("Card_" + WINNING_INDEX);
        if (winningCard) {
            winningCard.AddClass("Winner");
        }

        // Triumph sound
        try {
            PlaySoundEffect("UI.HeroDraft.LockIn");
        } catch (e) {}

        // Set as active target and queue in Quickbuy
        ShopPurchaseTracker.SetTargetItem(winningItem);
        UpdateUIState();
    }

    function OnTargetItemPurchased(purchasedItem) {
        $.Msg("[ItemRoulette] Target item was bought: " + (purchasedItem ? purchasedItem.name : ""));
        if (statusLabel) {
            statusLabel.text = "ПРЕДМЕТ КУПЛЕН! Слот свободен";
            statusLabel.style.color = "#52b788";
        }

        // Reset target panel
        var targetPanel = $.GetContextPanel().FindChildTraverse("TargetItemContainer");
        if (targetPanel) {
            targetPanel.RemoveClass("HasTarget");
            targetPanel.AddClass("NoTarget");
        }

        // Re-enable spin button
        if (spinButton) {
            spinButton.SetHasClass("Disabled", false);
        }

        // Re-center reel
        $.Schedule(1.0, function () {
            BuildInitialReel();
            UpdateUIState();
        });
    }

    function ToggleVanillaShop() {
        isVanillaShopMode = !isVanillaShopMode;
        if (overlayPanel) {
            overlayPanel.SetHasClass("VanillaShopActive", isVanillaShopMode);
        }

        var toggleBtnLabel = $.GetContextPanel().FindChildTraverse("ToggleVanillaShopLabel");
        if (toggleBtnLabel) {
            toggleBtnLabel.text = isVanillaShopMode ? "ВЕРНУТЬСЯ К РУЛЕТКЕ" : "ОБЫЧНЫЙ МАГАЗИН";
        }
    }

    function UpdateUIState() {
        UpdateProgressionBadge();
        UpdateTargetProgress();
    }

    function FormatNumber(num) {
        if (!num) return "0";
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    return {
        Init: Init,
        StartSpin: StartSpin,
        ToggleVanillaShop: ToggleVanillaShop
    };
})();

// Auto-run when Panorama panel loads
(function () {
    ItemRoulette.Init();
})();
