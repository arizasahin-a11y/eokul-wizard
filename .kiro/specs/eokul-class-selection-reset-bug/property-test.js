/**
 * Property-Based Test for e-okul Class Selection Reset Bug
 * 
 * This implements a simple property-based testing approach to explore the bug condition.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3
 * 
 * Property: For all inputs where isBugCondition(input) returns true,
 * the buggy function should NOT preserve the selected class.
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists.
 */

// Reuse the simulation functions from bug-condition-test.js
const { simulateBuggyClassSelection, isBugCondition } = require('./bug-condition-test.js');

// Simple property test runner
function runPropertyTest(numTests = 100) {
    console.log(`=== Property-Based Test: Bug Condition Exploration ===`);
    console.log(`Running ${numTests} random tests for bug condition...\n`);
    
    let passedTests = 0;
    let failedTests = 0;
    const counterexamples = [];
    
    for (let i = 0; i < numTests; i++) {
        // Generate random input that matches bug condition
        const input = generateBugConditionInput();
        
        // Run simulation
        const result = simulateBuggyClassSelection(input);
        
        // Check if bug manifests (should reset to first class)
        const bugManifests = result.panelSinif_selectedIndex === 0 || result.S_eokulSelectedSinif === '';
        
        if (bugManifests) {
            // Test FAILED - bug confirmed
            failedTests++;
            
            // Record counterexample
            counterexamples.push({
                testNumber: i + 1,
                input: input,
                result: result,
                issue: result.panelSinif_selectedIndex === 0 ? 'Reset to first class' : 'Selection lost from state'
            });
            
            // Limit counterexamples to avoid too much output
            if (counterexamples.length <= 5) {
                console.log(`Test ${i + 1}: ❌ FAILED (bug confirmed)`);
                console.log(`  Input: screen="${input.screen}", action="${input.action}", selected_class_index=${input.selected_class_index}, shouldAnalyzeTable=${input.shouldAnalyzeTable}, page_refresh=${input.page_refresh}`);
                console.log(`  Result: panelSinif.selectedIndex=${result.panelSinif_selectedIndex}, S.eokulSelectedSinif="${result.S_eokulSelectedSinif}"`);
            }
        } else {
            // Test PASSED - unexpected (bug might not manifest for this input)
            passedTests++;
            
            if (passedTests <= 3) {
                console.log(`Test ${i + 1}: ⚠️ PASSED (unexpected - check input)`);
                console.log(`  Input: screen="${input.screen}", action="${input.action}", selected_class_index=${input.selected_class_index}, shouldAnalyzeTable=${input.shouldAnalyzeTable}, page_refresh=${input.page_refresh}`);
                console.log(`  Result: panelSinif.selectedIndex=${result.panelSinif_selectedIndex}, S.eokulSelectedSinif="${result.S_eokulSelectedSinif}"`);
            }
        }
    }
    
    console.log(`\n=== Property Test Summary ===`);
    console.log(`Total tests run: ${numTests}`);
    console.log(`Tests where bug manifested (expected failures): ${failedTests}`);
    console.log(`Tests that passed unexpectedly: ${passedTests}`);
    console.log(`Failure rate: ${((failedTests / numTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
        console.log(`\n✅ SUCCESS: Bug confirmed with ${failedTests} counterexamples`);
        console.log(`The bug consistently manifests when:`);
        console.log(`  - User selects a non-first class (selected_class_index > 0)`);
        console.log(`  - AND shouldAnalyzeTable = false OR page_refresh = true`);
        console.log(`  - Result: System resets to first class and clears S.eokulSelectedSinif`);
    } else {
        console.log(`\n❌ WARNING: No counterexamples found. The property test might not be generating valid bug condition inputs.`);
    }
    
    return {
        totalTests: numTests,
        failedTests,
        passedTests,
        counterexamples: counterexamples.slice(0, 10) // Limit output
    };
}

// Generate random input that matches bug condition
function generateBugConditionInput() {
    // Always match bug condition
    const screen = "not_girisi";
    const action = "class_selected";
    
    // Random non-first class index (1-3)
    const selected_class_index = Math.floor(Math.random() * 3) + 1;
    
    // Random class value
    const classValues = ["10-A", "11-A", "12-A", "10-B", "11-B", "12-B"];
    const selected_class_value = classValues[Math.floor(Math.random() * classValues.length)];
    
    // Randomly choose between shouldAnalyzeTable=false OR page_refresh=true
    // Both conditions trigger the bug
    const shouldAnalyzeTable = Math.random() < 0.5 ? false : (Math.random() < 0.5);
    const page_refresh = !shouldAnalyzeTable ? true : Math.random() < 0.5;
    
    // Ensure at least one bug condition is true
    if (!shouldAnalyzeTable && !page_refresh) {
        // Force one to be true to match bug condition
        if (Math.random() < 0.5) {
            shouldAnalyzeTable = false;
        } else {
            page_refresh = true;
        }
    }
    
    return {
        screen,
        action,
        selected_class_index,
        selected_class_value,
        shouldAnalyzeTable,
        page_refresh
    };
}

// Also generate some non-bug condition inputs for comparison
function generateNonBugConditionInput() {
    const screen = "not_girisi";
    const action = "class_selected";
    
    // Either first class OR shouldAnalyzeTable=true with no page refresh
    const isFirstClass = Math.random() < 0.5;
    
    if (isFirstClass) {
        // First class - not a bug condition even if shouldAnalyzeTable=false
        return {
            screen,
            action,
            selected_class_index: 0,
            selected_class_value: "9-A",
            shouldAnalyzeTable: Math.random() < 0.5,
            page_refresh: Math.random() < 0.5
        };
    } else {
        // Non-first class but shouldAnalyzeTable=true and no page refresh
        const selected_class_index = Math.floor(Math.random() * 3) + 1;
        const classValues = ["10-A", "11-A", "12-A", "10-B", "11-B", "12-B"];
        const selected_class_value = classValues[Math.floor(Math.random() * classValues.length)];
        
        return {
            screen,
            action,
            selected_class_index,
            selected_class_value,
            shouldAnalyzeTable: true,
            page_refresh: false
        };
    }
}

// Run the property test if this file is executed directly
if (require.main === module) {
    runPropertyTest(50);
}

module.exports = {
    runPropertyTest,
    generateBugConditionInput,
    generateNonBugConditionInput
};