with open("scratch_shop.vxml_c", "rb") as f:
    d = f.read()

import re
# Look for all strings in scratch_shop.vxml_c
strings = sorted(set(re.findall(rb"[a-zA-Z0-9_]{3,}", d)))
print("All strings in scratch_shop.vxml_c:")
for s in strings:
    print(s.decode("latin1"))
