-- rehab_demo — isolated rehabilitation data-model demo
-- Safety: schema-only namespace; never touches portal / Life App tables.
-- Engine: PostgreSQL 15+ / PGlite

CREATE SCHEMA IF NOT EXISTS rehab_demo;

-- ═══════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE rehab_demo.person_role AS ENUM (
    'patient', 'guardian', 'household_member', 'returnee', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.household_status AS ENUM ('active', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.template_status AS ENUM ('draft', 'published', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.program_status AS ENUM ('draft', 'open', 'paused', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.program_kind AS ENUM ('personal', 'group');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.enrollment_status AS ENUM (
    'invited', 'active', 'completed', 'withdrawn', 'transferred'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.period_status AS ENUM ('planned', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.phase_status AS ENUM ('pending', 'active', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.goal_status AS ENUM (
    'not_started', 'in_progress', 'achieved', 'partial', 'deferred', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.progress_scope AS ENUM ('personal', 'group');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.task_status AS ENUM ('open', 'in_progress', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.case_status AS ENUM ('open', 'monitoring', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.team_role AS ENUM (
    'matam', 'companion', 'coordinator', 'clinician', 'observer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.access_role AS ENUM (
    'matam', 'companion', 'patient', 'guardian', 'gov', 'coordinator'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.access_scope AS ENUM (
    'program', 'program_patient', 'household', 'person'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- LAYER 1 — People / Units (households)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.persons (
  id              uuid PRIMARY KEY,
  demo_national_id text NOT NULL UNIQUE,
  full_name_he    text NOT NULL,
  birth_date      date,
  phone_demo      text,
  email_demo      text,
  notes_he        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  CONSTRAINT persons_demo_id_format CHECK (demo_national_id ~ '^DEMO-[0-9]{8}$')
);

CREATE TABLE IF NOT EXISTS rehab_demo.households (
  id              uuid PRIMARY KEY,
  household_code  text NOT NULL UNIQUE,
  display_name_he text NOT NULL,
  locality_he     text,
  status          rehab_demo.household_status NOT NULL DEFAULT 'active',
  scenario_tag    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  closed_at       timestamptz,
  deleted_at      timestamptz
);

CREATE TABLE IF NOT EXISTS rehab_demo.household_members (
  id            uuid PRIMARY KEY,
  household_id  uuid NOT NULL REFERENCES rehab_demo.households(id),
  person_id     uuid NOT NULL REFERENCES rehab_demo.persons(id),
  member_role   rehab_demo.person_role NOT NULL DEFAULT 'household_member',
  is_primary    boolean NOT NULL DEFAULT false,
  joined_at     date NOT NULL DEFAULT CURRENT_DATE,
  left_at       date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT household_members_unique UNIQUE (household_id, person_id),
  CONSTRAINT household_members_dates CHECK (left_at IS NULL OR left_at >= joined_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_household_one_primary
  ON rehab_demo.household_members (household_id)
  WHERE is_primary AND left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_household_members_person
  ON rehab_demo.household_members (person_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- LAYER 2 — Templates / Versions
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.program_templates (
  id              uuid PRIMARY KEY,
  code            text NOT NULL UNIQUE,
  name_he         text NOT NULL,
  description_he  text,
  default_kind    rehab_demo.program_kind NOT NULL DEFAULT 'personal',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE TABLE IF NOT EXISTS rehab_demo.template_versions (
  id              uuid PRIMARY KEY,
  template_id     uuid NOT NULL REFERENCES rehab_demo.program_templates(id),
  version_number  int NOT NULL,
  status          rehab_demo.template_status NOT NULL DEFAULT 'draft',
  changelog_he    text,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT template_versions_unique UNIQUE (template_id, version_number),
  CONSTRAINT template_versions_positive CHECK (version_number >= 1),
  CONSTRAINT template_versions_published_ts CHECK (
    (status = 'published' AND published_at IS NOT NULL)
    OR (status <> 'published')
  )
);

CREATE TABLE IF NOT EXISTS rehab_demo.template_phases (
  id                  uuid PRIMARY KEY,
  template_version_id uuid NOT NULL REFERENCES rehab_demo.template_versions(id),
  seq                 int NOT NULL,
  code                text NOT NULL,
  name_he             text NOT NULL,
  description_he      text,
  typical_days        int,
  CONSTRAINT template_phases_unique UNIQUE (template_version_id, seq),
  CONSTRAINT template_phases_code_unique UNIQUE (template_version_id, code),
  CONSTRAINT template_phases_seq_positive CHECK (seq >= 1)
);

CREATE TABLE IF NOT EXISTS rehab_demo.template_goals (
  id                  uuid PRIMARY KEY,
  template_version_id uuid NOT NULL REFERENCES rehab_demo.template_versions(id),
  template_phase_id   uuid REFERENCES rehab_demo.template_phases(id),
  code                text NOT NULL,
  title_he            text NOT NULL,
  description_he      text,
  is_mandatory        boolean NOT NULL DEFAULT true,
  default_weight      numeric(5,2) NOT NULL DEFAULT 1.0,
  CONSTRAINT template_goals_code_unique UNIQUE (template_version_id, code),
  CONSTRAINT template_goals_weight CHECK (default_weight > 0)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LAYER 3 — Programs / Participants / Periods / Phases
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.programs (
  id                    uuid PRIMARY KEY,
  program_code          text NOT NULL UNIQUE,
  name_he               text NOT NULL,
  kind                  rehab_demo.program_kind NOT NULL,
  status                rehab_demo.program_status NOT NULL DEFAULT 'draft',
  template_id           uuid NOT NULL REFERENCES rehab_demo.program_templates(id),
  -- Pinned when status becomes open; immutable while open (enforced by trigger)
  pinned_version_id     uuid REFERENCES rehab_demo.template_versions(id),
  household_id          uuid REFERENCES rehab_demo.households(id),
  opened_at             timestamptz,
  closed_at             timestamptz,
  scenario_tag          text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT programs_open_requires_pin CHECK (
    status <> 'open' OR pinned_version_id IS NOT NULL
  ),
  CONSTRAINT programs_dates CHECK (closed_at IS NULL OR opened_at IS NULL OR closed_at >= opened_at)
);

CREATE INDEX IF NOT EXISTS idx_programs_status ON rehab_demo.programs (status);
CREATE INDEX IF NOT EXISTS idx_programs_household ON rehab_demo.programs (household_id);

-- CENTRAL ENTITY
CREATE TABLE IF NOT EXISTS rehab_demo.program_patients (
  id              uuid PRIMARY KEY,
  program_id      uuid NOT NULL REFERENCES rehab_demo.programs(id),
  person_id       uuid NOT NULL REFERENCES rehab_demo.persons(id),
  status          rehab_demo.enrollment_status NOT NULL DEFAULT 'invited',
  enrolled_at     timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  withdrawn_at    timestamptz,
  personal_pct    numeric(5,2) NOT NULL DEFAULT 0,
  notes_he        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_patients_unique UNIQUE (program_id, person_id),
  CONSTRAINT program_patients_pct CHECK (personal_pct >= 0 AND personal_pct <= 100),
  CONSTRAINT program_patients_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status <> 'completed')
  )
);

CREATE INDEX IF NOT EXISTS idx_program_patients_person
  ON rehab_demo.program_patients (person_id);
CREATE INDEX IF NOT EXISTS idx_program_patients_status
  ON rehab_demo.program_patients (status);

CREATE TABLE IF NOT EXISTS rehab_demo.program_periods (
  id              uuid PRIMARY KEY,
  program_id      uuid NOT NULL REFERENCES rehab_demo.programs(id),
  seq             int NOT NULL,
  name_he         text NOT NULL,
  status          rehab_demo.period_status NOT NULL DEFAULT 'planned',
  starts_on       date NOT NULL,
  ends_on         date,
  group_pct       numeric(5,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_periods_unique UNIQUE (program_id, seq),
  CONSTRAINT program_periods_dates CHECK (ends_on IS NULL OR ends_on >= starts_on),
  CONSTRAINT program_periods_pct CHECK (group_pct >= 0 AND group_pct <= 100)
);

CREATE TABLE IF NOT EXISTS rehab_demo.program_phases (
  id                   uuid PRIMARY KEY,
  program_period_id    uuid NOT NULL REFERENCES rehab_demo.program_periods(id),
  template_phase_id    uuid NOT NULL REFERENCES rehab_demo.template_phases(id),
  seq                  int NOT NULL,
  status               rehab_demo.phase_status NOT NULL DEFAULT 'pending',
  starts_on            date,
  ends_on              date,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_phases_unique UNIQUE (program_period_id, seq),
  CONSTRAINT program_phases_dates CHECK (
    ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LAYER 4 — Goals / Updates  (goals attach to Program_Patient ONLY)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.goals (
  id                    uuid PRIMARY KEY,
  program_patient_id    uuid NOT NULL REFERENCES rehab_demo.program_patients(id),
  template_goal_id      uuid REFERENCES rehab_demo.template_goals(id),
  program_phase_id      uuid REFERENCES rehab_demo.program_phases(id),
  title_he              text NOT NULL,
  description_he        text,
  status                rehab_demo.goal_status NOT NULL DEFAULT 'not_started',
  progress_pct          numeric(5,2) NOT NULL DEFAULT 0,
  weight                numeric(5,2) NOT NULL DEFAULT 1.0,
  target_date           date,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT goals_pct CHECK (progress_pct >= 0 AND progress_pct <= 100),
  CONSTRAINT goals_weight CHECK (weight > 0)
);

CREATE INDEX IF NOT EXISTS idx_goals_pp ON rehab_demo.goals (program_patient_id);

CREATE TABLE IF NOT EXISTS rehab_demo.goal_updates (
  id                uuid PRIMARY KEY,
  goal_id           uuid NOT NULL REFERENCES rehab_demo.goals(id),
  author_person_id  uuid REFERENCES rehab_demo.persons(id),
  author_actor_id   uuid, -- staff actor (actors table)
  progress_pct      numeric(5,2) NOT NULL,
  status            rehab_demo.goal_status,
  note_he           text NOT NULL,
  recorded_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT goal_updates_pct CHECK (progress_pct >= 0 AND progress_pct <= 100)
);

CREATE INDEX IF NOT EXISTS idx_goal_updates_goal ON rehab_demo.goal_updates (goal_id);

CREATE TABLE IF NOT EXISTS rehab_demo.progress_snapshots (
  id                    uuid PRIMARY KEY,
  program_id            uuid NOT NULL REFERENCES rehab_demo.programs(id),
  program_patient_id    uuid REFERENCES rehab_demo.program_patients(id),
  scope                 rehab_demo.progress_scope NOT NULL,
  progress_pct          numeric(5,2) NOT NULL,
  captured_at           timestamptz NOT NULL DEFAULT now(),
  note_he               text,
  CONSTRAINT progress_snapshots_pct CHECK (progress_pct >= 0 AND progress_pct <= 100),
  CONSTRAINT progress_snapshots_scope_shape CHECK (
    (scope = 'personal' AND program_patient_id IS NOT NULL)
    OR (scope = 'group' AND program_patient_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_progress_snapshots_program
  ON rehab_demo.progress_snapshots (program_id, scope);

-- ═══════════════════════════════════════════════════════════════════════════
-- LAYER 5 — Sessions / Tasks / Cases
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.sessions (
  id              uuid PRIMARY KEY,
  program_id      uuid NOT NULL REFERENCES rehab_demo.programs(id),
  program_period_id uuid REFERENCES rehab_demo.program_periods(id),
  title_he        text NOT NULL,
  status          rehab_demo.session_status NOT NULL DEFAULT 'scheduled',
  scheduled_at    timestamptz NOT NULL,
  location_he     text,
  is_group        boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rehab_demo.session_attendance (
  id                    uuid PRIMARY KEY,
  session_id            uuid NOT NULL REFERENCES rehab_demo.sessions(id),
  program_patient_id    uuid NOT NULL REFERENCES rehab_demo.program_patients(id),
  attended              boolean,
  note_he               text,
  CONSTRAINT session_attendance_unique UNIQUE (session_id, program_patient_id)
);

CREATE TABLE IF NOT EXISTS rehab_demo.tasks (
  id                    uuid PRIMARY KEY,
  program_id            uuid NOT NULL REFERENCES rehab_demo.programs(id),
  program_patient_id    uuid REFERENCES rehab_demo.program_patients(id),
  goal_id               uuid REFERENCES rehab_demo.goals(id),
  title_he              text NOT NULL,
  status                rehab_demo.task_status NOT NULL DEFAULT 'open',
  due_on                date,
  assignee_actor_id     uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_pp ON rehab_demo.tasks (program_patient_id);

CREATE TABLE IF NOT EXISTS rehab_demo.cases (
  id                    uuid PRIMARY KEY,
  case_code             text NOT NULL UNIQUE,
  program_patient_id    uuid NOT NULL REFERENCES rehab_demo.program_patients(id),
  title_he              text NOT NULL,
  status                rehab_demo.case_status NOT NULL DEFAULT 'open',
  opened_at             timestamptz NOT NULL DEFAULT now(),
  closed_at             timestamptz,
  summary_he            text,
  CONSTRAINT cases_dates CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- LAYER 6 — Companions / Team / Access / Audit
-- Access ≠ household membership (explicit grants)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.actors (
  id              uuid PRIMARY KEY,
  actor_code      text NOT NULL UNIQUE,
  display_name_he text NOT NULL,
  email_demo      text,
  access_role     rehab_demo.access_role NOT NULL,
  agency_he       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rehab_demo.companions (
  id              uuid PRIMARY KEY,
  actor_id        uuid NOT NULL UNIQUE REFERENCES rehab_demo.actors(id),
  specialty_he    text,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rehab_demo.program_team_members (
  id              uuid PRIMARY KEY,
  program_id      uuid NOT NULL REFERENCES rehab_demo.programs(id),
  actor_id        uuid NOT NULL REFERENCES rehab_demo.actors(id),
  team_role       rehab_demo.team_role NOT NULL,
  assigned_at     timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  CONSTRAINT program_team_unique UNIQUE (program_id, actor_id, team_role)
);

CREATE TABLE IF NOT EXISTS rehab_demo.access_grants (
  id              uuid PRIMARY KEY,
  actor_id        uuid NOT NULL REFERENCES rehab_demo.actors(id),
  scope           rehab_demo.access_scope NOT NULL,
  program_id      uuid REFERENCES rehab_demo.programs(id),
  program_patient_id uuid REFERENCES rehab_demo.program_patients(id),
  household_id    uuid REFERENCES rehab_demo.households(id),
  person_id       uuid REFERENCES rehab_demo.persons(id),
  access_role     rehab_demo.access_role NOT NULL,
  can_read        boolean NOT NULL DEFAULT true,
  can_write       boolean NOT NULL DEFAULT false,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,
  revoked_at      timestamptz,
  grant_reason_he text,
  CONSTRAINT access_grants_scope_shape CHECK (
    (scope = 'program' AND program_id IS NOT NULL
      AND program_patient_id IS NULL AND household_id IS NULL AND person_id IS NULL)
    OR (scope = 'program_patient' AND program_patient_id IS NOT NULL
      AND household_id IS NULL AND person_id IS NULL)
    OR (scope = 'household' AND household_id IS NOT NULL
      AND program_id IS NULL AND program_patient_id IS NULL AND person_id IS NULL)
    OR (scope = 'person' AND person_id IS NOT NULL
      AND program_id IS NULL AND program_patient_id IS NULL AND household_id IS NULL)
  ),
  CONSTRAINT access_grants_expiry CHECK (
    expires_at IS NULL OR expires_at > granted_at
  )
);

CREATE INDEX IF NOT EXISTS idx_access_grants_actor
  ON rehab_demo.access_grants (actor_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS rehab_demo.person_actor_links (
  id          uuid PRIMARY KEY,
  person_id   uuid NOT NULL UNIQUE REFERENCES rehab_demo.persons(id),
  actor_id    uuid NOT NULL UNIQUE REFERENCES rehab_demo.actors(id),
  link_kind   text NOT NULL DEFAULT 'self',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rehab_demo.audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  actor_id        uuid REFERENCES rehab_demo.actors(id),
  action          text NOT NULL,
  entity_table    text NOT NULL,
  entity_id       uuid,
  details_he      text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_log_occurred
  ON rehab_demo.audit_log (occurred_at DESC);

-- Scenario registry (demo metadata)
CREATE TABLE IF NOT EXISTS rehab_demo.scenarios (
  id              int PRIMARY KEY,
  code            text NOT NULL UNIQUE,
  title_he        text NOT NULL,
  description_he  text NOT NULL,
  expected_he     text NOT NULL,
  layer           int NOT NULL CHECK (layer BETWEEN 1 AND 6),
  kind            text NOT NULL CHECK (kind IN ('positive', 'negative', 'permission'))
);

CREATE TABLE IF NOT EXISTS rehab_demo.scenario_results (
  scenario_id     int PRIMARY KEY REFERENCES rehab_demo.scenarios(id),
  passed          boolean NOT NULL,
  actual_he       text NOT NULL,
  checked_at      timestamptz NOT NULL DEFAULT now()
);
