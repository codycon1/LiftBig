import type { TemplateExercise, TemplateFolder, WorkoutTemplate } from '@/types/workout'

function row(n: number, reps: string, weight: string) {
  return Array.from({ length: n }, () => ({ targetReps: reps, targetWeight: weight }))
}

type TeOpts = {
  isCircuit?: boolean
  libraryId?: string
  isCardio?: boolean
  isCore?: boolean
  targetDuration?: string
  targetTimeSeconds?: string
  preferredSwapLibraryIds?: string[]
  targetRestSeconds?: number
}

function te(
  planId: string,
  slug: string,
  name: string,
  sets: number,
  reps: string,
  weight: string,
  opts: TeOpts = {},
): TemplateExercise {
  return {
    id: `${planId}__${slug}`,
    name,
    libraryId: opts.libraryId,
    isCircuit: opts.isCircuit,
    isCardio: opts.isCardio,
    isCore: opts.isCore,
    targetDuration: opts.targetDuration,
    targetTimeSeconds: opts.targetTimeSeconds,
    preferredSwapLibraryIds: opts.preferredSwapLibraryIds,
    targetRestSeconds: opts.targetRestSeconds,
    sets: row(sets, reps, weight),
  }
}

function supersetPair(
  planId: string,
  label: string,
  a: {
    slug: string
    name: string
    sets: number
    reps: string
    weight: string
    opts?: TeOpts
  },
  b: {
    slug: string
    name: string
    sets: number
    reps: string
    weight: string
    opts?: TeOpts
  },
  restSeconds?: number,
): TemplateExercise[] {
  const groupId = `${planId}__ss-${label.toLowerCase()}`
  const restOpts = restSeconds != null ? { targetRestSeconds: restSeconds } : {}
  return [
    {
      ...te(planId, a.slug, a.name, a.sets, a.reps, a.weight, { ...a.opts, ...restOpts }),
      supersetGroupId: groupId,
      supersetLabel: label,
      supersetOrder: 1,
    },
    {
      ...te(planId, b.slug, b.name, b.sets, b.reps, b.weight, { ...b.opts, ...restOpts }),
      supersetGroupId: groupId,
      supersetLabel: label,
      supersetOrder: 2,
    },
  ]
}

export const JOEY_FALL_BULK_V2_FOLDER: TemplateFolder = {
  id: 'folder-joey-fall-bulk-v2',
  name: 'Joey Fall Bulk v2',
  purpose:
    'Fall hypertrophy bulk v2: Monday chest / lat width / core, Tuesday lower body / traps, Wednesday upper back / shoulders / arms, Thursday rest, Friday chest / back thickness / arms, optional Saturday V-taper + arms + core, Sunday recovery. Superset pairings, “or” swap alternatives, and prescribed rest timers are linked in the log.',
}

const SUPERSET_HINT =
  'Superset blocks are linked in your log—alternate the two moves with minimal rest, then rest before the next round. When a rest time is listed, a timer is waiting under that lift or superset (set to the lower end of the range).'

const SWAP_HINT =
  'Moves labeled with an “or” alternative: press Swap and pick the top similar movement to hot-swap.'

/** Lower bound of plan rest prescriptions (seconds). */
const REST_2_MIN = 120
const REST_90 = 90
const REST_75 = 75
const REST_60 = 60

function planId(day: string): string {
  return `plan-joey-fall-bulk-v2-${day}`
}

