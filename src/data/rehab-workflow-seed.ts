import type {
  PersonalStageStatus,
  RehabGoalTemplate,
  RehabPersonalGoal,
  RehabPersonalStage,
  RehabStageComment,
  RehabStageObservation,
  RehabStageTemplate,
  RehabVisitRecord,
  RehabWorkflowState,
} from '@/types/rehab-workflow'

const T_EMPLOY = 'gt-employ'
const T_INDEP = 'gt-indep'
const T_SOCIAL = 'gt-social'

const PG_DAN_EMP = 'pg-dan-emp'
const PG_DAN_IND = 'pg-dan-ind'
const PG_NOA_SOC = 'pg-noa-soc'

function stageTemplates(): RehabStageTemplate[] {
  const employ = [
    ['E1', 'הערכת צרכים וכישורים', 'מיפוי ראשוני'],
    ['E2', 'בניית תוכנית תעסוקתית', 'יעדים ומסלול'],
    ['E3', 'הכשרה מקצועית', 'הכשרה/קורס'],
    ['E4', 'השמה בעבודה', 'חיבור למעסיק'],
    ['E5', 'מעקב אחר השתלבות', 'ליווי לאחר השמה'],
  ] as const
  const indep = [
    ['I1', 'הערכת מצב תפקודי', 'הערכה ראשונית'],
    ['I2', 'זיהוי תחומים לשיפור', 'מיקוד פעולה'],
    ['I3', 'בניית תוכנית פעולה', 'תוכנית מותאמת'],
    ['I4', 'יישום וליווי', 'ליווי בשטח'],
    ['I5', 'הערכת התקדמות', 'סיכום מחזור'],
  ] as const
  const social = [
    ['S1', 'מיפוי קשרים קיימים', ''],
    ['S2', 'השתתפות בפעילות קבוצתית', ''],
    ['S3', 'חיבור למשאב קהילתי', ''],
  ] as const

  return [
    ...employ.map((e, i) => ({
      id: `bst-e-${i + 1}`,
      goalTemplateId: T_EMPLOY,
      versionNumber: 1,
      seq: i + 1,
      code: e[0],
      nameHe: e[1],
      descriptionHe: e[2],
      isMandatory: true,
      typicalDays: 14 + i * 7,
    })),
    ...indep.map((e, i) => ({
      id: `bst-i-${i + 1}`,
      goalTemplateId: T_INDEP,
      versionNumber: 1,
      seq: i + 1,
      code: e[0],
      nameHe: e[1],
      descriptionHe: e[2],
      isMandatory: true,
      typicalDays: 10 + i * 5,
    })),
    ...social.map((e, i) => ({
      id: `bst-s-${i + 1}`,
      goalTemplateId: T_SOCIAL,
      versionNumber: 1,
      seq: i + 1,
      code: e[0],
      nameHe: e[1],
      descriptionHe: e[2] || undefined,
      isMandatory: i !== 1,
      typicalDays: 14,
    })),
  ]
}

function personalStages(): RehabPersonalStage[] {
  const bank = stageTemplates()
  const mk = (goalId: string, tmplId: string, prefix: string): RehabPersonalStage[] =>
    bank
      .filter((b) => b.goalTemplateId === tmplId && b.versionNumber === 1)
      .map((b) => ({
        id: `${prefix}-${b.seq}`,
        personalGoalId: goalId,
        stageTemplateId: b.id,
        seq: b.seq,
        nameHe: b.nameHe,
        descriptionHe: b.descriptionHe,
        isMandatory: b.isMandatory,
        typicalDays: b.typicalDays,
        status: 'not_started' as PersonalStageStatus,
        ownerNameHe: 'ניר נ.',
      }))

  const danEmp = mk(PG_DAN_EMP, T_EMPLOY, 'ps-dan-e')
  danEmp[0] = {
    ...danEmp[0],
    status: 'completed' as PersonalStageStatus,
    startDate: '2026-09-20',
    completedAt: '2026-10-10T10:00:00.000Z',
    lastActivityAt: '2026-10-10T10:00:00.000Z',
  }
  danEmp[1] = {
    ...danEmp[1],
    status: 'in_progress' as PersonalStageStatus,
    startDate: '2026-10-12',
    lastActivityAt: '2026-11-06T09:00:00.000Z',
  }

  const danInd = mk(PG_DAN_IND, T_INDEP, 'ps-dan-i')
  danInd[0] = {
    ...danInd[0],
    status: 'completed' as PersonalStageStatus,
    startDate: '2026-09-28',
    completedAt: '2026-10-15T10:00:00.000Z',
    lastActivityAt: '2026-10-15T10:00:00.000Z',
  }
  danInd[1] = {
    ...danInd[1],
    status: 'in_progress' as PersonalStageStatus,
    startDate: '2026-10-18',
    lastActivityAt: '2026-11-05T12:00:00.000Z',
  }

  return [...danEmp, ...danInd, ...mk(PG_NOA_SOC, T_SOCIAL, 'ps-noa-s')]
}

