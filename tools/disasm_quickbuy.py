import capstone

with open(r"E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\bin\win64\client.dll", "rb") as f:
    d = f.read()

md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)

print("=== Disassembly around 0x8E410 (Registration) ===")
code = d[0x8E410:0x8E480]
for insn in md.disasm(code, 0x8E410):
    print(f"0x{insn.address:X}: {insn.mnemonic} {insn.op_str}")

print("\n=== Disassembly at 0x1EEABD0 (Handler) ===")
code2 = d[0x1EEABD0:0x1EEAC90]
for insn in md.disasm(code2, 0x1EEABD0):
    print(f"0x{insn.address:X}: {insn.mnemonic} {insn.op_str}")
