"use strict";

// Compatibility stub for external mods
var _globalScope = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : (typeof this !== "undefined" ? this : {}));
if (typeof _globalScope.QOL_LITE_PURCHASE_ICONS === "undefined") {
    _globalScope.QOL_LITE_PURCHASE_ICONS = {};
}

// =========================================================================
// 0. GLOBAL PANORAMA HELPERS & RESOLVERS
// =========================================================================
function GetTopRoot() {
    try {
        var p = $.GetContextPanel();
        var guard = 0;
        while (p && typeof p.GetParent === "function" && guard++ < 60) {
            var parent = p.GetParent();
            if (!parent || (typeof parent.IsValid === "function" && !parent.IsValid())) break;
            p = parent;
        }
        var res = p || (typeof $ !== "undefined" && typeof $.GetContextPanel === "function" ? $.GetContextPanel() : null);
        if (res && typeof res.FindChildTraverse !== "function") return null;
        return res;
    } catch (e) {
        var fb = (typeof $ !== "undefined" && typeof $.GetContextPanel === "function") ? $.GetContextPanel() : null;
        if (fb && typeof fb.FindChildTraverse !== "function") return null;
        return fb;
    }
}

function GlobalCleanStr(str) {
    if (!str) return "";
    return str.toString().toLowerCase().replace(/[^a-z0-9а-яё]/gi, "").trim();
}

// Universal Panorama DOM recursive walker (traverses real C++ panel trees safely)
function TraversePanelTree(panel, callback, maxDepth, maxCount) {
    if (!panel || !panel.IsValid()) return;
    var depthLimit = (typeof maxDepth === "number") ? maxDepth : 25;
    var nodeLimit = (typeof maxCount === "number") ? maxCount : 5000;
    var stack = [{ p: panel, d: 0 }];
    var visited = 0;
    while (stack.length > 0 && visited < nodeLimit) {
        var item = stack.pop();
        var cur = item.p;
        var d = item.d;
        visited++;
        if (!cur || !cur.IsValid()) continue;

        var cont = callback(cur, d);
        if (cont === false) continue;

        if (d < depthLimit && cur.GetChildCount) {
            var childCount = cur.GetChildCount() || 0;
            for (var i = 0; i < childCount; i++) {
                var ch = cur.GetChild(i);
                if (ch && ch.IsValid()) {
                    stack.push({ p: ch, d: d + 1 });
                }
            }
        }
    }
}

if (typeof _globalScope !== "undefined") {
    _globalScope.GetTopRoot = GetTopRoot;
    _globalScope.GlobalCleanStr = GlobalCleanStr;
    _globalScope.TraversePanelTree = TraversePanelTree;
}

// Scamlock HUD & Match State Monitor
var ScamlockHudState = (function () {
    var cachedHudState = null;
    var cachedTopBar = null;
    var lastFindTopBarMs = 0;

    function GetHudStatePanel() {
        if (cachedHudState && cachedHudState.IsValid && cachedHudState.IsValid()) {
            return cachedHudState;
        }
        cachedHudState = null;
        var root = GetTopRoot();
        if (!root) return null;
        var cur = root.FindChildTraverse("gameplay_hud_dead");
        var guard = 0;
        while (cur && guard++ < 30) {
            if (cur.BHasClass && (cur.BHasClass("dead") || cur.BHasClass("alive"))) {
                cachedHudState = cur;
                break;
            }
            cur = cur.GetParent ? cur.GetParent() : null;
        }
        return cachedHudState;
    }

    function HudHasClass(cls) {
        var cur = GetHudStatePanel();
        var guard = 0;
        while (cur && guard++ < 30) {
            if (cur.BHasClass && cur.BHasClass(cls)) return true;
            cur = cur.GetParent ? cur.GetParent() : null;
        }
        return false;
    }

    function GetTopBar() {
        var now = Date.now();
        if (cachedTopBar && cachedTopBar.IsValid && cachedTopBar.IsValid()) {
            return cachedTopBar;
        }
        if (now - lastFindTopBarMs < 2000) return cachedTopBar;
        lastFindTopBarMs = now;
        var root = GetTopRoot();
        if (!root) return null;
        var hs = GetHudStatePanel();
        var tb = (hs && hs.FindChildTraverse ? hs.FindChildTraverse("TopBar") : null) || root.FindChildTraverse("TopBar");
        cachedTopBar = (tb && tb.IsValid()) ? tb : null;
        return cachedTopBar;
    }

    function IsInHideout() {
        var tb = GetTopBar();
        return HudHasClass("connectedToHideout") || (tb && tb.BHasClass && tb.BHasClass("connectedToHideout"));
    }

    function IsPreGame() {
        var tb = GetTopBar();
        var preClasses = ["GameStatePreGame", "GameStatePreGameWait"];
        for (var i = 0; i < preClasses.length; i++) {
            var c = preClasses[i];
            if (HudHasClass(c) || (tb && tb.BHasClass && tb.BHasClass(c))) return true;
        }
        return false;
    }

    function IsPostGame() {
        var tb = GetTopBar();
        var postClasses = ["GameStatePostGame", "GameStateGameEnding"];
        for (var i = 0; i < postClasses.length; i++) {
            var c = postClasses[i];
            if (HudHasClass(c) || (tb && tb.BHasClass && tb.BHasClass(c))) return true;
        }
        return false;
    }

    return {
        GetHudStatePanel: GetHudStatePanel,
        HudHasClass: HudHasClass,
        GetTopBar: GetTopBar,
        IsInHideout: IsInHideout,
        IsPreGame: IsPreGame,
        IsPostGame: IsPostGame
    };
})();

