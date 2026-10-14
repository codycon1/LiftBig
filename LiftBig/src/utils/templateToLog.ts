import type { Exercise, TemplateExercise, WorkoutTemplate } from '@/types/workout'
import { cardioTargetDurationMinutes } from '@/types/workout'
import { resolveExerciseIsCore } from '@/utils/exerciseLibrary'

let idSerial = 0

function newId(): string {
  idSerial = (idSerial + 1) % 1_000_000_000
  return `${Date.now().toString(36)}-${idSerial.toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Give each copied superset its own id so two plans on one day cannot share a Vue key. */
function withFreshSupersetGroupIds(exercises: Exercise[]): Exercise[] {
  const map = new Map<string, string>()
  return exercises.map((ex) => {
    const raw = ex.supersetGroupId?.trim()
    if (!raw) return ex
    let next = map.get(raw)
    if (!next) {
      next = `${raw}__${newId()}`
      map.set(raw, next)
    }
    return { ...ex, supersetGroupId: next }
  })
}

/**
 * Exercise and set ids must be unique in one day. Duplicate keys make Vue reuse the
 * wrong row and can lock the workout page in a recursive update.
 */
export function withUniqueExerciseIds(exercises: Exercise[]): Exercise[] {
  const seenEx = new Set<string>()
  const seenSet = new Set<string>()
  let changed = false
  const next = exercises.map((ex) => {
    let id = ex.id
    if (!id || seenEx.has(id)) {
      id = newId()
      changed = true
    }
    seenEx.add(id)
    let setsChanged = false
    const sets = ex.sets.map((set) => {
      let setId = set.id
      if (!setId || seenSet.has(setId)) {
        setId = newId()
        setsChanged = true
      }
      seenSet.add(setId)
      if (setId === set.id) return set
      return { ...set, id: setId }
    })
    if (id === ex.id && !setsChanged) return ex
    changed = true
    return { ...ex, id, sets }
  })
  return changed ? next : exercises
}

/** A repeated superset id later in the day is a second pair, not the same block. */
export function separateRepeatedSupersetGroups(exercises: Exercise[]): Exercise[] {
  const seen = new Set<string>()
  const replacement = new Map<number, string>()
  let i = 0
  while (i < exercises.length) {
    const id = exercises[i]?.supersetGroupId?.trim()
    if (!id) {
      i++
      continue
    }
    let j = i + 1
    while (j < exercises.length && exercises[j]?.supersetGroupId?.trim() === id) j++
    if (seen.has(id)) {
      const fresh = `${id}__${newId()}`
      for (let k = i; k < j; k++) replacement.set(k, fresh)
    } else {
      seen.add(id)
    }
    i = j
  }
  if (replacement.size === 0) return exercises
  return exercises.map((ex, index) => {
    const id = replacement.get(index)
    return id ? { ...ex, supersetGroupId: id } : ex
  })
}

/**
 * Copies exercises to another day: preserves names, library links, circuit flag, set count,
 * and rep/weight goals — working sets are empty (no logged reps or weights).
 */
export function cloneExercisesForCopy(source: Exercise[]): Exercise[] {
  const copied = source.map((ex) => ({
    id: newId(),
    name: ex.name,
    libraryId: ex.libraryId,
    isCircuit: ex.isCircuit,
    isCardio: ex.isCardio,
    isCore: ex.isCore,
    targetDuration: ex.targetDuration,
    targetDistance: ex.targetDistance,
    targetTimeSeconds: ex.targetTimeSeconds,
    targetReps: ex.targetReps,
    targetWeight: ex.targetWeight,
    supersetGroupId: ex.supersetGroupId,
    supersetLabel: ex.supersetLabel,
    supersetOrder: ex.supersetOrder,
    preferredSwapLibraryIds: ex.preferredSwapLibraryIds,
    targetRestSeconds: ex.targetRestSeconds,
    sets: ex.sets.map((s) => {
      if (ex.isCircuit) {
        return {
          id: newId(),
          reps: s.reps,
          weight: s.weight,
          checked: false,
        }
      }
      return { id: newId(), reps: '', weight: '' }
    }),
  }))
  return withFreshSupersetGroupIds(copied)
}

/** Maps a template to logged exercises with circuit + target fields preserved (Vue spec). */
export function cloneTemplateToExercises(template: WorkoutTemplate): Exercise[] {
  const cloned = template.exercises.map((tex: TemplateExercise) => {
    if (tex.isCardio) {
      const durationGoal = cardioTargetDurationMinutes(tex)
      return {
        id: newId(),
        name: tex.name,
        libraryId: tex.libraryId,
        isCardio: true,
        targetDuration: durationGoal || undefined,
        targetDistance: (tex.targetDistance ?? '').trim() || undefined,
        targetRestSeconds: tex.targetRestSeconds,
        sets: [{ id: newId(), reps: '', weight: '' }],
      }
    }

    const first = tex.sets[0]
    const repsGoal = (tex.targetReps ?? '').trim() || first?.targetReps
    const weightGoal = (tex.targetWeight ?? '').trim() || first?.targetWeight
    const isCore = resolveExerciseIsCore({
      libraryId: tex.libraryId,
      isCore: tex.isCore,
      isCircuit: tex.isCircuit,
      name: tex.name,
    })
    return {
      id: newId(),
      name: tex.name,
      libraryId: tex.libraryId,
      isCircuit: tex.isCircuit,
      isCore: isCore ? true : undefined,
      targetReps: repsGoal,
      targetWeight: weightGoal,
      targetTimeSeconds: tex.targetTimeSeconds,
      supersetGroupId: tex.supersetGroupId,
      supersetLabel: tex.supersetLabel,
      supersetOrder: tex.supersetOrder,
      preferredSwapLibraryIds: tex.preferredSwapLibraryIds,
      targetRestSeconds: tex.targetRestSeconds,
      sets: tex.sets.map((ts) => {
        if (tex.isCircuit) {
          return {
            id: newId(),
            reps: (ts.targetReps ?? '').trim(),
            weight: (ts.targetWeight ?? '').trim(),
            checked: false,
          }
        }
        // Plan assignment creates empty working sets so users enter all reps/weight manually.
        return {
          id: newId(),
          reps: '',
          weight: '',
        }
      }),
    }
  })
  return withFreshSupersetGroupIds(cloned)
}
