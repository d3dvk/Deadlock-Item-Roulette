#!/usr/bin/env python3
"""
Deadlock Item Roulette Mod - Optimized, Responsive & Tactile Engine Generator
Includes:
- Verified item database with 100% exact s2r:// textures from pak01
- Brawl item exclusions
- Responsive layout supporting 16:9, 16:10, and 4:3
- Tactile physical button animations (:hover, :active, scale, gradient, bevel)
- Map/session change detection (dl_hideout <-> sandbox <-> match)
- Instantaneous load without frame hitching (lazy reel generation)
"""

import re
from pathlib import Path

BASE_DIR = Path("E:/Deadlock_mod")

# Verified items across 3 categories with exact s2r:// texture paths from Deadlock pak01
# Excluding all 23 Street Brawl / unpurchasable items
ITEMS_DATA = """
    var BRAWL_BLACKLIST = {
        "aerial_mastery": true, "ancient_shielding": true, "apex_combat": true,
        "celestial_guidance": true, "cloak_of_opportunity": true, "eldritch_shot": true,
        "electric_slippers": true, "eternal_gift": true, "frostbite": true,
        "haunting_scream": true, "icarus_wings": true, "infinite_rounds": true,
        "mystical_piano": true, "nullification_aura": true, "omnicharge_pendant": true,
        "patrons_blessing": true, "prism_blast": true, "runed_gauntlets": true,
        "shadow_step": true, "shadow_strike": true, "shrink_ray": true,
        "timeless_emblem": true, "unstable_concoction": true
    };

    var ITEMS = [
        // WEAPON - TIER 1 (500)
        { id: "basic_magazine", name: "Basic Magazine", ruName: "Базовый магазин", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/basic_magazine_psd.vtex" },
        { id: "close_quarters", name: "Close Quarters", ruName: "В упор", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/close_quarters_psd.vtex" },
        { id: "headshot_booster", name: "Headshot Booster", ruName: "Усилитель в голову", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/headshot_booster_psd.vtex" },
        { id: "high_velocity_rounds", name: "High-Velocity Rounds", ruName: "Скоростные патроны", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/high_velocity_rounds_psd.vtex" },
        { id: "hollow_point_rounds", name: "Hollow Point Rounds", ruName: "Экспансивные пули", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/hollow_point_psd.vtex" },
        { id: "monster_rounds", name: "Monster Rounds", ruName: "Пули против монстров", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/monster_rounds_psd.vtex" },
        { id: "rapid_rounds", name: "Rapid Rounds", ruName: "Быстрые патроны", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/rapid_rounds_psd.vtex" },
        { id: "restorative_shot", name: "Restorative Shot", ruName: "Целебный выстрел", category: "Weapon", tier: 1, cost: 500, image: "s2r://panorama/images/items/weapon/restorative_shot_psd.vtex" },

        // WEAPON - TIER 2 (1250)
        { id: "active_reload", name: "Active Reload", ruName: "Активная перезарядка", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/active_reload_psd.vtex" },
        { id: "berserker", name: "Berserker", ruName: "Берсерк", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/berserker_psd.vtex" },
        { id: "kinetic_dash", name: "Kinetic Dash", ruName: "Кинетический рывок", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/kinetic_dash_psd.vtex" },
        { id: "long_range", name: "Long Range", ruName: "Дальний бой", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/long_range_psd.vtex" },
        { id: "melee_charge", name: "Melee Charge", ruName: "Рывок ближнего боя", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/melee_charge_psd.vtex" },
        { id: "mystic_shot", name: "Mystic Shot", ruName: "Мистический выстрел", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/mystic_burst_psd.vtex" },
        { id: "slowing_bullets", name: "Slowing Bullets", ruName: "Замедляющие пули", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/slowing_bullets_psd.vtex" },
        { id: "soul_shredder_bullets", name: "Soul Shredder Bullets", ruName: "Пули крушителя душ", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/soul_shredder_bullets_psd.vtex" },
        { id: "swift_striker", name: "Swift Striker", ruName: "Стремительный стрелок", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/swift_striker_psd.vtex" },
        { id: "fleetfoot", name: "Fleetfoot", ruName: "Быстроног", category: "Weapon", tier: 2, cost: 1250, image: "s2r://panorama/images/items/weapon/fleetfoot_psd.vtex" },

        // WEAPON - TIER 3 (3000)
        { id: "burst_fire", name: "Burst Fire", ruName: "Очередь выстрелов", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/burst_fire_psd.vtex" },
        { id: "escalating_resilience", name: "Escalating Resilience", ruName: "Нарастающая стойкость", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/escalating_resilience_psd.vtex" },
        { id: "headhunter", name: "Headhunter", ruName: "Охотник за головами", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/headhunter_psd.vtex" },
        { id: "heroic_aura", name: "Heroic Aura", ruName: "Героическая аура", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/heroic_aura_psd.vtex" },
        { id: "intensifying_magazine", name: "Intensifying Magazine", ruName: "Усиливающийся магазин", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/basic_magazine_psd.vtex" },
        { id: "point_blank", name: "Point Blank", ruName: "В упор (Улучшенный)", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/point_blank_psd.vtex" },
        { id: "pristine_emblem", name: "Pristine Emblem", ruName: "Безупречная эмблема", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/enchanters_emblem_psd.vtex" },
        { id: "sharpshooter", name: "Sharpshooter", ruName: "Меткий стрелок", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/sharp_shooter_psd.vtex" },
        { id: "tesla_bullets", name: "Tesla Bullets", ruName: "Пули Теслы", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/tesla_bullets_psd.vtex" },
        { id: "titanic_magazine", name: "Titanic Magazine", ruName: "Титанический магазин", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/titanic_magazine_psd.vtex" },
        { id: "toxic_bullets", name: "Toxic Bullets", ruName: "Токсичные пули", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/toxic_bullets_psd.vtex" },
        { id: "alchemical_fire", name: "Alchemical Fire", ruName: "Алхимический огонь", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/weapon/alchemical_fire_psd.vtex" },
        { id: "warp_stone", name: "Warp Stone", ruName: "Камень искажения", category: "Weapon", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/warp_stone_psd.vtex" },

        // WEAPON - TIER 4 (6200)
        { id: "crippling_headshot", name: "Crippling Headshot", ruName: "Калечащий хедшот", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/crippling_headshot_psd.vtex" },
        { id: "frenzy", name: "Frenzy", ruName: "Безумие", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/frenzy_psd.vtex" },
        { id: "glass_cannon", name: "Glass Cannon", ruName: "Стеклянная пушка", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/glass_cannon_psd.vtex" },
        { id: "lucky_shot", name: "Lucky Shot", ruName: "Удачный выстрел", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/lucky_shot_psd.vtex" },
        { id: "ricochet", name: "Ricochet", ruName: "Рикошет", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/ricochet_psd.vtex" },
        { id: "silencer", name: "Silencer", ruName: "Глушитель", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/silencer_psd.vtex" },
        { id: "spiritual_overflow", name: "Spiritual Overflow", ruName: "Спиритический избыток", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/weapon/spiritual_overflow_psd.vtex" },
        { id: "siphon_bullets", name: "Siphon Bullets", ruName: "Вытягивающие пули", category: "Weapon", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/siphon_bullets_psd.vtex" },

        // VITALITY - TIER 1 (500)
        { id: "extra_health", name: "Extra Health", ruName: "Доп. здоровье", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/extra_health_psd.vtex" },
        { id: "extra_regen", name: "Extra Regen", ruName: "Доп. регенерация", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/extra_regen_psd.vtex" },
        { id: "extra_stamina", name: "Extra Stamina", ruName: "Доп. выносливость", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/extra_stamina_psd.vtex" },
        { id: "healing_rite", name: "Healing Rite", ruName: "Обряд исцеления", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/healing_rite_psd.vtex" },
        { id: "melee_lifesteal", name: "Melee Lifesteal", ruName: "Вампиризм вблизи", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/melee_lifesteal_psd.vtex" },
        { id: "sprint_boots", name: "Sprint Boots", ruName: "Сапоги спринта", category: "Vitality", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/sprint_boots_psd.vtex" },

        // VITALITY - TIER 2 (1250)
        { id: "bullet_armor", name: "Bullet Armor", ruName: "Бронежилет", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/plated_armor_psd.vtex" },
        { id: "bullet_lifesteal", name: "Bullet Lifesteal", ruName: "Вампиризм от пуль", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/siphon_bullets_psd.vtex" },
        { id: "debuff_reducer", name: "Debuff Reducer", ruName: "Снижение дебаффов", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/debuff_reducer_psd.vtex" },
        { id: "divine_barrier", name: "Divine Barrier", ruName: "Божественный барьер", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/divine_barrier_psd.vtex" },
        { id: "enduring_speed", name: "Enduring Speed", ruName: "Стойкая скорость", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/enduring_speed_psd.vtex" },
        { id: "healbane", name: "Healbane", ruName: "Погибель исцеления", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/healbane_psd.vtex" },
        { id: "healing_booster", name: "Healing Booster", ruName: "Усилитель исцеления", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/healing_booster_psd.vtex" },
        { id: "reactive_barrier", name: "Reactive Barrier", ruName: "Реактивный барьер", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/reactive_barrier_psd.vtex" },
        { id: "restorative_locket", name: "Restorative Locket", ruName: "Медальон восстановления", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/restorative_locket_psd.vtex" },
        { id: "spirit_armor", name: "Spirit Armor", ruName: "Броня духа", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/spirit_resilience_psd.vtex" },
        { id: "spirit_lifesteal", name: "Spirit Lifesteal", ruName: "Вампиризм духа", category: "Vitality", tier: 2, cost: 1250, image: "s2r://panorama/images/items/vitality/spirit_lifesteal_psd.vtex" },

        // VITALITY - TIER 3 (3000)
        { id: "debuff_remover", name: "Debuff Remover", ruName: "Снятие дебаффов", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/debuff_remover_psd.vtex" },
        { id: "fortitude", name: "Fortitude", ruName: "Стойкость", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/fortitude_psd.vtex" },
        { id: "healing_nova", name: "Healing Nova", ruName: "Кольцо исцеления", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/healing_nova_psd.vtex" },
        { id: "lifestrike", name: "Lifestrike", ruName: "Удар жизни", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/lifestrike_psd.vtex" },
        { id: "majestic_leap", name: "Majestic Leap", ruName: "Величественный прыжок", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/majestic_leap_psd.vtex" },
        { id: "metal_skin", name: "Metal Skin", ruName: "Стальная кожа", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/metal_skin_psd.vtex" },
        { id: "rescue_beam", name: "Rescue Beam", ruName: "Спасительный луч", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/rescue_beam_psd.vtex" },
        { id: "return_fire", name: "Return Fire", ruName: "Ответный огонь", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/return_fire_psd.vtex" },
        { id: "veil_walker", name: "Veil Walker", ruName: "Идущий сквозь завесу", category: "Vitality", tier: 3, cost: 3000, image: "s2r://panorama/images/items/vitality/veil_walker_psd.vtex" },

        // VITALITY - TIER 4 (6200)
        { id: "colossus", name: "Colossus", ruName: "Колосс", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/colossus_psd.vtex" },
        { id: "inhibitor", name: "Inhibitor", ruName: "Ингибитор", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/inhibitor_psd.vtex" },
        { id: "leech", name: "Leech", ruName: "Пиявка", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/leech_psd.vtex" },
        { id: "phantom_strike", name: "Phantom Strike", ruName: "Призрачный удар", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/phantom_strike_psd.vtex" },
        { id: "unstoppable", name: "Unstoppable", ruName: "Неудержимый", category: "Vitality", tier: 4, cost: 6200, image: "s2r://panorama/images/items/vitality/unstoppable_psd.vtex" },

        // SPIRIT - TIER 1 (500)
        { id: "ammo_scavenger", name: "Ammo Scavenger", ruName: "Сборщик патронов", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/extra_spirit_psd.vtex" },
        { id: "extra_charge", name: "Extra Charge", ruName: "Доп. заряд", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/extra_charge_psd.vtex" },
        { id: "extra_spirit", name: "Extra Spirit", ruName: "Доп. спиритизм", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/extra_spirit_psd.vtex" },
        { id: "mystic_burst", name: "Mystic Burst", ruName: "Мистический взрыв", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/mystic_burst_psd.vtex" },
        { id: "mystic_reach", name: "Mystic Reach", ruName: "Мистическая дальность", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/mystic_reach_psd.vtex" },
        { id: "spirit_strike", name: "Spirit Strike", ruName: "Удар духа", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/spirit/spirit_strike_psd.vtex" },
        { id: "infuser", name: "Infuser", ruName: "Наполнитель", category: "Spirit", tier: 1, cost: 500, image: "s2r://panorama/images/items/vitality/infuser_psd.vtex" },

        // SPIRIT - TIER 2 (1250)
        { id: "bullet_resist_shredder", name: "Bullet Resist Shredder", ruName: "Крушитель сопротивления", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/bullet_resist_shredder_psd.vtex" },
        { id: "cold_front", name: "Cold Front", ruName: "Холодный фронт", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/cold_front_psd.vtex" },
        { id: "decay", name: "Decay", ruName: "Увядание", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/decay_psd.vtex" },
        { id: "duration_extender", name: "Duration Extender", ruName: "Продлитель эффектов", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/duration_extender_psd.vtex" },
        { id: "improved_cooldown", name: "Improved Cooldown", ruName: "Ускорение способностей", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/improved_cooldown_psd.vtex" },
        { id: "improved_spirit", name: "Improved Spirit", ruName: "Усиленный спиритизм", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/improved_spirit_psd.vtex" },
        { id: "mystic_vulnerability", name: "Mystic Vulnerability", ruName: "Мистическая уязвимость", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/mystic_vulnerability_psd.vtex" },
        { id: "quicksilver_reload", name: "Quicksilver Reload", ruName: "Ртутная перезарядка", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/quicksilver_reload_psd.vtex" },
        { id: "slowing_hex", name: "Slowing Hex", ruName: "Замедляющий сглаз", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/slowing_hex_psd.vtex" },
        { id: "suppressor", name: "Suppressor", ruName: "Подавитель", category: "Spirit", tier: 2, cost: 1250, image: "s2r://panorama/images/items/spirit/suppressor_psd.vtex" },

        // SPIRIT - TIER 3 (3000)
        { id: "improved_burst", name: "Improved Burst", ruName: "Улучшенный взрыв", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/mystic_burst_psd.vtex" },
        { id: "improved_reach", name: "Improved Reach", ruName: "Улучшенная дальность", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/mystic_reach_psd.vtex" },
        { id: "knockdown", name: "Knockdown", ruName: "Оглушающий удар", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/knockdown_psd.vtex" },
        { id: "rapid_recharge", name: "Rapid Recharge", ruName: "Быстрая перезарядка зарядов", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/rapid_recharge_psd.vtex" },
        { id: "silence_glyph", name: "Silence Glyph", ruName: "Глиф безмолвия", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/silence_glyph_psd.vtex" },
        { id: "surge_of_power", name: "Surge of Power", ruName: "Всплеск силы", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/surge_of_power_psd.vtex" },
        { id: "torment_pulse", name: "Torment Pulse", ruName: "Пульс мучений", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/torment_pulse_psd.vtex" },
        { id: "ethereal_shift", name: "Ethereal Shift", ruName: "Эфирный сдвиг", category: "Spirit", tier: 3, cost: 3000, image: "s2r://panorama/images/items/spirit/ethereal_shift_psd.vtex" },

        // SPIRIT - TIER 4 (6200)
        { id: "boundless_spirit", name: "Boundless Spirit", ruName: "Безграничный дух", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/boundless_spirit_psd.vtex" },
        { id: "curse", name: "Curse", ruName: "Проклятие", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/curse_psd.vtex" },
        { id: "echo_shard", name: "Echo Shard", ruName: "Осколок эха", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/echo_shard_psd.vtex" },
        { id: "magic_carpet", name: "Magic Carpet", ruName: "Ковёр-самолёт", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/magic_carpet_psd.vtex" },
        { id: "refresher", name: "Refresher", ruName: "Освежитель способностей", category: "Spirit", tier: 4, cost: 6200, image: "s2r://panorama/images/items/spirit/refresher_psd.vtex" }
    ];
"""

