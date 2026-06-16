# Bugfix Requirements Document

## Introduction

Android uygulamada "e-okuldan al" sekmesinde kullanıcı bir sınıf seçtikten sonra sayfa yenilendiğinde (örneğin "Listele" butonuna tıklanınca) seçilen sınıf kayboluyor. Kullanıcı aynı sınıfı tekrar seçmek zorunda kalıyor ve bu döngü sürekli tekrarlanıyor. Bu, daha önce çözülen "sınıf seçimi ilk sınıfa dönüyor" sorununun devamı niteliğindedir.

## Bug Analysis

### Current Behavior (Defect)

Sayfa yenilendiğinde seçilen sınıfın kaybolması:

1.1 WHEN kullanıcı "e-okuldan al" sekmesinde bir sınıf seçtikten sonra sayfa yenilenirse (örneğin "Listele" butonuna tıklanırsa) THEN seçilen sınıf kaybolur ve sınıf seçimi sıfırlanır
1.2 WHEN kullanıcı not girişi sayfasına geçtikten sonra sayfa yenilenirse THEN daha önce seçilen sınıf korunmaz ve kullanıcı tekrar aynı sınıfı seçmek zorunda kalır

### Expected Behavior (Correct)

Sayfa yenilendiğinde seçilen sınıfın korunması:

2.1 WHEN kullanıcı "e-okuldan al" sekmesinde bir sınıf seçtikten sonra sayfa yenilenirse (örneğin "Listele" butonuna tıklanırsa) THEN sistem SEÇİLEN SINIFI KORUMALIDIR ve sınıf seçimi sıfırlanmamalıdır
2.2 WHEN kullanıcı not girişi sayfasına geçtikten sonra sayfa yenilenirse THEN sistem DAHA ÖNCE SEÇİLEN SINIFI KORUMALIDIR ve kullanıcının tekrar seçim yapmasına gerek kalmamalıdır

### Unchanged Behavior (Regression Prevention)

Sayfa yenilenmesi dışındaki normal işlevlerin korunması:

3.1 WHEN kullanıcı ilk kez "e-okuldan al" sekmesine giriyorsa THEN sistem SINIF LİSTESİNİ GÖRÜNTÜLEMEYE DEVAM ETMELİDİR ve kullanıcının bir sınıf seçmesine izin vermelidir
3.2 WHEN kullanıcı farklı bir sınıf seçmek istiyorsa THEN sistem YENİ SINIF SEÇİMİNE İZİN VERMEYE DEVAM ETMELİDİR ve kullanıcı istediği sınıfı seçebilmelidir
3.3 WHEN sayfa yenilenmiyorsa THEN sistem SINIF SEÇİMİNİ KORUMAYA DEVAM ETMELİDİR ve seçilen sınıf görünür durumda kalmalıdır


## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ClassSelectionInput
  OUTPUT: boolean
  
  // Returns true when page refresh occurs after class selection
  RETURN X.screen = "eokuldan_al" 
    AND X.action = "page_refresh" 
    AND X.class_selected_before_refresh = true
    AND X.previously_selected_class != ""
END FUNCTION
```

### Property Specification

```pascal
// Property: Fix Checking - Class Selection Persistence
FOR ALL X WHERE isBugCondition(X) DO
  result ← handlePageRefresh'(X)
  ASSERT result.selected_class = X.previously_selected_class 
    AND result.class_persisted = true
    AND result.S_eokulSelectedSinif = X.previously_selected_class
END FOR
```

### Preservation Goal

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT handlePageRefresh(X) = handlePageRefresh'(X)
END FOR
```

### Key Definitions
- **F**: `handlePageRefresh` - Original (unfixed) function that loses class selection on page refresh
- **F'**: `handlePageRefresh'` - Fixed function that preserves class selection on page refresh
- **C(X)**: `isBugCondition(X)` - Bug condition: page refresh occurs in "e-okuldan al" screen after class selection
- **P(result)**: `result.selected_class = X.previously_selected_class AND result.class_persisted = true AND result.S_eokulSelectedSinif = X.previously_selected_class` - Desired behavior: selected class is preserved after page refresh
- **¬C(X)**: All other inputs (no class selected before refresh, other screens, no refresh) - Should be preserved unchanged
- **S.eokulSelectedSinif**: State variable storing the selected class value
- **page_refresh**: Action triggered by "Listele" button click or other page refresh mechanisms

### Counterexample
Concrete example demonstrating the bug:
```
Input: X = { 
  screen: "eokuldan_al", 
  action: "page_refresh", 
  class_selected_before_refresh: true,
  previously_selected_class: "10-A",
  refresh_trigger: "listele_button"
}
Expected: Selected class "10-A" should be preserved after refresh in both UI and S.eokulSelectedSinif
Actual: Class selection disappears, UI shows no selection, S.eokulSelectedSinif may be empty or incorrect
```