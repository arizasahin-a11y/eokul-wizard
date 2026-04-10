# GitHub Pages Kurulum Rehberi

## 📌 GitHub Pages'i Aktifleştirme

### Adım 1: Repository Settings
1. GitHub'da repository'nize gidin: https://github.com/arizasahin-a11y/eokul-wizard
2. Üst menüden **Settings** sekmesine tıklayın
3. Sol menüden **Pages** seçeneğine tıklayın

### Adım 2: Source Ayarları
1. **Source** bölümünde:
   - Branch: `main` (veya `root`) seçin
   - Folder: `/ (root)` seçin
2. **Save** butonuna tıklayın

### Adım 3: Bekleyin
- GitHub Pages'in aktif olması 1-5 dakika sürebilir
- Sayfa yenilendikten sonra yeşil bir banner göreceksiniz:
  ```
  Your site is live at https://arizasahin-a11y.github.io/eokul-wizard/
  ```

## 🧪 Test Etme

### Test 1: Ana Sayfa
Tarayıcınızda açın:
```
https://arizasahin-a11y.github.io/eokul-wizard/
```

Eğer 404 hatası alırsanız:
- GitHub Pages henüz aktif olmamış olabilir
- 5 dakika bekleyin ve tekrar deneyin

### Test 2: Test Sayfası
```
https://arizasahin-a11y.github.io/eokul-wizard/web/test.html
```

Bu sayfada:
1. "🧪 Test Et" butonuna tıklayın
2. Sağ altta ⚡ ikon görünmeli
3. İkona tıklayınca panel açılmalı

### Test 3: Wizard Script
Tarayıcı konsolunda (F12) çalıştırın:
```javascript
fetch('https://arizasahin-a11y.github.io/eokul-wizard/web/wizard-inject.js')
  .then(r => r.text())
  .then(t => console.log('✅ Script yüklendi, boyut:', t.length))
  .catch(e => console.error('❌ Hata:', e));
```

## 🔧 Sorun Giderme

### 404 Hatası
**Sebep:** GitHub Pages henüz aktif değil veya yanlış branch seçilmiş

**Çözüm:**
1. Settings > Pages'e gidin
2. Branch'in `main` olduğundan emin olun
3. 5 dakika bekleyin
4. Sayfayı yenileyin

### Script Yüklenmiyor
**Sebep:** CORS hatası veya dosya yolu yanlış

**Çözüm:**
1. Tarayıcı konsolunu açın (F12)
2. Hata mesajlarını kontrol edin
3. Dosya yolunun doğru olduğundan emin olun:
   ```
   https://arizasahin-a11y.github.io/eokul-wizard/web/wizard-inject.js
   ```

### Bookmarklet Çalışmıyor
**Sebep:** URL yanlış veya GitHub Pages aktif değil

**Çözüm:**
1. Önce test sayfasını deneyin
2. GitHub Pages'in aktif olduğundan emin olun
3. Bookmarklet URL'ini kontrol edin
4. Tarayıcı konsolunda hata var mı bakın

## 📱 e-Okul'da Test Etme

### Adım 1: GitHub Pages Aktif mi?
Önce test sayfasını açın ve çalıştığından emin olun:
```
https://arizasahin-a11y.github.io/eokul-wizard/web/test.html
```

### Adım 2: Bookmarklet'i Ekleyin
1. https://arizasahin-a11y.github.io/eokul-wizard/web/ adresine gidin
2. "⚡ e-Okul Sihirbazı" butonunu yer imlerine sürükleyin

### Adım 3: e-Okul'da Deneyin
1. https://e-okul.meb.gov.tr adresine gidin
2. Giriş yapın
3. Yer imlerinden "⚡ e-Okul Sihirbazı"na tıklayın
4. Sağ altta ⚡ ikon görünmeli

## 🎯 Beklenen Sonuç

Başarılı kurulumda:
- ✅ Test sayfası açılır
- ✅ "Test Et" butonu çalışır
- ✅ ⚡ ikon görünür
- ✅ Panel açılır
- ✅ e-Okul'da da aynı şekilde çalışır

## 📞 Yardım

Sorun devam ederse:
1. GitHub Issues: https://github.com/arizasahin-a11y/eokul-wizard/issues
2. Tarayıcı konsol loglarını paylaşın
3. Hangi adımda hata aldığınızı belirtin

---

**Son Güncelleme:** 2024
**GitHub Pages URL:** https://arizasahin-a11y.github.io/eokul-wizard/
