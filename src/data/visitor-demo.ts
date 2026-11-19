/**
 * Visitor / inspector demo narrative — fictional Hebrew content only.
 * Anchors the living walkthrough around משפחת מזרחי / דניאל.
 */

export const VISITOR_UNIT_ID = 'unit-mizrahi'
export const VISITOR_MEMBER_ID = 'm-miz-1'
export const VISITOR_GOAL_ID = 'pg-dan-emp'
export const VISITOR_ACTIVE_STAGE_ID = 'ps-dan-e-2'

/** Short outcome lines shown on completed stages in the journey hero. */
export const stageOutcomeCaptionsHe: Record<string, string> = {
  'ps-dan-e-1': 'מיפוי כישורים הושלם · עניין בתחזוקה ולוגיסטיקה',
  'ps-dan-i-1': 'הערכת תפקוד ראשונית · בסיס לתוכנית עצמאות',
}

/** Narrative blurb on the rehab tab for the hero person. */
export const visitorStoryBlurbHe =
  'דניאל במחזור שיקום ראשון: מטרת תעסוקה פעילה (שלב 2 מתוך 5) ומטרת עצמאות במקביל. הצוות מתעד תצפיות, משימות וביקורים מקושרים לשלב — כך שהמת״ם רואה חסמים והתקדמות בזמן אמת.'

export interface VisitorTourStop {
  id: string
  titleHe: string
  captionHe: string
  /** What the organization gains — not UI chrome. */
  gainHe: string
  path: string
}

export const visitorTourStops: VisitorTourStop[] = [
  {
    id: 'home',
    titleHe: 'בית המת״ם',
    captionHe: 'סביבת העבודה היומית — מה דורש טיפול עכשיו.',
    gainHe:
      'הארגון רואה חסמים וחריגות ביום הראשון: משפחת מזרחי מופיעה כדורשת התייחסות, עם משימות ומענה מהשטח.',
    path: '/?tour=1&tourStep=0',
  },
  {
    id: 'case',
    titleHe: 'תיק היחידה',
    captionHe: 'משפחת מזרחי — הקשר המשפחתי והפעילות במקום אחד.',
    gainHe:
      'תיק חי: בני משפחה, משימות פתוחות ופעילות אחרונה — בלי לעבור בין מערכות.',
    path: `/units/${VISITOR_UNIT_ID}?tour=1&tourStep=1`,
  },
  {
    id: 'rehab',
    titleHe: 'תהליך השיקום',
    captionHe: 'מטרות אישיות לדניאל — תעסוקה ועצמאות.',
    gainHe:
      'שיקום אישי בתוך התיק: מטרות פעילות, שלבים בביצוע ופעילויות לטיפול — סיפור אחד ולא רשימת הערות.',
    path: `/units/${VISITOR_UNIT_ID}?tab=rehab&tour=1&tourStep=2`,
  },
  {
    id: 'journey',
    titleHe: 'מסע השלבים',
    captionHe: 'השתלבות בתעסוקה — שלב אחר שלב, עם דגש על השלב הפעיל.',
    gainHe:
      'המבקר רואה מסלול ברור: מה הושלם, איפה עומדים, ומה הצעד הבא — כולל חסם תיאום מול הכשרה.',
    path: `/rehab/goals/${VISITOR_GOAL_ID}?stage=${VISITOR_ACTIVE_STAGE_ID}&tour=1&tourStep=3`,
  },
  {
    id: 'activity',
    titleHe: 'תצפית ומשימה',
    captionHe: 'חוט פעילות בשלב הפעיל — תצפיות, תגובות ומשימה מקושרת.',
    gainHe:
      'השטח והמשרד באותה שיחה: תצפית על חסם, תגובת מת״ם, ומשימת תיאום כפעילות שיקומית.',
    path: `/rehab/goals/${VISITOR_GOAL_ID}?stage=${VISITOR_ACTIVE_STAGE_ID}&tab=activity&tour=1&tourStep=4`,
  },
]

export function parseTourStep(raw: string | null): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.min(Math.floor(n), visitorTourStops.length - 1)
}
