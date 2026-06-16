# eokul-class-selection-reset-bug Bugfix Design

## Overview

Android uygulamada "e-okuldan al" sekmesindeki not girişi sayfasında, kullanıcı bir sınıf seçtikten sonra sistem sürekli listedeki ilk sınıfa geri dönüyor. Bu bug, `wizard.js` dosyasındaki `shouldAnalyzeTable` bayrağının yanlış işlenmesinden kaynaklanıyor. Kullanıcı bir sınıf seçtiğinde, `shouldAnalyzeTable` false olduğunda veya sayfa yenilendiğinde seçim kayboluyor ve sistem ilk sınıfa (`selectedIndex = 0`) geri dönüyor.

Bu fix, sınıf seçiminin `S.eokulSelectedSinif` değişkeninde doğru şekilde kaydedilmesini ve sayfa yenilemelerinde korunmasını sağlayacak.

## Glossary

- **Bug_Condition (C)**: Kullanıcı bir sınıf seçtiğinde `shouldAnalyzeTable` bayrağının false olması veya sayfa yenilenmesi durumu
- **Property (P)**: Seçilen sınıfın `S.eokulSelectedSinif` değişkeninde kaydedilmesi ve korunması
- **Preservation**: Mevcut "Listele" butonu işlevselliği ve diğer tüm sistem davranışlarının değişmemesi
- **handleClassSelection**: `wizard.js` dosyasındaki sınıf seçimini işleyen fonksiyon (satır 869-920)
- **shouldAnalyzeTable**: `pendingData.pending` değerine bağlı bayrak - "Listele" butonuna tıklandığında true oluyor
- **S.eokulSelectedSinif**: Seçilen sınıfın kaydedildiği state değişkeni

## Bug Details

### Bug Condition

Bug, kullanıcı "e-okuldan al" sekmesinde not girişi sayfasına girip bir sınıf seçtiğinde ortaya çıkıyor. `shouldAnalyzeTable` bayrağı false olduğunda veya sayfa yenilendiğinde, sistem seçilen sınıfı koruyamıyor ve listedeki ilk sınıfa geri dönüyor.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ClassSelectionInput
  OUTPUT: boolean
  
  RETURN input.screen = "not_girisi" 
    AND input.action = "class_selected" 
    AND input.selected_class_index > 0
    AND (input.shouldAnalyzeTable = false OR input.page_refresh = true)
END FUNCTION
```

### Examples

- **Örnek 1**: Kullanıcı "10-A" sınıfını seçiyor, "Listele" butonuna tıklıyor, sayfa yenileniyor ve sistem "10-A" yerine ilk sınıfa dönüyor
- **Örnek 2**: Kullanıcı "11-B" sınıfını seçiyor, başka bir işlem yapıyor, sistem otomatik olarak ilk sınıfa geri dönüyor
- **Örnek 3**: Kullanıcı farklı bir sınıf seçiyor, sayfada gezinmeye devam ediyor, sistem sürekli ilk sınıfa dönüyor
- **Edge Case**: Kullanıcı ilk sınıfı seçtiğinde (index 0) sorun yok - bu beklenen davranış

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- "Listele" butonuna tıklandığında tablo analizinin çalışmaya devam etmesi
- İlk sınıfın (index 0) varsayılan olarak seçili olması
- Ders dropdown'unun sınıf seçimine bağlı olarak yüklenmesi
- Diğer sekme ve sayfaların normal çalışmaya devam etmesi

**Scope:**
`shouldAnalyzeTable` bayrağının true olduğu durumlar ("Listele" butonuna tıklandığında) tamamen etkilenmemeli. Bu durumda:
- Tablo analizi çalışmaya devam etmeli
- Sınıf seçimi doğru şekilde geri yüklenmeli
- Sistemin diğer tüm işlevleri korunmalı

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Yanlış Bayrak Mantığı**: `shouldAnalyzeTable` false olduğunda sınıf seçiminin sıfırlanması
   - Kodda: `if (shouldAnalyzeTable && S.eokulSelectedSinif)` koşulu
   - Sorun: `shouldAnalyzeTable` false olduğunda `else` bloğu çalışıyor ve seçim sıfırlanıyor

2. **State Kayıt Zamanlaması**: Sınıf seçiminin yeterince erken kaydedilmemesi
   - Seçim `panelSinif.onchange` içinde kaydediliyor ama bazı durumlarda çalışmayabilir

3. **Sayfa Yenileme İşlemi**: Sayfa yenilendiğinde `shouldAnalyzeTable` değerinin kaybolması
   - `pendingData` localStorage'dan okunuyor ama bazı durumlarda temizleniyor

4. **Koşullu Sıfırlama**: `shouldAnalyzeTable` false iken her zaman sıfırlama yapılması
   - Aslında sadece yeni açıldığında veya seçim yokken sıfırlama yapılmalı

## Correctness Properties

Property 1: Bug Condition - Sınıf Seçim Koruma

_For any_ input where the bug condition holds (isBugCondition returns true), the fixed function SHALL preserve the selected class in both UI (`panelSinif.value`) and state (`S.eokulSelectedSinif`), preventing automatic reset to the first class.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Listele Butonu İşlevselliği

_For any_ input where the bug condition does NOT hold (isBugCondition returns false), the fixed function SHALL produce the same result as the original function, preserving all existing functionality including table analysis after "Listele" button click and proper handling of `shouldAnalyzeTable = true` cases.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app/src/main/assets/wizard.js`

