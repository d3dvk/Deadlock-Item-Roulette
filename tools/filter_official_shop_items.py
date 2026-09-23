import json
from collections import Counter

with open('scratch/deadlock_api_items.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

shopable_items = [
    it for it in items 
    if it.get('shopable') is True 
    and it.get('item_slot_type') in ['weapon', 'armor', 'tech', 'vitality', 'spirit']
    and not it.get('disabled', False)
]

print(f"Total active shopable items: {len(shopable_items)}")
print("By item_slot_type:", Counter(it.get('item_slot_type') for it in shopable_items))
print("By item_tier:", Counter(it.get('item_tier') for it in shopable_items))

# Let's check Decay, Mercurial Magnum, Infuser, Indomitable
for check_name in ['Decay', 'Mercurial Magnum', 'Infuser', 'Indomitable', 'Sprint Boots', 'Compress Cooldown', 'Spirit Shredder Bullets']:
    found = [it for it in shopable_items if it.get('name') == check_name]
    if found:
        it = found[0]
        print(f"  {check_name}: FOUND -> class_name={it.get('class_name')}, tier={it.get('item_tier')}, cost={it.get('cost')}")
    else:
        # Check in all items to see why it wasn't in shopable_items
        all_found = [it for it in items if it.get('name') == check_name]
        if all_found:
            it = all_found[0]
            print(f"  {check_name}: INACTIVE -> shopable={it.get('shopable')}, disabled={it.get('disabled')}, type={it.get('type')}, class_name={it.get('class_name')}")
        else:
            print(f"  {check_name}: NOT FOUND AT ALL IN API!")
