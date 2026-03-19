# Brickline

Brickline is a full-stack REI lending platform with role-based access control (RBAC), built on Next.js (TypeScript), Supabase, and Tailwind CSS.

## Roles

- Borrower
- Broker
- Admin
- Lender
- Super Admin

## Security Model

- Supabase Auth for authentication
- Role assignment stored in `public.user_profiles`
- Row-level security (RLS) enforces least privilege at the database layer
- Frontend and server actions both enforce role checks
- Audit trail captured in `public.audit_logs`

## Database

`supabase/schema.sql` creates:

- `user_profiles`
- `applications`
- `application_lenders`
- `documents`
- `notes`
- `audit_logs`
- role/status/note/audit enums
- helper authz functions + triggers + storage policies

## Routes

- `/auth/login` sign in / sign up
- `/dashboard` role-aware router
- `/borrower` borrower dashboard (own applications only)
- `/broker` broker pipeline
- `/admin` admin dashboard
- `/lender` lender read-only assigned view
- `/super-admin` role management + audit view

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill env vars in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Run `supabase/schema.sql` in Supabase SQL Editor.
5. Start the app:
   ```bash
   npm run dev
   ```
