# eokul-class-selection-persistence-bug Bugfix Design

## Overview

Android uygulamada "e-okuldan al" sekmesinde kullanıcı bir sınıf seçtikten sonra sayfa yenilendiğinde (örneğin "Listele" butonuna tıklanınca) seçilen sınıf kayboluyor. Kullanıcı aynı sınıfı tekrar seçmek zorunda kalıyor ve bu döngü sürekli tekrarlanıyor. Bu, daha önce çözülen "sınıf seçimi ilk sınıfa dönüyor" sorununun devamı niteliğindedir. Önceki fix `shouldAnalyzeTable` bayrağı sorununu çözdü, ancak sayfa yenileme durumunda sınıf seçiminin kalıcı olarak korunması sağlanamadı.

Bu fix, sınıf seçiminin sayfa yenilemelerinde kalıcı olarak korunmasını sağlayacak. `S.eokulSelectedSinif` state değişkeninin doğru şekilde `localStorage`'a kaydedilmesi ve sayfa yenilendiğinde geri yüklenmesi gerekiyor.

## Glossary

- **Bug_Condition (C)**: Sayfa yenilendiğinde (örneğin "Listele" butonuna tıklanınca) seçilen sınıfın kaybolması
- **Property (P)**: Sayfa yenilendiğinde seçilen sınıfın `S.eokulSelectedSinif` değişkeninde korunması ve UI'da görünür kalması
- **Preservation**: Mevcut "Listele" butonu işlevselliği, sınıf seçimi mekanizması ve diğer tüm sistem davranışlarının değişmemesi
- **handlePageRefresh**: Sayfa yenilendiğinde sınıf seçimini işleyen fonksiyon
- **S.eokulSelectedSinif**: Seçilen sınıfın kaydedildiği state değişkeni
- **localStorage**: Tarayıcıda kalıcı veri depolama mekanizması
- **page_refresh**: "Listele" butonuna tıklanması veya başka bir mekanizmayla sayfanın yenilenmesi

## Bug Details

### Bug Condition

Bug, kullanıcı "e-okuldan al" sekmesinde bir sınıf seçtikten sonra sayfa yenilendiğinde ortaya çıkıyor. Sayfa yenilendiğinde (örneğin "Listele" butonuna tıklanınca), sistem seçilen sınıfı koruyamıyor ve sınıf seçimi sıfırlanıyor. Kullanıcı aynı sınıfı tekrar seçmek zorunda kalıyor.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PageRefreshInput
  OUTPUT: boolean
  
  RETURN input.screen = "eokuldan_al" 
    AND input.action = "page_refresh" 
    AND input.class_selected_before_refresh = true
    AND input.previously_selected_class != ""
END FUNCTION
```

### Examples

- **Örnek 1**: Kullanıcı "10-A" sınıfını seçiyor, "Listele" butonuna tıklıyor, sayfa yenileniyor ve sistem "10-A" seçimini kaybediyor - UI'da sınıf seçimi sıfırlanıyor
- **Örnek 2**: Kullanıcı "11-B" sınıfını seçiyor, not girişi sayfasına geçiyor, sayfa yenileniyor ve daha önce seçilen sınıf korunmuyor
- **Örnek 3**: Kullanıcı farklı bir sınıf seçiyor, sayfada gezinmeye devam ediyor, her sayfa yenilemede sınıf seçimi kayboluyor
- **Edge Case**: Kullanıcı hiç sınıf seçmeden sayfayı yeniliyorsa - bu beklenen davranış (zaten seçim yok)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- "Listele" butonuna tıklandığında tablo analizinin çalışmaya devam etmesi
- Kullanıcının farklı bir sınıf seçebilme yeteneğinin korunması
- İlk sınıfın (index 0) varsayılan olarak seçili olması (hiç seçim yoksa)
- Ders dropdown'unun sınıf seçimine bağlı olarak yüklenmesi
- Diğer sekme ve sayfaların normal çalışmaya devam etmesi

**Scope:**
Sayfa yenilenmesi dışındaki tüm durumlar tamamen etkilenmemeli. Bu durumlarda:
- Sınıf seçimi normal şekilde çalışmaya devam etmeli
- Kullanıcı istediği sınıfı seçebilmeli
- Sistemin diğer tüm işlevleri korunmalı

## Hypothesized Root Cause

Based on the bug description and previous fix analysis, the most likely issues are:

1. **State Kayıt Zamanlaması**: `S.eokulSelectedSinif` değerinin sayfa yenilenmeden önce yeterince erken kaydedilmemesi
   - Sayfa yenilendiğinde `localStorage`'dan okunan değer doğru olmayabilir
   - `save()` fonksiyonu çağrılmadan önce sayfa yenileniyor olabilir

2. **localStorage Senkronizasyonu**: `S` nesnesi ile `localStorage` arasında senkronizasyon sorunu
   - `S` nesnesi başlangıçta `localStorage`'dan okunuyor ama güncellemeler hemen kaydedilmeyebilir
   - Sayfa yenilendiğinde `S` yeniden başlatılıyor ama `localStorage`'daki değer doğru şekilde yüklenmiyor

3. **Sayfa Yenileme Sırası**: Sayfa yenilendiğinde DOM elementlerinin hazır olmadan önce sınıf seçiminin geri yüklenmeye çalışılması
   - `panelSinif` ve `pageSinif` elementleri henüz yüklenmeden seçim geri yüklenmeye çalışılıyor
   - Zamanlama sorunları (setTimeout vs DOM ready)

4. **Çoklu State Değişkenleri**: Sadece `S.eokulSelectedSinif` değil, ilgili diğer state değişkenlerinin de korunmaması
   - `S.selectedSubeText` gibi ilgili değerler de kaydedilip geri yüklenmeli
   - UI state'i (dropdown değeri) ile backend state'i (`S` nesnesi) senkronize değil

5. **Event Listener Kaybı**: Sayfa yenilendiğinde event listener'ların yeniden bağlanmaması
   - `panelSinif.onchange` handler'ı sayfa yenilendiğinde kayboluyor olabilir

## Correctness Properties

Property 1: Bug Condition - Sayfa Yenilemede Sınıf Seçim Koruma

_For any_ input where the bug condition holds (isBugCondition returns true), the fixed function SHALL preserve the selected class in both UI (`panelSinif.value`) and state (`S.eokulSelectedSinif`) after page refresh, preventing loss of class selection when the page is refreshed (e.g., after clicking "Listele" button).

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Normal Sınıf Seçim İşlevselliği

_For any_ input where the bug condition does NOT hold (isBugCondition returns false), the fixed function SHALL produce the same result as the original function, preserving all existing functionality including class selection without page refresh, "Listele" button functionality, and proper handling of all non-refresh scenarios.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app/src/main/assets/wizard.js`

