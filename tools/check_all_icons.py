import json
from pathlib import Path

def main():
    with open('scratch/verified_items_official.json', encoding='utf-8') as f:
        items = json.load(f)

    with open('scratch/all_vpk_item_images.json', encoding='utf-8') as f:
        vpk_list = json.load(f)

    # Clean set of VPK paths formatted as s2r://panorama/images/....vtex
    vpk_s2r = {f"s2r://{p.replace('.vtex_c', '.vtex')}" for p in vpk_list}

    valid = []
    invalid = []
    for it in items:
        img = it.get('image', '')
        if img in vpk_s2r:
            valid.append(it)
        else:
            invalid.append(it)

    print(f"Total items: {len(items)}")
    print(f"Valid images: {len(valid)}")
    print(f"Invalid images: {len(invalid)}")
    for inv in invalid:
        print(f"  {inv['name']} ({inv['id']}, {inv['valveId']}) -> {inv.get('image')}")

if __name__ == '__main__':
    main()
