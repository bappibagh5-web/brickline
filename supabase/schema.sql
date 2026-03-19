-- Brickline RBAC + Borrower Intake schema

create extension if not exists "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('borrower', 'broker', 'admin', 'lender', 'super_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM ('draft', 'submitted', 'in_review', 'missing_items', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_type') THEN
    CREATE TYPE public.loan_type AS ENUM ('fix_flip', 'dscr', 'bridge', 'construction');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_type') THEN
    CREATE TYPE public.note_type AS ENUM ('internal', 'borrower_visible');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_entity') THEN
    CREATE TYPE public.audit_entity AS ENUM ('application', 'document', 'note', 'user_profile', 'assignment');
  END IF;
END
$$;

alter type public.application_status add value if not exists 'draft';
alter type public.application_status add value if not exists 'submitted';
alter type public.application_status add value if not exists 'in_review';
alter type public.application_status add value if not exists 'missing_items';
alter type public.application_status add value if not exists 'completed';

alter type public.loan_type add value if not exists 'fix_flip';
alter type public.loan_type add value if not exists 'dscr';
alter type public.loan_type add value if not exists 'bridge';
alter type public.loan_type add value if not exists 'construction';

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'borrower',
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists user_profiles_email_idx on public.user_profiles (lower(email));

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references auth.users(id) on delete cascade,
  broker_id uuid references auth.users(id) on delete set null,
  loan_type public.loan_type,
  status public.application_status not null default 'draft',
  progress_step integer not null default 1,
  application_data jsonb not null default '{}'::jsonb,
  borrower_locked boolean not null default false,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DO $$
DECLARE
  c record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='borrower_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.applications RENAME COLUMN user_id TO borrower_id';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='broker_id') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN broker_id uuid references auth.users(id) on delete set null';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='loan_type') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN loan_type public.loan_type';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='status') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN status public.application_status not null default ''draft''';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='applications' AND column_name='status' AND udt_name='text'
  ) THEN
    EXECUTE 'ALTER TABLE public.applications ALTER COLUMN status DROP DEFAULT';
    EXECUTE $cmd$
      ALTER TABLE public.applications
      ALTER COLUMN status TYPE public.application_status
      USING (
        CASE
          WHEN status::text in ('approved') THEN 'completed'::public.application_status
          WHEN status::text in ('declined') THEN 'missing_items'::public.application_status
          WHEN status::text in ('submitted','in_review','missing_items','completed','draft') THEN status::text::public.application_status
          ELSE 'draft'::public.application_status
        END
      )
    $cmd$;
    EXECUTE 'ALTER TABLE public.applications ALTER COLUMN status SET DEFAULT ''draft''::public.application_status';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='progress_step') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN progress_step integer not null default 1';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='application_data') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN application_data jsonb not null default ''{}''::jsonb';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='borrower_locked') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN borrower_locked boolean not null default false';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN created_by uuid references auth.users(id)';
    EXECUTE 'UPDATE public.applications SET created_by = borrower_id WHERE created_by IS NULL';
    EXECUTE 'ALTER TABLE public.applications ALTER COLUMN created_by SET NOT NULL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='updated_by') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN updated_by uuid references auth.users(id)';
    EXECUTE 'UPDATE public.applications SET updated_by = created_by WHERE updated_by IS NULL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='updated_at') THEN
    EXECUTE 'ALTER TABLE public.applications ADD COLUMN updated_at timestamptz not null default now()';
  END IF;

  -- Cleanup columns from old intake prototype if present
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='full_name') THEN
    EXECUTE 'ALTER TABLE public.applications DROP COLUMN full_name';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='email') THEN
    EXECUTE 'ALTER TABLE public.applications DROP COLUMN email';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='phone') THEN
    EXECUTE 'ALTER TABLE public.applications DROP COLUMN phone';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='property_address') THEN
    EXECUTE 'ALTER TABLE public.applications DROP COLUMN property_address';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='loan_amount') THEN
    EXECUTE 'ALTER TABLE public.applications DROP COLUMN loan_amount';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='applications' AND column_name='notes') THEN
    EXECUTE 'ALTER TABLE public.applications DROP COLUMN notes';
  END IF;
END
$$;

create index if not exists applications_borrower_id_idx on public.applications (borrower_id);
create index if not exists applications_broker_id_idx on public.applications (broker_id);

create table if not exists public.application_lenders (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  lender_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (application_id, lender_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  file_url text not null,
  document_type text not null,
  created_by uuid not null references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='uploaded_by'
  ) THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN user_id TO uploaded_by';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='file_path'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='file_url'
  ) THEN
    EXECUTE 'ALTER TABLE public.documents RENAME COLUMN file_path TO file_url';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='document_type') THEN
    EXECUTE 'ALTER TABLE public.documents ADD COLUMN document_type text not null default ''general''';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='created_by') THEN
    EXECUTE 'ALTER TABLE public.documents ADD COLUMN created_by uuid references auth.users(id)';
    EXECUTE 'UPDATE public.documents SET created_by = uploaded_by WHERE created_by IS NULL';
    EXECUTE 'ALTER TABLE public.documents ALTER COLUMN created_by SET NOT NULL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='updated_by') THEN
    EXECUTE 'ALTER TABLE public.documents ADD COLUMN updated_by uuid references auth.users(id)';
    EXECUTE 'UPDATE public.documents SET updated_by = created_by WHERE updated_by IS NULL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='updated_at') THEN
    EXECUTE 'ALTER TABLE public.documents ADD COLUMN updated_at timestamptz not null default now()';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='file_name') THEN
    EXECUTE 'ALTER TABLE public.documents DROP COLUMN file_name';
  END IF;
