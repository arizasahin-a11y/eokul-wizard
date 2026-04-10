# 📦 Chrome Extension Kurulum Rehberi

## 🎯 Hızlı Kurulum (3 Adım)

### 1️⃣ Icon'ları Oluşturun

**Seçenek A: HTML ile (Kolay)**
1. `extension/icons/create-icons.html` dosyasını tarayıcıda açın
2. Icon'lar otomatik indirilecek
3. İndirilen dosyaları `extension/icons/` klasörüne taşıyın

**Seçenek B: Python ile**
```bash
cd extension/icons
pip install Pillow
python generate_icons.py
```

### 2️⃣ Chrome'da Developer Mode Açın
1. Chrome'u açın
2. Adres çubuğuna `chrome://extensions/` yazın
3. Sağ üstten **Developer mode** (Geliştirici modu) açın

### 3️⃣ Extension'ı Yükleyin
1. **Load unpacked** (Paketlenmemiş yükle) butonuna tıklayın
2. `extension` klasörünü seçin
3. **Select Folder** butonuna tıklayın
4. ✅ Extension yüklendi!

## 🚀 Kullanıma Başlayın

### 1. e-Okul'a Gidin
```
https://e-okul.meb.gov.tr
```

### 2. Extension'ı Aktifleştirin
- Toolbar'daki ⚡ ikona tıklayın
- Veya popup'tan **"Sihirbazı Başlat"** butonuna tıklayın

### 3. Panel Açılacak
- Sağ altta yüzen ⚡ ikon görünecek
- İkona tıklayınca kontrol paneli açılacak

### 4. Excel Yükleyin ve Kullanın
- Excel dosyanızı seçin
- Tema numarasını girin
- BAŞLAT'a tıklayın

## 📁 Gerekli Dosyalar

Extension klasöründe şunlar olmalı:

```
extension/
├── manifest.json ✅
├── popup.html ✅
├── popup.js ✅
├── background.js ✅
├── content.js ✅
├── content.css ✅
├── icons/
│   ├── icon16.png ⚠️ (oluşturulmalı)
│   ├── icon32.png ⚠️ (oluşturulmalı)
│   ├── icon48.png ⚠️ (oluşturulmalı)
│   └── icon128.png ⚠️ (oluşturulmalı)
└── libs/
    └── xlsx.full.min.js ✅
```

## 🔧 Sorun Giderme

### "Manifest file is missing or unreadable"
- `manifest.json` dosyası var mı kontrol edin
- Dosya bozuk olabilir, GitHub'dan tekrar indirin

### Icon'lar Görünmüyor
- Icon dosyaları oluşturuldu mu?
- `extension/icons/` klasöründe 4 PNG dosyası olmalı
- `create-icons.html` veya `generate_icons.py` ile oluşturun

### Extension Çalışmıyor
1. Extension'ı reload edin (`chrome://extensions/` > Reload)
2. Sayfayı yenileyin (F5)
3. Console'da hata var mı kontrol edin

### Panel Açılmıyor
- e-Okul sayfasında mısınız?
- Extension aktif mi? (Toolbar'da ⚡ ikon var mı?)
- Sayfayı yenileyin

## 📦 CRX Paketi Oluşturma (İsteğe Bağlı)

Dağıtım için CRX paketi oluşturabilirsiniz:

### Yöntem 1: Chrome'da
1. `chrome://extensions/` sayfasını açın
2. **Pack extension** butonuna tıklayın
3. **Extension root directory:** `extension` klasörünü seçin
4. **Pack Extension** butonuna tıklayın
5. `.crx` dosyası oluşturulacak

### Yöntem 2: Komut Satırı
```bash
# Chrome binary yolu (Windows)
"C:\Program Files\Google\Chrome\Application\chrome.exe" --pack-extension=extension

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --pack-extension=extension

# Linux
google-chrome --pack-extension=extension
```

## 🌐 Diğer Tarayıcılar

### Microsoft Edge
1. `edge://extensions/` sayfasını açın
2. Developer mode açın
3. **Load unpacked** ile yükleyin

### Brave
1. `brave://extensions/` sayfasını açın
2. Developer mode açın
3. **Load unpacked** ile yükleyin

### Opera
1. `opera://extensions/` sayfasını açın
2. Developer mode açın
3. **Load unpacked** ile yükleyin

## 📱 Chromebook

Chromebook'larda da çalışır:
1. Chrome'u açın
2. Yukarıdaki adımları takip edin
3. Linux modu gerekmez

## 🔄 Güncelleme

Extension'ı güncellemek için:
1. Yeni dosyaları indirin
2. `extension` klasörünü değiştirin
3. `chrome://extensions/` > **Reload** butonuna tıklayın

## 📞 Yardım

Sorun devam ederse:
- GitHub Issues: https://github.com/arizasahin-a11y/eokul-wizard/issues
- README: `extension/README.md`
- WhatsApp: +90 506 370 55 28

---

**⚡ e-Okul Gelişim Düzeyi Sihirbazı v3.4.0**  
*Chrome Extension - Tam Özellikli*
