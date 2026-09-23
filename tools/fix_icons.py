#!/usr/bin/env python3
import json
import re
from pathlib import Path

def main():
    with open('original_icons.js', 'r', encoding='utf-8') as f:
        text = f.read()

    with open('scratch/all_vpk_item_images.json', 'r', encoding='utf-8') as f:
        vpk_list = json.load(f)

    vpk_s2r = {f"s2r://{p.replace('.vtex_c', '.vtex')}" for p in vpk_list}

    # Parse key-value pairs from original_icons.js
    entries = re.findall(r'["\']?([^"\'\:]+?)["\']?\s*:\s*[\'"]url\([\\"\']?(s2r://[a-zA-Z0-9_/]+?\.vtex)[\\"\']?\)[\'"]', text)
    icons_map = {k.strip(): v.strip() for k, v in entries}

    with open('scratch/verified_items_official.json', 'r', encoding='utf-8') as f:
        items = json.load(f)

    # Specific overrides for Deadlock internal vs display name mappings
    overrides = {
        'upgrade_personal_rejuvenator': 's2r://panorama/images/upgrades/mods_tech/rebirth_psd.vtex',
        'upgrade_ability_refresher': 's2r://panorama/images/items/spirit/refresher_psd.vtex',
        'upgrade_discord': 's2r://panorama/images/items/spirit/scourge_psd.vtex',
        'upgrade_auto_cleanse': 's2r://panorama/images/items/vitality/indomitable_psd.vtex',
        'upgrade_heal_on_level': 's2r://panorama/images/upgrades/mods_armor/last_stand_psd.vtex',
        'upgrade_melee_rebuttal': 's2r://panorama/images/items/vitality/rebuttal_psd.vtex',
        'upgrade_health_2': 's2r://panorama/images/upgrades/mods_armor/health_psd.vtex',
        'upgrade_absorbing_armor': 's2r://panorama/images/items/vitality/witchmail_psd.vtex',
        'upgrade_magic_shield': 's2r://panorama/images/items/vitality/enchanters_emblem_psd.vtex',
        'upgrade_chonky': 's2r://panorama/images/items/vitality/fortitude_psd.vtex',
        'upgrade_infinitemagazine': 's2r://panorama/images/upgrades/upgrade_infinite_psd.vtex',
        'upgrade_enchanted_holsters': 's2r://panorama/images/items/weapon/spellslinger_headshots_psd.vtex',
        'upgrade_weapon_backstabber': 's2r://panorama/images/items/weapon/backstabber_psd.vtex',
        'upgrade_headshot_booster2': 's2r://panorama/images/items/weapon/weakening_headshot_psd.vtex',
        'upgrade_proc_silence': 's2r://panorama/images/items/weapon/silencer_psd.vtex',
        'upgrade_sharpshooter': 's2r://panorama/images/items/weapon/sharp_shooter_psd.vtex',
    }

    updated = 0
    for it in items:
        valve_id = it['valveId']
        if valve_id in overrides:
            it['image'] = overrides[valve_id]
            updated += 1
            continue

        best_path = icons_map.get(it['name']) or icons_map.get(it['ruName'])
        if best_path and best_path in vpk_s2r:
            it['image'] = best_path
            updated += 1

    missing = [it for it in items if it['image'] not in vpk_s2r]
    print(f"Total items: {len(items)}")
    print(f"Items with verified VPK textures: {len(items) - len(missing)}")
    print(f"Missing items: {len(missing)}")
    if missing:
        for m in missing:
            print(f"  Missing: {m['name']} ({m['valveId']}) -> {m['image']}")
    else:
        print("SUCCESS! 100% of items have verified existing textures in pak01_dir.vpk!")

    with open('scratch/verified_items_official.json', 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
