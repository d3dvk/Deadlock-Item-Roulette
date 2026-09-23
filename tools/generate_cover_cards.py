import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Output directories
DIR_BASE = 'cover_cards'
os.makedirs(f'{DIR_BASE}/ru', exist_ok=True)
os.makedirs(f'{DIR_BASE}/en', exist_ok=True)
os.makedirs(f'{DIR_BASE}/2x_highres', exist_ok=True)

# 2X base resolution: 420 x 720 (scales down to 210 x 360)
W, H = 420, 720

# Fonts for 2X resolution
f_tier = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 20)
f_cat = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 18)
f_name = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 30)
f_sub = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 17)
f_cost = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 26)
f_footer = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 15)

CARDS_DATA = [
    {
        'key': 'spellslinger',
        'name': 'Spellslinger',
        'tier': 4,
        'cat_ru': 'ОРУЖИЕ',
        'cat_en': 'WEAPON',
        'cost_ru': '6,400 Душ',
        'cost_en': '6,400 Souls',
        'color': (249, 115, 22),       # Vibrant Orange
        'color_glow': (251, 146, 60),
    },
    {
        'key': 'fortitude',
        'name': 'Fortitude',
        'tier': 3,
        'cat_ru': 'ЖИВУЧЕСТЬ',
        'cat_en': 'VITALITY',
        'cost_ru': '3,200 Душ',
        'cost_en': '3,200 Souls',
        'color': (168, 85, 247),       # Mystic Purple
        'color_glow': (192, 132, 252),
    },
    {
        'key': 'healing_rite',
        'name': 'Healing Rite',
        'tier': 1,
        'cat_ru': 'СПИРИТИЗМ',
        'cat_en': 'SPIRIT',
        'cost_ru': '800 Душ',
        'cost_en': '800 Souls',
        'color': (16, 185, 129),       # Emerald Green
        'color_glow': (52, 211, 153),
    },
    {
        'key': 'headshot_booster',
        'name': 'Headshot Booster',
        'tier': 1,
        'cat_ru': 'ОРУЖИЕ',
        'cat_en': 'WEAPON',
        'cost_ru': '800 Душ',
        'cost_en': '800 Souls',
        'color': (234, 179, 8),        # Amber Gold
        'color_glow': (250, 204, 21),
    },
    {
        'key': 'surge_of_power',
        'name': 'Surge of Power',
        'tier': 3,
        'cat_ru': 'СПИРИТИЗМ',
        'cat_en': 'SPIRIT',
        'cost_ru': '3,200 Душ',
        'cost_en': '3,200 Souls',
        'color': (139, 92, 246),       # Violet
        'color_glow': (167, 139, 250),
    }
]

