/** Stored weights in the app are always pounds (lb). Display/input may use kg. */
export type WeightUnit = 'lb' | 'kg'

const LB_PER_KG = 2.2046226218

export function lbsToKg(lbs: number): number {
  return lbs / LB_PER_KG
}

export function kgToLbs(kg: number): number {
  return kg * LB_PER_KG
}

function roundTo(n: number, decimals: number): number {
  const p = 10 ** decimals
  return Math.round(n * p) / p
}

/** Format a mass that is stored as lb for display in the active unit. */
export function formatWeightFromLbs(lbs: number, unit: WeightUnit, maxDecimals = 1): string {
  if (unit === 'lb') return `${roundTo(lbs, maxDecimals)}`
  return `${roundTo(lbsToKg(lbs), maxDecimals)}`
}

export function formatWeightWithUnit(lbs: number, unit: WeightUnit, maxDecimals = 1): string {
  const n = formatWeightFromLbs(lbs, unit, maxDecimals)
  return unit === 'lb' ? `${n} lb` : `${n} kg`
}

/** Delta stored in lb (e.g. progression increment) shown in the active unit. */
export function formatDeltaFromLbs(lbsDelta: number, unit: WeightUnit, maxDecimals = 1): string {
  if (unit === 'lb') return `${roundTo(lbsDelta, maxDecimals)} lb`
  return `${roundTo(lbsToKg(lbsDelta), maxDecimals)} kg`
}

/** Parse stored lb string to a number, or NaN. */
export function parseStoredLbs(s: string): number {
  return parseFloat(String(s).replace(',', '.'))
}

/**
 * True while a weight is only partly typed, e.g. "27." or "27.50".
 * A finished value like "27.5" is not partial.
 */
export function isPartialWeightTyping(raw: string): boolean {
  const t = String(raw).trim().replace(',', '.')
  return /^\d+\.$/.test(t) || /^\d+\.\d*0$/.test(t)
}

/** Input field shows this value (from stored lb string). */
export function storedLbsStringToDisplay(s: string, unit: WeightUnit): string {
  const t = String(s).trim().replace(',', '.')
  if (t === '') return ''
  if (unit === 'lb' && isPartialWeightTyping(t)) return t
  const lbs = parseStoredLbs(t)
  if (Number.isNaN(lbs)) return t
  if (unit === 'lb') return normalizeDecimalString(t)
  return normalizeDecimalString(String(roundTo(lbsToKg(lbs), 2)))
}

/** Convert user input in the active unit to a string to store as lb. */
export function displayInputToStoredLbsString(raw: string, unit: WeightUnit): string {
  const t = String(raw).trim().replace(',', '.')
  if (t === '') return ''
  // Keep "27." / "27.0" so a controlled input does not delete the decimal mid-typing.
  if (unit === 'lb' && isPartialWeightTyping(t)) return t
  const n = parseFloat(t)
  if (Number.isNaN(n)) return t
  if (unit === 'lb') return normalizeDecimalString(String(roundTo(n, 3)))
  return normalizeDecimalString(String(roundTo(kgToLbs(n), 3)))
}

/** Normalize a finished weight entry (drops a trailing dot or extra zeros) to stored lb. */
export function finalizeDisplayWeightToStoredLbs(raw: string, unit: WeightUnit): string {
  const t = String(raw).trim().replace(',', '.')
  if (t === '' || t === '.') return ''
  const n = parseFloat(t)
  if (Number.isNaN(n)) return ''
  if (unit === 'lb') return normalizeDecimalString(String(roundTo(n, 3)))
  return normalizeDecimalString(String(roundTo(kgToLbs(n), 3)))
}

function normalizeDecimalString(s: string): string {
  if (!s.includes('.')) return s
  return s.replace(/\.?0+$/, '').replace(/\.$/, '')
}

/** Max weight in a day (each set.weight is lb); display in unit. */
export function formatMaxWeightDisplay(maxLbs: number, unit: WeightUnit): string {
  if (maxLbs <= 0) return '—'
  return formatWeightWithUnit(maxLbs, unit, 1)
}
