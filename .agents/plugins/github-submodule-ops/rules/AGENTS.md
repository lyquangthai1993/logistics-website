# GitHub Submodule & PR Lifecycle Rules

- **3 Independent Repositories Mandate**: `root` (`logistics-website`), `backend/` (`logistics-website-backend`), and `frontend/` (`logistics-website-frontend`) are 3 independent Git repositories. Always create branches, commit, and push inside `backend/` and `frontend/` submodules first before updating submodule pointers in `root`.
- **Mandatory Zero Direct Push to `dev` / `master` & Active Feature Branch Recovery on Every Session Start (`RULE-GIT-HISTORY-RESUME-01`)**:
  - **Strictly Forbidden**: NEVER arbitrarily commit or push code directly onto `dev` or `master` (`git push origin dev`, `git push origin master`, or committing while `HEAD` is on `dev`/`master`).
  - **Mandatory Session-Start Git History Trace**: At the start of **EVERY Antigravity chat session** (and before any Git operation), `/leader` and the default agent MUST run:
    - `npm run repo:status` (or `node scripts/git-task-workflow.mjs status`)
    - `npm run repo:tracking`
  - **Automatic Return to Previous Feature Branch**: If any repository (`root`, `backend/`, `frontend/`) is currently sitting on `dev` or `master`, you MUST trace back Git history (`git reflog`, `git for-each-ref --sort=-committerdate`) to identify which feature/fix branch (`feat/...`, `feature/...`, `fix/...`) was most recently worked on and pushed prior to `dev`/`master`, and immediately switch back to that primary feature branch using `npm run repo:resume` (`node scripts/git-task-workflow.mjs resume`) before editing, committing, or pushing code.
- **Base from `dev` Mandate**: When starting a brand-new task, feature (`feat/task-<id>-<slug>`) and bugfix (`fix/task-<id>-<slug>`) branches must branch off from `dev` (`git checkout dev && git pull origin dev`), never directly from `master`. After merging a PR into `dev`, always switch the working tree back to the active feature branch (`npm run repo:resume`).
- **Non-Interactive Git Execution**: Always set `$env:GIT_TERMINAL_PROMPT=0` when running remote git or `gh` CLI commands so terminal prompts never hang execution.