export const JOEY_FALL_BULK_V2_PLANS: WorkoutTemplate[] = [
  {
    id: planId('mon'),
    name: 'Monday: Chest Focus, Lat Width & Core',
    folderId: JOEY_FALL_BULK_V2_FOLDER.id,
    notes: `${SUPERSET_HINT}\n${SWAP_HINT}\n\nPrimary: Incline DB Press — rest 2–3 min.\nSuperset A: rest 75–90 sec between rounds.\nSuperset B: rest 60–75 sec between rounds.\nSuperset C: rest 60 sec between rounds.\n\nOptional finish: 5–10 min incline walk.\n\nGoal: Upper chest, lat width, side delts, and core.`,
    exercises: [
      te(planId('mon'), 'incline-db', 'Incline DB Press', 3, '6–8', '55', {
        libraryId: 'incline-dumbbell-press',
        targetRestSeconds: REST_2_MIN,
      }),
      ...supersetPair(
        planId('mon'),
        'A',
        {
          slug: 'neutral-lat',
          name: 'Neutral-Grip Lat Pulldown',
          sets: 3,
          reps: '8–10',
          weight: '100',
          opts: {
            libraryId: 'neutral-grip-lat-pulldown',
            preferredSwapLibraryIds: ['single-arm-lat-pulldown'],
          },
        },
        {
          slug: 'db-lat',
          name: 'DB Lateral Raise',
          sets: 3,
          reps: '12–20',
          weight: '20',
          opts: {
            libraryId: 'lateral-raise',
            preferredSwapLibraryIds: ['cable-lateral-raise'],
          },
        },
        REST_75,
      ),
      ...supersetPair(
        planId('mon'),
        'B',
        {
          slug: 'low-high-fly',
          name: 'Low-to-High Cable Fly',
          sets: 3,
          reps: '10–15',
          weight: '25',
          opts: { libraryId: 'low-to-high-cable-fly' },
        },
        {
          slug: 'hanging-lr',
          name: 'Hanging Leg Raise',
          sets: 3,
          reps: '8–12',
          weight: '0',
          opts: {
            libraryId: 'leg-raise',
            isCore: true,
            preferredSwapLibraryIds: ['weighted-decline-situp'],
          },
        },
        REST_60,
      ),
      ...supersetPair(
        planId('mon'),
        'C',
        {
          slug: 'face-pull',
          name: 'Face Pull',
          sets: 3,
          reps: '12–20',
          weight: '40',
          opts: { libraryId: 'face-pull' },
        },
        {
          slug: 'cable-crunch',
          name: 'Cable Crunch',
          sets: 3,
          reps: '10–15',
          weight: '85',
          opts: {
            libraryId: 'cable-crunch',
            isCore: true,
            preferredSwapLibraryIds: ['ab-wheel-rollout'],
          },
        },
        REST_60,
      ),
      te(planId('mon'), 'incline-walk-fin', 'Incline Walk', 1, '5–10 min', '0', {
        libraryId: 'incline-treadmill-walk',
        isCardio: true,
        targetDuration: '5',
      }),
    ],
  },
  {
    id: planId('tue'),
    name: 'Tuesday: Lower Body & Traps',
    folderId: JOEY_FALL_BULK_V2_FOLDER.id,
    notes: `${SUPERSET_HINT}\n${SWAP_HINT}\n\nSuperset A: rest 90–120 sec between rounds.\nSuperset B: rest 90–120 sec between rounds.\nSuperset C: rest 75–90 sec between rounds.\n\nOptional finish: 5–10 min incline treadmill.\n\nGoal: Quads, posterior chain, calves, and traps.`,
    exercises: [
      ...supersetPair(
        planId('tue'),
        'A',
        {
          slug: 'leg-press',
          name: 'Leg Press',
          sets: 3,
          reps: '6–8',
          weight: '275',
          opts: {
            libraryId: 'leg-press',
            preferredSwapLibraryIds: ['hack-squat'],
          },
        },
        {
          slug: 'calf-raise',
          name: 'Standing Calf Raise',
          sets: 3,
          reps: '10–15',
          weight: '180',
          opts: { libraryId: 'standing-calf-raise' },
        },
        REST_90,
      ),
      ...supersetPair(
        planId('tue'),
        'B',
        {
          slug: 'rdl',
          name: 'Romanian Deadlift',
          sets: 3,
          reps: '8–10',
          weight: '135',
          opts: { libraryId: 'romanian-deadlift' },
        },
        {
          slug: 'bb-shrug',
          name: 'Barbell Shrug',
          sets: 3,
          reps: '10–15',
          weight: '135',
          opts: {
            libraryId: 'barbell-shrug',
            preferredSwapLibraryIds: ['dumbbell-shrug'],
          },
        },
        REST_90,
      ),
      ...supersetPair(
        planId('tue'),
        'C',
        {
          slug: 'walk-lunge',
          name: 'DB Walking Lunge',
          sets: 3,
          reps: '10–12/leg',
          weight: '40',
          opts: {
            libraryId: 'walking-lunge',
            preferredSwapLibraryIds: ['bulgarian-split-squat'],
          },
        },
        {
          slug: 'seated-curl',
          name: 'Seated Leg Curl',
          sets: 3,
          reps: '10–15',
          weight: '100',
          opts: {
            libraryId: 'seated-leg-curl',
            preferredSwapLibraryIds: ['hamstring-curl'],
          },
        },
        REST_75,
      ),
      te(planId('tue'), 'incline-walk-fin', 'Incline Treadmill', 1, '5–10 min', '0', {
        libraryId: 'incline-treadmill-walk',
        isCardio: true,
        targetDuration: '5',
      }),
    ],
  },
  {
    id: planId('wed'),
    name: 'Wednesday: Upper Back Density, Shoulders & Arms',
    folderId: JOEY_FALL_BULK_V2_FOLDER.id,
    notes: `${SUPERSET_HINT}\n${SWAP_HINT}\n\nSuperset A: rest 90 sec between rounds.\nSuperset B: rest 60–75 sec between rounds.\nSuperset C: rest 60–75 sec between rounds.\n\nGoal: Mid-back thickness, delts, and arms.`,
    exercises: [
      ...supersetPair(
        planId('wed'),
        'A',
        {
          slug: 'chest-row',
          name: 'Chest-Supported DB Row',
          sets: 3,
          reps: '8–10',
          weight: '100',
          opts: { libraryId: 'chest-supported-row' },
        },
        {
          slug: 'seated-ohp',
          name: 'Seated DB Overhead Press',
          sets: 3,
          reps: '8–10',
          weight: '40',
          opts: { libraryId: 'seated-dumbbell-shoulder-press' },
        },
        REST_90,
      ),
      ...supersetPair(
        planId('wed'),
        'B',
        {
          slug: 'rear-delt',
          name: 'Rear Delt Fly',
          sets: 3,
          reps: '12–15',
          weight: '20',
          opts: { libraryId: 'rear-delt-fly' },
        },
        {
          slug: 'lean-away-cable',
          name: 'Lean-Away Cable Lateral Raise',
          sets: 3,
          reps: '12–20',
          weight: '15',
          opts: {
            libraryId: 'lean-away-cable-lateral-raise',
            preferredSwapLibraryIds: ['leaning-dumbbell-lateral-raise'],
          },
        },
        REST_60,
      ),
      ...supersetPair(
        planId('wed'),
        'C',
        {
          slug: 'incline-curl',
          name: 'Incline DB Curl',
          sets: 3,
          reps: '10–12',
          weight: '25',
          opts: { libraryId: 'incline-dumbbell-curl' },
        },
        {
          slug: 'oh-rope',
          name: 'Overhead Rope Triceps Extension',
          sets: 3,
          reps: '10–12',
          weight: '40',
          opts: { libraryId: 'overhead-cable-tricep-extension' },
        },
        REST_60,
      ),
    ],
  },
  {
    id: planId('thu'),
    name: 'Thursday: Rest',
    folderId: JOEY_FALL_BULK_V2_FOLDER.id,
    notes: 'Complete rest. Sleep, eat, and recover for Friday’s chest / back thickness / arms session.',
    exercises: [],
  },
  {
    id: planId('fri'),
    name: 'Friday: Chest, Back Thickness & Arms',
    folderId: JOEY_FALL_BULK_V2_FOLDER.id,
    notes: `${SUPERSET_HINT}\n${SWAP_HINT}\n\nPrimary: Flat/Incline Machine Press or Smith Bench — rest 2 min.\nSuperset A: rest 75–90 sec between rounds.\nSuperset B: rest 60–75 sec between rounds.\nSuperset C: no prescribed rest.\n\nFinish: 15–20 min Zone 2 cardio.\n\nGoal: Chest, mid-back, arms, and core.`,
    exercises: [
      te(planId('fri'), 'machine-press', 'Machine Chest Press', 3, '6–10', '120', {
        libraryId: 'machine-chest-press',
        preferredSwapLibraryIds: ['incline-machine-press', 'smith-machine-bench-press'],
        targetRestSeconds: REST_2_MIN,
      }),
      ...supersetPair(
        planId('fri'),
        'A',
        {
          slug: 'seated-row',
          name: 'Seated Cable Row',
          sets: 3,
          reps: '8–12',
          weight: '100',
          opts: { libraryId: 'seated-cable-row' },
        },
        {
          slug: 'hammer',
          name: 'DB Hammer Curl',
          sets: 3,
          reps: '10–12',
          weight: '25',
          opts: { libraryId: 'hammer-curl' },
        },
        REST_75,
      ),
      ...supersetPair(
        planId('fri'),
        'B',
        {
          slug: 'oh-cable-tri',
          name: 'Overhead Cable Triceps Extension',
          sets: 3,
          reps: '10–15',
          weight: '40',
          opts: { libraryId: 'overhead-cable-tricep-extension' },
        },
        {
          slug: 'cable-lat',
          name: 'Cable Lateral Raise',
          sets: 3,
          reps: '12–20',
          weight: '15',
          opts: {
            libraryId: 'cable-lateral-raise',
            preferredSwapLibraryIds: ['lateral-raise'],
          },
        },
        REST_60,
      ),
      ...supersetPair(
        planId('fri'),
        'C',
        {
          slug: 'woodchop',
          name: 'Cable Woodchop',
          sets: 3,
          reps: '10–15',
          weight: '35',
          opts: {
            libraryId: 'cable-woodchop',
            isCore: true,
            preferredSwapLibraryIds: ['leg-raise'],
          },
        },
        {
          slug: 'ab-wheel',
          name: 'Ab Wheel',
          sets: 3,
          reps: '8–15',
          weight: '0',
          opts: {
            libraryId: 'ab-wheel-rollout',
            isCore: true,
            targetTimeSeconds: '30',
            preferredSwapLibraryIds: ['plank'],
          },
        },
      ),
      te(planId('fri'), 'zone2', 'Zone 2 Cardio', 1, '15–20 min', '0', {
        libraryId: 'incline-treadmill-walk',
        isCardio: true,
        targetDuration: '15',
      }),
    ],
  },
  {
    id: planId('sat'),
    name: 'Saturday (Optional): V-Taper + Arms + Core',
    folderId: JOEY_FALL_BULK_V2_FOLDER.id,
    notes: `${SUPERSET_HINT}\n${SWAP_HINT}\n\nOptional day — skip this one if school gets crazy.\n\nAdvanced core: 2–3 rounds — Dragon Flag 5–8, Weighted Russian Twist 15–20 total, RKC Plank 30–45 sec, Hanging Leg Raise 10–15. Minimal rest between stations; brief rest between rounds.\n\nOptional finish: 5–10 min StairMaster or incline treadmill.`,
    exercises: [
      ...supersetPair(
        planId('sat'),
        'A',
        {
          slug: 'single-lat',
          name: 'Single-Arm Lat Pulldown',
          sets: 3,
          reps: '8–12',
          weight: '60',
          opts: { libraryId: 'single-arm-lat-pulldown' },
        },
        {
          slug: 'db-lat',
          name: 'DB Lateral Raise',
          sets: 3,
          reps: '12–20',
          weight: '20',
          opts: {
            libraryId: 'lateral-raise',
            preferredSwapLibraryIds: ['cable-lateral-raise'],
          },
        },
      ),
      ...supersetPair(
        planId('sat'),
        'B',
        {
          slug: 'chest-row',
          name: 'Chest-Supported Row',
          sets: 3,
          reps: '8–12',
          weight: '100',
          opts: {
            libraryId: 'chest-supported-row',
            preferredSwapLibraryIds: ['dumbbell-row'],
          },
        },
        {
          slug: 'preacher',
          name: 'Preacher Curl',
          sets: 3,
          reps: '10–12',
          weight: '50',
          opts: {
            libraryId: 'preacher-curl',
            preferredSwapLibraryIds: ['cable-curl'],
          },
        },
      ),
      ...supersetPair(
        planId('sat'),
        'C',
        {
          slug: 'face-pull',
          name: 'Face Pull',
          sets: 3,
          reps: '15–20',
          weight: '40',
          opts: { libraryId: 'face-pull' },
        },
        {
          slug: 'pushdown',
          name: 'Rope/Bar Pushdown',
          sets: 3,
          reps: '10–15',
          weight: '40',
          opts: { libraryId: 'tricep-pushdown' },
        },
      ),
      te(planId('sat'), 'dragon-flag', 'Dragon Flag', 3, '5–8', '0', {
        isCircuit: true,
        libraryId: 'dragon-flag',
        isCore: true,
      }),
      te(planId('sat'), 'w-russian', 'Weighted Russian Twist', 3, '15–20', '20', {
        isCircuit: true,
        libraryId: 'weighted-russian-twist',
        isCore: true,
      }),
      te(planId('sat'), 'rkc', 'RKC Plank', 3, '30–45 sec', '0', {
        isCircuit: true,
        libraryId: 'rkc-plank',
        isCore: true,
        targetTimeSeconds: '30',
      }),
      te(planId('sat'), 'hanging-lr', 'Hanging Leg Raise', 3, '10–15', '0', {
        isCircuit: true,
        libraryId: 'leg-raise',
        isCore: true,
      }),
      te(planId('sat'), 'stair-fin', 'StairMaster', 1, '5–10 min', '0', {
        libraryId: 'stairmaster',
        isCardio: true,
        targetDuration: '5',
        preferredSwapLibraryIds: ['incline-treadmill-walk'],
      }),
    ],
  },
  {
    id: planId('sun'),
    name: 'Sunday: Recovery',
    folderId: JOEY_FALL_BULK_V2_FOLDER.id,
    notes: 'Easy walking, mobility, and stretching. Keep intensity low—recover for Monday.',
    exercises: [
      te(planId('sun'), 'walk', 'Easy Walk', 1, '30–45 min', '0', {
        libraryId: 'walking',
        isCardio: true,
        targetDuration: '30',
      }),
      te(planId('sun'), 'mobility', 'Mobility / Stretching', 1, '15–20 min', '0', {
        libraryId: 'yoga-flow',
        isCardio: true,
        targetDuration: '15',
      }),
    ],
  },
]
