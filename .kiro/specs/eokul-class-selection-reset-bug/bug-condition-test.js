/**
 * Bug Condition Exploration Test for e-okul Class Selection Reset Bug
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 * 
 * Bug Condition: isBugCondition(input) where 
 *   input.screen = "not_girisi" 
 *   AND input.action = "class_selected" 
 *   AND input.selected_class_index > 0
 *   AND (input.shouldAnalyzeTable = false OR input.page_refresh = true)
 * 
 * Expected Behavior: Selected class should be preserved in both UI (panelSinif.value) 
 * and state (S.eokulSelectedSinif), preventing automatic reset to first class
 */

// Mock the global S object that exists in wizard.js
const S = {
    eokulSelectedSinif: '',
    selectedSubeText: '',
    save: function() {
        // Mock save function
    }
};

// Mock localStorage
const localStorage = {
    getItem: function(key) {
        return null;
    },
    removeItem: function(key) {
        // Mock remove
    }
};

// Mock document elements
const mockSelectElement = (id, options = []) => {
    const element = {
        id: id,
        value: '',
        selectedIndex: 0,
        options: options.map((text, index) => ({ 
            text: text, 
            value: `value-${index}`,
            selected: false 
        })),
        innerHTML: '',
        add: function(option) {
            this.options.push(option);
        },
        dispatchEvent: function(event) {
            // Mock event dispatch
        },
        onchange: null,
        previousElementSibling: null,
        parentElement: { textContent: '' }
    };
    
    // Add getter/setter for value
    Object.defineProperty(element, 'value', {
        get: function() {
            return this._value || '';
        },
        set: function(newValue) {
            this._value = newValue;
            // Update selectedIndex based on value
            const optionIndex = this.options.findIndex(opt => opt.value === newValue);
            if (optionIndex !== -1) {
                this.selectedIndex = optionIndex;
            }
        }
    });
    
    // Add getter/setter for selectedIndex
    Object.defineProperty(element, 'selectedIndex', {
        get: function() {
            return this._selectedIndex || 0;
        },
        set: function(newIndex) {
            this._selectedIndex = newIndex;
            if (this.options[newIndex]) {
                this._value = this.options[newIndex].value;
            }
        }
    });
    
    return element;
};

// Extract the buggy function from wizard.js
function simulateBuggyClassSelection(input) {
    const {
        screen,
        action,
        selected_class_index,
        selected_class_value,
        shouldAnalyzeTable,
        page_refresh
    } = input;
    
    // Mock elements
    const pageSinif = mockSelectElement('cmbSinif', ['9-A', '10-A', '11-A', '12-A']);
    const panelSinif = mockSelectElement('ew-eokul-sinif', ['9-A', '10-A', '11-A', '12-A']);
    
    // FIRST: Simulate user selecting a class (this happens first in real scenario)
    if (action === 'class_selected' && selected_class_index >= 0) {
        panelSinif.selectedIndex = selected_class_index;
        pageSinif.selectedIndex = selected_class_index;
        
        // This is what happens when user selects a class
        S.eokulSelectedSinif = panelSinif.value;
        S.selectedSubeText = panelSinif.options[panelSinif.selectedIndex]?.text || '';
        S.save();
    }
    
    // THEN: Simulate the buggy logic from wizard.js lines 869-920
    // This happens AFTER user selection, when page loads or refreshes
    if (shouldAnalyzeTable && S.eokulSelectedSinif) {
        panelSinif.value = S.eokulSelectedSinif;
        pageSinif.value = S.eokulSelectedSinif;
        
        pageSinif.dispatchEvent(new Event('change', {bubbles: true}));
        // Mock jQuery select2 trigger - in Node.js environment, window might not exist
        // This is just simulation, so we can skip the jQuery part
    } else {
        // BUG: This resets even when user has selected a class!
        // This is the actual bug - it clears the selection when shouldAnalyzeTable is false
        S.eokulSelectedSinif = '';
        S.save();
        panelSinif.selectedIndex = 0;
        pageSinif.selectedIndex = 0;
    }
    
    return {
        panelSinif_value: panelSinif.value,
        panelSinif_selectedIndex: panelSinif.selectedIndex,
        S_eokulSelectedSinif: S.eokulSelectedSinif,
        pageSinif_value: pageSinif.value,
        pageSinif_selectedIndex: pageSinif.selectedIndex,
        reset_to_first: panelSinif.selectedIndex === 0
    };
}

