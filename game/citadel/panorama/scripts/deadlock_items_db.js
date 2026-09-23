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

    return {
        ITEMS: ITEMS,
        TIER_COSTS: TIER_COSTS,
        TIER_COLORS: TIER_COLORS,
        TIER_NAMES: TIER_NAMES,
        GetTierWeights: GetTierWeights,
        PickRandomWinningItem: PickRandomWinningItem
    };
})();
