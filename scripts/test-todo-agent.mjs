#!/usr/bin/env node

/**
 * Automated Verification Test for Todo Agent
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  discoverFeedbackFolders,
  parseFeedbackFolder,
  resolveReferencedFile,
  generateExecutionPlan,
  toggleTask,
} from './todo-agent.mjs';

console.log('🧪 Starting Todo Agent automated verification tests...\n');

// Test 1: Discover Feedback Folders
console.log('Test 1: Discover feedback folders');
const folders = discoverFeedbackFolders();
assert(folders.length > 0, 'Should find at least 1 feedback folder');
console.log(`  ✅ Found ${folders.length} feedback folders:`, folders.map((f) => f.name).join(', '));

// Test 2: Parse feedback_05_10 (100% completed)
console.log('\nTest 2: Parse feedback_05_10');
const f05_10 = folders.find((f) => f.name === 'feedback_05_10');
assert(f05_10, 'feedback_05_10 folder should exist');
const parsed05 = parseFeedbackFolder(f05_10.fullPath);
assert(parsed05.hasTodo, 'Should have TODO.md');
assert(parsed05.tasks.total > 0, 'Should have tasks');
assert.strictEqual(parsed05.tasks.pending, 0, 'feedback_05_10 should have 0 pending tasks');
assert.strictEqual(parsed05.tasks.percent, 100, 'feedback_05_10 should be 100% complete');
console.log(`  ✅ feedback_05_10 parsed: ${parsed05.tasks.completed}/${parsed05.tasks.total} (100%)`);

// Test 3: Parse feedback_06_10_task_2 (pending tasks)
console.log('\nTest 3: Parse feedback_06_10_task_2');
const f06_task2 = folders.find((f) => f.name === 'feedback_06_10_task_2');
assert(f06_task2, 'feedback_06_10_task_2 should exist');
const parsed06_2 = parseFeedbackFolder(f06_task2.fullPath);
assert(parsed06_2.hasTodo, 'Should have TODO.md');
assert(parsed06_2.tasks.pending > 0, 'feedback_06_10_task_2 should have pending tasks');
assert.strictEqual(parsed06_2.images.length, 1, 'Should find screenshot_01.jpg');
console.log(`  ✅ feedback_06_10_task_2 parsed: ${parsed06_2.tasks.completed}/${parsed06_2.tasks.total} (${parsed06_2.tasks.percent}%), images: ${parsed06_2.images.length}`);

// Test 4: File Reference Resolution
console.log('\nTest 4: Resolve referenced files across submodules');
const resBackend = resolveReferencedFile('backend/src/orders/dto/append-order-to-trip.dto.ts');
assert(resBackend.exists, 'append-order-to-trip.dto.ts should exist');
console.log(`  ✅ Resolved backend DTO: ${resBackend.resolved}`);

const resFrontend = resolveReferencedFile('warehouse-append-order-modal.tsx');
assert(resFrontend.exists, 'warehouse-append-order-modal.tsx should be found via index');
assert(resFrontend.resolved.includes('frontend/src/features/warehouse/components/'), 'Should map to frontend features folder');
console.log(`  ✅ Resolved frontend component: ${resFrontend.resolved}`);

// Test 5: Execution Blueprint Generation
console.log('\nTest 5: Generate Execution Plan');
const plan = generateExecutionPlan(parsed06_2);
assert(plan.includes('BẢN KẾ HOẠCH THỰC THI'), 'Plan should have header');
assert(plan.includes('fix/feedback-06-10-task-2'), 'Plan should propose fix branch');
assert(plan.includes('/goal'), 'Plan should include /goal command');
console.log('  ✅ Execution plan generated successfully with /goal');

// Test 6: Toggle Task State in sandbox
console.log('\nTest 6: Toggle task in sandbox');
const sandboxDir = path.resolve('scratch/feedback_99_99');
fs.mkdirSync(sandboxDir, { recursive: true });
const sandboxTodo = path.join(sandboxDir, 'TODO.md');
fs.writeFileSync(sandboxTodo, '# Feedback 99/99\n## Tasks\n- [ ] Task Alpha\n- [ ] Task Beta\n', 'utf8');

// Toggle Task Alpha to done
toggleTask('feedback_99_99', 3, 'done', 'scratch');
const afterToggle = fs.readFileSync(sandboxTodo, 'utf8');
assert(afterToggle.includes('- [x] Task Alpha'), 'Task Alpha should now be [x]');
assert(afterToggle.includes('- [ ] Task Beta'), 'Task Beta should remain [ ]');

// Cleanup sandbox
fs.rmSync(sandboxDir, { recursive: true, force: true });
console.log('  ✅ Toggle task verified and sandbox cleaned up');

console.log('\n🎉 ALL 6 TODO-AGENT TESTS PASSED 100%!\n');
