import capstone

with open(r"E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\bin\win64\client.dll", "rb") as f:
    d = f.read()

md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)

print("=== Disassembly of CitadelQuickbuyAddItem Handler (0x1EEABD0) ===")
code = d[0x1EEABD0:0x1EEAD20]
for insn in md.disasm(code, 0x1EEABD0):
    print(f"0x{insn.address:X}: {insn.mnemonic:8s} {insn.op_str}")
