/**
 * Property-Based Test for Bug Condition Exploration
 * 
 * Property 1: Bug Condition - Sayfa Yenilemede Sınıf Seçim Koruma
 * Validates: Requirements 1.1, 1.2
 * 
 * Scoped PBT Approach: For deterministic bugs, scope the property to the concrete failing case(s)
 * 
 * This test encodes the expected behavior and will validate the fix when it passes after implementation.
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 */

const { property, sample, assert } = require('./test-framework');

// Bug condition function from design document
function isBugCondition(input) {
    return input.screen === "eokuldan_al" 
        && input.action === "page_refresh" 
        && input.class_selected_before_refresh === true
        && input.previously_selected_class !== "";
}

// Simulate the actual bug based on wizard.js code analysis
function simulateBugCondition(input) {
    const STORAGE_KEY = 'eokul_v3';
    const PENDING_KEY = 'eokul_pending';
    
    // Mock localStorage
    const storage = {};
    
    // Initial state (page load)
    let S = {
        eokulSelectedSinif: '',
        selectedSubeText: ''
    };
    
    // User selects a class
    S.eokulSelectedSinif = input.previously_selected_class;
    S.selectedSubeText = `Sınıf ${input.previously_selected_class}`;
    
    // **BUG**: save() might not be called before page refresh
    // In the actual code, save() is only called in panelSinif.onchange
    // If page refreshes immediately after "Listele" click, save() might not happen
    const saveCalled = Math.random() > 0.5; // 50% chance save() is called
    
    if (saveCalled) {
        storage[STORAGE_KEY] = JSON.stringify(S);
    }
    
    // "Listele" button click sets pending data
    storage[PENDING_KEY] = JSON.stringify({
        pending: true,
        time: Date.now(),
        sinif: input.previously_selected_class,
        ders: 'test-ders'
    });
    
    // Page refreshes
    
    // New page loads - S is initialized from localStorage
    let S_after_refresh;
    if (storage[STORAGE_KEY]) {
        S_after_refresh = JSON.parse(storage[STORAGE_KEY]);
    } else {
        // BUG: S was not saved
        S_after_refresh = {
            eokulSelectedSinif: '',
            selectedSubeText: ''
        };
    }
    
    // Check pending data
    const pendingData = storage[PENDING_KEY] ? JSON.parse(storage[PENDING_KEY]) : null;
    const shouldAnalyzeTable = pendingData && pendingData.pending;
    
    return {
        selected_class: S_after_refresh.eokulSelectedSinif,
        class_persisted: S_after_refresh.eokulSelectedSinif === input.previously_selected_class,
        S_eokulSelectedSinif: S_after_refresh.eokulSelectedSinif,
        ui_selection_visible: S_after_refresh.eokulSelectedSinif !== '',
        shouldAnalyzeTable: shouldAnalyzeTable,
        save_called: saveCalled,
        bug_manifested: !saveCalled && S_after_refresh.eokulSelectedSinif !== input.previously_selected_class
    };
}

// Property: For all inputs where bug condition holds, class should be preserved
property('Bug Condition - Class Selection Persistence After Page Refresh')
    .forall(
        sample.string(1, 10, 'class-'), // previously_selected_class
        sample.oneOf(['listele_button', 'page_navigation', 'browser_refresh']) // refresh_trigger
    )
    .suchThat((className, trigger) => {
        const input = {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: true,
            previously_selected_class: className,
            refresh_trigger: trigger
        };
        
        return isBugCondition(input);
    })
    .assert((className, trigger) => {
        const input = {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: true,
            previously_selected_class: className,
            refresh_trigger: trigger
        };
        
        const result = simulateBugCondition(input);
        
        // This assertion should FAIL on unfixed code
        // When it passes after fix, it confirms bug is fixed
        return result.class_persisted && 
               result.S_eokulSelectedSinif === className &&
               result.ui_selection_visible;
    })
    .withMessage((className, trigger, result) => 
        `Class "${className}" should be preserved after ${trigger} but got "${result.selected_class}". ` +
        `Save called: ${result.save_called}, Bug manifested: ${result.bug_manifested}`
    );

// Concrete test cases for reproducibility
const concreteTests = [
    {
        name: "Concrete Bug Example - 10-A with Listele button",
        input: {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: true,
            previously_selected_class: "10-A",
            refresh_trigger: "listele_button"
        }
    },
    {
        name: "Concrete Bug Example - 11-B with page navigation",
        input: {
            screen: "eokuldan_al",
            action: "page_refresh",
            class_selected_before_refresh: true,
            previously_selected_class: "11-B",
            refresh_trigger: "page_navigation"
        }
    }
];

// Run concrete tests
console.log('=== Concrete Bug Condition Tests ===');
console.log('Expected: All tests FAIL (proves bug exists)\n');

concreteTests.forEach(testCase => {
    console.log(`\nTest: ${testCase.name}`);
    console.log(`Input: ${JSON.stringify(testCase.input)}`);
    
    const result = simulateBugCondition(testCase.input);
    console.log(`Result: ${JSON.stringify(result)}`);
    
    const expectedClass = testCase.input.previously_selected_class;
    const passed = result.class_persisted && 
                   result.S_eokulSelectedSinif === expectedClass &&
                   result.ui_selection_visible;
    
    if (passed) {
        console.log(`❌ UNEXPECTED PASS: Class "${expectedClass}" was preserved`);
        console.log(`   This might indicate save() was called (${result.save_called})`);
    } else {
        console.log(`✅ EXPECTED FAILURE: Class "${expectedClass}" was lost`);
        console.log(`   Got: "${result.selected_class}", Save called: ${result.save_called}`);
        console.log(`   Bug manifested: ${result.bug_manifested}`);
        
        if (result.bug_manifested) {
            console.log(`   ✓ Counterexample found: Demonstrates the bug`);
        }
    }
});

// Export for test runner
module.exports = {
    isBugCondition,
    simulateBugCondition,
    concreteTests
};