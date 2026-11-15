# Local Backend Asset Build Fix

Date: 2026-11-15 (Asia/Saigon)
Scope: NestJS production build assets required by the local backend runtime.
Status: Completed and verified locally.

## Backend
- [x] Ensure i18n translation files are copied to `dist/i18n` during build.
- [x] Ensure mail templates are copied to `dist/mail/mail-templates` during build.
- [x] Confirm the backend starts and responds on `/api/v1/health`.

## Testing
- [x] Backend build passes and copies 28 i18n files plus 10 mail templates.
- [x] Local backend health check returns HTTP 200.
