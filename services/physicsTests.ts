
import { TestResult, TestDefinition } from './tests/types';
import { UnitContext, ScenarioContext } from './tests/context';
import { DEFAULT_CAR_CONFIG } from '../constants';

// Import Modules
import { POWERTRAIN_TESTS } from './tests/modules/unit_powertrain';
import { CHASSIS_TESTS } from './tests/modules/unit_chassis';
import { BASIC_SCENARIOS } from './tests/modules/scn_basics';
import { DYNAMIC_SCENARIOS } from './tests/modules/scn_dynamics';

const ALL_TESTS: TestDefinition[] = [
    ...POWERTRAIN_TESTS,
    ...CHASSIS_TESTS,
    ...BASIC_SCENARIOS,
    ...DYNAMIC_SCENARIOS
];

export type { TestResult, TestLogEntry } from './tests/types';

export const runTestSafe = (test: TestDefinition): TestResult => {
    const start = performance.now();
    let logs: any[] = [];
    let passed = false;
    let error = undefined;
    let errorL10n = undefined;
    let snapshot = undefined;
    
    try {
        if (test.category === 'SCENARIO') {
            const ctx = new ScenarioContext(DEFAULT_CAR_CONFIG, test.id);
            try {
                test.run(ctx);
                passed = true;
            } catch (e: any) {
                error = e.message;
            }
            logs = ctx.logs;
            snapshot = ctx.snapshot;
        } else {
            const ctx = new UnitContext(test.id);
            try {
                test.run(ctx);
                passed = true;
            } catch (e: any) {
                error = e.message;
            }
            logs = ctx.logs;
        }
    } catch (outerError: any) {
        error = "Critical Harness Error: " + outerError.message;
    }

    if (!passed && logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        if (lastLog.type === 'fail' && lastLog.l10n) {
            errorL10n = lastLog.l10n;
        }
    }

    return {
        id: test.id,
        category: test.category,
        name: test.name,
        description: test.description,
        steps: test.steps,
        passed,
        logs,
        error,
        errorL10n,
        finalStateSnapshot: snapshot,
        duration: performance.now() - start
    };
};

export const runAllTests = async (): Promise<TestResult[]> => {
    const results = [];
    for (const test of ALL_TESTS) {
        results.push(runTestSafe(test));
        await new Promise(r => setTimeout(r, 0)); // Yield to main thread
    }
    return results;
};
