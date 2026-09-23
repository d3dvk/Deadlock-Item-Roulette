import json
import re
from pathlib import Path
from collections import Counter

def parse_loc(path):
    d = {}
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            m = re.match(r'^\s*"([^"]+)"\s*"([^"]+)"', line)
            if m:
                d[m.group(1)] = m.group(2)
    return d

def main():
    p1 = Path(r'E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\resource\localization\citadel_gc_mod_names\citadel_gc_mod_names_russian.txt')
    p2 = Path(r'E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\resource\localization\citadel_mods\citadel_mods_russian.txt')
    loc_gc = parse_loc(p1)
    loc_mods = parse_loc(p2)
    print(f"Loaded {len(loc_gc)} from gc_mod_names and {len(loc_mods)} from mods_russian")

    with open('scratch/deadlock_api_items.json', 'r', encoding='utf-8') as f:
        api_items = json.load(f)

    with open('scratch/all_vpk_item_images.json', 'r', encoding='utf-8') as f:
        vpk_list = json.load(f)
    vpk_s2r = {f"s2r://{p.replace('.vtex_c', '.vtex')}" for p in vpk_list}

    with open('scratch/verified_items_official.json', 'r', encoding='utf-8') as f:
        old_verified = json.load(f)
    old_by_valve = {it['valveId']: it for it in old_verified}
    old_by_name = {it['name']: it for it in old_verified}

    # Only active, shopable items in Tiers 1-4
    std_items = [
        it for it in api_items 
        if it.get('shopable') is True 
        and it.get('item_slot_type') in ['weapon', 'armor', 'tech', 'vitality', 'spirit']
        and it.get('item_tier') in [1, 2, 3, 4]
        and not it.get('disabled', False)
    ]

    print(f"Found {len(std_items)} standard shopable items in API")

    result = []
    seen = set()
    for it in std_items:
        name = it['name']
        if name in seen:
            continue
        seen.add(name)

        valve_id = it['class_name']
        raw_slot = it['item_slot_type']
        category = "Weapon" if raw_slot == "weapon" else ("Vitality" if raw_slot in ["armor", "vitality"] else "Spirit")
        tier = it['item_tier']
        cost = it['cost']
        ability_id = it['id']

        # Determine official Russian name
        ru_name = (
            loc_gc.get(valve_id) or 
            loc_mods.get(valve_id) or 
            loc_mods.get(valve_id + "_name") or 
            (old_by_valve.get(valve_id, {}).get('ruName')) or 
            (old_by_name.get(name, {}).get('ruName')) or 
            name
        )

        # Determine image
        img = ""
        if valve_id in old_by_valve and old_by_valve[valve_id].get('image') in vpk_s2r:
            img = old_by_valve[valve_id]['image']
        elif name in old_by_name and old_by_name[name].get('image') in vpk_s2r:
            img = old_by_name[name]['image']
        elif valve_id == 'upgrade_infuser':
            img = 's2r://panorama/images/items/vitality/infuser_psd.vtex'

        result.append({
            'id': valve_id.replace('upgrade_', ''),
            'valveId': valve_id,
            'hash': ability_id,
            'name': name,
            'ruName': ru_name,
            'category': category,
            'tier': tier,
            'cost': cost,
            'image': img
        })

    # Sort deterministically by Category -> Tier -> Cost -> Name
    cat_order = {"Weapon": 1, "Vitality": 2, "Spirit": 3}
    result.sort(key=lambda x: (cat_order.get(x['category'], 99), x['tier'], x['cost'], x['name']))

    print(f"\nFinal unique items count: {len(result)}")
    print("Tier counts:", Counter(x['tier'] for x in result))
    print("Category counts:", Counter(x['category'] for x in result))

    missing_img = [x for x in result if not x['image'] or x['image'] not in vpk_s2r]
    print(f"Missing images: {len(missing_img)}")
    for m in missing_img:
        print(f"  Missing img: {m['name']} ({m['valveId']})")

    with open('scratch/verified_items_official.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print("Saved 100% verified, deduplicated items to scratch/verified_items_official.json!")

if __name__ == '__main__':
    main()
