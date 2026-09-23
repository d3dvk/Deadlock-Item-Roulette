#!/usr/bin/env python3
"""
Deadlock Item Roulette Mod - Standalone Builder
Builds pak01_dir.vpk with highest priority in game/citadel/addons/
Moves Postmortem to pak06_dir.vpk to avoid any conflict.
"""

import os
import sys
import struct
import zlib
from pathlib import Path

BASE_DIR = Path("E:/Deadlock_mod")
ADDONS_DIR = Path("E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/addons")

def compile_js_to_vjs_c(js_code: str, red2_template: bytes) -> bytes:
    # Replace filename in RED2 metadata (both are exactly 49 chars)
    orig_name = b"panorama/scripts/qollite_recent_purchase_icons.js"
    new_name  = b"panorama/scripts/deadlock_item_roulette_engine.js"
    assert len(orig_name) == len(new_name) == 49
    red2_clean = red2_template.replace(orig_name, new_name)
    assert len(red2_clean) == len(red2_template) == 790

    js_bytes = js_code.encode("utf-8")
    data_size = len(js_bytes)
    red2_size = len(red2_clean)

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

    result = header + b0 + b1 + b"\x00\x00\x00\x00" + red2_clean + pad_bytes + b"\x00\x00\x00\x00" + js_bytes
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
    print("=== DEADLOCK ITEM ROULETTE - STANDALONE BUILD ===")

    # 1. Read JS
    js_path = BASE_DIR / "game/citadel/panorama/scripts/deadlock_item_roulette_engine.js"
    if not js_path.is_file():
        # generate if not present
        os.system(f"python {BASE_DIR}/tools/generate_standalone_js.py")

    with open(js_path, "r", encoding="utf-8") as f:
        js_code = f.read()

    # 2. Read RED2 template
    with open(BASE_DIR / "icons_red2.bin", "rb") as f:
        red2_bytes = f.read()

    # 3. Compile to .vjs_c
    vjs_c = compile_js_to_vjs_c(js_code, red2_bytes)
    print(f"Compiled standalone vjs_c: {len(vjs_c)} bytes")

    # 4. Modify layout .vxml_c (replace script reference with exact 52 chars)
    with open(BASE_DIR / "scratch_shop.vxml_c", "rb") as f:
        vxml_c_orig = f.read()

    orig_script = b"panorama/scripts/qollite_recent_purchase_icons.vjs_c"
    new_script  = b"panorama/scripts/deadlock_item_roulette_engine.vjs_c"
    assert len(orig_script) == len(new_script) == 52

    vxml_c_mod = vxml_c_orig.replace(orig_script, new_script)
    assert len(vxml_c_mod) == len(vxml_c_orig) == 4731
    print(f"Modified shop vxml_c: {len(vxml_c_mod)} bytes (exact match)")

    files_to_pack = {
        "panorama/layout/citadel_hud_hero_shop.vxml_c": vxml_c_mod,
        "panorama/scripts/deadlock_item_roulette_engine.vjs_c": vjs_c
    }

    # 5. Build pak01_dir.vpk locally
    local_vpk = BASE_DIR / "pak01_dir.vpk"
    pack_vpk_files(files_to_pack, local_vpk)

    # 6. Deploy to game addons
    if ADDONS_DIR.is_dir():
        print(f"\nDeploying to Deadlock Addons: {ADDONS_DIR}")

        pak01 = ADDONS_DIR / "pak01_dir.vpk"
        pak05 = ADDONS_DIR / "pak05_dir.vpk"
        pak06 = ADDONS_DIR / "pak06_dir.vpk"

        # Check existing pak01: if it's Postmortem (size ~102KB), move it to pak06
        if pak01.is_file():
            size = pak01.stat().st_size
            if size < 200000: # Postmortem is ~102KB
                if not pak06.is_file() or pak06.stat().st_size != size:
                    print(f"Preserving Postmortem Personal mod: moving pak01 ({size}b) -> pak06_dir.vpk")
                    pak01.replace(pak06)

        # Install our mod as pak01_dir.vpk (Priority 01)
        pack_vpk_files(files_to_pack, pak01)
        print(f"SUCCESS: Installed Deadlock Roulette as {pak01} (Priority 01)!")

        # Clean up old pak05_dir.vpk
        if pak05.is_file():
            pak05.unlink()
            print("Removed deprecated pak05_dir.vpk")

    print("\nMod build and installation complete!")

if __name__ == "__main__":
    main()
