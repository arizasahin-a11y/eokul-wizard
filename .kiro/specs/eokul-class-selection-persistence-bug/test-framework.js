/**
 * Simple test framework for property-based testing
 */

// Sample generators
const sample = {
    string: (minLength = 1, maxLength = 10, prefix = '') => {
        const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = prefix;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    oneOf: (options) => {
        return options[Math.floor(Math.random() * options.length)];
    },
    
    boolean: () => {
        return Math.random() > 0.5;
    },
    
    number: (min = 0, max = 100) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    array: (itemGenerator, minLength = 1, maxLength = 5) => {
        const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        const result = [];
        for (let i = 0; i < length; i++) {
            if (typeof itemGenerator === 'function') {
                result.push(itemGenerator());
            } else {
                result.push(itemGenerator);
            }
        }
        return result;
    }
};

// Property builder
function property(name) {
    return new PropertyBuilder(name);
}

class PropertyBuilder {
    constructor(name) {
        this.name = name;
        this.generators = [];
        this.condition = null;
        this.assertion = null;
        this.message = null;
    }
    
    forall(...generators) {
        this.generators = generators;
        return this;
    }
    
    suchThat(condition) {
        this.condition = condition;
        return this;
    }
    
    assert(assertion) {
        this.assertion = assertion;
        return this;
    }
    
    withMessage(messageFn) {
        this.message = messageFn;
        return this;
    }
    
    run(trials = 100) {
        console.log(`\n=== Running Property: ${this.name} ===`);
        console.log(`Trials: ${trials}`);
        
        let passed = 0;
        let failed = 0;
        const failures = [];
        
        for (let i = 0; i < trials; i++) {
            // Generate values
            const values = this.generators.map(gen => {
                if (typeof gen === 'function') {
                    return gen();
                }
                return gen;
            });
            
            // Check condition
            if (this.condition && !this.condition(...values)) {
                continue; // Skip this trial
            }
            
            // Run assertion
            try {
                const result = this.assertion(...values);
                if (result) {
                    passed++;
                } else {
                    failed++;
                    if (failures.length < 5) { // Keep only first 5 failures
                        const message = this.message ? this.message(...values, { values }) : `Assertion failed for values: ${JSON.stringify(values)}`;
                        failures.push({
                            values: [...values],
                            message
                        });
                    }
                }
            } catch (error) {
                failed++;
                if (failures.length < 5) {
                    failures.push({
                        values: [...values],
                        message: `Error: ${error.message}`,
                        error
                    });
                }
            }
        }
        
        // Report results
        console.log(`Passed: ${passed}, Failed: ${failed}, Total: ${passed + failed}`);
        
        if (failed > 0) {
            console.log(`\nFailures (showing first ${failures.length}):`);
            failures.forEach((failure, idx) => {
                console.log(`\nFailure ${idx + 1}:`);
                console.log(`  Values: ${JSON.stringify(failure.values)}`);
                console.log(`  Message: ${failure.message}`);
                if (failure.error) {
                    console.log(`  Error: ${failure.error.stack}`);
                }
            });
            
            console.log(`\n❌ Property "${this.name}" FAILED`);
            console.log(`This is EXPECTED for bug condition exploration tests on unfixed code.`);
            console.log(`The failures demonstrate the bug exists.`);
        } else {
            console.log(`\n✅ Property "${this.name}" PASSED`);
            console.log(`WARNING: This property passed unexpectedly on unfixed code.`);
            console.log(`This might indicate:`);
            console.log(`1. The test doesn't accurately reproduce the bug`);
            console.log(`2. The bug condition is not correctly specified`);
            console.log(`3. The code might already have some partial fix`);
        }
        
        return {
            passed,
            failed,
            failures,
            allPassed: failed === 0
        };
    }
}

// Assertion helper
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

module.exports = {
    property,
    sample,
    assert
};