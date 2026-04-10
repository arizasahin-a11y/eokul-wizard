# ⚡ e-Okul Gelişim Düzeyi Sihirbazı - Chrome Extension

Excel'den e-Okul'a otomatik Gelişim Düzeyi girişi yapan Chrome eklentisi.

## 🎯 Özellikler

- ✅ **Tam Özellikli:** Excel işleme ve otomatik form doldurma
- ✅ **CSP Bypass:** e-Okul'un güvenlik kısıtlamasını aşar
- ✅ **Kolay Kurulum:** Tek tıkla yükleme
- ✅ **Güvenli:** Veriler sadece e-Okul'a gönderilir
- ✅ **Mobil Uyumlu:** Responsive tasarım
- ✅ **Lisans Sistemi:** Aktivasyon kodu ile çalışır

## 📦 Kurulum

### Yöntem 1: Developer Mode (Geliştirici Modu)

1. **Extension klasörünü hazırlayın**
   - Bu `extension` klasörünü bilgisayarınıza indirin

2. **Icon'ları oluşturun**
   - `extension/icons/create-icons.html` dosyasını tarayıcıda açın
   - İndirilen icon'ları `extension/icons/` klasörüne taşıyın

3. **Chrome'u açın**
   - Adres çubuğuna `chrome://extensions/` yazın
   - Sağ üstten **Developer mode** (Geliştirici modu) açın

4. **Extension'ı yükleyin**
   - **Load unpacked** (Paketlenmemiş yükle) butonuna tıklayın
   - `extension` klasörünü seçin
   - **Select Folder** (Klasör seç) butonuna tıklayın

5. **Hazır!**
   - Extension yüklendi
   - Toolbar'da ⚡ ikonu görünecek

### Yöntem 2: CRX Dosyası (Önerilir)

1. **CRX oluşturun**
   ```bash
   # Chrome'da
   chrome://extensions/ > Pack extension
   # Extension root directory: extension klasörünü seçin
   ```

2. **CRX'i yükleyin**
   - Oluşan `.crx` dosyasını Chrome'a sürükleyin
   - **Add extension** butonuna tıklayın

## 🚀 Kullanım

### 1. e-Okul'a Giriş Yapın
```
https://e-okul.meb.gov.tr
```

### 2. Extension'ı Aktifleştirin
- Toolbar'daki ⚡ ikona tıklayın
- Veya popup'tan **"Sihirbazı Başlat"** butonuna tıklayın

### 3. Panel Açılacak
- Sağ altta yüzen ⚡ ikon görünecek
- İkona tıklayınca kontrol paneli açılacak

### 4. Excel Yükleyin
Excel formatı:
| A (Sıra) | B (Sınıf) | **C (Öğrenci No)** | D (Ad Soyad) | **E (Tema 1)** |
|----------|-----------|-------------------|--------------|---------------|
| 1        | 9-A       | **100001**        | Ali Yıldız   | **85**        |

- **C Sütunu:** Öğrenci numarası (zorunlu)
- **E ve sonrası:** Tema puanları (0-100)

### 5. Ayarları Yapın
- **Tema No:** İşlenecek temalar (örn: `1` veya `1-3`)
- **Şubeyi Otomatik Atla:** ✅
- **Kayıt Onayını Otomatik Onayla:** ✅

### 6. Başlatın
- **BAŞLAT** butonuna tıklayın
- Lisans kontrolü yapılacak
- İşlem otomatik başlayacak

## 🔑 Lisans

Extension ilk kullanımda lisans anahtarı isteyecek.

**Lisans almak için:**
- WhatsApp: +90 506 370 55 28
- Fiyat: ₺100 (Nisan Kampanyası)

**Lisans formatı:**
```
XXXX-XXXX-XXXX-XXXX
```

## 📁 Dosya Yapısı

```
extension/
├── manifest.json          # Extension yapılandırması
├── popup.html            # Popup arayüzü
├── popup.js              # Popup mantığı
├── background.js         # Arka plan servisi
├── content.js            # Ana sihirbaz scripti
├── content.css           # Stil dosyası
├── icons/                # Extension icon'ları
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── libs/                 # Kütüphaneler
    └── xlsx.full.min.js  # SheetJS
```

## 🔧 Geliştirme

### Değişiklik Yaptıktan Sonra

1. `chrome://extensions/` sayfasını açın
2. Extension'ın altındaki **Reload** (Yenile) butonuna tıklayın
3. Sayfayı yenileyin (F5)

### Debug

1. Extension popup'ında sağ tık > **Inspect**
2. Content script için sayfa üzerinde sağ tık > **Inspect** > **Console**

## ⚠️ Önemli Notlar

- Extension sadece `e-okul.meb.gov.tr` alan adında çalışır
- Veriler hiçbir sunucuya gönderilmez
- SheetJS kütüphanesi Apache 2.0 lisansı altındadır
- Lisans cihaz bazlıdır (her bilgisayar için ayrı)

## 🐛 Sorun Giderme

### Extension Yüklenmiyor
- Developer mode açık mı kontrol edin
- `manifest.json` dosyası var mı kontrol edin
- Console'da hata var mı bakın

### Panel Açılmıyor
- Sayfayı yenileyin (F5)
- Extension'ı reload edin
- Console'da hata var mı kontrol edin

### Excel Yüklenmiyor
- Dosya formatı doğru mu? (.xlsx veya .xls)
- C sütununda öğrenci no var mı?
- E sütununda puan var mı?

## 📞 Destek

- GitHub Issues: https://github.com/arizasahin-a11y/eokul-wizard/issues
- WhatsApp: +90 506 370 55 28

## 📄 Lisans

Bu yazılım ticari bir üründür. Kullanım için lisans gereklidir.

---

**⚡ e-Okul Gelişim Düzeyi Sihirbazı v3.4.0**  
*Saatler süren işi dakikalara indirin!*