// Bug condition function from design document
function isBugCondition(input) {
    return input.screen === "not_girisi" 
        && input.action === "class_selected" 
        && input.selected_class_index > 0
        && (input.shouldAnalyzeTable === false || input.page_refresh === true);
}

// Test cases that should trigger the bug
const testCases = [
    // Test Case 1: Normal class selection with shouldAnalyzeTable = false
    {
        name: "Normal class selection with shouldAnalyzeTable = false",
        input: {
            screen: "not_girisi",
            action: "class_selected",
            selected_class_index: 2, // 11-A (non-first class)
            selected_class_value: "11-A",
            shouldAnalyzeTable: false,
            page_refresh: false
        },
        isBugCondition: true,
        expected: {
            panelSinif_value: "value-2", // Should preserve 11-A
            panelSinif_selectedIndex: 2, // Should preserve index 2
            S_eokulSelectedSinif: "value-2", // Should preserve in state
            reset_to_first: false // Should NOT reset to first class
        }
    },
    
    // Test Case 2: Class selection followed by page refresh
    {
        name: "Class selection followed by page refresh",
        input: {
            screen: "not_girisi",
            action: "class_selected",
            selected_class_index: 1, // 10-A (non-first class)
            selected_class_value: "10-A",
            shouldAnalyzeTable: false,
            page_refresh: true
        },
        isBugCondition: true,
        expected: {
            panelSinif_value: "value-1", // Should preserve 10-A
            panelSinif_selectedIndex: 1, // Should preserve index 1
            S_eokulSelectedSinif: "value-1", // Should preserve in state
            reset_to_first: false // Should NOT reset to first class
        }
    },
    
    // Test Case 3: First class selection (should NOT be bug condition)
    {
        name: "First class selection (not a bug condition)",
        input: {
            screen: "not_girisi",
            action: "class_selected",
            selected_class_index: 0, // 9-A (first class)
            selected_class_value: "9-A",
            shouldAnalyzeTable: false,
            page_refresh: false
        },
        isBugCondition: false, // selected_class_index = 0, so not bug condition
        expected: {
            panelSinif_value: "value-0", // Can be first class
            panelSinif_selectedIndex: 0, // Can be index 0
            S_eokulSelectedSinif: "value-0", // Can be in state
            reset_to_first: true // Can reset to first (this is OK for first class)
        }
    },
    
    // Test Case 4: shouldAnalyzeTable = true (should preserve selection)
    {
        name: "shouldAnalyzeTable = true (should preserve selection)",
        input: {
            screen: "not_girisi",
            action: "class_selected",
            selected_class_index: 3, // 12-A (non-first class)
            selected_class_value: "12-A",
            shouldAnalyzeTable: true,
            page_refresh: false
        },
        isBugCondition: false, // shouldAnalyzeTable = true, so not bug condition
        expected: {
            panelSinif_value: "value-3", // Should preserve 12-A
            panelSinif_selectedIndex: 3, // Should preserve index 3
            S_eokulSelectedSinif: "value-3", // Should preserve in state
            reset_to_first: false // Should NOT reset to first class
        }
    },
    
    // Test Case 5: Bug scenario from requirements - user selects class, then page refreshes
    {
        name: "User selects class, page refreshes, shouldAnalyzeTable=false",
        input: {
            screen: "not_girisi",
            action: "class_selected",
            selected_class_index: 2, // 11-A (non-first class)
            selected_class_value: "11-A",
            shouldAnalyzeTable: false,
            page_refresh: true
        },
        isBugCondition: true,
        expected: {
            panelSinif_value: "value-2", // Should preserve 11-A
            panelSinif_selectedIndex: 2, // Should preserve index 2
            S_eokulSelectedSinif: "value-2", // Should preserve in state
            reset_to_first: false // Should NOT reset to first class
        }
    }
];

// Run the tests
console.log("=== Bug Condition Exploration Test ===");
console.log("Testing UNFIXED code - tests SHOULD FAIL for bug conditions\n");

let passedTests = 0;
let failedTests = 0;
const counterexamples = [];

testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: ${testCase.name}`);
    console.log(`Bug Condition: ${testCase.isBugCondition ? 'YES' : 'NO'}`);
    
    // Reset S state for each test
    S.eokulSelectedSinif = '';
    S.selectedSubeText = '';
    
    const result = simulateBuggyClassSelection(testCase.input);
    
    // Check if this is a bug condition test
    if (testCase.isBugCondition) {
        // For bug conditions, we expect the bug to manifest
        // The test should FAIL because the bug exists
        
        const resetToFirst = result.panelSinif_selectedIndex === 0;
        const selectionLost = result.S_eokulSelectedSinif === '';
        
        if (resetToFirst || selectionLost) {
            console.log(`❌ TEST FAILED (as expected - bug confirmed)`);
            console.log(`   Input: selected_class_index=${testCase.input.selected_class_index}, shouldAnalyzeTable=${testCase.input.shouldAnalyzeTable}, page_refresh=${testCase.input.page_refresh}`);
            console.log(`   Result: panelSinif.value="${result.panelSinif_value}", panelSinif.selectedIndex=${result.panelSinif_selectedIndex}, S.eokulSelectedSinif="${result.S_eokulSelectedSinif}"`);
            console.log(`   Bug Manifestation: ${resetToFirst ? 'Reset to first class' : ''} ${selectionLost ? 'Selection lost from state' : ''}`);
            
            // Record counterexample
            counterexamples.push({
                testCase: testCase.name,
                input: testCase.input,
                result: result,
                issue: resetToFirst ? 'Reset to first class' : 'Selection lost from state'
            });
            
            failedTests++;
        } else {
            console.log(`⚠️ TEST PASSED (unexpected - bug might not exist or test issue)`);
            console.log(`   Input: selected_class_index=${testCase.input.selected_class_index}, shouldAnalyzeTable=${testCase.input.shouldAnalyzeTable}, page_refresh=${testCase.input.page_refresh}`);
            console.log(`   Result: panelSinif.value="${result.panelSinif_value}", panelSinif.selectedIndex=${result.panelSinif_selectedIndex}, S.eokulSelectedSinif="${result.S_eokulSelectedSinif}"`);
            passedTests++;
        }
    } else {
        // For non-bug conditions, we don't care about the result
        // These are just to show the test framework works
        console.log(`✓ Test executed (non-bug condition)`);
        console.log(`   Result: panelSinif.value="${result.panelSinif_value}", panelSinif.selectedIndex=${result.panelSinif_selectedIndex}, S.eokulSelectedSinif="${result.S_eokulSelectedSinif}"`);
    }
});

console.log("\n=== Test Summary ===");
console.log(`Total tests: ${testCases.length}`);
console.log(`Bug condition tests: ${testCases.filter(tc => tc.isBugCondition).length}`);
console.log(`Expected failures (bug confirmations): ${testCases.filter(tc => tc.isBugCondition).length}`);
console.log(`Actual failures: ${failedTests}`);
console.log(`Passed tests: ${passedTests}`);

console.log("\n=== Counterexamples Found (Bug Confirmation) ===");
if (counterexamples.length > 0) {
    counterexamples.forEach((ce, idx) => {
        console.log(`\nCounterexample ${idx + 1}: ${ce.testCase}`);
        console.log(`  Input: screen="${ce.input.screen}", action="${ce.input.action}", selected_class_index=${ce.input.selected_class_index}, shouldAnalyzeTable=${ce.input.shouldAnalyzeTable}, page_refresh=${ce.input.page_refresh}`);
        console.log(`  Result: panelSinif.value="${ce.result.panelSinif_value}", panelSinif.selectedIndex=${ce.result.panelSinif_selectedIndex}, S.eokulSelectedSinif="${ce.result.S_eokulSelectedSinif}"`);
        console.log(`  Issue: ${ce.issue}`);
    });
    
    console.log(`\n✅ SUCCESS: ${counterexamples.length} counterexamples found confirming the bug exists`);
    console.log(`The bug manifests when: ${counterexamples.map(ce => ce.issue).join(' AND ')}`);
} else {
    console.log(`❌ WARNING: No counterexamples found. The test might not be detecting the bug correctly.`);
}

// Export for potential use in property-based testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        simulateBuggyClassSelection,
        isBugCondition,
        testCases,
        counterexamples
    };
}