-- Personal rehab workflow seed (fictional). Depends on 001_seed persons/actors/PP.
-- Demo heroes: דניאל מזרחי (portal m-miz-1), נועה כהן (portal m-cohen-2).

BEGIN;

-- Ensure Daniel exists as distinct demo person (portal family member)
INSERT INTO rehab_demo.persons (id, demo_national_id, full_name_he, birth_date, email_demo)
VALUES (
  'a0000000-0000-4000-8000-000000000021', 'DEMO-10000021', 'דניאל מזרחי', '1994-05-17',
  'daniel.mizrahi@demo.example'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO rehab_demo.household_members (id, household_id, person_id, member_role, is_primary)
VALUES (
  'a0000000-0000-4000-8000-110000000021',
  'a0000000-0000-4000-8000-100000000003', -- HH-MIZRAHI
  'a0000000-0000-4000-8000-000000000021',
  'returnee',
  false
)
ON CONFLICT (household_id, person_id) DO NOTHING;

-- Portal bridge
INSERT INTO rehab_demo.portal_person_map (portal_member_id, portal_unit_id, person_id, display_name_he) VALUES
  ('m-miz-1', 'unit-mizrahi', 'a0000000-0000-4000-8000-000000000021', 'דניאל מזרחי'),
  ('m-miz-2', 'unit-mizrahi', 'a0000000-0000-4000-8000-000000000007', 'רות מזרחי'),
  ('m-cohen-1', 'unit-cohen', 'a0000000-0000-4000-8000-000000000001', 'אורי/יוסי כהן'),
  ('m-cohen-2', 'unit-cohen', 'a0000000-0000-4000-8000-000000000003', 'נועה כהן'),
  ('m-levi-1', 'unit-levi', 'a0000000-0000-4000-8000-000000000004', 'יואב/דני לוי'),
  ('m-levi-2', 'unit-levi', 'a0000000-0000-4000-8000-000000000005', 'מיכל/רותם לוי')
ON CONFLICT (portal_member_id) DO NOTHING;

-- Goal bank templates (version 1) — insert as draft, add stages, then activate
INSERT INTO rehab_demo.rehab_goal_templates (
  id, code, name_he, domain, description_he, guidelines_he, execution_mode, status, current_version
) VALUES
  (
    'b0000000-0000-4000-8000-800000000001', 'EMPLOY-INT', 'השתלבות בתעסוקה', 'employment',
    'ליווי להשתלבות תעסוקתית הדרגתית', 'דמה מקצועית בלבד — לא סל שיקום מחייב',
    'sequential', 'draft', 1
  ),
  (
    'b0000000-0000-4000-8000-800000000002', 'INDEPEND', 'חיזוק עצמאות אישית', 'daily_function',
    'חיזוק תפקוד יומיומי ועצמאות', 'דמה מקצועית בלבד',
    'sequential', 'draft', 1
  ),
  (
    'b0000000-0000-4000-8000-800000000003', 'SOCIAL-NET', 'חיזוק קשרים חברתיים', 'social',
    'בניית רשת תמיכה חברתית', 'דמה',
    'parallel', 'draft', 1
  );

-- Employment stages v1
INSERT INTO rehab_demo.rehab_stage_templates (
  id, goal_template_id, version_number, seq, code, name_he, description_he, is_mandatory, typical_days
) VALUES
  ('b0000000-0000-4000-8000-810000000001', 'b0000000-0000-4000-8000-800000000001', 1, 1, 'E1', 'הערכת צרכים וכישורים', 'מיפוי ראשוני', true, 14),
  ('b0000000-0000-4000-8000-810000000002', 'b0000000-0000-4000-8000-800000000001', 1, 2, 'E2', 'בניית תוכנית תעסוקתית', 'יעדים ומסלול', true, 21),
  ('b0000000-0000-4000-8000-810000000003', 'b0000000-0000-4000-8000-800000000001', 1, 3, 'E3', 'הכשרה מקצועית', 'הכשרה/קורס', true, 60),
  ('b0000000-0000-4000-8000-810000000004', 'b0000000-0000-4000-8000-800000000001', 1, 4, 'E4', 'השמה בעבודה', 'חיבור למעסיק', true, 30),
  ('b0000000-0000-4000-8000-810000000005', 'b0000000-0000-4000-8000-800000000001', 1, 5, 'E5', 'מעקב אחר השתלבות', 'ליווי לאחר השמה', true, 45);

-- Independence stages v1
INSERT INTO rehab_demo.rehab_stage_templates (
  id, goal_template_id, version_number, seq, code, name_he, description_he, is_mandatory, typical_days
) VALUES
  ('b0000000-0000-4000-8000-820000000001', 'b0000000-0000-4000-8000-800000000002', 1, 1, 'I1', 'הערכת מצב תפקודי', 'הערכה ראשונית', true, 10),
  ('b0000000-0000-4000-8000-820000000002', 'b0000000-0000-4000-8000-800000000002', 1, 2, 'I2', 'זיהוי תחומים לשיפור', 'מיקוד פעולה', true, 14),
  ('b0000000-0000-4000-8000-820000000003', 'b0000000-0000-4000-8000-800000000002', 1, 3, 'I3', 'בניית תוכנית פעולה', 'תוכנית מותאמת', true, 14),
  ('b0000000-0000-4000-8000-820000000004', 'b0000000-0000-4000-8000-800000000002', 1, 4, 'I4', 'יישום וליווי', 'ליווי בשטח', true, 45),
  ('b0000000-0000-4000-8000-820000000005', 'b0000000-0000-4000-8000-800000000002', 1, 5, 'I5', 'הערכת התקדמות', 'סיכום מחזור', true, 14);

-- Social stages v1 (parallel)
INSERT INTO rehab_demo.rehab_stage_templates (
  id, goal_template_id, version_number, seq, code, name_he, description_he, is_mandatory, typical_days
) VALUES
  ('b0000000-0000-4000-8000-830000000001', 'b0000000-0000-4000-8000-800000000003', 1, 1, 'S1', 'מיפוי קשרים קיימים', NULL, true, 7),
  ('b0000000-0000-4000-8000-830000000002', 'b0000000-0000-4000-8000-800000000003', 1, 2, 'S2', 'השתתפות בפעילות קבוצתית', NULL, false, 30),
  ('b0000000-0000-4000-8000-830000000003', 'b0000000-0000-4000-8000-800000000003', 1, 3, 'S3', 'חיבור למשאב קהילתי', NULL, true, 21);

UPDATE rehab_demo.rehab_goal_templates SET status = 'active' WHERE code IN ('EMPLOY-INT', 'INDEPEND', 'SOCIAL-NET');

-- Open two personal goals for Daniel (atomic)
SELECT rehab_demo.open_personal_goal(
  'b0000000-0000-4000-8000-900000000001',
  'a0000000-0000-4000-8000-000000000021',
  'b0000000-0000-4000-8000-800000000001',
  'a0000000-0000-4000-8000-200000000001', -- matam
  NULL,
  CURRENT_DATE - 40,
  CURRENT_DATE + 120,
  'מחזור ראשון — דמה',
  'm-miz-1',
  'unit-mizrahi',
  false
);

SELECT rehab_demo.open_personal_goal(
  'b0000000-0000-4000-8000-900000000002',
  'a0000000-0000-4000-8000-000000000021',
  'b0000000-0000-4000-8000-800000000002',
  'a0000000-0000-4000-8000-200000000002', -- companion
  NULL,
  CURRENT_DATE - 30,
  CURRENT_DATE + 90,
  'מקביל לתעסוקה',
  'm-miz-1',
  'unit-mizrahi',
  false
);

-- One goal for Noa (different person)
SELECT rehab_demo.open_personal_goal(
  'b0000000-0000-4000-8000-900000000003',
  'a0000000-0000-4000-8000-000000000003',
  'b0000000-0000-4000-8000-800000000003',
  'a0000000-0000-4000-8000-200000000001',
  NULL,
  CURRENT_DATE - 10,
  CURRENT_DATE + 60,
  NULL,
  'm-cohen-2',
  'unit-cohen',
  false
);

-- Progress Daniel employment: stage1 completed, stage2 in_progress
UPDATE rehab_demo.rehab_personal_stages
SET status = 'completed', start_date = CURRENT_DATE - 40, completed_at = now() - interval '20 days',
    last_activity_at = now() - interval '20 days'
WHERE personal_goal_id = 'b0000000-0000-4000-8000-900000000001' AND seq = 1;

UPDATE rehab_demo.rehab_personal_stages
SET status = 'in_progress', start_date = CURRENT_DATE - 18, last_activity_at = now() - interval '1 day'
WHERE personal_goal_id = 'b0000000-0000-4000-8000-900000000001' AND seq = 2;

UPDATE rehab_demo.rehab_personal_stages
SET status = 'completed', start_date = CURRENT_DATE - 30, completed_at = now() - interval '15 days',
    last_activity_at = now() - interval '15 days'
WHERE personal_goal_id = 'b0000000-0000-4000-8000-900000000002' AND seq = 1;

UPDATE rehab_demo.rehab_personal_stages
SET status = 'in_progress', start_date = CURRENT_DATE - 12, last_activity_at = now() - interval '2 days'
WHERE personal_goal_id = 'b0000000-0000-4000-8000-900000000002' AND seq = 2;

-- Fixed stage ids for linking (fetch via deterministic insert override — update known rows by seq)
-- Observations
INSERT INTO rehab_demo.rehab_stage_observations (
  id, personal_stage_id, kind, body_he, observed_at, author_actor_id, visibility
)
SELECT
  'b0000000-0000-4000-8000-940000000001',
  s.id,
  'progress',
  'דניאל השלים מיפוי כישורים ראשוני. זוהו תחומי עניין בתחזוקה ובלוגיסטיקה.',
  now() - interval '19 days',
  'a0000000-0000-4000-8000-200000000002',
  'internal'
FROM rehab_demo.rehab_personal_stages s
WHERE s.personal_goal_id = 'b0000000-0000-4000-8000-900000000001' AND s.seq = 1;

INSERT INTO rehab_demo.rehab_stage_observations (
  id, personal_stage_id, kind, body_he, observed_at, author_actor_id, visibility
)
SELECT
  'b0000000-0000-4000-8000-940000000002',
  s.id,
  'blocker',
  'חסם תיאום מול מרכז הכשרה — ממתין לאישור תקציבי דמה.',
  now() - interval '2 days',
  'a0000000-0000-4000-8000-200000000002',
  'internal'
FROM rehab_demo.rehab_personal_stages s
WHERE s.personal_goal_id = 'b0000000-0000-4000-8000-900000000001' AND s.seq = 2;

INSERT INTO rehab_demo.rehab_stage_comments (
  id, observation_id, body_he, author_actor_id, created_at
) VALUES (
  'b0000000-0000-4000-8000-950000000001',
  'b0000000-0000-4000-8000-940000000002',
  'מת״ם: נבדוק מול גורם ההכשרה השבוע ונדאג למסמך דמה.',
  'a0000000-0000-4000-8000-200000000001',
  now() - interval '1 day'
);

-- Rehab task linked to employment stage 2 (primary) + independence stage 3 (secondary)
INSERT INTO rehab_demo.tasks (
  id, program_id, program_patient_id, title_he, status, due_on,
  assignee_actor_id, activity_affiliation, rehab_primary_stage_id
)
SELECT
  'b0000000-0000-4000-8000-960000000001',
  'a0000000-0000-4000-8000-400000000001',
  NULL,
  'תיאום פגישה עם גורם תעסוקה',
  'open',
  CURRENT_DATE + 7,
  'a0000000-0000-4000-8000-200000000002',
  'rehab',
  s.id
FROM rehab_demo.rehab_personal_stages s
WHERE s.personal_goal_id = 'b0000000-0000-4000-8000-900000000001' AND s.seq = 2;

INSERT INTO rehab_demo.rehab_task_stage_links (task_id, personal_stage_id, link_role)
SELECT
  'b0000000-0000-4000-8000-960000000001',
  s.id,
  'secondary'
FROM rehab_demo.rehab_personal_stages s
WHERE s.personal_goal_id = 'b0000000-0000-4000-8000-900000000002' AND s.seq = 3;

-- Visit linked to independence stage 2
INSERT INTO rehab_demo.rehab_visits (
  id, primary_person_id, activity_affiliation, rehab_primary_stage_id,
  visit_date, visit_type_he, status, summary_he, performed_by_actor_id, portal_unit_id
)
SELECT
  'b0000000-0000-4000-8000-970000000001',
  'a0000000-0000-4000-8000-000000000021',
  'rehab',
  s.id,
  CURRENT_DATE - 3,
  'ביקור בית',
  'completed',
  'בוצעה הערכת תפקוד ושיחה קצרה על תעסוקה.',
  'a0000000-0000-4000-8000-200000000002',
  'unit-mizrahi'
FROM rehab_demo.rehab_personal_stages s
WHERE s.personal_goal_id = 'b0000000-0000-4000-8000-900000000002' AND s.seq = 2;

INSERT INTO rehab_demo.rehab_visit_participants (visit_id, person_id, is_primary) VALUES
  ('b0000000-0000-4000-8000-970000000001', 'a0000000-0000-4000-8000-000000000021', true),
  ('b0000000-0000-4000-8000-970000000001', 'a0000000-0000-4000-8000-000000000007', false);

-- Secondary visit link to employment stage 2 (same person Daniel — explicit)
INSERT INTO rehab_demo.rehab_visit_stage_links (visit_id, personal_stage_id, person_id, link_role)
SELECT
  'b0000000-0000-4000-8000-970000000001',
  s.id,
  'a0000000-0000-4000-8000-000000000021',
  'secondary'
FROM rehab_demo.rehab_personal_stages s
WHERE s.personal_goal_id = 'b0000000-0000-4000-8000-900000000001' AND s.seq = 2;

-- Workflow scenarios 21–35 (map to requirements §17)
INSERT INTO rehab_demo.scenarios (id, code, title_he, description_he, expected_he, layer, kind) VALUES
  (21, 'W01', 'יצירת מטרת שיקום אישית', 'open_personal_goal מתבנית', 'מטרה+שלבים לאדם הנכון', 4, 'positive'),
  (22, 'W02', 'שתי מטרות לאותו אדם', 'דניאל עם תעסוקה+עצמאות', 'סינון שלבים לפי אדם בלבד', 4, 'positive'),
  (23, 'W03', 'משימה לשלב ראשי', 'קישור משימה לשלב', 'מופיעה במשימות ובתחתית השלב', 5, 'positive'),
  (24, 'W04', 'משימה דו-שלבית', 'ראשי+משני', 'נספרת פעם אחת לפי ראשי', 5, 'positive'),
  (25, 'W05', 'שינוי בן משפחה מאפס בחירה', 'החלפת אדם במשימה', 'איפוס קישורי שיקום', 5, 'negative'),
  (26, 'W06', 'ביקור שיקומי', 'ביקור עם שלב ראשי', 'מופיע תחת השלב', 5, 'positive'),
  (27, 'W07', 'ביקור רב-שלבי', 'ראשי+משני', 'ללא כפילות ביקור', 5, 'positive'),
  (28, 'W08', 'תצפית ודיון', 'תצפית+תגובת מת״ם', 'שרשור עם זהויות', 4, 'positive'),
  (29, 'W09', 'סגירת משימה לא סוגרת שלב', 'task done', 'שלב נשאר in_progress', 5, 'positive'),
  (30, 'W10', 'קישור לשלב של אדם אחר נדחה', 'דניאל+שלב נועה', 'check_violation', 5, 'negative'),
  (31, 'W11', 'סיום מטרת שיקום', 'השלמת מטרה+outcome', 'completed_at+outcome נשמרים', 4, 'positive'),
  (32, 'W12', 'שינוי תבנית בבנק לא משנה אישי', 'גרסה חדשה בבנק', 'pinned_version נשאר', 2, 'positive'),
  (33, 'W13', 'שינוי סוג פעילות לשוטף', 'הסרת קישורים', 'affiliation=routine ללא שלב', 5, 'positive'),
  (34, 'W14', 'שלב שהושלם שומר קישורים', 'completed stage', 'משימות/תצפיות נשארות', 4, 'positive'),
  (35, 'W15', 'ביקור רב-משתתפים ללא קישור אוטומטי', 'שני בני משפחה', 'אין auto-link לכל המטרות', 5, 'positive')
ON CONFLICT (id) DO NOTHING;

COMMIT;
