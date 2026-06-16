# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Sınıf Seçim Koruma
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design: `isBugCondition(input)` where `input.screen = "not_girisi" AND input.action = "class_selected" AND input.selected_class_index > 0 AND (input.shouldAnalyzeTable = false OR input.page_refresh = true)`
  - The test assertions should match the Expected Behavior Properties from design: Selected class should be preserved in both UI (`panelSinif.value`) and state (`S.eokulSelectedSinif`), preventing automatic reset to first class
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Listele Butonu İşlevselliği
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - "Listele" butonuna tıklandığında tablo analizinin çalışmaya devam etmesi
    - İlk sınıfın (index 0) varsayılan olarak seçili olması
    - Ders dropdown'unun sınıf seçimine bağlı olarak yüklenmesi
    - Diğer sekme ve sayfaların normal çalışmaya devam etmesi
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for sınıf seçiminin sürekli ilk sınıfa dönmesi bug'ı

  - [x] 3.1 Implement the fix
    - **File**: `app/src/main/assets/wizard.js`
    - **Function**: Sınıf dropdown yükleme kodu (satır 869-920)
    - **Specific Changes**:
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
    - _Bug_Condition: isBugCondition(input) where input.screen = "not_girisi" AND input.action = "class_selected" AND input.selected_class_index > 0 AND (input.shouldAnalyzeTable = false OR input.page_refresh = true)_
    - _Expected_Behavior: Selected class should be preserved in both UI (panelSinif.value) and state (S.eokulSelectedSinif), preventing automatic reset to first class_
    - _Preservation: "Listele" butonuna tıklandığında tablo analizinin çalışmaya devam etmesi, İlk sınıfın (index 0) varsayılan olarak seçili olması, Ders dropdown'unun sınıf seçimine bağlı olarak yüklenmesi, Diğer sekme ve sayfaların normal çalışmaya devam etmesi_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Sınıf Seçim Koruma
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Listele Butonu İşlevselliği
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.