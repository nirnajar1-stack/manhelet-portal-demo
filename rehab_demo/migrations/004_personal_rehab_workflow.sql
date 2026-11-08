-- Personal rehab goal/stage workflow (extends rehab_demo; does not replace Program_Patient spine).
-- Distinguishes bank templates from personal goal/stage instances.
-- Activity links (tasks/visits) attach ONLY to personal stages.

-- ═══════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE rehab_demo.rehab_domain AS ENUM (
    'employment', 'education', 'daily_function', 'emotional_support',
    'health', 'social', 'housing', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.goal_bank_status AS ENUM ('draft', 'active', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.stage_execution_mode AS ENUM ('sequential', 'parallel');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.personal_goal_mgmt_status AS ENUM (
    'active', 'paused', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.personal_goal_outcome AS ENUM (
    'achieved', 'partial', 'not_achieved', 'cancelled', 'not_relevant'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.personal_stage_status AS ENUM (
    'not_started', 'in_progress', 'paused', 'completed', 'skipped', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.observation_kind AS ENUM (
    'progress', 'blocker', 'condition_change', 'recommendation',
    'action_done', 'decision', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.observation_visibility AS ENUM (
    'internal', 'shared', 'external_allowed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.activity_affiliation AS ENUM ('routine', 'rehab');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.rehab_link_role AS ENUM ('primary', 'secondary');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE rehab_demo.visit_status AS ENUM (
    'planned', 'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- BANK — goal templates + versioned stage templates
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_goal_templates (
  id                uuid PRIMARY KEY,
  code              text NOT NULL UNIQUE,
  name_he           text NOT NULL,
  domain            rehab_demo.rehab_domain NOT NULL DEFAULT 'other',
  description_he    text,
  guidelines_he     text,
  execution_mode    rehab_demo.stage_execution_mode NOT NULL DEFAULT 'sequential',
  status            rehab_demo.goal_bank_status NOT NULL DEFAULT 'draft',
  current_version   int NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CONSTRAINT rehab_goal_templates_version_positive CHECK (current_version >= 1)
);

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_stage_templates (
  id                  uuid PRIMARY KEY,
  goal_template_id    uuid NOT NULL REFERENCES rehab_demo.rehab_goal_templates(id),
  version_number      int NOT NULL,
  seq                 int NOT NULL,
  code                text NOT NULL,
  name_he             text NOT NULL,
  description_he      text,
  is_mandatory        boolean NOT NULL DEFAULT true,
  typical_days        int,
  completion_rules_he text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rehab_stage_templates_unique_seq UNIQUE (goal_template_id, version_number, seq),
  CONSTRAINT rehab_stage_templates_unique_code UNIQUE (goal_template_id, version_number, code),
  CONSTRAINT rehab_stage_templates_seq_positive CHECK (seq >= 1),
  CONSTRAINT rehab_stage_templates_version_positive CHECK (version_number >= 1)
);

CREATE INDEX IF NOT EXISTS idx_rehab_stage_templates_goal_ver
  ON rehab_demo.rehab_stage_templates (goal_template_id, version_number);

-- ═══════════════════════════════════════════════════════════════════════════
-- PERSONAL — goal + stage instances (pinned template version)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_personal_goals (
  id                      uuid PRIMARY KEY,
  person_id               uuid NOT NULL REFERENCES rehab_demo.persons(id),
  program_patient_id      uuid REFERENCES rehab_demo.program_patients(id),
  goal_template_id        uuid NOT NULL REFERENCES rehab_demo.rehab_goal_templates(id),
  pinned_template_version int NOT NULL,
  name_he                 text NOT NULL,
  domain                  rehab_demo.rehab_domain NOT NULL,
  execution_mode          rehab_demo.stage_execution_mode NOT NULL DEFAULT 'sequential',
  mgmt_status             rehab_demo.personal_goal_mgmt_status NOT NULL DEFAULT 'active',
  outcome                 rehab_demo.personal_goal_outcome,
  owner_actor_id          uuid REFERENCES rehab_demo.actors(id),
  start_date              date,
  target_date             date,
  completed_at            timestamptz,
  completed_by_actor_id   uuid REFERENCES rehab_demo.actors(id),
  summary_he              text,
  notes_he                text,
  cycle_number            int NOT NULL DEFAULT 1,
  allow_duplicate_cycle   boolean NOT NULL DEFAULT false,
  portal_member_id        text,
  portal_unit_id          text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rehab_personal_goals_version_positive CHECK (pinned_template_version >= 1),
  CONSTRAINT rehab_personal_goals_cycle_positive CHECK (cycle_number >= 1),
  CONSTRAINT rehab_personal_goals_dates CHECK (
    target_date IS NULL OR start_date IS NULL OR target_date >= start_date
  ),
  CONSTRAINT rehab_personal_goals_outcome_when_closed CHECK (
    (mgmt_status IN ('completed', 'cancelled') AND outcome IS NOT NULL AND completed_at IS NOT NULL)
    OR (mgmt_status NOT IN ('completed', 'cancelled'))
  )
);

CREATE INDEX IF NOT EXISTS idx_rehab_personal_goals_person
  ON rehab_demo.rehab_personal_goals (person_id);
CREATE INDEX IF NOT EXISTS idx_rehab_personal_goals_pp
  ON rehab_demo.rehab_personal_goals (program_patient_id);
CREATE INDEX IF NOT EXISTS idx_rehab_personal_goals_portal_member
  ON rehab_demo.rehab_personal_goals (portal_member_id);

-- At most one ACTIVE personal goal per person × template (new cycle requires closed prior)
CREATE UNIQUE INDEX IF NOT EXISTS uq_rehab_personal_goal_active
  ON rehab_demo.rehab_personal_goals (person_id, goal_template_id)
  WHERE mgmt_status = 'active';

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_personal_stages (
  id                    uuid PRIMARY KEY,
  personal_goal_id      uuid NOT NULL REFERENCES rehab_demo.rehab_personal_goals(id) ON DELETE CASCADE,
  stage_template_id     uuid REFERENCES rehab_demo.rehab_stage_templates(id),
  seq                   int NOT NULL,
  name_he               text NOT NULL,
  description_he        text,
  is_mandatory          boolean NOT NULL DEFAULT true,
  typical_days          int,
  status                rehab_demo.personal_stage_status NOT NULL DEFAULT 'not_started',
  owner_actor_id        uuid REFERENCES rehab_demo.actors(id),
  start_date            date,
  target_date           date,
  completed_at          timestamptz,
  last_activity_at      timestamptz,
  exception_reason_he   text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rehab_personal_stages_unique_seq UNIQUE (personal_goal_id, seq),
  CONSTRAINT rehab_personal_stages_seq_positive CHECK (seq >= 1),
  CONSTRAINT rehab_personal_stages_dates CHECK (
    target_date IS NULL OR start_date IS NULL OR target_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS idx_rehab_personal_stages_goal
  ON rehab_demo.rehab_personal_stages (personal_goal_id);
CREATE INDEX IF NOT EXISTS idx_rehab_personal_stages_status
  ON rehab_demo.rehab_personal_stages (status);

-- ═══════════════════════════════════════════════════════════════════════════
-- OBSERVATIONS / COMMENTS / STATUS HISTORY
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_stage_observations (
  id                    uuid PRIMARY KEY,
  personal_stage_id     uuid NOT NULL REFERENCES rehab_demo.rehab_personal_stages(id) ON DELETE CASCADE,
  kind                  rehab_demo.observation_kind NOT NULL DEFAULT 'progress',
  body_he               text NOT NULL,
  observed_at           timestamptz NOT NULL DEFAULT now(),
  author_actor_id       uuid NOT NULL REFERENCES rehab_demo.actors(id),
  visibility            rehab_demo.observation_visibility NOT NULL DEFAULT 'internal',
  linked_task_id        uuid,
  linked_visit_id       uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz,
  edited_at             timestamptz,
  edit_history          jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT rehab_stage_observations_body_nonempty CHECK (length(trim(body_he)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_rehab_stage_observations_stage
  ON rehab_demo.rehab_stage_observations (personal_stage_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_stage_comments (
  id                    uuid PRIMARY KEY,
  observation_id        uuid NOT NULL REFERENCES rehab_demo.rehab_stage_observations(id) ON DELETE CASCADE,
  parent_comment_id     uuid REFERENCES rehab_demo.rehab_stage_comments(id),
  body_he               text NOT NULL,
  author_actor_id       uuid NOT NULL REFERENCES rehab_demo.actors(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  edited_at             timestamptz,
  edit_history          jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT rehab_stage_comments_body_nonempty CHECK (length(trim(body_he)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_rehab_stage_comments_obs
  ON rehab_demo.rehab_stage_comments (observation_id, created_at);

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_stage_status_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_stage_id     uuid NOT NULL REFERENCES rehab_demo.rehab_personal_stages(id) ON DELETE CASCADE,
  from_status           rehab_demo.personal_stage_status,
  to_status             rehab_demo.personal_stage_status NOT NULL,
  actor_id              uuid REFERENCES rehab_demo.actors(id),
  reason_he             text,
  occurred_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rehab_stage_status_events_stage
  ON rehab_demo.rehab_stage_status_events (personal_stage_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_goal_status_events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_goal_id      uuid NOT NULL REFERENCES rehab_demo.rehab_personal_goals(id) ON DELETE CASCADE,
  from_status           rehab_demo.personal_goal_mgmt_status,
  to_status             rehab_demo.personal_goal_mgmt_status NOT NULL,
  outcome               rehab_demo.personal_goal_outcome,
  actor_id              uuid REFERENCES rehab_demo.actors(id),
  reason_he             text,
  occurred_at           timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VISITS (rehab_demo) + TASK / VISIT rehab stage links
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_visits (
  id                        uuid PRIMARY KEY,
  primary_person_id         uuid NOT NULL REFERENCES rehab_demo.persons(id),
  program_patient_id        uuid REFERENCES rehab_demo.program_patients(id),
  activity_affiliation      rehab_demo.activity_affiliation NOT NULL DEFAULT 'routine',
  rehab_primary_stage_id    uuid REFERENCES rehab_demo.rehab_personal_stages(id),
  visit_date                date NOT NULL DEFAULT CURRENT_DATE,
  visit_type_he             text NOT NULL DEFAULT 'ביקור בית',
  status                    rehab_demo.visit_status NOT NULL DEFAULT 'planned',
  summary_he                text,
  performed_by_actor_id     uuid REFERENCES rehab_demo.actors(id),
  portal_unit_id            text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rehab_visits_rehab_requires_primary CHECK (
    activity_affiliation = 'routine'
    OR rehab_primary_stage_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_rehab_visits_person
  ON rehab_demo.rehab_visits (primary_person_id);
CREATE INDEX IF NOT EXISTS idx_rehab_visits_stage
  ON rehab_demo.rehab_visits (rehab_primary_stage_id);

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_visit_participants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id    uuid NOT NULL REFERENCES rehab_demo.rehab_visits(id) ON DELETE CASCADE,
  person_id   uuid NOT NULL REFERENCES rehab_demo.persons(id),
  is_primary  boolean NOT NULL DEFAULT false,
  CONSTRAINT rehab_visit_participants_unique UNIQUE (visit_id, person_id)
);

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_visit_stage_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id              uuid NOT NULL REFERENCES rehab_demo.rehab_visits(id) ON DELETE CASCADE,
  personal_stage_id     uuid NOT NULL REFERENCES rehab_demo.rehab_personal_stages(id),
  person_id             uuid NOT NULL REFERENCES rehab_demo.persons(id),
  link_role             rehab_demo.rehab_link_role NOT NULL DEFAULT 'secondary',
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rehab_visit_stage_links_unique UNIQUE (visit_id, personal_stage_id),
  CONSTRAINT rehab_visit_stage_links_secondary_only CHECK (link_role = 'secondary')
);

-- Extend existing tasks with rehab affiliation + primary stage
ALTER TABLE rehab_demo.tasks
  ADD COLUMN IF NOT EXISTS activity_affiliation rehab_demo.activity_affiliation
    NOT NULL DEFAULT 'routine';

ALTER TABLE rehab_demo.tasks
  ADD COLUMN IF NOT EXISTS rehab_primary_stage_id uuid
    REFERENCES rehab_demo.rehab_personal_stages(id);

ALTER TABLE rehab_demo.tasks
  DROP CONSTRAINT IF EXISTS rehab_tasks_rehab_requires_primary;

ALTER TABLE rehab_demo.tasks
  ADD CONSTRAINT rehab_tasks_rehab_requires_primary CHECK (
    activity_affiliation = 'routine'
    OR rehab_primary_stage_id IS NOT NULL
  );

CREATE TABLE IF NOT EXISTS rehab_demo.rehab_task_stage_links (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id               uuid NOT NULL REFERENCES rehab_demo.tasks(id) ON DELETE CASCADE,
  personal_stage_id     uuid NOT NULL REFERENCES rehab_demo.rehab_personal_stages(id),
  link_role             rehab_demo.rehab_link_role NOT NULL DEFAULT 'secondary',
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rehab_task_stage_links_unique UNIQUE (task_id, personal_stage_id),
  CONSTRAINT rehab_task_stage_links_secondary_only CHECK (link_role = 'secondary')
);

CREATE INDEX IF NOT EXISTS idx_rehab_task_stage_links_stage
  ON rehab_demo.rehab_task_stage_links (personal_stage_id);

-- Portal person bridge (maps portal member ids ↔ rehab persons)
CREATE TABLE IF NOT EXISTS rehab_demo.portal_person_map (
  portal_member_id  text PRIMARY KEY,
  portal_unit_id    text NOT NULL,
  person_id         uuid NOT NULL UNIQUE REFERENCES rehab_demo.persons(id),
  display_name_he   text NOT NULL
);

-- Atomic open personal goal + copy pinned stages
CREATE OR REPLACE FUNCTION rehab_demo.open_personal_goal(
  p_goal_id uuid,
  p_person_id uuid,
  p_template_id uuid,
  p_owner_actor_id uuid DEFAULT NULL,
  p_program_patient_id uuid DEFAULT NULL,
  p_start_date date DEFAULT CURRENT_DATE,
  p_target_date date DEFAULT NULL,
  p_notes_he text DEFAULT NULL,
  p_portal_member_id text DEFAULT NULL,
  p_portal_unit_id text DEFAULT NULL,
  p_force_new_cycle boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_tmpl rehab_demo.rehab_goal_templates%ROWTYPE;
  v_version int;
  v_active_count int;
  v_cycle int := 1;
  v_stage RECORD;
  v_stage_id uuid;
BEGIN
  SELECT * INTO v_tmpl
  FROM rehab_demo.rehab_goal_templates
  WHERE id = p_template_id AND deleted_at IS NULL;

  IF v_tmpl.id IS NULL THEN
    RAISE EXCEPTION 'goal template not found' USING ERRCODE = 'foreign_key_violation';
  END IF;
  IF v_tmpl.status <> 'active' THEN
    RAISE EXCEPTION 'goal template is not active' USING ERRCODE = 'check_violation';
  END IF;

  v_version := v_tmpl.current_version;

  SELECT count(*)::int INTO v_active_count
  FROM rehab_demo.rehab_personal_goals
  WHERE person_id = p_person_id
    AND goal_template_id = p_template_id
    AND mgmt_status = 'active';

  IF v_active_count > 0 AND NOT p_force_new_cycle THEN
    RAISE EXCEPTION 'active personal goal already exists for this template'
      USING ERRCODE = 'unique_violation';
  END IF;

  IF p_force_new_cycle AND v_active_count > 0 THEN
    RAISE EXCEPTION 'close the active goal before opening a new cycle'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT COALESCE(max(cycle_number), 0) + 1 INTO v_cycle
  FROM rehab_demo.rehab_personal_goals
  WHERE person_id = p_person_id AND goal_template_id = p_template_id;

  IF NOT EXISTS (
    SELECT 1 FROM rehab_demo.rehab_stage_templates
    WHERE goal_template_id = p_template_id AND version_number = v_version
  ) THEN
    RAISE EXCEPTION 'template version % has no stages', v_version
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO rehab_demo.rehab_personal_goals (
    id, person_id, program_patient_id, goal_template_id, pinned_template_version,
    name_he, domain, execution_mode, mgmt_status, owner_actor_id,
    start_date, target_date, notes_he, cycle_number,
    portal_member_id, portal_unit_id
  ) VALUES (
    p_goal_id, p_person_id, p_program_patient_id, p_template_id, v_version,
    v_tmpl.name_he, v_tmpl.domain, v_tmpl.execution_mode, 'active', p_owner_actor_id,
    p_start_date, p_target_date, p_notes_he, v_cycle,
    p_portal_member_id, p_portal_unit_id
  );

  FOR v_stage IN
    SELECT * FROM rehab_demo.rehab_stage_templates
    WHERE goal_template_id = p_template_id AND version_number = v_version
    ORDER BY seq
  LOOP
    v_stage_id := gen_random_uuid();
    INSERT INTO rehab_demo.rehab_personal_stages (
      id, personal_goal_id, stage_template_id, seq, name_he, description_he,
      is_mandatory, typical_days, status, owner_actor_id
    ) VALUES (
      v_stage_id, p_goal_id, v_stage.id, v_stage.seq, v_stage.name_he, v_stage.description_he,
      v_stage.is_mandatory, v_stage.typical_days, 'not_started', p_owner_actor_id
    );
  END LOOP;

  INSERT INTO rehab_demo.rehab_goal_status_events (
    personal_goal_id, from_status, to_status, actor_id, reason_he
  ) VALUES (
    p_goal_id, NULL, 'active', p_owner_actor_id, 'פתיחת מטרת שיקום אישית'
  );

  INSERT INTO rehab_demo.audit_log (actor_id, action, entity_table, entity_id, details_he, payload)
  VALUES (
    p_owner_actor_id, 'open_personal_goal', 'rehab_personal_goals', p_goal_id,
    'נפתחה מטרת שיקום אישית',
    jsonb_build_object(
      'template_id', p_template_id,
      'pinned_version', v_version,
      'person_id', p_person_id,
      'cycle', v_cycle
    )
  );

  RETURN p_goal_id;
END;
$$;
