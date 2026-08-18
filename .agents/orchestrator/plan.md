# Plan: Frontend Toast Standardization & Error Handling Audit

## Objective
Audit and standardize 100% of toast notifications across the business domain in `frontend/src/` according to TMS guidelines:
1. Pure Vietnamese messages across all business domain features.
2. Standardized API error extraction pattern (`const apiMessage = err.response?.data?.message; toast.error(apiMessage || 'Fallback...');`).
3. Explicit protection for demo/example files (do not touch).
4. TypeScript validation (`npx tsc --noEmit`) passes cleanly with 0 errors.

## Phase 0: Survey & Codebase Inventory
- Spawn 3 parallel Explorers to comprehensively discover all `toast` occurrences in `frontend/src/`.
  - Explorer 1 focus: `src/app/**`
  - Explorer 2 focus: `src/features/**`
  - Explorer 3 focus: `src/components/**`, `src/hooks/**`, `src/lib/**`, and demo identification.
- Synthesize all findings into `PROJECT.md` Feature Inventory.

## Phase 1: Implementation
- Dispatch Worker with clear file boundaries and strict instructions:
  - Apply Rule 1 (100% Vietnamese in business domain).
  - Apply Rule 2 (API message first pattern for error toasts).
  - Apply Rule 3 & 4 (Success / Validation handling).
  - Skip demo files.
  - Run `npx tsc --noEmit` in `frontend/` to verify type safety.

## Phase 2: Review & Verification
- Spawn 2 Reviewers to independently audit every changed file and verify acceptance criteria.
- Spawn 2 Challengers to test edge cases, syntax consistency, and ensure no unintended changes or missing error handlers.
- Spawn 1 Forensic Auditor for integrity verification (zero tolerance for shortcuts or fake passes).

## Phase 3: Gate & Completion
- Collect all reports in `GATE_STATUS.md`.
- Ensure all criteria pass.
- Generate final report and notify parent/user.
