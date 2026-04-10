# ⚡ Hızlı Başlangıç Rehberi

## 🎯 3 Adımda Kullanıma Başlayın

### 1️⃣ Test Sayfasını Açın
```
https://arizasahin-a11y.github.io/eokul-wizard/web/test.html
```

**"🧪 Test Et"** butonuna tıklayın:
- ✅ Sağ altta ⚡ ikon görünmeli
- ✅ İkona tıklayınca panel açılmalı

### 2️⃣ Bookmarklet'i Ekleyin
```
https://arizasahin-a11y.github.io/eokul-wizard/web/
```

**"⚡ e-Okul Sihirbazı"** butonunu yer imlerine sürükleyin.

**Veya manuel olarak:**
1. Yeni yer imi oluşturun
2. İsim: `⚡ e-Okul Sihirbazı`
3. URL:
```javascript
javascript:(function(){fetch('https://arizasahin-a11y.github.io/eokul-wizard/web/wizard-standalone.js').then(r=>r.text()).then(eval).catch(()=>alert('❌ Hata!'));})();
```

### 3️⃣ e-Okul'da Kullanın

1. **e-okul.meb.gov.tr** adresine gidin
2. **Giriş yapın**
3. Yer imlerinden **"⚡ e-Okul Sihirbazı"** butonuna tıklayın
4. Sağ altta **⚡ ikon** görünecek
5. İkona tıklayınca **panel açılacak**

## ⚠️ Önemli Not

**Web versiyonu CSP kısıtlaması nedeniyle:**
- ❌ Excel işleme yapamaz
- ❌ Otomatik form doldurma yapamaz
- ✅ Sadece bilgilendirme yapar
- ✅ Android uygulamasına yönlendirir

**Gerçek kullanım için Android uygulamasını indirin:**
```
https://arizasahin-a11y.github.io/eokul-wizard/docs/
```

## 🧪 Hızlı Test

Tarayıcı konsolunda (F12) çalıştırın:

```javascript
// Script erişilebilir mi?
fetch('https://arizasahin-a11y.github.io/eokul-wizard/web/wizard-standalone.js')
  .then(r => r.text())
  .then(t => console.log('✅ Çalışıyor! Boyut:', t.length))
  .catch(e => console.error('❌ Hata:', e));
```

## 📱 Mobil Kullanım

1. Mobil tarayıcınızda yukarıdaki URL'i açın
2. Bookmarklet'i yer imlerine ekleyin
3. e-Okul'da kullanın
4. Mobil uyumlu panel açılacak

## 🎯 Beklenen Sonuç

✅ **Başarılı kurulum:**
- Test sayfasında ⚡ ikon görünür
- e-Okul'da bookmarklet çalışır
- Panel açılır ve Android uygulamasını önerir

❌ **Sorun varsa:**
- GitHub Pages aktif mi kontrol edin
- Tarayıcı konsolunda hata var mı bakın
- 5 dakika bekleyip tekrar deneyin

## 📞 Destek

Sorun devam ederse:
- GitHub Issues: https://github.com/arizasahin-a11y/eokul-wizard/issues
- WhatsApp: +90 506 370 55 28

---

**Son Güncelleme:** 2024  
**GitHub Pages:** https://arizasahin-a11y.github.io/eokul-wizard/
