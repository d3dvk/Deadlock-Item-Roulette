#!/usr/bin/env python3
"""
Inspect and stream real-time Deadlock Item Roulette logs directly from Deadlock console.log.
Usage: python tools/read_roulette_logs.py [num_lines]
"""

import sys
from pathlib import Path

CONSOLE_LOG = Path("E:/SteamLibrary/steamapps/common/Deadlock/game/citadel/console.log")

def main():
    num_lines = int(sys.argv[1]) if len(sys.argv) > 1 else 60

    if not CONSOLE_LOG.exists():
        print(f"[ERROR] console.log not found at: {CONSOLE_LOG}")
        return

    with open(CONSOLE_LOG, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()

    roulette_lines = [l.strip() for l in lines if "[ROULETTE]" in l or "QUICKBUY" in l or "Quickbuy" in l]

    if not roulette_lines:
        print(f"[INFO] No [ROULETTE] lines found in console.log ({len(lines)} total lines). Last 25 lines:")
        for l in lines[-25:]:
            print("  ", l.strip())
        return

    print(f"=== FOUND {len(roulette_lines)} ROULETTE LOG LINES (Showing last {min(num_lines, len(roulette_lines))}) ===")
    for l in roulette_lines[-num_lines:]:
        print(l)

if __name__ == "__main__":
    main()
