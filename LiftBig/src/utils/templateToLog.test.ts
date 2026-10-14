import { describe, expect, it } from 'vitest'
import { JOEY_C4_PLANS } from '@/utils/joeyC4'
import { groupExercisesForDisplay } from '@/utils/supersetUtils'
import {
  cloneTemplateToExercises,
  separateRepeatedSupersetGroups,
  withUniqueExerciseIds,
} from '@/utils/templateToLog'

describe('stacked plan exercise ids', () => {
  it('gives each copied plan its own superset ids', () => {
    const lower = JOEY_C4_PLANS.find((plan) => plan.id === 'plan-joey-c4-tue')
    const school = JOEY_C4_PLANS.find((plan) => plan.id === 'plan-joey-c4-school-d')
    expect(lower).toBeTruthy()
    expect(school).toBeTruthy()

    const lowerCopy = cloneTemplateToExercises(lower!)
    const schoolCopy = cloneTemplateToExercises(school!)
    const lowerAgain = cloneTemplateToExercises(lower!)
    const groupsOf = (list: { supersetGroupId?: string }[]) =>
      new Set(list.map((ex) => ex.supersetGroupId).filter((id): id is string => Boolean(id)))
    const lowerGroups = groupsOf(lowerCopy)
    const schoolGroups = groupsOf(schoolCopy)
    expect(lowerGroups.size).toBe(3)
    expect(schoolGroups.size).toBe(2)
    for (const id of lowerGroups) {
      expect(schoolGroups.has(id)).toBe(false)
      expect(groupsOf(lowerAgain).has(id)).toBe(false)
    }

    const combined = [...lowerCopy, ...schoolCopy]
    const blocks = groupExercisesForDisplay(combined).filter((item) => item.kind === 'superset')
    const blockKeys = blocks.map((item) =>
      item.kind === 'superset' ? `${item.groupId}-${item.exercises[0]?.id}` : '',
    )
    expect(new Set(blockKeys).size).toBe(blockKeys.length)
    expect(blocks).toHaveLength(5)
  })

  it('splits a superset id that shows up again later in the day', () => {
    const pair = cloneTemplateToExercises(
      JOEY_C4_PLANS.find((plan) => plan.id === 'plan-joey-c4-school-d')!,
    )
    const shared = 'same-group'
    const stacked = [
      ...pair.slice(0, 2).map((ex) => ({ ...ex, supersetGroupId: shared })),
      { ...pair[2]!, id: 'gap', supersetGroupId: undefined, sets: pair[2]!.sets },
      ...pair.slice(2).map((ex) => ({ ...ex, supersetGroupId: shared })),
    ]
    const fixed = separateRepeatedSupersetGroups(withUniqueExerciseIds(stacked))
    const blocks = groupExercisesForDisplay(fixed).filter((item) => item.kind === 'superset')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]?.kind === 'superset' && blocks[1]?.kind === 'superset').toBe(true)
    if (blocks[0]?.kind === 'superset' && blocks[1]?.kind === 'superset') {
      expect(blocks[0].groupId).not.toBe(blocks[1].groupId)
    }
  })
})
