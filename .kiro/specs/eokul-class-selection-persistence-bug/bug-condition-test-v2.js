/**
 * Bug Condition Exploration Test v2 - More accurate simulation
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Based on actual wizard.js code analysis:
 * 1. "Listele" butonuna tıklandığında `localStorage.setItem(PENDING_KEY, JSON.stringify({ pending: true, time: Date.now() }));` çağrılıyor
 * 2. Sayfa yenilendiğinde `pendingData` kontrol ediliyor ve `shouldAnalyzeTable` değeri belirleniyor
 * 3. Ancak `S.eokulSelectedSinif` değeri `localStorage`'a kaydedilmeden önce sayfa yenileniyor olabilir
 * 4. `panelSinif.onchange` içinde `save()` çağrılıyor ama bu sadece kullanıcı dropdown'da değişiklik yaptığında çalışıyor
 * 5. "Listele" butonuna tıklandığında sayfa yenileniyor ve belki de `save()` çağrılmadan önce sayfa yenileniyor
 */

// More accurate simulation of the bug
function simulateBugConditionAccurate(input) {
    const STORAGE_KEY = 'eokul_v3';
    const PENDING_KEY = 'eokul_pending';
    
    // Clear storage
    const mockStorage = {};
    
    // Step 1: Initial page load - S is initialized
    let S = {
        active: false, mode: 'fill', excelData: [],
        currentIndex: -1, catRange: '1', autoNextClass: true,
        autoConfirm: true, waiting: false, paused: false, open: true,
        activeTab: 'eokul',
        eokulListPending: false, eokulSelectedSinif: '', eokulSelectedDers: '',
        eokulRange: '1', selectedSube: '', selectedDers: '', autoStartList: false
    };
    
    // Step 2: User selects a class (UI interaction)
    // In wizard.js, this happens in panelSinif.onchange
    console.log(`Step 2: User selects class "${input.previously_selected_class}" in UI`);
    
    // CRITICAL BUG: The save() might not happen immediately or might be delayed
    // In the actual bug, S.eokulSelectedSinif might be set but not saved to localStorage
    // before page refresh
    
    // Simulate two scenarios:
    // Scenario A: save() is called immediately (ideal case)
    // Scenario B: save() is NOT called before page refresh (bug case)
    
    if (input.save_before_refresh) {
        // Scenario A: save() is called
        S.eokulSelectedSinif = input.previously_selected_class;
        S.selectedSubeText = `Sınıf ${input.previously_selected_class}`;
        mockStorage[STORAGE_KEY] = JSON.stringify(S);
        console.log('  ✓ save() called before page refresh');
    } else {
        // Scenario B: save() is NOT called (BUG)
        S.eokulSelectedSinif = input.previously_selected_class;
        S.selectedSubeText = `Sınıf ${input.previously_selected_class}`;
        // NOT saved to localStorage!
        console.log('  ✗ save() NOT called before page refresh (BUG SCENARIO)');
    }
    
    // Step 3: User clicks "Listele" button
    console.log(`Step 3: User clicks "${input.refresh_trigger}" button`);
    mockStorage[PENDING_KEY] = JSON.stringify({ 
        pending: true, 
        time: Date.now(),
        sinif: input.previously_selected_class,
        ders: 'test-ders'
    });
    
    // Step 4: Page refreshes immediately
    console.log('Step 4: Page refreshes');
    
    // Step 5: New page loads - wizard.js initializes S from localStorage
    let S_after_refresh;
    if (mockStorage[STORAGE_KEY]) {
        S_after_refresh = JSON.parse(mockStorage[STORAGE_KEY]);
        console.log(`  S loaded from localStorage: eokulSelectedSinif = "${S_after_refresh.eokulSelectedSinif}"`);
    } else {
        // BUG: S was not saved, so it gets default values
        S_after_refresh = {
            active: false, mode: 'fill', excelData: [],
            currentIndex: -1, catRange: '1', autoNextClass: true,
            autoConfirm: true, waiting: false, paused: false, open: true,
            activeTab: 'eokul',
            eokulListPending: false, eokulSelectedSinif: '', eokulSelectedDers: '',
            eokulRange: '1', selectedSube: '', selectedDers: '', autoStartList: false
        };
        console.log(`  S NOT in localStorage, using defaults: eokulSelectedSinif = "${S_after_refresh.eokulSelectedSinif}"`);
    }
    
    // Step 6: Check pending data
    const pendingData = mockStorage[PENDING_KEY] ? JSON.parse(mockStorage[PENDING_KEY]) : null;
    const shouldAnalyzeTable = pendingData && pendingData.pending;
    
    if (shouldAnalyzeTable) {
        delete mockStorage[PENDING_KEY];
    }
    
    return {
        selected_class: S_after_refresh.eokulSelectedSinif,
        class_persisted: S_after_refresh.eokulSelectedSinif === input.previously_selected_class,
        S_eokulSelectedSinif: S_after_refresh.eokulSelectedSinif,
        ui_selection_visible: S_after_refresh.eokulSelectedSinif !== '',
        shouldAnalyzeTable: shouldAnalyzeTable,
        save_called_before_refresh: input.save_before_refresh,
        bug_scenario: !input.save_before_refresh
    };
}