**Function**: Sınıf dropdown yükleme kodu (satır 869-920)

**Specific Changes**:
1. **Bayrak Mantığı Düzeltme**: `shouldAnalyzeTable` false olsa bile seçili sınıfı koru
   - Mevcut: `if (shouldAnalyzeTable && S.eokulSelectedSinif)`
   - Yeni: `if (S.eokulSelectedSinif)` (bayraktan bağımsız)

2. **Sıfırlama Koşulu İyileştirme**: Sadece gerçekten gerekli olduğunda sıfırla
   - Mevcut: `else { S.eokulSelectedSinif = ''; ... panelSinif.selectedIndex = 0; }`
   - Yeni: Sadece `S.eokulSelectedSinif` boşsa ve kullanıcı seçim yapmamışsa sıfırla

3. **State Kayıt Güçlendirme**: Seçimin daha güvenilir kaydedilmesi
   - `panelSinif.onchange` içindeki kayıt işlemini güçlendir
   - Sayfa yüklendiğinde mevcut seçimi kontrol et

4. **Sayfa Yenileme Desteği**: `page_refresh` durumunda seçimi koru
   - `shouldAnalyzeTable` yerine sayfa durumuna göre karar ver

5. **Hata Toleransı Artırma**: Null/undefined durumlarını daha iyi yönet
   - `panelSinif` ve `pageSinif` kontrollerini güçlendir

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate class selection in the "e-okuldan al" tab with different `shouldAnalyzeTable` values. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Normal Sınıf Seçimi Test**: Simulate selecting "10-A" class with `shouldAnalyzeTable = false` (will fail on unfixed code)
2. **Listele Sonrası Test**: Simulate selecting "11-B", clicking "Listele", page refresh (will fail on unfixed code)
3. **Sayfa Yenileme Test**: Simulate class selection followed by page navigation (will fail on unfixed code)
4. **İlk Sınıf Test**: Simulate selecting first class (index 0) - should pass on unfixed code

**Expected Counterexamples**:
- Selected class resets to first class when `shouldAnalyzeTable = false`
- Selected class lost after page refresh
- System consistently returns to first class index

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleClassSelection_fixed(input)
  ASSERT result.selected_class = input.selected_class 
    AND result.reset_to_first = false
    AND result.S_eokulSelectedSinif = input.selected_class
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleClassSelection_original(input) = handleClassSelection_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for "Listele" button functionality and other interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Listele Butonu Preservation**: Observe that table analysis works correctly on unfixed code after "Listele" click, then verify this continues after fix
2. **İlk Sınıf Preservation**: Observe that first class selection works correctly on unfixed code, then verify this continues after fix
3. **Diğer Sekmeler Preservation**: Observe that other tabs (Excel'den Al) work correctly on unfixed code, then verify this continues after fix

### Unit Tests

- Test class selection with `shouldAnalyzeTable = true` (should preserve selection)
- Test class selection with `shouldAnalyzeTable = false` (should also preserve selection)
- Test page refresh scenario with existing selection
- Test edge cases (no classes available, single class scenario)

### Property-Based Tests

- Generate random class selections and verify preservation across page refreshes
- Generate random `shouldAnalyzeTable` values and verify selection consistency
- Test that all non-buggy inputs continue to work across many scenarios

### Integration Tests

- Test full flow: class selection → "Listele" click → page refresh → verify selection preserved
- Test switching between tabs and returning to "e-okuldan al" tab
- Test that visual feedback (loader messages) occurs correctly during class selection
