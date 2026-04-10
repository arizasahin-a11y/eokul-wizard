# ⚡ e-Okul Gelişim Düzeyi Sihirbazı - Web Versiyonu

## 📋 Genel Bakış

Bu, Android uygulamasının web versiyonudur. Excel dosyasından öğrenci verilerini okuyarak e-Okul sistemine otomatik veri girişi yapmanızı sağlar.

## 🚀 Özellikler

- ✅ Excel dosyası (.xlsx, .xls) desteği
- ✅ Otomatik düzey hesaplama (Başlangıç, Geliştirilmeli, Yeterli, Pekiştirilmeli)
- ✅ Çoklu tema desteği (1, 1-3, 1,3,5 formatında)
- ✅ İlerleme takibi ve detaylı loglama
- ✅ Duraklat/Devam et özelliği
- ✅ Öğrenci listesi görüntüleme
- ✅ Responsive tasarım

## 📦 Kurulum

1. Bu klasörü bir web sunucusunda barındırın veya doğrudan tarayıcıda açın
2. `index.html` dosyasını çift tıklayarak açın

## 🎯 Kullanım

### 1. Excel Dosyası Hazırlama

Excel dosyanız şu formatta olmalıdır:

| A (Sıra) | B (Sınıf) | C (Öğrenci No) | D (Ad Soyad) | E (Tema 1) | F (Tema 2) | G (Tema 3) |
|----------|-----------|----------------|--------------|------------|------------|------------|
| 1        | 9-A       | 100001         | Ali Yıldız   | 85         | 90         | 78         |
| 2        | 9-A       | 100002         | Ayşe Kaya    | 65         | 70         | 55         |

**Önemli:**
- **C Sütunu (Öğrenci No):** Zorunlu
- **E Sütunu ve sonrası:** Tema puanları (0-100 arası)
- İlk satır başlık satırıdır, atlanır

### 2. Uygulama Kullanımı

1. **Excel Yükle:** "Excel Dosyası" butonuna tıklayarak dosyanızı seçin
2. **Tema Seç:** Tema numarasını girin (örn: "1" veya "1-3")
3. **Ayarlar:** 
   - ✅ Şubeyi Otomatik Atla
   - ✅ Kayıt Onayını Otomatik Onayla
4. **Başlat:** İşlemi başlatmak için "BAŞLAT" butonuna tıklayın
5. **Kontrol:** İşlem sırasında duraklatabilir veya durdurabilirsiniz

### 3. Tema Numarası Formatı

- Tek tema: `1`
- Aralık: `1-3` (1, 2, 3. temalar)
- Seçili temalar: `1,3,5` (1, 3, 5. temalar)
- Karışık: `1-3,5,7-9`

## 🎨 Düzey Hesaplama

Uygulama, öğrencilerin puanlarını karşılaştırarak otomatik düzey atar:

- **Puan ≥ %75:** Pekiştirilmeli (4)
- **Puan ≥ %50:** Yeterli (3)
- **Puan ≥ %25:** Geliştirilmeli (2)
- **Puan < %25:** Başlangıç (1)

Ayrıca %10 ihtimalle ±2, %25 ihtimalle ±1 düzey varyasyon ekler (daha doğal görünüm için).

## ⚠️ Önemli Notlar

### Web Versiyonu Sınırlamaları

Bu web versiyonu **simülasyon modunda** çalışır:

- ❌ e-Okul sayfasına doğrudan veri gönderemez (CORS politikası)
- ❌ Gerçek form doldurma yapamaz
- ✅ Excel işleme ve düzey hesaplama çalışır
- ✅ İşlem akışını test edebilirsiniz

### Gerçek Kullanım İçin

**Android uygulamasını kullanın!** Android uygulaması:

- ✅ e-Okul'a doğrudan bağlanır
- ✅ Formları otomatik doldurur
- ✅ Tam otomatik çalışır
- ✅ WebView içinde çalışır

[Android Uygulamasını İndir](../docs/index.html)

## 🛠 Teknik Detaylar

### Kullanılan Teknolojiler

- **HTML5:** Yapı
- **CSS3:** Modern, responsive tasarım
- **Vanilla JavaScript:** Mantık ve işlemler
- **SheetJS (XLSX.js):** Excel dosya işleme

### Tarayıcı Desteği

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Dosya Yapısı

```
web/
├── index.html          # Ana sayfa
├── app.js             # Uygulama mantığı
├── README.md          # Bu dosya
└── sample.xlsx        # Örnek Excel dosyası
```

## 📞 Destek

Sorularınız için:
- 📱 WhatsApp: +90 506 370 55 28
- 📧 E-posta: [Buraya e-posta ekleyin]

## 📄 Lisans

Bu yazılım ticari bir üründür. Kullanım için lisans gereklidir.

---

**⚡ e-Okul Gelişim Düzeyi Sihirbazı v3.4**  
*Saatler süren işi dakikalara indirin!*
