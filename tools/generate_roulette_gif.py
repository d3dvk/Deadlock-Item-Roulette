import os
import math
from PIL import Image, ImageDraw, ImageFont

WIDTH = 640
HEIGHT = 330
CENTER_X = WIDTH // 2 # 320

font_title = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 16)
font_btn = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 13)
font_small = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 10)
font_tiny = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 9)
font_card_name = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 9)
font_card_tier = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 9)
font_card_cost = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', 8)

TIER_COLORS = {
    1: {'border': (16, 185, 129), 'badge': (16, 185, 129), 'cost': '800 Душ'},
    2: {'border': (14, 165, 233), 'badge': (14, 165, 233), 'cost': '1600 Душ'},
    3: {'border': (168, 85, 247), 'badge': (168, 85, 247), 'cost': '3200 Душ'},
    4: {'border': (249, 115, 22), 'badge': (249, 115, 22), 'cost': '6400 Душ'},
}

def render_card(display_name, tier, raw_path):
    cw, ch = 66, 88
    card = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)
    t_info = TIER_COLORS[tier]
    
    # Rounded card background
    draw.rounded_rectangle([0, 0, cw-1, ch-1], radius=6, fill=(17, 24, 39, 255), outline=t_info['border'], width=1)
    
    # Tier pill
    tier_txt = f"T{tier}"
    t_bb = draw.textbbox((0, 0), tier_txt, font=font_card_tier)
    draw.text((cw - (t_bb[2] - t_bb[0]) - 6, 4), tier_txt, font=font_card_tier, fill=t_info['badge'])
    
    # Icon
    if os.path.exists(raw_path):
        raw = Image.open(raw_path).convert('RGBA')
        icon = raw.crop((14, 14, 52, 52)).resize((36, 36), Image.Resampling.LANCZOS)
        card.paste(icon, (cw // 2 - 18, 15), icon if icon.mode == 'RGBA' else None)
        
    # Name
    nbb = draw.textbbox((0, 0), display_name, font=font_card_name)
    nw = nbb[2] - nbb[0]
    draw.text((cw // 2 - nw // 2, 55), display_name, font=font_card_name, fill=(248, 250, 252))
    
    # Cost
    cost_txt = t_info['cost']
    cbb = draw.textbbox((0, 0), cost_txt, font=font_card_cost)
    cw_cost = cbb[2] - cbb[0]
    draw.text((cw // 2 - cw_cost // 2, 70), cost_txt, font=font_card_cost, fill=(245, 158, 11))
    
    return card

# Item list for sequence
ITEMS_INFO = [
    ('healing_rite', 'Healing Rite', 1),
    ('greater_expansion', 'Greater Exp.', 3),
    ('titanic_magazine', 'Titanic Mag.', 2),
    ('rebuttal', 'Rebuttal', 1),
    ('mystic_regen', 'Mystic Regen', 1),
    ('close_quarters', 'Close Quarters', 1),
    ('spirit_shielding', 'Spirit Shield', 2),
    ('active_reload', 'Active Reload', 2),
    ('surge_of_power', 'Surge of Power', 3),
    ('extra_charge', 'Extra Charge', 1),
    ('hunters_aura', "Hunter's Aura", 3),
    ('slowing_bullets', 'Slow Bullets', 2),
    ('recharging_rush', 'Recharge Rush', 2),
    ('spirit_rend', 'Spirit Rend', 3),
    ('spirit_resilience', 'Spirit Resil.', 3),
    ('intensifying_magazine', 'Intensify Mag.', 2),
    ('restorative_shot', 'Restor. Shot', 1),
    ('focus_lens', 'Focus Lens', 4),
    ('headshot_booster', 'Headshot Boost', 1),
    ('mystic_slow', 'Mystic Slow', 2),
    ('fortitude', 'Fortitude', 3),
    ('spellslinger', 'Spellslinger', 4),
]

cards_db = {}
for key, name, tier in ITEMS_INFO:
    cards_db[key] = render_card(name, tier, f'scratch/cards/{key}.png')

# Build the 36-card reel
reel_keys = [
    'mystic_regen', 'close_quarters', 'greater_expansion', 'titanic_magazine',
    'healing_rite', # Index 4: Start card
    'surge_of_power', 'fortitude', 'rebuttal', 'spirit_shielding',
    'active_reload', 'extra_charge', 'hunters_aura', 'slowing_bullets',
    'recharging_rush', 'spirit_rend', 'spirit_resilience', 'intensifying_magazine',
    'restorative_shot', 'focus_lens', 'headshot_booster', 'mystic_slow',
    'fortitude', 'healing_rite', 'titanic_magazine', 'greater_expansion',
    'surge_of_power', 'hunters_aura', 'fortitude',
    'spellslinger', # Index 28: WINNER!
    'spirit_rend', 'headshot_booster', 'focus_lens', 'rebuttal',
    'close_quarters', 'mystic_slow', 'active_reload'
]

cards_img = [cards_db[k] for k in reel_keys]

CARD_W = 66
CARD_H = 88
CARD_STEP = 73
REEL_Y = 64

START_INDEX = 4
WIN_INDEX = 28
TOTAL_SCROLL = (WIN_INDEX - START_INDEX) * CARD_STEP

# Target Cards (procedural for perfect crispness)
def render_target_card(name, tier, icon_key):
    tw, th = 260, 58
    t_img = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    draw = ImageDraw.Draw(t_img)
    draw.rounded_rectangle([0, 0, tw-1, th-1], radius=7, fill=(17, 24, 39, 255), outline=(31, 41, 55), width=1)
    
    # Icon
    raw_p = f'scratch/cards/{icon_key}.png'
    if os.path.exists(raw_p):
        raw = Image.open(raw_p).convert('RGBA')
        icon = raw.crop((14, 14, 52, 52)).resize((36, 36), Image.Resampling.LANCZOS)
        t_img.paste(icon, (10, 11), icon if icon.mode == 'RGBA' else None)
        
    t_info = TIER_COLORS[tier]
    draw.text((54, 8), "ВЫПАВШИЙ ПРЕДМЕТ (К ПОКУПКЕ):", font=font_tiny, fill=(156, 163, 175))
    draw.text((54, 21), f"{name} (Тир {tier})", font=font_small, fill=t_info['badge'])
    draw.text((54, 37), f"0 / {t_info['cost'].split()[0]} Душ (0%)", font=font_tiny, fill=(209, 213, 219))
    
    # Skip button
    draw.rounded_rectangle([202, 16, 248, 42], radius=5, fill=(127, 29, 29), outline=(185, 28, 28))
    draw.text((211, 23), "СКИП", font=font_tiny, fill=(254, 202, 202))
    return t_img

target_idle = render_target_card("Restorative Shot", 1, "restorative_shot")
target_win = render_target_card("Spellslinger", 4, "spellslinger")

# Vignettes
vignette_left = Image.new('RGBA', (80, CARD_H + 4), (0, 0, 0, 0))
vignette_right = Image.new('RGBA', (80, CARD_H + 4), (0, 0, 0, 0))
draw_vl = ImageDraw.Draw(vignette_left)
draw_vr = ImageDraw.Draw(vignette_right)
for x in range(80):
    alpha_l = int(255 * (1.0 - (x / 80.0)**1.2))
    alpha_r = int(255 * ((x / 80.0)**1.2))
    draw_vl.line([(x, 0), (x, CARD_H + 4)], fill=(8, 11, 18, alpha_l))
    draw_vr.line([(x, 0), (x, CARD_H + 4)], fill=(8, 11, 18, alpha_r))

TOTAL_FRAMES = 105
FPS = 21

raw_rgb_frames = []

for frame_idx in range(TOTAL_FRAMES):
    img = Image.new('RGBA', (WIDTH, HEIGHT), (10, 14, 23, 255))
    draw = ImageDraw.Draw(img)

    # 1. Header
    draw.text((32, 18), "SCAMLOCK", font=font_title, fill=(245, 158, 11))
    draw.rounded_rectangle([135, 19, 218, 37], radius=9, fill=(6, 78, 59), outline=(16, 185, 129))
    draw.text((144, 23), "Тир 1 (0-8 мин)", font=font_tiny, fill=(167, 243, 208))
    # Tabs
    draw.rounded_rectangle([235, 18, 290, 38], radius=6, fill=(37, 99, 235))
    draw.text((243, 23), "РУЛЕТКА", font=font_tiny, fill=(255, 255, 255))
    draw.rounded_rectangle([296, 18, 356, 38], radius=6, fill=(30, 41, 59))
    draw.text((304, 23), "ДРАФТ (16)", font=font_tiny, fill=(156, 163, 175))
    # Right buttons
    draw.rounded_rectangle([470, 18, 528, 38], radius=6, fill=(17, 24, 39))
    draw.text((478, 23), "Души: 1250", font=font_tiny, fill=(245, 158, 11))
    draw.rounded_rectangle([535, 18, 560, 38], radius=6, fill=(30, 41, 59))
    draw.text((541, 23), "RU", font=font_tiny, fill=(255, 255, 255))
    draw.rounded_rectangle([566, 18, 620, 38], radius=6, fill=(30, 41, 59))
    draw.text((572, 23), "МАГАЗИН", font=font_tiny, fill=(209, 213, 219))

    # 2. Reel Container Box
    draw.rounded_rectangle([28, 56, 612, 156], radius=8, fill=(8, 11, 18), outline=(31, 41, 55))

    # State & Scroll
    scroll_x = 0
    needle_tick = 0
    glow_alpha = 0

    if frame_idx < 15:
        state = "idle"
        scroll_x = 0
    elif frame_idx < 20:
        state = "clicking"
        scroll_x = 0
    elif frame_idx < 76:
        state = "spinning"
        t = (frame_idx - 20) / 56.0
        if t < 0.14:
            prog = 0.5 * (t / 0.14)**2 * 0.14
        else:
            t_dec = (t - 0.14) / 0.86
            ease = 1.0 - (1.0 - t_dec)**3.2
            prog = 0.07 + 0.93 * ease
        scroll_x = prog * TOTAL_SCROLL
        card_phase = (scroll_x % CARD_STEP) / CARD_STEP
        speed = 1.0 - (t**1.8)
        needle_tick = math.sin(card_phase * math.pi * 2) * 2.0 * speed
    else:
        state = "won"
        scroll_x = TOTAL_SCROLL
        win_frame = frame_idx - 76
        glow_alpha = min(1.0, win_frame / 6.0) * (0.85 + 0.15 * math.sin(win_frame * 0.4))

    # 3. Reel Cards
    reel_clip = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    for i, c_img in enumerate(cards_img):
        cx = CENTER_X + (i - START_INDEX) * CARD_STEP - int(scroll_x)
        x = cx - CARD_W // 2
        y = REEL_Y
        if 20 <= x <= 620:
            reel_clip.paste(c_img, (x, y))
            if state == "won" and i == WIN_INDEX and glow_alpha > 0:
                glow_draw = ImageDraw.Draw(reel_clip)
                ga = int(glow_alpha * 255)
                glow_draw.rounded_rectangle([x-2, y-2, x+CARD_W+2, y+CARD_H+2], radius=6, outline=(245, 158, 11, ga), width=2)
                glow_draw.rounded_rectangle([x-4, y-4, x+CARD_W+4, y+CARD_H+4], radius=7, outline=(251, 191, 36, int(ga * 0.4)), width=1)

    # Mask to inner reel bounds
    mask = Image.new('L', (WIDTH, HEIGHT), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([30, 58, 610, 154], radius=7, fill=255)
    img.paste(reel_clip, (0, 0), mask)

    # Vignettes
    img.alpha_composite(vignette_left, (30, REEL_Y - 2))
    img.alpha_composite(vignette_right, (532, REEL_Y - 2))

    # 4. Golden Needle
    nx = int(CENTER_X + needle_tick)
    ny_top = REEL_Y - 6
    ny_bot = REEL_Y + CARD_H + 6
    draw.line([(nx, ny_top), (nx, ny_bot)], fill=(245, 158, 11, 140), width=4)
    draw.line([(nx, ny_top), (nx, ny_bot)], fill=(254, 240, 138), width=2)
    draw.polygon([(nx, ny_top + 10), (nx + 5, ny_top + 2), (nx, ny_top - 3), (nx - 5, ny_top + 2)], fill=(245, 158, 11))
    draw.polygon([(nx, ny_bot - 10), (nx + 5, ny_bot - 2), (nx, ny_bot + 3), (nx - 5, ny_bot - 2)], fill=(245, 158, 11))

    # 5. Buttons & Target
    btn_w, btn_h = 240, 36
    btn_x = CENTER_X - btn_w // 2
    btn_y = 172

    if state in ("idle", "clicking"):
        b_fill = (217, 119, 6) if state == "idle" else (245, 158, 11)
        b_outline = (251, 191, 36)
        draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=7, fill=b_fill, outline=b_outline, width=2)
        btn_txt = "КРУТИТЬ БАРАБАН"
        bb = draw.textbbox((0, 0), btn_txt, font=font_btn)
        tw = bb[2] - bb[0]
        draw.text((CENTER_X - tw // 2, btn_y + 8), btn_txt, font=font_btn, fill=(17, 24, 39))
        st = "Нажмите, чтобы испытать удачу в рулетке"
        sbb = draw.textbbox((0, 0), st, font=font_tiny)
        draw.text((CENTER_X - (sbb[2] - sbb[0]) // 2, btn_y + 44), st, font=font_tiny, fill=(156, 163, 175))
        img.alpha_composite(target_idle, (CENTER_X - target_idle.width // 2, 248))

    elif state == "spinning":
        draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=7, fill=(30, 41, 59), outline=(59, 130, 246), width=2)
        btn_txt = "ВРАЩЕНИЕ БАРАБАНА..."
        bb = draw.textbbox((0, 0), btn_txt, font=font_btn)
        tw = bb[2] - bb[0]
        draw.text((CENTER_X - tw // 2, btn_y + 8), btn_txt, font=font_btn, fill=(147, 197, 253))
        st = "Выбираем случайный предмет для покупки..."
        sbb = draw.textbbox((0, 0), st, font=font_tiny)
        draw.text((CENTER_X - (sbb[2] - sbb[0]) // 2, btn_y + 44), st, font=font_tiny, fill=(59, 130, 246))
        img.alpha_composite(target_idle, (CENTER_X - target_idle.width // 2, 248))

    elif state == "won":
        draw.rounded_rectangle([btn_x - 30, btn_y, btn_x + btn_w + 30, btn_y + btn_h], radius=7, fill=(185, 28, 28), outline=(239, 68, 68), width=2)
        btn_txt = "ТРЕБУЕТСЯ КУПИТЬ: SPELLSLINGER"
        bb = draw.textbbox((0, 0), btn_txt, font=font_btn)
        tw = bb[2] - bb[0]
        draw.text((CENTER_X - tw // 2, btn_y + 8), btn_txt, font=font_btn, fill=(255, 255, 255))
        st = "Выпало: Spellslinger. Загляните в лавку за покупкой."
        sbb = draw.textbbox((0, 0), st, font=font_tiny)
        draw.text((CENTER_X - (sbb[2] - sbb[0]) // 2, btn_y + 44), st, font=font_tiny, fill=(52, 211, 153))
        img.alpha_composite(target_win, (CENTER_X - target_win.width // 2, 248))

    # 6. Footer
    ft = "Scamlock • Автор: d3dvk (Discord: dedvk) • Создано с помощью ИИ"
    fbb = draw.textbbox((0, 0), ft, font=font_tiny)
    draw.text((CENTER_X - (fbb[2] - fbb[0]) // 2, 314), ft, font=font_tiny, fill=(100, 116, 139))

    raw_rgb_frames.append(img.convert('RGB'))

# BUILD UNIFIED GLOBAL PALETTE FROM 4 KEY STATES
# This guarantees 100% ZERO color shifting and ZERO background flickering!
palette_canvas = Image.new('RGB', (WIDTH * 2, HEIGHT * 2))
palette_canvas.paste(raw_rgb_frames[0], (0, 0))                # Idle
palette_canvas.paste(raw_rgb_frames[18], (WIDTH, 0))           # Click
palette_canvas.paste(raw_rgb_frames[45], (0, HEIGHT))          # Spin
palette_canvas.paste(raw_rgb_frames[-1], (WIDTH, HEIGHT))      # Win
global_palette_img = palette_canvas.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

# Quantize every frame against the unified palette with NO dithering (clean solid colors)
clean_frames = []
for f in raw_rgb_frames:
    p_frame = f.quantize(palette=global_palette_img, dither=Image.Dither.NONE)
    clean_frames.append(p_frame)

# Save Rock-Solid GIF
output_path = 'scamlock_roulette_spin.gif'
frame_duration = int(1000 / FPS)

clean_frames[0].save(
    output_path,
    save_all=True,
    append_images=clean_frames[1:],
    duration=frame_duration,
    loop=0,
    optimize=False
)

import shutil
shutil.copyfile(output_path, 'Scamlock_Demo.gif')

file_size = os.path.getsize(output_path)
print(f'Rock-Solid GIF created: {output_path} ({file_size} bytes, {file_size / 1024 / 1024:.2f} MB, {len(clean_frames)} frames)')
