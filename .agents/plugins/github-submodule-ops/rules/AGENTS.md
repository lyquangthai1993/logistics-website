# GitHub Submodule & PR Lifecycle Rules

- **3 Independent Repositories Mandate**: `root` (`logistics-website`), `backend/` (`logistics-website-backend`), and `frontend/` (`logistics-website-frontend`) are 3 independent Git repositories. Always create branches, commit, and push inside `backend/` and `frontend/` submodules first before updating submodule pointers in `root`.
- **Mandatory Repo Tracking on Start**: Before modifying code or branching, run:
  - `git status -sb; git -C backend status -sb; git -C frontend status -sb`
  - `git branch -vv; git -C backend branch -vv; git -C frontend branch -vv`
- **Base from `dev` Mandate**: All feature (`feat/task-<id>-<slug>`) and bugfix (`fix/task-<id>-<slug>`) branches must branch off from `dev` (`git checkout dev && git pull origin dev`), never directly from `master`.
- **Non-Interactive Git Execution**: Always set `$env:GIT_TERMINAL_PROMPT=0` when running remote git or `gh` CLI commands so terminal prompts never hang execution.
