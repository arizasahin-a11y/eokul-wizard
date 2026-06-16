# Bugfix Requirements Document

## Introduction

Android uygulamada "e-okuldan al" sekmesindeki not girişi sayfasında, kullanıcı bir sınıf seçtikten sonra sistem sürekli listedeki ilk sınıfa geri dönüyor. Bu durum kullanıcının seçtiği sınıfı koruyamamasına ve yanlış sınıfa not girişi yapmasına neden oluyor.

Kod analizine göre sorun: `wizard.js` dosyasında, `shouldAnalyzeTable` bayrağı doğru şekilde ayarlanmadığında veya sayfa yenilendiğinde, sınıf seçimi otomatik olarak ilk sınıfa (`selectedIndex = 0`) sıfırlanıyor.

## Bug Analysis

### Current Behavior (Defect)

Kullanıcı not girişi sayfasında bir sınıf seçtiğinde sistem seçimi koruyamıyor ve listedeki ilk sınıfa geri dönüyor.

1.1 WHEN kullanıcı "e-okuldan al" sekmesinde not girişi sayfasına girip bir sınıf seçtiğinde AND `shouldAnalyzeTable` bayrağı yanlış ayarlandığında THEN sistem seçilen sınıfı koruyamıyor ve listedeki ilk sınıfa geri dönüyor
1.2 WHEN kullanıcı farklı bir sınıf seçip "Listele" butonuna tıkladığında THEN sayfa yenilendikten sonra sistem seçimi kaybediyor ve ilk sınıfa geri dönüyor
1.3 WHEN kullanıcı sınıf seçimi yaptıktan sonra sayfada başka işlemler yapmaya çalıştığında THEN sistem sürekli ilk sınıfa geri dönerek kullanıcının seçimini geçersiz kılıyor

### Expected Behavior (Correct)

Kullanıcının sınıf seçimi korunmalı ve sistem seçilen sınıfı hatırlamalıdır.

2.1 WHEN kullanıcı "e-okuldan al" sekmesinde not girişi sayfasına girip bir sınıf seçtiğinde THEN sistem SHALL seçilen sınıfı `S.eokulSelectedSinif` değişkeninde kaydetmeli ve listedeki ilk sınıfa geri dönmemeli
2.2 WHEN kullanıcı farklı bir sınıf seçip "Listele" butonuna tıkladığında THEN sayfa yenilendikten sonra sistem SHALL `S.eokulSelectedSinif` değerini kullanarak seçili sınıfı geri yüklemeli
2.3 WHEN kullanıcı sınıf seçimi yaptıktan sonra sayfada başka işlemler yapmaya çalıştığında THEN sistem SHALL seçilen sınıfı hatırlamalı ve kullanıcının seçimini geçersiz kılmamalı

### Unchanged Behavior (Regression Prevention)

Mevcut sistemin diğer tüm işlevleri korunmalıdır.

3.1 WHEN kullanıcı "e-okuldan al" sekmesine ilk kez girdiğinde THEN sistem SHALL CONTINUE TO sınıf listesini doğru şekilde yüklemeli ve ilk sınıfı varsayılan olarak seçmeli
3.2 WHEN kullanıcı not girişi sayfasında başka işlemler yaptığında THEN sistem SHALL CONTINUE TO diğer tüm işlevleri çalıştırmalı
3.3 WHEN kullanıcı farklı bir sekme veya sayfaya geçtiğinde THEN sistem SHALL CONTINUE TO normal şekilde çalışmaya devam etmeli
3.4 WHEN `shouldAnalyzeTable` bayrağı doğru ayarlandığında THEN sistem SHALL CONTINUE TO sınıf seçimini geri yükleyebilmeli


## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ClassSelectionInput
  OUTPUT: boolean
  
  // Returns true when user selects a non-first class and shouldAnalyzeTable flag is not properly handled
  RETURN X.screen = "not_girisi" 
    AND X.action = "class_selected" 
    AND X.selected_class_index > 0
    AND (X.shouldAnalyzeTable = false OR X.page_refresh = true)
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Class Selection Persistence
FOR ALL X WHERE isBugCondition(X) DO
  result ← handleClassSelection'(X)
  ASSERT result.selected_class = X.selected_class 
    AND result.reset_to_first = false
    AND result.S_eokulSelectedSinif = X.selected_class
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT handleClassSelection(X) = handleClassSelection'(X)
END FOR
```

### Key Definitions
- **F**: `handleClassSelection` - Original (unfixed) function that resets to first class when `shouldAnalyzeTable` is false
- **F'**: `handleClassSelection'` - Fixed function that preserves selected class regardless of `shouldAnalyzeTable` flag
- **C(X)**: `isBugCondition(X)` - Bug condition: user selects a non-first class and page refresh/flag issue occurs
- **P(result)**: `result.selected_class = X.selected_class AND result.reset_to_first = false AND result.S_eokulSelectedSinif = X.selected_class` - Desired behavior: selected class is preserved in both UI and state
- **¬C(X)**: All other inputs (first class selection, proper flag handling, other screens) - Should be preserved unchanged
- **shouldAnalyzeTable**: Flag indicating whether table analysis should be performed after "Listele" button click
- **S.eokulSelectedSinif**: State variable storing the selected class value

### Counterexample
Concrete example demonstrating the bug:
```
Input: X = { 
  screen: "not_girisi", 
  action: "class_selected", 
  selected_class_index: 2,
  selected_class_value: "10-A",
  shouldAnalyzeTable: false,
  page_refresh: true
}
Expected: Selected class "10-A" should be preserved in both UI and S.eokulSelectedSinif
Actual: System resets to class index 0 (first class) and S.eokulSelectedSinif = ""
```