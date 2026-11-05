-- Permission simulation via RLS-style policies + session GUC
-- Set: SELECT set_config('rehab.actor_id', '<uuid>', true);
--      SELECT set_config('rehab.access_role', 'matam|companion|patient|guardian|gov', true);

CREATE OR REPLACE FUNCTION rehab_demo.current_actor_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('rehab.actor_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION rehab_demo.current_access_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('rehab.access_role', true), ''), 'anonymous');
$$;

-- Matam / coordinator: broad read within granted programs OR team membership
CREATE OR REPLACE FUNCTION rehab_demo.can_read_program(p_program uuid)
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
  IF EXISTS (
    SELECT 1 FROM rehab_demo.program_team_members t
    WHERE t.program_id = p_program
      AND t.actor_id = v_actor
      AND t.ended_at IS NULL
  ) THEN
    RETURN true;
  END IF;
  RETURN rehab_demo.has_active_access(v_actor, p_program, NULL, NULL, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION rehab_demo.can_read_program_patient(p_pp uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_actor uuid := rehab_demo.current_actor_id();
  v_role text := rehab_demo.current_access_role();
  v_program uuid;
  v_person uuid;
  v_household uuid;
  v_linked_person uuid;
BEGIN
  IF v_role = 'matam' THEN
    RETURN true;
  END IF;

  SELECT pp.program_id, pp.person_id, p.household_id
    INTO v_program, v_person, v_household
  FROM rehab_demo.program_patients pp
  JOIN rehab_demo.programs p ON p.id = pp.program_id
  WHERE pp.id = p_pp;

  IF v_program IS NULL THEN
    RETURN false;
  END IF;

  IF rehab_demo.can_read_program(v_program) THEN
    -- companions/gov still need grant or team; can_read_program already checked
    IF v_role IN ('companion', 'gov', 'coordinator') THEN
      RETURN true;
    END IF;
  END IF;

  -- Direct PP / person / household grants
  IF v_actor IS NOT NULL AND rehab_demo.has_active_access(v_actor, v_program, p_pp, v_household, v_person) THEN
    RETURN true;
  END IF;

  -- Patient: only own enrollment via person_actor_links
  IF v_role = 'patient' AND v_actor IS NOT NULL THEN
    SELECT person_id INTO v_linked_person
    FROM rehab_demo.person_actor_links
    WHERE actor_id = v_actor;
    RETURN v_linked_person IS NOT NULL AND v_linked_person = v_person;
  END IF;

  -- Guardian: requires explicit grant (NOT mere household membership — scenario 19)
  IF v_role = 'guardian' AND v_actor IS NOT NULL THEN
    RETURN rehab_demo.has_active_access(v_actor, v_program, p_pp, v_household, v_person);
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION rehab_demo.can_write_program_patient(p_pp uuid)
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
  IF v_role IN ('gov', 'patient') THEN
    RETURN false;
  END IF;
  IF v_actor IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM rehab_demo.access_grants g
    WHERE g.actor_id = v_actor
      AND g.revoked_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at > now())
      AND g.can_write
      AND (
        g.program_patient_id = p_pp
        OR g.program_id = (SELECT program_id FROM rehab_demo.program_patients WHERE id = p_pp)
      )
  );
END;
$$;

-- Enable RLS on sensitive tables (demo policies)
ALTER TABLE rehab_demo.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehab_demo.goal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehab_demo.program_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehab_demo.cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS goals_select ON rehab_demo.goals;
CREATE POLICY goals_select ON rehab_demo.goals
  FOR SELECT USING (rehab_demo.can_read_program_patient(program_patient_id));

DROP POLICY IF EXISTS goals_write ON rehab_demo.goals;
CREATE POLICY goals_write ON rehab_demo.goals
  FOR ALL USING (rehab_demo.can_write_program_patient(program_patient_id))
  WITH CHECK (rehab_demo.can_write_program_patient(program_patient_id));

DROP POLICY IF EXISTS goal_updates_select ON rehab_demo.goal_updates;
CREATE POLICY goal_updates_select ON rehab_demo.goal_updates
  FOR SELECT USING (
    rehab_demo.can_read_program_patient(
      (SELECT program_patient_id FROM rehab_demo.goals WHERE id = goal_id)
    )
  );

DROP POLICY IF EXISTS pp_select ON rehab_demo.program_patients;
CREATE POLICY pp_select ON rehab_demo.program_patients
  FOR SELECT USING (rehab_demo.can_read_program_patient(id));

DROP POLICY IF EXISTS cases_select ON rehab_demo.cases;
CREATE POLICY cases_select ON rehab_demo.cases
  FOR SELECT USING (rehab_demo.can_read_program_patient(program_patient_id));

-- Bypass for owner/migration role in demo: FORCE RLS off for table owner in PGlite tests
-- Tests set role context explicitly via set_config.