ROULETTE_JS_TEMPLATE = """
"use strict";

// Compatibility stub for any external mods checking QOL icons
if (typeof this.QOL_LITE_PURCHASE_ICONS === "undefined") {
    this.QOL_LITE_PURCHASE_ICONS = {};
}

// =========================================================================
// 1. DEADLOCK ITEMS DATABASE
// =========================================================================
var DeadlockItemsDB = (function () {
""" + ITEMS_DATA + """

    function GetTierWeights(totalSouls) {
        if (!totalSouls || totalSouls < 2500) {
            return { 1: 85, 2: 15, 3: 0, 4: 0, phaseName: "Ранняя игра (Тир 1)" };
        } else if (totalSouls < 6500) {
            return { 1: 25, 2: 60, 3: 15, 4: 0, phaseName: "Мидгейм I (Тир 1-2)" };
        } else if (totalSouls < 14000) {
            return { 1: 5, 2: 30, 3: 50, 4: 15, phaseName: "Мидгейм II (Тир 2-3)" };
        } else {
            return { 1: 0, 2: 15, 3: 50, 4: 35, phaseName: "Лейтгейм (Тир 3-4)" };
        }
    }

    function GetCandidateItems(ownedItemIds, totalSouls) {
        var ownedSet = {};
        if (ownedItemIds && ownedItemIds.length) {
            for (var i = 0; i < ownedItemIds.length; i++) {
                ownedSet[ownedItemIds[i].toLowerCase()] = true;
            }
        }
        var pool = [];
        var weights = GetTierWeights(totalSouls);
        for (var j = 0; j < ITEMS.length; j++) {
            var it = ITEMS[j];
            if (BRAWL_BLACKLIST[it.id]) continue;
            if (ownedSet[it.id.toLowerCase()] || ownedSet[it.name.toLowerCase()]) continue;
            // Only include tiers that have active probability weight
            if (weights[it.tier] > 0) {
                pool.push(it);
            }
        }
        return pool.length > 0 ? pool : ITEMS;
    }

    function PickRandomWinningItem(totalSouls, ownedItemIds) {
        var pool = GetCandidateItems(ownedItemIds, totalSouls);
        var weights = GetTierWeights(totalSouls);

        var tierPools = { 1: [], 2: [], 3: [], 4: [] };
        for (var k = 0; k < pool.length; k++) {
            tierPools[pool[k].tier].push(pool[k]);
        }

        var cumulative = [];
        var sum = 0;
        for (var t = 1; t <= 4; t++) {
            if (tierPools[t].length > 0 && weights[t] > 0) {
                sum += weights[t];
                cumulative.push({ tier: t, cutoff: sum });
            }
        }

        if (cumulative.length === 0) {
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
        GetTierWeights: GetTierWeights,
        PickRandomWinningItem: PickRandomWinningItem,
        PickRandomWeightedItem: function (owned, totalSouls) {
            return PickRandomWinningItem(totalSouls, owned);
        },
        GetCandidateItems: GetCandidateItems
    };
})();

// =========================================================================
// 2. SHOP PURCHASE TRACKER & AUTO-BUY BRIDGE
// =========================================================================
var ShopPurchaseTracker = (function () {
    var currentTargetItem = null;
    var isTrackerActive = false;
    var lastKnownGold = 0;
    var lastKnownTotalSouls = 0;
    var onPurchaseCallbacks = [];

    function GetAbsoluteRoot() {
        var p = $.GetContextPanel();
        while (p && p.GetParent && p.GetParent()) {
            p = p.GetParent();
        }
        return p;
    }

    function GetPlayerGold() {
        var root = GetAbsoluteRoot();
        if (!root) return 0;
        var goldLabel = root.FindChildTraverse("CurrentGoldAmount") || root.FindChildTraverse("GoldAmount");
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
            var label = soulsContainer.FindChildTraverse("AbilitiesLabel");
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

    function GetOwnedItemIds() {
        var owned = [];
        var root = GetAbsoluteRoot();
        if (!root) return owned;

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

        var recentContainer = root.FindChildTraverse("RecentPurchasesContainer");
        if (recentContainer && recentContainer.IsValid()) {
            var purchases = recentContainer.FindChildrenWithClassTraverse("recentPurchase");
            for (var j = 0; j < purchases.length; j++) {
                var p = purchases[j];
                if (!p || !p.IsValid()) continue;
                var nameLabel = p.FindChildrenWithClassTraverse("recentModPurchaseName")[0];
                if (nameLabel && nameLabel.IsValid() && nameLabel.text) {
                    owned.push(nameLabel.text.trim());
                }
            }
        }
        return owned;
    }

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
                        $.DispatchEvent("ContextMenu", mod);
                        return true;
                    } catch (e) {}
                }
            }
        }
        return false;
    }

    function StartTracker() {
        if (isTrackerActive) return;
        isTrackerActive = true;
        Tick();
    }

    function Tick() {
        if (!isTrackerActive) return;
        try {
            if (currentTargetItem && CheckIsTargetItemPurchased()) {
                var purchased = currentTargetItem;
                currentTargetItem = null;
                try {
                    $.DispatchEvent("PlaySoundEffect", "UI.Shop.Mod.Purchased");
                } catch (err) {}
                for (var i = 0; i < onPurchaseCallbacks.length; i++) {
                    try {
                        onPurchaseCallbacks[i](purchased);
                    } catch (cbErr) {}
                }
            }
        } catch (e) {}
        $.Schedule(0.2, Tick);
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
// 3. RESPONSIVE & TACTILE ITEM ROULETTE ENGINE
// =========================================================================
var ItemRoulette = (function () {
    var TOTAL_CARDS = 60;
    var WINNING_INDEX = 48;
    var SPIN_DURATION = 5.2;

    var isSpinning = false;
    var isVanillaShopMode = false;
    var overlayPanel = null;
    var reelPanel = null;
    var carouselContainer = null;
    var spinButton = null;
    var spinBtnText = null;
    var statusLabel = null;
    var phaseBadge = null;
    var soulsLabel = null;
    var targetCard = null;
    var targetIcon = null;
    var targetName = null;
    var targetProgressFill = null;
    var targetProgressText = null;
    var returnToRouletteBtn = null;
    var initialized = false;
    var lastKnownMap = "";

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

    function GetCardMetrics() {
        // Responsive card width based on viewport
        var viewWidth = 1080;
        if (carouselContainer && carouselContainer.actuallayoutwidth > 0) {
            viewWidth = carouselContainer.actuallayoutwidth;
        } else if (overlayPanel && overlayPanel.actuallayoutwidth > 0) {
            viewWidth = overlayPanel.actuallayoutwidth * 0.88;
        }
        // For 4:3 (widths ~700-800px): card is 110px. For 16:9/16:10 (widths >= 1000px): card is 134px
        var cardW = (viewWidth < 850) ? 110 : 134;
        var margin = 8;
        var totalStep = cardW + margin;
        return { viewportWidth: viewWidth, cardWidth: cardW, totalStep: totalStep };
    }

    function Init() {
        var context = $.GetContextPanel();
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

        Log("Initializing responsive roulette interface...");
        BuildRouletteDOM(context, shop);

        ShopPurchaseTracker.StartTracker();
        ShopPurchaseTracker.OnPurchase(OnTargetItemPurchased);

        // Lightweight idle reel (only 11 cards to avoid ANY lag on opening shop!)
        BuildIdleReel();
        UpdateUIState();
        MonitorLoop();

        Log("Init complete!");
    }

    function BuildRouletteDOM(context, shop) {
        // 0. Floating Return Button inside Vanilla Shop (Tactile styling)
        returnToRouletteBtn = context.FindChildTraverse("RouletteReturnFloatingBtn");
        if (!returnToRouletteBtn) {
            returnToRouletteBtn = $.CreatePanel("Button", shop, "RouletteReturnFloatingBtn");
            ApplyStyles(returnToRouletteBtn, {
                "horizontal-align": "right",
                "vertical-align": "top",
                "margin-top": "16px",
                "margin-right": "80px",
                "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#3d2407), to(#1f1202))",
                "border": "2px solid #f7b267",
                "border-radius": "8px",
                "padding": "10px 22px",
                "box-shadow": "0px 4px 15px rgba(247, 178, 103, 0.4), inset 0px 1px 0px rgba(255, 255, 255, 0.2)",
                "z-index": "9999",
                "transition-property": "transform, brightness",
                "transition-duration": "0.12s"
            });
            var retLbl = $.CreatePanel("Label", returnToRouletteBtn, "");
            retLbl.text = "🎲 ВЕРНУТЬСЯ К РУЛЕТКЕ";
            ApplyStyles(retLbl, {
                "color": "#f7b267",
                "font-size": "15px",
                "font-weight": "bold",
                "letter-spacing": "1.5px"
            });
            returnToRouletteBtn.SetPanelEvent("onmouseover", function () {
                returnToRouletteBtn.style.brightness = "1.25";
                returnToRouletteBtn.style.transform = "translateY(-1px)";
            });
            returnToRouletteBtn.SetPanelEvent("onmouseout", function () {
                returnToRouletteBtn.style.brightness = "1.0";
                returnToRouletteBtn.style.transform = "none";
            });
            returnToRouletteBtn.SetPanelEvent("onactivate", function () {
                PlaySound("UI.Shop.Mod.Starred.Click");
                SetShopMode(false);
            });
        }

        // 1. Overlay Root Panel (100% Solid background to prevent ANY bleed-through)
        overlayPanel = context.FindChildTraverse("ItemRouletteOverlay");
        if (!overlayPanel) {
            overlayPanel = $.CreatePanel("Panel", context, "ItemRouletteOverlay");
        }
        ApplyStyles(overlayPanel, {
            "width": "100%",
            "height": "100%",
            "position": "absolute",
            "left": "0px",
            "top": "0px",
            "background-color": "#0a0d13", // 100% opaque obsidian
            "flow-children": "down",
            "padding": "16px 40px",
            "z-index": "9999"
        });

        // 2. Header Bar
        var header = $.CreatePanel("Panel", overlayPanel, "RouletteHeader");
        ApplyStyles(header, {
            "width": "100%",
            "height": "60px",
            "flow-children": "right",
            "vertical-align": "center",
            "border-bottom": "2px solid #21262d",
            "padding-bottom": "8px"
        });

        var titleBox = $.CreatePanel("Panel", header, "TitleBox");
        ApplyStyles(titleBox, { "flow-children": "down", "width": "380px" });

        var titleLabel = $.CreatePanel("Label", titleBox, "RouletteTitle");
        titleLabel.text = "DEADLOCK ITEM ROULETTE";
        ApplyStyles(titleLabel, {
            "color": "#e2b96f",
            "font-size": "22px",
            "font-weight": "bold",
            "letter-spacing": "2px",
            "text-shadow": "0px 0px 12px rgba(226, 185, 111, 0.6)"
        });

        var subTitle = $.CreatePanel("Label", titleBox, "RouletteSubTitle");
        subTitle.text = "Случайный предмет • Авто-покупка Quickbuy";
        ApplyStyles(subTitle, {
            "color": "#8b949e",
            "font-size": "11px",
            "margin-top": "2px"
        });

        // Phase Badge
        phaseBadge = $.CreatePanel("Label", header, "RoulettePhaseBadge");
        phaseBadge.text = "РАННЯЯ ИГРА (T1)";
        ApplyStyles(phaseBadge, {
            "background-color": "rgba(82, 183, 136, 0.15)",
            "border": "1px solid #52b788",
            "border-radius": "14px",
            "padding": "4px 12px",
            "color": "#52b788",
            "font-size": "12px",
            "font-weight": "bold",
            "vertical-align": "center",
            "margin-left": "20px"
        });

        // Souls Display
        var soulsBox = $.CreatePanel("Panel", header, "RouletteSoulsBox");
        ApplyStyles(soulsBox, {
            "flow-children": "right",
            "vertical-align": "center",
            "margin-left": "20px",
            "background-color": "rgba(226, 185, 111, 0.1)",
            "border": "1px solid rgba(226, 185, 111, 0.3)",
            "border-radius": "6px",
            "padding": "5px 12px"
        });
        var soulsTitle = $.CreatePanel("Label", soulsBox, "");
        soulsTitle.text = "Души: ";
        ApplyStyles(soulsTitle, { "color": "#8b949e", "font-size": "13px" });
        soulsLabel = $.CreatePanel("Label", soulsBox, "PlayerSoulsValue");
        soulsLabel.text = "0";
        ApplyStyles(soulsLabel, { "color": "#f7b267", "font-size": "15px", "font-weight": "bold" });

        var spacer = $.CreatePanel("Panel", header, "HeaderSpacer");
        ApplyStyles(spacer, { "width": "fill-parent-flow(1.0)" });

        // Reset Target / Re-spin Button (Allows manual reset anytime!)
        var resetTargetBtn = $.CreatePanel("Button", header, "ResetTargetBtn");
        ApplyStyles(resetTargetBtn, {
            "background-color": "#21262d",
            "border": "1px solid #30363d",
            "border-radius": "6px",
            "padding": "8px 14px",
            "vertical-align": "center",
            "margin-right": "12px",
            "transition-property": "transform, brightness",
            "transition-duration": "0.12s"
        });
        var resetLbl = $.CreatePanel("Label", resetTargetBtn, "");
        resetLbl.text = "↺ СБРОС ЦЕЛИ";
        ApplyStyles(resetLbl, { "color": "#8b949e", "font-size": "12px", "font-weight": "bold" });
        resetTargetBtn.SetPanelEvent("onmouseover", function () {
            resetTargetBtn.style.brightness = "1.25";
            resetTargetBtn.style.borderColor = "#e63946";
            resetLbl.style.color = "#e63946";
        });
        resetTargetBtn.SetPanelEvent("onmouseout", function () {
            resetTargetBtn.style.brightness = "1.0";
            resetTargetBtn.style.borderColor = "#30363d";
            resetLbl.style.color = "#8b949e";
        });
        resetTargetBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.Shop.Mod.Starred.Click");
            ShopPurchaseTracker.SetTargetItem(null);
            BuildIdleReel();
            UpdateUIState();
            if (statusLabel) {
                statusLabel.text = "Цель сброшена! Можно крутить заново.";
                statusLabel.style.color = "#52b788";
            }
        });

        // Toggle Vanilla Shop Button (Physical tactile feedback)
        var toggleShopBtn = $.CreatePanel("Button", header, "ToggleVanillaShopBtn");
        ApplyStyles(toggleShopBtn, {
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#262c36), to(#16191f))",
            "border": "1px solid #484f58",
            "border-radius": "6px",
            "padding": "8px 18px",
            "vertical-align": "center",
            "box-shadow": "0px 3px 10px rgba(0, 0, 0, 0.5), inset 0px 1px 0px rgba(255, 255, 255, 0.1)",
            "transition-property": "transform, brightness, box-shadow",
            "transition-duration": "0.12s"
        });
        var toggleLbl = $.CreatePanel("Label", toggleShopBtn, "ToggleVanillaShopLabel");
        toggleLbl.text = "ОБЫЧНЫЙ МАГАЗИН ➔";
        ApplyStyles(toggleLbl, {
            "color": "#c9d1d9",
            "font-size": "13px",
            "font-weight": "bold",
            "letter-spacing": "1px"
        });
        toggleShopBtn.SetPanelEvent("onmouseover", function () {
            toggleShopBtn.style.brightness = "1.2";
            toggleShopBtn.style.transform = "translateY(-1px)";
            toggleShopBtn.style.boxShadow = "0px 5px 15px rgba(200, 200, 200, 0.2), inset 0px 1px 0px rgba(255, 255, 255, 0.2)";
        });
        toggleShopBtn.SetPanelEvent("onmouseout", function () {
            toggleShopBtn.style.brightness = "1.0";
            toggleShopBtn.style.transform = "none";
            toggleShopBtn.style.boxShadow = "0px 3px 10px rgba(0, 0, 0, 0.5), inset 0px 1px 0px rgba(255, 255, 255, 0.1)";
        });
        toggleShopBtn.SetPanelEvent("onactivate", function () {
            PlaySound("UI.Shop.Mod.Starred.Click");
            SetShopMode(true);
        });

        // 3. Carousel Viewport Reel Box (Fully responsive: 88% width fits 16:9, 16:10, and 4:3!)
        carouselContainer = $.CreatePanel("Panel", overlayPanel, "CarouselContainer");
        ApplyStyles(carouselContainer, {
            "width": "88%",
            "max-width": "1100px",
            "min-width": "620px",
            "height": "210px",
            "horizontal-align": "center",
            "margin-top": "24px",
            "position": "relative",
            "background-color": "#0b0e14",
            "border": "2px solid #30363d",
            "border-radius": "10px",
            "overflow": "clip",
            "box-shadow": "inset 0px 0px 40px rgba(0, 0, 0, 0.85), 0px 8px 30px rgba(0, 0, 0, 0.6)"
        });

        // Crisp Golden Center Needles
        var pointerTop = $.CreatePanel("Panel", carouselContainer, "PointerTop");
        ApplyStyles(pointerTop, {
            "width": "4px",
            "height": "32px",
            "background-color": "#f7b267",
            "horizontal-align": "center",
            "vertical-align": "top",
            "z-index": "50",
            "box-shadow": "0px 0px 8px #f7b267"
        });
        var pointerBottom = $.CreatePanel("Panel", carouselContainer, "PointerBottom");
        ApplyStyles(pointerBottom, {
            "width": "4px",
            "height": "32px",
            "background-color": "#f7b267",
            "horizontal-align": "center",
            "vertical-align": "bottom",
            "z-index": "50",
            "box-shadow": "0px 0px 8px #f7b267"
        });
        var laserLine = $.CreatePanel("Panel", carouselContainer, "CenterLaserLine");
        ApplyStyles(laserLine, {
            "width": "2px",
            "height": "100%",
            "background-color": "rgba(247, 178, 103, 0.25)",
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

        // 4. Spin Button & Controls (Tactile physical depth with hover/active)
        var controlArea = $.CreatePanel("Panel", overlayPanel, "ControlArea");
        ApplyStyles(controlArea, {
            "width": "100%",
            "flow-children": "down",
            "horizontal-align": "center",
            "margin-top": "20px"
        });

        spinButton = $.CreatePanel("Button", controlArea, "SpinButton");
        ApplyStyles(spinButton, {
            "width": "350px",
            "height": "62px",
            "horizontal-align": "center",
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#f5d77f), color-stop(0.5, #dfa84a), to(#b87d28))",
            "border": "2px solid #ffe8a3",
            "border-radius": "8px",
            "box-shadow": "0px 6px 20px rgba(0, 0, 0, 0.7), inset 0px 1px 0px rgba(255, 255, 255, 0.4)",
            "transition-property": "transform, box-shadow, brightness",
            "transition-duration": "0.12s"
        });

        spinBtnText = $.CreatePanel("Label", spinButton, "SpinButtonText");
        spinBtnText.text = "КРУТИТЬ РУЛЕТКУ";
        ApplyStyles(spinBtnText, {
            "color": "#0b0e14",
            "font-size": "20px",
            "font-weight": "bold",
            "letter-spacing": "2px",
            "horizontal-align": "center",
            "vertical-align": "center",
            "text-shadow": "0px 1px 0px rgba(255, 255, 255, 0.3)"
        });

        // Tactile mouse feedback
        spinButton.SetPanelEvent("onmouseover", function () {
            if (isSpinning || ShopPurchaseTracker.GetTargetItem()) return;
            spinButton.style.brightness = "1.25";
            spinButton.style.transform = "translateY(-2px)";
            spinButton.style.boxShadow = "0px 8px 25px rgba(226, 185, 111, 0.6), inset 0px 1px 0px rgba(255, 255, 255, 0.6)";
        });
        spinButton.SetPanelEvent("onmouseout", function () {
            if (isSpinning || ShopPurchaseTracker.GetTargetItem()) return;
            spinButton.style.brightness = "1.0";
            spinButton.style.transform = "none";
            spinButton.style.boxShadow = "0px 6px 20px rgba(0, 0, 0, 0.7), inset 0px 1px 0px rgba(255, 255, 255, 0.4)";
        });
        spinButton.SetPanelEvent("onactivate", function () {
            PlaySound("UI.Shop.Mod.Starred.Click");
            StartSpin();
        });

        statusLabel = $.CreatePanel("Label", controlArea, "RouletteStatusLabel");
        statusLabel.text = "Нажмите 'Крутить' чтобы получить случайный предмет";
        ApplyStyles(statusLabel, {
            "color": "#8b949e",
            "font-size": "14px",
            "horizontal-align": "center",
            "margin-top": "8px"
        });

        // 5. Current Target Card (Responsive width)
        targetCard = $.CreatePanel("Panel", overlayPanel, "TargetItemContainer");
        ApplyStyles(targetCard, {
            "width": "640px",
            "max-width": "90%",
            "horizontal-align": "center",
            "margin-top": "20px",
            "background-color": "#12161f",
            "border": "1px solid #30363d",
            "border-radius": "8px",
            "padding": "12px 18px",
            "flow-children": "right",
            "box-shadow": "0px 4px 15px rgba(0, 0, 0, 0.4)"
        });

        targetIcon = $.CreatePanel("Panel", targetCard, "TargetItemIcon");
        ApplyStyles(targetIcon, {
            "width": "58px",
            "height": "58px",
            "border-radius": "6px",
            "border": "2px solid #52b788",
            "background-size": "contain",
            "background-repeat": "no-repeat",
            "background-position": "center center",
            "margin-right": "16px"
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
            "font-size": "10px",
            "font-weight": "bold",
            "letter-spacing": "1px"
        });

        targetName = $.CreatePanel("Label", targetInfo, "TargetItemName");
        targetName.text = "Предмет не выбран — крутите рулетку!";
        ApplyStyles(targetName, {
            "color": "#f0f6fc",
            "font-size": "16px",
            "font-weight": "bold",
            "margin-top": "2px"
        });

        var progressTrack = $.CreatePanel("Panel", targetInfo, "ProgressBarTrack");
        ApplyStyles(progressTrack, {
            "width": "100%",
            "height": "10px",
            "background-color": "#21262d",
            "border-radius": "5px",
            "margin-top": "6px",
            "overflow": "clip"
        });
        targetProgressFill = $.CreatePanel("Panel", progressTrack, "ProgressBarFill");
        ApplyStyles(targetProgressFill, {
            "width": "0%",
            "height": "100%",
            "background-color": "#52b788",
            "border-radius": "5px"
        });

        targetProgressText = $.CreatePanel("Label", targetInfo, "TargetProgressText");
        targetProgressText.text = "0 / 0 Душ (0%)";
        ApplyStyles(targetProgressText, {
            "color": "#8b949e",
            "font-size": "11px",
            "margin-top": "3px"
        });
    }

    function SetShopMode(vanilla) {
        isVanillaShopMode = vanilla;
        var context = $.GetContextPanel();
        if (!context) return;
        var shop = context.FindChildTraverse("Shop");
        var quickBuy = context.FindChildTraverse("QuickBuy");
        var recentPurchases = context.FindChildTraverse("RecentPurchasesPanel");

        if (isVanillaShopMode) {
            if (overlayPanel) overlayPanel.style.visibility = "collapse";
            if (shop) shop.style.visibility = "visible";
            if (quickBuy) quickBuy.style.visibility = "visible";
            if (recentPurchases) recentPurchases.style.visibility = "visible";
            if (returnToRouletteBtn) returnToRouletteBtn.style.visibility = "visible";
            Log("Switched to Vanilla Shop view");
        } else {
            if (overlayPanel) overlayPanel.style.visibility = "visible";
            if (shop) shop.style.visibility = "collapse";
            // Cleanly collapse vanilla headers to prevent any overlap!
            if (quickBuy) quickBuy.style.visibility = "collapse";
            if (recentPurchases) recentPurchases.style.visibility = "collapse";
            if (returnToRouletteBtn) returnToRouletteBtn.style.visibility = "collapse";
            Log("Switched to Item Roulette view");
        }
    }

    function BuildIdleReel() {
        if (!reelPanel) return;
        reelPanel.RemoveAndDeleteChildren();

        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var pool = DeadlockItemsDB.GetCandidateItems([], totalSouls);
        if (!pool || pool.length === 0) pool = DeadlockItemsDB.ITEMS;

        // Create only 11 cards for idle viewport - ZERO LAG!
        var IDLE_COUNT = 11;
        for (var i = 0; i < IDLE_COUNT; i++) {
            var item = pool[Math.floor(Math.random() * pool.length)];
            CreateCardPanel(i, item);
        }
        CenterReelOnCard(Math.floor(IDLE_COUNT / 2), false);
    }

    function CreateCardPanel(index, item) {
        var metrics = GetCardMetrics();
        var card = $.CreatePanel("Panel", reelPanel, "Card_" + index);
        var tierBorder = GetTierColor(item.tier);
        ApplyStyles(card, {
            "width": metrics.cardWidth + "px",
            "height": "190px",
            "margin": "0px 4px",
            "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#1c2128), to(#11141a))",
            "border": "2px solid " + tierBorder,
            "border-radius": "8px",
            "flow-children": "down",
            "vertical-align": "center",
            "box-shadow": "0px 4px 12px rgba(0, 0, 0, 0.6), inset 0px 1px 0px rgba(255, 255, 255, 0.1)",
            "transition-property": "transform, brightness",
            "transition-duration": "0.15s"
        });

        var tierTag = $.CreatePanel("Label", card, "");
        tierTag.text = "T" + item.tier;
        ApplyStyles(tierTag, {
            "color": tierBorder,
            "font-size": "10px",
            "font-weight": "bold",
            "horizontal-align": "right",
            "margin-top": "4px",
            "margin-right": "6px"
        });

        var icon = $.CreatePanel("Panel", card, "");
        ApplyStyles(icon, {
            "width": (metrics.cardWidth < 120 ? "60px" : "70px"),
            "height": (metrics.cardWidth < 120 ? "60px" : "70px"),
            "horizontal-align": "center",
            "margin-top": "2px",
            "background-image": 'url("' + item.image + '")',
            "background-size": "contain",
            "background-repeat": "no-repeat",
            "background-position": "center center"
        });

        var nameLbl = $.CreatePanel("Label", card, "");
        nameLbl.text = item.ruName || item.name;
        ApplyStyles(nameLbl, {
            "color": "#f0f6fc",
            "font-size": (metrics.cardWidth < 120 ? "11px" : "12px"),
            "font-weight": "bold",
            "text-align": "center",
            "horizontal-align": "center",
            "margin-top": "6px",
            "height": "28px"
        });

        var costLbl = $.CreatePanel("Label", card, "");
        costLbl.text = item.cost + " душ";
        ApplyStyles(costLbl, {
            "color": "#f7b267",
            "font-size": "11px",
            "font-weight": "bold",
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
        var metrics = GetCardMetrics();
        var centerOffset = (metrics.viewportWidth / 2) - (metrics.cardWidth / 2);
        var targetX = -(cardIndex * metrics.totalStep) + centerOffset;

        if (animate) {
            reelPanel.style.transition = "transform " + SPIN_DURATION + "s cubic-bezier(0.12, 0.98, 0.24, 1.0)";
        } else {
            reelPanel.style.transition = "none";
        }
        reelPanel.style.transform = "translateX(" + Math.round(targetX) + "px)";
    }

    function StartSpin() {
        if (isSpinning) return;

        var activeTarget = ShopPurchaseTracker.GetTargetItem();
        if (activeTarget) {
            if (statusLabel) {
                statusLabel.text = "Сначала накопите души и купите: " + (activeTarget.ruName || activeTarget.name) + "!";
                statusLabel.style.color = "#e63946";
            }
            return;
        }

        isSpinning = true;
        Log("Starting roulette spin...");

        var totalSouls = ShopPurchaseTracker.GetPlayerTotalSouls();
        var owned = ShopPurchaseTracker.GetOwnedItemNames();
        var winningItem = DeadlockItemsDB.PickRandomWeightedItem(owned, totalSouls);
        Log("Winning Item chosen: " + winningItem.name + " (" + winningItem.ruName + ")");

        // Generate full 60-card reel only when spinning!
        reelPanel.RemoveAndDeleteChildren();
        var pool = DeadlockItemsDB.GetCandidateItems(owned, totalSouls);
        if (!pool || pool.length === 0) pool = DeadlockItemsDB.ITEMS;

        for (var i = 0; i < TOTAL_CARDS; i++) {
            var item = (i === WINNING_INDEX) ? winningItem : pool[Math.floor(Math.random() * pool.length)];
            CreateCardPanel(i, item);
        }

        CenterReelOnCard(0, false);

        if (spinButton) {
            ApplyStyles(spinButton, {
                "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#2d333b), to(#1c2128))",
                "box-shadow": "none",
                "border": "2px solid #373e47"
            });
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
        var metrics = GetCardMetrics();

        function Step() {
            if (!isSpinning) return;
            var elapsed = Game.Time() - startTime;
            if (elapsed >= duration) return;

            var t = elapsed / duration;
            var progress = 1 - Math.pow(1 - t, 3.5);
            var currentPos = progress * (totalPassed * metrics.totalStep);
            var cardIdx = Math.floor(currentPos / metrics.totalStep);

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
        Log("Spin completed! Won: " + winningItem.name);

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
        BuildIdleReel();
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
            if (targetName) targetName.text = (target.ruName || target.name) + " [" + target.name + "]";
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
                ApplyStyles(spinButton, {
                    "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#2d333b), to(#1c2128))",
                    "box-shadow": "none",
                    "border": "2px solid #373e47"
                });
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
                ApplyStyles(spinButton, {
                    "background-color": "gradient(linear, 0% 0%, 0% 100%, from(#f5d77f), color-stop(0.5, #dfa84a), to(#b87d28))",
                    "border": "2px solid #ffe8a3",
                    "box-shadow": "0px 6px 20px rgba(0, 0, 0, 0.7), inset 0px 1px 0px rgba(255, 255, 255, 0.4)"
                });
                if (spinBtnText) spinBtnText.text = "КРУТИТЬ РУЛЕТКУ";
            }
        }
    }

    function MonitorLoop() {
        var context = $.GetContextPanel();
        if (context) {
            var shop = context.FindChildTraverse("Shop");
            var quickBuy = context.FindChildTraverse("QuickBuy");
            var recentPurchases = context.FindChildTraverse("RecentPurchasesPanel");

            if (!isVanillaShopMode) {
                if (overlayPanel && overlayPanel.style.visibility !== "visible") {
                    overlayPanel.style.visibility = "visible";
                }
                if (shop && shop.style.visibility !== "collapse") {
                    shop.style.visibility = "collapse";
                }
                if (quickBuy && quickBuy.style.visibility !== "collapse") {
                    quickBuy.style.visibility = "collapse";
                }
                if (recentPurchases && recentPurchases.style.visibility !== "collapse") {
                    recentPurchases.style.visibility = "collapse";
                }
            }

            // Check Map / Session change (e.g. Lobby -> Sandbox -> Match)
            try {
                var curMap = Game.GetMapName();
                if (curMap && lastKnownMap && curMap !== lastKnownMap) {
                    Log("Map changed from " + lastKnownMap + " to " + curMap + " — resetting target item!");
                    ShopPurchaseTracker.SetTargetItem(null);
                    BuildIdleReel();
                    UpdateUIState();
                }
                if (curMap) lastKnownMap = curMap;
            } catch (err) {}
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

// Self-invoking startup on shop load
(function () {
    ItemRoulette.Init();
})();
"""

out_js = BASE_DIR / "game/citadel/panorama/scripts/deadlock_item_roulette_engine.js"
with open(out_js, "w", encoding="utf-8") as f:
    f.write(ROULETTE_JS_TEMPLATE)

print("Generated optimized script:", out_js, "length:", len(ROULETTE_JS_TEMPLATE))
