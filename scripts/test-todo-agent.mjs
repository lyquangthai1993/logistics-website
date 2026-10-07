#!/usr/bin/env node

/**
 * Automated Verification Test for Todo Agent
 * Tests Discovery, Parsing, Execution Planning, Resolution Generation, and System Timeline
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  discoverFeedbackFolders,
  parseFeedbackFolder,
  resolveReferencedFile,
  generateExecutionPlan,
  generateResolutionDocument,
  syncSystemTimeline,
  cmdTimeline,
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

// Test 3: Parse feedback_07_10_task_12 (Stock isolation & Ledger)
console.log('\nTest 3: Parse feedback_07_10_task_12');
const f07_12 = folders.find((f) => f.name === 'feedback_07_10_task_12');
assert(f07_12, 'feedback_07_10_task_12 should exist');
const parsed07_12 = parseFeedbackFolder(f07_12.fullPath);
assert(parsed07_12.hasTodo, 'Should have TODO.md');
assert.strictEqual(parsed07_12.tasks.percent, 100, 'feedback_07_10_task_12 should be 100% complete');
assert(parsed07_12.images.length >= 2, 'Should find visual evidence images');
console.log(`  ✅ feedback_07_10_task_12 parsed: ${parsed07_12.tasks.completed}/${parsed07_12.tasks.total} (100%), images: ${parsed07_12.images.length}`);

// Test 4: File Reference Resolution
console.log('\nTest 4: Resolve referenced files across submodules');
const resBackend = resolveReferencedFile('backend/src/orders/operational-ledger.service.ts');
assert(resBackend.exists, 'operational-ledger.service.ts should exist');
console.log(`  ✅ Resolved backend service: ${resBackend.resolved}`);

const resFrontend = resolveReferencedFile('columns.tsx');
assert(resFrontend.exists, 'columns.tsx should be found via index');
assert(resFrontend.resolved.includes('frontend/src/features/'), 'Should map to frontend features folder');
console.log(`  ✅ Resolved frontend component: ${resFrontend.resolved}`);

// Test 5: Execution Blueprint Generation
console.log('\nTest 5: Generate Execution Plan');
const planCompleted = generateExecutionPlan(parsed07_12);
assert(planCompleted.includes('BẢN KẾ HOẠCH THỰC THI'), 'Plan should have header');
assert(planCompleted.includes('HOÀN THÀNH 100%'), 'Completed plan should indicate 100% complete');

const mockPending = {
  ...parsed07_12,
  tasks: {
    ...parsed07_12.tasks,
    pending: 1,
    byCategory: {
      ...parsed07_12.tasks.byCategory,
      backend: [{ line: 10, text: 'Fix something', completed: false, referencedFiles: [] }],
      frontend: [],
      database: [],
      testing: [],
      general: [],
    },
  },
};
const planPending = generateExecutionPlan(mockPending);
assert(planPending.includes('/goal'), 'Pending plan should include /goal command');
console.log('  ✅ Execution plan generated successfully for completed and pending states');

// Test 6: Resolution Document Generation
console.log('\nTest 6: Generate Resolution Document (Technical Certificate)');
const resolutionDoc = generateResolutionDocument(parsed07_12);
assert(resolutionDoc.includes('BIÊN BẢN NGHIỆM THU KỸ THUẬT'), 'Document should contain acceptance header');
assert(resolutionDoc.includes('Phân tích nguyên nhân gốc rễ (Root Cause Analysis)'), 'Document should contain RCA');
assert(resolutionDoc.includes('Danh Sách Tệp Tin Tác Động'), 'Document should contain impacted files table');
assert(resolutionDoc.includes('operational-ledger.service.ts'), 'Document should include resolved operational-ledger.service.ts');
assert(resolutionDoc.includes('Cơ Sở Dữ Liệu Kỹ Thuật Cho Các AI Agent Session Tiếp Theo'), 'Document should contain future agent guidance');
console.log('  ✅ Resolution document verified with 6 mandatory technical sections');

// Test 7: Toggle Task State in sandbox
console.log('\nTest 7: Toggle task in sandbox');
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

// Test 8: System Timeline Synchronization & CLI Inspection
console.log('\nTest 8: System Timeline Synchronization & CLI Inspection');
const timelinePath = syncSystemTimeline(parsed07_12);
assert(fs.existsSync(timelinePath), 'docs/SYSTEM_TIMELINE.md should exist');
const timelineContent = fs.readFileSync(timelinePath, 'utf8');
assert(timelineContent.includes('[FEEDBACK_07_10_TASK_12]'), 'Timeline should include task 12 entry');
assert(timelineContent.includes('BẢNG TỔNG HỢP MỐC PHÁT TRIỂN'), 'Timeline should include summary table');
console.log('  ✅ docs/SYSTEM_TIMELINE.md verified and synchronized');

console.log('\n🎉 ALL 8 TODO-AGENT TESTS PASSED 100%!\n');