export function createInitialRehabWorkflowSeed(): RehabWorkflowState {
  const templates: RehabGoalTemplate[] = [
    {
      id: T_EMPLOY,
      code: 'EMPLOY-INT',
      nameHe: 'השתלבות בתעסוקה',
      domain: 'employment',
      descriptionHe: 'ליווי להשתלבות תעסוקתית הדרגתית',
      guidelinesHe: 'דמה מקצועית בלבד — לא סל שיקום מחייב',
      executionMode: 'sequential',
      status: 'active',
      currentVersion: 1,
    },
    {
      id: T_INDEP,
      code: 'INDEPEND',
      nameHe: 'חיזוק עצמאות אישית',
      domain: 'daily_function',
      descriptionHe: 'חיזוק תפקוד יומיומי ועצמאות',
      executionMode: 'sequential',
      status: 'active',
      currentVersion: 1,
    },
    {
      id: T_SOCIAL,
      code: 'SOCIAL-NET',
      nameHe: 'חיזוק קשרים חברתיים',
      domain: 'social',
      descriptionHe: 'בניית רשת תמיכה חברתית',
      executionMode: 'parallel',
      status: 'active',
      currentVersion: 1,
    },
  ]

  const goals: RehabPersonalGoal[] = [
    {
      id: PG_DAN_EMP,
      personId: 'person-daniel',
      portalMemberId: 'm-miz-1',
      portalUnitId: 'unit-mizrahi',
      goalTemplateId: T_EMPLOY,
      pinnedTemplateVersion: 1,
      nameHe: 'השתלבות בתעסוקה',
      domain: 'employment',
      executionMode: 'sequential',
      mgmtStatus: 'active',
      ownerNameHe: 'ניר נ.',
      startDate: '2026-09-20',
      targetDate: '2027-01-20',
      notesHe: 'מחזור ראשון — דמה',
      cycleNumber: 1,
      createdAt: '2026-09-20T08:00:00.000Z',
      updatedAt: '2026-11-06T09:00:00.000Z',
    },
    {
      id: PG_DAN_IND,
      personId: 'person-daniel',
      portalMemberId: 'm-miz-1',
      portalUnitId: 'unit-mizrahi',
      goalTemplateId: T_INDEP,
      pinnedTemplateVersion: 1,
      nameHe: 'חיזוק עצמאות אישית',
      domain: 'daily_function',
      executionMode: 'sequential',
      mgmtStatus: 'active',
      ownerNameHe: 'יואב מלווה',
      startDate: '2026-09-28',
      targetDate: '2026-12-28',
      cycleNumber: 1,
      createdAt: '2026-09-28T08:00:00.000Z',
      updatedAt: '2026-11-05T12:00:00.000Z',
    },
    {
      id: PG_NOA_SOC,
      personId: 'person-noa',
      portalMemberId: 'm-cohen-2',
      portalUnitId: 'unit-cohen',
      goalTemplateId: T_SOCIAL,
      pinnedTemplateVersion: 1,
      nameHe: 'חיזוק קשרים חברתיים',
      domain: 'social',
      executionMode: 'parallel',
      mgmtStatus: 'active',
      ownerNameHe: 'ניר נ.',
      startDate: '2026-10-20',
      cycleNumber: 1,
      createdAt: '2026-10-20T08:00:00.000Z',
      updatedAt: '2026-10-20T08:00:00.000Z',
    },
  ]

  const observations: RehabStageObservation[] = [
    {
      id: 'obs-1',
      personalStageId: 'ps-dan-e-1',
      kind: 'progress',
      bodyHe:
        'דניאל השלים מיפוי כישורים ראשוני. זוהו תחומי עניין בתחזוקה ובלוגיסטיקה.',
      observedAt: '2026-10-10T10:00:00.000Z',
      authorActorId: 'u-yael',
      authorNameHe: 'יואב מלווה',
      visibility: 'internal',
      createdAt: '2026-10-10T10:00:00.000Z',
    },
    {
      id: 'obs-2',
      personalStageId: 'ps-dan-e-2',
      kind: 'blocker',
      bodyHe: 'חסם תיאום מול מרכז הכשרה — ממתין לאישור תקציבי דמה.',
      observedAt: '2026-11-06T09:00:00.000Z',
      authorActorId: 'u-yael',
      authorNameHe: 'יואב מלווה',
      visibility: 'internal',
      createdAt: '2026-11-06T09:00:00.000Z',
    },
  ]

  const comments: RehabStageComment[] = [
    {
      id: 'cmt-1',
      observationId: 'obs-2',
      bodyHe: 'מת״ם: נבדוק מול גורם ההכשרה השבוע ונדאג למסמך דמה.',
      authorActorId: 'u-nir',
      authorNameHe: 'ניר נ.',
      createdAt: '2026-11-07T08:00:00.000Z',
    },
  ]

  const visits: RehabVisitRecord[] = [
    {
      id: 'rv-1',
      primaryPersonId: 'person-daniel',
      portalMemberId: 'm-miz-1',
      portalUnitId: 'unit-mizrahi',
      activityAffiliation: 'rehab',
      rehabPrimaryStageId: 'ps-dan-i-2',
      visitDate: '2026-11-05',
      visitTypeHe: 'ביקור בית',
      status: 'completed',
      summaryHe: 'בוצעה הערכת תפקוד ושיחה קצרה על תעסוקה.',
      performedByNameHe: 'יואב מלווה',
      participantMemberIds: ['m-miz-1', 'm-miz-2'],
      secondaryStageIds: ['ps-dan-e-2'],
      createdAt: '2026-11-05T14:00:00.000Z',
    },
  ]

  return {
    templates,
    stageTemplates: stageTemplates(),
    goals,
    stages: personalStages(),
    observations,
    comments,
    stageEvents: [
      {
        id: 'se-1',
        personalStageId: 'ps-dan-e-1',
        fromStatus: 'in_progress',
        toStatus: 'completed',
        actorNameHe: 'יואב מלווה',
        occurredAt: '2026-10-10T10:00:00.000Z',
      },
      {
        id: 'se-2',
        personalStageId: 'ps-dan-e-2',
        fromStatus: 'not_started',
        toStatus: 'in_progress',
        actorNameHe: 'יואב מלווה',
        occurredAt: '2026-10-12T09:00:00.000Z',
      },
    ],
    goalEvents: [
      {
        id: 'ge-1',
        personalGoalId: PG_DAN_EMP,
        toStatus: 'active',
        actorNameHe: 'ניר נ.',
        reasonHe: 'פתיחת מטרת שיקום אישית',
        occurredAt: '2026-09-20T08:00:00.000Z',
      },
    ],
    visits,
    taskSecondaryLinks: {
      't-rehab-dual': ['ps-dan-i-3'],
    },
    taskRehab: {
      't-rehab-dual': {
        activityAffiliation: 'rehab',
        rehabPrimaryStageId: 'ps-dan-e-2',
        memberId: 'm-miz-1',
      },
    },
    actors: [
      {
        id: 'u-nir',
        nameHe: 'ניר נ.',
        role: 'matam',
        writableMemberIds: [],
        readableMemberIds: [],
      },
      {
        id: 'u-yael',
        nameHe: 'יעל ר.',
        role: 'matam',
        writableMemberIds: [],
        readableMemberIds: [],
      },
      {
        id: 'u-dana',
        nameHe: 'דנה מ.',
        role: 'companion',
        writableMemberIds: ['m-miz-1', 'm-cohen-2', 'm-cohen-1'],
        readableMemberIds: ['m-miz-1', 'm-cohen-2', 'm-cohen-1', 'm-miz-2'],
      },
    ],
  }
}

/** Portal personId helper for openPersonalGoal. */
export const portalMemberPersonId: Record<string, string> = {
  'm-miz-1': 'person-daniel',
  'm-miz-2': 'person-ruth',
  'm-cohen-1': 'person-uri',
  'm-cohen-2': 'person-noa',
  'm-levi-1': 'person-yoav',
  'm-levi-2': 'person-michal-levi',
}