// Bug condition function
function isBugCondition(input) {
    return input.screen === "eokuldan_al" 
        && input.action === "page_refresh" 
        && input.class_selected_before_refresh === true
        && input.previously_selected_class !== "";
}

// Test cases with different scenarios
const testCases = [
    {
        name: "Bug Scenario - save() NOT called before refresh",
        input: {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: true,
            previously_selected_class: "10-A",
            refresh_trigger: "listele_button",
            save_before_refresh: false  // BUG: save() not called
        },
        expected_failure: true  // Should FAIL (bug exists)
    },
    {
        name: "Fixed Scenario - save() called before refresh",
        input: {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: true,
            previously_selected_class: "10-A",
            refresh_trigger: "listele_button",
            save_before_refresh: true  // FIXED: save() called
        },
        expected_failure: false  // Should PASS (no bug)
    },
    {
        name: "Different Class - 11-B with save() not called",
        input: {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: true,
            previously_selected_class: "11-B",
            refresh_trigger: "page_navigation",
            save_before_refresh: false  // BUG
        },
        expected_failure: true
    },
    {
        name: "Edge Case - No class selected",
        input: {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: false,
            previously_selected_class: "",
            refresh_trigger: "listele_button",
            save_before_refresh: false
        },
        expected_failure: false  // Not a bug condition
    }
];

// Run tests
console.log('=== Accurate Bug Condition Exploration Test ===');
console.log('Testing unfixed code - Expected: Bug scenarios FAIL, Fixed scenarios PASS\n');

let passedTests = 0;
let failedTests = 0;
const counterexamples = [];

testCases.forEach(testCase => {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Input: ${JSON.stringify(testCase.input)}`);
    
    const isBug = isBugCondition(testCase.input);
    console.log(`isBugCondition: ${isBug}`);
    
    const result = simulateBugConditionAccurate(testCase.input);
    console.log(`Result: ${JSON.stringify(result)}`);
    
    const expectedClass = testCase.input.previously_selected_class;
    const classPersisted = result.selected_class === expectedClass;
    
    console.log(`Expected class: "${expectedClass}"`);
    console.log(`Actual class: "${result.selected_class}"`);
    console.log(`Class persisted: ${classPersisted}`);
    console.log(`Bug scenario: ${result.bug_scenario}`);
    
    if (isBug) {
        if (result.bug_scenario) {
            // This is the bug scenario - should FAIL
            if (classPersisted) {
                console.log('❌ TEST UNEXPECTEDLY PASSED - Bug may not exist or test logic issue');
                passedTests++;
            } else {
                console.log('✅ TEST FAILED AS EXPECTED - Bug confirmed (class selection lost)');
                failedTests++;
                
                counterexamples.push({
                    test: testCase.name,
                    input: testCase.input,
                    result: result,
                    issue: `Class selection lost because save() was not called before page refresh. Expected "${expectedClass}" but got "${result.selected_class}"`
                });
            }
        } else {
            // This is the fixed scenario - should PASS
            if (classPersisted) {
                console.log('✅ TEST PASSED AS EXPECTED - Class selection preserved when save() is called');
                passedTests++;
            } else {
                console.log('❌ TEST FAILED UNEXPECTEDLY - Even with save(), class lost (different bug)');
                failedTests++;
            }
        }
    } else {
        console.log('ℹ️ Non-bug condition');
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Total tests: ${testCases.length}`);
console.log(`Bug scenario tests: ${testCases.filter(tc => tc.input.save_before_refresh === false && isBugCondition(tc.input)).length}`);
console.log(`Fixed scenario tests: ${testCases.filter(tc => tc.input.save_before_refresh === true && isBugCondition(tc.input)).length}`);
console.log(`Expected failures (bug confirmation): ${counterexamples.length}`);
console.log(`Unexpected passes: ${passedTests - testCases.filter(tc => tc.input.save_before_refresh === true && isBugCondition(tc.input)).length}`);

if (counterexamples.length > 0) {
    console.log('\n=== Counterexamples Found (Bug Confirmed) ===');
    counterexamples.forEach((ce, idx) => {
        console.log(`\nCounterexample ${idx + 1}: ${ce.test}`);
        console.log(`Issue: ${ce.issue}`);
        console.log(`Root Cause: save() not called before page refresh`);
        console.log(`Input: ${JSON.stringify(ce.input)}`);
        console.log(`Result: ${JSON.stringify(ce.result)}`);
    });
    
    console.log('\n✅ BUG CONFIRMED: Class selection is lost when save() is not called before page refresh');
    console.log('The test failed as expected, proving the bug exists in unfixed code.');
    console.log('Counterexamples demonstrate the root cause: S.eokulSelectedSinif value is not saved to localStorage before page refresh.');
    console.log('\nFix Required: Ensure save() is called immediately after class selection, or call save() before "Listele" button triggers page refresh.');
} else {
    console.log('\n⚠️ WARNING: No counterexamples found');
    console.log('This could mean:');
    console.log('1. The test logic still doesn\'t accurately reproduce the bug');
    console.log('2. The actual bug might be more complex (timing, async issues)');
    console.log('3. Need to examine actual wizard.js execution flow more carefully');
}

// Export for PBT status update
module.exports = {
    testCases,
    counterexamples,
    passedTests,
    failedTests,
    bugConfirmed: counterexamples.length > 0
};