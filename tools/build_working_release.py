#!/usr/bin/env python3
"""
Deadlock Item Roulette Mod - Standalone Release Builder (pak01_dir.vpk)
Fixes the KV3 layout fatal error by maintaining 100% valid KV3 hashes in citadel_hud_hero_shop.vxml_c.
Fixes the JS syntax error in original_icons.js by ensuring valid closure termination.
"""

import os
import sys
import struct
import zlib
from pathlib import Path

BASE_DIR = Path("E:/Deadlock_mod")
ADDONS_DIR = Path("E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/addons")

def compile_js_to_vjs_c(js_code: str, red2_template: bytes) -> bytes:
    js_bytes = js_code.encode("utf-8")
    data_size = len(js_bytes)
    red2_size = len(red2_template)
    assert red2_size == 790

    abs_red2 = 44
    rel_red2 = abs_red2 - 16 # 28

    end_red2 = abs_red2 + red2_size # 44 + 790 = 834
    pad_len = 844 - end_red2 # 10 bytes
    abs_data = 844
    rel_data = abs_data - 28 # 816

    pad_bytes = b"\x00\xdd\xee\xff" + b"\x00" * (pad_len - 4)
    total_size = abs_data + 4 + data_size # 848 + data_size

    header = struct.pack("<IHHI I", total_size, 12, 4, 8, 2)
    b0 = b"RED2" + struct.pack("<II", rel_red2, red2_size)
    b1 = b"DATA" + struct.pack("<II", rel_data, data_size)

    result = header + b0 + b1 + b"\x00\x00\x00\x00" + red2_template + pad_bytes + b"\x00\x00\x00\x00" + js_bytes
    assert len(result) == total_size
    return result

