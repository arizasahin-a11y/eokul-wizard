# e-Okul Gelişim Düzeyi Sihirbazı — Android v3.3

Tampermonkey scriptinin Android WebView uyarlaması.

---

## ⚠️ İlk Kurulum: SheetJS Dosyasını İndirin

Projeyi build etmeden önce **bir kez** bu adımı uygulayın:

**PowerShell ile:**
```powershell
Invoke-WebRequest `
  "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js" `
  -OutFile "app\src\main\assets\xlsx.full.min.js"
```

**Veya tarayıcıdan:**
1. https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js adresine gidin
2. Sayfayı `app\src\main\assets\xlsx.full.min.js` olarak kaydedin

---

## Android Studio'da Açma

1. **File → Open** → bu klasörü seçin
2. Gradle sync bekleyin (ilk açılışta birkaç dakika sürebilir)
3. `Run ▶` veya `Shift+F10`

Minimum Android: **8.0 (API 26)**

---

## Proje Yapısı

```
eokul/
├── app/src/main/
│   ├── assets/
│   │   ├── wizard.js          ← Otomasyon motoru
│   │   └── xlsx.full.min.js   ← ⬅ SİZ İNDİRECEKSİNİZ
│   ├── java/com/eokul/wizard/
│   │   └── MainActivity.java  ← WebView + script enjeksiyonu
│   └── res/layout/activity_main.xml
└── AndroidManifest.xml
```

---

## Kullanım

1. Uygulamayı açın → e-okul.meb.gov.tr yüklenir
2. Kullanıcı adı/şifrenizle giriş yapın
3. **Gelişim Düzeyi** sayfasına gidin (`OOK07015.aspx`)
4. Sağ alt köşede ⚡ panel otomatik çıkar
5. Excel dosyasını seçin → Kategorileri girin → **BAŞLAT**

---

## Notlar

- Enjeksiyon yalnızca `OOK07015.aspx` sayfasında tetiklenir
- `localStorage` ile sayfa yenilemeler arası veri korunur
- Chrome DevTools ile debug: `chrome://inspect` (USB debugging açıkken)
