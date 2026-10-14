import { describe, expect, it } from 'vitest'
import type { WorkoutTemplate } from '@/types/workout'
import { JOEY_C4_FOLDER } from '@/utils/joeyC4'
import {
  dateKeyForWeekdayOnOrAfter,
  folderCalendarSchedule,
  isStackOnDayPlan,
} from '@/utils/schedulePlanProgram'

function plan(id: string, name: string): WorkoutTemplate {
  return { id, name, folderId: JOEY_C4_FOLDER.id, exercises: [] }
}

describe('Joey C4 calendar week', () => {
  const plans = [
    plan('mon', 'Mon: Upper A'),
    plan('school', 'School A: Delts & Arms Burner'),
    plan('sun', 'Sun: Optional Day 6'),
    plan('thu', 'Thu: Complete Rest'),
    plan('sat', 'Sat: Day 5'),
  ]

  it('places weekday plans on those weekdays and leaves school plans out', () => {
    const { assignments, restDateKeys, weekdayWeek } = folderCalendarSchedule(
      plans,
      '2026-10-12',
      7,
      JOEY_C4_FOLDER.id,
    )
    expect(weekdayWeek).toBe(true)
    expect(restDateKeys).toEqual([])
    expect(assignments.map((slot) => [slot.plan.id, slot.dateKey])).toEqual([
      ['mon', '2026-10-12'],
      ['thu', '2026-10-15'],
      ['sat', '2026-10-17'],
      ['sun', '2026-10-18'],
    ])
  })

  it('keeps a weekday that falls before the start date in the following week', () => {
    expect(dateKeyForWeekdayOnOrAfter('2026-10-13', 1)).toBe('2026-10-19')
  })

  it('treats school plans as add-ons', () => {
    expect(isStackOnDayPlan(plan('school', 'School B: Legs'))).toBe(true)
    expect(isStackOnDayPlan(plan('mon', 'Mon: Upper A'))).toBe(false)
  })
})
