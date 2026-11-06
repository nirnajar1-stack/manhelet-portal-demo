-- Integrity rules: pins, immutability, enrollment exclusivity, phase/period alignment

-- ── updated_at helper ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION rehab_demo.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_persons_updated ON rehab_demo.persons;
CREATE TRIGGER trg_persons_updated
  BEFORE UPDATE ON rehab_demo.persons
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

DROP TRIGGER IF EXISTS trg_households_updated ON rehab_demo.households;
CREATE TRIGGER trg_households_updated
  BEFORE UPDATE ON rehab_demo.households
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

DROP TRIGGER IF EXISTS trg_programs_updated ON rehab_demo.programs;
CREATE TRIGGER trg_programs_updated
  BEFORE UPDATE ON rehab_demo.programs
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

DROP TRIGGER IF EXISTS trg_program_patients_updated ON rehab_demo.program_patients;
CREATE TRIGGER trg_program_patients_updated
  BEFORE UPDATE ON rehab_demo.program_patients
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

DROP TRIGGER IF EXISTS trg_goals_updated ON rehab_demo.goals;
CREATE TRIGGER trg_goals_updated
  BEFORE UPDATE ON rehab_demo.goals
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.set_updated_at();

-- ── Rule: pinned template version must belong to program.template_id ───────
CREATE OR REPLACE FUNCTION rehab_demo.enforce_program_pin_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_template uuid;
  v_status rehab_demo.template_status;
BEGIN
  IF NEW.pinned_version_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT template_id, status INTO v_template, v_status
  FROM rehab_demo.template_versions
  WHERE id = NEW.pinned_version_id;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'pinned_version_id % does not exist', NEW.pinned_version_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_template <> NEW.template_id THEN
    RAISE EXCEPTION 'pinned version must belong to program template'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.status = 'open' AND v_status <> 'published' THEN
    RAISE EXCEPTION 'open program requires a published template version'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Immutable pin while open (scenarios 16 / 18)
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'open'
     AND NEW.status = 'open'
     AND NEW.pinned_version_id IS DISTINCT FROM OLD.pinned_version_id THEN
    RAISE EXCEPTION 'cannot change pinned_version_id while program is open'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_programs_pin ON rehab_demo.programs;
CREATE TRIGGER trg_programs_pin
  BEFORE INSERT OR UPDATE ON rehab_demo.programs
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_program_pin_version();

-- ── Rule: published template versions are immutable ────────────────────────
CREATE OR REPLACE FUNCTION rehab_demo.enforce_published_version_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'published' AND (
       NEW.version_number IS DISTINCT FROM OLD.version_number
    OR NEW.template_id IS DISTINCT FROM OLD.template_id
    OR (NEW.status = 'draft')
  ) THEN
    RAISE EXCEPTION 'published template version is immutable (retire instead)'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_template_versions_immutable ON rehab_demo.template_versions;
CREATE TRIGGER trg_template_versions_immutable
  BEFORE UPDATE ON rehab_demo.template_versions
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_published_version_immutable();

CREATE OR REPLACE FUNCTION rehab_demo.block_mutate_published_template_children()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_status rehab_demo.template_status;
  v_version uuid;
BEGIN
  IF TG_TABLE_NAME = 'template_phases' OR TG_TABLE_NAME = 'template_goals' THEN
    v_version := COALESCE(NEW.template_version_id, OLD.template_version_id);
  END IF;

  SELECT status INTO v_status
  FROM rehab_demo.template_versions
  WHERE id = v_version;

  IF v_status = 'published' THEN
    RAISE EXCEPTION 'cannot mutate phases/goals of a published template version'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_template_phases_lock ON rehab_demo.template_phases;
CREATE TRIGGER trg_template_phases_lock
  BEFORE INSERT OR UPDATE OR DELETE ON rehab_demo.template_phases
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.block_mutate_published_template_children();

DROP TRIGGER IF EXISTS trg_template_goals_lock ON rehab_demo.template_goals;
CREATE TRIGGER trg_template_goals_lock
  BEFORE INSERT OR UPDATE OR DELETE ON rehab_demo.template_goals
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.block_mutate_published_template_children();