def pack_vpk_files(files_dict, output_vpk_path):
    files_tree = {}
    file_blobs = []
    current_offset = 0

    for internal_path, content in files_dict.items():
        p = Path(internal_path)
        ext = p.suffix.lstrip(".").lower() or " "
        dir_path = str(p.parent).replace("\\", "/").lower()
        if dir_path == ".": dir_path = ""
        stem = p.stem.lower()

        if ext not in files_tree: files_tree[ext] = {}
        if dir_path not in files_tree[ext]: files_tree[ext][dir_path] = []

        crc = zlib.crc32(content) & 0xFFFFFFFF
        length = len(content)

        files_tree[ext][dir_path].append((stem, crc, length, current_offset))
        file_blobs.append(content)
        current_offset += length

    tree_bytes = bytearray()
    for ext, dirs in sorted(files_tree.items()):
        tree_bytes.extend(ext.encode("utf-8") + b"\x00")
        for d, file_list in sorted(dirs.items()):
            d_encoded = d.encode("utf-8") if d else b" "
            tree_bytes.extend(d_encoded + b"\x00")
            for stem, crc, length, offset in sorted(file_list):
                tree_bytes.extend(stem.encode("utf-8") + b"\x00")
                record = struct.pack("<IHHIIH", crc, 0, 0x7FFF, offset, length, 0xFFFF)
                tree_bytes.extend(record)
            tree_bytes.extend(b"\x00")
        tree_bytes.extend(b"\x00")
    tree_bytes.extend(b"\x00")

    tree_size = len(tree_bytes)
    data_size = sum(len(b) for b in file_blobs)

    header = struct.pack("<IIIIIII", 0x55aa1234, 2, tree_size, data_size, 0, 0, 0)

    output_path = Path(output_vpk_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(header)
        f.write(tree_bytes)
        for blob in file_blobs:
            f.write(blob)

    print(f"Packed VPK: {output_vpk_path} ({len(header) + tree_size + data_size} bytes)")

def main():
    print("=== SCAMLOCK - BUILDING STANDALONE RELEASE ===")

    # 1. Read QoL Lite original icons
    with open(BASE_DIR / "original_icons.js", "r", encoding="utf-8") as f:
        icons_js = f.read().strip()

    # Ensure icons_js is properly closed without syntax error
    if icons_js.endswith("="):
        icons_js += "a);\n"
    elif not icons_js.endswith("a);"):
        icons_js += "\ntypeof a!==\"undefined\"&&(this.QOL_LITE_PURCHASE_ICONS=a);\n"

    # 2. Read our Roulette Engine
    with open(BASE_DIR / "game/citadel/panorama/scripts/deadlock_item_roulette_engine.js", "r", encoding="utf-8") as f:
        roulette_js = f.read()

    combined_js = icons_js + "\n\n" + roulette_js
    print(f"Combined JS size: {len(combined_js)} chars")

    # 3. Read untouched RED2 template
    with open(BASE_DIR / "icons_red2.bin", "rb") as f:
        red2_bytes = f.read()

    # 4. Compile main engine to .vjs_c
    vjs_c = compile_js_to_vjs_c(combined_js, red2_bytes)
    print(f"Compiled vjs_c size: {len(vjs_c)} bytes")

    # 4b. Compile neutral stub for qollite_recent_purchases.vjs_c to resolve XML include dependency without HUD distortion
    stub_purchases_js = "// Scamlock - Neutral stub for qollite_recent_purchases to eliminate fatal layout error and avoid HUD distortion\n(function() {\n})();\n"
    purchases_vjs_c = compile_js_to_vjs_c(stub_purchases_js, red2_bytes)
    print(f"Compiled purchases_vjs_c stub size: {len(purchases_vjs_c)} bytes")

    # 5. Read untouched scratch_shop.vxml_c (maintains 100% valid KV3 hashes)
    with open(BASE_DIR / "scratch_shop.vxml_c", "rb") as f:
        vxml_c = f.read()
    assert len(vxml_c) == 4731
    print(f"Loaded valid shop vxml_c: {len(vxml_c)} bytes")

    files_to_pack = {
        "panorama/layout/citadel_hud_hero_shop.vxml_c": vxml_c,
        "panorama/scripts/qollite_recent_purchase_icons.vjs_c": vjs_c,
        "panorama/scripts/qollite_recent_purchases.vjs_c": purchases_vjs_c
    }

    # 6. Build locally
    local_scamlock_vpk = BASE_DIR / "scamlock.vpk"
    local_pak01_vpk = BASE_DIR / "pak01_dir.vpk"
    pack_vpk_files(files_to_pack, local_scamlock_vpk)
    pack_vpk_files(files_to_pack, local_pak01_vpk)

    # 7. Deploy to addons according to DMM mapping (never overwrite other mods like UMM)
    if ADDONS_DIR.is_dir():
        dmm_json = ADDONS_DIR / ".dmm.json"
        deployed_paths = []
        if dmm_json.is_file():
            try:
                import json
                with open(dmm_json, "r", encoding="utf-8") as f:
                    dmm_data = json.load(f)
                mods = dmm_data.get("mods", {})
                for mod_key, mod_info in mods.items():
                    orig = mod_info.get("originalVpkNames", [])
                    if any("scamlock" in o.lower() for o in orig) or "scamlock" in mod_key.lower() or "local" in mod_key.lower():
                        for vpk_name in mod_info.get("currentVpks", []):
                            if vpk_name.lower() == "pak01_dir.vpk":
                                continue # NEVER overwrite pak01 (reserved for other mods)
                            target = ADDONS_DIR / vpk_name
                            pack_vpk_files(files_to_pack, target)
                            deployed_paths.append(str(target))
            except Exception as e:
                print(f"Error parsing .dmm.json: {e}")

        # Always strictly ensure pak02_dir.vpk is deployed
        dest_pak = ADDONS_DIR / "pak02_dir.vpk"
        pack_vpk_files(files_to_pack, dest_pak)
        if str(dest_pak) not in deployed_paths:
            deployed_paths.append(str(dest_pak))

        print(f"\n[SUCCESS] Deployed working Scamlock to: {', '.join(deployed_paths)}")

    # 8. Create GameBanana & Deadlock Mod Manager release zip package
    import zipfile
    zip_path = BASE_DIR / "Scamlock.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        # Standard release VPK at root (clean 1-click install in Deadlock Mod Manager)
        zipf.write(local_scamlock_vpk, arcname="scamlock.vpk")
        if (BASE_DIR / "README.md").is_file():
            zipf.write(BASE_DIR / "README.md", arcname="README.md")
        if (BASE_DIR / "GAMEBANANA.md").is_file():
            zipf.write(BASE_DIR / "GAMEBANANA.md", arcname="GAMEBANANA.md")
    print(f"[SUCCESS] Created release archive: {zip_path} ({zip_path.stat().st_size} bytes)")

    print("\nMod build and deployment complete!")

if __name__ == "__main__":
    main()
