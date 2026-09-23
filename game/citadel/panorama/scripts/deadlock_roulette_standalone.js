"use strict";

// DEADLOCK ITEM ROULETTE MOD - STANDALONE ENGINE

"use strict";

/**
 * Deadlock Item Database for Item Roulette Mod
 * Contains full catalogue of Weapon, Vitality and Spirit items across all 4 Tiers.
 */
var DeadlockItemsDB = (function () {
    var TIER_COSTS = {
        1: 500,
        2: 1250,
        3: 3000,
        4: 6200
    };

    var TIER_COLORS = {
        1: "#52b788", // Military Green / Emerald
        2: "#4ea8de", // Industrial Cyan / Cobalt
        3: "#b5179e", // Occult Purple / Amethyst
        4: "#f77f00"  // Legendary Amber / Gold
    };

    var TIER_NAMES = {
        1: { en: "Tier 1", ru: "Тир 1" },
        2: { en: "Tier 2", ru: "Тир 2" },
        3: { en: "Tier 3", ru: "Тир 3" },
        4: { en: "Tier 4", ru: "Тир 4" }
    };

    var ITEMS = [
        // ==========================================
        // WEAPON ITEMS (Оружие)
        // ==========================================
        // Tier 1 (500)
        { id: "basic_magazine", name: "Basic Magazine", ruName: "Базовый магазин", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/basic_magazine_psd.vtex" },
        { id: "close_quarters", name: "Close Quarters", ruName: "В упор", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/close_quarters_psd.vtex" },
        { id: "headshot_booster", name: "Headshot Booster", ruName: "Усилитель выстрелов в голову", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/headshot_booster_psd.vtex" },
        { id: "high_velocity_rounds", name: "High-Velocity Rounds", ruName: "Высокоскоростные патроны", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/recharging_rounds_psd.vtex" },
        { id: "hollow_point_rounds", name: "Hollow Point Rounds", ruName: "Экспансивные пули", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/hollow_point_psd.vtex" },
        { id: "monster_rounds", name: "Monster Rounds", ruName: "Патроны против монстров", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/monster_rounds_psd.vtex" },
        { id: "rapid_rounds", name: "Rapid Rounds", ruName: "Скорострельные патроны", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/swift_striker_psd.vtex" },
        { id: "restorative_shot", name: "Restorative Shot", ruName: "Восстанавливающий выстрел", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/blood_tribute_psd.vtex" },

        // Tier 2 (1250)
        { id: "active_reload", name: "Active Reload", ruName: "Активная перезарядка", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/active_reload_psd.vtex" },
        { id: "berserker", name: "Berserker", ruName: "Берсерк", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/berserker_psd.vtex" },
        { id: "kinetic_dash", name: "Kinetic Dash", ruName: "Кинетический рывок", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/rapid_recharge_psd.vtex" },
        { id: "long_range", name: "Long Range", ruName: "Дальний бой", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/sharpshooter_psd.vtex" },
        { id: "melee_charge", name: "Melee Charge", ruName: "Рывок ближнего боя", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/crushing_fists_psd.vtex" },
        { id: "mystic_shot", name: "Mystic Shot", ruName: "Мистический выстрел", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/spirit_strike_bullets_psd.vtex" },
        { id: "slowing_bullets", name: "Slowing Bullets", ruName: "Замедляющие пули", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/weighted_shots_psd.vtex" },
        { id: "soul_shredder_bullets", name: "Soul Shredder Bullets", ruName: "Пули крушителя душ", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/spirit_shredder_bullets_psd.vtex" },
        { id: "swift_striker", name: "Swift Striker", ruName: "Стремительный стрелок", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/swift_striker_psd.vtex" },
        { id: "fleetfoot", name: "Fleetfoot", ruName: "Быстроног", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/speed_burst_psd.vtex" },

        // Tier 3 (3000)
        { id: "burst_fire", name: "Burst Fire", ruName: "Очередь выстрелов", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/burst_fire_psd.vtex" },
        { id: "escalating_resilience", name: "Escalating Resilience", ruName: "Нарастающая стойкость", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/escalating_resilience_psd.vtex" },
        { id: "headhunter", name: "Headhunter", ruName: "Охотник за головами", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/headhunter_psd.vtex" },
        { id: "heroic_aura", name: "Heroic Aura", ruName: "Героическая аура", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/heroic_aura_psd.vtex" },
        { id: "intensifying_magazine", name: "Intensifying Magazine", ruName: "Усиливающийся магазин", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/intensifying_clip_psd.vtex" },
        { id: "point_blank", name: "Point Blank", ruName: "В упор (Улучшенный)", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/point_blank_psd.vtex" },
        { id: "pristine_emblem", name: "Pristine Emblem", ruName: "Безупречная эмблема", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/pristine_emblem_psd.vtex" },
        { id: "sharpshooter", name: "Sharpshooter", ruName: "Меткий стрелок", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/sharpshooter_psd.vtex" },
        { id: "tesla_bullets", name: "Tesla Bullets", ruName: "Пули Теслы", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/tesla_bullets_psd.vtex" },
        { id: "titanic_magazine", name: "Titanic Magazine", ruName: "Титанический магазин", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/titanic_magazine_psd.vtex" },
        { id: "toxic_bullets", name: "Toxic Bullets", ruName: "Токсичные пули", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/toxic_bullets_psd.vtex" },
        { id: "alchemical_fire", name: "Alchemical Fire", ruName: "Алхимический огонь", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/alchemical_fire_psd.vtex" },
        { id: "warp_stone", name: "Warp Stone", ruName: "Камень искажения", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/warp_stone_psd.vtex" },

        // Tier 4 (6200)
        { id: "crippling_headshot", name: "Crippling Headshot", ruName: "Калечащий хедшот", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/crippling_headshot_psd.vtex" },
        { id: "frenzy", name: "Frenzy", ruName: "Безумие", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/frenzy_psd.vtex" },
        { id: "glass_cannon", name: "Glass Cannon", ruName: "Стеклянная пушка", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/glass_cannon_psd.vtex" },
        { id: "lucky_shot", name: "Lucky Shot", ruName: "Удачный выстрел", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/lucky_shot_psd.vtex" },
        { id: "ricochet", name: "Ricochet", ruName: "Рикошет", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/ricochet_psd.vtex" },
        { id: "silencer", name: "Silencer", ruName: "Глушитель", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/silencer_psd.vtex" },
        { id: "spiritual_overflow", name: "Spiritual Overflow", ruName: "Спиритический переизбыток", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/spiritual_overflow_psd.vtex" },
        { id: "siphon_bullets", name: "Siphon Bullets", ruName: "Вытягивающие пули", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/vampiric_burst_psd.vtex" },

        // ==========================================
        // VITALITY ITEMS (Живучесть / Броня)
        // ==========================================
        // Tier 1 (500)
        { id: "extra_health", name: "Extra Health", ruName: "Дополнительное здоровье", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/extra_health_psd.vtex" },
        { id: "extra_regen", name: "Extra Regen", ruName: "Дополнительная регенерация", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/extra_regen_psd.vtex" },
        { id: "extra_stamina", name: "Extra Stamina", ruName: "Дополнительная выносливость", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/extra_stamina_psd.vtex" },
        { id: "healing_rite", name: "Healing Rite", ruName: "Обряд исцеления", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/healing_rite_psd.vtex" },
        { id: "melee_lifesteal", name: "Melee Lifesteal", ruName: "Вампиризм ближнего боя", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/lifestrike_psd.vtex" },
        { id: "sprint_boots", name: "Sprint Boots", ruName: "Сапоги спринта", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/sprint_boots_psd.vtex" },

        // Tier 2 (1250)
        { id: "bullet_armor", name: "Bullet Armor", ruName: "Бронежилет", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/bullet_resilience_psd.vtex" },
        { id: "bullet_lifesteal", name: "Bullet Lifesteal", ruName: "Вампиризм от пуль", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/bullet_lifesteal_psd.vtex" },
        { id: "combat_barrier", name: "Combat Barrier", ruName: "Боевой барьер", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/combat_barrier_psd.vtex" },
        { id: "debuff_reducer", name: "Debuff Reducer", ruName: "Снижение дебаффов", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/debuff_reducer_psd.vtex" },
        { id: "divine_barrier", name: "Divine Barrier", ruName: "Божественный барьер", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/divine_barrier_psd.vtex" },
        { id: "enchanters_barrier", name: "Enchanter's Barrier", ruName: "Барьер чародея", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/spirit_shielding_psd.vtex" },
        { id: "enduring_speed", name: "Enduring Speed", ruName: "Стойкая скорость", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/enduring_speed_psd.vtex" },
        { id: "healbane", name: "Healbane", ruName: "Погибель исцеления", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/healbane_psd.vtex" },
        { id: "healing_booster", name: "Healing Booster", ruName: "Усилитель исцеления", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/healing_booster_psd.vtex" },
        { id: "reactive_barrier", name: "Reactive Barrier", ruName: "Реактивный барьер", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/reactive_barrier_psd.vtex" },
        { id: "restorative_locket", name: "Restorative Locket", ruName: "Восстанавливающий медальон", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/restorative_locket_psd.vtex" },
        { id: "spirit_armor", name: "Spirit Armor", ruName: "Спиритическая броня", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/spirit_resilience_psd.vtex" },
        { id: "spirit_lifesteal", name: "Spirit Lifesteal", ruName: "Спиритический вампиризм", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/spirit_lifesteal_psd.vtex" },

        // Tier 3 (3000)
        { id: "debuff_remover", name: "Debuff Remover", ruName: "Снятие дебаффов", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/debuff_remover_psd.vtex" },
        { id: "fortitude", name: "Fortitude", ruName: "Стойкость духа", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/fortitude_psd.vtex" },
        { id: "lifestrike", name: "Lifestrike", ruName: "Удар жизни", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/lifestrike_psd.vtex" },
        { id: "majestic_leap", name: "Majestic Leap", ruName: "Величественный прыжок", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/majestic_leap_psd.vtex" },
        { id: "metal_skin", name: "Metal Skin", ruName: "Металлическая кожа", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/metal_skin_psd.vtex" },
        { id: "superior_stamina", name: "Superior Stamina", ruName: "Превосходная выносливость", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/stamina_mastery_psd.vtex" },
        { id: "veil_walker", name: "Veil Walker", ruName: "Ходок под завесой", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/veil_walker_psd.vtex" },

        // Tier 4 (6200)
        { id: "colossus", name: "Colossus", ruName: "Колосс", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/colossus_psd.vtex" },
        { id: "inhibitor", name: "Inhibitor", ruName: "Ингибитор", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/inhibitor_psd.vtex" },
        { id: "leech", name: "Leech", ruName: "Пиявка", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/leech_psd.vtex" },
        { id: "phantom_strike", name: "Phantom Strike", ruName: "Призрачный удар", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/phantom_strike_psd.vtex" },
        { id: "siphon_barrier", name: "Siphon Barrier", ruName: "Поглощающий барьер", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/siphon_barrier_psd.vtex" },
        { id: "soul_rebirth", name: "Soul Rebirth", ruName: "Возрождение души", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/soul_rebirth_psd.vtex" },
        { id: "unstoppable", name: "Unstoppable", ruName: "Неудержимый", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/unstoppable_psd.vtex" },
        { id: "cheat_death", name: "Cheat Death", ruName: "Обман смерти", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/cheat_death_psd.vtex" },

        // ==========================================
        // SPIRIT ITEMS (Мистика / Спиритизм)
        // ==========================================
        // Tier 1 (500)
        { id: "extra_charge", name: "Extra Charge", ruName: "Дополнительный заряд", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/extra_charge_psd.vtex" },
        { id: "extra_spirit", name: "Extra Spirit", ruName: "Дополнительный дух", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/extra_spirit_psd.vtex" },
        { id: "infuser", name: "Infuser", ruName: "Наполнитель", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/infuser_psd.vtex" },
        { id: "mystic_burst", name: "Mystic Burst", ruName: "Мистический взрыв", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/mystic_burst_psd.vtex" },
        { id: "mystic_reach", name: "Mystic Reach", ruName: "Мистическая дальность", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/mystic_reach_psd.vtex" },
        { id: "spirit_strike", name: "Spirit Strike", ruName: "Спиритический удар", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/spirit_strike_psd.vtex" },

        // Tier 2 (1250)
        { id: "bullet_resist_shredder", name: "Bullet Resist Shredder", ruName: "Крушитель сопротивления пулям", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/bullet_resist_shredder_psd.vtex" },
        { id: "cold_front", name: "Cold Front", ruName: "Холодный фронт", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/cold_front_psd.vtex" },
        { id: "decay", name: "Decay", ruName: "Разложение", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/decay_psd.vtex" },
        { id: "duration_extender", name: "Duration Extender", ruName: "Продлитель длительности", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/duration_extender_psd.vtex" },
        { id: "improved_cooldown", name: "Improved Cooldown", ruName: "Улучшенная перезарядка", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/improved_cooldown_psd.vtex" },
        { id: "improved_reach", name: "Improved Reach", ruName: "Улучшенная дальность", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/improved_reach_psd.vtex" },
        { id: "improved_spirit", name: "Improved Spirit", ruName: "Улучшенный дух", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/improved_spirit_psd.vtex" },
        { id: "mystic_vulnerability", name: "Mystic Vulnerability", ruName: "Мистическая уязвимость", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/mystic_vulnerability_psd.vtex" },
        { id: "quicksilver_reload", name: "Quicksilver Reload", ruName: "Ртутная перезарядка", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/quicksilver_reload_psd.vtex" },
        { id: "slowing_hex", name: "Slowing Hex", ruName: "Замедляющий сглаз", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/slowing_hex_psd.vtex" },
        { id: "suppressor", name: "Suppressor", ruName: "Подавитель", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/suppressor_psd.vtex" },

        // Tier 3 (3000)
        { id: "improved_burst", name: "Improved Burst", ruName: "Улучшенный взрыв", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/improved_burst_psd.vtex" },
        { id: "knockdown", name: "Knockdown", ruName: "Оглушение / Нокдаун", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/knockdown_psd.vtex" },
        { id: "rapid_recharge", name: "Rapid Recharge", ruName: "Быстрая подзарядка", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/rapid_recharge_psd.vtex" },
        { id: "silence_glyph", name: "Silence Glyph", ruName: "Глиф безмолвия", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/silence_glyph_psd.vtex" },
        { id: "superior_cooldown", name: "Superior Cooldown", ruName: "Превосходная перезарядка", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/superior_cooldown_psd.vtex" },
        { id: "superior_duration", name: "Superior Duration", ruName: "Превосходная длительность", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/superior_duration_psd.vtex" },
        { id: "surge_of_power", name: "Surge of Power", ruName: "Всплеск силы", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/surge_of_power_psd.vtex" },
        { id: "torment_pulse", name: "Torment Pulse", ruName: "Импульс мучений", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/torment_pulse_psd.vtex" },

        // Tier 4 (6200)
        { id: "boundless_spirit", name: "Boundless Spirit", ruName: "Безграничный дух", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/boundless_spirit_psd.vtex" },
        { id: "curse", name: "Curse", ruName: "Проклятие", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/curse_psd.vtex" },
        { id: "diviners_kevlar", name: "Diviner's Kevlar", ruName: "Кевлар провидца", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/diviners_kevlar_psd.vtex" },
        { id: "echo_shard", name: "Echo Shard", ruName: "Осколок эха", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/echo_shard_psd.vtex" },
        { id: "escalating_exposure", name: "Escalating Exposure", ruName: "Нарастающая уязвимость", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/escalating_exposure_psd.vtex" },
        { id: "magic_carpet", name: "Magic Carpet", ruName: "Ковер-самолет", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/magic_carpet_psd.vtex" },
        { id: "mystic_slow", name: "Mystic Slow", ruName: "Мистическое замедление", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/mystic_slow_psd.vtex" },
        { id: "refresher", name: "Refresher", ruName: "Освежитель", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/refresher_psd.vtex" },
        { id: "scourge_whip", name: "Scourge Whip", ruName: "Бич бедствий", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/scourge_whip_psd.vtex" }
    ];

    /**
     * Get tier weights based on player's total accumulated souls.
     * Early game focuses on T1, scaling up to late game where T3 and T4 dominate.
     */
    function GetTierWeights(totalSouls) {
        if (!totalSouls || totalSouls < 3500) {
            // Early game: predominantly Tier 1, slight chance of Tier 2
            return { 1: 85, 2: 15, 3: 0, 4: 0, phaseName: "Ранняя игра (Тир 1)" };
        } else if (totalSouls < 8500) {
            // Mid game 1: Tier 2 focus, Tier 1 filler, small chance of Tier 3
            return { 1: 25, 2: 60, 3: 15, 4: 0, phaseName: "Мидгейм I (Тир 1-2)" };
        } else if (totalSouls < 16000) {
            // Mid game 2: Tier 3 focus, Tier 2 secondary, rare Tier 4 jackpot
            return { 1: 10, 2: 30, 3: 50, 4: 10, phaseName: "Мидгейм II (Тир 2-3)" };
        } else {
            // Late game: Tier 3 & Tier 4 power items
            return { 1: 5, 2: 15, 3: 45, 4: 35, phaseName: "Лейтгейм (Тир 3-4)" };
        }
    }

    /**
     * Pick a random item from available items matching tier weights,
     * excluding already owned items.
     */
    function PickRandomWinningItem(totalSouls, ownedItemIds) {
        var weights = GetTierWeights(totalSouls);
        var ownedSet = {};
        if (ownedItemIds && ownedItemIds.length) {
            for (var i = 0; i < ownedItemIds.length; i++) {
                ownedSet[ownedItemIds[i].toLowerCase()] = true;
            }
        }

        // Filter unowned items
        var pool = [];
        for (var j = 0; j < ITEMS.length; j++) {
            var item = ITEMS[j];
            if (!ownedSet[item.id.toLowerCase()] && !ownedSet[item.name.toLowerCase()]) {
                pool.push(item);
            }
        }

        // If all items of a tier are owned, fallback to entire unowned pool
        if (pool.length === 0) {
            pool = ITEMS;
        }

        // Weighted selection by tier
        var tierPools = { 1: [], 2: [], 3: [], 4: [] };
        for (var k = 0; k < pool.length; k++) {
            tierPools[pool[k].tier].push(pool[k]);
        }

        // Calculate active cumulative weights for available tiers
        var cumulative = [];
        var sum = 0;
        for (var t = 1; t <= 4; t++) {
            if (tierPools[t].length > 0 && weights[t] > 0) {
                sum += weights[t];
                cumulative.push({ tier: t, cutoff: sum });
            }
        }

        if (cumulative.length === 0) {
            // Fallback random
            return pool[Math.floor(Math.random() * pool.length)];
        }

        var rand = Math.random() * sum;
        var chosenTier = cumulative[0].tier;
        for (var m = 0; m < cumulative.length; m++) {
            if (rand <= cumulative[m].cutoff) {
                chosenTier = cumulative[m].tier;
                break;
            }
        }

        var candidates = tierPools[chosenTier];
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    
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
        GetOwnedItemNames: GetOwnedItemIds,
        SetTargetItem: SetTargetItem,
        GetTargetItem: GetTargetItem,
        QueueItemForAutoBuy: QueueItemForAutoBuy,
        OnPurchase: OnPurchase
    };
})();



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
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
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