END
$$;

create index if not exists documents_application_id_idx on public.documents (application_id);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  note_type public.note_type not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type public.audit_entity not null,
  entity_id uuid not null,
  action text not null,
  actor_id uuid references auth.users(id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_profiles where id = auth.uid() limit 1;
$$;

create or replace function public.is_adminish()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'super_admin'), false);
$$;

create or replace function public.app_accessible(app_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.id = app_id
      and (
        a.borrower_id = auth.uid()
        or a.broker_id = auth.uid()
        or public.is_adminish()
        or exists (
          select 1 from public.application_lenders al
          where al.application_id = a.id and al.lender_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.path_app_id(path text)
returns uuid
language sql
immutable
as $$
  select case
    when split_part(path, '/', 2) ~* '^[0-9a-f-]{36}$' then split_part(path, '/', 2)::uuid
    else null
  end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.audit_entity;
  v_entity_id uuid;
  v_action text;
begin
  v_entity := case tg_table_name
    when 'applications' then 'application'::public.audit_entity
    when 'documents' then 'document'::public.audit_entity
    when 'notes' then 'note'::public.audit_entity
    when 'user_profiles' then 'user_profile'::public.audit_entity
    when 'application_lenders' then 'assignment'::public.audit_entity
  end;

  v_action := lower(tg_op);
  v_entity_id := coalesce(new.id, old.id);

  insert into public.audit_logs (entity_type, entity_id, action, actor_id, details)
  values (
    v_entity,
    v_entity_id,
    v_action,
    auth.uid(),
    case
      when tg_op = 'DELETE' then jsonb_build_object('old', to_jsonb(old))
      when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
      else jsonb_build_object('new', to_jsonb(new))
    end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists applications_touch_updated_at on public.applications;
create trigger applications_touch_updated_at
before update on public.applications
for each row execute procedure public.touch_updated_at();

drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at
before update on public.documents
for each row execute procedure public.touch_updated_at();

drop trigger if exists applications_audit_trg on public.applications;
create trigger applications_audit_trg
after insert or update or delete on public.applications
for each row execute procedure public.log_audit();

drop trigger if exists documents_audit_trg on public.documents;
create trigger documents_audit_trg
after insert or update or delete on public.documents
for each row execute procedure public.log_audit();

drop trigger if exists notes_audit_trg on public.notes;
create trigger notes_audit_trg
after insert or update or delete on public.notes
for each row execute procedure public.log_audit();

alter table public.user_profiles enable row level security;
alter table public.applications enable row level security;
alter table public.application_lenders enable row level security;
alter table public.documents enable row level security;
alter table public.notes enable row level security;
alter table public.audit_logs enable row level security;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('user_profiles','applications','application_lenders','documents','notes','audit_logs')
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END
$$;

create policy "profiles_select_self_or_admin"
on public.user_profiles for select
using (id = auth.uid() or public.is_adminish());

create policy "profiles_insert_self_or_superadmin"
on public.user_profiles for insert
with check (id = auth.uid() or public.current_user_role() = 'super_admin');

create policy "profiles_update_self_or_superadmin"
on public.user_profiles for update
using (id = auth.uid() or public.current_user_role() = 'super_admin')
with check (id = auth.uid() or public.current_user_role() = 'super_admin');

create policy "applications_select_by_role"
on public.applications for select
using (
  borrower_id = auth.uid()
  or broker_id = auth.uid()
  or public.is_adminish()
);

create policy "applications_insert_by_role"
on public.applications for insert
with check (
  public.current_user_role() in ('borrower', 'broker', 'admin', 'super_admin')
  and created_by = auth.uid()
  and progress_step between 1 and 5
  and (
    (public.current_user_role() = 'borrower' and borrower_id = auth.uid() and broker_id is null)
    or (public.current_user_role() = 'broker' and broker_id = auth.uid())
    or public.is_adminish()
  )
);

create policy "applications_update_by_role"
on public.applications for update
using (
  public.is_adminish()
  or (public.current_user_role() = 'broker' and broker_id = auth.uid())
  or (
    public.current_user_role() = 'borrower'
    and borrower_id = auth.uid()
    and status = 'draft'
    and borrower_locked = false
  )
)
with check (
  public.is_adminish()
  or (public.current_user_role() = 'broker' and broker_id = auth.uid())
  or (
    public.current_user_role() = 'borrower'
    and borrower_id = auth.uid()
    and status = 'draft'
    and borrower_locked = false
  )
);

create policy "application_lenders_select_visible"
on public.application_lenders for select
using (
  public.is_adminish()
  or lender_id = auth.uid()
  or exists (
    select 1 from public.applications a
    where a.id = application_id and (a.borrower_id = auth.uid() or a.broker_id = auth.uid())
  )
);

create policy "application_lenders_manage_admin"
on public.application_lenders for all
using (public.is_adminish())
with check (public.is_adminish());

create policy "documents_select_by_app_visibility"
on public.documents for select
using (public.app_accessible(application_id));

create policy "documents_insert_by_role"
on public.documents for insert
with check (
  uploaded_by = auth.uid()
  and created_by = auth.uid()
  and (
    (public.current_user_role() = 'borrower' and exists (
      select 1 from public.applications a where a.id = application_id and a.borrower_id = auth.uid()
    ))
    or (public.current_user_role() = 'broker' and exists (
      select 1 from public.applications a where a.id = application_id and a.broker_id = auth.uid()
    ))
    or public.is_adminish()
  )
);

create policy "documents_update_by_admin"
on public.documents for update
using (public.is_adminish())
with check (public.is_adminish());

create policy "notes_select_visibility"
on public.notes for select
using (
  case
    when public.is_adminish() then public.app_accessible(application_id)
    when public.current_user_role() in ('borrower', 'broker', 'lender') then
      note_type = 'borrower_visible' and public.app_accessible(application_id)
    else false
  end
);

create policy "notes_insert_rules"
on public.notes for insert
with check (
  created_by = auth.uid()
  and (
    (public.is_adminish() and note_type in ('internal', 'borrower_visible'))
    or (public.current_user_role() = 'broker' and note_type = 'borrower_visible')
  )
  and public.app_accessible(application_id)
);

create policy "audit_select_admin_only"
on public.audit_logs for select
using (public.is_adminish());

insert into storage.buckets (id, name, public)
values ('application-docs', 'application-docs', false)
on conflict (id) do nothing;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname in ('docs_select_policy','docs_insert_policy','docs_update_policy')
  LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END
$$;

create policy "docs_select_policy"
on storage.objects for select
to authenticated
using (
  bucket_id = 'application-docs'
  and public.app_accessible(public.path_app_id(name))
);

create policy "docs_insert_policy"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'application-docs'
  and split_part(name, '/', 1) = auth.uid()::text
  and public.app_accessible(public.path_app_id(name))
);

create policy "docs_update_policy"
on storage.objects for update
to authenticated
using (bucket_id = 'application-docs' and public.is_adminish())
with check (bucket_id = 'application-docs' and public.is_adminish());