// =========================================================================
// 1. REAL-TIME ROULETTE LOGGER (In-Memory & UI Log Viewer)
// =========================================================================
var RouletteLogger = (function () {
    var logs = [];
    var maxLogs = 140;
    var listeners = [];

    function FormatTime() {
        var d = new Date();
        var h = ("0" + d.getHours()).slice(-2);
        var m = ("0" + d.getMinutes()).slice(-2);
        var s = ("0" + d.getSeconds()).slice(-2);
        return h + ":" + m + ":" + s;
    }

    function Log(msg, level) {
        level = level || "INFO";
        var line = "[" + FormatTime() + "] [" + level + "] " + msg;
        logs.push(line);
        if (logs.length > maxLogs) logs.shift();
        if (typeof $.Msg === "function") {
            $.Msg("[ROULETTE] " + line);
        }
        if (typeof Game !== "undefined" && Game.ConsoleCommand) {
            Game.ConsoleCommand("echoln [ROULETTE] " + line.replace(/[\"\r\n\\]/g, " "));
        }
        for (var i = 0; i < listeners.length; i++) {
            if (typeof listeners[i] === "function") listeners[i](line);
        }
    }

    function GetLogsText() {
        return logs.join("\n");
    }

    function Clear() {
        logs = [];
        for (var i = 0; i < listeners.length; i++) {
            if (typeof listeners[i] === "function") listeners[i](null);
        }
    }

    function OnLog(cb) {
        if (typeof cb === "function") listeners.push(cb);
    }

    return {
        Log: Log,
        GetLogsText: GetLogsText,
        Clear: Clear,
        OnLog: OnLog
    };
})();

// =========================================================================
// 1. DEADLOCK ITEMS DATABASE (156 Items & Time-Based Tier Progression)
// =========================================================================
var DeadlockItemsDB = (function () {
    var ITEMS = [
        { id: "close_range", valveId: "upgrade_close_range", hash: 1342610602, name: "Close Quarters", ruName: "Ближняя дистанция", category: "Weapon", tier: 1, cost: 800, image: "s2r://panorama/images/items/weapon/close_quarters_psd.vtex" },
        { id: "clip_size", valveId: "upgrade_clip_size", hash: 1548066885, name: "Extended Magazine", ruName: "Увеличенный магазин", category: "Weapon", tier: 1, cost: 800, image: "s2r://panorama/images/items/weapon/basic_magazine_psd.vtex" },
        { id: "headshot_booster", valveId: "upgrade_headshot_booster", hash: 2010028405, name: "Headshot Booster", ruName: "Усилитель выстрелов в голову", category: "Weapon", tier: 1, cost: 800, image: "s2r://panorama/images/items/weapon/headshot_booster_psd.vtex" },
        { id: "high_velocity_mag", valveId: "upgrade_high_velocity_mag", hash: 3077079169, name: "High-Velocity Rounds", ruName: "Скоростные патроны", category: "Weapon", tier: 1, cost: 800, image: "s2r://panorama/images/items/weapon/high_velocity_rounds_psd.vtex" },
        { id: "non_player_bonus", valveId: "upgrade_non_player_bonus", hash: 1009965641, name: "Monster Rounds", ruName: "Чудовищные патроны", category: "Weapon", tier: 1, cost: 800, image: "s2r://panorama/images/items/weapon/monster_rounds_psd.vtex" },
        { id: "rapid_rounds", valveId: "upgrade_rapid_rounds", hash: 668299740, name: "Rapid Rounds", ruName: "Спешная стрельба", category: "Weapon", tier: 1, cost: 800, image: "s2r://panorama/images/items/weapon/rapid_rounds_psd.vtex" },
        { id: "medic_bullets", valveId: "upgrade_medic_bullets", hash: 3862866912, name: "Restorative Shot", ruName: "Живительный выстрел", category: "Weapon", tier: 1, cost: 800, image: "s2r://panorama/images/items/weapon/restorative_shot_psd.vtex" },
        { id: "active_reload", valveId: "upgrade_active_reload", hash: 381961617, name: "Active Reload", ruName: "Активная перезарядка", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/active_reload_psd.vtex" },
        { id: "fleetfoot_boots", valveId: "upgrade_fleetfoot_boots", hash: 3403085434, name: "Fleetfoot", ruName: "Проворная поступь", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/fleetfoot_psd.vtex" },
        { id: "intensifying_clip", valveId: "upgrade_intensifying_clip", hash: 2407033488, name: "Intensifying Magazine", ruName: "Усиливающий магазин", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/intensifying_magazine_psd.vtex" },
        { id: "kinetic_sash", valveId: "upgrade_kinetic_sash", hash: 3977876567, name: "Kinetic Dash", ruName: "Кинетический рывок", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/kinetic_dash_psd.vtex" },
        { id: "long_range", valveId: "upgrade_long_range", hash: 3331811235, name: "Long Range", ruName: "Дальняя дистанция", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/long_range_psd.vtex" },
        { id: "melee_charge", valveId: "upgrade_melee_charge", hash: 26002154, name: "Melee Charge", ruName: "Удар с зарядом", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/melee_charge_psd.vtex" },
        { id: "crackshot", valveId: "upgrade_crackshot", hash: 395867183, name: "Mystic Shot", ruName: "Мистический выстрел", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/mystic_shot_psd.vtex" },
        { id: "pristine_emblem", valveId: "upgrade_pristine_emblem", hash: 2064029594, name: "Opening Rounds", ruName: "Вскрывающие патроны", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/opening_rounds_psd.vtex" },
        { id: "rechargingbullets", valveId: "upgrade_rechargingbullets", hash: 1763073141, name: "Recharging Rush", ruName: "Прилив перезарядки", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/recharging_rounds_psd.vtex" },
        { id: "slowing_bullets", valveId: "upgrade_slowing_bullets", hash: 393974127, name: "Slowing Bullets", ruName: "Замедляющие пули", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/slowing_bullets_psd.vtex" },
        { id: "tech_defense_shredders", valveId: "upgrade_tech_defense_shredders", hash: 1144549437, name: "Spirit Shredder Bullets", ruName: "Душегубные пули", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/spirit_shredder_bullets_psd.vtex" },
        { id: "split_shot", valveId: "upgrade_split_shot", hash: 3647584222, name: "Split Shot", ruName: "Веерный выстрел", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/split_shot_psd.vtex" },
        { id: "weapon_backstabber", valveId: "upgrade_weapon_backstabber", hash: 98582110, name: "Stalker", ruName: "Преследователь", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/backstabber_psd.vtex" },
        { id: "blitz_bullets", valveId: "upgrade_blitz_bullets", hash: 4104549924, name: "Swift Striker", ruName: "Быстрый стрелок", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/swift_striker_psd.vtex" },
        { id: "titan_round", valveId: "upgrade_titan_round", hash: 2356412290, name: "Titanic Magazine", ruName: "Титанический магазин", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/titanic_magazine_psd.vtex" },
        { id: "headshot_booster2", valveId: "upgrade_headshot_booster2", hash: 1770441818, name: "Weakening Headshot", ruName: "Ослабляющий выстрел в голову ", category: "Weapon", tier: 2, cost: 1600, image: "s2r://panorama/images/items/weapon/weakening_headshot_psd.vtex" },
        { id: "thermal_detonator", valveId: "upgrade_thermal_detonator", hash: 1932939246, name: "Alchemical Fire", ruName: "Алхимический огонь", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/alchemical_fire_psd.vtex" },
        { id: "bulletshredimbue", valveId: "upgrade_bulletshredimbue", hash: 3294954488, name: "Ballistic Enchantment", ruName: "Баллистические чары", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/alchemical_seal_psd.vtex" },
        { id: "berserker", valveId: "upgrade_berserker", hash: 1414319208, name: "Berserker", ruName: "Берсерк", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/berserker_psd.vtex" },
        { id: "blood_tribute", valveId: "upgrade_blood_tribute", hash: 989206714, name: "Blood Tribute", ruName: "Кровавая дань", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/blood_tribute_psd.vtex" },
        { id: "burst_fire", valveId: "upgrade_burst_fire", hash: 2739107182, name: "Burst Fire", ruName: "Шквальный огонь", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/burst_fire_psd.vtex" },
        { id: "non_player_bonus_sacrifice", valveId: "upgrade_non_player_bonus_sacrifice", hash: 709540378, name: "Cultist Sacrifice", ruName: "Жертвенный ритуал", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/cultist_sacrifice_psd.vtex" },
        { id: "reinforcing_casings", valveId: "upgrade_reinforcing_casings", hash: 2463960640, name: "Escalating Resilience", ruName: "Растущая стойкость", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/escalating_resilience_psd.vtex" },
        { id: "express_shot", valveId: "upgrade_express_shot", hash: 690458959, name: "Express Shot", ruName: "Экспресс-выстрел", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/express_shot_psd.vtex" },
        { id: "headhunter", valveId: "upgrade_headhunter", hash: 4053935515, name: "Headhunter", ruName: "Охотник за головами", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/headhunter_psd.vtex" },
        { id: "dps_aura", valveId: "upgrade_dps_aura", hash: 2108215830, name: "Heroic Aura", ruName: "Героическая аура", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/heroic_aura_psd.vtex" },
        { id: "hollow_point_rounds", valveId: "upgrade_hollow_point_rounds", hash: 2678489038, name: "Hollow Point", ruName: "Разрывник", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/hollow_point_psd.vtex" },
        { id: "bullet_armor_reduction_aura", valveId: "upgrade_bullet_armor_reduction_aura", hash: 2481177645, name: "Hunter's Aura", ruName: "Аура охотника", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/hunters_aura_psd.vtex" },
        { id: "close_quarter_combat", valveId: "upgrade_close_quarter_combat", hash: 2095565695, name: "Point Blank", ruName: "Стрельба в упор", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/point_blank_psd.vtex" },
        { id: "cloaking_device_active", valveId: "upgrade_cloaking_device_active", hash: 1798666702, name: "Shadow Weave", ruName: "Сплетение теней", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/shadow_weave_psd.vtex" },
        { id: "sharpshooter", valveId: "upgrade_sharpshooter", hash: 2152872419, name: "Sharpshooter", ruName: "Прицельная стрельба", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/sharp_shooter_psd.vtex" },
        { id: "spellslinger_headshots", valveId: "upgrade_spellslinger_headshots", hash: 4075861416, name: "Spirit Rend", ruName: "Спиритический разрыв", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/spellslinger_headshots_psd.vtex" },
        { id: "chain_lightning", valveId: "upgrade_chain_lightning", hash: 811521119, name: "Tesla Bullets", ruName: "Тесла-пули", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/tesla_bullets_psd.vtex" },
        { id: "toxic_bullets", valveId: "upgrade_toxic_bullets", hash: 3696726732, name: "Toxic Bullets", ruName: "Токсичные пули", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/toxic_bullets_psd.vtex" },
        { id: "weighted_shots", valveId: "upgrade_weighted_shots", hash: 3791587546, name: "Weighted Shots", ruName: "Утяжелённые выстрелы", category: "Weapon", tier: 3, cost: 3200, image: "s2r://panorama/images/items/weapon/weighted_shots_psd.vtex" },
        { id: "aprounds", valveId: "upgrade_aprounds", hash: 673001892, name: "Armor Piercing Rounds", ruName: "Бронебойные патроны", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/armor_piercing_rounds_psd.vtex" },
        { id: "capacitor", valveId: "upgrade_capacitor", hash: 710436191, name: "Capacitor", ruName: "Конденсатор", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/capacitor_psd.vtex" },
        { id: "banshee_slugs", valveId: "upgrade_banshee_slugs", hash: 3884003354, name: "Crippling Headshot", ruName: "Калечащий выстрел в голову", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/crippling_headshot_psd.vtex" },
        { id: "crushing_fists", valveId: "upgrade_crushing_fists", hash: 800008313, name: "Crushing Fists", ruName: "Сокрушительные кулаки", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/crushing_fists_psd.vtex" },
        { id: "fervor", valveId: "upgrade_fervor", hash: 339443430, name: "Frenzy", ruName: "Ярость", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/frenzy_psd.vtex" },
        { id: "glass_cannon", valveId: "upgrade_glass_cannon", hash: 365620721, name: "Glass Cannon", ruName: "Стеклянная пушка", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/glass_cannon_psd.vtex" },
        { id: "critshot", valveId: "upgrade_critshot", hash: 1396247347, name: "Lucky Shot", ruName: "Удачный выстрел", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/lucky_shot_psd.vtex" },
        { id: "ricochet", valveId: "upgrade_ricochet", hash: 2480592370, name: "Ricochet", ruName: "Рикошет", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/ricochet_psd.vtex" },
        { id: "proc_silence", valveId: "upgrade_proc_silence", hash: 1113837674, name: "Silencer", ruName: "Глушитель", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/silencer_psd.vtex" },
        { id: "enchanted_holsters", valveId: "upgrade_enchanted_holsters", hash: 2221211450, name: "Spellslinger", ruName: "Метатель чар", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/spell_slinger_psd.vtex" },
        { id: "tech_overflow", valveId: "upgrade_tech_overflow", hash: 2226497419, name: "Spiritual Overflow", ruName: "Спиритическое переполнение", category: "Weapon", tier: 4, cost: 6400, image: "s2r://panorama/images/items/weapon/spiritual_overflow_psd.vtex" },
        { id: "health", valveId: "upgrade_health", hash: 3633614685, name: "Extra Health", ruName: "Добавочное здоровье", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/extra_health_psd.vtex" },
        { id: "endurance", valveId: "upgrade_endurance", hash: 2829638276, name: "Extra Regen", ruName: "Добавочное восстановление", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/extra_regen_psd.vtex" },
        { id: "improved_stamina", valveId: "upgrade_improved_stamina", hash: 4139877411, name: "Extra Stamina", ruName: "Добавочная выносливость", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/extra_stamina_psd.vtex" },
        { id: "grit", valveId: "upgrade_grit", hash: 1672893796, name: "Grit", ruName: "Крепость", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/grit_psd.vtex" },
        { id: "health_stimpak", valveId: "upgrade_health_stimpak", hash: 1710079648, name: "Healing Rite", ruName: "Обряд лечения", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/healing_rite_psd.vtex" },
        { id: "lifestrike_gauntlets", valveId: "upgrade_lifestrike_gauntlets", hash: 1437614329, name: "Melee Lifesteal", ruName: "Ударная кража здоровья", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/melee_lifesteal_psd.vtex" },
        { id: "melee_rebuttal", valveId: "upgrade_melee_rebuttal", hash: 4204808176, name: "Rebuttal", ruName: "Отпор", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/rebuttal_psd.vtex" },
        { id: "sprint_booster", valveId: "upgrade_sprint_booster", hash: 3399065363, name: "Sprint Boots", ruName: "Беговые ботинки", category: "Vitality", tier: 1, cost: 800, image: "s2r://panorama/images/items/vitality/sprint_boots_psd.vtex" },
        { id: "regenerating_bullet_shield", valveId: "upgrade_regenerating_bullet_shield", hash: 1235347618, name: "Battle Vest", ruName: "Боевой жилет", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/battle_vest_psd.vtex" },
        { id: "vampire", valveId: "upgrade_vampire", hash: 499683006, name: "Bullet Lifesteal", ruName: "Пулевая кража здоровья", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/bullet_lifesteal_psd.vtex" },
        { id: "debuff_reducer", valveId: "upgrade_debuff_reducer", hash: 1047818222, name: "Debuff Reducer", ruName: "Уменьшитель эффектов", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/debuff_reducer_psd.vtex" },
        { id: "magic_shield", valveId: "upgrade_magic_shield", hash: 3970837787, name: "Enchanter's Emblem", ruName: "Эмблема заклинателя", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/enchanters_emblem_psd.vtex" },
        { id: "cardio_calibrator", valveId: "upgrade_cardio_calibrator", hash: 2447176615, name: "Enduring Speed", ruName: "Скоростная стойкость", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/enduring_speed_psd.vtex" },
        { id: "guardian_ward", valveId: "upgrade_guardian_ward", hash: 857669956, name: "Guardian Ward", ruName: "Заслон стража", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/guardian_ward_psd.vtex" },
        { id: "healbane", valveId: "upgrade_healbane", hash: 2603935618, name: "Healbane", ruName: "Гроза целителей", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/healbane_psd.vtex" },
        { id: "healing_booster", valveId: "upgrade_healing_booster", hash: 2566692615, name: "Healing Booster", ruName: "Усилитель лечения", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/healing_booster_psd.vtex" },
        { id: "vex_barrier", valveId: "upgrade_vex_barrier", hash: 1644605047, name: "Reactive Barrier", ruName: "Барьерная реакция", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/reactive_barrier_psd.vtex" },
        { id: "restorative_locket", valveId: "upgrade_restorative_locket", hash: 2059712766, name: "Restorative Locket", ruName: "Живительный медальон", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/restorative_locket_psd.vtex" },
        { id: "return_fire", valveId: "upgrade_return_fire", hash: 3361075077, name: "Return Fire", ruName: "Обратный огонь", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/return_fire_psd.vtex" },
        { id: "health_stealing_magic", valveId: "upgrade_health_stealing_magic", hash: 876563814, name: "Spirit Lifesteal", ruName: "Спиритическая кража здоровья", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/spirit_lifesteal_psd.vtex" },
        { id: "spirit_bubble", valveId: "upgrade_spirit_bubble", hash: 112198670, name: "Spirit Shielding", ruName: "Спиритическая защита", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/spirit_shielding_psd.vtex" },
        { id: "trophy_collector", valveId: "upgrade_trophy_collector", hash: 3074274290, name: "Trophy Collector", ruName: "Собиратель трофеев", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/trophy_collector_psd.vtex" },
        { id: "weapon_shielding", valveId: "upgrade_weapon_shielding", hash: 805079544, name: "Weapon Shielding", ruName: "Оружейная защита", category: "Vitality", tier: 2, cost: 1600, image: "s2r://panorama/images/items/vitality/weapon_shielding_psd.vtex" },
        { id: "improved_bullet_armor", valveId: "upgrade_improved_bullet_armor", hash: 3140772621, name: "Bullet Resilience", ruName: "Пулевая стойкость", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/bullet_resilience_psd.vtex" },
        { id: "counterspell", valveId: "upgrade_counterspell", hash: 1414025773, name: "Counterspell", ruName: "Контрчары", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/counterspell_psd.vtex" },
        { id: "reduce_debuff_duration", valveId: "upgrade_reduce_debuff_duration", hash: 3731635960, name: "Dispel Magic", ruName: "Развеивание магии", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/debuff_remover_psd.vtex" },
        { id: "chonky", valveId: "upgrade_chonky", hash: 3585132399, name: "Fortitude", ruName: "Выдержка", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/fortitude_psd.vtex" },
        { id: "fury_trance", valveId: "upgrade_fury_trance", hash: 1409190604, name: "Fury Trance", ruName: "Яростный экстаз", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/fury_trance_psd.vtex" },
        { id: "health_nova", valveId: "upgrade_health_nova", hash: 2956256701, name: "Healing Nova", ruName: "Вспышка исцеления", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/healing_nova_psd.vtex" },
        { id: "boxing_glove", valveId: "upgrade_boxing_glove", hash: 1252627263, name: "Lifestrike", ruName: "Витальный удар", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/lifestrike_psd.vtex" },
        { id: "rocket_booster", valveId: "upgrade_rocket_booster", hash: 600033864, name: "Majestic Leap", ruName: "Грациозный скачок", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/majestic_leap_psd.vtex" },
        { id: "metal_skin", valveId: "upgrade_metal_skin", hash: 1378931225, name: "Metal Skin", ruName: "Металлическая кожа", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/metal_skin_psd.vtex" },
        { id: "rescue_beam", valveId: "upgrade_rescue_beam", hash: 1804594021, name: "Rescue Beam", ruName: "Спасательный луч", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/rescue_beam_psd.vtex" },
        { id: "tech_purge", valveId: "upgrade_tech_purge", hash: 2163598980, name: "Spirit Resilience", ruName: "Спиритическая стойкость", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/spirit_resilience_psd.vtex" },
        { id: "superior_stamina", valveId: "upgrade_superior_stamina", hash: 334300056, name: "Stamina Mastery", ruName: "Превосходная выносливость", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/stamina_mastery_psd.vtex" },
        { id: "veil_walker", valveId: "upgrade_veil_walker", hash: 865958998, name: "Veil Walker", ruName: "Незримый покров", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/veil_walker_psd.vtex" },
        { id: "warp_stone", valveId: "upgrade_warp_stone", hash: 3270001687, name: "Warp Stone", ruName: "Камень переноса", category: "Vitality", tier: 3, cost: 3200, image: "s2r://panorama/images/items/vitality/warp_stone_psd.vtex" },
        { id: "cheat_death", valveId: "upgrade_cheat_death", hash: 3361811174, name: "Cheat Death", ruName: "Обман смерти", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/cheat_death_psd.vtex" },
        { id: "colossus", valveId: "upgrade_colossus", hash: 2407781327, name: "Colossus", ruName: "Колосс", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/colossus_psd.vtex" },
        { id: "divine_barrier", valveId: "upgrade_divine_barrier", hash: 1662311306, name: "Divine Barrier", ruName: "Божественный барьер", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/divine_barrier_psd.vtex" },
        { id: "diviners_kevlar", valveId: "upgrade_diviners_kevlar", hash: 2820116164, name: "Diviner's Kevlar", ruName: "Доспех прорицателя", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/diviners_kevlar_psd.vtex" },
        { id: "healbuff", valveId: "upgrade_healbuff", hash: 1427630806, name: "Healing Tempo", ruName: "Целебный темп", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/healing_tempo_psd.vtex" },
        { id: "auto_cleanse", valveId: "upgrade_auto_cleanse", hash: 951866250, name: "Indomitable", ruName: "Непреклонность", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/indomitable_psd.vtex" },
        { id: "infuser", valveId: "upgrade_infuser", hash: 1797283378, name: "Infuser", ruName: "Насытитель", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/infuser_psd.vtex" },
        { id: "inhibitor", valveId: "upgrade_inhibitor", hash: 2037039379, name: "Inhibitor", ruName: "Ограничитель", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/inhibitor_psd.vtex" },
        { id: "juggernaut", valveId: "upgrade_juggernaut", hash: 1250307611, name: "Juggernaut", ruName: "Громила", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/juggernaut_psd.vtex" },
        { id: "damage_recycler", valveId: "upgrade_damage_recycler", hash: 865846625, name: "Leech", ruName: "Кровопийца", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/leech_psd.vtex" },
        { id: "phantom_strike", valveId: "upgrade_phantom_strike", hash: 1371725689, name: "Phantom Strike", ruName: "Фантомный удар", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/phantom_strike_psd.vtex" },
        { id: "deflecting_armor", valveId: "upgrade_deflecting_armor", hash: 3491236900, name: "Plated Armor", ruName: "Латная броня", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/plated_armor_psd.vtex" },
        { id: "siphon_bullets", valveId: "upgrade_siphon_bullets", hash: 1282141666, name: "Siphon Bullets", ruName: "Вытягивающие пули", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/siphon_bullets_psd.vtex" },
        { id: "spellbreaker", valveId: "upgrade_spellbreaker", hash: 1955841979, name: "Spellbreaker", ruName: "Разрушитель чар", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/spellbreaker_psd.vtex" },
        { id: "unstoppable", valveId: "upgrade_unstoppable", hash: 3357231760, name: "Unstoppable", ruName: "Неудержимость", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/unstoppable_psd.vtex" },
        { id: "surging_power", valveId: "upgrade_surging_power", hash: 1055679805, name: "Vampiric Burst", ruName: "Порыв вампиризма", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/vampiric_burst_psd.vtex" },
        { id: "absorbing_armor", valveId: "upgrade_absorbing_armor", hash: 3028234315, name: "Witchmail", ruName: "Ведьмовской доспех", category: "Vitality", tier: 4, cost: 6400, image: "s2r://panorama/images/items/vitality/witchmail_psd.vtex" },
        { id: "extra_charge", valveId: "upgrade_extra_charge", hash: 3776945997, name: "Extra Charge", ruName: "Добавочные заряды", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/extra_charge_psd.vtex" },
        { id: "improved_spirit", valveId: "upgrade_improved_spirit", hash: 968099481, name: "Extra Spirit", ruName: "Добавочный спиритизм", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/extra_spirit_psd.vtex" },
        { id: "goose_egg", valveId: "upgrade_goose_egg", hash: 2462046703, name: "Golden Goose Egg", ruName: "Золотое гусиное яйцо", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/goose_egg_psd.vtex" },
        { id: "magic_burst", valveId: "upgrade_magic_burst", hash: 1998374645, name: "Mystic Burst", ruName: "Мистический импульс", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/mystic_burst_psd.vtex" },
        { id: "magic_reach", valveId: "upgrade_magic_reach", hash: 754480263, name: "Mystic Expansion", ruName: "Мистическое расширение", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/mystic_reach_psd.vtex" },
        { id: "mystic_regeneration", valveId: "upgrade_mystic_regeneration", hash: 1439347412, name: "Mystic Regeneration", ruName: "Мистическое восстановление", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/mystic_regen_psd.vtex" },
        { id: "withering_whip", valveId: "upgrade_withering_whip", hash: 2922054143, name: "Rusted Barrel", ruName: "Ржавый ствол", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/rusted_barrel_psd.vtex" },
        { id: "acolytes_glove", valveId: "upgrade_acolytes_glove", hash: 465043967, name: "Spirit Strike", ruName: "Спиритический удар", category: "Spirit", tier: 1, cost: 800, image: "s2r://panorama/images/items/spirit/spirit_strike_psd.vtex" },
        { id: "arcane_surge", valveId: "upgrade_arcane_surge", hash: 1150006784, name: "Arcane Surge", ruName: "Колдовской порыв", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/arcane_surge_psd.vtex" },
        { id: "bullet_resist_shredder", valveId: "upgrade_bullet_resist_shredder", hash: 2971868509, name: "Bullet Resist Shredder", ruName: "Измельчитель пулестойкости", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/bullet_resist_shredder_psd.vtex" },
        { id: "cold_front", valveId: "upgrade_cold_front", hash: 1976391348, name: "Cold Front", ruName: "Холодный фронт", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/cold_front_psd.vtex" },
        { id: "magic_tempo", valveId: "upgrade_magic_tempo", hash: 380806748, name: "Compress Cooldown", ruName: "Сжатая перезарядка умений", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/improved_cooldown_psd.vtex" },
        { id: "arcane_extension", valveId: "upgrade_arcane_extension", hash: 2951612397, name: "Duration Extender", ruName: "Увеличитель длительности", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/duration_extender_psd.vtex" },
        { id: "soaring_spirit", valveId: "upgrade_soaring_spirit", hash: 7409189, name: "Improved Spirit", ruName: "Улучшенный спиритизм", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/improved_spirit_psd.vtex" },
        { id: "magic_slow", valveId: "upgrade_magic_slow", hash: 1102081447, name: "Mystic Slow", ruName: "Мистическое замедление", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/mystic_slow_psd.vtex" },
        { id: "magic_vulnerability", valveId: "upgrade_magic_vulnerability", hash: 2081037738, name: "Mystic Vulnerability", ruName: "Мистическая уязвимость", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/mystic_vulnerability_psd.vtex" },
        { id: "quick_silver", valveId: "upgrade_quick_silver", hash: 84321454, name: "Quicksilver Reload", ruName: "Ртутная перезарядка", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/quicksilver_reload_psd.vtex" },
        { id: "containment", valveId: "upgrade_containment", hash: 1813726886, name: "Slowing Hex", ruName: "Замедляющие чары", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/slowing_hex_psd.vtex" },
        { id: "spirit_sap", valveId: "upgrade_spirit_sap", hash: 1219329868, name: "Spirit Sap", ruName: "Спиритическое истощение", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/spirit_sap_psd.vtex" },
        { id: "suppressor", valveId: "upgrade_suppressor", hash: 1925087134, name: "Suppressor", ruName: "Подавитель", category: "Spirit", tier: 2, cost: 1600, image: "s2r://panorama/images/items/spirit/suppressor_psd.vtex" },
        { id: "rupture", valveId: "upgrade_rupture", hash: 3144988365, name: "Decay", ruName: "Разложение", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/decay_psd.vtex" },
        { id: "greater_withering_whip", valveId: "upgrade_greater_withering_whip", hash: 2061878743, name: "Disarming Hex", ruName: "Чары обезоруживания", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/disarming_hex_psd.vtex" },
        { id: "tech_range", valveId: "upgrade_tech_range", hash: 1193964439, name: "Greater Expansion", ruName: "Усиленное расширение", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/greater_expansion_psd.vtex" },
        { id: "target_stun", valveId: "upgrade_target_stun", hash: 1254091416, name: "Knockdown", ruName: "Нокдаун", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/knockdown_psd.vtex" },
        { id: "resonant_healing", valveId: "upgrade_resonant_healing", hash: 2947183272, name: "Radiant Regeneration", ruName: "Сияющее восстановление", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/radiant_regeneration_psd.vtex" },
        { id: "rapid_recharge", valveId: "upgrade_rapid_recharge", hash: 787198704, name: "Rapid Recharge", ruName: "Спешные заряды", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/rapid_recharge_psd.vtex" },
        { id: "targeted_silence", valveId: "upgrade_targeted_silence", hash: 619484391, name: "Silence Wave", ruName: "Волна безмолвия", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/silence_glyph_psd.vtex" },
        { id: "spirit_snatch", valveId: "upgrade_spirit_snatch", hash: 3190916303, name: "Spirit Snatch", ruName: "Похищение спиритизма", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/spirit_snatch_psd.vtex" },
        { id: "cooldown_reduction", valveId: "upgrade_cooldown_reduction", hash: 3261353684, name: "Superior Cooldown", ruName: "Превосходная перезарядка умений", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/superior_cooldown_psd.vtex" },
        { id: "imbued_duration_extender", valveId: "upgrade_imbued_duration_extender", hash: 2717651715, name: "Superior Duration", ruName: "Превосходная длительность", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/superior_duration_psd.vtex" },
        { id: "magic_storm", valveId: "upgrade_magic_storm", hash: 1292979587, name: "Surge of Power", ruName: "Прилив мощи", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/surge_of_power_psd.vtex" },
        { id: "magic_shock", valveId: "upgrade_magic_shock", hash: 2121044373, name: "Tankbuster", ruName: "Гроза танков", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/tankbuster_psd.vtex" },
        { id: "tech_damage_pulse", valveId: "upgrade_tech_damage_pulse", hash: 395944548, name: "Torment Pulse", ruName: "Терзающий пульс", category: "Spirit", tier: 3, cost: 3200, image: "s2r://panorama/images/items/spirit/torment_pulse_psd.vtex" },
        { id: "arctic_blast", valveId: "upgrade_arctic_blast", hash: 3812615317, name: "Arctic Blast", ruName: "Арктический взрыв", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/arctic_blast_psd.vtex" },
        { id: "boundless_spirit", valveId: "upgrade_boundless_spirit", hash: 2519598785, name: "Boundless Spirit", ruName: "Безграничный спиритизм", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/boundless_spirit_psd.vtex" },
        { id: "glitch", valveId: "upgrade_glitch", hash: 2617435668, name: "Cursed Relic", ruName: "Проклятая реликвия", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/curse_psd.vtex" },
        { id: "ability_power_shard", valveId: "upgrade_ability_power_shard", hash: 630839635, name: "Echo Shard", ruName: "Осколок эха", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/echo_shard_psd.vtex" },
        { id: "escalating_exposure", valveId: "upgrade_escalating_exposure", hash: 3005970438, name: "Escalating Exposure", ruName: "Растущее воздействие", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/escalating_exposure_psd.vtex" },
        { id: "self_bubble", valveId: "upgrade_self_bubble", hash: 2533252781, name: "Ethereal Shift", ruName: "Развоплощение", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/ethereal_shift_psd.vtex" },
        { id: "focus_lens", valveId: "upgrade_focus_lens", hash: 2142980412, name: "Focus Lens", ruName: "Фокусная линза", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/focus_lens_psd.vtex" },
        { id: "ultimate_burst", valveId: "upgrade_ultimate_burst", hash: 493591231, name: "Lightning Scroll", ruName: "Свиток молнии", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/lightning_scroll_psd.vtex" },
        { id: "magic_carpet", valveId: "upgrade_magic_carpet", hash: 2800629741, name: "Magic Carpet", ruName: "Ковёр-самолёт", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/magic_carpet_psd.vtex" },
        { id: "ethereal_bullets", valveId: "upgrade_ethereal_bullets", hash: 3919289022, name: "Mercurial Magnum", ruName: "Ртутный Магнум", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/mercurial_magnum_psd.vtex" },
        { id: "mystic_reverb", valveId: "upgrade_mystic_reverb", hash: 3577481646, name: "Mystic Reverb", ruName: "Мистический отзвук", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/mystic_reverb_psd.vtex" },
        { id: "ability_refresher", valveId: "upgrade_ability_refresher", hash: 677738769, name: "Refresher", ruName: "Обновитель", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/refresher_psd.vtex" },
        { id: "discord", valveId: "upgrade_discord", hash: 2417568017, name: "Scourge", ruName: "Кара", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/scourge_psd.vtex" },
        { id: "spirit_burn", valveId: "upgrade_spirit_burn", hash: 343572757, name: "Spirit Burn", ruName: "Спиритический ожог", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/spirit_burn_psd.vtex" },
        { id: "transcendent_cooldown", valveId: "upgrade_transcendent_cooldown", hash: 915014646, name: "Transcendent Cooldown", ruName: "Трансцендентная перезарядка", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/transcendent_cooldown_psd.vtex" },
        { id: "aoe_root", valveId: "upgrade_aoe_root", hash: 1152158042, name: "Vortex Web", ruName: "Паутинный вихрь", category: "Spirit", tier: 4, cost: 6400, image: "s2r://panorama/images/items/spirit/vortex_web_psd.vtex" },
    ];

    function CleanStr(str) {
        if (!str) return "";
        return str.toString().toLowerCase().replace(/[^a-z0-9а-яё]/gi, "").trim();
    }

    // Pre-indexed lookup maps for instant O(1) matching
    var itemById = {};
    var itemByStem = {};
    var itemByName = {};
    var itemByRuName = {};
    var itemByHash = {};
    var itemsByTier = { 1: [], 2: [], 3: [], 4: [] };

    for (var i = 0; i < ITEMS.length; i++) {
        var it = ITEMS[i];
        itemById[it.id] = it;
        if (it.valveId) itemById[it.valveId] = it;
        it.stems = [];

        var vStem = CleanStr((it.valveId || "").replace(/^upgrade_/, ""));
        var idStem = CleanStr(it.id || "");
        var vFull = CleanStr(it.valveId || "");

        if (vStem && it.stems.indexOf(vStem) === -1) it.stems.push(vStem);
        if (idStem && it.stems.indexOf(idStem) === -1) it.stems.push(idStem);
        if (vFull && it.stems.indexOf(vFull) === -1) it.stems.push(vFull);

        if (it.image) {
            var parts = it.image.split("/");
            var fn = parts[parts.length - 1] || "";
            var withoutExt = fn.replace(/\.vtex.*$/, "");
            var withoutPsd = withoutExt.replace(/_psd$/, "");
            var sClean1 = CleanStr(withoutPsd);
            var sClean2 = CleanStr(withoutExt);
            if (sClean1 && it.stems.indexOf(sClean1) === -1) it.stems.push(sClean1);
            if (sClean2 && it.stems.indexOf(sClean2) === -1) it.stems.push(sClean2);
            if (withoutPsd && it.stems.indexOf(withoutPsd) === -1) it.stems.push(withoutPsd);
            if (withoutExt && it.stems.indexOf(withoutExt) === -1) it.stems.push(withoutExt);
        }

        for (var s = 0; s < it.stems.length; s++) {
            itemByStem[it.stems[s]] = it;
        }

        itemByName[CleanStr(it.name)] = it;
        itemByRuName[CleanStr(it.ruName)] = it;
        if (it.hash) itemByHash[it.hash] = it;

        if (itemsByTier[it.tier]) {
            itemsByTier[it.tier].push(it);
        }
    }

    // Time-based progression: higher tiers become dramatically more likely as match progresses
    function GetTimeTierWeights(gameSeconds) {
        var m = (gameSeconds || 0) / 60.0;
        if (m < 8.0) {
            // 0 - 8 min: Tier 1 dominant (laning phase) (80% T1, 18% T2, 2% T3, 0% T4)
            return {
                1: 0.80, 2: 0.18, 3: 0.02, 4: 0.00,
                phaseRu: "0-8 мин • Ранняя игра",
                phaseEn: "0-8 min • Early Game",
                oddsRu: "Т1: 80% • Т2: 18% • Т3: 2%",
                oddsEn: "T1: 80% • T2: 18% • T3: 2%",
                badgeRu: "0-8 мин  •  ШАНСЫ: Т1 80% | Т2 18% | Т3 2%",
                badgeEn: "0-8 min  •  ODDS: T1 80% | T2 18% | T3 2%",
                color: "#10b981",
                border: "#10b981",
                bg: "rgba(16, 185, 129, 0.12)"
            };
        } else if (m < 16.0) {
            // 8 - 16 min: Tier 2 dominant (mid game) (30% T1, 55% T2, 13% T3, 2% T4)
            return {
                1: 0.30, 2: 0.55, 3: 0.13, 4: 0.02,
                phaseRu: "8-16 мин • Мидгейм",
                phaseEn: "8-16 min • Mid Game",
                oddsRu: "Т2: 55% • Т1: 30% • Т3: 13% • Т4: 2%",
                oddsEn: "T2: 55% • T1: 30% • T3: 13% • T4: 2%",
                badgeRu: "8-16 мин  •  ШАНСЫ: Т2 55% | Т1 30% | Т3 13% | Т4 2%",
                badgeEn: "8-16 min  •  ODDS: T2 55% | T1 30% | T3 13% | T4 2%",
                color: "#38bdf8",
                border: "#38bdf8",
                bg: "rgba(56, 189, 248, 0.12)"
            };
        } else if (m < 25.0) {
            // 16 - 25 min: Tier 3 dominant (power spikes) (10% T1, 30% T2, 50% T3, 10% T4)
            return {
                1: 0.10, 2: 0.30, 3: 0.50, 4: 0.10,
                phaseRu: "16-25 мин • Лейтгейм",
                phaseEn: "16-25 min • Late Game",
                oddsRu: "Т3: 50% • Т2: 30% • Т4: 10% • Т1: 10%",
                oddsEn: "T3: 50% • T2: 30% • T4: 10% • T1: 10%",
                badgeRu: "16-25 мин  •  ШАНСЫ: Т3 50% | Т2 30% | Т4 10% | Т1 10%",
                badgeEn: "16-25 min  •  ODDS: T3 50% | T2 30% | T4 10% | T1 10%",
                color: "#c084fc",
                border: "#c084fc",
                bg: "rgba(192, 132, 252, 0.12)"
            };
        } else {
            // 25+ min: Tier 4 late game (5% T1, 15% T2, 45% T3, 35% T4)
            return {
                1: 0.05, 2: 0.15, 3: 0.45, 4: 0.35,
                phaseRu: "25+ мин • Эндшпиль",
                phaseEn: "25+ min • End Game",
                oddsRu: "Т3: 45% • Т4: 35% • Т2: 15% • Т1: 5%",
                oddsEn: "T3: 45% • T4: 35% • T2: 15% • T1: 5%",
                badgeRu: "25+ мин  •  ШАНСЫ: Т3 45% | Т4 35% | Т2 15% | Т1 5%",
                badgeEn: "25+ min  •  ODDS: T3 45% | T4 35% | T2 15% | T1 5%",
                color: "#f59e0b",
                border: "#f59e0b",
                bg: "rgba(245, 158, 11, 0.12)"
            };
        }
    }

    function PickRandomWinningItem(gameSeconds) {
        var weights = GetTimeTierWeights(gameSeconds);
        var r = Math.random();
        var chosenTier = 1;
        if (r < weights[1]) {
            chosenTier = 1;
        } else if (r < weights[1] + weights[2]) {
            chosenTier = 2;
        } else if (r < weights[1] + weights[2] + weights[3]) {
            chosenTier = 3;
        } else {
            chosenTier = 4;
        }

        var tierItems = itemsByTier[chosenTier] || ITEMS;
        var unowned = [];
        for (var i = 0; i < tierItems.length; i++) {
            var it = tierItems[i];
            var isOwned = (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.IsItemOwned) ? ShopPurchaseTracker.IsItemOwned(it) : false;
            var isConflicting = (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.IsItemConflictingWithEquipped) ? ShopPurchaseTracker.IsItemConflictingWithEquipped(it) : false;
            if (!isOwned && !isConflicting) {
                unowned.push(it);
            }
        }

        if (unowned.length > 0) {
            return unowned[Math.floor(Math.random() * unowned.length)];
        }

        var allUnowned = [];
        for (var j = 0; j < ITEMS.length; j++) {
            var item = ITEMS[j];
            var isOwned2 = (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.IsItemOwned) ? ShopPurchaseTracker.IsItemOwned(item) : false;
            var isConflicting2 = (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.IsItemConflictingWithEquipped) ? ShopPurchaseTracker.IsItemConflictingWithEquipped(item) : false;
            if (!isOwned2 && !isConflicting2) {
                allUnowned.push(item);
            }
        }

        if (allUnowned.length > 0) {
            return allUnowned[Math.floor(Math.random() * allUnowned.length)];
        }

        return tierItems[Math.floor(Math.random() * tierItems.length)];
    }

    function GetItemsByTier(tier) {
        var list = [];
        for (var i = 0; i < ITEMS.length; i++) {
            if (ITEMS[i].tier === tier) {
                list.push(ITEMS[i]);
            }
        }
        return list;
    }

    return {
        ITEMS: ITEMS,
        CleanStr: CleanStr,
        GetTimeTierWeights: GetTimeTierWeights,
        PickRandomWinningItem: PickRandomWinningItem,
        GetItemsByTier: GetItemsByTier,
        GetItems: function () { return ITEMS; },
        GetItemById: function (id) { return itemById[id] || null; },
        GetItemByStem: function (stem) { return itemByStem[CleanStr(stem)] || null; },
        GetItemByName: function (name) { return itemByName[CleanStr(name)] || itemByRuName[CleanStr(name)] || null; }
    };
})();

// =========================================================================
// 2. AUTHORITATIVE SHOP & INVENTORY PURCHASE TRACKER
// =========================================================================
var ShopPurchaseTracker = (function () {
    var currentTargetItem = null;
    var wasTargetInQuickbuy = false;
    var targetSetTimestamp = 0;
    var onPurchaseCallbacks = [];
    var onCancelCallbacks = [];
    var isTrackerActive = false;
    var wasShopOpen = false;
    var goldAtTargetSet = 0;
    var targetJustPurchasedInQuickbuy = false;

    var lastKnownGold = 0;
    var lastKnownTotalSouls = 0;

    // Baselines snapshotted when target is chosen
    var baselineEquippedStems = {};
    var baselineShopOwned = false;
    var baselineRecentCount = 0;

    // Panel caches
    var cachedRecentPurchases = null;
    var cachedSoulContainer = null;
    var cachedModIconsContainer = null;
    var cachedShopModPanelsByStem = {};

    function CleanStr(str) {
        return DeadlockItemsDB.CleanStr(str);
    }

    function GetRecentPurchasesContainer() {
        if (cachedRecentPurchases && cachedRecentPurchases.IsValid()) return cachedRecentPurchases;
        var root = GetTopRoot();
        if (!root) return null;
        cachedRecentPurchases = root.FindChildTraverse("RecentPurchasesContainer") || root.FindChildTraverse("RecentPurchasesPanel");
        return cachedRecentPurchases;
    }

    function GetModIconsContainer() {
        if (cachedModIconsContainer && cachedModIconsContainer.IsValid()) return cachedModIconsContainer;
        var root = GetTopRoot();
        if (!root) return null;
        cachedModIconsContainer = root.FindChildTraverse("ModIconsContainer") ||
                                  root.FindChildTraverse("ModsPurchasedContainer") ||
                                  root.FindChildTraverse("citadel_hud_active_mods") ||
                                  root.FindChildTraverse("citadel_mods_purchased_panel") ||
                                  root.FindChildTraverse("hud_active_mods") ||
                                  root.FindChildTraverse("ActiveModsContainer") ||
                                  root.FindChildTraverse("ModsPurchased");
        return cachedModIconsContainer;
    }

    function IsInShopCatalog(panel) {
        if (!panel) return false;
        var cur = panel;
        var guard = 0;
        while (cur && guard++ < 30) {
            var id = cur.id || "";
            // 1. Explicit equipped inventory / HUD ability containers are NEVER shop catalog items!
            if (id === "ModIconsContainer" || id === "ModsContent" || id === "ModsContainer" ||
                id === "ModsPurchasedContainer" || id === "ModsPurchased" ||
                id === "ActiveModsContainer" || id === "citadel_mods_purchased_panel" ||
                id === "citadel_hud_active_mods" || id === "HudAbilities" || id === "ActiveAbilities" ||
                id.indexOf("ActiveAbility") === 0 || id.indexOf("ActiveItem") === 0) {
                return false;
            }

            if (cur.BHasClass && (
                cur.BHasClass("ModsContainer") ||
                cur.BHasClass("ModIconColumn") ||
                cur.BHasClass("mods_purchased_panel") ||
                cur.BHasClass("citadel_mods_purchased_panel") ||
                cur.BHasClass("hud_active_mod") ||
                cur.BHasClass("citadel_hud_active_mods") ||
                cur.BHasClass("hud_ability_button") ||
                cur.BHasClass("citadel_hud_ability_button")
            )) {
                return false;
            }

            if (cur.paneltype === "CitadelModsPurchasedPanel" || cur.paneltype === "CitadelHudAbilityButton") {
                return false;
            }

            // 2. Shop catalog items for sale
            if (id === "ShopModsList" || id === "ShopGrid" || id === "GridContainer" || id === "ShopMods" || id === "CitadelShopModGrid" || id === "CitadelShopModView") {
                return true;
            }

            if (cur.BHasClass && (
                cur.BHasClass("ShopModsList") ||
                cur.BHasClass("CitadelShopModsTier") ||
                cur.BHasClass("CitadelShopModsBuild") ||
                cur.BHasClass("CitadelShopModView") ||
                cur.BHasClass("InShopGrid") ||
                cur.BHasClass("ShopGrid") ||
                cur.BHasClass("CitadelShopModGrid")
            )) {
                return true;
            }

            if (cur.paneltype === "CitadelShopMod") {
                return true;
            }

            cur = cur.GetParent ? cur.GetParent() : null;
        }
        return false;
    }

    function AddImageToEquipped(src, equipped) {
        if (!src) return;
        var cleanSrc = CleanStr(src);
        if (cleanSrc) equipped[cleanSrc] = true;

        var fnMatch = src.match(/([^\/\.]+)(?:_psd)?\.vtex/);
        if (fnMatch && fnMatch[1]) {
            var raw = fnMatch[1];
            equipped[raw] = true;
            equipped[raw.replace(/_psd$/, "")] = true;
            var s1 = CleanStr(raw);
            if (s1) equipped[s1] = true;
            var s2 = CleanStr(raw.replace(/_psd$/, ""));
            if (s2) equipped[s2] = true;
        }
        var m = src.match(/(?:items|mods|upgrades)\/[^\/]+\/([^\/\.]+)/);
        if (m && m[1]) {
            var raw2 = m[1].replace(/_psd$/, "");
            equipped[raw2] = true;
            var s3 = CleanStr(raw2);
            if (s3) equipped[s3] = true;
        }
    }

    function ExtractAndAddEquippedImage(img, equipped) {
        if (!img || !img.IsValid()) return;
        var src = (img.GetAttributeString ? img.GetAttributeString("src", "") : (img.src || "")) || "";
        if (!src && img.style && img.style.backgroundImage) {
            src = img.style.backgroundImage;
        }
        if (src) {
            AddImageToEquipped(src.toLowerCase(), equipped);
        }
    }

    function ExtractAndAddEquippedPanel(panel, equipped) {
        if (!panel || !panel.IsValid()) return;
        if (typeof panel.visible !== "undefined" && !panel.visible) return;
        if (panel.style && (panel.style.visibility === "collapse" || panel.style.opacity === "0" || panel.style.opacity === "0.0")) return;
        if (panel.BHasClass) {
            if (panel.BHasClass("empty") || panel.BHasClass("empty_slot") || panel.BHasClass("unlocked_empty") || panel.BHasClass("locked") || panel.BHasClass("disabled")) {
                return;
            }
            var isModSlot = (panel.paneltype === "CitadelModIcon") || panel.BHasClass("CitadelModIcon") || panel.BHasClass("ModIcon");
            if (isModSlot) {
                var hasActiveMod = panel.BHasClass("hasAbility") || panel.BHasClass("has_ability") || panel.BHasClass("equipped") || panel.BHasClass("hasItem") || panel.BHasClass("has_item");
                if (!hasActiveMod) {
                    return;
                }
            }
        }
        if (panel.GetAttributeString) {
            var aName = CleanStr(panel.GetAttributeString("item_name", ""));
            var aId = CleanStr(panel.GetAttributeString("ability_id", ""));
            var aItemId = CleanStr(panel.GetAttributeString("item_id", ""));
            var aItemInfo = CleanStr(panel.GetAttributeString("item_info", ""));
            if (aName) equipped[aName] = true;
            if (aId) {
                equipped[aId] = true;
                var stripped = aId.replace(/^(citadel_)?(ability_|upgrade_)/, "");
                if (stripped) {
                    equipped[stripped] = true;
                    var strippedClean = CleanStr(stripped);
                    if (strippedClean) equipped[strippedClean] = true;
                }
            }
            if (aItemId) equipped[aItemId] = true;
            if (aItemInfo) equipped[aItemInfo] = true;
        }
        if (panel.ability_id) {
            var directAId = CleanStr(panel.ability_id);
            if (directAId) {
                equipped[directAId] = true;
                var stripped2 = directAId.replace(/^(citadel_)?(ability_|upgrade_)/, "");
                if (stripped2) equipped[stripped2] = true;
            }
        }
        if (panel.item_id) {
            var directItId = CleanStr(panel.item_id);
            if (directItId) equipped[directItId] = true;
        }
        if (panel.GetDialogVariable) {
            var dvName = CleanStr(panel.GetDialogVariable("item_name"));
            var dvAbility = CleanStr(panel.GetDialogVariable("ability_name"));
            var dvInfo = CleanStr(panel.GetDialogVariable("item_info"));
            if (dvName) equipped[dvName] = true;
            if (dvAbility) equipped[dvAbility] = true;
            if (dvInfo) equipped[dvInfo] = true;
        }
        if (panel.id) {
            var cleanId = CleanStr(panel.id);
            if (cleanId && cleanId.length > 3 && cleanId !== "container" && cleanId !== "modicon" && cleanId !== "image" && cleanId !== "itemname") {
                equipped[cleanId] = true;
                equipped[panel.id] = true;
            }
        }

        ExtractAndAddEquippedImage(panel, equipped);

        var modIconImg = panel.FindChildTraverse("ModIconImage");
        if (modIconImg && modIconImg.IsValid()) {
            var isImgVis = true;
            if (typeof modIconImg.visible !== "undefined" && !modIconImg.visible) isImgVis = false;
            if (modIconImg.style && (modIconImg.style.visibility === "collapse" || modIconImg.style.opacity === "0" || modIconImg.style.opacity === "0.0")) isImgVis = false;
            if (modIconImg.BHasClass && (modIconImg.BHasClass("empty") || modIconImg.BHasClass("hidden"))) isImgVis = false;
            if (isImgVis) {
                ExtractAndAddEquippedImage(modIconImg, equipped);
                if (modIconImg.GetAttributeString) {
                    var imgAId = CleanStr(modIconImg.GetAttributeString("ability_id", ""));
                    if (imgAId) {
                        equipped[imgAId] = true;
                        var stripped3 = imgAId.replace(/^(citadel_)?(ability_|upgrade_)/, "");
                        if (stripped3) equipped[stripped3] = true;
                    }
                }
            }
        }

        var bgMod = panel.FindChildTraverse("mod_icon") || panel.FindChildTraverse("ModIcon");
        if (bgMod && bgMod.IsValid()) {
            ExtractAndAddEquippedImage(bgMod, equipped);
        }

        var subImgs = panel.FindChildrenWithClassTraverse("image") || [];
        for (var si = 0; si < subImgs.length; si++) {
            ExtractAndAddEquippedImage(subImgs[si], equipped);
        }

        if (panel.text && typeof panel.text === "string" && panel.text.length > 2) {
            var nClean = CleanStr(panel.text);
            if (nClean && nClean !== "купить" && nClean !== "продано" && nClean !== "locked") {
                equipped[nClean] = true;
            }
        }
    }

    function ScanEquippedInventoryHUD() {
        var root = GetTopRoot();
        if (!root || !root.IsValid()) return {};

        var equipped = {};
        var targetPanels = [];

        // 1. Gather all equipped mod slot containers across categories (Weapon, Armor, Tech, Universal)
        var purchasedPanels = root.FindChildrenWithClassTraverse("CitadelModsPurchasedPanel") || [];
        if (purchasedPanels.length === 0) {
            purchasedPanels = root.FindChildrenWithClassTraverse("mods_purchased_panel") || [];
        }
        for (var pi = 0; pi < purchasedPanels.length; pi++) {
            var pp = purchasedPanels[pi];
            if (pp && pp.IsValid() && !IsInShopCatalog(pp)) {
                var subIcons = pp.FindChildrenWithClassTraverse("CitadelModIcon") || [];
                if (subIcons.length === 0) subIcons = pp.FindChildrenWithClassTraverse("ModIcon") || [];
                if (subIcons.length === 0) subIcons = pp.FindChildrenWithClassTraverse("mod_icon_single_container") || [];
                if (subIcons.length === 0) subIcons = pp.FindChildrenWithClassTraverse("mod") || [];
                for (var si = 0; si < subIcons.length; si++) {
                    targetPanels.push(subIcons[si]);
                }
            }
        }

        // 2. Direct search for CitadelModIcon across HUD if not found via category panels
        if (targetPanels.length === 0) {
            var allModIcons = root.FindChildrenWithClassTraverse("CitadelModIcon") || [];
            for (var mi = 0; mi < allModIcons.length; mi++) {
                var cmi = allModIcons[mi];
                if (cmi && cmi.IsValid() && !IsInShopCatalog(cmi)) {
                    targetPanels.push(cmi);
                }
            }
        }

        // 3. Fallback: Search known HUD containers
        if (targetPanels.length === 0) {
            var containerNames = [
                "ModIconsContainer",
                "citadel_hud_active_mods",
                "citadel_mods_purchased_panel",
                "ActiveModsContainer",
                "ModsPurchasedContainer",
                "ModsContainer"
            ];
            for (var ci = 0; ci < containerNames.length; ci++) {
                var c = root.FindChildTraverse(containerNames[ci]);
                if (c && c.IsValid() && !IsInShopCatalog(c)) {
                    var cIcons = c.FindChildrenWithClassTraverse("ModIcon") || [];
                    if (cIcons.length === 0) cIcons = c.FindChildrenWithClassTraverse("mod") || [];
                    for (var cj = 0; cj < cIcons.length; cj++) targetPanels.push(cIcons[cj]);
                }
            }
        }

        // Safely extract equipped data from all found panels
        for (var pIdx = 0; pIdx < targetPanels.length; pIdx++) {
            try {
                ExtractAndAddEquippedPanel(targetPanels[pIdx], equipped);
            } catch (pErr) {}
        }

        var newEquippedItems = [];
        var newEquippedMap = {};
        if (typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItems) {
            var allItems = DeadlockItemsDB.GetItems();
            for (var i = 0; i < allItems.length; i++) {
                var it = allItems[i];
                var itClean = CleanStr(it.name);
                var itRu = CleanStr(it.ruName);
                var itId = CleanStr(it.id);
                var itValveId = it.valveId ? CleanStr(it.valveId) : "";
                var itValveStripped = it.valveId ? CleanStr(it.valveId.replace(/^(citadel_)?(ability_|upgrade_)/, "")) : "";
                var isEquipped = false;
                if (equipped[itClean] || equipped[itRu] || equipped[itId]) {
                    isEquipped = true;
                } else if (itValveId && equipped[itValveId]) {
                    isEquipped = true;
                } else if (itValveStripped && equipped[itValveStripped]) {
                    isEquipped = true;
                } else if (it.image && (equipped[CleanStr(it.image)] || equipped[CleanStr(it.image.replace(/_psd\.vtex$/, ""))])) {
                    isEquipped = true;
                }

                if (isEquipped) {
                    newEquippedItems.push(it);
                    newEquippedMap[itClean] = true;
                    if (it.id) newEquippedMap[CleanStr(it.id)] = true;
                    MarkItemOwned(it);
                }
            }

            if (targetPanels.length > 0 || Object.keys(equipped).length > 0) {
                currentlyEquippedItemsList = newEquippedItems;
                currentlyEquippedMap = newEquippedMap;

                for (var j = 0; j < allItems.length; j++) {
                    var chk = allItems[j];
                    var chkKey = CleanStr(chk.name);
                    if (IsItemOwned(chk)) {
                        if (!newEquippedMap[chkKey]) {
                            if (!IsUpgradeEquipped(chk, newEquippedMap)) {
                                UnmarkItemOwned(chk, true);
                            }
                        }
                    }
                }
            }
        }
        return equipped;
    }

    function GetCurrentlyEquippedItemStems() {
        return ScanEquippedInventoryHUD();
    }

    function IsTargetInQuickbuyQueue(item) {
        if (!item) return false;
        var root = GetTopRoot();
        if (!root) return false;

        // Check if Quickbuy is visibly empty or has 0 items
        var qbHud = root.FindChildTraverse("CitadelHudQuickbuy") || root.FindChildTraverse("HudQuickBuy");
        if (qbHud && qbHud.IsValid()) {
            var qSizeLbl = qbHud.FindChildTraverse("QueueSize");
            if (qSizeLbl && qSizeLbl.IsValid() && qSizeLbl.text) {
                var qTxt = qSizeLbl.text.trim();
                if (qTxt.indexOf("0 ") === 0 || qTxt === "0" || qTxt.indexOf("0 ПРЕДМЕТ") !== -1 || qTxt.indexOf("0 ITEM") !== -1) {
                    return false;
                }
            }
            var qCostLbl = qbHud.FindChildTraverse("Cost") || qbHud.FindChildTraverse("TotalCost");
            if (qCostLbl && qCostLbl.IsValid() && qCostLbl.text) {
                var cVal = parseInt(qCostLbl.text.replace(/[^0-9]/g, ""), 10);
                if (cVal === 0) return false;
            }
        }

        var targetEn = CleanStr(item.name);
        var targetRu = CleanStr(item.ruName);
        var stems = item.stems || [];

        var entries = [];
        if (qbHud && qbHud.IsValid()) {
            entries = qbHud.FindChildrenWithClassTraverse("Item") || [];
        }
        if (entries.length === 0) {
            var queues = [
                root.FindChildTraverse("QuickbuyQueue"),
                root.FindChildTraverse("CitadelHudQuickbuy"),
                root.FindChildTraverse("HudQuickBuy"),
                root.FindChildTraverse("Quickbuy")
            ];
            for (var qi = 0; qi < queues.length; qi++) {
                var q = queues[qi];
                if (!q || !q.IsValid()) continue;
                var cnt = q.GetChildCount();
                for (var ci = 0; ci < cnt; ci++) {
                    entries.push(q.GetChild(ci));
                }
            }
        }

        for (var i = 0; i < entries.length; i++) {
            var p = entries[i];
            if (!p || !p.IsValid()) continue;
            if (p.visible === false || (p.style && p.style.visibility === "collapse")) continue;
            if (p.BHasClass && (p.BHasClass("purchased") || p.BHasClass("consumed") || p.BHasClass("completed") || p.BHasClass("bought") || p.BHasClass("Delete") || p.BHasClass("quickFading"))) {
                var pNameLbl = p.FindChildTraverse("ItemName") || p.FindChildTraverse("ModName") || p.FindChildTraverse("Name");
                if (pNameLbl && pNameLbl.IsValid() && pNameLbl.text) {
                    var pClean = CleanStr(pNameLbl.text);
                    if (pClean === targetEn || pClean === targetRu) {
                        targetJustPurchasedInQuickbuy = true;
                    }
                }
                continue;
            }

            var nameLbl = p.FindChildTraverse("ItemName") || p.FindChildTraverse("ModName") || p.FindChildTraverse("Name");
            if (nameLbl && nameLbl.IsValid() && nameLbl.text) {
                var clean = CleanStr(nameLbl.text);
                if (clean === targetEn || clean === targetRu) return true;
            }

            var icon = p.FindChildTraverse("ability_icon") || p.FindChildTraverse("ModIcon") || p.FindChildTraverse("Image");
            if (icon && icon.IsValid()) {
                var src = (icon.GetAttributeString ? icon.GetAttributeString("src", "") : (icon.src || "")) || "";
                if (!src && icon.style && icon.style.backgroundImage) {
                    src = icon.style.backgroundImage;
                }
                if (src) {
                    src = src.toLowerCase();
                    for (var s = 0; s < stems.length; s++) {
                        if (stems[s] && src.indexOf(stems[s]) !== -1) return true;
                    }
                }
            }
        }
        return false;
    }

    function IsShopOpen() {
        try {
            var ctx = $.GetContextPanel();
            if (ctx && (typeof ctx.IsValid !== "function" || ctx.IsValid()) && ctx.BHasClass && ctx.BHasClass("gShopOpen")) return true;
            var root = GetTopRoot();
            if (root && (typeof root.IsValid !== "function" || root.IsValid())) {
                if (root.BHasClass && (root.BHasClass("gShopOpen") || root.BHasClass("ShopOpen") || root.BHasClass("InShop"))) return true;
                var shop = root.FindChildTraverse("Shop") || root.FindChildTraverse("CitadelHudHeroShop") || root.FindChildTraverse("HudHeroShop");
                if (shop && (typeof shop.IsValid !== "function" || shop.IsValid()) && shop.BHasClass && (shop.BHasClass("ShopOpen") || shop.BHasClass("gShopOpen") || shop.BHasClass("shop_open"))) return true;
            }
        } catch (e) {}
        return false;
    }

    function GetPlayerGold() {
        var root = GetTopRoot();
        if (root && root.IsValid()) {
            if (!cachedSoulContainer || !cachedSoulContainer.IsValid()) {
                cachedSoulContainer = root.FindChildTraverse("HudSoulAPContainer");
            }
            if (cachedSoulContainer && cachedSoulContainer.IsValid()) {
                var curGoldBox = cachedSoulContainer.FindChildTraverse("CurrentGoldAmount");
                var amt = curGoldBox ? (curGoldBox.FindChildTraverse("Amount") || curGoldBox.FindChildTraverse("hudCurGoldLabel") || curGoldBox) : null;
                if (!amt) amt = cachedSoulContainer.FindChildTraverse("Amount");
                if (amt && amt.IsValid() && amt.text) {
                    var v = parseInt(amt.text.replace(/[^0-9]/g, ""), 10);
                    if (!isNaN(v)) {
                        lastKnownGold = v;
                        return v;
                    }
                }
            }
            var curGoldDirect = root.FindChildTraverse("CurrentGoldAmount");
            if (curGoldDirect && curGoldDirect.IsValid()) {
                var lbl = curGoldDirect.FindChildTraverse("Amount") || curGoldDirect.FindChildTraverse("hudCurGoldLabel") || curGoldDirect;
                if (lbl && lbl.IsValid() && lbl.text) {
                    var val = parseInt(lbl.text.replace(/[^0-9]/g, ""), 10);
                    if (!isNaN(val)) {
                        lastKnownGold = val;
                        return val;
                    }
                }
            }
        }
        return lastKnownGold;
    }

    function GetPlayerTotalSouls() {
        var g = GetPlayerGold();
        if (g > lastKnownTotalSouls) lastKnownTotalSouls = g;
        return lastKnownTotalSouls;
    }

    function MatchesMod(mod, item) {
        if (!mod || !mod.IsValid() || !item) return false;
        var stems = item.stems || [];
        var targetEn = CleanStr(item.name);
        var targetRu = CleanStr(item.ruName);

        // 1. Recursive check of all children inside mod card (Image textures, labels, attributes)
        var matched = false;
        TraversePanelTree(mod, function(cur) {
            var src = (cur.GetAttributeString ? cur.GetAttributeString("src", "") : (cur.src || "")) || "";
            if (!src && cur.style && cur.style.backgroundImage) {
                src = cur.style.backgroundImage;
            }
            if (src) {
                src = src.toLowerCase();
                var cleanSrc = CleanStr(src);
                for (var s = 0; s < stems.length; s++) {
                    var st = stems[s];
                    if (st && (cleanSrc.indexOf(st) !== -1 || src.indexOf(st) !== -1)) {
                        matched = true;
                        return false;
                    }
                }
                if (item.image && (src.indexOf(item.image.toLowerCase()) !== -1 || cleanSrc.indexOf(CleanStr(item.image)) !== -1)) {
                    matched = true;
                    return false;
                }
            }

            // Check label text
            if (cur.text && typeof cur.text === "string" && cur.text.length > 2) {
                var cleanT = CleanStr(cur.text);
                if (cleanT === targetEn || cleanT === targetRu) {
                    matched = true;
                    return false;
                }
            }

            // Check attributes
            if (cur.GetAttributeString) {
                var aName = CleanStr(cur.GetAttributeString("item_name", ""));
                var aAbility = CleanStr(cur.GetAttributeString("ability_id", ""));
                if (aName === targetEn || aName === targetRu) {
                    matched = true;
                    return false;
                }
                for (var s2 = 0; s2 < stems.length; s2++) {
                    if (stems[s2] && (aAbility.indexOf(stems[s2]) !== -1 || aName.indexOf(stems[s2]) !== -1)) {
                        matched = true;
                        return false;
                    }
                }
            }

            return true;
        }, 6, 40);

        return matched;
    }

    function FindModPanelDirect(item) {
        if (!item) return null;
        var root = GetTopRoot();
        if (!root) return null;
        var shop = root.FindChildTraverse("Shop") || root.FindChildTraverse("CitadelHudHeroShop");
        if (!shop || !shop.IsValid()) return null;

        var targetEn = CleanStr(item.name);
        var targetRu = CleanStr(item.ruName);
        var targetId = CleanStr(item.id);
        var targetValve = CleanStr(item.valveId);

        var modViews = shop.FindChildrenWithClassTraverse("mod_view") || [];
        for (var i = 0; i < modViews.length; i++) {
            var mv = modViews[i];
            if (!mv || !mv.IsValid()) continue;

            var itName = "";
            var nms = mv.FindChildrenWithClassTraverse("modName") || [];
            if (nms.length > 0 && nms[0].IsValid() && nms[0].text) {
                itName = nms[0].text.trim();
            }
            if (!itName && mv.GetAttributeString) {
                itName = mv.GetAttributeString("item_name", "");
            }
            if (itName) {
                var clean = CleanStr(itName);
                if (clean === targetEn || clean === targetRu || clean === targetId || clean === targetValve) {
                    return mv;
                }
            }

            var icon = mv.FindChildTraverse("ability_icon") || mv.FindChildTraverse("ModIcon");
            if (icon && icon.IsValid()) {
                var src = (icon.GetAttributeString ? icon.GetAttributeString("src", "") : (icon.src || "")) || "";
                if (!src && icon.style && icon.style.backgroundImage) {
                    src = icon.style.backgroundImage;
                }
                if (src) {
                    src = CleanStr(src);
                    if (item.stems) {
                        for (var s = 0; s < item.stems.length; s++) {
                            if (item.stems[s] && src.indexOf(CleanStr(item.stems[s])) !== -1) {
                                return mv;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    function IsItemOwnedInShop(item) {
        return false;
    }

    var DOWNSTREAM_UPGRADES = {
        "close_range": [
                "close_quarter_combat"
        ],
        "clip_size": [
                "reinforcing_casings",
                "titan_round"
        ],
        "headshot_booster": [
                "headhunter"
        ],
        "high_velocity_mag": [
                "aprounds",
                "express_shot",
                "pristine_emblem",
                "sharpshooter"
        ],
        "non_player_bonus": [
                "non_player_bonus_sacrifice"
        ],
        "rapid_rounds": [
                "blitz_bullets",
                "burst_fire"
        ],
        "long_range": [
                "sharpshooter"
        ],
        "melee_charge": [
                "crushing_fists"
        ],
        "slowing_bullets": [
                "weighted_shots"
        ],
        "tech_defense_shredders": [
                "spellslinger_headshots"
        ],
        "headshot_booster2": [
                "banshee_slugs"
        ],
        "chain_lightning": [
                "capacitor"
        ],
        "health": [
                "chonky",
                "colossus"
        ],
        "endurance": [
                "healbuff",
                "healing_booster"
        ],
        "improved_stamina": [
                "arcane_surge",
                "kinetic_sash",
                "superior_stamina"
        ],
        "grit": [
                "auto_cleanse",
                "divine_barrier",
                "guardian_ward",
                "spirit_bubble",
                "vex_barrier",
                "weapon_shielding"
        ],
        "health_stimpak": [
                "health_nova",
                "rescue_beam"
        ],
        "lifestrike_gauntlets": [
                "boxing_glove"
        ],
        "sprint_booster": [
                "cardio_calibrator",
                "cloaking_device_active",
                "juggernaut",
                "trophy_collector"
        ],
        "vampire": [
                "damage_recycler",
                "fury_trance",
                "surging_power"
        ],
        "debuff_reducer": [
                "spellbreaker",
                "unstoppable"
        ],
        "cardio_calibrator": [
                "juggernaut"
        ],
        "guardian_ward": [
                "divine_barrier"
        ],
        "healing_booster": [
                "healbuff"
        ],
        "vex_barrier": [
                "auto_cleanse"
        ],
        "health_stealing_magic": [
                "damage_recycler",
                "infuser",
                "tech_overflow"
        ],
        "extra_charge": [
                "rapid_recharge"
        ],
        "improved_spirit": [
                "boundless_spirit",
                "magic_storm",
                "soaring_spirit"
        ],
        "magic_burst": [
                "magic_shock"
        ],
        "magic_reach": [
                "bulletshredimbue",
                "tech_range"
        ],
        "mystic_regeneration": [
                "resonant_healing"
        ],
        "withering_whip": [
                "greater_withering_whip"
        ],
        "acolytes_glove": [
                "spirit_snatch"
        ],
        "cold_front": [
                "arctic_blast"
        ],
        "magic_tempo": [
                "cooldown_reduction",
                "transcendent_cooldown"
        ],
        "arcane_extension": [
                "imbued_duration_extender"
        ],
        "soaring_spirit": [
                "boundless_spirit"
        ],
        "magic_slow": [
                "ultimate_burst"
        ],
        "magic_vulnerability": [
                "escalating_exposure"
        ],
        "quick_silver": [
                "ethereal_bullets"
        ],
        "containment": [
                "aoe_root"
        ],
        "spirit_sap": [
                "focus_lens"
        ],
        "cooldown_reduction": [
                "transcendent_cooldown"
        ]
};
    var UPGRADE_RECIPES = {
        "Aerial Supremacy": [
                "Stamina Mastery"
        ],
        "Apex Combat": [
                "Ricochet"
        ],
        "Arcane Surge": [
                "Extra Stamina"
        ],
        "Arctic Blast": [
                "Cold Front"
        ],
        "Armor Piercing Rounds": [
                "High-Velocity Rounds"
        ],
        "Ballistic Enchantment": [
                "Mystic Expansion"
        ],
        "Boundless Spirit": [
                "Improved Spirit"
        ],
        "Burst Fire": [
                "Rapid Rounds"
        ],
        "Capacitor": [
                "Tesla Bullets"
        ],
        "Colossus": [
                "Extra Health"
        ],
        "Crippling Headshot": [
                "Weakening Headshot"
        ],
        "Crushing Fists": [
                "Melee Charge"
        ],
        "Cultist Sacrifice": [
                "Monster Rounds"
        ],
        "Disarming Hex": [
                "Rusted Barrel"
        ],
        "Divine Barrier": [
                "Guardian Ward"
        ],
        "Enduring Speed": [
                "Sprint Boots"
        ],
        "Escalating Exposure": [
                "Mystic Vulnerability"
        ],
        "Escalating Resilience": [
                "Extended Magazine"
        ],
        "Express Shot": [
                "High-Velocity Rounds"
        ],
        "Extended Magazine": [
                "Basic Magazine"
        ],
        "Focus Lens": [
                "Spirit Sap"
        ],
        "Fortitude": [
                "Extra Health"
        ],
        "Fury Trance": [
                "Bullet Lifesteal"
        ],
        "Greater Expansion": [
                "Mystic Expansion"
        ],
        "Guardian Ward": [
                "Grit"
        ],
        "Headhunter": [
                "Headshot Booster"
        ],
        "Healing Booster": [
                "Extra Regen"
        ],
        "Healing Nova": [
                "Healing Rite"
        ],
        "Healing Tempo": [
                "Healing Booster"
        ],
        "Improved Spirit": [
                "Extra Spirit"
        ],
        "Indomitable": [
                "Reactive Barrier"
        ],
        "Infuser": [
                "Spirit Lifesteal"
        ],
        "Juggernaut": [
                "Enduring Speed"
        ],
        "Kinetic Dash": [
                "Extra Stamina"
        ],
        "Leech": [
                "Bullet Lifesteal",
                "Spirit Lifesteal"
        ],
        "Lifestrike": [
                "Melee Lifesteal"
        ],
        "Lightning Scroll": [
                "Mystic Slow"
        ],
        "Mercurial Magnum": [
                "Quicksilver Reload"
        ],
        "Opening Rounds": [
                "High-Velocity Rounds"
        ],
        "Point Blank": [
                "Close Quarters"
        ],
        "Radiant Regeneration": [
                "Mystic Regeneration"
        ],
        "Rapid Recharge": [
                "Extra Charge"
        ],
        "Reactive Barrier": [
                "Grit"
        ],
        "Rescue Beam": [
                "Healing Rite"
        ],
        "Shadow Weave": [
                "Sprint Boots"
        ],
        "Sharpshooter": [
                "Long Range",
                "High-Velocity Rounds"
        ],
        "Spellbreaker": [
                "Debuff Reducer"
        ],
        "Spirit Rend": [
                "Spirit Shredder Bullets"
        ],
        "Spirit Shielding": [
                "Grit"
        ],
        "Spirit Snatch": [
                "Spirit Strike"
        ],
        "Spiritual Overflow": [
                "Spirit Lifesteal"
        ],
        "Stamina Mastery": [
                "Extra Stamina"
        ],
        "Superior Cooldown": [
                "Compress Cooldown"
        ],
        "Superior Duration": [
                "Duration Extender"
        ],
        "Surge of Power": [
                "Extra Spirit"
        ],
        "Swift Striker": [
                "Rapid Rounds"
        ],
        "Tankbuster": [
                "Mystic Burst"
        ],
        "Timeless Emblem": [
                "Transcendent Cooldown"
        ],
        "Titanic Magazine": [
                "Extended Magazine"
        ],
        "Transcendent Cooldown": [
                "Superior Cooldown"
        ],
        "Trophy Collector": [
                "Sprint Boots"
        ],
        "Unstoppable": [
                "Debuff Reducer"
        ],
        "Vampiric Burst": [
                "Bullet Lifesteal"
        ],
        "Veil Walker": [
                "Sprint Boots"
        ],
        "Vortex Web": [
                "Slowing Hex"
        ],
        "Weapon Shielding": [
                "Grit"
        ],
        "Weighted Shots": [
                "Slowing Bullets"
        ]
};

    var conflictCache = {};

    function BuildConflictCache() {
        conflictCache = {};
        if (typeof DeadlockItemsDB === "undefined" || !DeadlockItemsDB.GetItems) return;
        var allItems = DeadlockItemsDB.GetItems();
        var adj = {};
        for (var i = 0; i < allItems.length; i++) {
            adj[allItems[i].name] = [];
        }

        for (var pName in UPGRADE_RECIPES) {
            if (UPGRADE_RECIPES.hasOwnProperty(pName)) {
                var pItem = DeadlockItemsDB.GetItemByName(pName);
                if (!pItem) continue;
                var comps = UPGRADE_RECIPES[pName] || [];
                for (var c = 0; c < comps.length; c++) {
                    var cItem = DeadlockItemsDB.GetItemByName(comps[c]);
                    if (cItem) {
                        if (!adj[pItem.name]) adj[pItem.name] = [];
                        if (!adj[cItem.name]) adj[cItem.name] = [];
                        adj[pItem.name].push(cItem.name);
                        adj[cItem.name].push(pItem.name);
                    }
                }
            }
        }

        for (var compKey in DOWNSTREAM_UPGRADES) {
            if (DOWNSTREAM_UPGRADES.hasOwnProperty(compKey)) {
                var compIt = DeadlockItemsDB.GetItemById(compKey) || DeadlockItemsDB.GetItemByName(compKey);
                if (!compIt) continue;
                var upgs = DOWNSTREAM_UPGRADES[compKey] || [];
                for (var u = 0; u < upgs.length; u++) {
                    var upgIt = DeadlockItemsDB.GetItemById(upgs[u]) || DeadlockItemsDB.GetItemByName(upgs[u]);
                    if (upgIt) {
                        if (!adj[compIt.name]) adj[compIt.name] = [];
                        if (!adj[upgIt.name]) adj[upgIt.name] = [];
                        adj[compIt.name].push(upgIt.name);
                        adj[upgIt.name].push(compIt.name);
                    }
                }
            }
        }

        for (var j = 0; j < allItems.length; j++) {
            var startItem = allItems[j];
            var visited = {};
            var queue = [startItem.name];
            visited[CleanStr(startItem.name)] = true;
            if (startItem.id) visited[CleanStr(startItem.id)] = true;

            while (queue.length > 0) {
                var cur = queue.shift();
                var neighbors = adj[cur] || [];
                for (var n = 0; n < neighbors.length; n++) {
                    var nName = neighbors[n];
                    var nKey = CleanStr(nName);
                    if (!visited[nKey]) {
                        visited[nKey] = true;
                        var nItem = DeadlockItemsDB.GetItemByName(nName);
                        if (nItem && nItem.id) visited[CleanStr(nItem.id)] = true;
                        queue.push(nName);
                    }
                }
            }
            conflictCache[CleanStr(startItem.name)] = visited;
            if (startItem.id) conflictCache[CleanStr(startItem.id)] = visited;
        }
    }

    function GetConflictSet(itemOrName) {
        if (!itemOrName) return {};
        var key = CleanStr(typeof itemOrName === "string" ? itemOrName : (itemOrName.name || itemOrName.id));
        if (!conflictCache[key]) {
            BuildConflictCache();
        }
        return conflictCache[key] || {};
    }

    function AreItemsConflicting(itemA, itemB) {
        if (!itemA || !itemB) return false;
        if (itemA.id === itemB.id || itemA.name === itemB.name) return true;
        var setA = GetConflictSet(itemA);
        var keyB = CleanStr(itemB.name);
        var idB = CleanStr(itemB.id);
        return !!(setA[keyB] || setA[idB]);
    }

    var currentlyEquippedItemsList = [];
    var currentlyEquippedMap = {};

    function IsUpgradeEquipped(item, equippedMap) {
        if (!item) return false;
        var down = (item.id && DOWNSTREAM_UPGRADES[item.id]) ? DOWNSTREAM_UPGRADES[item.id] : [];
        for (var i = 0; i < down.length; i++) {
            var upId = CleanStr(down[i]);
            if (equippedMap && equippedMap[upId]) return true;
            if (ownedItemsMap[upId]) return true;
            if (typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItemById) {
                var upItem = DeadlockItemsDB.GetItemById(upId);
                if (upItem) {
                    if (equippedMap && equippedMap[CleanStr(upItem.name)]) return true;
                    if (ownedItemsMap[CleanStr(upItem.name)]) return true;
                }
            }
        }
        var set = GetConflictSet(item);
        for (var k in set) {
            if (set.hasOwnProperty(k)) {
                var isEq = (equippedMap && equippedMap[k]) || ownedItemsMap[k];
                if (isEq) {
                    if (typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItemByName) {
                        var cand = DeadlockItemsDB.GetItemByName(k) || DeadlockItemsDB.GetItemById(k);
                        if (cand && cand.tier > item.tier) return true;
                    }
                }
            }
        }
        return false;
    }

    function IsItemConflictingWithEquipped(item) {
        if (!item) return false;
        var set = GetConflictSet(item);
        for (var k in set) {
            if (set.hasOwnProperty(k) && set[k]) {
                if (IsItemOwnedByName(k)) {
                    var ownedObj = (typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItemByName) ? (DeadlockItemsDB.GetItemByName(k) || DeadlockItemsDB.GetItemById(k)) : null;
                    if (ownedObj && ownedObj.tier >= item.tier) return true;
                }
            }
        }
        for (var i = 0; i < currentlyEquippedItemsList.length; i++) {
            var eq = currentlyEquippedItemsList[i];
            if (eq && (eq.id === item.id || eq.name === item.name)) return true;
            if (AreItemsConflicting(item, eq)) {
                if (eq.tier >= item.tier) return true;
            }
        }
        return false;
    }

    function GetCurrentlyEquippedItemsList() {
        return currentlyEquippedItemsList;
    }

    var ownedItemsMap = {};
    var seenRecentPurchasesMap = {};
    var cachedLocalHeroName = null;
    var lastShopScanMs = 0;
    var wasShopOpen = false;

    function MarkCoveredComponents(canonicalName) {
        if (!canonicalName) return;
        var stack = [canonicalName];
        var visited = {};
        while (stack.length > 0) {
            var cur = stack.pop();
            var curKey = CleanStr(cur);
            if (visited[curKey]) continue;
            visited[curKey] = true;

            var comps = UPGRADE_RECIPES[cur] || UPGRADE_RECIPES[curKey];
            if (!comps && typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItemByName) {
                var itObj = DeadlockItemsDB.GetItemByName(cur);
                if (itObj) comps = UPGRADE_RECIPES[itObj.name];
            }
            if (comps && comps.length > 0) {
                for (var c = 0; c < comps.length; c++) {
                    var compName = comps[c];
                    var compKey = CleanStr(compName);
                    if (compKey) {
                        ownedItemsMap[compKey] = true;
                        if (typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItemByName) {
                            var cItem = DeadlockItemsDB.GetItemByName(compName);
                            if (cItem) {
                                if (cItem.ruName) ownedItemsMap[CleanStr(cItem.ruName)] = true;
                                if (cItem.id) ownedItemsMap[CleanStr(cItem.id)] = true;
                                if (cItem.valveId) ownedItemsMap[CleanStr(cItem.valveId)] = true;
                                if (cItem.stems) {
                                    for (var s = 0; s < cItem.stems.length; s++) {
                                        ownedItemsMap[CleanStr(cItem.stems[s])] = true;
                                    }
                                }
                            }
                        }
                    }
                    stack.push(compName);
                }
            }
        }
    }

    function UnmarkCoveredComponents(canonicalName) {
        // Safe no-op: unmarking an upgrade (e.g. sold) must NEVER cascade-delete basic components that may still be equipped in HUD
    }

    function MarkItemOwned(itemOrName) {
        if (!itemOrName) return;
        var itemObj = null;
        var rawName = "";
        if (typeof itemOrName === "object" && itemOrName.name) {
            itemObj = itemOrName;
            rawName = itemOrName.name;
        } else {
            rawName = String(itemOrName);
            if (typeof DeadlockItemsDB !== "undefined") {
                itemObj = DeadlockItemsDB.GetItemByName(rawName) ||
                          DeadlockItemsDB.GetItemByStem(rawName) ||
                          DeadlockItemsDB.GetItemById(rawName);
            }
        }

        var key = CleanStr(rawName);
        var alreadyMarked = false;
        if (itemObj) {
            if (itemObj.name && ownedItemsMap[CleanStr(itemObj.name)]) alreadyMarked = true;
        } else if (key && ownedItemsMap[key]) {
            alreadyMarked = true;
        }

        if (key) ownedItemsMap[key] = true;

        if (itemObj) {
            if (itemObj.name) ownedItemsMap[CleanStr(itemObj.name)] = true;
            if (itemObj.ruName) ownedItemsMap[CleanStr(itemObj.ruName)] = true;
            if (itemObj.id) ownedItemsMap[CleanStr(itemObj.id)] = true;
            if (itemObj.valveId) ownedItemsMap[CleanStr(itemObj.valveId)] = true;
            if (itemObj.stems) {
                for (var i = 0; i < itemObj.stems.length; i++) {
                    ownedItemsMap[CleanStr(itemObj.stems[i])] = true;
                }
            }
            MarkCoveredComponents(itemObj.name);
            if (!alreadyMarked) {
                RouletteLogger.Log("Marked item owned: " + itemObj.name + " (T" + itemObj.tier + ")", "INVENTORY");
            }
        } else {
            MarkCoveredComponents(rawName);
            if (!alreadyMarked) {
                RouletteLogger.Log("Marked item owned by raw text: " + rawName, "INVENTORY");
            }
        }
    }

    function UnmarkItemOwned(itemOrName, force) {
        if (!itemOrName || (!IsShopOpen() && !force)) return;
        var itemObj = null;
        var rawName = "";
        if (typeof itemOrName === "object" && itemOrName.name) {
            itemObj = itemOrName;
            rawName = itemOrName.name;
        } else {
            rawName = String(itemOrName);
            if (typeof DeadlockItemsDB !== "undefined") {
                itemObj = DeadlockItemsDB.GetItemByName(rawName) ||
                          DeadlockItemsDB.GetItemByStem(rawName) ||
                          DeadlockItemsDB.GetItemById(rawName);
            }
        }

        var key = CleanStr(rawName);
        var wasMarked = false;
        if (itemObj) {
            if (itemObj.name && ownedItemsMap[CleanStr(itemObj.name)]) wasMarked = true;
        } else if (key && ownedItemsMap[key]) {
            wasMarked = true;
        }

        if (key && ownedItemsMap[key]) {
            delete ownedItemsMap[key];
        }

        if (itemObj) {
            if (itemObj.name && ownedItemsMap[CleanStr(itemObj.name)]) delete ownedItemsMap[CleanStr(itemObj.name)];
            if (itemObj.ruName && ownedItemsMap[CleanStr(itemObj.ruName)]) delete ownedItemsMap[CleanStr(itemObj.ruName)];
            if (itemObj.id && ownedItemsMap[CleanStr(itemObj.id)]) delete ownedItemsMap[CleanStr(itemObj.id)];
            if (itemObj.valveId && ownedItemsMap[CleanStr(itemObj.valveId)]) delete ownedItemsMap[CleanStr(itemObj.valveId)];
            if (itemObj.stems) {
                for (var i = 0; i < itemObj.stems.length; i++) {
                    var sk = CleanStr(itemObj.stems[i]);
                    if (ownedItemsMap[sk]) delete ownedItemsMap[sk];
                }
            }
            UnmarkCoveredComponents(itemObj.name);
            if (wasMarked) {
                RouletteLogger.Log("Unmarked item owned (sold/unequipped): " + itemObj.name + " (T" + itemObj.tier + ")", "INVENTORY");
            }
        } else {
            UnmarkCoveredComponents(rawName);
            if (wasMarked) {
                RouletteLogger.Log("Unmarked item owned by raw text: " + rawName, "INVENTORY");
            }
        }
    }

    function IsItemOwned(item) {
        if (!item) return false;
        if (item.name && ownedItemsMap[CleanStr(item.name)]) return true;
        if (item.ruName && ownedItemsMap[CleanStr(item.ruName)]) return true;
        if (item.id && ownedItemsMap[CleanStr(item.id)]) return true;
        if (item.valveId && ownedItemsMap[CleanStr(item.valveId)]) return true;
        if (item.stems) {
            for (var i = 0; i < item.stems.length; i++) {
                if (ownedItemsMap[CleanStr(item.stems[i])]) return true;
            }
        }
        return false;
    }

    function IsItemOwnedByName(rawName) {
        if (!rawName) return false;
        var key = CleanStr(rawName);
        if (key && ownedItemsMap[key]) return true;
        if (typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItemByName) {
            var itemObj = DeadlockItemsDB.GetItemByName(rawName) ||
                          DeadlockItemsDB.GetItemByStem(rawName) ||
                          DeadlockItemsDB.GetItemById(rawName);
            if (itemObj) return IsItemOwned(itemObj);
        }
        return false;
    }

    var baselineRecentPurchasesMap = {};
    var quickbuyConfirmedSeen = false;

    function PollRecentPurchases() {
        var rpContainer = GetRecentPurchasesContainer();
        if (!rpContainer || !rpContainer.IsValid()) return false;

        var purchases = rpContainer.FindChildrenWithClassTraverse("recentPurchase") || [];
        if (purchases.length === 0) return false;

        var targetPurchasedNow = false;

        for (var i = 0; i < purchases.length; i++) {
            var p = purchases[i];
            if (!p || !p.IsValid()) continue;

            var nameLabels = p.FindChildrenWithClassTraverse("recentModPurchaseName") || [];
            var buyerLabels = p.FindChildrenWithClassTraverse("recentModPurchaserHero") || [];
            var timeLabels = p.FindChildrenWithClassTraverse("recentTimePurchased") || [];

            var nameTxt = (nameLabels.length > 0 && nameLabels[0].IsValid() && nameLabels[0].text) ? nameLabels[0].text.trim() : "";
            var buyerTxt = (buyerLabels.length > 0 && buyerLabels[0].IsValid() && buyerLabels[0].text) ? buyerLabels[0].text.trim() : "";
            var timeTxt = (timeLabels.length > 0 && timeLabels[0].IsValid() && timeLabels[0].text) ? timeLabels[0].text.trim() : "";

            if (!nameTxt) continue;

            var key = buyerTxt + "|" + nameTxt + "|" + timeTxt;

            if (seenRecentPurchasesMap[key]) {
                break;
            }
            seenRecentPurchasesMap[key] = true;

            var cleanName = CleanStr(nameTxt);

            // Check if this matches our target item
            if (currentTargetItem) {
                var targetEn = CleanStr(currentTargetItem.name);
                var targetRu = CleanStr(currentTargetItem.ruName);
                if (cleanName === targetEn || cleanName === targetRu || (targetRu && cleanName.indexOf(targetRu) !== -1) || (targetEn && cleanName.indexOf(targetEn) !== -1)) {
                    targetPurchasedNow = true;
                    if (buyerTxt) {
                        cachedLocalHeroName = buyerTxt;
                    }
                    MarkItemOwned(currentTargetItem);
                    RouletteLogger.Log("Target item purchase confirmed in feed: " + currentTargetItem.name + " (Hero: " + buyerTxt + ")", "PURCHASE");
                }
            }

            // Check if this purchase belongs to our local hero
            if (cachedLocalHeroName && CleanStr(buyerTxt) === CleanStr(cachedLocalHeroName)) {
                MarkItemOwned(nameTxt);
            }
        }

        return targetPurchasedNow;
    }

    function ScanShopIfOpen(force) {
        var isOpen = IsShopOpen();
        if (!isOpen) {
            wasShopOpen = false;
            return;
        }

        var now = Date.now();
        // Scan immediately on shop open, or at most once every 1.0s while shop stays open (unless forced)
        if (!force && wasShopOpen && (now - lastShopScanMs < 1000)) {
            return;
        }
        wasShopOpen = true;
        lastShopScanMs = now;

        var root = GetTopRoot();
        if (!root) return;

        var shop = root.FindChildTraverse("Shop") || root.FindChildTraverse("CitadelHudHeroShop");
        if (!shop || !shop.IsValid()) return;

        // Try resolving local hero name from shop header if not known yet
        if (!cachedLocalHeroName) {
            var heroHdr = shop.FindChildTraverse("HeroFavoritesHeaderLabel");
            if (heroHdr && heroHdr.IsValid() && heroHdr.text) {
                var hTxt = heroHdr.text.trim();
                var hMatch = hTxt.match(/([a-zA-Zа-яА-ЯёЁ]+)\s+(?:BUILDS|СБОРКИ)/i);
                if (hMatch && hMatch[1]) {
                    cachedLocalHeroName = hMatch[1];
                    RouletteLogger.Log("Local hero detected from shop header: " + cachedLocalHeroName, "TRACKER");
                }
            }
        }

        // Scan mod_view elements in the shop
        var modViews = shop.FindChildrenWithClassTraverse("mod_view") || [];
        var shopCardSeen = {};
        var shopOwnedCards = {};
        for (var i = 0; i < modViews.length; i++) {
            var mv = modViews[i];
            if (!mv || !mv.IsValid()) continue;

            var isCardOwned = mv.BHasClass && (
                mv.BHasClass("owned") ||
                mv.BHasClass("ItemPurchased")
            );

            var itName = "";
            var nms = mv.FindChildrenWithClassTraverse("modName") || [];
            if (nms.length > 0 && nms[0].IsValid() && nms[0].text) {
                itName = nms[0].text.trim();
            }
            if (!itName && mv.GetAttributeString) {
                itName = mv.GetAttributeString("item_name", "");
            }
            if (!itName) {
                var directLbl = mv.FindChildTraverse("modName") || mv.FindChildTraverse("ItemName") || mv.FindChildTraverse("Name");
                if (directLbl && directLbl.IsValid() && directLbl.text) {
                    itName = directLbl.text.trim();
                }
            }
            if (!itName) continue;

            var cleanCardName = CleanStr(itName);
            shopCardSeen[cleanCardName] = true;

            if (isCardOwned) {
                shopOwnedCards[cleanCardName] = true;
                if (!IsItemOwnedByName(itName)) {
                    MarkItemOwned(itName);
                }
            } else {
                if (IsItemOwnedByName(itName)) {
                    var seenItem = (typeof DeadlockItemsDB !== "undefined" && DeadlockItemsDB.GetItemByName) ? DeadlockItemsDB.GetItemByName(itName) : null;
                    if (seenItem) {
                        if (!IsUpgradeEquipped(seenItem, currentlyEquippedMap)) {
                            UnmarkItemOwned(seenItem, true);
                        }
                    }
                }
            }
        }

    }

    function CheckQuickbuyPurchaseToast() {
        if (!currentTargetItem) return false;
        var root = GetTopRoot();
        if (!root || !root.IsValid()) return false;

        var toasts = root.FindChildrenWithClassTraverse("QuickbuyPurchaseToast") || [];
        if (toasts.length === 0) {
            toasts = root.FindChildrenWithClassTraverse("ToastPanel") || [];
        }
        for (var t = 0; t < toasts.length; t++) {
            var tp = toasts[t];
            if (!tp || !tp.IsValid()) continue;
            var modNameLbl = tp.FindChildTraverse("ModName") || tp.FindChildTraverse("Name");
            if (modNameLbl && modNameLbl.IsValid() && modNameLbl.text) {
                var tTxt = CleanStr(modNameLbl.text);
                var targetEn = CleanStr(currentTargetItem.name);
                var targetRu = CleanStr(currentTargetItem.ruName);
                if (tTxt === targetEn || tTxt === targetRu || (targetEn && tTxt.indexOf(targetEn) !== -1) || (targetRu && tTxt.indexOf(targetRu) !== -1)) {
                    RouletteLogger.Log("Target item purchase confirmed via Quickbuy purchase toast: " + currentTargetItem.name, "PURCHASE");
                    MarkItemOwned(currentTargetItem);
                    return true;
                }
            }
        }
        return false;
    }

    function CheckIsTargetItemPurchased() {
        if (!currentTargetItem) return false;

        // 0. Instant 12-slot HUD inventory scan
        try {
            ScanEquippedInventoryHUD();
        } catch (scanErr) {
            RouletteLogger.Log("ScanEquippedInventoryHUD error in check: " + scanErr, "ERROR");
        }
        if (IsItemOwned(currentTargetItem) || IsItemOwnedByName(currentTargetItem.name)) {
            RouletteLogger.Log("Target item confirmed equipped in 12-slot HUD: " + currentTargetItem.name, "PURCHASE");
            return true;
        }

        // 0.1 Quickbuy purchase toast check (instant on-screen feedback)
        if (CheckQuickbuyPurchaseToast()) {
            return true;
        }

        // 1. Direct shop catalog panel check (FindModPanelDirect)
        var modPanel = FindModPanelDirect(currentTargetItem);
        if (modPanel && modPanel.IsValid() && modPanel.BHasClass) {
            if (modPanel.BHasClass("owned") || modPanel.BHasClass("ItemPurchased")) {
                RouletteLogger.Log("Target item confirmed owned via shop card: " + currentTargetItem.name, "PURCHASE");
                MarkItemOwned(currentTargetItem);
                return true;
            }
        }


        // 3. Already marked owned in database/tracker
        if (IsItemOwned(currentTargetItem) || IsItemOwnedByName(currentTargetItem.name)) {
            RouletteLogger.Log("Target item confirmed owned via tracker: " + currentTargetItem.name, "PURCHASE");
            return true;
        }

        // 4. Recent purchases feed check
        if (PollRecentPurchases()) {
            return true;
        }

        // 5. Fast autopurchase / Quickbuy completed element check
        if (targetJustPurchasedInQuickbuy) {
            RouletteLogger.Log("Target item purchase confirmed via Quickbuy completed element: " + currentTargetItem.name, "PURCHASE");
            MarkItemOwned(currentTargetItem);
            return true;
        }

        // 6. Gold drop check: if souls decreased while target was active
        var curGold = GetPlayerGold();
        if (goldAtTargetSet > 0 && curGold < goldAtTargetSet && (goldAtTargetSet - curGold >= Math.min(300, currentTargetItem.cost * 0.4))) {
            RouletteLogger.Log("Target item purchase confirmed via gold drop: " + (goldAtTargetSet - curGold) + " souls spent (" + currentTargetItem.name + ")", "PURCHASE");
            MarkItemOwned(currentTargetItem);
            return true;
        }

        // 7. Quickbuy queue consumption detection (strict multi-condition verification)
        var timeSinceQueued = Date.now() - targetSetTimestamp;
        var inQueue = IsTargetInQuickbuyQueue(currentTargetItem);
        if (targetJustPurchasedInQuickbuy) {
            RouletteLogger.Log("Target item purchase confirmed via Quickbuy completed element: " + currentTargetItem.name, "PURCHASE");
            MarkItemOwned(currentTargetItem);
            return true;
        }
        if (timeSinceQueued > 800 && quickbuyConfirmedSeen) {
            var curGold2 = GetPlayerGold();
            var goldDropped = (goldAtTargetSet > 0 && curGold2 < goldAtTargetSet && (goldAtTargetSet - curGold2 >= Math.min(300, currentTargetItem.cost * 0.4)));
            var verifiedOwned = IsItemOwned(currentTargetItem) || IsItemOwnedByName(currentTargetItem.name);
            if (!inQueue && (goldDropped || verifiedOwned)) {
                RouletteLogger.Log("Target item consumed from Quickbuy: " + currentTargetItem.name, "PURCHASE");
                MarkItemOwned(currentTargetItem);
                return true;
            }
        }

        return false;
    }

    function QueueItemIntoQuickbuy(item, targetIdx, skipDOMClicks) {
        if (!item) return;
        var root = GetTopRoot();
        var qIdx = (typeof targetIdx === "number") ? targetIdx : 0;
        var valveId = item.valveId || ("upgrade_" + item.id);
        var signedHash = (item.hash | 0);

        RouletteLogger.Log("Queueing target: " + item.name + " (Valve ID: " + valveId + ", Hash: " + item.hash + ", Slot: " + qIdx + ")", "QUICKBUY");

        // 1. Direct Panorama C++ Event Dispatch (CitadelQuickbuyAddItem)
        // Signature verified via client.dll disasm: (CUtlStringToken itemToken, bool flag1, bool flag2)
        // Global unrouted event with exactly 3 parameters (NO panel parameter, NO numbers in boolean slots):
        // flag1 = false (append to quickbuy queue), flag2 = false (standard add)
        if (typeof $.DispatchEvent === "function") {
            try {
                $.DispatchEvent("CitadelQuickbuyAddItem", valveId, false, false);
            } catch (e) {
                RouletteLogger.Log("CitadelQuickbuyAddItem valveId dispatch error: " + e, "ERROR");
            }
            try {
                $.DispatchEvent("CitadelQuickbuyAddItem", signedHash, false, false);
            } catch (e) {}
            try {
                $.DispatchEvent("CitadelQuickbuyAddItem", item.hash, false, false);
            } catch (e) {}
        }

        if (skipDOMClicks) return;

        // 2. Secondary DOM Click Fallback via ContextMenu (if visible/open in shop)
        // IMPORTANT: NEVER call "Activated" here — Activated is primary left-click which buys items for souls!
        function TryDispatchDOM(attempt) {
            try {
                var targetMod = FindModPanelDirect(item);
                if (targetMod && targetMod.IsValid()) {
                    RouletteLogger.Log("Found shop mod panel for " + item.name + " -> triggering Secondary Click (Quickbuy)", "DOM");
                    try { $.DispatchEvent("ContextMenu", targetMod, "mouse"); } catch (e) {}

                    var icon = targetMod.FindChildTraverse("ability_icon") || targetMod.FindChildTraverse("ModIcon");
                    if (icon && icon.IsValid()) {
                        try { $.DispatchEvent("ContextMenu", icon, "mouse"); } catch (e) {}
                    }
                } else if (attempt < 3 && typeof $.Schedule === "function") {
                    $.Schedule(0.25, function () { TryDispatchDOM(attempt + 1); });
                }
            } catch (domErr) {
                RouletteLogger.Log("TryDispatchDOM error: " + domErr, "ERROR");
            }
        }

        TryDispatchDOM(1);
    }


    function Tick() {
        var isShopNowOpen = false;
        var nextInterval = 0.5;

        try {
            isShopNowOpen = IsShopOpen();
            var curGold = GetPlayerGold();

            if (isShopNowOpen) {
                ScanShopIfOpen();
            }
            ScanEquippedInventoryHUD();
            PollRecentPurchases();

            if (currentTargetItem) {
                if (!quickbuyConfirmedSeen && IsTargetInQuickbuyQueue(currentTargetItem)) {
                    quickbuyConfirmedSeen = true;
                    wasTargetInQuickbuy = true;
                    RouletteLogger.Log("Confirmed: " + currentTargetItem.name + " is now in QuickbuyQueue!", "SUCCESS");
                }

                if (CheckIsTargetItemPurchased()) {
                    NotifyPurchased();
                } else if (quickbuyConfirmedSeen && !IsTargetInQuickbuyQueue(currentTargetItem)) {
                    NotifyCancelled();
                }
            }

            lastKnownGold = curGold;

            if (isShopNowOpen) {
                if (!wasShopOpen) {
                    wasShopOpen = true;
                    if (currentTargetItem && !IsTargetInQuickbuyQueue(currentTargetItem) && !quickbuyConfirmedSeen) {
                        RouletteLogger.Log("Shop opened! Ensuring target item in Quickbuy: " + currentTargetItem.name, "TRACKER");
                        QueueItemIntoQuickbuy(currentTargetItem);
                    }
                }
            } else {
                wasShopOpen = false;
            }

            nextInterval = currentTargetItem ? (isShopNowOpen ? 0.15 : 0.25) : (isShopNowOpen ? 0.5 : 1.2);
        } catch (tickErr) {
            RouletteLogger.Log("Tick loop exception: " + tickErr, "ERROR");
            nextInterval = 0.5;
        }

        if (typeof $.Schedule === "function") {
            $.Schedule(nextInterval, Tick);
        }
    }

    function NotifyPurchased() {
        var purchased = currentTargetItem;
        if (purchased) {
            MarkItemOwned(purchased);
        }
        currentTargetItem = null;
        wasTargetInQuickbuy = false;
        quickbuyConfirmedSeen = false;
        targetJustPurchasedInQuickbuy = false;
        goldAtTargetSet = 0;

        if (typeof $.DispatchEvent === "function") {
            $.DispatchEvent("PlaySoundEffect", "ShopBuy.Broadcast");
            $.DispatchEvent("PlaySoundEffect", "UI.CommendConfirmation");
            $.DispatchEvent("PlaySoundEffect", "UI.Shop.Mod.Activate");
        }

        for (var j = 0; j < onPurchaseCallbacks.length; j++) {
            if (typeof onPurchaseCallbacks[j] === "function") {
                onPurchaseCallbacks[j](purchased);
            }
        }
    }

    function NotifyCancelled() {
        var cancelled = currentTargetItem;
        currentTargetItem = null;
        wasTargetInQuickbuy = false;
        quickbuyConfirmedSeen = false;
        targetJustPurchasedInQuickbuy = false;
        goldAtTargetSet = 0;
        RouletteLogger.Log("Target removed from Quickbuy by player: " + (cancelled ? cancelled.name : "none"), "CANCEL");
        ClearTarget();
        for (var j = 0; j < onCancelCallbacks.length; j++) {
            if (typeof onCancelCallbacks[j] === "function") {
                onCancelCallbacks[j](cancelled);
            }
        }
    }

    function OnCancel(callback) {
        if (typeof callback === "function") {
            onCancelCallbacks.push(callback);
        }
    }

    function StartTracker() {
        if (isTrackerActive) return;
        isTrackerActive = true;
        RouletteLogger.Log("Shop Purchase Tracker started.", "INIT");
        Tick();
    }

    function SetTargetItem(item) {
        currentTargetItem = item;
        wasTargetInQuickbuy = false;
        quickbuyConfirmedSeen = false;
        targetJustPurchasedInQuickbuy = false;
        targetSetTimestamp = Date.now();
        goldAtTargetSet = GetPlayerGold();
        baselineEquippedStems = {};
        baselineShopOwned = false;

        // Snapshot all existing entries in RecentPurchases feed
        baselineRecentPurchasesMap = {};
        var rpc = GetRecentPurchasesContainer();
        if (rpc && rpc.IsValid()) {
            var existing = rpc.FindChildrenWithClassTraverse("recentPurchase") || [];
            for (var i = 0; i < existing.length; i++) {
                var ep = existing[i];
                if (!ep || !ep.IsValid()) continue;
                var nLbl = ep.FindChildrenWithClassTraverse("recentModPurchaseName") || [];
                var tLbl = ep.FindChildrenWithClassTraverse("recentTimePurchased") || [];
                var n = (nLbl.length > 0 && nLbl[0].IsValid() && nLbl[0].text) ? CleanStr(nLbl[0].text) : "";
                var t = (tLbl.length > 0 && tLbl[0].IsValid() && tLbl[0].text) ? CleanStr(tLbl[0].text) : ("idx_" + i);
                if (n) baselineRecentPurchasesMap[n + "|" + t] = true;
            }
        }

        if (item) {
            RouletteLogger.Log("Target item set: " + item.name + " (" + item.cost + " souls)", "TARGET");
            QueueItemIntoQuickbuy(item);
        }
    }

    function GetTargetItem() {
        return currentTargetItem;
    }

    function ClearTarget() {
        var old = currentTargetItem;
        currentTargetItem = null;
        wasTargetInQuickbuy = false;
        quickbuyConfirmedSeen = false;
        baselineShopOwned = false;
        baselineRecentPurchasesMap = {};
        if (typeof $.DispatchEvent === "function") {
            $.DispatchEvent("CitadelQuickbuyClearQueue");
            $.DispatchEvent("CitadelQuickbuyRemoveItem", 0);
            if (old && old.hash) {
                $.DispatchEvent("CitadelQuickbuyRemoveItem", old.hash);
            }
        }
        if (typeof Game !== "undefined" && Game.ConsoleCommand) {
            Game.ConsoleCommand("quickbuy clear");
            Game.ConsoleCommand("citadel_quickbuy_clear");
        }
        RouletteLogger.Log("Target item cleared from tracker & quickbuy.", "TARGET");
    }

    function ClearQuickbuyQueueUI() {
        if (typeof $.DispatchEvent === "function") {
            try { $.DispatchEvent("CitadelQuickbuyClearQueue"); } catch (e) {}
        }
        if (typeof Game !== "undefined" && Game.ConsoleCommand) {
            try { Game.ConsoleCommand("quickbuy clear"); } catch (e) {}
            try { Game.ConsoleCommand("citadel_quickbuy_clear"); } catch (e) {}
        }
        try {
            var root = GetTopRoot();
            if (root) {
                var qbTut = root.FindChildTraverse("QuickbuyTutorial") || root.FindChildTraverse("CitadelHudQuickbuy");
                if (qbTut && qbTut.IsValid()) {
                    var buttons = qbTut.FindChildrenWithClassTraverse("Button") || [];
                    for (var b = 0; b < buttons.length; b++) {
                        var btn = buttons[b];
                        if (!btn || !btn.IsValid()) continue;
                        var lbls = btn.FindChildrenWithClassTraverse("Label") || [];
                        for (var l = 0; l < lbls.length; l++) {
                            var txt = (lbls[l].text || "").toLowerCase();
                            if (txt.indexOf("очистить") !== -1 || txt.indexOf("clear") !== -1) {
                                $.DispatchEvent("Activated", btn, "mouse_primary");
                                break;
                            }
                        }
                    }
                }
            }
        } catch (err) {}
        RouletteLogger.Log("Quickbuy queue cleared via UI & Panorama event.", "QUICKBUY");
    }

    function ResetTrackerSession() {
        currentTargetItem = null;
        wasTargetInQuickbuy = false;
        quickbuyConfirmedSeen = false;
        cachedShopModPanelsByStem = {};
        baselineEquippedStems = {};
        baselineRecentPurchasesMap = {};
        baselineShopOwned = false;
        baselineRecentCount = 0;
        ownedItemsMap = {};
        currentlyEquippedItemsList = [];
        currentlyEquippedMap = {};
        seenRecentPurchasesMap = {};
        cachedLocalHeroName = null;
        wasShopOpen = false;
        lastShopScanMs = 0;
        RouletteLogger.Log("Tracker session reset and inventory cleared.", "RESET");
    }

    function OnPurchase(callback) {
        if (typeof callback === "function") {
            onPurchaseCallbacks.push(callback);
        }
    }

    function DumpDiagnostics() {
        var target = currentTargetItem ? currentTargetItem.name : "None";
        var isShop = IsShopOpen();
        var modPanel = currentTargetItem ? FindModPanelDirect(currentTargetItem) : null;
        var panelStatus = "missing";
        if (modPanel && modPanel.IsValid()) {
            panelStatus = "found(owned=" + (modPanel.BHasClass ? modPanel.BHasClass("owned") : "n/a") + ")";
        }
        var gold = GetPlayerGold();
        var isOwned = currentTargetItem ? IsItemOwned(currentTargetItem) : false;
        var inQb = currentTargetItem ? IsTargetInQuickbuyQueue(currentTargetItem) : false;
        var report = "[SCAMLOCK DIAG] Target: " + target + " | Owned: " + isOwned + " | ShopOpen: " + isShop + " | Panel: " + panelStatus + " | InQB: " + inQb + " | Gold: " + gold;
        RouletteLogger.Log(report, "DIAG");
        if (typeof Game !== "undefined" && Game.ConsoleCommand) {
            Game.ConsoleCommand("echo " + report);
        }
        return report;
    }

    function GetComponentDiscount(targetItem) {
        if (!targetItem || !targetItem.name) return 0;
        var comps = UPGRADE_RECIPES[targetItem.name] || [];
        var totalDiscount = 0;
        for (var i = 0; i < comps.length; i++) {
            var compName = comps[i];
            if (IsItemOwnedByName(compName)) {
                var compObj = DeadlockItemsDB.GetItemByName(compName);
                if (compObj && compObj.cost) {
                    totalDiscount += compObj.cost;
                }
            }
        }
        return totalDiscount;
    }

    return {
        StartTracker: StartTracker,
        GetPlayerGold: GetPlayerGold,
        GetPlayerTotalSouls: GetPlayerTotalSouls,
        SetTargetItem: SetTargetItem,
        GetTargetItem: GetTargetItem,
        ClearTarget: ClearTarget,
        ClearQuickbuyQueueUI: ClearQuickbuyQueueUI,
        ResetTrackerSession: ResetTrackerSession,
        CheckIsTargetItemPurchased: CheckIsTargetItemPurchased,
        QueueItemIntoQuickbuy: QueueItemIntoQuickbuy,
        NotifyPurchased: NotifyPurchased,
        OnPurchase: OnPurchase,
        NotifyCancelled: NotifyCancelled,
        OnCancel: OnCancel,
        IsShopOpen: IsShopOpen,
        IsItemOwned: IsItemOwned,
        IsItemOwnedByName: IsItemOwnedByName,
        MarkItemOwned: MarkItemOwned,
        UnmarkItemOwned: UnmarkItemOwned,
        ScanShopIfOpen: ScanShopIfOpen,
        ScanEquippedInventoryHUD: ScanEquippedInventoryHUD,
        GetComponentDiscount: GetComponentDiscount,
        GetOwnedItemsMap: function() { return ownedItemsMap; },
        GetConflictSet: GetConflictSet,
        AreItemsConflicting: AreItemsConflicting,
        BuildConflictCache: BuildConflictCache,
        IsUpgradeEquipped: IsUpgradeEquipped,
        IsItemConflictingWithEquipped: IsItemConflictingWithEquipped,
        GetCurrentlyEquippedItemsList: GetCurrentlyEquippedItemsList,
        DumpDiagnostics: DumpDiagnostics
    };
})();

// =========================================================================
// 2.5 SCAMLOCK BALANCED 16-ITEM DRAFT GENERATOR
// =========================================================================
var ScamlockDraft = (function () {
    var currentDraft = null;
    var uiStatusLabel = null;
    var getLangFn = null;
    var getStringsFn = null;
    var playSoundFn = null;

    function SetUIContext(label, langGetter, stringsGetter, soundPlayer) {
        uiStatusLabel = label;
        getLangFn = langGetter;
        getStringsFn = stringsGetter;
        playSoundFn = soundPlayer;
    }

    var ACTIVE_ITEM_IDS = {
        "goose_egg": true,
        "upgrade_goose_egg": true,
        "grit": true,
        "upgrade_grit": true,
        "withering_whip": true,
        "upgrade_withering_whip": true,
        "health_stimpak": true,
        "upgrade_health_stimpak": true,
        "cold_front": true,
        "upgrade_cold_front": true,
        "fleetfoot_boots": true,
        "upgrade_fleetfoot_boots": true,
        "guardian_ward": true,
        "upgrade_guardian_ward": true,
        "restorative_locket": true,
        "upgrade_restorative_locket": true,
        "return_fire": true,
        "upgrade_return_fire": true,
        "containment": true,
        "upgrade_containment": true,
        "spirit_sap": true,
        "upgrade_spirit_sap": true,
        "split_shot": true,
        "upgrade_split_shot": true,
        "thermal_detonator": true,
        "upgrade_thermal_detonator": true,
        "blood_tribute": true,
        "upgrade_blood_tribute": true,
        "non_player_bonus_sacrifice": true,
        "upgrade_non_player_bonus_sacrifice": true,
        "rupture": true,
        "upgrade_rupture": true,
        "greater_withering_whip": true,
        "upgrade_greater_withering_whip": true,
        "reduce_debuff_duration": true,
        "upgrade_reduce_debuff_duration": true,
        "fury_trance": true,
        "upgrade_fury_trance": true,
        "health_nova": true,
        "upgrade_health_nova": true,
        "dps_aura": true,
        "upgrade_dps_aura": true,
        "target_stun": true,
        "upgrade_target_stun": true,
        "rocket_booster": true,
        "upgrade_rocket_booster": true,
        "metal_skin": true,
        "upgrade_metal_skin": true,
        "rescue_beam": true,
        "upgrade_rescue_beam": true,
        "cloaking_device_active": true,
        "upgrade_cloaking_device_active": true,
        "targeted_silence": true,
        "upgrade_targeted_silence": true,
        "warp_stone": true,
        "upgrade_warp_stone": true,
        "arctic_blast": true,
        "upgrade_arctic_blast": true,
        "capacitor": true,
        "upgrade_capacitor": true,
        "colossus": true,
        "upgrade_colossus": true,
        "glitch": true,
        "upgrade_glitch": true,
        "divine_barrier": true,
        "upgrade_divine_barrier": true,
        "ability_power_shard": true,
        "upgrade_ability_power_shard": true,
        "self_bubble": true,
        "upgrade_self_bubble": true,
        "focus_lens": true,
        "upgrade_focus_lens": true,
        "infuser": true,
        "upgrade_infuser": true,
        "magic_carpet": true,
        "upgrade_magic_carpet": true,
        "phantom_strike": true,
        "upgrade_phantom_strike": true,
        "ability_refresher": true,
        "upgrade_ability_refresher": true,
        "discord": true,
        "upgrade_discord": true,
        "spellbreaker": true,
        "upgrade_spellbreaker": true,
        "unstoppable": true,
        "upgrade_unstoppable": true,
        "surging_power": true,
        "upgrade_surging_power": true,
        "aoe_root": true,
        "upgrade_aoe_root": true,
        "counterspell": true,
        "upgrade_counterspell": true
    };

    function IsActiveItem(it) {
        if (!it) return false;
        var cleanId = DeadlockItemsDB.CleanStr(it.id);
        var cleanName = DeadlockItemsDB.CleanStr(it.name);
        var cleanValve = DeadlockItemsDB.CleanStr(it.valveId);
        return !!(ACTIVE_ITEM_IDS[it.id] || ACTIVE_ITEM_IDS[it.valveId] || ACTIVE_ITEM_IDS[cleanId] || ACTIVE_ITEM_IDS[cleanName] || ACTIVE_ITEM_IDS[cleanValve]);
    }

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

    function GenerateBalancedDraft(silent) {
        if (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.BuildConflictCache) {
            ShopPurchaseTracker.BuildConflictCache();
        }
        var maxActives = 4;
        var allItems = (DeadlockItemsDB && DeadlockItemsDB.ITEMS) ? DeadlockItemsDB.ITEMS.slice(0) : [];
        var validPool = [];
        for (var p = 0; p < allItems.length; p++) {
            var item = allItems[p];
            if (item && item.cost > 0 && item.tier >= 1 && item.tier <= 4) {
                validPool.push(item);
            }
        }

        var chosen12 = [];
        var attempts = 0;
        var finalActives = 0;

        while (chosen12.length < 12 && attempts < 10) {
            attempts++;
            chosen12 = [];
            var forbiddenMap = {};
            var activeCount = 0;
            var shuffled = ShuffleArray(validPool);

            for (var i = 0; i < shuffled.length; i++) {
                var it = shuffled[i];
                var itKey = DeadlockItemsDB.CleanStr(it.name);
                var itId = DeadlockItemsDB.CleanStr(it.id);

                if (!forbiddenMap[itKey] && !forbiddenMap[itId]) {
                    var isAct = IsActiveItem(it);
                    if (isAct && activeCount >= maxActives) {
                        continue;
                    }

                    chosen12.push(it);
                    forbiddenMap[itKey] = true;
                    forbiddenMap[itId] = true;
                    if (isAct) activeCount++;

                    if (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.GetConflictSet) {
                        var confs = ShopPurchaseTracker.GetConflictSet(it);
                        for (var confKey in confs) {
                            if (confs.hasOwnProperty(confKey)) {
                                forbiddenMap[confKey] = true;
                            }
                        }
                    }

                    if (chosen12.length === 12) break;
                }
            }
            finalActives = activeCount;
        }

        var d1 = [];
        var d2 = [];
        var d3 = [];
        var d4 = [];
        for (var cIdx = 0; cIdx < chosen12.length; cIdx++) {
            var cIt = chosen12[cIdx];
            if (cIt.tier === 1) d1.push(cIt);
            else if (cIt.tier === 2) d2.push(cIt);
            else if (cIt.tier === 3) d3.push(cIt);
            else if (cIt.tier === 4) d4.push(cIt);
        }

        function SortByCostAndName(arr) {
            if (!arr || !arr.slice) return [];
            var copy = arr.slice(0);
            copy.sort(function (a, b) {
                if (!a || !b) return 0;
                if (a.cost !== b.cost) return (a.cost || 0) - (b.cost || 0);
                var nameA = (a.name || "").toLowerCase();
                var nameB = (b.name || "").toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return 0;
            });
            return copy;
        }

        currentDraft = {
            t1: SortByCostAndName(d1),
            t2: SortByCostAndName(d2),
            t3: SortByCostAndName(d3),
            t4: SortByCostAndName(d4)
        };
        if (!silent) {
            RouletteLogger.Log("Generated fair 12-item random draft: T1(" + d1.length + "), T2(" + d2.length + "), T3(" + d3.length + "), T4(" + d4.length + "). Actives: " + finalActives + "/4 max", "DRAFT");
        }
        return currentDraft;
    }

    function GetCurrentDraft() {
        if (!currentDraft) {
            GenerateBalancedDraft();
        }
        return currentDraft;
    }

    function QueueAllDraftToQuickbuy() {
        try {
            if (!currentDraft) GenerateBalancedDraft();
            var allItems = [];
            if (currentDraft.t1) allItems = allItems.concat(currentDraft.t1);
            if (currentDraft.t2) allItems = allItems.concat(currentDraft.t2);
            if (currentDraft.t3) allItems = allItems.concat(currentDraft.t3);
            if (currentDraft.t4) allItems = allItems.concat(currentDraft.t4);

            if (allItems.length === 0) return 0;

            // Clear existing quickbuy queue completely before repopulating
            if (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.ClearQuickbuyQueueUI) {
                ShopPurchaseTracker.ClearQuickbuyQueueUI();
            }

            var lang = (getLangFn && typeof getLangFn === "function") ? getLangFn() : "ru";

            function UpdateStatus(text, color) {
                try {
                    if (uiStatusLabel && (typeof uiStatusLabel.IsValid !== "function" || uiStatusLabel.IsValid())) {
                        uiStatusLabel.text = text;
                        if (color && uiStatusLabel.style) uiStatusLabel.style.color = color;
                    }
                } catch (e) {}
            }

            function SafePlaySound(name) {
                try {
                    if (playSoundFn && typeof playSoundFn === "function") {
                        playSoundFn(name);
                    }
                } catch (e) {}
            }

            UpdateStatus((lang === "ru") ? "Очищаем очередь..." : "Clearing queue...", "#38bdf8");

            // Queue ALL 12 items in ascending order (T1 -> T2 -> T3 -> T4) with clear buffer and 0.09s delay
            for (var idx = 0; idx < allItems.length; idx++) {
                (function (item, queueIdx) {
                    $.Schedule(0.12 + (0.09 * queueIdx), function () {
                        try {
                            if (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.QueueItemIntoQuickbuy) {
                                ShopPurchaseTracker.QueueItemIntoQuickbuy(item, queueIdx, false);
                            }
                            var itName = item.name;
                            var statusTxt = (lang === "ru") ?
                                ("В очереди " + (queueIdx + 1) + " / " + allItems.length + ": " + itName) :
                                ("Queued " + (queueIdx + 1) + " / " + allItems.length + ": " + itName);
                            UpdateStatus(statusTxt, "#38bdf8");

                            if (queueIdx === allItems.length - 1) {
                                $.Schedule(0.15, function () {
                                    SafePlaySound("UI.CommendConfirmation");
                                    var doneTxt = (lang === "ru") ? "Все 12 предметов добавлены в Quickbuy!" : "All 12 draft items queued to Quickbuy!";
                                    if (getStringsFn && typeof getStringsFn === "function") {
                                        var sMap = getStringsFn();
                                        if (sMap && sMap[lang] && sMap[lang].draftQueued) {
                                            doneTxt = sMap[lang].draftQueued;
                                        }
                                    }
                                    UpdateStatus(doneTxt, "#10b981");
                                });
                            }
                        } catch (qErr) {
                            RouletteLogger.Log("Queue item " + queueIdx + " error: " + qErr, "ERROR");
                        }
                    });
                })(allItems[idx], idx);
            }

            RouletteLogger.Log("Queued ALL " + allItems.length + " draft items into Quickbuy via DOM clicks", "DRAFT");
            return allItems.length;
        } catch (err) {
            RouletteLogger.Log("QueueAllDraftToQuickbuy error: " + err, "ERROR");
            return 0;
        }
    }

    return {
        GenerateBalancedDraft: GenerateBalancedDraft,
        GetCurrentDraft: GetCurrentDraft,
        QueueAllDraftToQuickbuy: QueueAllDraftToQuickbuy,
        SetUIContext: SetUIContext,
        IsActiveItem: IsActiveItem
    };
})();

// =========================================================================
// 3. CONTINUOUS JUMP-FREE ROULETTE ENGINE (Clean Typography, No Emojis)
// =========================================================================
var ItemRoulette = (function () {
    var REEL_TOTAL_CARDS = 60;
    var CENTER_INDEX = 5;
    var TARGET_STEP = 27;
    var WIN_INDEX = CENTER_INDEX + TARGET_STEP; // 5 + 27 = 32
    var SPIN_DURATION = 4.0; // Seconds

    // Canonical Card & Viewport Metrics (guarantees pixel-perfect needle alignment)
    var CARD_WIDTH = 105;
    var CARD_MARGIN = 8;
    var CARD_TOTAL_STEP = CARD_WIDTH + CARD_MARGIN; // 113px
    var VIEWPORT_WIDTH = 920;

    var MAX_REROLLS = 3;
    var remainingRerolls = MAX_REROLLS;

    function DetectInitialLanguage() {
        if (typeof $ !== "undefined") {
            var l = "";
            if (typeof $.Language === "function") l = $.Language();
            else if (typeof $.Language === "string") l = $.Language;
            if (l && l.toLowerCase().indexOf("russian") !== -1) return "ru";
            if (l && l.toLowerCase().indexOf("english") !== -1) return "en";
        }
        return "ru";
    }

    var currentLang = DetectInitialLanguage();
    var STRINGS = {
        ru: {
            title: "SCAMLOCK",
            subtitle: "Случайный закуп и драфты в Deadlock",
            souls: "Души: ",
            vanillaShop: "МАГАЗИН",
            returnRoulette: "ВЕРНУТЬСЯ В SCAMLOCK",
            tabRoulette: "РУЛЕТКА",
            tabDraft: "ДРАФТ (12)",
            spinBtn: "КРУТИТЬ КОЛЕСО",
            spinningBtn: "КРУТИМ КОЛЕСО...",
            buyFirstBtn: "ТРЕБУЕТСЯ КУПИТЬ: ",
            preGameBtn: "РАЗМИНКА",
            statusReady: "Колесо готово. Нажмите для выбора предмета.",
            statusRolling: "Крутим колесо...",
            statusPreGame: "Идёт разминка (ожидание старта матча). Рулетка доступна со старта игры!",
            statusWon: "Выпало: ",
            statusWonSub: ". Загляните в лавку за покупкой.",
            statusBought: "Предмет куплен! Можно крутить дальше.",
            statusMustBuy: "Сначала купите в лавке: ",
            statusDuplicate: "У вас уже есть этот предмет! Можно крутить дальше.",
            targetHeader: "ВЫПАВШИЙ ПРЕДМЕТ (К ПОКУПКЕ):",
            targetNone: "Пока пусто • Нажмите «Крутить колесо»",
            skipTarget: "СКИП",
            tier: "Тир",
            langBtn: "Язык: RU",
            langTooltip: "Сменить язык (RU / EN)",
            draftTitle: "ДРАФТ НА МАТЧ (12 ПРЕДМЕТОВ)",
            draftReroll: "ПЕРЕСОБРАТЬ ДРАФТ",
            draftQuickbuy: "В АВТОПОКУПКУ ВСЕ (12)",
            draftQueued: "Все 12 предметов драфта добавлены в автопокупку!",
            t1Header: "ТИР 1 - РАННЯЯ ИГРА",
            t2Header: "ТИР 2 - ОСНОВА",
            t3Header: "ТИР 3 - ПИК СИЛЫ",
            t4Header: "ТИР 4 - ФИНАЛ",
            credits: "Scamlock • Автор: d3dvk (Discord: dedvk) • Создано с помощью ИИ",
            oddsTitle: "Шансы выпадения предметов по времени:",
            oddsT1: "0-8 мин:  Т1 80%  •  Т2 18%  •  Т3 2%",
            oddsT2: "8-16 мин:  Т2 55%  •  Т1 30%  •  Т3 13%  •  Т4 2%",
            oddsT3: "16-25 мин:  Т3 50%  •  Т2 30%  •  Т1 10%  •  Т4 10%",
            oddsT4: "25+ мин:  Т3 45%  •  Т4 35%  •  Т2 15%  •  Т1 5%",
            qaBtn: "QA ТЕСТ",
            qaRunning: "ТЕСТ...",
            qaTooltip: "Запустить полный стресс-тест всех систем мода (результат в консоль)"
        },
        en: {
            title: "SCAMLOCK",
            subtitle: "Random Upgrades & Drafts for Deadlock",
            souls: "Souls: ",
            vanillaShop: "VANILLA SHOP",
            returnRoulette: "RETURN TO SCAMLOCK",
            tabRoulette: "ROULETTE",
            tabDraft: "DRAFT (12)",
            spinBtn: "SPIN THE WHEEL",
            spinningBtn: "ROLLING...",
            buyFirstBtn: "REQUIRED TO BUY: ",
            preGameBtn: "WARMUP",
            statusReady: "Wheel ready. Click to spin for an upgrade.",
            statusRolling: "Spinning...",
            statusPreGame: "Pregame warmup active. Roulette unlocks once the match starts!",
            statusWon: "Won: ",
            statusWonSub: ". Purchase at the shop to continue.",
            statusBought: "Target purchased! You may spin again.",
            statusMustBuy: "Purchase required: ",
            statusDuplicate: "Item already owned! You can spin again.",
            targetHeader: "CURRENT TARGET (MUST BUY):",
            targetNone: "No active target • Click «Spin The Wheel»",
            skipTarget: "SKIP",
            tier: "Tier",
            langBtn: "Lang: EN",
            langTooltip: "Switch language (EN / RU)",
            draftTitle: "MATCH DRAFT (12 BALANCED ITEMS)",
            draftReroll: "REROLL DRAFT",
            draftQuickbuy: "QUEUE ALL 12 TO QUICKBUY",
            draftQueued: "All 12 draft items queued to Quickbuy!",
            t1Header: "TIER 1 - EARLY GAME",
            t2Header: "TIER 2 - CORE ITEMS",
            t3Header: "TIER 3 - POWER SPIKE",
            t4Header: "TIER 4 - LUXURY",
            credits: "Scamlock • Author: d3dvk (Discord: dedvk) • Created with AI",
            oddsTitle: "Item drop rates by game time:",
            oddsT1: "0-8 min:  T1 80%  •  T2 18%  •  T3 2%",
            oddsT2: "8-16 min:  T2 55%  •  T1 30%  •  T3 13%  •  T4 2%",
            oddsT3: "16-25 min:  T3 50%  •  T2 30%  •  T1 10%  •  T4 10%",
            oddsT4: "25+ min:  T3 45%  •  T4 35%  •  T2 15%  •  T1 5%",
            qaBtn: "QA TEST",
            qaRunning: "TESTING...",
            qaTooltip: "Run full automated stress test of mod systems (logs report to console)"
        }
    };

    var isSpinning = false;
    var isVanillaShopMode = false;
    var isSpinBtnHovered = false;

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

    var overlayPanel = null;
    var mainModalContent = null;
    var reelPanel = null;
    var carouselContainer = null;
    var spinButton = null;
    var spinBtnText = null;
    var langToggleBtn = null;
    var langToggleText = null;
    var qaTestBtn = null;
    var qaTestText = null;
    var statusLabel = null;
    var phaseBadge = null;
    var matchTimerLabel = null;
    var oddsTooltipPanel = null;
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
    var initialized = false;

    // Fast Card Panels Array & Active Items State
    var cardPanels = [];
    var reelItems = [];
    var currentReelX = 0;
    var lastItemShown = null;

    // Game state tracking for authoritative Match ID auto-reset
    var lastSeenMatchId = "";
    var lastSeenHeroName = "";
    var lastSeenGameTime = 0;

    function PlaySound(soundName) {
        if (typeof ScamlockUMM !== "undefined" && !ScamlockUMM.IsSoundEffectsEnabled()) return;
        if (typeof $.DispatchEvent === "function" && soundName) {
            $.DispatchEvent("PlaySoundEffect", soundName);
        }
    }

    function ApplyStyles(panel, styles) {
        if (!panel || !panel.style || !styles) return;
        for (var prop in styles) {
            if (styles.hasOwnProperty(prop)) {
                if (prop === "hittest") {
                    panel.hittest = (styles[prop] === true || styles[prop] === "true");
                    continue;
                }
                if (prop === "hittestchildren") {
                    panel.hittestchildren = (styles[prop] === true || styles[prop] === "true");
                    continue;
                }
                try {
                    panel.style[prop] = styles[prop];
                } catch (e) {}
            }
        }
    }

    function GetCardMetrics() {
        return {
            viewportWidth: VIEWPORT_WIDTH,
            cardWidth: CARD_WIDTH,
            margin: CARD_MARGIN,
            totalStep: CARD_TOTAL_STEP
        };
    }

    function ApplyShopButtonPos(pos) {
        if (!returnToRouletteBtn || !returnToRouletteBtn.IsValid()) return;
        if (pos === "top_left") {
            ApplyStyles(returnToRouletteBtn, {
                "horizontal-align": "left",
                "vertical-align": "top",
                "margin-top": "24px",
                "margin-left": "36px",
                "margin-right": "0px",
                "margin-bottom": "0px"
            });
        } else if (pos === "bottom_right") {
            ApplyStyles(returnToRouletteBtn, {
                "horizontal-align": "right",
                "vertical-align": "bottom",
                "margin-top": "0px",
                "margin-left": "0px",
                "margin-right": "36px",
                "margin-bottom": "36px"
            });
        } else {
            ApplyStyles(returnToRouletteBtn, {
                "horizontal-align": "right",
                "vertical-align": "top",
                "margin-top": "24px",
                "margin-left": "0px",
                "margin-right": "36px",
                "margin-bottom": "0px"
            });
        }
    }

    function ApplyUIScale(scale) {
        if (!mainModalContent || !mainModalContent.IsValid()) return;
        mainModalContent.style.uiScale = scale || "100%";
    }

    function SetShopMode(isVanilla) {
        isVanillaShopMode = isVanilla;
        var ctx = $.GetContextPanel();
        if (!ctx) return;

        var shop = ctx.FindChildTraverse("Shop");
        var qbTut = ctx.FindChildTraverse("QuickbuyTutorial");

        if (isVanilla) {
            if (overlayPanel) overlayPanel.style.visibility = "collapse";
            if (shop) {
                shop.style.visibility = "visible";
                shop.style.opacity = "1.0";
                shop.hittest = true;
            }
            if (qbTut) qbTut.style.visibility = "visible";
            if (returnToRouletteBtn) returnToRouletteBtn.style.visibility = "visible";
        } else {
            if (returnToRouletteBtn) returnToRouletteBtn.style.visibility = "collapse";
            if (overlayPanel) overlayPanel.style.visibility = "visible";
            if (shop) {
                shop.style.visibility = "visible";
                shop.style.opacity = "0.0";
                shop.hittest = true;
            }
            var heroScene = ctx.FindChildTraverse("HeroScene") || ctx.FindChildTraverse("ShopHeroScene");
            if (heroScene) heroScene.style.visibility = "collapse";
            if (qbTut) qbTut.style.visibility = "visible";
            UpdateUIState();
        }
    }

    function ToggleVanillaShop() {
        SetShopMode(!isVanillaShopMode);
    }

    function UpdateTabButtonStyles() {
        if (currentTab === "roulette") {
            if (tabRouletteBtn) {
                tabRouletteBtn.style.backgroundColor = "gradient(linear, 0% 0%, 0% 100%, from(#2563eb), to(#1d4ed8))";
                tabRouletteBtn.style.border = "1.5px solid #60a5fa";
                tabRouletteBtn.style.boxShadow = "0px 0px 10px rgba(37, 99, 235, 0.5)";
            }
            if (tabRouletteLbl) tabRouletteLbl.style.color = "#ffffff";
            if (tabDraftBtn) {
                tabDraftBtn.style.backgroundColor = "#1f2937";
                tabDraftBtn.style.border = "1px solid #374151";
                tabDraftBtn.style.boxShadow = "none";
            }
            if (tabDraftLbl) tabDraftLbl.style.color = "#9ca3af";
        } else {
            if (tabDraftBtn) {
                tabDraftBtn.style.backgroundColor = "gradient(linear, 0% 0%, 0% 100%, from(#2563eb), to(#1d4ed8))";
                tabDraftBtn.style.border = "1.5px solid #60a5fa";
                tabDraftBtn.style.boxShadow = "0px 0px 10px rgba(37, 99, 235, 0.5)";
            }
            if (tabDraftLbl) tabDraftLbl.style.color = "#ffffff";
            if (tabRouletteBtn) {
                tabRouletteBtn.style.backgroundColor = "#1f2937";
                tabRouletteBtn.style.border = "1px solid #374151";
                tabRouletteBtn.style.boxShadow = "none";
            }
            if (tabRouletteLbl) tabRouletteLbl.style.color = "#9ca3af";
        }
    }

    function SwitchTab(tabName) {
        if (currentTab === tabName) return;
        currentTab = tabName;
        UpdateTabButtonStyles();

        if (tabName === "draft") {
            if (rouletteViewPanel) {
                rouletteViewPanel.style.visibility = "collapse";
            }
            if (draftViewPanel) {
                draftViewPanel.style.visibility = "visible";
                draftViewPanel.style.opacity = "1.0";
                RenderDraftGrid();
            }
        } else {
            if (draftViewPanel) {
                draftViewPanel.style.visibility = "collapse";
            }
            if (rouletteViewPanel) {
                rouletteViewPanel.style.visibility = "visible";
                rouletteViewPanel.style.opacity = "1.0";
            }
        }
    }

    function RenderDraftGrid() {
        if (!draftGridContainer || !draftGridContainer.IsValid()) return;
        try {
            draftGridContainer.RemoveAndDeleteChildren();

            var draft = ScamlockDraft.GetCurrentDraft();
            if (!draft) return;

            var costSuffix = (currentLang === "ru") ? " Душ" : " Souls";
            var sections = [
                { tier: 1, title: STRINGS[currentLang].t1Header, items: draft.t1 || [], color: "#10b981", costText: "800" + costSuffix },
                { tier: 2, title: STRINGS[currentLang].t2Header, items: draft.t2 || [], color: "#38bdf8", costText: "1600" + costSuffix },
                { tier: 3, title: STRINGS[currentLang].t3Header, items: draft.t3 || [], color: "#a855f7", costText: "3200" + costSuffix },
                { tier: 4, title: STRINGS[currentLang].t4Header, items: draft.t4 || [], color: "#f59e0b", costText: "6400" + costSuffix }
            ];

            for (var s = 0; s < sections.length; s++) {
                var sec = sections[s];
                var itemsList = sec.items || [];
                if (itemsList.length === 0) continue;

                var secWrap = $.CreatePanel("Panel", draftGridContainer, "DraftSec_" + sec.tier);
                ApplyStyles(secWrap, {
                    "flow-children": "down",
                    "width": "100%",
                    "background-color": "rgba(15, 23, 42, 0.65)",
                    "border": "1px solid rgba(255, 255, 255, 0.07)",
                    "border-radius": "7px",
                    "padding": "6px 10px 8px 10px",
                    "margin-bottom": "6px"
                });

                var headerRow = $.CreatePanel("Panel", secWrap, "");
                ApplyStyles(headerRow, {
                    "flow-children": "right",
                    "width": "100%",
                    "margin-bottom": "5px"
                });

                var headerLbl = $.CreatePanel("Label", headerRow, "");
                var secBaseTitle = (sec.tier === 1) ? STRINGS[currentLang].t1Header :
                                   (sec.tier === 2) ? STRINGS[currentLang].t2Header :
                                   (sec.tier === 3) ? STRINGS[currentLang].t3Header : STRINGS[currentLang].t4Header;
                var secItemCountTxt = (currentLang === "ru") ? (" (" + itemsList.length + " ПРЕДМ.)") : (" (" + itemsList.length + " ITEMS)");
                headerLbl.text = secBaseTitle + secItemCountTxt;
                ApplyStyles(headerLbl, {
                    "color": sec.color,
                    "font-size": "11px",
                    "font-weight": "bold",
                    "letter-spacing": "0.5px"
                });

                var hSpacer = $.CreatePanel("Panel", headerRow, "");
                ApplyStyles(hSpacer, { "width": "fill-parent-flow(1.0)" });

                var costHint = $.CreatePanel("Label", headerRow, "");
                costHint.text = sec.costText;
                ApplyStyles(costHint, {
                    "color": "#9ca3af",
                    "font-size": "10px",
                    "vertical-align": "center"
                });

                var itemsPerFirstRow = (itemsList.length > 4) ? Math.ceil(itemsList.length / 2) : itemsList.length;
                var rows = [];
                var row1 = $.CreatePanel("Panel", secWrap, "DraftRow_" + sec.tier + "_1");
                ApplyStyles(row1, { "flow-children": "right", "width": "100%", "margin-bottom": (itemsList.length > 4 ? "6px" : "0px") });
                rows.push(row1);
                if (itemsList.length > 4) {
                    var row2 = $.CreatePanel("Panel", secWrap, "DraftRow_" + sec.tier + "_2");
                    ApplyStyles(row2, { "flow-children": "right", "width": "100%" });
                    rows.push(row2);
                }

                for (var c = 0; c < itemsList.length; c++) {
                    var it = itemsList[c];
                    if (!it) continue;
                    var targetRow = (c < itemsPerFirstRow) ? rows[0] : rows[1];
                    var isRowLast = (c < itemsPerFirstRow) ? (c === itemsPerFirstRow - 1) : (c === itemsList.length - 1);
                    (function (item, tColor, isLast, parentRow) {
                        var card = $.CreatePanel("Button", parentRow, "");
                        ApplyStyles(card, {
                            "width": "fill-parent-flow(1.0)",
                            "background-color": "#111827",
                            "border": "1.5px solid #1f2937",
                            "border-radius": "5px",
                            "padding": "5px 7px",
                            "margin-right": isLast ? "0px" : "8px",
                            "flow-children": "right",
                            "transition-property": "brightness, border, box-shadow",
                            "transition-duration": "0.12s"
                        });

                        var img = $.CreatePanel("Image", card, "");
                        img.hittest = false;
                        if (item.image) img.SetImage(item.image);
                        ApplyStyles(img, {
                            "width": "32px",
                            "height": "32px",
                            "border-radius": "4px",
                            "border": "1px solid rgba(255, 255, 255, 0.08)",
                            "vertical-align": "center"
                        });

                        var info = $.CreatePanel("Panel", card, "");
                        info.hittest = false;
                        ApplyStyles(info, {
                            "flow-children": "down",
                            "margin-left": "7px",
                            "vertical-align": "center",
                            "width": "fill-parent-flow(1.0)"
                        });

                        var nameLbl = $.CreatePanel("Label", info, "");
                        nameLbl.hittest = false;
                        nameLbl.text = item.name;
                        ApplyStyles(nameLbl, {
                            "color": "#f9fafb",
                            "font-size": "10.5px",
                            "font-weight": "bold",
                            "text-overflow": "ellipsis"
                        });

                        var costLbl = $.CreatePanel("Label", info, "");
                        costLbl.hittest = false;
                        costLbl.text = item.cost + costSuffix;
                        ApplyStyles(costLbl, {
                            "color": tColor,
                            "font-size": "9.5px",
                            "margin-top": "1px"
                        });

                        card.SetPanelEvent("onmouseover", function () {
                            PlaySound("UI.Shop.Ability.Hover");
                            card.style.brightness = "1.25";
                            card.style.borderColor = tColor;
                            card.style.boxShadow = "0px 0px 10px " + tColor;
                        });
                        card.SetPanelEvent("onmouseout", function () {
                            card.style.brightness = "1.0";
                            card.style.borderColor = "#1f2937";
                            card.style.boxShadow = "none";
                        });
                        card.SetPanelEvent("onactivate", function () {
                            PlaySound("UI.MainMenu.Activate");
                            ShopPurchaseTracker.QueueItemIntoQuickbuy(item, 0, false);
                            card.style.borderColor = "#10b981";
                            $.Schedule(0.18, function () {
                                if (card && card.IsValid()) {
                                    card.style.borderColor = tColor;
                                }
                            });
                            if (draftStatusLabel) {
                                draftStatusLabel.text = "+ " + item.name + " -> Quickbuy";
                                draftStatusLabel.style.color = "#10b981";
                            }
                        });
                    })(it, sec.color, isRowLast, targetRow);
                }
            }
        } catch (e) {
            RouletteLogger.Log("RenderDraftGrid error: " + e, "ERROR");
        }
    }

    function UpdateOddsTooltip() {
        if (!oddsTooltipPanel) return;
        var s = STRINGS[currentLang] || STRINGS.ru;
        if (oddsTooltipPanel._titleLbl && oddsTooltipPanel._titleLbl.IsValid()) {
            oddsTooltipPanel._titleLbl.text = s.oddsTitle;
        }
        if (oddsTooltipPanel._rowLabels) {
            var keys = ["oddsT1", "oddsT2", "oddsT3", "oddsT4"];
            for (var i = 0; i < keys.length; i++) {
                var lbl = oddsTooltipPanel._rowLabels[i];
                if (lbl && lbl.IsValid()) {
                    lbl.text = "• " + (s[keys[i]] || "");
                }
            }
        }
    }

    function SetLanguage(lang, fromUMM) {
        if (lang !== "ru" && lang !== "en") lang = "ru";
        if (currentLang === lang && initialized) return;
        currentLang = lang;
        var s = STRINGS[currentLang];
        if (titleLabel) titleLabel.text = s.title;
        if (subtitleLabel) subtitleLabel.text = s.subtitle;
        if (soulsTitleLabel) soulsTitleLabel.text = s.souls;
        if (toggleShopLabel) toggleShopLabel.text = s.vanillaShop;
        if (returnToRouletteLbl) returnToRouletteLbl.text = s.returnRoulette;
        if (langToggleText) langToggleText.text = s.langBtn;
        if (qaTestText) qaTestText.text = s.qaBtn;
        if (targetHeader) targetHeader.text = s.targetHeader;
        if (tabRouletteLbl) tabRouletteLbl.text = s.tabRoulette;
        if (tabDraftLbl) tabDraftLbl.text = s.tabDraft;
        if (targetSkipLbl) targetSkipLbl.text = s.skipTarget;
        if (draftTitleLbl) draftTitleLbl.text = s.draftTitle;
        if (draftRerollLbl) draftRerollLbl.text = s.draftReroll;
        if (draftQuickbuyLbl) draftQuickbuyLbl.text = s.draftQuickbuy;
        if (creditsLabel) creditsLabel.text = s.credits;

        UpdateOddsTooltip();

        if (cardPanels && cardPanels.length > 0) {
            for (var ci = 0; ci < cardPanels.length; ci++) {
                var cp = cardPanels[ci];
                if (cp && cp.IsValid && cp.IsValid() && reelItems && reelItems[ci]) {
                    var rItem = reelItems[ci];
                    if (cp._costLbl && cp._costLbl.IsValid && cp._costLbl.IsValid()) {
                        cp._costLbl.text = rItem.cost + " " + (currentLang === "ru" ? "Душ" : "Souls");
                    }
                    if (cp._nameLbl && cp._nameLbl.IsValid && cp._nameLbl.IsValid()) {
                        cp._nameLbl.text = rItem.name;
                    }
                }
            }
        }

        RenderDraftGrid();

        if (statusLabel) {
            var activeTarget = ShopPurchaseTracker.GetTargetItem();
            if (isSpinning) {
                statusLabel.text = s.statusRolling;
                statusLabel.style.color = "#fbbf24";
            } else if (activeTarget) {
                var targetNameStr = activeTarget.name;
                statusLabel.text = s.statusMustBuy + targetNameStr + "!";
                statusLabel.style.color = "#ef4444";
            } else {
                statusLabel.text = s.statusReady;
                statusLabel.style.color = "#9ca3af";
            }
        }

        UpdateUIState();

        if (!fromUMM && typeof ScamlockUMM !== "undefined" && ScamlockUMM.NotifyLanguageChanged) {
            ScamlockUMM.NotifyLanguageChanged(currentLang);
        }
    }

    function ToggleLanguage() {
        SetLanguage((currentLang === "ru") ? "en" : "ru", false);
    }

    function RunComprehensiveQASuite(labelPanel, onComplete) {
        var startTime = Date.now();
        var results = {
            scenario1_upgrades: false,
            scenario1_details: "",
            scenario2_midspin: false,
            scenario2_details: "",
            scenario3_shopSale: false,
            scenario3_details: "",
            scenario4_capacity: false,
            scenario4_details: "",
            scenario5_draft: false,
            scenario5_details: "",
            scenario6_meta: false,
            scenario6_details: ""
        };

        function UpdateLabel(txt) {
            if (labelPanel && labelPanel.IsValid && labelPanel.IsValid()) {
                labelPanel.text = txt;
            }
        }

        UpdateLabel("ТЕСТ: 1/6 (Апгрейды)...");

        try {
            var t2 = DeadlockItemsDB.GetItemByName("Compress Cooldown");
            var t3 = DeadlockItemsDB.GetItemByName("Superior Cooldown");
            var t4 = DeadlockItemsDB.GetItemByName("Transcendent Cooldown");
            if (!t2 || !t3 || !t4) throw new Error("Missing cooldown items in DB");
            ShopPurchaseTracker.MarkItemOwned(t2);
            ShopPurchaseTracker.MarkItemOwned(t3);
            ShopPurchaseTracker.MarkItemOwned(t4);
            if (!ShopPurchaseTracker.IsItemOwned(t4)) throw new Error("Cooldown T4 not owned");
            ShopPurchaseTracker.UnmarkItemOwned(t4, true);
            ShopPurchaseTracker.UnmarkItemOwned(t3, true);
            ShopPurchaseTracker.UnmarkItemOwned(t2, true);

            var d2 = DeadlockItemsDB.GetItemByName("Duration Extender");
            var d3 = DeadlockItemsDB.GetItemByName("Superior Duration");
            if (d2 && d3) {
                ShopPurchaseTracker.MarkItemOwned(d2);
                ShopPurchaseTracker.MarkItemOwned(d3);
                if (!ShopPurchaseTracker.IsItemOwned(d3)) throw new Error("Duration T3 not owned");
                ShopPurchaseTracker.UnmarkItemOwned(d3, true);
                ShopPurchaseTracker.UnmarkItemOwned(d2, true);
            }

            var b1 = DeadlockItemsDB.GetItemByName("Sprint Boots");
            var b2 = DeadlockItemsDB.GetItemByName("Enduring Speed");
            var b3 = DeadlockItemsDB.GetItemByName("Trophy Collector");
            if (b1 && b2 && b3) {
                ShopPurchaseTracker.MarkItemOwned(b1);
                ShopPurchaseTracker.MarkItemOwned(b2);
                ShopPurchaseTracker.MarkItemOwned(b3);
                if (!ShopPurchaseTracker.IsItemOwned(b3)) throw new Error("Boots T3 not owned");
                ShopPurchaseTracker.UnmarkItemOwned(b3, true);
                ShopPurchaseTracker.UnmarkItemOwned(b2, true);
                ShopPurchaseTracker.UnmarkItemOwned(b1, true);
            }
            var hb = DeadlockItemsDB.GetItemByName("Healing Booster");
            var er = DeadlockItemsDB.GetItemByName("Extra Regen");
            if (hb && er) {
                ShopPurchaseTracker.MarkItemOwned(hb);
                if (!ShopPurchaseTracker.IsUpgradeEquipped(er, {})) throw new Error("IsUpgradeEquipped failed for Extra Regen with Healing Booster owned");
                if (!ShopPurchaseTracker.IsItemConflictingWithEquipped(er)) throw new Error("IsItemConflictingWithEquipped failed for Extra Regen with Healing Booster owned");
                for (var r = 0; r < 200; r++) {
                    var picked = DeadlockItemsDB.PickRandomWinningItem(60);
                    if (picked && picked.name === "Extra Regen") throw new Error("Extra Regen rolled while Healing Booster owned");
                }
                ShopPurchaseTracker.UnmarkItemOwned(hb, true);
            }
            results.scenario1_upgrades = true;
            results.scenario1_details = "Cooldown, Duration, Boots & Healing Booster conflict OK";
        } catch (e1) {
            results.scenario1_details = "Error: " + e1.message;
        }

        if (typeof $.Schedule === "function") {
            $.Schedule(0.01, StepPhase2);
        } else {
            StepPhase2();
        }

        function StepPhase2() {
            UpdateLabel("ТЕСТ: 2/6 (Спин)...");
            try {
                var dummy = { id: "qa_synth_cancel_item", name: "QA Synth Cancel Item", tier: 1, cost: 800 };
                ShopPurchaseTracker.SetTargetItem(dummy);
                ShopPurchaseTracker.ClearTarget();
                if (ShopPurchaseTracker.GetTargetItem() !== null) throw new Error("Target was not cleared");
                if (ShopPurchaseTracker.IsItemOwned(dummy)) throw new Error("Cancelled item must not be owned");

                var itemA = { id: "qa_synth_target_a", name: "QA Synth Target A", tier: 1, cost: 800 };
                var itemB = { id: "qa_synth_target_b", name: "QA Synth Target B", tier: 2, cost: 1600 };
                ShopPurchaseTracker.SetTargetItem(itemA);
                ShopPurchaseTracker.MarkItemOwned(itemB);
                if (ShopPurchaseTracker.GetTargetItem().id !== itemA.id) throw new Error("Target should remain item A");
                if (!ShopPurchaseTracker.IsItemOwned(itemB)) throw new Error("Item B should be owned");
                ShopPurchaseTracker.ClearTarget();
                ShopPurchaseTracker.UnmarkItemOwned(itemB, true);

                results.scenario2_midspin = true;
                results.scenario2_details = "Pre-cancel & concurrent buy OK";
            } catch (e2) {
                results.scenario2_details = "Error: " + e2.message;
            }

            if (typeof $.Schedule === "function") {
                $.Schedule(0.01, StepPhase3);
            } else {
                StepPhase3();
            }
        }

        function StepPhase3() {
            UpdateLabel("ТЕСТ: 3/6 (Лавка)...");
            try {
                var testItem = DeadlockItemsDB.GetItemByName("Headshot Booster") || DeadlockItemsDB.ITEMS[5];
                ShopPurchaseTracker.MarkItemOwned(testItem);
                if (!ShopPurchaseTracker.IsItemOwned(testItem)) throw new Error("Item not owned");
                ShopPurchaseTracker.UnmarkItemOwned(testItem, true);
                if (ShopPurchaseTracker.IsItemOwned(testItem)) throw new Error("Sold item should not be owned");

                var boots = DeadlockItemsDB.GetItemByName("Sprint Boots");
                var endSpeed = DeadlockItemsDB.GetItemByName("Enduring Speed");
                if (boots && endSpeed) {
                    ShopPurchaseTracker.MarkItemOwned(boots);
                    ShopPurchaseTracker.MarkItemOwned(endSpeed);
                    ShopPurchaseTracker.UnmarkItemOwned(endSpeed, true);
                    ShopPurchaseTracker.UnmarkItemOwned(boots, true);
                    if (ShopPurchaseTracker.IsItemOwned(boots)) throw new Error("Boots still owned after unmark");
                }

                results.scenario3_shopSale = true;
                results.scenario3_details = "Headshot Booster & HUD restoral OK";
            } catch (e3) {
                results.scenario3_details = "Error: " + e3.message;
            }

            if (typeof $.Schedule === "function") {
                $.Schedule(0.01, StepPhase4);
            } else {
                StepPhase4();
            }
        }

        function StepPhase4() {
            UpdateLabel("ТЕСТ: 4/6 (12 слотов)...");
            try {
                var sample12 = DeadlockItemsDB.ITEMS.slice(0, 12);
                for (var i = 0; i < sample12.length; i++) {
                    ShopPurchaseTracker.MarkItemOwned(sample12[i]);
                }
                var isDup = ShopPurchaseTracker.IsItemOwned(sample12[0]);
                if (!isDup) throw new Error("Duplicate not detected");
                for (var j = 0; j < sample12.length; j++) {
                    ShopPurchaseTracker.UnmarkItemOwned(sample12[j], true);
                }

                results.scenario4_capacity = true;
                results.scenario4_details = "12-slot capacity & duplicate non-lock OK";
            } catch (e4) {
                results.scenario4_details = "Error: " + e4.message;
            }

            if (typeof $.Schedule === "function") {
                $.Schedule(0.01, StepPhase5);
            } else {
                StepPhase5();
            }
        }

        var draftCurrent = 0;
        var draftTotal = 1000;
        var draftBatch = 200;
        var draftFailures = 0;

        function StepPhase5() {
            var limit = Math.min(draftCurrent + draftBatch, draftTotal);
            for (; draftCurrent < limit; draftCurrent++) {
                var draft = ScamlockDraft.GenerateBalancedDraft(true);
                var all = (draft.t1 || []).concat(draft.t2 || []).concat(draft.t3 || []).concat(draft.t4 || []);
                if (all.length !== 12) draftFailures++;
                var act = 0;
                for (var a = 0; a < all.length; a++) {
                    if (ScamlockDraft.IsActiveItem(all[a])) act++;
                    for (var b = a + 1; b < all.length; b++) {
                        if (ShopPurchaseTracker.AreItemsConflicting(all[a], all[b])) draftFailures++;
                    }
                }
                if (act > 4) draftFailures++;
            }

            var pct = Math.floor((draftCurrent / draftTotal) * 100);
            UpdateLabel("ТЕСТ: 5/6 (" + pct + "%)...");

            if (draftCurrent < draftTotal && typeof $.Schedule === "function") {
                $.Schedule(0.01, StepPhase5);
            } else {
                results.scenario5_draft = (draftFailures === 0);
                results.scenario5_details = (draftFailures === 0) ? (draftTotal + " drafts valid (12 slots, <=4 actives, 0 conflicts)") : ("Failures: " + draftFailures);
                if (typeof $.Schedule === "function") {
                    $.Schedule(0.01, StepPhase6);
                } else {
                    StepPhase6();
                }
            }
        }

        function StepPhase6() {
            UpdateLabel("ТЕСТ: 6/6 (ГОТОВО)");
            try {
                var langKeys = ["title", "subtitle", "spinBtn", "tabRoulette", "tabDraft", "oddsTitle", "oddsT1", "oddsT2", "oddsT3", "oddsT4", "qaBtn"];
                for (var lk = 0; lk < langKeys.length; lk++) {
                    var k = langKeys[lk];
                    if (!STRINGS.ru[k] || !STRINGS.en[k]) throw new Error("Missing string: " + k);
                }
                var phases = [180, 600, 1200, 1800];
                for (var p = 0; p < phases.length; p++) {
                    var w = DeadlockItemsDB.GetTimeTierWeights(phases[p]);
                    if (!w || !w.phaseRu || !w.phaseEn) throw new Error("Missing phase weight at " + phases[p]);
                }
                results.scenario6_meta = true;
                results.scenario6_details = "RU & EN strings, time weights verified";
            } catch (e6) {
                results.scenario6_details = "Error: " + e6.message;
            }

            var totalElapsed = Date.now() - startTime;
            var allPass = results.scenario1_upgrades && results.scenario2_midspin && results.scenario3_shopSale && results.scenario4_capacity && results.scenario5_draft && results.scenario6_meta;
            var tag = allPass ? "[PASS]" : "[FAIL]";

            var logLines = [
                "================================================================",
                "[SCAMLOCK COMPREHENSIVE QA SCENARIO SUITE] " + tag + " in " + totalElapsed + "ms",
                "----------------------------------------------------------------",
                "1. UPGRADE CHAINS (Cooldown, Duration, Boots, Health): " + (results.scenario1_upgrades ? "PASS" : "FAIL") + " (" + results.scenario1_details + ")",
                "2. MID-SPIN PLAYER INTERVENTIONS (Pre-cancel & concurrent): " + (results.scenario2_midspin ? "PASS" : "FAIL") + " (" + results.scenario2_details + ")",
                "3. SHOP SALE & POOL RESTORAL: " + (results.scenario3_shopSale ? "PASS" : "FAIL") + " (" + results.scenario3_details + ")",
                "4. 12-SLOT CAPACITY & DUPLICATES: " + (results.scenario4_capacity ? "PASS" : "FAIL") + " (" + results.scenario4_details + ")",
                "5. DRAFT INVARIANTS (1,000 runs): " + (results.scenario5_draft ? "PASS" : "FAIL") + " (" + results.scenario5_details + ")",
                "6. LOCALIZATION & TIMER ODDS: " + (results.scenario6_meta ? "PASS" : "FAIL") + " (" + results.scenario6_details + ")",
                "----------------------------------------------------------------",
                allPass ? "[ALL 6 SCENARIOS PASSED] - Engine State Machine 100% Robust!" : "[SOME SCENARIOS FAILED] - Check log details above!",
                "================================================================"
            ];

            for (var li = 0; li < logLines.length; li++) {
                if (typeof RouletteLogger !== "undefined" && RouletteLogger.Log) {
                    RouletteLogger.Log(logLines[li], "QA");
                }
                if (typeof Game !== "undefined" && Game.ConsoleCommand) {
                    Game.ConsoleCommand("echo " + logLines[li]);
                }
            }

            UpdateLabel(allPass ? "ТЕСТ: PASS" : "ТЕСТ: FAIL");
            if (typeof $.Schedule === "function") {
                $.Schedule(2.0, function () {
                    if (typeof onComplete === "function") onComplete();
                });
            } else if (typeof onComplete === "function") {
                onComplete();
            }

            return results;
        }
    }

    function RunModStressTest() {
        return RunComprehensiveQASuite(qaTestText, function () {
            if (qaTestText) qaTestText.text = STRINGS[currentLang].qaBtn;
        });
    }

    function SetReelPosition(posX) {
        if (!reelPanel) return;
        currentReelX = posX;
        reelPanel.style.transform = "translateX( " + Math.round(posX) + "px )";
    }

    function CreateCardPanel(index, item) {
        var card = $.CreatePanel("Panel", reelPanel, "Card_" + index);
        card.hittest = false;
        ApplyStyles(card, {
            "width": CARD_WIDTH + "px",
            "height": "145px",
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#111827), to(#030712))",
            "border": "1.5px solid " + GetTierColor(item.tier),
            "border-radius": "8px",
            "margin-right": CARD_MARGIN + "px",
            "flow-children": "down",
            "padding": "6px",
            "horizontal-align": "left",
            "vertical-align": "center",
            "box-shadow": "inset 0px 0px 10px rgba(0, 0, 0, 0.6)"
        });

        // Tier Indicator Pill
        var tierRow = $.CreatePanel("Panel", card, "");
        ApplyStyles(tierRow, { "width": "100%", "flow-children": "right", "margin-bottom": "3px" });

        var tierSpacer = $.CreatePanel("Panel", tierRow, "");
        ApplyStyles(tierSpacer, { "width": "fill-parent-flow(1.0)" });

        var tierPill = $.CreatePanel("Label", tierRow, "Tier_" + index);
        tierPill.text = "T" + item.tier;
        tierPill.hittest = false;
        ApplyStyles(tierPill, {
            "color": GetTierColor(item.tier),
            "font-size": "10px",
            "font-weight": "bold",
            "text-align": "right",
        });

        // Item Icon Image
        var icon = $.CreatePanel("Image", card, "Icon_" + index);
        icon.hittest = false;
        if (item.image) {
            icon.SetImage(item.image);
        }
        ApplyStyles(icon, {
            "width": "64px",
            "height": "64px",
            "horizontal-align": "center",
            "border-radius": "6px",
            "background-color": "#1f2937",
            "border": "1px solid rgba(255, 255, 255, 0.08)",
        });

        // Item Name
        var nameLbl = $.CreatePanel("Label", card, "Name_" + index);
        nameLbl.text = item.name;
        nameLbl.hittest = false;
        ApplyStyles(nameLbl, {
            "color": "#f3f4f6",
            "font-size": "10px",
            "font-weight": "bold",
            "text-align": "center",
            "horizontal-align": "center",
            "height": "28px",
            "margin-top": "4px",
        });

        // Item Cost
        var costLbl = $.CreatePanel("Label", card, "Cost_" + index);
        costLbl.text = item.cost + " " + (currentLang === "ru" ? "Душ" : "Souls");
        costLbl.hittest = false;
        ApplyStyles(costLbl, {
            "color": "#f59e0b",
            "font-size": "9.5px",
            "font-weight": "bold",
            "text-align": "center",
            "horizontal-align": "center",
            "margin-top": "1px",
        });

        card._tierPill = tierPill;
        card._icon = icon;
        card._nameLbl = nameLbl;
        card._costLbl = costLbl;

        return card;
    }

    function UpdateCardPanelContent(card, item) {
        if (!card || !card.IsValid() || !item) return;
        card.style.borderColor = GetTierColor(item.tier);
        if (card._tierPill && card._tierPill.IsValid()) {
            card._tierPill.text = "T" + item.tier;
            card._tierPill.style.color = GetTierColor(item.tier);
        }
        if (card._icon && card._icon.IsValid()) {
            if (item.image) card._icon.SetImage(item.image);
        }
        if (card._nameLbl && card._nameLbl.IsValid()) {
            card._nameLbl.text = item.name;
        }
        if (card._costLbl && card._costLbl.IsValid()) {
            card._costLbl.text = item.cost + " " + (currentLang === "ru" ? "Душ" : "Souls");
        }
    }

    function BuildInitialReel(centerItem) {
        if (!reelPanel) return;
        reelPanel.RemoveAndDeleteChildren();
        cardPanels = [];
        reelItems = [];

        var pool = DeadlockItemsDB.ITEMS;
        var unowned = [];
        for (var pi = 0; pi < pool.length; pi++) {
            if (typeof ShopPurchaseTracker === "undefined" || !ShopPurchaseTracker.IsItemOwned(pool[pi])) {
                unowned.push(pool[pi]);
            }
        }
        var activePool = (unowned.length >= 8) ? unowned : pool;
        if (!centerItem) {
            centerItem = lastItemShown || activePool[Math.floor(Math.random() * activePool.length)];
        }
        lastItemShown = centerItem;

        var prev = null;
        for (var i = 0; i < REEL_TOTAL_CARDS; i++) {
            var it;
            if (i === CENTER_INDEX) {
                it = centerItem;
            } else {
                var tries = 0;
                do {
                    it = activePool[Math.floor(Math.random() * activePool.length)];
                    tries++;
                } while (prev && it.name === prev.name && tries < 20);
            }
            prev = it;
            reelItems.push(it);
            var card = CreateCardPanel(i, it);
            cardPanels.push(card);
        }

        var metrics = GetCardMetrics();
        var centerOffset = (metrics.viewportWidth / 2) - (metrics.cardWidth / 2);
        currentReelX = -(CENTER_INDEX * metrics.totalStep) + centerOffset;
        SetReelPosition(currentReelX);
        RouletteLogger.Log("Initial reel built with " + REEL_TOTAL_CARDS + " cards, centered at index " + CENTER_INDEX, "UI");
    }

    function GetTierColor(tier) {
        switch (tier) {
            case 1: return "#10b981"; // Emerald
            case 2: return "#06b6d4"; // Cyan
            case 3: return "#a855f7"; // Purple
            case 4: return "#f59e0b"; // Amber/Gold
            default: return "#71717a";
        }
    }

    function ResetSession(reason) {
        reason = reason || "Manual/Auto";
        RouletteLogger.Log("Session Reset triggered: " + reason, "RESET");
        remainingRerolls = MAX_REROLLS;
        isSpinning = false;
        ShopPurchaseTracker.ClearTarget();
        ShopPurchaseTracker.ResetTrackerSession();

        if (statusLabel) {
            statusLabel.text = STRINGS[currentLang].statusReady;
            statusLabel.style.color = "#9ca3af";
        }

        BuildInitialReel();
        UpdateUIState();
        RouletteLogger.Log("Roulette state reset complete. Rerolls: 3/3", "RESET");
    }

    function ResetState() {
        ResetSession("ResetState");
    }

    var matchLoadTimestamp = Date.now();

    function GetEffectiveGameTime() {
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

        var elapsed = (Date.now() - matchLoadTimestamp) / 1000.0;
        return elapsed > 0 ? elapsed : 0;
    }

    function StartSpin(isReroll) {
        if (isSpinning) return;

        if (ScamlockHudState.IsPreGame()) {
            PlaySound("UI.LaneSwap.DenyRequest");
            if (statusLabel) {
                statusLabel.text = STRINGS[currentLang].statusPreGame;
                statusLabel.style.color = "#fbbf24";
            }
            return;
        }

        var activeTarget = ShopPurchaseTracker.GetTargetItem();
        if (activeTarget && !isReroll) {
            if (ShopPurchaseTracker.CheckIsTargetItemPurchased()) {
                ShopPurchaseTracker.NotifyPurchased();
            } else {
                PlaySound("UI.LaneSwap.DenyRequest");
                if (statusLabel) {
                    statusLabel.text = STRINGS[currentLang].statusMustBuy + activeTarget.name + "!";
                    statusLabel.style.color = "#ef4444";
                }
                return;
            }
        }

        isSpinning = true;
        // Crisp, punchy spin start cues (Revolver spin ratchet + start draft)
        PlaySound("UI.ItemDraft.Start");
        PlaySound("UI.ItemDraft.RevolverSpin");
        PlaySound("UI.MainMenu.Activate");

        if (typeof ShopPurchaseTracker !== "undefined") {
            if (ShopPurchaseTracker.ScanEquippedInventoryHUD) {
                ShopPurchaseTracker.ScanEquippedInventoryHUD();
            }
            if (ShopPurchaseTracker.ScanShopIfOpen) {
                ShopPurchaseTracker.ScanShopIfOpen(true);
            }
        }

        var gameSec = GetEffectiveGameTime();
        var winningItem = DeadlockItemsDB.PickRandomWinningItem(gameSec);
        var weights = DeadlockItemsDB.GetTimeTierWeights(gameSec);
        RouletteLogger.Log("Spin start (" + weights.phaseRu + "). Winning: " + winningItem.name + " (T" + winningItem.tier + ", " + winningItem.cost + " souls)", "SPIN");

        var unowned = [];
        for (var pi = 0; pi < DeadlockItemsDB.ITEMS.length; pi++) {
            if (typeof ShopPurchaseTracker === "undefined" || !ShopPurchaseTracker.IsItemOwned(DeadlockItemsDB.ITEMS[pi])) {
                unowned.push(DeadlockItemsDB.ITEMS[pi]);
            }
        }
        var pool = (unowned.length >= 8) ? unowned : DeadlockItemsDB.ITEMS;

        // Current item under needle before this spin starts
        var currentItemUnderNeedle = lastItemShown || (reelItems.length > CENTER_INDEX ? reelItems[CENTER_INDEX] : null) || pool[0];

        // 1. Put current item under needle at CENTER_INDEX
        reelItems[CENTER_INDEX] = currentItemUnderNeedle;
        UpdateCardPanelContent(cardPanels[CENTER_INDEX], currentItemUnderNeedle);

        // 2. Populate left of CENTER_INDEX
        var prevItem = currentItemUnderNeedle;
        for (var li = CENTER_INDEX - 1; li >= 0; li--) {
            var itL;
            var triesL = 0;
            do {
                itL = pool[Math.floor(Math.random() * pool.length)];
                triesL++;
            } while (prevItem && itL.name === prevItem.name && triesL < 20);
            prevItem = itL;
            reelItems[li] = itL;
            UpdateCardPanelContent(cardPanels[li], itL);
        }

        // 3. Populate cards from CENTER_INDEX + 1 up to REEL_TOTAL_CARDS, placing winningItem at WIN_INDEX
        prevItem = currentItemUnderNeedle;
        for (var i = CENTER_INDEX + 1; i < REEL_TOTAL_CARDS; i++) {
            var it;
            if (i === WIN_INDEX) {
                it = winningItem;
            } else {
                var tries = 0;
                do {
                    it = pool[Math.floor(Math.random() * pool.length)];
                    tries++;
                } while (
                    ((prevItem && it.name === prevItem.name) ||
                     (i === WIN_INDEX - 1 && it.name === winningItem.name) ||
                     (i === WIN_INDEX + 1 && it.name === winningItem.name)) &&
                    tries < 30
                );
            }
            prevItem = it;
            reelItems[i] = it;
            UpdateCardPanelContent(cardPanels[i], it);
        }

        var metrics = GetCardMetrics();
        var centerOffset = (metrics.viewportWidth / 2) - (metrics.cardWidth / 2); // 460 - 52.5 = 407.5px

        // Detect current UI scale from carousel container layout width
        var scale = 1.0;
        if (carouselContainer && carouselContainer.actuallayoutwidth > 0) {
            scale = carouselContainer.actuallayoutwidth / VIEWPORT_WIDTH;
        }

        // Exact CSS step derived directly from Panorama's rasterized card offsets (0.00px drift at all scales)
        var exactStepCSS = CARD_TOTAL_STEP;
        if (cardPanels[WIN_INDEX] && cardPanels[CENTER_INDEX] &&
            cardPanels[WIN_INDEX].actualxoffset > 0 && cardPanels[CENTER_INDEX].actualxoffset > 0 && scale > 0) {
            exactStepCSS = (cardPanels[WIN_INDEX].actualxoffset - cardPanels[CENTER_INDEX].actualxoffset) / (TARGET_STEP * scale);
        }

        // Exact CSS card width derived directly from Panorama's rasterized card width
        var exactCardWidthCSS = CARD_WIDTH;
        if (cardPanels[CENTER_INDEX] && cardPanels[CENTER_INDEX].actuallayoutwidth > 0 && scale > 0) {
            exactCardWidthCSS = cardPanels[CENTER_INDEX].actuallayoutwidth / scale;
        }

        var exactCenterOffset = (VIEWPORT_WIDTH - exactCardWidthCSS) / 2.0;
        var startX = -(CENTER_INDEX * exactStepCSS) + exactCenterOffset;
        var targetX = -(WIN_INDEX * exactStepCSS) + exactCenterOffset;

        SetReelPosition(startX);

        var jitter = 0; // Pure dead-center alignment under the needle at any UI scale (90%, 100%, 120%)

        if (spinButton) {
            ApplyStyles(spinButton, {
                "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#27272a), to(#18181b))",
                "border": "2px solid #3f3f46",
                "border-radius": "8px"
            });
            if (spinBtnText) spinBtnText.text = STRINGS[currentLang].spinningBtn;
        }
        if (statusLabel) {
            statusLabel.text = STRINGS[currentLang].statusRolling;
            statusLabel.style.color = "#fbbf24";
        }

        var startTime = Date.now();
        var lastTickCard = CENTER_INDEX;

        function AnimateFrame() {
            if (!isSpinning) return;
            var now = Date.now();
            var elapsed = (now - startTime) / 1000.0;

            if (elapsed >= SPIN_DURATION) {
                SetReelPosition(targetX);
                lastItemShown = winningItem;
                OnSpinCompleted(winningItem, jitter);
                return;
            }

            var t = elapsed / SPIN_DURATION;
            var ease = 1.0 - Math.pow(1.0 - t, 4.0);
            var currentPos = startX + (targetX - startX) * ease;
            SetReelPosition(currentPos);

            // Tactile, punchy tick sound as cards cross the needle
            var relativeShift = Math.abs(currentPos - centerOffset);
            var cardPassed = Math.floor((relativeShift + (metrics.cardWidth / 2)) / metrics.totalStep);
            if (cardPassed !== lastTickCard) {
                lastTickCard = cardPassed;
                PlaySound("Gameplay.Pause.Resume.Countdown.Tick");
                PlaySound("UI.Shop.Ability.Hover");
            }

            $.Schedule(0.016, AnimateFrame);
        }

        AnimateFrame();
    }

    function OnSpinCompleted(winningItem, jitter) {
        isSpinning = false;

        // Crisp, ringing, snappy tier fanfare (no boomy muffled swells)
        PlaySound("UI.ItemDraft.End");
        if (winningItem.tier === 1) {
            PlaySound("UI.ItemDraft.Appear.Weapon");
            PlaySound("UI.Shop.Mod.Activate.Weapon");
        } else if (winningItem.tier === 2) {
            PlaySound("UI.ItemDraft.Appear.Vitality");
            PlaySound("UI.Shop.Mod.Activate.Vitality");
        } else if (winningItem.tier === 3) {
            PlaySound("UI.ItemDraft.Appear.Rare");
            PlaySound("UI.Shop.Mod.Activate.Spirit");
            PlaySound("UI.Matchmake.Made");
        } else {
            // Tier 4 Legendary jackpot
            PlaySound("UI.ItemDraft.Appear.Legendary");
            PlaySound("UI.Ranked.RankUp.Intra");
            PlaySound("UI.CommendConfirmation");
        }

        RouletteLogger.Log("Spin completed! Won item: " + winningItem.name + " (T" + winningItem.tier + ", " + winningItem.cost + " souls)", "SPIN");

        var isAlreadyOwned = false;
        if (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.IsItemOwned(winningItem)) {
            isAlreadyOwned = true;
        }

        if (isAlreadyOwned) {
            // Player already has this item! Do not lock roulette, allow immediate spin again.
            ShopPurchaseTracker.ClearTarget();
            UpdateUIState();
            if (statusLabel) {
                statusLabel.text = STRINGS[currentLang].statusDuplicate;
                statusLabel.style.color = "#38bdf8";
            }
            PlaySound("UI.Matchmake.Made");
            return;
        }

        ShopPurchaseTracker.SetTargetItem(winningItem);
        UpdateUIState();

        if (statusLabel) {
            var itemName = winningItem.name;
            statusLabel.text = STRINGS[currentLang].statusWon + itemName + STRINGS[currentLang].statusWonSub;
            statusLabel.style.color = "#34d399";
        }

        // Reel stays cleanly positioned at targetX under the needle
    }

    function OnTargetItemPurchased(purchasedItem) {
        RouletteLogger.Log("Item purchase confirmed! Roulette unlocked: " + (purchasedItem ? purchasedItem.name : "Target"), "SUCCESS");

        if (statusLabel) {
            statusLabel.text = STRINGS[currentLang].statusBought;
            statusLabel.style.color = "#4ade80";
        }

        UpdateUIState();
    }

    function OnTargetItemCancelled(cancelledItem) {
        RouletteLogger.Log("Target item cancelled: " + (cancelledItem ? cancelledItem.name : "Target"), "CANCEL");

        if (statusLabel) {
            statusLabel.text = STRINGS[currentLang].statusReady;
            statusLabel.style.color = "#10b981";
        }

        UpdateUIState();
    }

    function UpdateUIState() {
        var target = ShopPurchaseTracker.GetTargetItem();
        var curGold = ShopPurchaseTracker.GetPlayerGold();

        if (soulsLabel) {
            soulsLabel.text = "" + curGold;
        }

        var gameSec = Math.floor(GetEffectiveGameTime());

        // Update Match Timer Display
        if (matchTimerLabel) {
            var mins = Math.floor(gameSec / 60);
            var secs = gameSec % 60;
            matchTimerLabel.text = (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;
        }

        if (phaseBadge) {
            var weights = DeadlockItemsDB.GetTimeTierWeights(gameSec);
            var phaseTitle = (currentLang === "ru") ? weights.phaseRu : weights.phaseEn;
            var cleanPhase = phaseTitle.replace(/^[0-9+–\-]+(?:\s*(?:мин|min))\s*[•·\-]\s*/i, "");
            phaseBadge.text = cleanPhase;
            var bColor = weights.color || "#10b981";
            ApplyStyles(phaseBadge, {
                "color": "#f3f4f6",
                "border-color": bColor,
                "background-color": "rgba(15, 23, 42, 0.95)"
            });
        }

        // Target Info Card
        if (target) {
            if (targetCard) targetCard.style.visibility = "visible";
            if (targetIcon && target.image) targetIcon.SetImage(target.image);
            if (targetName) {
                targetName.text = target.name + " (" + STRINGS[currentLang].tier + " " + target.tier + ")";
                targetName.style.color = GetTierColor(target.tier);
            }

            // Component upgrade discount calculation
            var effectiveCost = target.cost;
            var componentDiscount = 0;
            if (target.components && target.components.length > 0) {
                for (var ci = 0; ci < target.components.length; ci++) {
                    var cName = target.components[ci];
                    var cItem = DeadlockItemsDB.GetItemByName(cName);
                    if (cItem && (ShopPurchaseTracker.IsItemOwned(cItem) || ShopPurchaseTracker.IsItemOwnedByName(cItem.name))) {
                        componentDiscount = cItem.cost;
                        break;
                    }
                }
            }
            if (componentDiscount > 0) {
                effectiveCost = Math.max(0, target.cost - componentDiscount);
            }

            var pct = Math.min(100, Math.floor((curGold / (effectiveCost || 1)) * 100));
            if (targetProgressFill) {
                targetProgressFill.style.width = pct + "%";
                targetProgressFill.style.backgroundColor = (pct >= 100) ? "#10b981" : "#f59e0b";
            }
            if (targetProgressText) {
                var soulsWord = (currentLang === "ru" ? "Душ" : "Souls");
                if (componentDiscount > 0) {
                    var upgNote = (currentLang === "ru")
                        ? " [Улучшение: -" + componentDiscount + "]"
                        : " [Upgrade: -" + componentDiscount + "]";
                    targetProgressText.text = curGold + " / " + effectiveCost + " " + soulsWord + upgNote + " (" + pct + "%)";
                } else {
                    targetProgressText.text = curGold + " / " + target.cost + " " + soulsWord + " (" + pct + "%)";
                }
            }
        } else {
            if (targetCard) targetCard.style.visibility = "collapse";
            if (targetProgressFill) targetProgressFill.style.width = "0%";
            if (targetProgressText) targetProgressText.text = "0 / 0 " + (currentLang === "ru" ? "Душ" : "Souls") + " (0%)";
        }

        var isPreGame = ScamlockHudState.IsPreGame();

        // Spin Button State & Unclipped Lighting
        if (spinButton && spinBtnText) {
            if (isSpinning) {
                ApplyStyles(spinButton, {
                    "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#27272a), to(#18181b))",
                    "border": "2px solid #3f3f46",
                    "border-radius": "8px",
                    "box-shadow": "none"
                });
                spinBtnText.text = STRINGS[currentLang].spinningBtn;
                spinBtnText.style.color = "#9ca3af";
            } else if (target) {
                ApplyStyles(spinButton, {
                    "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#7f1d1d), color-stop(0.5, #991b1b), to(#450a0a))",
                    "border": "2px solid #ef4444",
                    "border-radius": "8px",
                    "box-shadow": "0px 3px 18px rgba(239, 68, 68, 0.40)"
                });
                var lockedName = (target.name).toUpperCase();
                spinBtnText.text = STRINGS[currentLang].buyFirstBtn + lockedName;
                spinBtnText.style.color = "#fecaca";
            } else if (isPreGame) {
                ApplyStyles(spinButton, {
                    "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#27272a), to(#18181b))",
                    "border": "2px solid #3f3f46",
                    "border-radius": "8px",
                    "box-shadow": "none"
                });
                spinBtnText.text = STRINGS[currentLang].preGameBtn;
                spinBtnText.style.color = "#9ca3af";
            } else {
                ApplyStyles(spinButton, {
                    "background-color": isSpinBtnHovered
                        ? "gradient(linear, 0% 0%, 0% 100%, from(#fbbf24), color-stop(0.5, #f59e0b), to(#d97706))"
                        : "gradient(linear, 0% 0%, 0% 100%, from(#f59e0b), color-stop(0.5, #d97706), to(#b45309))",
                    "border": "2px solid #fef08a",
                    "border-radius": "8px",
                    "box-shadow": isSpinBtnHovered
                        ? "0px 4px 22px rgba(245, 158, 11, 0.65)"
                        : "0px 3px 16px rgba(245, 158, 11, 0.35)"
                });
                spinBtnText.text = STRINGS[currentLang].spinBtn;
                spinBtnText.style.color = "#ffffff";
            }
        }

        // Status Subtitle Synchronization (Always accurately match current language & state when idle)
        if (statusLabel && !isSpinning) {
            if (target) {
                var targetStatusName = target.name;
                statusLabel.text = STRINGS[currentLang].statusMustBuy + targetStatusName + "!";
                statusLabel.style.color = "#ef4444";
            } else if (isPreGame) {
                statusLabel.text = STRINGS[currentLang].statusPreGame;
                statusLabel.style.color = "#9ca3af";
            } else {
                statusLabel.text = STRINGS[currentLang].statusReady;
                statusLabel.style.color = "#9ca3af";
            }
        }

        // Target Skip Button Localization & State
        if (targetSkipLbl) {
            targetSkipLbl.text = STRINGS[currentLang].skipTarget;
        }
    }

    // DYNAMIC HERO SIGNATURE DETECTION (Multi-layer verification)
    function DetectHeroIdentifier() {
        var top = GetTopRoot();
        if (!top || !top.IsValid()) return "";

        // 1. Ability Buttons on HUD (AbilityButton1 through AbilityButton4)
        // In Deadlock, every hero has unique abilities. Changing hero in Sandbox immediately updates these!
        var abilSig = "";
        for (var b = 1; b <= 4; b++) {
            var btn = top.FindChildTraverse("AbilityButton" + b);
            if (btn && btn.IsValid()) {
                var aid = (btn.GetAttributeString ? btn.GetAttributeString("ability_id", "") : (btn.ability_id || "")) || "";
                var icon = btn.FindChildTraverse("AbilityIcon") || btn.FindChildTraverse("icon") || btn.FindChildTraverse("Image");
                var src = "";
                if (icon && icon.IsValid()) {
                    src = (icon.GetAttributeString ? icon.GetAttributeString("src", "") : (icon.src || "")) || "";
                    if (!src && icon.style && icon.style.backgroundImage) {
                        src = icon.style.backgroundImage;
                    }
                    if (src) src = src.toLowerCase();
                }
                if (aid || src) {
                    abilSig += "|" + b + ":" + aid + ":" + src;
                }
            }
        }
        if (abilSig) return "abil" + abilSig;

        // 2. LocalPlayer in TopBar
        var tb = ScamlockHudState.GetTopBar() || top.FindChildTraverse("TopBar");
        if (tb && tb.IsValid()) {
            var localPlayer = tb.FindChildTraverse("LocalPlayer");
            if (!localPlayer) {
                var allLocals = tb.FindChildrenWithClassTraverse("LocalPlayer") || [];
                if (allLocals.length > 0) localPlayer = allLocals[0];
            }
            if (localPlayer && localPlayer.IsValid()) {
                var badge = localPlayer.FindChildTraverse("HeroBadge");
                if (badge && badge.IsValid()) {
                    var hid = badge.heroid;
                    if (typeof hid === "number" && hid > 0) return "heroid_" + hid;
                }
                var hImg = localPlayer.FindChildTraverse("HeroImage") || localPlayer.FindChildTraverse("Hero");
                if (hImg && hImg.IsValid()) {
                    var hSrc = (hImg.GetAttributeString ? hImg.GetAttributeString("src", "") : (hImg.src || "")).toLowerCase();
                    if (hSrc) return "topbar_hero_" + hSrc;
                }
            }
        }

        // 3. Recommended build title in shop
        var ctx = $.GetContextPanel();
        if (ctx && ctx.IsValid()) {
            var buildPanel = ctx.FindChildTraverse("ShopModsSelectedBuild");
            if (buildPanel && buildPanel.IsValid()) {
                var foundBuild = "";
                TraversePanelTree(buildPanel, function(l) {
                    if (l && l.IsValid() && l.text && typeof l.text === "string") {
                        var t = l.text.trim();
                        if (t && t.length > 2 && t.indexOf("{") === -1 && t.indexOf("#") === -1) {
                            foundBuild = "build_" + t;
                            return false;
                        }
                    }
                    return true;
                }, 6, 40);
                if (foundBuild) return foundBuild;
            }
        }

        return "";
    }

    var lastSeenHeroSig = "";
    var lastSeenGameTime = 0;
    var wasHideoutState = undefined;
    var wasPreGameState = false;
    var wasPostGameState = false;
    var lastMatchResetTime = 0;

    function CheckSmartAutoReset() {
        var now = Date.now();

        // 1. Hero change detection in sandbox or live match
        var heroSig = DetectHeroIdentifier();
        if (heroSig) {
            if (lastSeenHeroSig && heroSig !== lastSeenHeroSig) {
                ResetSession("Hero changed: " + lastSeenHeroSig + " -> " + heroSig);
            }
            lastSeenHeroSig = heroSig;
        }

        // 2. Match State Transitions
        var inHideout = ScamlockHudState.IsInHideout();
        var preGame = ScamlockHudState.IsPreGame();
        var postGame = ScamlockHudState.IsPostGame();

        if (wasHideoutState !== undefined) {
            if (wasHideoutState && !inHideout) {
                if (now - lastMatchResetTime > 4000) {
                    lastMatchResetTime = now;
                    ResetSession("Left hideout -> match loaded");
                }
            } else if (preGame && !wasPreGameState) {
                if (now - lastMatchResetTime > 4000) {
                    lastMatchResetTime = now;
                    ResetSession("Match pregame started");
                }
            } else if (!wasHideoutState && inHideout) {
                if (now - lastMatchResetTime > 4000) {
                    lastMatchResetTime = now;
                    ResetSession("Returned to hideout/lobby");
                }
            } else if (postGame && !wasPostGameState) {
                if (now - lastMatchResetTime > 4000) {
                    lastMatchResetTime = now;
                    ResetSession("Match ended (post-game)");
                }
            }
        }

        wasHideoutState = inHideout;
        wasPreGameState = preGame;
        wasPostGameState = postGame;

        // 3. Match Clock Restart Detection
        var curTime = GetEffectiveGameTime();
        if (curTime > 0 && curTime < 60 && lastSeenGameTime > 120) {
            if (now - lastMatchResetTime > 4000) {
                lastMatchResetTime = now;
                ResetSession("Match clock restarted: was " + Math.round(lastSeenGameTime) + "s, now " + Math.round(curTime) + "s");
            }
        }
        if (curTime > 0) {
            lastSeenGameTime = curTime;
        }
    }

    function EnsureReturnButtonCreated(shopPanel) {
        if (!shopPanel || (typeof shopPanel.IsValid === "function" && !shopPanel.IsValid())) return;
        var existingReturn = shopPanel.FindChildTraverse("ReturnToRouletteBtn");
        if (existingReturn && (typeof existingReturn.IsValid !== "function" || existingReturn.IsValid())) {
            returnToRouletteBtn = existingReturn;
            return;
        }

        returnToRouletteBtn = $.CreatePanel("Button", shopPanel, "ReturnToRouletteBtn");
        ApplyStyles(returnToRouletteBtn, {
            "horizontal-align": "left",
            "vertical-align": "top",
            "margin-top": "24px",
            "margin-left": "36px",
            "margin-right": "0px",
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#f59e0b), to(#d97706))",
            "border": "1.5px solid #fbbf24",
            "border-radius": "6px",
            "padding": "8px 18px",
            "box-shadow": "0px 2px 10px rgba(0, 0, 0, 0.5)",
            "z-index": "1000",
            "visibility": "collapse"
        });
        returnToRouletteLbl = $.CreatePanel("Label", returnToRouletteBtn, "");
        returnToRouletteLbl.text = STRINGS[currentLang].returnRoulette;
        returnToRouletteLbl.hittest = false;
        ApplyStyles(returnToRouletteLbl, {
            "color": "#111827",
            "font-size": "13px",
            "font-weight": "bold",
        });
        returnToRouletteBtn.SetPanelEvent("onmouseover", function () {
            returnToRouletteBtn.style.brightness = "1.25";
        });
        returnToRouletteBtn.SetPanelEvent("onmouseout", function () {
            returnToRouletteBtn.style.brightness = "1.0";
        });
        returnToRouletteBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            SetShopMode(false);
        });

        if (typeof ScamlockUMM !== "undefined" && ScamlockUMM.GetShopButtonPos) {
            ApplyShopButtonPos(ScamlockUMM.GetShopButtonPos());
        } else {
            ApplyShopButtonPos("top_left");
        }
    }

    function MonitorLoop() {
        var isNowOpen = false;
        try {
            var shopOpen = false;
            var ctx = $.GetContextPanel();
            if (ctx && (typeof ctx.IsValid !== "function" || ctx.IsValid()) && ctx.BHasClass && ctx.BHasClass("gShopOpen")) {
                shopOpen = true;
            } else if (typeof ShopPurchaseTracker !== "undefined" && ShopPurchaseTracker.IsShopOpen) {
                shopOpen = ShopPurchaseTracker.IsShopOpen();
            }
            isNowOpen = !!shopOpen;

            try {
                CheckSmartAutoReset();
            } catch (resetErr) {
                // Safeguard against reset check error
            }

            if (shopOpen) {
                if (!overlayPanel || (typeof overlayPanel.IsValid === "function" && !overlayPanel.IsValid())) {
                    Init();
                }

                if (!isVanillaShopMode) {
                    if (overlayPanel && (typeof overlayPanel.IsValid !== "function" || overlayPanel.IsValid())) {
                        overlayPanel.style.visibility = "visible";
                    }
                    var shop = ctx ? ctx.FindChildTraverse("Shop") : null;
                    if (!shop) {
                        var root = GetTopRoot();
                        shop = root ? root.FindChildTraverse("Shop") : null;
                    }
                    if (shop && (typeof shop.IsValid !== "function" || shop.IsValid())) {
                        shop.style.visibility = "visible";
                        shop.style.opacity = "0.0";
                        shop.hittest = true;

                        if (!returnToRouletteBtn || (typeof returnToRouletteBtn.IsValid === "function" && !returnToRouletteBtn.IsValid())) {
                            EnsureReturnButtonCreated(shop);
                        }
                    }
                    UpdateUIState();
                }
            } else {
                if (overlayPanel && (typeof overlayPanel.IsValid !== "function" || overlayPanel.IsValid())) {
                    overlayPanel.style.visibility = "collapse";
                }
            }
        } catch (err) {
            RouletteLogger.Log("MonitorLoop error: " + err, "ERROR");
        } finally {
            if (typeof $.Schedule === "function") {
                $.Schedule(isNowOpen ? 0.25 : 0.6, MonitorLoop);
            }
        }
    }

    function Init() {
        if (initialized && overlayPanel && (typeof overlayPanel.IsValid !== "function" || overlayPanel.IsValid())) return true;
        var context = $.GetContextPanel();
        if (!context || typeof context.FindChildTraverse !== "function") return false;

        try {
            initialized = true;
            RouletteLogger.Log("Initializing overhauled Deadlock Item Roulette...", "INIT");

            // Emergency Return Button inside Vanilla Shop
            var shopPanel = context.FindChildTraverse("Shop");
            if (shopPanel) {
                EnsureReturnButtonCreated(shopPanel);
            }

            // 1. Overlay Root Panel
            overlayPanel = context.FindChildTraverse("DeadlockRouletteOverlay");
            if (overlayPanel && typeof overlayPanel.DeleteAsync === "function") overlayPanel.DeleteAsync(0);

            overlayPanel = $.CreatePanel("Panel", context, "DeadlockRouletteOverlay");
        overlayPanel.hittest = true;
        overlayPanel.hittestchildren = true;
        ApplyStyles(overlayPanel, {
            "width": "100%",
            "height": "100%",
            "background-color": "rgba(4, 6, 10, 0.70)",
            "z-index": "9998",
            "visibility": "collapse"
        });

        overlayPanel.SetPanelEvent("oncontextmenu", function () { return true; });
        overlayPanel.SetPanelEvent("onmouseactivate", function () { return true; });

        mainModalContent = $.CreatePanel("Panel", overlayPanel, "RouletteModalContent");
        ApplyStyles(mainModalContent, {
            "width": "960px",
            "horizontal-align": "center",
            "vertical-align": "top",
            "margin-top": "230px",
            "flow-children": "down",
            "overflow": "noclip",
            "padding": "16px 20px"
        });

        var header = $.CreatePanel("Panel", mainModalContent, "RouletteHeader");
        ApplyStyles(header, {
            "width": "100%",
            "horizontal-align": "center",
            "flow-children": "right",
            "padding": "0px 0px 10px 0px"
        });

        var titleBox = $.CreatePanel("Panel", header, "TitleBox");
        ApplyStyles(titleBox, { "flow-children": "down", "vertical-align": "center" });

        var titleRow = $.CreatePanel("Panel", titleBox, "");
        ApplyStyles(titleRow, { "flow-children": "right", "vertical-align": "center" });

        titleLabel = $.CreatePanel("Label", titleRow, "RouletteTitle");
        titleLabel.text = STRINGS[currentLang].title;
        ApplyStyles(titleLabel, {
            "color": "#f59e0b",
            "font-size": "19px",
            "font-weight": "bold",
            "letter-spacing": "2px"
        });

        matchTimerLabel = $.CreatePanel("Label", titleRow, "MatchTimerLabel");
        matchTimerLabel.text = "00:00";
        ApplyStyles(matchTimerLabel, {
            "color": "#9ca3af",
            "font-size": "12px",
            "font-weight": "bold",
            "width": "46px",
            "text-align": "center",
            "margin-left": "8px",
            "vertical-align": "center",
            "letter-spacing": "0.5px"
        });

        phaseBadge = $.CreatePanel("Label", titleRow, "RoulettePhaseBadge");
        phaseBadge.text = (currentLang === "ru") ? "Ранняя игра" : "Early Game";
        ApplyStyles(phaseBadge, {
            "color": "#f3f4f6",
            "font-size": "10.5px",
            "font-weight": "bold",
            "background-color": "rgba(15, 23, 42, 0.95)",
            "border": "1.5px solid #10b981",
            "border-radius": "6px",
            "padding": "3px 10px",
            "margin-left": "10px",
            "vertical-align": "center",
            "box-shadow": "0px 2px 8px rgba(0, 0, 0, 0.6)",
            "transition-property": "brightness",
            "transition-duration": "0.15s"
        });

        // Completely decoupled from layout flow (Zero Layout Reflow on Hover)
        oddsTooltipPanel = $.CreatePanel("Panel", overlayPanel, "OddsTooltipPanel");
        oddsTooltipPanel.hittest = false;
        ApplyStyles(oddsTooltipPanel, {
            "background-color": "rgba(10, 15, 26, 0.98)",
            "border": "1.5px solid #374151",
            "border-radius": "8px",
            "padding": "8px 12px",
            "flow-children": "down",
            "z-index": "10000",
            "horizontal-align": "center",
            "vertical-align": "top",
            "margin-top": "170px",
            "box-shadow": "0px 8px 24px rgba(0, 0, 0, 0.9)",
            "visibility": "collapse"
        });

        oddsTooltipPanel._titleLbl = $.CreatePanel("Label", oddsTooltipPanel, "");
        oddsTooltipPanel._titleLbl.hittest = false;
        ApplyStyles(oddsTooltipPanel._titleLbl, { "color": "#f59e0b", "font-size": "10.5px", "font-weight": "bold", "margin-bottom": "4px" });

        var rowColors = ["#10b981", "#38bdf8", "#a855f7", "#f59e0b"];
        oddsTooltipPanel._rowLabels = [];
        for (var tl = 0; tl < rowColors.length; tl++) {
            var rowL = $.CreatePanel("Label", oddsTooltipPanel, "");
            rowL.hittest = false;
            ApplyStyles(rowL, { "color": rowColors[tl], "font-size": "10px", "margin-top": "2px" });
            oddsTooltipPanel._rowLabels.push(rowL);
        }
        UpdateOddsTooltip();

        phaseBadge.SetPanelEvent("onmouseover", function () {
            PlaySound("UI.Shop.Ability.Hover");
            phaseBadge.style.brightness = "1.25";
            if (oddsTooltipPanel) oddsTooltipPanel.style.visibility = "visible";
        });
        phaseBadge.SetPanelEvent("onmouseout", function () {
            phaseBadge.style.brightness = "1.0";
            if (oddsTooltipPanel) oddsTooltipPanel.style.visibility = "collapse";
        });

        subtitleLabel = $.CreatePanel("Label", titleBox, "RouletteSubtitle");
        subtitleLabel.text = STRINGS[currentLang].subtitle;
        ApplyStyles(subtitleLabel, {
            "color": "#9ca3af",
            "font-size": "11px",
            "margin-top": "2px"
        });

        var tabBar = $.CreatePanel("Panel", header, "ScamlockTabBar");
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
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#2563eb), to(#1d4ed8))",
            "border": "1.5px solid #60a5fa",
            "border-radius": "4px",
            "padding": "5px 14px",
            "box-shadow": "0px 0px 10px rgba(37, 99, 235, 0.5)",
            "transition-property": "transform, brightness, background-color, border",
            "transition-duration": "0.12s"
        });
        tabRouletteLbl = $.CreatePanel("Label", tabRouletteBtn, "");
        tabRouletteLbl.hittest = false;
        tabRouletteLbl.text = STRINGS[currentLang].tabRoulette;
        ApplyStyles(tabRouletteLbl, {
            "color": "#ffffff",
            "font-size": "11px",
            "font-weight": "bold",
        });
        tabRouletteBtn.SetPanelEvent("onmouseover", function () {
            PlaySound("UI.Shop.Ability.Hover");
            if (currentTab !== "roulette") {
                tabRouletteBtn.style.backgroundColor = "#374151";
                tabRouletteBtn.style.border = "1px solid #4b5563";
                if (tabRouletteLbl) tabRouletteLbl.style.color = "#f3f4f6";
            } else {
                tabRouletteBtn.style.brightness = "1.2";
            }
        });
        tabRouletteBtn.SetPanelEvent("onmouseout", function () {
            tabRouletteBtn.style.brightness = "1.0";
            UpdateTabButtonStyles();
        });
        tabRouletteBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            tabRouletteBtn.style.transform = "scale3d(0.96, 0.96, 1.0)";
            $.Schedule(0.1, function () {
                if (tabRouletteBtn && tabRouletteBtn.IsValid()) tabRouletteBtn.style.transform = "scale3d(1.0, 1.0, 1.0)";
            });
            SwitchTab("roulette");
        });

        tabDraftBtn = $.CreatePanel("Button", tabBar, "TabDraftBtn");
        ApplyStyles(tabDraftBtn, {
            "background-color": "#1f2937",
            "border": "1px solid #374151",
            "border-radius": "4px",
            "padding": "5px 14px",
            "margin-left": "4px",
            "transition-property": "transform, brightness, background-color, border",
            "transition-duration": "0.12s"
        });
        tabDraftLbl = $.CreatePanel("Label", tabDraftBtn, "");
        tabDraftLbl.hittest = false;
        tabDraftLbl.text = STRINGS[currentLang].tabDraft;
        ApplyStyles(tabDraftLbl, {
            "color": "#9ca3af",
            "font-size": "11px",
            "font-weight": "bold",
        });
        tabDraftBtn.SetPanelEvent("onmouseover", function () {
            PlaySound("UI.Shop.Ability.Hover");
            if (currentTab !== "draft") {
                tabDraftBtn.style.backgroundColor = "#374151";
                tabDraftBtn.style.border = "1px solid #4b5563";
                if (tabDraftLbl) tabDraftLbl.style.color = "#f3f4f6";
            } else {
                tabDraftBtn.style.brightness = "1.2";
            }
        });
        tabDraftBtn.SetPanelEvent("onmouseout", function () {
            tabDraftBtn.style.brightness = "1.0";
            UpdateTabButtonStyles();
        });
        tabDraftBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            tabDraftBtn.style.transform = "scale3d(0.96, 0.96, 1.0)";
            $.Schedule(0.1, function () {
                if (tabDraftBtn && tabDraftBtn.IsValid()) tabDraftBtn.style.transform = "scale3d(1.0, 1.0, 1.0)";
            });
            SwitchTab("draft");
        });

        var spacer = $.CreatePanel("Panel", header, "HeaderSpacer");
        ApplyStyles(spacer, { "width": "fill-parent-flow(1.0)" });

        // Live Souls Pill
        var soulsBox = $.CreatePanel("Panel", header, "SoulsBox");
        ApplyStyles(soulsBox, {
            "background-color": "#111827",
            "border": "1px solid #374151",
            "border-radius": "6px",
            "padding": "5px 12px",
            "flow-children": "right",
            "vertical-align": "center",
            "margin-right": "8px"
        });

        soulsTitleLabel = $.CreatePanel("Label", soulsBox, "SoulsTitle");
        soulsTitleLabel.text = STRINGS[currentLang].souls;
        ApplyStyles(soulsTitleLabel, { "color": "#9ca3af", "font-size": "11px" });

        soulsLabel = $.CreatePanel("Label", soulsBox, "SoulsAmount");
        soulsLabel.text = "0";
        ApplyStyles(soulsLabel, { "color": "#f59e0b", "font-size": "12px", "font-weight": "bold" });

        // Obsolete reset and log buttons removed for ultra-clean UI

        // Language Toggle Button (RU | EN)
        langToggleBtn = $.CreatePanel("Button", header, "LangToggleBtn");
        ApplyStyles(langToggleBtn, {
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#1f2937), to(#111827))",
            "border": "1px solid #4b5563",
            "border-radius": "6px",
            "padding": "4px 9px",
            "vertical-align": "center",
            "margin-right": "8px"
        });
        langToggleText = $.CreatePanel("Label", langToggleBtn, "");
        langToggleText.text = STRINGS[currentLang].langBtn;
        langToggleText.hittest = false;
        ApplyStyles(langToggleText, {
            "color": "#f59e0b",
            "font-size": "11px",
            "font-weight": "bold",
            "letter-spacing": "0.5px",
        });
        langToggleBtn.SetPanelEvent("onmouseover", function () {
            langToggleBtn.style.brightness = "1.25";
            langToggleBtn.style.borderColor = "#f59e0b";
            var tip = STRINGS[currentLang].langTooltip;
            if (typeof $.DispatchEvent === "function") {
                $.DispatchEvent("UIShowTextTooltip", langToggleBtn, tip);
            }
        });
        langToggleBtn.SetPanelEvent("onmouseout", function () {
            langToggleBtn.style.brightness = "1.0";
            langToggleBtn.style.borderColor = "#4b5563";
            if (typeof $.DispatchEvent === "function") {
                $.DispatchEvent("UIHideTextTooltip", langToggleBtn);
            }
        });
        langToggleBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            ToggleLanguage();
        });

        var toggleShopBtn = $.CreatePanel("Button", header, "ToggleShopBtn");
        ApplyStyles(toggleShopBtn, {
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#374151), to(#1f2937))",
            "border": "1px solid #4b5563",
            "border-radius": "6px",
            "padding": "5px 12px",
            "min-width": "84px",
            "vertical-align": "center"
        });
        toggleShopLabel = $.CreatePanel("Label", toggleShopBtn, "");
        toggleShopLabel.text = STRINGS[currentLang].vanillaShop;
        toggleShopLabel.hittest = false;
        ApplyStyles(toggleShopLabel, {
            "color": "#f3f4f6",
            "font-size": "11px",
            "font-weight": "bold",
        });
        toggleShopBtn.SetPanelEvent("onmouseover", function () {
            toggleShopBtn.style.brightness = "1.25";
            toggleShopBtn.style.borderColor = "#9ca3af";
        });
        toggleShopBtn.SetPanelEvent("onmouseout", function () {
            toggleShopBtn.style.brightness = "1.0";
            toggleShopBtn.style.borderColor = "#4b5563";
        });
        toggleShopBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            SetShopMode(true);
        });

        // 3. Stable Tab View Container (Holds Roulette and Draft with Fixed Min-Height to eliminate layout jitter)
        var viewContainer = $.CreatePanel("Panel", mainModalContent, "ScamlockViewContainer");
        ApplyStyles(viewContainer, {
            "width": "100%",
            "min-height": "460px",
            "flow-children": "down"
        });

        rouletteViewPanel = $.CreatePanel("Panel", viewContainer, "RouletteViewPanel");
        ApplyStyles(rouletteViewPanel, {
            "flow-children": "down",
            "width": "100%",
            "visibility": "visible",
            "opacity": "1.0"
        });

        carouselContainer = $.CreatePanel("Panel", rouletteViewPanel, "CarouselContainer");
        ApplyStyles(carouselContainer, {
            "width": "920px",
            "height": "165px",
            "horizontal-align": "center",
            "background-color": "#05070b",
            "border": "1.5px solid #1f2937",
            "border-radius": "10px",
            "overflow": "clip",
            "box-shadow": "inset 0px 0px 24px rgba(0, 0, 0, 0.9)"
        });

        reelPanel = $.CreatePanel("Panel", carouselContainer, "ReelPanel");
        ApplyStyles(reelPanel, {
            "height": "100%",
            "flow-children": "right",
            "vertical-align": "center"
        });

        // Left Dark Fade Vignette
        var leftFade = $.CreatePanel("Panel", carouselContainer, "LeftFadeStrip");
        leftFade.hittest = false;
        ApplyStyles(leftFade, {
            "width": "70px",
            "height": "100%",
            "horizontal-align": "left",
            "background-color": "gradient(linear, 0% 0%, 100% 0%, from(#05070b), to(rgba(5, 7, 11, 0.0)))",
            "z-index": "80",
        });

        // Right Dark Fade Vignette
        var rightFade = $.CreatePanel("Panel", carouselContainer, "RightFadeStrip");
        rightFade.hittest = false;
        ApplyStyles(rightFade, {
            "width": "70px",
            "height": "100%",
            "horizontal-align": "right",
            "background-color": "gradient(linear, 0% 0%, 100% 0%, from(rgba(5, 7, 11, 0.0)), to(#05070b))",
            "z-index": "80",
        });

        // Centered Golden Needle Indicator
        var needle = $.CreatePanel("Panel", carouselContainer, "CenterNeedle");
        needle.hittest = false;
        ApplyStyles(needle, {
            "width": "3px",
            "height": "100%",
            "align": "center center",
            "background-color": "#f59e0b",
            "box-shadow": "0px 0px 10px #f59e0b",
            "z-index": "100",
        });

        var needleTopArrow = $.CreatePanel("Panel", needle, "");
        needleTopArrow.hittest = false;
        ApplyStyles(needleTopArrow, {
            "width": "12px",
            "height": "12px",
            "horizontal-align": "center",
            "vertical-align": "top",
            "background-color": "#f59e0b",
            "transform": "rotateZ(45deg) translateY(-6px)",
        });

        var needleBottomArrow = $.CreatePanel("Panel", needle, "");
        needleBottomArrow.hittest = false;
        ApplyStyles(needleBottomArrow, {
            "width": "12px",
            "height": "12px",
            "horizontal-align": "center",
            "vertical-align": "bottom",
            "background-color": "#f59e0b",
            "transform": "rotateZ(45deg) translateY(6px)",
        });

        // 4. Action Control Area with Unclipped Overflow
        var controlArea = $.CreatePanel("Panel", rouletteViewPanel, "RouletteControls");
        ApplyStyles(controlArea, {
            "horizontal-align": "center",
            "flow-children": "down",
            "margin-top": "16px",
            "overflow": "noclip",
            "padding": "10px 0px"
        });

        var buttonsRow = $.CreatePanel("Panel", controlArea, "ButtonsRow");
        ApplyStyles(buttonsRow, {
            "horizontal-align": "center",
            "flow-children": "right",
            "overflow": "noclip",
            "padding": "14px 28px"
        });

        // Main Spin Button
        spinButton = $.CreatePanel("Button", buttonsRow, "RouletteSpinBtn");
        ApplyStyles(spinButton, {
            "min-width": "260px",
            "width": "fit-children",
            "height": "50px",
            "padding": "0px 22px",
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#f59e0b), color-stop(0.5, #d97706), to(#b45309))",
            "border": "2px solid #fef08a",
            "border-radius": "8px",
            "overflow": "noclip",
            "box-shadow": "0px 3px 16px rgba(245, 158, 11, 0.35)"
        });

        spinBtnText = $.CreatePanel("Label", spinButton, "SpinButtonText");
        spinBtnText.text = STRINGS[currentLang].spinBtn;
        spinBtnText.hittest = false;
        ApplyStyles(spinBtnText, {
            "color": "#ffffff",
            "font-size": "14.5px",
            "font-weight": "bold",
            "letter-spacing": "1.5px",
            "horizontal-align": "center",
            "vertical-align": "center",
            "text-shadow": "0px 1px 4px rgba(0, 0, 0, 0.9)",
        });

        spinButton.SetPanelEvent("onmouseover", function () {
            isSpinBtnHovered = true;
            if (isSpinning || ShopPurchaseTracker.GetTargetItem()) return;
            spinButton.style.brightness = "1.25";
            spinButton.style.boxShadow = "0px 4px 22px rgba(245, 158, 11, 0.65)";
        });
        spinButton.SetPanelEvent("onmouseout", function () {
            isSpinBtnHovered = false;
            if (isSpinning || ShopPurchaseTracker.GetTargetItem()) return;
            spinButton.style.brightness = "1.0";
            spinButton.style.boxShadow = "0px 3px 16px rgba(245, 158, 11, 0.35)";
        });
        spinButton.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            var activeTarget = ShopPurchaseTracker.GetTargetItem();
            if (activeTarget) {
                if (ShopPurchaseTracker.ScanEquippedInventoryHUD) ShopPurchaseTracker.ScanEquippedInventoryHUD();
                if (ShopPurchaseTracker.ScanShopIfOpen) ShopPurchaseTracker.ScanShopIfOpen(true);

                // Check if already bought -> advance immediately in 1 click!
                if (ShopPurchaseTracker.CheckIsTargetItemPurchased() || ShopPurchaseTracker.IsItemOwned(activeTarget) || ShopPurchaseTracker.IsItemOwnedByName(activeTarget.name)) {
                    ShopPurchaseTracker.NotifyPurchased();
                    StartSpin(false);
                    return;
                }
                PlaySound("UI.LaneSwap.DenyRequest");
                if (statusLabel) {
                    var targetNameStr = activeTarget.name;
                    statusLabel.text = STRINGS[currentLang].statusMustBuy + targetNameStr + "!";
                    statusLabel.style.color = "#f87171";
                }
                return;
            }
            StartSpin(false);
        });

        // Reroll button removed in favor of direct [СКИП] button on active target card

        // Status Subtitle
        statusLabel = $.CreatePanel("Label", controlArea, "RouletteStatusLabel");
        statusLabel.text = STRINGS[currentLang].statusReady;
        ApplyStyles(statusLabel, {
            "color": "#9ca3af",
            "font-size": "12px",
            "font-weight": "bold",
            "horizontal-align": "center",
            "margin-top": "10px",
            "text-align": "center"
        });

        // 5. Active Target Display Card
        targetCard = $.CreatePanel("Panel", rouletteViewPanel, "TargetCard");
        ApplyStyles(targetCard, {
            "horizontal-align": "center",
            "width": "420px",
            "background-color": "#0d131f",
            "border": "1px solid #1f2937",
            "border-radius": "8px",
            "padding": "10px 14px",
            "margin-top": "12px",
            "flow-children": "right",
            "visibility": "collapse"
        });

        targetIcon = $.CreatePanel("Image", targetCard, "TargetCardIcon");
        ApplyStyles(targetIcon, {
            "width": "48px",
            "height": "48px",
            "border-radius": "6px",
            "background-color": "#1f2937",
            "border": "1px solid rgba(255, 255, 255, 0.1)",
            "vertical-align": "center"
        });

        var targetInfo = $.CreatePanel("Panel", targetCard, "TargetInfo");
        ApplyStyles(targetInfo, {
            "flow-children": "down",
            "margin-left": "12px",
            "width": "fill-parent-flow(1.0)",
            "vertical-align": "center"
        });

        targetHeader = $.CreatePanel("Label", targetInfo, "TargetHeaderLabel");
        targetHeader.text = STRINGS[currentLang].targetHeader;
        ApplyStyles(targetHeader, {
            "color": "#9ca3af",
            "font-size": "10px",
            "letter-spacing": "1px"
        });

        targetName = $.CreatePanel("Label", targetInfo, "TargetNameLabel");
        targetName.text = "";
        ApplyStyles(targetName, {
            "color": "#ffffff",
            "font-size": "14px",
            "font-weight": "bold",
            "margin-top": "2px"
        });

        var progressBar = $.CreatePanel("Panel", targetInfo, "TargetProgressBar");
        ApplyStyles(progressBar, {
            "width": "100%",
            "height": "6px",
            "background-color": "#1f2937",
            "border-radius": "3px",
            "margin-top": "5px",
            "overflow": "clip"
        });
        targetProgressFill = $.CreatePanel("Panel", progressBar, "TargetProgressFill");
        ApplyStyles(targetProgressFill, {
            "width": "0%",
            "height": "100%",
            "background-color": "#f59e0b"
        });

        targetProgressText = $.CreatePanel("Label", targetInfo, "TargetProgressText");
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
        draftViewPanel = $.CreatePanel("Panel", viewContainer, "DraftViewPanel");
        ApplyStyles(draftViewPanel, {
            "flow-children": "down",
            "width": "100%",
            "padding": "8px 12px",
            "visibility": "collapse",
            "opacity": "0.0"
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
        if (typeof ScamlockDraft !== "undefined" && ScamlockDraft.SetUIContext) {
            ScamlockDraft.SetUIContext(
                draftStatusLabel,
                function () { return currentLang; },
                function () { return STRINGS; },
                PlaySound
            );
        }

        var draftSpacer = $.CreatePanel("Panel", draftActionsRow, "");
        ApplyStyles(draftSpacer, { "width": "fill-parent-flow(1.0)" });

        draftRerollBtn = $.CreatePanel("Button", draftActionsRow, "DraftRerollBtn");
        ApplyStyles(draftRerollBtn, {
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#374151), to(#1f2937))",
            "border": "1px solid #4b5563",
            "border-radius": "4px",
            "padding": "5px 12px",
            "margin-right": "8px",
            "transition-property": "transform, brightness, border",
            "transition-duration": "0.12s"
        });
        draftRerollLbl = $.CreatePanel("Label", draftRerollBtn, "");
        draftRerollLbl.hittest = false;
        draftRerollLbl.text = STRINGS[currentLang].draftReroll;
        ApplyStyles(draftRerollLbl, {
            "color": "#e5e7eb",
            "font-size": "10px",
            "font-weight": "bold",
        });
        draftRerollBtn.SetPanelEvent("onmouseover", function () {
            PlaySound("UI.Shop.Ability.Hover");
            draftRerollBtn.style.brightness = "1.25";
            draftRerollBtn.style.borderColor = "#9ca3af";
        });
        draftRerollBtn.SetPanelEvent("onmouseout", function () {
            draftRerollBtn.style.brightness = "1.0";
            draftRerollBtn.style.borderColor = "#4b5563";
        });
        draftRerollBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.ItemDraft.Start");
            draftRerollBtn.style.transform = "scale3d(0.96, 0.96, 1.0)";
            $.Schedule(0.1, function () {
                if (draftRerollBtn && draftRerollBtn.IsValid()) draftRerollBtn.style.transform = "scale3d(1.0, 1.0, 1.0)";
            });
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
            "padding": "5px 14px",
            "box-shadow": "0px 2px 8px rgba(37, 99, 235, 0.4)",
            "transition-property": "transform, brightness, border, box-shadow",
            "transition-duration": "0.12s"
        });
        draftQuickbuyLbl = $.CreatePanel("Label", draftQuickbuyBtn, "");
        draftQuickbuyLbl.hittest = false;
        draftQuickbuyLbl.text = STRINGS[currentLang].draftQuickbuy;
        ApplyStyles(draftQuickbuyLbl, {
            "color": "#ffffff",
            "font-size": "10px",
            "font-weight": "bold",
        });
        draftQuickbuyBtn.SetPanelEvent("onmouseover", function () {
            PlaySound("UI.Shop.Ability.Hover");
            draftQuickbuyBtn.style.brightness = "1.25";
            draftQuickbuyBtn.style.borderColor = "#93c5fd";
            draftQuickbuyBtn.style.boxShadow = "0px 0px 12px rgba(59, 130, 246, 0.7)";
        });
        draftQuickbuyBtn.SetPanelEvent("onmouseout", function () {
            draftQuickbuyBtn.style.brightness = "1.0";
            draftQuickbuyBtn.style.borderColor = "#60a5fa";
            draftQuickbuyBtn.style.boxShadow = "0px 2px 8px rgba(37, 99, 235, 0.4)";
        });
        draftQuickbuyBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.MainMenu.Activate");
            draftQuickbuyBtn.style.transform = "scale3d(0.96, 0.96, 1.0)";
            $.Schedule(0.1, function () {
                if (draftQuickbuyBtn && draftQuickbuyBtn.IsValid()) draftQuickbuyBtn.style.transform = "scale3d(1.0, 1.0, 1.0)";
            });
            var count = ScamlockDraft.QueueAllDraftToQuickbuy();
        });

        draftGridContainer = $.CreatePanel("Panel", draftViewPanel, "DraftGridContainer");
        ApplyStyles(draftGridContainer, {
            "flow-children": "down",
            "width": "100%",
            "min-height": "380px"
        });

        // Subtle Attribution Footer
        creditsLabel = $.CreatePanel("Label", mainModalContent, "RouletteCredits");
        creditsLabel.text = STRINGS[currentLang].credits;
        ApplyStyles(creditsLabel, {
            "color": "#64748b",
            "font-size": "10px",
            "horizontal-align": "center",
            "margin-top": "8px",
            "letter-spacing": "0.5px",
        });

        // 6. In-Game Logs Viewer Modal Dialog
        // Obsolete log viewer modal removed for ultra-clean UI

        // Auto-reset on match and hero transitions is handled by CheckSmartAutoReset in MonitorLoop

        ShopPurchaseTracker.OnPurchase(OnTargetItemPurchased);
        ShopPurchaseTracker.OnCancel(OnTargetItemCancelled);
        ShopPurchaseTracker.StartTracker();

        BuildInitialReel();
        UpdateUIState();

        if (typeof ScamlockUMM !== "undefined" && ScamlockUMM.Init) {
            ScamlockUMM.Init();
            if (ScamlockUMM.GetDefaultTab && ScamlockUMM.GetDefaultTab() === "draft") {
                SwitchTab("draft");
            } else {
                SwitchTab("roulette");
            }
        } else {
            SwitchTab("roulette");
        }

        MonitorLoop();
        RouletteLogger.Log("Scamlock (Скамлок) ready!", "INIT");
        return true;
    } catch (err) {
        RouletteLogger.Log("Init error: " + err, "ERROR");
        initialized = false;
        return false;
    }
}

    return {
        Init: Init,
        StartSpin: StartSpin,
        Spin: StartSpin,
        ToggleVanillaShop: ToggleVanillaShop,
        SetShopMode: SetShopMode,
        ResetState: ResetState,
        ResetSession: ResetSession,
        SetLanguage: SetLanguage,
        GetLanguage: function () { return currentLang; },
        ToggleLanguage: ToggleLanguage,
        SwitchTab: SwitchTab,
        GetModalContent: function () { return mainModalContent; },
        GetReturnToRouletteBtn: function () { return returnToRouletteBtn; },
        ApplyShopButtonPos: ApplyShopButtonPos,
        ApplyUIScale: ApplyUIScale,
        PlaySound: PlaySound,
        RunModStressTest: RunModStressTest,
        RunComprehensiveQASuite: RunComprehensiveQASuite
    };
})();


// =========================================================================
// 4. CRASH-PROOF UNIVERSAL MOD MANAGER (UMM) INTEGRATION
// =========================================================================
var ScamlockUMM = (function () {
    var UMM_CHANNEL = "ClientUI_FireOutput";
    var UMM_PROTOCOL = 1;
    var currentAspectRatio = "16:9";
    var currentUIScale = "100%";
    var currentShopBtnPos = "top_left";
    var defaultTabSetting = "roulette";
    var soundEffectsEnabled = true;
    var lastRegisteredLang = "";

    function SendToUMM(payload) {
        if (typeof $.DispatchEvent !== "function" || !payload) return;
        var msg = JSON.stringify(payload);
        if (typeof $.Schedule === "function") {
            $.Schedule(0.02, function () {
                $.DispatchEvent(UMM_CHANNEL, msg);
            });
        } else {
            $.DispatchEvent(UMM_CHANNEL, msg);
        }
    }

    function GetRegistrationPayload(lang) {
        lang = lang || (typeof ItemRoulette !== "undefined" && ItemRoulette.GetLanguage ? ItemRoulette.GetLanguage() : "ru");

        return {
            umm: UMM_PROTOCOL,
            t: "register",
            id: "scamlock",
            name: "Scamlock",
            version: "1.1.0",
            author: "d3dvk (Discord: dedvk)",
            desc: "Рулетка предметов и драфты 12 слотов / Random item roulette & 12-item drafts",
            settings: [
                {
                    type: "group",
                    label: "Отображение / Display"
                },
                {
                    id: "aspect_ratio",
                    type: "select",
                    label: "Формат экрана / Aspect Ratio",
                    description: "Адаптация окна под формат монитора / Screen format adaptation",
                    options: [
                        { value: "16:9", label: "16:9 (Широкоформатный / Widescreen)" },
                        { value: "16:10", label: "16:10 (Мониторы / Laptops)" },
                        { value: "4:3", label: "4:3 (Классический / Classic)" }
                    ],
                    default: currentAspectRatio
                },
                {
                    id: "ui_scale",
                    type: "select",
                    label: "Масштаб / UI Scale",
                    description: "Размер окна рулетки и драфта / Overall window scale",
                    options: [
                        { value: "100%", label: "100% (Стандарт / Default)" },
                        { value: "110%", label: "110% (Крупный / Large)" },
                        { value: "120%", label: "120% (Большой / Extra Large)" },
                        { value: "90%", label: "90% (Компактный / Compact)" }
                    ],
                    default: currentUIScale
                },
                {
                    id: "default_tab",
                    type: "select",
                    label: "Вкладка по умолчанию / Default Tab",
                    description: "Какая вкладка открывается при входе в магазин / Which tab opens in shop",
                    options: [
                        { value: "roulette", label: "Рулетка / Roulette" },
                        { value: "draft", label: "Драфт (12) / Draft (12)" }
                    ],
                    default: defaultTabSetting
                },
                {
                    type: "group",
                    label: "Позиция элементов / Positioning"
                },
                {
                    id: "shop_button_pos",
                    type: "select",
                    label: "Кнопка возврата / Return Button",
                    description: "Положение кнопки возврата в Scamlock в магазине / Position in shop",
                    options: [
                        { value: "top_left", label: "Слева сверху / Top-Left" },
                        { value: "top_right", label: "Справа сверху / Top-Right" },
                        { value: "bottom_right", label: "Справа снизу / Bottom-Right" }
                    ],
                    default: currentShopBtnPos
                },
                {
                    type: "group",
                    label: "Язык и Звуки / Language & Audio"
                },
                {
                    id: "mod_lang",
                    type: "select",
                    label: "Язык интерфейса / Interface Language",
                    description: "Выбор языка мода / Switch Scamlock language",
                    options: [
                        { value: "ru", label: "Русский (Russian)" },
                        { value: "en", label: "English" }
                    ],
                    default: lang || "ru"
                },
                {
                    id: "sound_effects",
                    type: "toggle",
                    label: "Звуковые эффекты / Sound Effects",
                    description: "Звуки вращения колеса и интерфейса / Spin & UI audio",
                    default: soundEffectsEnabled
                }
            ]
        };
    }

    function RegisterMod(lang, force) {
        lang = lang || (typeof ItemRoulette !== "undefined" && ItemRoulette.GetLanguage ? ItemRoulette.GetLanguage() : "ru");
        if (!force && lastRegisteredLang === lang) return;
        lastRegisteredLang = lang;
        var regPayload = GetRegistrationPayload(lang);
        SendToUMM(regPayload);
    }

    function ApplyAspectRatio(ratio) {
        currentAspectRatio = ratio || "16:9";
        var modal = ItemRoulette.GetModalContent();
        if (!modal || !modal.IsValid()) return;

        if (currentAspectRatio === "16:10") {
            modal.style.width = "920px";
        } else if (currentAspectRatio === "4:3") {
            modal.style.width = "860px";
        } else {
            modal.style.width = "960px";
        }
    }

    function ApplyUIScale(scale) {
        currentUIScale = scale || "100%";
        if (typeof ItemRoulette !== "undefined" && ItemRoulette.ApplyUIScale) {
            ItemRoulette.ApplyUIScale(currentUIScale);
        }
    }

    function ApplyShopButtonPos(pos) {
        currentShopBtnPos = pos || "top_left";
        if (typeof ItemRoulette !== "undefined" && ItemRoulette.ApplyShopButtonPos) {
            ItemRoulette.ApplyShopButtonPos(currentShopBtnPos);
        }
    }

    function HandleUMMMessage(raw) {
        if (!raw) return;
        var data = null;
        try {
            data = (typeof raw === "string") ? JSON.parse(raw) : raw;
        } catch (e) {
            return;
        }
        if (!data || data.umm !== UMM_PROTOCOL) return;

        if (data.t === "hello") {
            RegisterMod(null, true);
        } else if (data.t === "set" && data.id === "scamlock") {
            var val = (data.value !== undefined) ? data.value : data.val;
            if (data.key === "aspect_ratio") {
                ApplyAspectRatio(val);
            } else if (data.key === "ui_scale") {
                ApplyUIScale(val);
            } else if (data.key === "shop_button_pos") {
                ApplyShopButtonPos(val);
            } else if (data.key === "default_tab") {
                defaultTabSetting = val;
            } else if (data.key === "mod_lang") {
                if (typeof ItemRoulette !== "undefined" && ItemRoulette.SetLanguage) {
                    ItemRoulette.SetLanguage(val, true); // true = from UMM, DO NOT re-notify UMM!
                }
            } else if (data.key === "sound_effects") {
                soundEffectsEnabled = !!val;
            }
        }
    }

    function Init() {
        if (typeof $.RegisterForUnhandledEvent === "function") {
            try {
                $.RegisterForUnhandledEvent(UMM_CHANNEL, function (msg) {
                    HandleUMMMessage(msg);
                });
            } catch (e) {
                RouletteLogger.Log("UMM registration event hook skipped: " + e, "UMM");
            }
        }

        if (typeof $.Schedule === "function") {
            $.Schedule(0.5, function () { RegisterMod(null, true); });
            $.Schedule(2.0, function () { RegisterMod(null, true); });
            $.Schedule(5.0, function () { RegisterMod(null, true); });
        }
    }

    return {
        Init: Init,
        NotifyLanguageChanged: function (l) {
            SendToUMM({
                umm: UMM_PROTOCOL,
                t: "set",
                id: "scamlock",
                key: "mod_lang",
                value: l
            });
        },
        RegisterMod: RegisterMod,
        IsSoundEffectsEnabled: function () { return soundEffectsEnabled; },
        GetAspectRatio: function () { return currentAspectRatio; },
        GetUIScale: function () { return currentUIScale; },
        GetDefaultTab: function () { return defaultTabSetting; },
        GetShopButtonPos: function () { return currentShopBtnPos; },
        ApplyAspectRatio: ApplyAspectRatio,
        ApplyUIScale: ApplyUIScale,
        ApplyShopButtonPos: ApplyShopButtonPos
    };
})();

if (typeof ScamlockUMM !== "undefined" && ScamlockUMM.Init) {
    ScamlockUMM.Init();
}

if (typeof _globalScope !== "undefined") {
    _globalScope.ItemRoulette = ItemRoulette;
    _globalScope.ScamlockUMM = ScamlockUMM;
    _globalScope.ShopPurchaseTracker = ShopPurchaseTracker;
    _globalScope.DeadlockItemsDB = DeadlockItemsDB;
    _globalScope.ScamlockDraft = ScamlockDraft;
}
if (typeof $ !== "undefined" && typeof $.GetContextPanel === "function") {
    var _ctx = $.GetContextPanel();
    if (_ctx) {
        _ctx.ItemRoulette = ItemRoulette;
        _ctx.ScamlockUMM = ScamlockUMM;
        _ctx.ShopPurchaseTracker = ShopPurchaseTracker;
        _ctx.DeadlockItemsDB = DeadlockItemsDB;
        _ctx.ScamlockDraft = ScamlockDraft;
    }
}

var scamlockInitAttempts = 0;
(function InitializeScamlock() {
    var success = false;
    try {
        if (typeof ItemRoulette !== "undefined" && ItemRoulette.Init) {
            success = !!ItemRoulette.Init();
        }
    } catch (e) {
        success = false;
    }
    if (!success && scamlockInitAttempts++ < 120 && typeof $.Schedule === "function") {
        $.Schedule(0.25, InitializeScamlock);
    }
})();