-- ── Rule: at most one ACTIVE enrollment per person per template family ─────
-- Scenario 18: overlapping active Program_Patient for same person+template rejected
CREATE OR REPLACE FUNCTION rehab_demo.enforce_single_active_enrollment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_template uuid;
  v_conflict uuid;
BEGIN
  IF NEW.status NOT IN ('invited', 'active') THEN
    RETURN NEW;
  END IF;

  SELECT p.template_id INTO v_template
  FROM rehab_demo.programs p
  WHERE p.id = NEW.program_id;

  SELECT pp.id INTO v_conflict
  FROM rehab_demo.program_patients pp
  JOIN rehab_demo.programs p ON p.id = pp.program_id
  WHERE pp.person_id = NEW.person_id
    AND p.template_id = v_template
    AND pp.status IN ('invited', 'active')
    AND pp.id IS DISTINCT FROM NEW.id
  LIMIT 1;

  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION
      'person already has an active/invited enrollment for this template family (conflict %)',
      v_conflict
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pp_single_active ON rehab_demo.program_patients;
CREATE TRIGGER trg_pp_single_active
  BEFORE INSERT OR UPDATE ON rehab_demo.program_patients
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_single_active_enrollment();

-- ── Rule: program_phase.template_phase must match pinned version ───────────
CREATE OR REPLACE FUNCTION rehab_demo.enforce_phase_version_alignment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_program uuid;
  v_pinned uuid;
  v_phase_version uuid;
  v_starts date;
  v_ends date;
  v_period_start date;
  v_period_end date;
BEGIN
  SELECT pp.program_id, pp.starts_on, pp.ends_on
    INTO v_program, v_period_start, v_period_end
  FROM rehab_demo.program_periods pp
  WHERE pp.id = NEW.program_period_id;

  SELECT pinned_version_id INTO v_pinned
  FROM rehab_demo.programs
  WHERE id = v_program;

  SELECT template_version_id INTO v_phase_version
  FROM rehab_demo.template_phases
  WHERE id = NEW.template_phase_id;

  IF v_pinned IS NOT NULL AND v_phase_version IS DISTINCT FROM v_pinned THEN
    RAISE EXCEPTION 'program phase must reference a phase from the pinned template version'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Phase dates within period (when both set)
  IF NEW.starts_on IS NOT NULL AND NEW.starts_on < v_period_start THEN
    RAISE EXCEPTION 'phase starts_on before period start'
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_period_end IS NOT NULL AND NEW.ends_on IS NOT NULL AND NEW.ends_on > v_period_end THEN
    RAISE EXCEPTION 'phase ends_on after period end'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_program_phases_align ON rehab_demo.program_phases;
CREATE TRIGGER trg_program_phases_align
  BEFORE INSERT OR UPDATE ON rehab_demo.program_phases
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_phase_version_alignment();

