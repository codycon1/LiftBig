import { ref, type ComputedRef, type Ref } from 'vue'
import {
  displayInputToStoredLbsString,
  finalizeDisplayWeightToStoredLbs,
  isPartialWeightTyping,
  storedLbsStringToDisplay,
  type WeightUnit,
} from '@/utils/units'

/** Keeps a weight field showing exactly what the user is typing, including "27.". */
export function useWeightFieldDraft(unit: Ref<WeightUnit> | ComputedRef<WeightUnit>) {
  const focused = ref(false)
  const draft = ref('')

  function display(stored: string): string {
    if (focused.value) return draft.value
    return storedLbsStringToDisplay(stored, unit.value)
  }

  function focus(stored: string) {
    focused.value = true
    draft.value = storedLbsStringToDisplay(stored, unit.value)
  }

  /** Stored lb string to commit, or null when a kg value is still incomplete. */
  function input(raw: string): string | null {
    const typed = raw.replace(/,/g, '.')
    if (focused.value) draft.value = typed
    if (unit.value !== 'lb' && isPartialWeightTyping(typed)) return null
    return displayInputToStoredLbsString(typed, unit.value)
  }

  function syncStored(stored: string) {
    if (!focused.value) return
    draft.value = storedLbsStringToDisplay(stored, unit.value)
  }

  function blur(): string {
    const typed = draft.value
    focused.value = false
    return finalizeDisplayWeightToStoredLbs(typed, unit.value)
  }

  return { focused, display, focus, input, syncStored, blur }
}
