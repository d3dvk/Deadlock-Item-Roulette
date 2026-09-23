#!/usr/bin/env python3
"""
Enable Deadlock console logging in Steam configuration and create direct launcher.
Sets -condebug so all [ROULETTE] logs stream directly and automatically
to E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\console.log without needing to copy manually.
"""

import glob
import re
from pathlib import Path

BASE_DIR = Path("E:/Deadlock_mod")
STEAM_PATHS = [
    Path("D:/Steam"),
    Path("C:/Program Files (x86)/Steam"),
    Path("C:/Steam")
]

def update_localconfig():
    updated = 0
    for s_path in STEAM_PATHS:
        if not s_path.is_dir():
            continue
        pattern = str(s_path / "userdata/*/config/localconfig.vdf")
        for vdf_path in glob.glob(pattern):
            try:
                with open(vdf_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

                if '"1422450"' not in content:
                    continue

                idx = content.find('"1422450"')
                end_block = content.find('}\n\t\t\t\t\t"', idx)
                if end_block == -1:
                    end_block = idx + 1000
                block = content[idx:end_block]

                if '"LaunchOptions"' in block:
                    def replacer(m):
                        val = m.group(1).strip()
                        if "-condebug" not in val:
                            val = (val + " -condebug").strip()
                        return f'"LaunchOptions"\t\t"{val}"'

                    new_block = re.sub(r'"LaunchOptions"\s+"([^"]*)"', replacer, block)
                else:
                    brace_pos = block.find('{') + 1
                    new_block = block[:brace_pos] + '\n\t\t\t\t\t\t"LaunchOptions"\t\t"-condebug"' + block[brace_pos:]

                if new_block != block:
                    content = content[:idx] + new_block + content[end_block:]
                    with open(vdf_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"[SUCCESS] Updated LaunchOptions with -condebug in {vdf_path}")
                    updated += 1
                else:
                    print(f"[OK] Already configured with -condebug: {vdf_path}")

            except Exception as e:
                print(f"[ERROR] Failed {vdf_path}: {e}")

    return updated

def create_launcher():
    bat_path = BASE_DIR / "Launch_Deadlock_With_Logs.bat"
    steam_exe = Path("D:/Steam/steam.exe")
    if not steam_exe.is_file():
        steam_exe = Path("C:/Program Files (x86)/Steam/steam.exe")

    bat_content = f"""@echo off
title Deadlock - Item Roulette Auto-Logging Launcher
echo ===================================================
echo   DEADLOCK ITEM ROULETTE - LAUNCHER WITH LOGGING
echo ===================================================
echo Launching Deadlock with -condebug...
start "" "{str(steam_exe)}" -applaunch 1422450 -condebug
echo Deadlock launched! Console logs will stream to:
echo E:\\SteamLibrary\\steamapps\\common\\Deadlock\\game\\citadel\\console.log
timeout /t 3 >nul
exit
"""
    with open(bat_path, "w", encoding="utf-8") as f:
        f.write(bat_content)
    print(f"[SUCCESS] Created launcher: {bat_path}")

def main():
    print("=== ENABLING STEAM DEADLOCK CONSOLE LOGGING (-condebug) ===")
    count = update_localconfig()
    print(f"Total configs updated: {count}")
    create_launcher()

if __name__ == "__main__":
    main()
