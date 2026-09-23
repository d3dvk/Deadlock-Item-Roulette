import re
import json

with open('game/citadel/panorama/scripts/deadlock_item_roulette_engine.js', encoding='utf-8') as f:
    text = f.read()

with open('scratch/all_vpk_item_images.json', encoding='utf-8') as f:
    vpk = set(json.load(f))

vpk_s2r = {f"s2r://{p.replace('.vtex_c', '.vtex')}" for p in vpk}

items = ['Indomitable', 'Sprint Boots', 'Extra Stamina', 'Spirit Shredder Bullets', 'Compress Cooldown', 'Conjure Missiles']
for it in items:
    m = re.search(r'"' + re.escape(it) + r'".*?image:\s*"([^"]+)"', text)
    if m:
        path = m.group(1)
        valid = path in vpk_s2r
        status = "OK (in VPK)" if valid else "FAIL (NOT IN VPK!)"
        print(f"{it:25s} -> {path} [{status}]")
    else:
        print(f"{it:25s} -> NOT FOUND")

# Also check how many total items in engine.js and if any image is not in VPK
all_images = re.findall(r'image:\s*"([^"]+)"', text)
print(f"\nTotal item image definitions in engine.js: {len(all_images)}")
invalid_count = sum(1 for img in all_images if img not in vpk_s2r)
print(f"Invalid / missing images in VPK: {invalid_count}")
