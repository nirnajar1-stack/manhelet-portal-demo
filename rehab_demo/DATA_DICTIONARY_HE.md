# מילון נתונים — מודל שיקום (rehab_demo)

מוסכמות: UUID כ־PK; `timestamptz`; מזהי דמה בלבד (`DEMO-########`); סכמה מבודדת `rehab_demo`.

## שכבה 1 — אנשים ומשקי בית

| טבלה | שדות עיקריים | כללים |
|------|---------------|--------|
| `persons` | `demo_national_id`, `full_name_he` | מזהה דמה בפורמט קבוע |
| `households` | `household_code`, `display_name_he`, `status` | יחידת משפחה/משק בית |
| `household_members` | `member_role`, `is_primary` | N:M; ראשי אחד פעיל לכל משק בית |

## שכבה 2 — תבניות וגרסאות

| טבלה | שדות עיקריים | כללים |
|------|---------------|--------|
| `program_templates` | `code`, `default_kind` | משפחת תבנית |
| `template_versions` | `version_number`, `status` | draft → published → retired; published בלתי ניתן לשינוי |
| `template_phases` | `seq`, `code` | נעולים לאחר publish |
| `template_goals` | `code`, `default_weight` | תבנית ליעדי רישום |

## שכבה 3 — תוכניות ומשתתפים

| טבלה | שדות עיקריים | כללים |
|------|---------------|--------|
| `programs` | `kind`, `status`, `pinned_version_id` | open מחייב pin לגרסה published |
| **`program_patients`** | `program_id`, `person_id`, `personal_pct` | **ישות מרכזית**; ייחודיות זוג; כפל פעיל לאותה תבנית נחסם |
| `program_periods` | `seq`, `group_pct` | מחזור תפעולי |
| `program_phases` | `template_phase_id` | חייב להתאים לגרסה הנעולה |

## שכבה 4 — יעדים והתקדמות

| טבלה | שדות עיקריים | כללים |
|------|---------------|--------|
| `goals` | `program_patient_id`, `progress_pct`, `weight` | תמיד על PP |
| `goal_updates` | `note_he`, `progress_pct` | מסנכרן יעד + כותב audit |
| `progress_snapshots` | `scope` personal/group | group ללא `program_patient_id` |

## שכבה 5 — מפגשים / משימות / תיקים

| טבלה | שדות עיקריים | כללים |
|------|---------------|--------|
| `sessions` | `scheduled_at`, `is_group` | שייך לתוכנית |
| `session_attendance` | `attended` | PP חייב להיות מאותה תוכנית |
| `tasks` | `goal_id` אופציונלי | יעד ⇒ אותו PP |
| `cases` | `case_code` | תיק תפעולי על PP |

## שכבה 6 — צוות, גישה, ביקורת

| טבלה | שדות עיקריים | כללים |
|------|---------------|--------|
| `actors` | `access_role` | matam/companion/patient/guardian/gov/… |
| `companions` | `specialty_he` | פרופיל מלווה |
| `program_team_members` | `team_role` | שיבוץ לצוות תוכנית |
| `access_grants` | `scope`, `can_read/write` | **מפורש**; לא נגזר מחברות במשק בית |
| `person_actor_links` | קישור מטופל↔actor | לפורטל מטופל |
| `audit_log` | `action`, `payload` | נספח |

## מטא־דמו

| טבלה | תפקיד |
|------|--------|
| `scenarios` | קטלוג תרחישים 1–20 |
| `scenario_results` | תוצאות אימות Expected/Actual |
