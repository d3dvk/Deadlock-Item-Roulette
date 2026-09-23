import json
from collections import Counter

with open('scratch/deadlock_api_items.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

with open('scratch/all_vpk_item_images.json', 'r', encoding='utf-8') as f:
    vpk_list = json.load(f)
vpk_s2r = {f"s2r://{p.replace('.vtex_c', '.vtex')}" for p in vpk_list}

with open('scratch/verified_items_official.json', 'r', encoding='utf-8') as f:
    old_verified = json.load(f)
old_by_valve = {it['valveId']: it for it in old_verified}
old_by_name = {it['name']: it for it in old_verified}

std_items = [
    it for it in items 
    if it.get('shopable') is True 
    and it.get('item_slot_type') in ['weapon', 'armor', 'tech', 'vitality', 'spirit']
    and it.get('item_tier') in [1, 2, 3, 4]
    and not it.get('disabled', False)
]

print(f"Total standard shop items (Tiers 1-4): {len(std_items)}")
print("By item_tier:", Counter(it.get('item_tier') for it in std_items))
print("By item_slot_type:", Counter(it.get('item_slot_type') for it in std_items))

canonical = []
seen_names = set()
for it in std_items:
    name = it['name']
    if name in seen_names:
        continue
    seen_names.add(name)

    valve_id = it['class_name']
    slot = it['item_slot_type']
    category = "Weapon" if slot == "weapon" else ("Vitality" if slot in ["armor", "vitality"] else "Spirit")
    tier = it['item_tier']
    cost = it['cost']

    # Get Russian name and image from old verified if possible
    ru_name = name
    image = ""
    ref = old_by_valve.get(valve_id) or old_by_name.get(name)
    if ref:
        ru_name = ref.get('ruName', name)
        image = ref.get('image', '')

    canonical.append({
        'id': valve_id.replace('upgrade_', ''),
        'valveId': valve_id,
        'hash': it['id'],
        'name': name,
        'ruName': ru_name,
        'category': category,
        'tier': tier,
        'cost': cost,
        'image': image
    })

print(f"\nBuilt {len(canonical)} unique canonical items.")
# Check missing images
missing_img = [it for it in canonical if not it['image'] or it['image'] not in vpk_s2r]
print(f"Items with missing/unverified image: {len(missing_img)}")
for m in missing_img:
    print(f"  Missing img: {m['name']} ({m['valveId']})")

with open('scratch/canonical_shop_items.json', 'w', encoding='utf-8') as f:
    json.dump(canonical, f, ensure_ascii=False, indent=2)
