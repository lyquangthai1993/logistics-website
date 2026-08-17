# Security Rules

## NEVER Commit Sensitive Files

**CRITICAL**: The following files MUST NEVER be committed to git or included in any git operations:

- `.env` - Environment variables (contains database credentials, API keys, secrets)
- `.env.*` - All environment variant files (`.env.local`, `.env.production`, `.env.staging`, etc.)
- `*.pem`, `*.key` - Private keys and certificates
- `*secret*`, `*credential*` - Any files containing secrets or credentials

### Enforcement Rules

1. **Before any `git add` or `git commit`**: Always verify that `.gitignore` includes `.env` and sensitive file patterns.
2. **Never use `git add .` or `git add -A`** without first confirming `.gitignore` is properly configured.
3. **If a `.env` file is accidentally staged**: Run `git rm --cached .env` immediately before committing.
4. **When creating new projects**: Always create or verify `.gitignore` with sensitive file exclusions BEFORE the first commit.
5. **Environment file templates**: Use `.env.example` (with placeholder values, NO real secrets) to document required environment variables.

### .gitignore Must Always Include

```gitignore
# Environment files - NEVER commit
.env
.env.*
!.env.example

# Private keys
*.pem
*.key
```
