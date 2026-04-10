# ⚡ e-Okul Sihirbazı - Web Versiyonu Kullanım Kılavuzu

## 🎯 Nasıl Çalışır?

Web versiyonu, Android uygulamasının mantığını kullanır:

1. **e-Okul'a giriş yapın** (önce giriş yapmalısınız!)
2. **Bookmarklet'i çalıştırın** (yer iminden tıklayın)
3. **Sağ altta ⚡ ikon belirir**
4. **İkona tıklayarak paneli açın**
5. **Lisans kontrolü yapılır** (başlat butonuna basınca)
6. **Excel yükleyin ve işleme başlayın**

## 📦 Kurulum Adımları

### 1. Bookmarklet'i Yer İmlerine Ekleyin

**Yöntem 1: Sürükle-Bırak (Önerilen)**

1. `index.html` dosyasını tarayıcınızda açın
2. Sayfadaki **"⚡ e-Okul Sihirbazı"** butonunu sürükleyin
3. Tarayıcınızın yer imleri çubuğuna bırakın

**Yöntem 2: Manuel Ekleme**

1. Tarayıcınızda yeni bir yer imi oluşturun
2. İsim: `⚡ e-Okul Sihirbazı`
3. URL alanına şu kodu yapıştırın:

```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=function(){var w=document.createElement('script');w.src='https://arizasahin-a11y.github.io/eokul-wizard/web/wizard-inject.js';document.head.appendChild(w);};document.head.appendChild(s);})();
```

> **Not:** URL'deki `arizasahin-a11y` kısmını kendi GitHub kullanıcı adınızla değiştirin!

### 2. GitHub Pages'i Aktifleştirin

1. GitHub repository'nize gidin
2. **Settings** > **Pages** bölümüne gidin
3. **Source:** `main` branch seçin
4. **Folder:** `/ (root)` seçin
5. **Save** butonuna tıklayın
6. Birkaç dakika bekleyin, sayfanız yayınlanacak

### 3. Bookmarklet URL'ini Güncelleyin

GitHub Pages aktif olduktan sonra:

1. `web/index.html` dosyasını açın
2. Bookmarklet kodundaki URL'i güncelleyin:
   ```
   https://KULLANICI-ADI.github.io/eokul-wizard/web/wizard-inject.js
   ```
3. Değişiklikleri commit edip push edin

## 🚀 Kullanım

### Adım 1: e-Okul'a Giriş

1. https://e-okul.meb.gov.tr adresine gidin
2. Normal şekilde giriş yapın
3. İstediğiniz sayfaya gidin (örn: Gelişim Düzeyi sayfası)

### Adım 2: Sihirbazı Başlatın

1. Yer imlerinden **"⚡ e-Okul Sihirbazı"** butonuna tıklayın
2. Sağ altta yüzen bir ⚡ ikon belirecek
3. İkona tıklayarak kontrol panelini açın

### Adım 3: Excel Yükleyin

Excel formatı:

| A (Sıra) | B (Sınıf) | **C (Öğrenci No)** | D (Ad Soyad) | **E (Tema 1)** | **F (Tema 2)** |
|----------|-----------|-------------------|--------------|---------------|---------------|
| 1        | 9-A       | **100001**        | Ali Yıldız   | **85**        | **90**        |
| 2        | 9-A       | **100002**        | Ayşe Kaya    | **65**        | **70**        |

- **C Sütunu:** Öğrenci numarası (zorunlu)
- **E ve sonrası:** Tema puanları (0-100 arası)

### Adım 4: Ayarları Yapın

1. **Tema No:** İşlenecek temaları girin (örn: `1` veya `1-3`)
2. **Şubeyi Otomatik Atla:** ✅ (önerilir)
3. **Kayıt Onayını Otomatik Onayla:** ✅ (önerilir)

### Adım 5: Başlatın

1. **BAŞLAT** butonuna tıklayın
2. **Lisans kontrolü yapılır**
   - Lisans yoksa modal açılır
   - WhatsApp ile sipariş verebilir veya
   - Mevcut lisansı girebilirsiniz
3. Lisans geçerliyse işlem başlar

## 🔑 Lisans Sistemi

### Lisans Nasıl Alınır?

1. Panelde **"🔑 Lisans Anahtarı Gir"** linkine tıklayın
2. Açılan modalda **"💬 Sipariş Ver (WhatsApp)"** butonuna tıklayın
3. WhatsApp üzerinden sipariş verin
4. Aldığınız lisans kodunu girin
5. **"✅ Aktifleştir"** butonuna tıklayın

### Lisans Formatı

```
XXXX-XXXX-XXXX-XXXX
```

Örnek: `2A3B-4C5D-6E7F-8G9H`

### Lisans Doğrulama

- Lisans, cihaz ID'sine bağlı değildir (web versiyonu için)
- Tarayıcı localStorage'da saklanır
- Tarayıcı verilerini temizlerseniz tekrar girmeniz gerekir

## ⚠️ Önemli Notlar

### Web Versiyonu Sınırlamaları

Bu web versiyonu **simülasyon modunda** çalışır:

- ❌ e-Okul formlarına doğrudan veri yazamaz
- ❌ Otomatik form doldurma yapamaz
- ✅ Excel işleme çalışır
- ✅ Düzey hesaplama çalışır
- ✅ Lisans sistemi çalışır

### Gerçek Kullanım İçin

**Android uygulamasını kullanın!**

Android uygulaması:
- ✅ e-Okul'a doğrudan bağlanır
- ✅ Formları otomatik doldurur
- ✅ Tam otomatik çalışır
- ✅ WebView içinde çalışır

[Android Uygulamasını İndir](../docs/index.html)

## 🐛 Sorun Giderme

### Bookmarklet Çalışmıyor

1. **e-Okul sayfasında mısınız?**
   - Araç sadece e-okul.meb.gov.tr alan adında çalışır

2. **GitHub Pages aktif mi?**
   - Repository Settings > Pages bölümünü kontrol edin
   - URL'in doğru olduğundan emin olun

3. **Konsolu kontrol edin**
   - F12 tuşuna basın
   - Console sekmesine gidin
   - Hata mesajlarını kontrol edin

### ⚡ İkon Görünmüyor

1. Bookmarklet'e tekrar tıklayın
2. Sayfayı yenileyin (F5)
3. Tarayıcı konsolunu kontrol edin

### Excel Yüklenmiyor

1. Dosya formatını kontrol edin (.xlsx veya .xls)
2. C sütununda öğrenci numarası var mı?
3. E sütununda puan var mı?
4. Konsol hatalarını kontrol edin

### Lisans Kabul Edilmiyor

1. Lisans formatını kontrol edin (XXXX-XXXX-XXXX-XXXX)
2. Tire işaretleri doğru mu?
3. Büyük/küçük harf fark etmez
4. Boşluk olmamalı

## 📞 Destek

Sorularınız için:
- 📱 WhatsApp: +90 506 370 55 28
- 🐛 GitHub Issues: [Sorun Bildir](https://github.com/arizasahin-a11y/eokul-wizard/issues)

## 📄 Lisans

Bu yazılım ticari bir üründür. Kullanım için lisans gereklidir.

**Fiyat:** ₺100 (Nisan Kampanyası)

---

**⚡ e-Okul Gelişim Düzeyi Sihirbazı v3.4**  
*Saatler süren işi dakikalara indirin!*
