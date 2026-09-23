with open(r'E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\bin\win64\client.dll', 'rb') as f:
    d = f.read()

import re
matches = [m.start() for m in re.finditer(b'quickbuy add', d)]
print('Matches for "quickbuy add":')
for m in matches:
    print('  Offset:', hex(m), d[m:m+40])

# Also search for 'quickbuy' console command registration
qb_cmds = [m.start() for m in re.finditer(b'quickbuy\x00', d)]
print('Matches for "quickbuy\\0":')
for m in qb_cmds:
    print('  Offset:', hex(m))
