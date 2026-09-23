"use strict";

/**
 * Deadlock Shop Purchase Tracker & Auto-Buy Bridge
 * Tracks player purchases in real time and interfaces with Quickbuy.
 */
var ShopPurchaseTracker = (function () {
    var currentTargetItem = null;
    var isTrackerActive = false;
    var cachedRoot = null;
    var cachedShopRoot = null;
    var lastKnownGold = 0;
    var lastKnownTotalSouls = 0;
    var onPurchaseCallbacks = [];

    function GetAbsoluteRoot() {
        if (cachedRoot && cachedRoot.IsValid()) return cachedRoot;
        var p = $.GetContextPanel();
        while (p && p.GetParent && p.GetParent()) {
            p = p.GetParent();
        }
        cachedRoot = p;
        return p;
    }

    function GetShopRoot() {
        if (cachedShopRoot && cachedShopRoot.IsValid()) return cachedShopRoot;
        var root = GetAbsoluteRoot();
        if (root) {
            cachedShopRoot = root.FindChildTraverse("Shop");
        }
        return cachedShopRoot;
    }

    function GetPlayerGold() {
        var root = GetAbsoluteRoot();
        if (!root) return 0;
        var goldLabel = root.FindChildTraverse("CurrentGoldAmount");
        if (goldLabel && goldLabel.IsValid() && goldLabel.text) {
            var val = parseInt(goldLabel.text.replace(/[^0-9]/g, ""), 10);
            if (!isNaN(val)) {
                lastKnownGold = val;
                return val;
            }
        }
        return lastKnownGold;
    }

    function GetPlayerTotalSouls() {
        var root = GetAbsoluteRoot();
        if (!root) return 0;
        var soulsContainer = root.FindChildTraverse("SoulsContainer");
        if (soulsContainer && soulsContainer.IsValid()) {
            var label = soulsContainer.FindChildTraverse("AbilitiesLabel") || soulsContainer.FindChildrenWithClassTraverse("AbilitiesLabel")[0];
            if (label && label.IsValid() && label.text) {
                var val = parseInt(label.text.replace(/[^0-9]/g, ""), 10);
                if (!isNaN(val)) {
                    lastKnownTotalSouls = val;
                    return val;
                }
            }
        }
        return lastKnownTotalSouls;
    }

    /**
     * Collects all items that the player currently owns.
     * Looks through CitadelShopMod elements in the shop for .owned class,
     * as well as #RecentPurchasesContainer.
     */
    function GetOwnedItemIds() {
        var owned = [];
        var root = GetAbsoluteRoot();
        if (!root) return owned;

        // 1. Scan CitadelShopMod elements
        var allShopMods = root.FindChildrenWithClassTraverse("CitadelShopMod");
        for (var i = 0; i < allShopMods.length; i++) {
            var mod = allShopMods[i];
            if (!mod || !mod.IsValid()) continue;
            if (mod.BHasClass("owned") || mod.BHasClass("usedAsComponent")) {
                var nameLabels = mod.FindChildrenWithClassTraverse("modName");
                if (nameLabels.length > 0 && nameLabels[0].IsValid() && nameLabels[0].text) {
                    owned.push(nameLabels[0].text.trim());
                }
            }
        }

        // 2. Scan RecentPurchasesContainer
        var recentContainer = root.FindChildTraverse("RecentPurchasesContainer");
        if (recentContainer && recentContainer.IsValid()) {
            var purchases = recentContainer.FindChildrenWithClassTraverse("recentPurchase");
            for (var j = 0; j < purchases.length; j++) {
                var p = purchases[j];
                if (!p || !p.IsValid()) continue;
                // Only consider purchases from local player
                if (p.BHasClass("isTeam1Purchase") || p.BHasClass("isTeam2Purchase")) {
                    var nameLabel = p.FindChildrenWithClassTraverse("recentModPurchaseName")[0];
                    if (nameLabel && nameLabel.IsValid() && nameLabel.text) {
                        owned.push(nameLabel.text.trim());
                    }
                }
            }
        }

        return owned;
    }

    /**
     * Checks if the target item has been purchased.
     */
    function CheckIsTargetItemPurchased() {
        if (!currentTargetItem) return false;
        var owned = GetOwnedItemIds();
        var targetName = currentTargetItem.name.toLowerCase();
        var targetRuName = (currentTargetItem.ruName || "").toLowerCase();
        var targetId = currentTargetItem.id.toLowerCase();

        for (var i = 0; i < owned.length; i++) {
            var o = owned[i].toLowerCase();
            if (o === targetName || o === targetRuName || o === targetId) {
                return true;
            }
        }
        return false;
    }

    /**
     * Attempt to automatically add item to Quickbuy queue.
     * Finds the matching CitadelShopMod in the DOM and simulates right click or dispatches event.
     */
    function QueueItemForAutoBuy(item) {
        if (!item) return false;
        var root = GetAbsoluteRoot();
        if (!root) return false;

        var allShopMods = root.FindChildrenWithClassTraverse("CitadelShopMod");
        var targetName = item.name.toLowerCase();
        var targetRuName = (item.ruName || "").toLowerCase();
        var targetId = item.id.toLowerCase();

        for (var i = 0; i < allShopMods.length; i++) {
            var mod = allShopMods[i];
            if (!mod || !mod.IsValid()) continue;
            var nameLabels = mod.FindChildrenWithClassTraverse("modName");
            if (nameLabels.length > 0 && nameLabels[0].IsValid() && nameLabels[0].text) {
                var t = nameLabels[0].text.trim().toLowerCase();
                if (t === targetName || t === targetRuName || t === targetId) {
                    try {
                        // Dispatch context menu event (right-click) to trigger quickbuy
                        $.DispatchEvent("ContextMenu", mod);
                        $.Msg("[ItemRoulette] Dispatched ContextMenu on mod:", t);
                        return true;
                    } catch (e) {
                        $.Msg("[ItemRoulette] Failed dispatching ContextMenu:", e);
                    }
                }
            }
        }
        return false;
    }

    /**
     * Start the continuous ticker.
     */
    function StartTracker() {
        if (isTrackerActive) return;
        isTrackerActive = true;
        Tick();
    }

    function Tick() {
        if (!isTrackerActive) return;

        try {
            if (currentTargetItem) {
                if (CheckIsTargetItemPurchased()) {
                    $.Msg("[ItemRoulette] Target item was purchased! Item: " + currentTargetItem.name);
                    var purchased = currentTargetItem;
                    currentTargetItem = null;

                    // Play success sound
                    try {
                        PlaySoundEffect("UI.Shop.Mod.Purchased");
                    } catch (err) {}

                    // Notify callbacks
                    for (var i = 0; i < onPurchaseCallbacks.length; i++) {
                        try {
                            onPurchaseCallbacks[i](purchased);
                        } catch (cbErr) {
                            $.Msg("[ItemRoulette] Error in purchase callback:", cbErr);
                        }
                    }
                }
            }
        } catch (e) {
            $.Msg("[ItemRoulette] Error in tracker tick:", e);
        }

        $.Schedule(0.1, Tick);
    }

    function SetTargetItem(item) {
        currentTargetItem = item;
        if (item) {
            QueueItemForAutoBuy(item);
        }
    }

    function GetTargetItem() {
        return currentTargetItem;
    }

    function OnPurchase(callback) {
        if (typeof callback === "function") {
            onPurchaseCallbacks.push(callback);
        }
    }

    return {
        StartTracker: StartTracker,
        GetPlayerGold: GetPlayerGold,
        GetPlayerTotalSouls: GetPlayerTotalSouls,
        GetOwnedItemIds: GetOwnedItemIds,
        SetTargetItem: SetTargetItem,
        GetTargetItem: GetTargetItem,
        QueueItemForAutoBuy: QueueItemForAutoBuy,
        OnPurchase: OnPurchase
    };
})();
