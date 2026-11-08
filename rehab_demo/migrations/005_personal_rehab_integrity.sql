-- Integrity + permission helpers for personal rehab workflow

DROP TRIGGER IF EXISTS trg_rehab_goal_templates_updated ON rehab_demo.rehab_goal_templates;
CREATE TRIGGER trg_rehab_goal_templates_updated
  BEFORE UPDATE ON rehab_demo.rehab_goal_templates
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

DROP TRIGGER IF EXISTS trg_rehab_personal_goals_updated ON rehab_demo.rehab_personal_goals;
CREATE TRIGGER trg_rehab_personal_goals_updated
  BEFORE UPDATE ON rehab_demo.rehab_personal_goals
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

DROP TRIGGER IF EXISTS trg_rehab_personal_stages_updated ON rehab_demo.rehab_personal_stages;
CREATE TRIGGER trg_rehab_personal_stages_updated
  BEFORE UPDATE ON rehab_demo.rehab_personal_stages
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

-- Active template stages for current_version are immutable (edit via new version)
CREATE OR REPLACE FUNCTION rehab_demo.block_mutate_active_bank_stages()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_status rehab_demo.goal_bank_status;
  v_current int;
  v_tmpl uuid;
  v_ver int;
BEGIN
  v_tmpl := COALESCE(NEW.goal_template_id, OLD.goal_template_id);
  v_ver := COALESCE(NEW.version_number, OLD.version_number);

  SELECT status, current_version INTO v_status, v_current
  FROM rehab_demo.rehab_goal_templates
  WHERE id = v_tmpl;

  -- Protect published (active) current version from mutation; drafts editable
  IF v_status = 'active' AND v_ver = v_current THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'cannot mutate stages of active template current version; create a new version'
        USING ERRCODE = 'check_violation';
    END IF;
    IF TG_OP = 'UPDATE' AND (
         NEW.name_he IS DISTINCT FROM OLD.name_he
      OR NEW.description_he IS DISTINCT FROM OLD.description_he
      OR NEW.seq IS DISTINCT FROM OLD.seq
      OR NEW.is_mandatory IS DISTINCT FROM OLD.is_mandatory
      OR NEW.code IS DISTINCT FROM OLD.code
      OR NEW.typical_days IS DISTINCT FROM OLD.typical_days
    ) THEN
      RAISE EXCEPTION 'cannot mutate stages of active template current version; create a new version'
        USING ERRCODE = 'check_violation';
    END IF;
    IF TG_OP = 'INSERT' THEN
      RAISE EXCEPTION 'cannot add stages to active template current version; create a new version'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rehab_stage_templates_lock ON rehab_demo.rehab_stage_templates;
CREATE TRIGGER trg_rehab_stage_templates_lock
  BEFORE INSERT OR UPDATE OR DELETE ON rehab_demo.rehab_stage_templates
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.block_mutate_active_bank_stages();

-- Bump template to new version by copying stages (does NOT mutate opened personal goals)
CREATE OR REPLACE FUNCTION rehab_demo.publish_goal_template_version(
  p_template_id uuid,
  p_changelog_he text DEFAULT NULL
) RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_old int;
  v_new int;
  v_stage RECORD;
BEGIN
  SELECT current_version INTO v_old
  FROM rehab_demo.rehab_goal_templates
  WHERE id = p_template_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_old IS NULL THEN
    RAISE EXCEPTION 'template not found' USING ERRCODE = 'foreign_key_violation';
  END IF;

  v_new := v_old + 1;

  -- Temporarily mark draft so copy insert is allowed, then set active + new version
  UPDATE rehab_demo.rehab_goal_templates
  SET status = 'draft', updated_at = now()
  WHERE id = p_template_id;

  FOR v_stage IN
    SELECT * FROM rehab_demo.rehab_stage_templates
    WHERE goal_template_id = p_template_id AND version_number = v_old
    ORDER BY seq
  LOOP
    INSERT INTO rehab_demo.rehab_stage_templates (
      id, goal_template_id, version_number, seq, code, name_he, description_he,
      is_mandatory, typical_days, completion_rules_he
    ) VALUES (
      gen_random_uuid(), p_template_id, v_new, v_stage.seq, v_stage.code, v_stage.name_he,
      v_stage.description_he, v_stage.is_mandatory, v_stage.typical_days, v_stage.completion_rules_he
    );
  END LOOP;

  UPDATE rehab_demo.rehab_goal_templates
  SET current_version = v_new, status = 'active', updated_at = now()
  WHERE id = p_template_id;

  INSERT INTO rehab_demo.audit_log (action, entity_table, entity_id, details_he, payload)
  VALUES (
    'publish_goal_template_version', 'rehab_goal_templates', p_template_id,
    COALESCE(p_changelog_he, 'גרסת תבנית חדשה'),
    jsonb_build_object('from_version', v_old, 'to_version', v_new)
  );

  RETURN v_new;
