import { beforeEach, describe, expect, it } from 'vitest'
import {
  RehabWorkflowError,
  addBankStageViaNewVersion,
  addComment,
  addObservation,
  clearTaskRehabOnMemberChange,
  closePersonalGoal,
  createRehabVisit,
  getGoal,
  getStagesForGoal,
  getTaskRehab,
  listGoalsForMember,
  listStagesGroupedForMember,
  listTasksForStage,
  onTaskClosed,
  openPersonalGoal,
  resetRehabWorkflowStore,
  updateStageStatus,
  validateAndSetTaskRehab,
} from './store'

const matam = {
  id: 'u-nir',
  nameHe: 'ניר נ.',
  role: 'matam' as const,
  writableMemberIds: [] as string[],
  readableMemberIds: [] as string[],
}

beforeEach(() => {
  resetRehabWorkflowStore()
})

describe('portal rehab workflow service', () => {
  it('W01 creates personal goal atomically with stages', () => {
    const g = openPersonalGoal({
      actor: matam,
      portalMemberId: 'm-levi-1',
      portalUnitId: 'unit-levi',
      personId: 'person-yoav',
      templateId: 'gt-employ',
    })
    const stages = getStagesForGoal(g.id)
    expect(stages).toHaveLength(5)
    expect(g.pinnedTemplateVersion).toBe(1)
    expect(g.portalMemberId).toBe('m-levi-1')
  })

  it('W02 lists only the selected member stages', () => {
    const dan = listStagesGroupedForMember('m-miz-1', { includeInactive: true })
    const noa = listStagesGroupedForMember('m-cohen-2', { includeInactive: true })
    expect(dan.length).toBe(2)
    expect(noa.length).toBe(1)
    const danIds = new Set(dan.flatMap((x) => x.stages.map((s) => s.id)))
    for (const g of noa) {
      for (const s of g.stages) expect(danIds.has(s.id)).toBe(false)
    }
  })

  it('W03/W04 task primary + secondary integrity', () => {
    validateAndSetTaskRehab({
      actor: matam,
      taskId: 't-new-1',
      memberId: 'm-miz-1',
      activityAffiliation: 'rehab',
      rehabPrimaryStageId: 'ps-dan-e-2',
      secondaryStageIds: ['ps-dan-i-3'],
    })
    const meta = getTaskRehab('t-new-1')
    expect(meta.rehabPrimaryStageId).toBe('ps-dan-e-2')
    expect(meta.secondaryStageIds).toEqual(['ps-dan-i-3'])
    expect(listTasksForStage('ps-dan-e-2').some((x) => x.taskId === 't-new-1')).toBe(
      true,
    )
    expect(listTasksForStage('ps-dan-i-3').some((x) => x.taskId === 't-new-1')).toBe(
      true,
    )
  })

  it('W05 member change clears prior rehab selection', () => {
    validateAndSetTaskRehab({
      actor: matam,
      taskId: 't-chg',
      memberId: 'm-miz-1',
      activityAffiliation: 'rehab',
      rehabPrimaryStageId: 'ps-dan-e-2',
    })
    clearTaskRehabOnMemberChange('t-chg')
    const meta = getTaskRehab('t-chg')
    expect(meta.rehabPrimaryStageId).toBeUndefined()
    expect(meta.secondaryStageIds).toEqual([])
  })

  it('W06/W07 visit links without duplicating visit', () => {
    const v = createRehabVisit({
      actor: matam,
      portalMemberId: 'm-miz-1',
      portalUnitId: 'unit-mizrahi',
      personId: 'person-daniel',
      activityAffiliation: 'rehab',
      rehabPrimaryStageId: 'ps-dan-i-2',
      secondaryStageIds: ['ps-dan-e-2'],
      summaryHe: 'ביקור בדיקה',
    })
    expect(v.id).toBeTruthy()
    expect(v.secondaryStageIds).toHaveLength(1)
  })

  it('W08 observation + comment', () => {
    const obs = addObservation({
      actor: matam,
      stageId: 'ps-dan-e-2',
      kind: 'progress',
      bodyHe: 'תצפית בדיקה',
    })
    const c = addComment({
      actor: matam,
      observationId: obs.id,
      bodyHe: 'תגובת מת״ם',
    })
    expect(c.observationId).toBe(obs.id)
  })

  it('W09 task close does not complete stage', () => {
    const before = getStagesForGoal('pg-dan-emp').find((s) => s.id === 'ps-dan-e-2')
    expect(before?.status).toBe('in_progress')
    onTaskClosed('t-rehab-dual')
    const after = getStagesForGoal('pg-dan-emp').find((s) => s.id === 'ps-dan-e-2')
    expect(after?.status).toBe('in_progress')
  })

  it('W10 rejects linking another person stage', () => {
    expect(() =>
      validateAndSetTaskRehab({
        actor: matam,
        taskId: 't-bad',
        memberId: 'm-miz-1',
        activityAffiliation: 'rehab',
        rehabPrimaryStageId: 'ps-noa-s-1',
      }),
    ).toThrow(RehabWorkflowError)
  })

  it('W11 close goal with outcome', () => {
    closePersonalGoal({
      actor: matam,
      goalId: 'pg-noa-soc',
      outcome: 'partial',
      summaryHe: 'סיום חלקי דמה',
    })
    const g = getGoal('pg-noa-soc')
    expect(g?.mgmtStatus).toBe('completed')
    expect(g?.outcome).toBe('partial')
    expect(g?.completedAt).toBeTruthy()
  })

  it('W12 bank version change does not alter personal stages', () => {
    const before = getStagesForGoal('pg-dan-emp').length
    const pinned = getGoal('pg-dan-emp')!.pinnedTemplateVersion
    addBankStageViaNewVersion({
      templateId: 'gt-employ',
      code: 'E99',
      nameHe: 'שלב בנק חדש',
    })
    expect(getGoal('pg-dan-emp')!.pinnedTemplateVersion).toBe(pinned)
    expect(getStagesForGoal('pg-dan-emp')).toHaveLength(before)
  })

  it('W13 routine switch requires confirm', () => {
    validateAndSetTaskRehab({
      actor: matam,
      taskId: 't-sw',
      memberId: 'm-miz-1',
      activityAffiliation: 'rehab',
      rehabPrimaryStageId: 'ps-dan-e-2',
    })
    expect(() =>
      validateAndSetTaskRehab({
        actor: matam,
        taskId: 't-sw',
        memberId: 'm-miz-1',
        activityAffiliation: 'routine',
      }),
    ).toThrow(/אישור/)
    validateAndSetTaskRehab({
      actor: matam,
      taskId: 't-sw',
      memberId: 'm-miz-1',
      activityAffiliation: 'routine',
      confirmClearLinks: true,
    })
    expect(getTaskRehab('t-sw').activityAffiliation).toBe('routine')
  })

  it('W14 completed stage retains observations', () => {
    const stages = getStagesForGoal('pg-dan-emp')
    expect(stages.find((s) => s.id === 'ps-dan-e-1')?.status).toBe('completed')
  })

  it('blocks sequential start without prior completion', () => {
    expect(() =>
      updateStageStatus({
        actor: matam,
        stageId: 'ps-dan-e-3',
        toStatus: 'in_progress',
      }),
    ).toThrow(/עוקבת/)
  })

  it('blocks duplicate active goal same template', () => {
    expect(() =>
      openPersonalGoal({
        actor: matam,
        portalMemberId: 'm-miz-1',
        portalUnitId: 'unit-mizrahi',
        personId: 'person-daniel',
        templateId: 'gt-employ',
      }),
    ).toThrow(RehabWorkflowError)
  })

  it('lists Daniel goals', () => {
    expect(listGoalsForMember('m-miz-1')).toHaveLength(2)
  })
})
