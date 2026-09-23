import struct
import capstone

with open(r'E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\bin\win64\client.dll', 'rb') as f:
    d = f.read()

# PE Sections
e_lfanew = struct.unpack_from('<I', d, 0x3C)[0]
opt_hdr_offset = e_lfanew + 24
image_base = struct.unpack_from('<Q', d, opt_hdr_offset + 24)[0]
num_sections = struct.unpack_from('<H', d, e_lfanew + 6)[0]
sec_hdr_offset = opt_hdr_offset + struct.unpack_from('<H', d, e_lfanew + 20)[0]

sections = []
for i in range(num_sections):
    sec = d[sec_hdr_offset + i*40 : sec_hdr_offset + (i+1)*40]
    name = sec[:8].rstrip(b'\x00').decode('latin1')
    vsize, rva, raw_size, raw_offset = struct.unpack_from('<IIII', sec, 8)
    sections.append((name, rva, vsize, raw_offset, raw_size))

target_fo = 0x23450b8
def fo_to_rva(fo):
    for name, rva, vsize, raw_offset, raw_size in sections:
        if raw_offset <= fo < raw_offset + raw_size:
            return rva + (fo - raw_offset)
    return None

target_rva = fo_to_rva(target_fo)
print(f"Target FO: {hex(target_fo)}, RVA: {hex(target_rva)}")

# Search for any LEA reg, [rip + disp] where (instr_rva + 7 + disp) == target_rva
matches = []
for name, rva, vsize, raw_offset, raw_size in sections:
    if name == '.text':
        sec_data = d[raw_offset : raw_offset + raw_size]
        for i in range(len(sec_data) - 7):
            # Check for 48 8d xx (REX.W LEA)
            if sec_data[i] == 0x48 and sec_data[i+1] == 0x8d:
                modrm = sec_data[i+2]
                if (modrm & 0xc7) == 0x05: # [rip + disp32]
                    disp = struct.unpack_from('<i', sec_data, i+3)[0]
                    curr_rva = rva + i
                    if curr_rva + 7 + disp == target_rva:
                        matches.append((raw_offset + i, curr_rva))

print(f"Found {len(matches)} LEA references in .text:")
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_64)
for fo, ro in matches:
    print(f"Match at FO {hex(fo)}, RVA {hex(ro)}:")
    code = d[fo - 0x30 : fo + 0x50]
    for insn in md.disasm(code, ro - 0x30):
        prefix = "==> " if insn.address == ro else "    "
        print(f"{prefix}0x{insn.address:X}: {insn.mnemonic:8s} {insn.op_str}")
