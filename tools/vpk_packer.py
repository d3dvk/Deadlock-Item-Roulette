#!/usr/bin/env python3
"""
Deadlock / Source 2 VPK Packer
Pure Python implementation of Valve Pack (VPK v2) file format.
Takes a root directory and packs it into a single pakXX_dir.vpk file.
"""

import os
import sys
import struct
import zlib
from pathlib import Path

VPK_SIGNATURE = 0x55aa1234
VPK_VERSION = 2

def pack_directory(source_dir, output_vpk_path):
    source_path = Path(source_dir).resolve()
    if not source_path.is_dir():
        raise ValueError(f"Source directory does not exist: {source_path}")

    # Collect all files
    # Group by extension -> directory -> filename
    files_tree = {} # ext -> { dir -> [ (filename, abs_path) ] }
    all_files = []

    for root, _, files in os.walk(source_path):
        for file in files:
            abs_file = Path(root) / file
            rel_path = abs_file.relative_to(source_path)
            
            # Extension without leading dot
            ext = abs_file.suffix.lstrip(".").lower()
            if not ext:
                ext = " "
                
            # Directory path inside VPK using forward slashes
            dir_path = str(rel_path.parent).replace("\\", "/").lower()
            if dir_path == ".":
                dir_path = ""
                
            stem = abs_file.stem.lower()

            if ext not in files_tree:
                files_tree[ext] = {}
            if dir_path not in files_tree[ext]:
                files_tree[ext][dir_path] = []

            files_tree[ext][dir_path].append((stem, abs_file))
            all_files.append(abs_file)

    print(f"Found {len(all_files)} files to pack into {output_vpk_path}")

    # Pre-read and prepare file data
    file_entries = [] # (ext, dir, stem, crc32, preload_bytes, archive_index, offset, length, data)
    file_data_blobs = []
    current_offset = 0

    for ext, dirs in sorted(files_tree.items()):
        for d, file_list in sorted(dirs.items()):
            for stem, abs_file in sorted(file_list):
                with open(abs_file, "rb") as f:
                    content = f.read()
                
                crc = zlib.crc32(content) & 0xFFFFFFFF
                length = len(content)
                preload_bytes = 0
                archive_index = 0x7fff # 0x7fff indicates data is in the directory VPK itself!

                file_entries.append({
                    "ext": ext,
                    "dir": d,
                    "stem": stem,
                    "crc": crc,
                    "preload_bytes": preload_bytes,
                    "archive_index": archive_index,
                    "offset": current_offset,
                    "length": length,
                    "data": content
                })
                file_data_blobs.append(content)
                current_offset += length

    # Build the directory tree bytes
    tree_bytes = bytearray()
    for ext, dirs in sorted(files_tree.items()):
        tree_bytes.extend(ext.encode("utf-8") + b"\x00")
        for d, file_list in sorted(dirs.items()):
            d_encoded = d.encode("utf-8") if d else b" "
            tree_bytes.extend(d_encoded + b"\x00")
            for stem, abs_file in sorted(file_list):
                # find entry info
                entry = next(e for e in file_entries if e["ext"] == ext and e["dir"] == d and e["stem"] == stem)
                tree_bytes.extend(stem.encode("utf-8") + b"\x00")
                # 18 bytes record:
                # uint32 CRC32
                # uint16 PreloadBytes
                # uint16 ArchiveIndex
                # uint32 EntryOffset
                # uint32 EntryLength
                # uint16 Terminator (0xffff)
                record = struct.pack(
                    "<IHHIIH",
                    entry["crc"],
                    entry["preload_bytes"],
                    entry["archive_index"],
                    entry["offset"],
                    entry["length"],
                    0xFFFF
                )
                tree_bytes.extend(record)
            tree_bytes.extend(b"\x00") # end of files in dir
        tree_bytes.extend(b"\x00") # end of dirs in ext
    tree_bytes.extend(b"\x00") # end of extensions

    tree_size = len(tree_bytes)
    file_data_size = sum(len(b) for b in file_data_blobs)

    # VPK v2 Header (28 bytes):
    # uint32 Signature (0x55aa1234)
    # uint32 Version (2)
    # uint32 TreeSize
    # uint32 FileDataSectionSize
    # uint32 ArchiveMD5SectionSize (0)
    # uint32 OtherMD5SectionSize (0)
    # uint32 SignatureSectionSize (0)
    header = struct.pack(
        "<IIIIIII",
        VPK_SIGNATURE,
        VPK_VERSION,
        tree_size,
        file_data_size,
        0,
        0,
        0
    )

    output_path = Path(output_vpk_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "wb") as f_out:
        f_out.write(header)
        f_out.write(tree_bytes)
        for blob in file_data_blobs:
            f_out.write(blob)

    total_size = len(header) + tree_size + file_data_size
    print(f"Successfully created VPK: {output_vpk_path} ({total_size} bytes)")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python vpk_packer.py <source_dir> <output_vpk_path>")
        sys.exit(1)
    pack_directory(sys.argv[1], sys.argv[2])
