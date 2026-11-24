# Login-as session sequence repair

- [x] Reproduce the HTTP 500 on `POST /api/v1/auth/login-as/:userId`.
- [x] Confirm the PostgreSQL duplicate-primary-key error in Railway logs.
- [x] Add an idempotent migration that realigns all public serial sequences, including `session_id_seq` and `cron_job_execution_log_id_seq`.
- [x] Add a migration regression test and verify the backend build.
- [ ] Deploy the migration to Railway Dev and verify login-as returns HTTP 200.
