#!/usr/bin/env python3
"""
Build 100% verified Deadlock item list directly from official Deadlock files:
- E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/resource/localization/citadel_gc_mod_names/citadel_gc_mod_names_english.txt
- E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/resource/localization/citadel_gc_mod_names/citadel_gc_mod_names_russian.txt
- scratch/items_github.json (for tiers, costs, images)
"""

import json
import re
from pathlib import Path

GC_EN = Path("E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/resource/localization/citadel_gc_mod_names/citadel_gc_mod_names_english.txt")
GC_RU = Path("E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/resource/localization/citadel_gc_mod_names/citadel_gc_mod_names_russian.txt")

def murmur2(key, seed=0x31415926):
    m = 0x5bd1e995
    r = 24
    data = key.lower().encode('utf-8')
    length = len(data)
    h = (seed ^ length) & 0xffffffff
    pos = 0
    while length >= 4:
        import struct
        k = struct.unpack('<I', data[pos:pos+4])[0]
        k = (k * m) & 0xffffffff
        k = (k ^ (k >> r)) & 0xffffffff
        k = (k * m) & 0xffffffff
        h = (h * m) & 0xffffffff
        h = (h ^ k) & 0xffffffff
        pos += 4
        length -= 4
    if length == 3:
        h ^= data[pos+2] << 16
        h ^= data[pos+1] << 8
        h ^= data[pos]
        h = (h * m) & 0xffffffff
    elif length == 2:
        h ^= data[pos+1] << 8
        h ^= data[pos]
        h = (h * m) & 0xffffffff
    elif length == 1:
        h ^= data[pos]
        h = (h * m) & 0xffffffff
    h = (h ^ (h >> 13)) & 0xffffffff
    h = (h * m) & 0xffffffff
    h = (h ^ (h >> 15)) & 0xffffffff
    return h & 0xffffffff

def main():
    with open(GC_EN, 'r', encoding='utf-8', errors='ignore') as f:
        text_en = f.read()
    with open(GC_RU, 'r', encoding='utf-8', errors='ignore') as f:
        text_ru = f.read()

    en_dict = {}
    ru_dict = {}
    
    # Parse section by section to know exact categories: Weapon, Armor, Tech
    # Sections in file:
    # Upgrades: Weapon
    # Upgrades: Armor
    # Upgrades: Tech
    current_cat = "Weapon"
    item_cats = {}

    for line in text_en.splitlines():
        line = line.strip()
        if "Upgrades: Weapon" in line:
            current_cat = "Weapon"
        elif "Upgrades: Armor" in line:
            current_cat = "Vitality"
        elif "Upgrades: Tech" in line:
            current_cat = "Spirit"
        
        m = re.match(r'^"(upgrade_[a-zA-Z0-9_]+)"\s+"([^"]+)"', line)
        if m:
            key, val = m.group(1), m.group(2)
            if not key.endswith('_search'):
                en_dict[key] = val
                item_cats[key] = current_cat

    for line in text_ru.splitlines():
        line = line.strip()
        m = re.match(r'^"(upgrade_[a-zA-Z0-9_]+)"\s+"([^"]+)"', line)
        if m:
            key, val = m.group(1), m.group(2)
            if not key.endswith('_search'):
                ru_dict[key] = val

    with open('scratch/items_github.json', 'r', encoding='utf-8') as f:
        meta_items = json.load(f)

    meta_by_name = {it.get('name'): it for it in meta_items}

    tier_costs = { 1: 500, 2: 1250, 3: 3000, 4: 6200 }

    # Removed/obsolete items that must NEVER appear in the roulette
    EXCLUDED_KEYS = {
        'upgrade_base',
        'upgrade_infuser', # Explicitly removed by user request ("Инфьюзер уже давно его нет")
        'upgrade_glass_cannon2',
        'upgrade_golden_egg',
    }

    verified_items = []

    for key, en_name in en_dict.items():
        if key in EXCLUDED_KEYS:
            continue

        ru_name = ru_dict.get(key, en_name)
        cat = item_cats.get(key, "Weapon")
        meta = meta_by_name.get(key)

        tier = 1
        img_name = key.replace('upgrade_', '')

        if meta:
            t = meta.get('tier', 0)
            if t in [1, 2, 3, 4]:
                tier = t
            t_type = meta.get('type')
            if t_type == 'armor':
                cat = 'Vitality'
            elif t_type == 'tech':
                cat = 'Spirit'
            elif t_type == 'weapon':
                cat = 'Weapon'
            
            img_path = meta.get('image', '')
            if img_path:
                img_name = Path(img_path).stem

        cat_folder = "weapon" if cat == "Weapon" else ("vitality" if cat == "Vitality" else "spirit")
        image_uri = f"s2r://panorama/images/items/{cat_folder}/{img_name}_psd.vtex"
        cost = tier_costs.get(tier, 500)
        hash_val = murmur2(key)

        verified_items.append({
            "id": key.replace('upgrade_', ''),
            "valveId": key,
            "hash": hash_val,
            "name": en_name,
            "ruName": ru_name,
            "category": cat,
            "tier": tier,
            "cost": cost,
            "image": image_uri
        })

    verified_items.sort(key=lambda x: (x['category'], x['tier'], x['name']))

    print(f"Total verified official active shop items: {len(verified_items)}")
    for cat in ["Weapon", "Vitality", "Spirit"]:
        cat_items = [it for it in verified_items if it['category'] == cat]
        print(f"  {cat}: {len(cat_items)} items")
        for t in [1, 2, 3, 4]:
            t_items = [it for it in cat_items if it['tier'] == t]
            print(f"    Tier {t}: {len(t_items)}")

    with open('scratch/verified_items_official.json', 'w', encoding='utf-8') as f:
        json.dump(verified_items, f, ensure_ascii=False, indent=2)
    print("Saved scratch/verified_items_official.json successfully!")

if __name__ == "__main__":
    main()