END;
$$;

-- Add stage to a NEW draft version only (caller bumps version first) helper for tests:
CREATE OR REPLACE FUNCTION rehab_demo.add_stage_to_new_template_version(
  p_template_id uuid,
  p_code text,
  p_name_he text,
  p_description_he text DEFAULT NULL,
  p_is_mandatory boolean DEFAULT true,
  p_typical_days int DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_new int;
  v_seq int;
  v_id uuid := gen_random_uuid();
BEGIN
  v_new := rehab_demo.publish_goal_template_version(p_template_id, 'הוספת שלב חדש');

  -- publish copied old stages; now temporarily draft to append one more
  UPDATE rehab_demo.rehab_goal_templates SET status = 'draft' WHERE id = p_template_id;

  SELECT COALESCE(max(seq), 0) + 1 INTO v_seq
  FROM rehab_demo.rehab_stage_templates
  WHERE goal_template_id = p_template_id AND version_number = v_new;

  INSERT INTO rehab_demo.rehab_stage_templates (
    id, goal_template_id, version_number, seq, code, name_he, description_he,
    is_mandatory, typical_days
  ) VALUES (
    v_id, p_template_id, v_new, v_seq, p_code, p_name_he, p_description_he,
    p_is_mandatory, p_typical_days
  );

  UPDATE rehab_demo.rehab_goal_templates SET status = 'active' WHERE id = p_template_id;
  RETURN v_id;
END;
$$;

-- Sequential stage start rule
CREATE OR REPLACE FUNCTION rehab_demo.enforce_stage_start_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_mode rehab_demo.stage_execution_mode;
  v_prev_status rehab_demo.personal_stage_status;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'not_started'
     AND NEW.status = 'in_progress' THEN

    SELECT execution_mode INTO v_mode
    FROM rehab_demo.rehab_personal_goals
    WHERE id = NEW.personal_goal_id;

    IF v_mode = 'sequential' AND NEW.seq > 1 AND NEW.exception_reason_he IS NULL THEN
      SELECT status INTO v_prev_status
      FROM rehab_demo.rehab_personal_stages
      WHERE personal_goal_id = NEW.personal_goal_id AND seq = NEW.seq - 1;

      IF v_prev_status IS DISTINCT FROM 'completed'
         AND v_prev_status IS DISTINCT FROM 'skipped' THEN
        RAISE EXCEPTION 'sequential mode: previous stage must be completed or skipped (or set exception_reason_he)'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;

    IF NEW.start_date IS NULL THEN
      NEW.start_date := CURRENT_DATE;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.status = 'completed'
     AND OLD.status IS DISTINCT FROM 'completed' THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO rehab_demo.rehab_stage_status_events (
      personal_stage_id, from_status, to_status, actor_id, reason_he
    ) VALUES (
      NEW.id, OLD.status, NEW.status, NEW.owner_actor_id, NEW.exception_reason_he
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rehab_personal_stages_start ON rehab_demo.rehab_personal_stages;
CREATE TRIGGER trg_rehab_personal_stages_start
  BEFORE UPDATE ON rehab_demo.rehab_personal_stages
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_stage_start_rules();

-- Closing a task must NOT auto-complete linked stages (no trigger) — tested in suite.

-- Task primary stage must belong to same person as task's program_patient (or mapped person)
CREATE OR REPLACE FUNCTION rehab_demo.enforce_task_rehab_stage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_stage_person uuid;
  v_pp_person uuid;
  v_goal_id uuid;
BEGIN
  IF NEW.activity_affiliation = 'rehab' THEN
    IF NEW.rehab_primary_stage_id IS NULL THEN
      RAISE EXCEPTION 'rehab task requires primary stage'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF NEW.rehab_primary_stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT g.person_id, s.personal_goal_id
    INTO v_stage_person, v_goal_id
  FROM rehab_demo.rehab_personal_stages s
  JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
  WHERE s.id = NEW.rehab_primary_stage_id;

  IF v_stage_person IS NULL THEN
    RAISE EXCEPTION 'primary stage not found' USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NEW.program_patient_id IS NOT NULL THEN
    SELECT person_id INTO v_pp_person
    FROM rehab_demo.program_patients
    WHERE id = NEW.program_patient_id;

    IF v_pp_person IS DISTINCT FROM v_stage_person THEN
      RAISE EXCEPTION 'task program_patient person must match primary stage person'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_rehab_stage ON rehab_demo.tasks;
CREATE TRIGGER trg_tasks_rehab_stage
  BEFORE INSERT OR UPDATE ON rehab_demo.tasks
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_task_rehab_stage();

-- Secondary task links: same person as primary; not equal to primary; no duplicates
CREATE OR REPLACE FUNCTION rehab_demo.enforce_task_secondary_stage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_primary uuid;
  v_primary_person uuid;
  v_secondary_person uuid;
  v_affiliation rehab_demo.activity_affiliation;
BEGIN
  SELECT rehab_primary_stage_id, activity_affiliation
    INTO v_primary, v_affiliation
  FROM rehab_demo.tasks WHERE id = NEW.task_id;

  IF v_affiliation IS DISTINCT FROM 'rehab' THEN
    RAISE EXCEPTION 'secondary rehab stage links require rehab affiliation'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_primary IS NULL THEN
    RAISE EXCEPTION 'task has no primary rehab stage'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.personal_stage_id = v_primary THEN
    RAISE EXCEPTION 'secondary stage cannot equal primary stage'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT g.person_id INTO v_primary_person
  FROM rehab_demo.rehab_personal_stages s
  JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
  WHERE s.id = v_primary;

  SELECT g.person_id INTO v_secondary_person
  FROM rehab_demo.rehab_personal_stages s
  JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
  WHERE s.id = NEW.personal_stage_id;

  IF v_primary_person IS DISTINCT FROM v_secondary_person THEN
    RAISE EXCEPTION 'secondary stage must belong to the same person as primary'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_secondary_stage ON rehab_demo.rehab_task_stage_links;
CREATE TRIGGER trg_task_secondary_stage
  BEFORE INSERT OR UPDATE ON rehab_demo.rehab_task_stage_links
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_task_secondary_stage();

-- Visit primary stage person match
CREATE OR REPLACE FUNCTION rehab_demo.enforce_visit_rehab_stage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_stage_person uuid;
BEGIN
  IF NEW.activity_affiliation = 'rehab' AND NEW.rehab_primary_stage_id IS NULL THEN
    RAISE EXCEPTION 'rehab visit requires primary stage'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.rehab_primary_stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT g.person_id INTO v_stage_person
  FROM rehab_demo.rehab_personal_stages s
  JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
  WHERE s.id = NEW.rehab_primary_stage_id;

  IF v_stage_person IS DISTINCT FROM NEW.primary_person_id THEN
    RAISE EXCEPTION 'visit primary stage must belong to visit primary person'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_visits_rehab_stage ON rehab_demo.rehab_visits;
CREATE TRIGGER trg_visits_rehab_stage
  BEFORE INSERT OR UPDATE ON rehab_demo.rehab_visits
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_visit_rehab_stage();

CREATE OR REPLACE FUNCTION rehab_demo.enforce_visit_secondary_stage()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_primary uuid;
  v_primary_person uuid;
  v_stage_person uuid;
  v_affiliation rehab_demo.activity_affiliation;
BEGIN
  SELECT rehab_primary_stage_id, activity_affiliation, primary_person_id
    INTO v_primary, v_affiliation, v_primary_person
  FROM rehab_demo.rehab_visits WHERE id = NEW.visit_id;

  IF v_affiliation IS DISTINCT FROM 'rehab' THEN
    RAISE EXCEPTION 'secondary visit stage links require rehab affiliation'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.personal_stage_id = v_primary THEN
    RAISE EXCEPTION 'secondary stage cannot equal primary stage'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT g.person_id INTO v_stage_person
  FROM rehab_demo.rehab_personal_stages s
  JOIN rehab_demo.rehab_personal_goals g ON g.id = s.personal_goal_id
  WHERE s.id = NEW.personal_stage_id;

  IF v_stage_person IS DISTINCT FROM NEW.person_id THEN
    RAISE EXCEPTION 'visit stage link person_id must match stage person'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Default: secondary stages for multi-participant must be explicit; do not auto-link
  -- Stage person must be a declared participant of the visit
  IF NOT EXISTS (
    SELECT 1 FROM rehab_demo.rehab_visit_participants p
    WHERE p.visit_id = NEW.visit_id AND p.person_id = NEW.person_id
  ) AND NEW.person_id IS DISTINCT FROM v_primary_person THEN
    RAISE EXCEPTION 'stage person must be a visit participant'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_visit_secondary_stage ON rehab_demo.rehab_visit_stage_links;
CREATE TRIGGER trg_visit_secondary_stage
  BEFORE INSERT OR UPDATE ON rehab_demo.rehab_visit_stage_links
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_visit_secondary_stage();

-- Observations: author + created_at immutable
CREATE OR REPLACE FUNCTION rehab_demo.protect_observation_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.author_actor_id IS DISTINCT FROM OLD.author_actor_id THEN
      RAISE EXCEPTION 'observation author is immutable' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'observation created_at is immutable' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.body_he IS DISTINCT FROM OLD.body_he THEN
      NEW.edit_history := OLD.edit_history || jsonb_build_array(
        jsonb_build_object('at', now(), 'from', OLD.body_he, 'to', NEW.body_he)
      );
      NEW.edited_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_observation_identity ON rehab_demo.rehab_stage_observations;
CREATE TRIGGER trg_observation_identity
  BEFORE UPDATE ON rehab_demo.rehab_stage_observations
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.protect_observation_identity();

CREATE OR REPLACE FUNCTION rehab_demo.protect_comment_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.author_actor_id IS DISTINCT FROM OLD.author_actor_id THEN
    RAISE EXCEPTION 'comment author is immutable' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'comment created_at is immutable' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.body_he IS DISTINCT FROM OLD.body_he THEN
    NEW.edit_history := OLD.edit_history || jsonb_build_array(
      jsonb_build_object('at', now(), 'from', OLD.body_he, 'to', NEW.body_he)
    );
    NEW.edited_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_identity ON rehab_demo.rehab_stage_comments;
CREATE TRIGGER trg_comment_identity
  BEFORE UPDATE ON rehab_demo.rehab_stage_comments
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.protect_comment_identity();

-- Permission: can actor write personal goal for person?
CREATE OR REPLACE FUNCTION rehab_demo.can_write_personal_rehab(p_person uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_actor uuid := rehab_demo.current_actor_id();
  v_role text := rehab_demo.current_access_role();
BEGIN
  IF v_role = 'matam' THEN
    RETURN true;
  END IF;
  IF v_actor IS NULL THEN
    RETURN false;
  END IF;
  IF v_role IN ('patient', 'guardian', 'gov') THEN
    RETURN false;
  END IF;
  -- companion / coordinator: grant on person or household or PP
  RETURN rehab_demo.has_active_access(v_actor, NULL, NULL, NULL, p_person)
    OR EXISTS (
      SELECT 1
      FROM rehab_demo.access_grants g
      JOIN rehab_demo.household_members hm ON hm.household_id = g.household_id
      WHERE g.actor_id = v_actor
        AND g.scope = 'household'
        AND g.revoked_at IS NULL
        AND g.can_write
        AND hm.person_id = p_person
        AND hm.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM rehab_demo.program_patients pp
      JOIN rehab_demo.program_team_members t ON t.program_id = pp.program_id
      WHERE pp.person_id = p_person
        AND t.actor_id = v_actor
        AND t.ended_at IS NULL
        AND pp.status IN ('invited', 'active')
    );
END;
$$;

CREATE OR REPLACE FUNCTION rehab_demo.can_read_personal_rehab(p_person uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_actor uuid := rehab_demo.current_actor_id();
  v_role text := rehab_demo.current_access_role();
  v_linked uuid;
BEGIN
  IF v_role = 'matam' THEN
    RETURN true;
  END IF;
  IF v_actor IS NULL THEN
    RETURN false;
  END IF;

  SELECT person_id INTO v_linked
  FROM rehab_demo.person_actor_links
  WHERE actor_id = v_actor;

  IF v_role = 'patient' AND v_linked = p_person THEN
    RETURN true;
  END IF;

  RETURN rehab_demo.has_active_access(v_actor, NULL, NULL, NULL, p_person)
    OR EXISTS (
      SELECT 1
      FROM rehab_demo.access_grants g
      JOIN rehab_demo.household_members hm ON hm.household_id = g.household_id
      WHERE g.actor_id = v_actor
        AND g.scope = 'household'
        AND g.revoked_at IS NULL
        AND g.can_read
        AND hm.person_id = p_person
        AND hm.left_at IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM rehab_demo.program_patients pp
      WHERE pp.person_id = p_person
        AND rehab_demo.can_read_program_patient(pp.id)
    );
END;
$$;