def render_premium_card(data, lang='ru'):
    card = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    
    color_primary = data['color']
    pad = 12
    card_box = [pad, pad, W - pad, H - pad]
    radius = 24
    
    # 1. Subtle Outer Glow
    for glow_i in range(8, 0, -2):
        alpha = int(24 * (glow_i / 8.0))
        glow_box = [pad - glow_i, pad - glow_i, W - pad + glow_i, H - pad + glow_i]
        draw.rounded_rectangle(glow_box, radius=radius + glow_i, outline=(*color_primary, alpha), width=2)
        
    # 2. Main Card Body (Deep Obsidian / Dark Slate)
    draw.rounded_rectangle(card_box, radius=radius, fill=(13, 17, 26, 255), outline=(*color_primary, 255), width=3)
    
    # Inner border line
    inner_pad = pad + 6
    draw.rounded_rectangle([inner_pad, inner_pad, W - inner_pad, H - inner_pad], radius=radius - 4, outline=(255, 255, 255, 18), width=1)
    
    # 3. Header: Category (Left) and Tier Badge (Right)
    category_text = data['cat_ru'] if lang == 'ru' else data['cat_en']
    c_bb = draw.textbbox((0, 0), category_text, font=f_cat)
    cat_w = c_bb[2] - c_bb[0]
    box_w = max(110, cat_w + 24)
    draw.rounded_rectangle([inner_pad + 12, inner_pad + 14, inner_pad + 12 + box_w, inner_pad + 48], radius=8, fill=(24, 32, 47, 255), outline=(255, 255, 255, 30))
    draw.text((inner_pad + 24, inner_pad + 20), category_text, font=f_cat, fill=(160, 174, 192))
    
    # Tier Badge
    draw.rounded_rectangle([W - inner_pad - 104, inner_pad + 14, W - inner_pad - 12, inner_pad + 48], radius=8, fill=(*color_primary, 40), outline=(*color_primary, 255), width=2)
    tier_str = f"ТИР {data['tier']}" if lang == 'ru' else f"TIER {data['tier']}"
    tbb = draw.textbbox((0, 0), tier_str, font=f_tier)
    tw = tbb[2] - tbb[0]
    draw.text((W - inner_pad - 58 - tw // 2, inner_pad + 18), tier_str, font=f_tier, fill=color_primary)
    
    # 4. Icon Showcase Frame (Center)
    icon_frame_w, icon_frame_h = 240, 240
    fx = (W - icon_frame_w) // 2
    fy = inner_pad + 68
    
    draw.rounded_rectangle([fx, fy, fx + icon_frame_w, fy + icon_frame_h], radius=18, fill=(8, 11, 17, 255), outline=(*color_primary, 140), width=2)
    draw.rounded_rectangle([fx + 4, fy + 4, fx + icon_frame_w - 4, fy + icon_frame_h - 4], radius=15, outline=(255, 255, 255, 15), width=1)
    
    # Load and scale item icon
    icon_path = f"scratch/cards/{data['key']}.png"
    if os.path.exists(icon_path):
        raw = Image.open(icon_path).convert('RGBA')
        icon_raw = raw.crop((14, 14, 52, 52))
        icon_large = icon_raw.resize((190, 190), Image.Resampling.LANCZOS)
        icon_large = icon_large.filter(ImageFilter.UnsharpMask(radius=2, percent=140, threshold=2))
        card.paste(icon_large, (fx + 25, fy + 25), icon_large if icon_large.mode == 'RGBA' else None)
        
    # Decorative horizontal separator
    sep_y = fy + icon_frame_h + 30
    draw.line([(inner_pad + 20, sep_y), (W - inner_pad - 20, sep_y)], fill=(*color_primary, 80), width=2)
    draw.polygon([(W // 2, sep_y - 6), (W // 2 + 6, sep_y), (W // 2, sep_y + 6), (W // 2 - 6, sep_y)], fill=color_primary)
    
    # 5. Item Name
    nbb = draw.textbbox((0, 0), data['name'], font=f_name)
    nw = nbb[2] - nbb[0]
    draw.text(((W - nw) // 2, sep_y + 20), data['name'], font=f_name, fill=(255, 255, 255))
    
    # Subtitle
    sub_txt = "DEADLOCK ITEM ROULETTE"
    sbb = draw.textbbox((0, 0), sub_txt, font=f_sub)
    sw = sbb[2] - sbb[0]
    draw.text(((W - sw) // 2, sep_y + 64), sub_txt, font=f_sub, fill=(148, 163, 184))
    
    # 6. Cost Pill with Gold Glow
    cost_text = data['cost_ru'] if lang == 'ru' else data['cost_en']
    cost_y = sep_y + 114
    cost_w = 260
    cost_box = [(W - cost_w) // 2, cost_y, (W + cost_w) // 2, cost_y + 54]
    draw.rounded_rectangle(cost_box, radius=12, fill=(20, 27, 40, 255), outline=(245, 158, 11, 200), width=2)
    
    # Soul diamond icon
    sx = (W - cost_w) // 2 + 24
    sy = cost_y + 27
    draw.polygon([(sx, sy - 11), (sx + 9, sy), (sx, sy + 11), (sx - 9, sy)], fill=(245, 158, 11))
    draw.text((sx + 20, cost_y + 10), cost_text, font=f_cost, fill=(251, 191, 36))
    
    # 7. Card Footer Branding
    footer_y = H - pad - 36
    draw.text((inner_pad + 20, footer_y), "SCAMLOCK MOD", font=f_footer, fill=(100, 116, 139))
    draw.text((W - inner_pad - 120, footer_y), "DEADLOCK", font=f_footer, fill=(100, 116, 139))
    
    return card

print("Rendering cards...")
for data in CARDS_DATA:
    key = data['key']
    
    # Russian 2X and HD (210x360)
    card_ru = render_premium_card(data, 'ru')
    card_ru.save(f'{DIR_BASE}/2x_highres/{key}_ru_420x720.png')
    card_ru_hd = card_ru.resize((210, 360), Image.Resampling.LANCZOS)
    card_ru_hd.save(f'{DIR_BASE}/ru/{key}_210x360.png')
    
    # English 2X and HD (210x360)
    card_en = render_premium_card(data, 'en')
    card_en.save(f'{DIR_BASE}/2x_highres/{key}_en_420x720.png')
    card_en_hd = card_en.resize((210, 360), Image.Resampling.LANCZOS)
    card_en_hd.save(f'{DIR_BASE}/en/{key}_210x360.png')

print("All cover cards generated successfully in cover_cards/")
