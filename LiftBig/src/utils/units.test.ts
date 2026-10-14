import { describe, expect, it } from 'vitest'
import {
  displayInputToStoredLbsString,
  finalizeDisplayWeightToStoredLbs,
  storedLbsStringToDisplay,
} from '@/utils/units'

describe('weight decimal typing', () => {
  it('keeps a trailing decimal while typing pounds', () => {
    expect(displayInputToStoredLbsString('27.', 'lb')).toBe('27.')
    expect(storedLbsStringToDisplay('27.', 'lb')).toBe('27.')
    expect(displayInputToStoredLbsString('27.0', 'lb')).toBe('27.0')
    expect(storedLbsStringToDisplay('27.0', 'lb')).toBe('27.0')
  })

  it('stores a finished half-pound weight', () => {
    expect(displayInputToStoredLbsString('27.5', 'lb')).toBe('27.5')
    expect(storedLbsStringToDisplay('27.5', 'lb')).toBe('27.5')
  })

  it('cleans a partial entry when the field is left', () => {
    expect(finalizeDisplayWeightToStoredLbs('27.', 'lb')).toBe('27')
    expect(finalizeDisplayWeightToStoredLbs('27.50', 'lb')).toBe('27.5')
    expect(finalizeDisplayWeightToStoredLbs('27.5', 'lb')).toBe('27.5')
  })

  it('round-trips a finished kilogram weight', () => {
    const stored = displayInputToStoredLbsString('27.5', 'kg')
    expect(storedLbsStringToDisplay(stored, 'kg')).toBe('27.5')
  })
})
