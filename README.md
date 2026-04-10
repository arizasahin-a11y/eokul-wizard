# ⚡ e-Okul Gelişim Düzeyi Sihirbazı

Excel'den e-Okul'a otomatik Gelişim Düzeyi girişi yapan uygulama. Saatler süren veri girişini **dakikalara** indirin!

## 📱 Platformlar

### Android Uygulaması (Tam Özellikli)
- ✅ e-Okul'a doğrudan entegrasyon
- ✅ Tam otomatik form doldurma
- ✅ WebView içinde çalışır
- ✅ Çoklu şube desteği
- 💰 **Fiyat:** ₺100 (Nisan Kampanyası)

[📥 Android Uygulamasını İndir](docs/index.html)

### Web Versiyonu (Bookmarklet)
- ✅ Excel işleme
- ✅ Düzey hesaplama
- ✅ Lisans sistemi
- ⚠️ Simülasyon modu (gerçek e-Okul entegrasyonu yok)

[🌐 Web Versiyonu Kurulum](web/index.html) | [📖 Kullanım Kılavuzu](web/KULLANIM.md)

## 🚀 Özellikler

- ⚡ **Tam Otomatik:** Excel yükle, butona bas, bitti!
- 📊 **Akıllı Düzey Hesaplama:** Puanlara göre otomatik düzey belirleme
- 🏫 **Çoklu Şube:** Birden fazla şubeyi sırayla işler
- 🎯 **Çoklu Tema:** Birden fazla temayı tek seferde işle
- ⏸️ **Duraklat/Devam:** İstediğin zaman duraklat
- 🔒 **Güvenli:** Veriler hiçbir sunucuya gönderilmez

## 📊 Excel Formatı

| A (Sıra) | B (Sınıf) | **C (Öğrenci No)** | D (Ad Soyad) | **E (Tema 1)** | **F (Tema 2)** |
|----------|-----------|-------------------|--------------|---------------|---------------|
| 1        | 9-A       | **100001**        | Ali Yıldız   | **85**        | **90**        |
| 2        | 9-A       | **100002**        | Ayşe Kaya    | **65**        | **70**        |

- **C Sütunu:** Öğrenci numarası (zorunlu)
- **E ve sonrası:** Tema puanları (0-100 arası)

[📥 Örnek Excel İndir](docs/tablo.xlsx)

## 🎯 Nasıl Çalışır?

### Android Uygulaması

1. APK'yı indir ve yükle
2. e-Okul'a giriş yap
3. Sağ alttaki ⚡ ikona tıkla
4. Excel yükle ve BAŞLAT'a bas

### Web Versiyonu

1. Bookmarklet'i yer imlerine ekle
2. e-Okul'a giriş yap
3. Yer iminden sihirbazı çalıştır
4. ⚡ ikona tıkla, Excel yükle

## 📦 Kurulum

### Android

1. [APK dosyasını indir](docs/eOS.apk)
2. Telefonunuzda "Bilinmeyen kaynaklardan yükleme" iznini verin
3. APK'yı yükleyin
4. WhatsApp'tan lisans kodu alın

### Web (Bookmarklet)

1. [Kurulum sayfasını aç](web/index.html)
2. Bookmarklet'i yer imlerine sürükle
3. e-Okul'a giriş yap
4. Yer iminden çalıştır

Detaylı kurulum için: [Web Kullanım Kılavuzu](web/KULLANIM.md)

## 💰 Fiyatlandırma

| Platform | Fiyat | Özellikler |
|----------|-------|-----------|
| **Android** | ₺100 | Tam otomatik, e-Okul entegrasyonu |
| **Web** | ₺100 | Simülasyon modu, test için ideal |

**Nisan Kampanyası:** Normal fiyat ₺250, şimdi sadece ₺100!

## 📞 İletişim

- 📱 WhatsApp: [+90 506 370 55 28](https://wa.me/905063705528)
- 🌐 Web: [Demo Sayfası](web/demo.html)
- 📧 Destek: GitHub Issues

## 🎬 Video

[📺 Tanıtım Videosu İzle](https://www.youtube.com/embed/xi7zfdxHFIE)

## 📁 Proje Yapısı

```
eokul-wizard/
├── app/                    # Android uygulama kaynak kodları
│   └── src/main/
│       ├── java/          # Java kaynak dosyaları
│       ├── assets/        # wizard.js, xlsx.js
│       └── res/           # Android kaynakları
├── web/                   # Web versiyonu
│   ├── index.html        # Bookmarklet kurulum sayfası
│   ├── wizard-inject.js  # Ana script (e-Okul'a enjekte edilir)
│   ├── demo.html         # Demo ve tanıtım
│   ├── sample-data.html  # Örnek Excel oluşturucu
│   └── KULLANIM.md       # Detaylı kullanım kılavuzu
├── docs/                  # Satış ve tanıtım sayfaları
│   ├── index.html        # Ana satış sayfası
│   ├── alg.html          # Lisans yönetim paneli
│   └── eOS.apk           # Android APK dosyası
└── README.md             # Bu dosya
```

## 🔧 Geliştirme

### Android

```bash
# Gradle ile build
./gradlew assembleRelease

# APK çıktısı
app/build/outputs/apk/release/app-release.apk
```

### Web

```bash
# GitHub Pages'i aktifleştir
# Settings > Pages > Source: main branch

# Bookmarklet URL'ini güncelle
# web/index.html içindeki URL'i düzenle
```

## 📄 Lisans

Bu yazılım ticari bir üründür. Kullanım için lisans gereklidir.

## ⚠️ Yasal Uyarı

- Bu araç sadece öğretmenlerin kendi verilerini girmesini kolaylaştırmak için tasarlanmıştır
- Veriler sadece e-Okul sunucusuna gönderilir, başka hiçbir yere gitmez
- Kullanıcı sorumluluğundadır

## 🙏 Teşekkürler

- [SheetJS](https://sheetjs.com/) - Excel işleme kütüphanesi
- [Material Design](https://material.io/) - UI tasarım ilkeleri

---

**⚡ e-Okul Gelişim Düzeyi Sihirbazı v3.4**  
*Saatler süren işi dakikalara indirin!*

[🚀 Hemen Başla](docs/index.html) | [📖 Dokümantasyon](web/KULLANIM.md) | [💬 Destek](https://wa.me/905063705528)