-- ── Rule: goal_updates sync goal progress + audit ──────────────────────────
CREATE OR REPLACE FUNCTION rehab_demo.apply_goal_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE rehab_demo.goals
  SET progress_pct = NEW.progress_pct,
      status = COALESCE(NEW.status, status),
      updated_at = now()
  WHERE id = NEW.goal_id;

  INSERT INTO rehab_demo.audit_log (actor_id, action, entity_table, entity_id, details_he, payload)
  VALUES (
    NEW.author_actor_id,
    'goal_update',
    'goals',
    NEW.goal_id,
    NEW.note_he,
    jsonb_build_object('progress_pct', NEW.progress_pct, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_goal_updates_apply ON rehab_demo.goal_updates;
CREATE TRIGGER trg_goal_updates_apply
  AFTER INSERT ON rehab_demo.goal_updates
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.apply_goal_update();

-- ── Rule: session attendance PP must belong to session.program ─────────────
CREATE OR REPLACE FUNCTION rehab_demo.enforce_attendance_program()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_program uuid;
  v_pp_program uuid;
BEGIN
  SELECT program_id INTO v_session_program FROM rehab_demo.sessions WHERE id = NEW.session_id;
  SELECT program_id INTO v_pp_program FROM rehab_demo.program_patients WHERE id = NEW.program_patient_id;
  IF v_session_program IS DISTINCT FROM v_pp_program THEN
    RAISE EXCEPTION 'attendance program_patient must belong to session program'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_program ON rehab_demo.session_attendance;
CREATE TRIGGER trg_attendance_program
  BEFORE INSERT OR UPDATE ON rehab_demo.session_attendance
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_attendance_program();

-- ── Rule: tasks.goal must belong to same program_patient when both set ─────
CREATE OR REPLACE FUNCTION rehab_demo.enforce_task_goal_pp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_goal_pp uuid;
BEGIN
  IF NEW.goal_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT program_patient_id INTO v_goal_pp FROM rehab_demo.goals WHERE id = NEW.goal_id;
  IF NEW.program_patient_id IS NULL THEN
    NEW.program_patient_id := v_goal_pp;
  ELSIF NEW.program_patient_id IS DISTINCT FROM v_goal_pp THEN
    RAISE EXCEPTION 'task goal must belong to the same program_patient'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_goal_pp ON rehab_demo.tasks;
CREATE TRIGGER trg_tasks_goal_pp
  BEFORE INSERT OR UPDATE ON rehab_demo.tasks
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.enforce_task_goal_pp();

-- ── Recalc personal_pct from weighted goals ────────────────────────────────
CREATE OR REPLACE FUNCTION rehab_demo.recalc_personal_progress(p_pp uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_pct numeric(5,2);
BEGIN
  SELECT COALESCE(
    ROUND(SUM(progress_pct * weight) / NULLIF(SUM(weight), 0), 2),
    0
  ) INTO v_pct
  FROM rehab_demo.goals
  WHERE program_patient_id = p_pp
    AND status <> 'cancelled';

  UPDATE rehab_demo.program_patients
  SET personal_pct = COALESCE(v_pct, 0)
  WHERE id = p_pp;
END;
$$;

CREATE OR REPLACE FUNCTION rehab_demo.trg_recalc_personal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM rehab_demo.recalc_personal_progress(
    COALESCE(NEW.program_patient_id, OLD.program_patient_id)
  );
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_goals_recalc ON rehab_demo.goals;
CREATE TRIGGER trg_goals_recalc
  AFTER INSERT OR UPDATE OR DELETE ON rehab_demo.goals
  FOR EACH ROW EXECUTE FUNCTION rehab_demo.trg_recalc_personal();

-- ── Recalc group_pct as average of active personal_pct in period's program ─
CREATE OR REPLACE FUNCTION rehab_demo.recalc_group_progress(p_program uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_pct numeric(5,2);
BEGIN
  SELECT COALESCE(ROUND(AVG(personal_pct), 2), 0) INTO v_pct
  FROM rehab_demo.program_patients
  WHERE program_id = p_program
    AND status = 'active';

  UPDATE rehab_demo.program_periods
  SET group_pct = v_pct
  WHERE program_id = p_program
    AND status = 'active';
END;
$$;

-- ── Scenario 19: access grant ≠ household membership helper ─────────────
CREATE OR REPLACE FUNCTION rehab_demo.has_active_access(
  p_actor uuid,
  p_program uuid DEFAULT NULL,
  p_pp uuid DEFAULT NULL,
  p_household uuid DEFAULT NULL,
  p_person uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM rehab_demo.access_grants g
    WHERE g.actor_id = p_actor
      AND g.revoked_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at > now())
      AND g.can_read
      AND (
        (g.scope = 'program' AND g.program_id = p_program)
        OR (g.scope = 'program_patient' AND g.program_patient_id = p_pp)
        OR (g.scope = 'household' AND g.household_id = p_household)
        OR (g.scope = 'person' AND g.person_id = p_person)
        OR (
          g.scope = 'program'
          AND p_pp IS NOT NULL
          AND g.program_id = (
            SELECT program_id FROM rehab_demo.program_patients WHERE id = p_pp
          )
        )
      )
  );
$$;

-- Household membership alone does NOT grant clinical access
CREATE OR REPLACE FUNCTION rehab_demo.is_household_member(
  p_person uuid,
  p_household uuid
) RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM rehab_demo.household_members hm
    WHERE hm.person_id = p_person
      AND hm.household_id = p_household
      AND hm.left_at IS NULL
  );
$$;
