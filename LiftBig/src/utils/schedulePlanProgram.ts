import type { PlanCatalogEntry } from '@/types/planCatalog'
import type { TemplateFolder, WorkoutTemplate } from '@/types/workout'
import { addDaysToDateKey, parseDateKey } from '@/utils/dateKey'
import { JOEY_C4_FOLDER } from '@/utils/joeyC4'
import { sortFolderPlans } from '@/utils/folderPlanSort'

export type ScheduleWorkoutsApi = {
  getDay: (dateKey: string) => unknown[]
  isRestDay: (dateKey: string) => boolean
  markRestDay: (dateKey: string) => void
  assignPlanToDate: (dateKey: string, template: WorkoutTemplate, folderName?: string) => void
  applyPlanWithWeeklyRest: (
    startDateKey: string,
    template: WorkoutTemplate,
    restDaysPerWeek: number,
    folderName?: string,
  ) => void
}

export function scheduledDateForPlanIndex(
  startDateKey: string,
  planIndex: number,
  restEvery: number,
): string {
  if (restEvery <= 0) return addDaysToDateKey(startDateKey, planIndex)
  return addDaysToDateKey(startDateKey, planIndex + Math.floor(planIndex / restEvery))
}

/** JS weekday: 0 Sunday … 6 Saturday. Null when the plan name is not a weekday (e.g. School A). */
export function jsWeekdayFromPlanName(name: string): number | null {
  const match =
    /^(sunday|saturday|friday|thursday|wednesday|tuesday|monday|sun|sat|fri|thurs|thur|thu|wed|tues|tue|mon)\b/i.exec(
      name.trim(),
    )
  if (!match) return null
  const key = match[1]!.toLowerCase()
  const days: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tues: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thurs: 4,
    thur: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  }
  return days[key] ?? null
}

/** Next date on or after `startDateKey` that falls on `jsWeekday` (0 Sunday … 6 Saturday). */
export function dateKeyForWeekdayOnOrAfter(startDateKey: string, jsWeekday: number): string {
  const delta = (jsWeekday - parseDateKey(startDateKey).getDay() + 7) % 7
  return addDaysToDateKey(startDateKey, delta)
}

export function isStackOnDayPlan(plan: WorkoutTemplate): boolean {
  return /^school\b/i.test(plan.name.trim())
}

export type FolderCalendarSlot = {
  plan: WorkoutTemplate
  dateKey: string
}

/**
 * Joey C4 puts Mon–Sun on those weekdays. School routines are left out of that
 * week so they can be added onto a day that already has a workout.
 */
export function folderCalendarSchedule(
  plans: WorkoutTemplate[],
  startDateKey: string,
  restEvery: number,
  folderId?: string,
): { assignments: FolderCalendarSlot[]; restDateKeys: string[]; weekdayWeek: boolean } {
  if (folderId === JOEY_C4_FOLDER.id) {
    const weekdayPlans = plans
      .map((plan) => ({ plan, day: jsWeekdayFromPlanName(plan.name) }))
      .filter((row): row is { plan: WorkoutTemplate; day: number } => row.day != null)
      .sort((a, b) => {
        const order = (day: number) => (day === 0 ? 7 : day)
        return order(a.day) - order(b.day)
      })
    return {
      assignments: weekdayPlans.map(({ plan, day }) => ({
        plan,
        dateKey: dateKeyForWeekdayOnOrAfter(startDateKey, day),
      })),
      restDateKeys: [],
      weekdayWeek: true,
    }
  }

  const assignments = plans.map((plan, idx) => ({
    plan,
    dateKey: scheduledDateForPlanIndex(startDateKey, idx, restEvery),
  }))
  const restDateKeys: string[] = []
  for (let i = 0; i < plans.length - 1; i++) {
    if (restEvery > 0 && (i + 1) % restEvery === 0) {
      restDateKeys.push(addDaysToDateKey(assignments[i]!.dateKey, 1))
    }
  }
  return { assignments, restDateKeys, weekdayWeek: false }
}

function resolveFolderPlans(
  entry: PlanCatalogEntry,
  templates: WorkoutTemplate[],
): WorkoutTemplate[] {
  if (entry.scheduleTemplateIds?.length) {
    return entry.scheduleTemplateIds
      .map((id) => templates.find((p) => p.id === id))
      .filter((p): p is WorkoutTemplate => p != null)
  }
  if (entry.folderId) {
    return sortFolderPlans(templates.filter((p) => p.folderId === entry.folderId))
  }
  return []
}

export function scheduleCatalogEntry(
  workouts: ScheduleWorkoutsApi,
  entry: PlanCatalogEntry,
  templates: WorkoutTemplate[],
  folders: TemplateFolder[],
  opts: {
    startDateKey: string
    daysPerWeek: number
    restDaysPerWeek?: number
    folderName?: string
    restEveryWorkoutDays?: number
    confirmOverwrite?: (message: string) => boolean
  },
): boolean {
  const folderName =
    opts.folderName ??
    folders.find((f) => f.id === entry.folderId)?.name ??
    entry.title

  if (entry.scheduleMode === 'repeat') {
    const template = templates.find((p) => p.id === entry.templateId)
    if (!template) return false
    const restDays = opts.restDaysPerWeek ?? Math.max(0, 7 - opts.daysPerWeek)
    workouts.applyPlanWithWeeklyRest(opts.startDateKey, template, restDays, folderName)
    return true
  }

  const plans = resolveFolderPlans(entry, templates)
  if (plans.length === 0) return false

  const restEvery = opts.restEveryWorkoutDays ?? 0
  const { assignments, restDateKeys } = folderCalendarSchedule(
    plans,
    opts.startDateKey,
    restEvery,
    entry.folderId,
  )
  if (assignments.length === 0) return false

  const touchedKeys = new Set<string>()
  assignments.forEach((s) => touchedKeys.add(s.dateKey))
  restDateKeys.forEach((k) => touchedKeys.add(k))

  const hasExisting = [...touchedKeys].some((key) => {
    if (workouts.isRestDay(key)) return false
    return workouts.getDay(key).length > 0
  })
  if (hasExisting && opts.confirmOverwrite) {
    const ok = opts.confirmOverwrite(
      'Some of these dates already have workouts. Continue and append these plans?',
    )
    if (!ok) return false
  }

  for (const restKey of restDateKeys) {
    if (workouts.getDay(restKey).length === 0 && !workouts.isRestDay(restKey)) {
      workouts.markRestDay(restKey)
    }
  }

  for (const slot of assignments) {
    workouts.assignPlanToDate(slot.dateKey, slot.plan, folderName)
  }

  return true
}

export function templatesForCatalogEntry(
  entry: PlanCatalogEntry,
  templates: WorkoutTemplate[],
): WorkoutTemplate[] {
  if (entry.scheduleMode === 'repeat' && entry.templateId) {
    const t = templates.find((p) => p.id === entry.templateId)
    return t ? [t] : []
  }
  return resolveFolderPlans(entry, templates)
}
