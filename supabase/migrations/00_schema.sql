-- =====================================================================
-- PASTO BOM GESTÃO — schema completo (idempotente)
-- Ordem por tabela: CREATE TABLE -> GRANT -> ENABLE RLS -> POLICY
-- =====================================================================

-- ---------- ENUMS ----------
do $$ begin
  create type public.app_role as enum ('admin','user');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.application_status as enum ('received','reviewing','interview','approved','rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.kpi_direction as enum ('higher_better','lower_better');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.survey_kind as enum ('clima','avaliacao_time','avaliacao_lideranca','custom');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.survey_identification as enum ('anonima','anonima_setor','identificada');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.survey_question_type as enum ('scale','single_choice','multi_choice','short_text','long_text');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.evaluation_response_type as enum ('self','manager','peer','subordinate','public');
exception when duplicate_object then null; end $$;

grant usage on schema public to anon, authenticated;

-- ---------- USER ROLES ----------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
alter table public.user_roles enable row level security;

-- has_role / is_admin (SECURITY DEFINER — evitam recursão de RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin');
$$;

drop policy if exists ur_select_own on public.user_roles;
create policy ur_select_own on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists ur_admin_all on public.user_roles;
create policy ur_admin_all on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- RECRUTAMENTO
-- =====================================================================
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  role_function text,
  requirements text,
  compensation text,
  location text,
  type text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.jobs to anon;
grant select, insert, update, delete on public.jobs to authenticated;
alter table public.jobs enable row level security;
drop policy if exists jobs_public_active on public.jobs;
create policy jobs_public_active on public.jobs for select to anon, authenticated using (active = true or public.is_admin());
drop policy if exists jobs_admin_all on public.jobs;
create policy jobs_admin_all on public.jobs for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  resume_path text,
  status public.application_status not null default 'received',
  created_at timestamptz not null default now()
);
grant insert on public.applications to anon;
grant select, insert, update, delete on public.applications to authenticated;
alter table public.applications enable row level security;
drop policy if exists app_anon_insert on public.applications;
create policy app_anon_insert on public.applications for insert to anon, authenticated with check (true);
drop policy if exists app_admin_read on public.applications;
create policy app_admin_read on public.applications for select to authenticated using (public.is_admin());
drop policy if exists app_admin_update on public.applications;
create policy app_admin_update on public.applications for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists app_admin_delete on public.applications;
create policy app_admin_delete on public.applications for delete to authenticated using (public.is_admin());

create table if not exists public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author text,
  note text not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.application_notes to authenticated;
alter table public.application_notes enable row level security;
drop policy if exists notes_admin_all on public.application_notes;
create policy notes_admin_all on public.application_notes for select to authenticated using (public.is_admin());
drop policy if exists notes_admin_insert on public.application_notes;
create policy notes_admin_insert on public.application_notes for insert to authenticated with check (public.is_admin());
drop policy if exists notes_admin_delete on public.application_notes;
create policy notes_admin_delete on public.application_notes for delete to authenticated using (public.is_admin());

-- =====================================================================
-- INDICADORES (BSC/KPI) — dados NÃO públicos
-- =====================================================================
create table if not exists public.kpi_perspectives (
  id uuid primary key default gen_random_uuid(),
  name text not null, weight numeric not null default 1, ord int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.kpi_objectives (
  id uuid primary key default gen_random_uuid(),
  perspective_id uuid not null references public.kpi_perspectives(id) on delete cascade,
  name text not null, ord int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.kpi_indicators (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.kpi_objectives(id) on delete cascade,
  name text not null, unit text default 'un.', responsible text,
  direction public.kpi_direction not null default 'higher_better', ord int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.kpi_values (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references public.kpi_indicators(id) on delete cascade,
  year int not null, month int not null check (month between 1 and 12),
  target numeric, actual numeric,
  created_at timestamptz not null default now(),
  unique (indicator_id, year, month)
);
grant select, insert, update, delete on
  public.kpi_perspectives, public.kpi_objectives, public.kpi_indicators, public.kpi_values
  to authenticated;

do $$ declare t text;
begin
  foreach t in array array['kpi_perspectives','kpi_objectives','kpi_indicators','kpi_values'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "%s_auth_read" on public.%I;', t, t);
    execute format('create policy "%s_auth_read" on public.%I for select to authenticated using (true);', t, t);
    execute format('drop policy if exists "%s_admin_write" on public.%I;', t, t);
    execute format('create policy "%s_admin_write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- Lançamento do realizado por usuário comum (Meta continua exclusiva de admin)
create or replace function public.set_kpi_actual(_indicator_id uuid, _year int, _month int, _actual numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if _month < 1 or _month > 12 then raise exception 'Mês inválido'; end if;
  if not exists (select 1 from public.kpi_indicators where id = _indicator_id) then
    raise exception 'Indicador inexistente'; end if;
  insert into public.kpi_values (indicator_id, year, month, actual)
  values (_indicator_id, _year, _month, _actual)
  on conflict (indicator_id, year, month) do update set actual = excluded.actual;
end; $$;
revoke execute on function public.set_kpi_actual(uuid,int,int,numeric) from anon;
grant execute on function public.set_kpi_actual(uuid,int,int,numeric) to authenticated;

-- =====================================================================
-- PESQUISA
-- =====================================================================
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  kind public.survey_kind not null default 'custom',
  identification public.survey_identification not null default 'anonima',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  text text not null, type public.survey_question_type not null default 'scale',
  options jsonb default '[]'::jsonb, scale_min int default 1, scale_max int default 5,
  required boolean not null default true, ord int not null default 0
);
create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  sector text, created_at timestamptz not null default now()
);
create table if not exists public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  value jsonb
);
grant select on public.surveys, public.survey_questions to anon;
grant insert on public.survey_responses, public.survey_answers to anon;
grant select, insert, update, delete on
  public.surveys, public.survey_questions, public.survey_responses, public.survey_answers to authenticated;

alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers enable row level security;

drop policy if exists surveys_public_active on public.surveys;
create policy surveys_public_active on public.surveys for select to anon, authenticated using (active = true or public.is_admin());
drop policy if exists surveys_admin_all on public.surveys;
create policy surveys_admin_all on public.surveys for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists sq_public_read on public.survey_questions;
create policy sq_public_read on public.survey_questions for select to anon, authenticated
  using (exists (select 1 from public.surveys s where s.id = survey_id and (s.active or public.is_admin())));
drop policy if exists sq_admin_all on public.survey_questions;
create policy sq_admin_all on public.survey_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists sr_anon_insert on public.survey_responses;
create policy sr_anon_insert on public.survey_responses for insert to anon, authenticated with check (true);
drop policy if exists sr_admin_read on public.survey_responses;
create policy sr_admin_read on public.survey_responses for select to authenticated using (public.is_admin());
drop policy if exists sr_admin_delete on public.survey_responses;
create policy sr_admin_delete on public.survey_responses for delete to authenticated using (public.is_admin());

drop policy if exists sa_anon_insert on public.survey_answers;
create policy sa_anon_insert on public.survey_answers for insert to anon, authenticated with check (true);
drop policy if exists sa_admin_read on public.survey_answers;
create policy sa_admin_read on public.survey_answers for select to authenticated using (public.is_admin());
drop policy if exists sa_admin_delete on public.survey_answers;
create policy sa_admin_delete on public.survey_answers for delete to authenticated using (public.is_admin());

-- =====================================================================
-- AVALIAÇÃO DE DESEMPENHO
-- =====================================================================
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  title text not null, description text,
  scale_min int not null default 1, scale_max int not null default 5,
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.evaluation_categories (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  name text not null, weight numeric not null default 1, ord int not null default 0
);
create table if not exists public.evaluation_competencies (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.evaluation_categories(id) on delete cascade,
  name text not null, description text, weight numeric not null default 1, ord int not null default 0
);
create table if not exists public.evaluation_assignments (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references public.evaluations(id) on delete cascade,
  subject_name text not null, subject_email text, subject_role text,
  token text not null unique default replace(gen_random_uuid()::text,'-',''),
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.evaluation_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.evaluation_assignments(id) on delete cascade,
  evaluator_name text, evaluator_email text,
  type public.evaluation_response_type not null default 'public',
  comment text, created_at timestamptz not null default now()
);
create table if not exists public.evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.evaluation_responses(id) on delete cascade,
  competency_id uuid not null references public.evaluation_competencies(id) on delete cascade,
  score numeric not null, comment text
);
grant select on public.evaluations, public.evaluation_categories, public.evaluation_competencies, public.evaluation_assignments to anon;
grant insert on public.evaluation_responses, public.evaluation_scores to anon;
grant select, insert, update, delete on
  public.evaluations, public.evaluation_categories, public.evaluation_competencies,
  public.evaluation_assignments, public.evaluation_responses, public.evaluation_scores to authenticated;

do $$ declare t text;
begin
  foreach t in array array['evaluations','evaluation_categories','evaluation_competencies','evaluation_assignments'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "%s_public_read" on public.%I;', t, t);
    execute format('create policy "%s_public_read" on public.%I for select to anon, authenticated using (true);', t, t);
    execute format('drop policy if exists "%s_admin_write" on public.%I;', t, t);
    execute format('create policy "%s_admin_write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

alter table public.evaluation_responses enable row level security;
alter table public.evaluation_scores enable row level security;
drop policy if exists er_anon_insert on public.evaluation_responses;
create policy er_anon_insert on public.evaluation_responses for insert to anon, authenticated with check (true);
drop policy if exists er_admin_read on public.evaluation_responses;
create policy er_admin_read on public.evaluation_responses for select to authenticated using (public.is_admin());
drop policy if exists er_admin_delete on public.evaluation_responses;
create policy er_admin_delete on public.evaluation_responses for delete to authenticated using (public.is_admin());
drop policy if exists es_anon_insert on public.evaluation_scores;
create policy es_anon_insert on public.evaluation_scores for insert to anon, authenticated with check (true);
drop policy if exists es_admin_read on public.evaluation_scores;
create policy es_admin_read on public.evaluation_scores for select to authenticated using (public.is_admin());
drop policy if exists es_admin_delete on public.evaluation_scores;
create policy es_admin_delete on public.evaluation_scores for delete to authenticated using (public.is_admin());

-- =====================================================================
-- STORAGE — bucket privado (resumes)
-- =====================================================================
insert into storage.buckets (id, name, public) values ('resumes','resumes',false)
  on conflict (id) do nothing;

drop policy if exists storage_anon_upload on storage.objects;
create policy storage_anon_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'resumes');
drop policy if exists storage_admin_read on storage.objects;
create policy storage_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and public.is_admin());
drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'resumes' and public.is_admin());
drop policy if exists storage_admin_delete on storage.objects;
create policy storage_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and public.is_admin());

-- =====================================================================
-- SEED — vaga de exemplo para o portal público
-- =====================================================================
insert into public.jobs (title, description, role_function, requirements, location, type, active)
select 'Vendedor(a) — Loja Botelhos', 'Atendimento e vendas no balcão da agropecuária.',
       'Comercial', 'Experiência com atendimento; conhecimento em produtos agropecuários é diferencial.',
       'Botelhos-MG', 'CLT', true
where not exists (select 1 from public.jobs);

-- =====================================================================
-- SEED KPI (demonstração — só insere se não houver perspectivas)
-- =====================================================================
do $$
declare pid uuid; oid uuid; iid uuid;
begin
  if not exists (select 1 from public.kpi_perspectives) then
    insert into public.kpi_perspectives (name, weight, ord) values ('Financeira', 2, 0) returning id into pid;
    insert into public.kpi_objectives (perspective_id, name, ord) values (pid, 'Aumentar faturamento', 0) returning id into oid;
    insert into public.kpi_indicators (objective_id, name, unit, responsible, direction, ord)
      values (oid, 'Faturamento mensal', 'R$', 'Lucas', 'higher_better', 0) returning id into iid;
    insert into public.kpi_values (indicator_id, year, month, target, actual) values
      (iid, extract(year from now())::int, 1, 500000, 480000),
      (iid, extract(year from now())::int, 2, 500000, 520000),
      (iid, extract(year from now())::int, 3, 550000, 410000);

    insert into public.kpi_perspectives (name, weight, ord) values ('Clientes', 1, 1) returning id into pid;
    insert into public.kpi_objectives (perspective_id, name, ord) values (pid, 'Satisfação do cliente', 0) returning id into oid;
    insert into public.kpi_indicators (objective_id, name, unit, responsible, direction, ord)
      values (oid, 'NPS', 'pts', 'Natália', 'higher_better', 0) returning id into iid;
    insert into public.kpi_values (indicator_id, year, month, target, actual) values
      (iid, extract(year from now())::int, 1, 70, 68),
      (iid, extract(year from now())::int, 2, 70, 72);
  end if;
end $$;
