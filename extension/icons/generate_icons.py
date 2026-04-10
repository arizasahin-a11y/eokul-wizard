#!/usr/bin/env python3
"""
Icon Generator for e-Okul Sihirbazı Chrome Extension
Generates PNG icons in different sizes
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Icon boyutları
SIZES = [16, 32, 48, 128]

# Renkler
BG_COLOR_START = (16, 185, 129)  # #10b981
BG_COLOR_END = (5, 150, 105)     # #059669

def create_gradient(size):
    """Gradient arka plan oluştur"""
    image = Image.new('RGB', (size, size))
    draw = ImageDraw.Draw(image)
    
    for y in range(size):
        # Linear gradient
        ratio = y / size
        r = int(BG_COLOR_START[0] * (1 - ratio) + BG_COLOR_END[0] * ratio)
        g = int(BG_COLOR_START[1] * (1 - ratio) + BG_COLOR_END[1] * ratio)
        b = int(BG_COLOR_START[2] * (1 - ratio) + BG_COLOR_END[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    return image

def add_lightning(image, size):
    """Şimşek simgesi ekle"""
    draw = ImageDraw.Draw(image)
    
    # Şimşek çiz (basit bir şimşek şekli)
    lightning_size = int(size * 0.6)
    offset_x = (size - lightning_size) // 2
    offset_y = (size - lightning_size) // 2
    
    # Şimşek noktaları
    points = [
        (offset_x + lightning_size * 0.5, offset_y),
        (offset_x + lightning_size * 0.3, offset_y + lightning_size * 0.5),
        (offset_x + lightning_size * 0.5, offset_y + lightning_size * 0.5),
        (offset_x + lightning_size * 0.2, offset_y + lightning_size),
        (offset_x + lightning_size * 0.6, offset_y + lightning_size * 0.6),
        (offset_x + lightning_size * 0.4, offset_y + lightning_size * 0.6),
        (offset_x + lightning_size * 0.8, offset_y + lightning_size * 0.2),
    ]
    
    draw.polygon(points, fill=(255, 255, 255))
    
    return image

def generate_icon(size):
    """Belirtilen boyutta icon oluştur"""
    image = create_gradient(size)
    image = add_lightning(image, size)
    
    # Köşeleri yuvarla (opsiyonel)
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size, size)], radius=size//8, fill=255)
    
    output = Image.new('RGBA', (size, size))
    output.paste(image, (0, 0))
    output.putalpha(mask)
    
    return output

def main():
    """Ana fonksiyon"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    for size in SIZES:
        icon = generate_icon(size)
        filename = f'icon{size}.png'
        filepath = os.path.join(script_dir, filename)
        icon.save(filepath, 'PNG')
        print(f'✅ {filename} oluşturuldu')
    
    print('\n🎉 Tüm icon\'lar başarıyla oluşturuldu!')

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print('❌ PIL (Pillow) kütüphanesi gerekli!')
        print('Kurulum: pip install Pillow')
        print('\nAlternatif: extension/icons/create-icons.html dosyasını tarayıcıda açın')