**Function**: Sınıf dropdown yükleme kodu (satır ~869-920) ve state yönetimi

**Specific Changes**:
1. **State Kayıt Güçlendirme**: `S.eokulSelectedSinif` değerinin daha sık ve güvenilir kaydedilmesi
   - `panelSinif.onchange` içindeki kayıt işlemini güçlendir
   - `save()` fonksiyonunu daha sık çağır (debouncing ile)
   - Sayfa yenilenmeden hemen önce state'i kaydet

2. **localStorage Senkronizasyonu**: `S` nesnesi ile `localStorage` arasında daha iyi senkronizasyon
   - `S` başlatılırken `localStorage` kontrolünü iyileştir
   - Sayfa yenilendiğinde `S.eokulSelectedSinif` değerinin doğru şekilde geri yüklenmesini sağla

3. **DOM Ready Kontrolü**: Sayfa yenilendiğinde DOM elementlerinin hazır olmasını bekle
   - `DOMContentLoaded` veya `load` event'lerini kullan
   - `panelSinif` ve `pageSinif` elementleri hazır olmadan seçim geri yüklemeye çalışma

4. **Çoklu State Koruma**: İlgili tüm state değişkenlerini koru
   - `S.selectedSubeText` değerini de kaydet ve geri yükle
   - UI state'i ile backend state'i senkronize et

5. **Event Listener Yeniden Bağlama**: Sayfa yenilendiğinde event listener'ları otomatik yeniden bağla
   - `panelSinif.onchange` handler'ını sayfa yüklendiğinde yeniden bağla
   - Event delegation kullanarak daha güvenilir bir yaklaşım

6. **Sayfa Yenileme Tespiti**: Sayfanın yenilendiğini tespit et ve buna göre davran
   - `performance.navigation` veya `sessionStorage` kullanarak sayfa yenileme durumunu takip et
   - Yenileme durumunda önceki seçimi koru

7. **Hata Toleransı Artırma**: Null/undefined durumlarını daha iyi yönet
   - `localStorage` okuma/yazma hatalarını handle et
   - `S` nesnesi boş veya tanımsız olduğunda fallback mekanizmaları

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate class selection followed by page refresh in the "e-okuldan al" tab. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Listele Butonu Test**: Simulate selecting "10-A" class, clicking "Listele" button, page refresh (will fail on unfixed code)
2. **Sayfa Navigasyon Test**: Simulate selecting "11-B", navigating to grade entry page, page refresh (will fail on unfixed code)
3. **Multiple Refresh Test**: Simulate class selection followed by multiple page refreshes (will fail on unfixed code)
4. **No Selection Test**: Simulate page refresh without prior class selection - should pass on unfixed code

**Expected Counterexamples**:
- Selected class lost after page refresh (UI shows no selection)
- `S.eokulSelectedSinif` value empty or incorrect after refresh
- User forced to re-select the same class repeatedly
- System cannot maintain class selection across page refreshes

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handlePageRefresh_fixed(input)
  ASSERT result.selected_class = input.previously_selected_class 
    AND result.class_persisted = true
    AND result.S_eokulSelectedSinif = input.previously_selected_class
    AND result.ui_selection_visible = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handlePageRefresh_original(input) = handlePageRefresh_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for normal class selection without page refresh, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Normal Sınıf Seçimi Preservation**: Observe that class selection works correctly on unfixed code without page refresh, then verify this continues after fix
2. **Listele Butonu Preservation**: Observe that "Listele" button functionality works correctly on unfixed code, then verify this continues after fix
3. **Diğer Sekmeler Preservation**: Observe that other tabs (Excel'den Al) work correctly on unfixed code, then verify this continues after fix
4. **İlk Sınıf Preservation**: Observe that first class selection works correctly on unfixed code, then verify this continues after fix

### Unit Tests

- Test class selection preservation after "Listele" button click and page refresh
- Test class selection preservation after navigation to grade entry page and back
- Test multiple page refreshes with same class selection
- Test edge cases (no classes available, localStorage errors, DOM not ready)
- Test that `save()` function is called at appropriate times

### Property-Based Tests

- Generate random class selections and verify preservation across multiple page refreshes
- Generate random page navigation sequences and verify class selection consistency
- Test `localStorage` read/write operations under various conditions
- Test that all non-buggy inputs continue to work across many scenarios

### Integration Tests

- Test full flow: class selection → "Listele" click → page refresh → verify selection preserved → navigate to grade entry → verify selection still preserved
- Test switching between tabs and returning to "e-okuldan al" tab with preserved selection
- Test that visual feedback and loader messages work correctly during page refreshes
- Test Android WebView integration with preserved state across app restarts