import { ref, reactive } from 'vue'
import type { FieldErrors, ValidationRule } from '@/types'

type Rules<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

export function useForm<T extends Record<string, unknown>>(initial: T, rules?: Rules<T>) {
  const fields = reactive<T>({ ...initial } as T)
  const errors = reactive<FieldErrors>({})
  const isSubmitting = ref(false)

  function validate(): boolean {
    let valid = true
    if (!rules) return true

    for (const key in rules) {
      const fieldRules = rules[key]
      if (!fieldRules) continue
      let fieldValid = false
      for (const rule of fieldRules) {
        const result = rule(fields[key] as T[typeof key])
        if (result !== true) {
          errors[key] = result
          valid = false
          fieldValid = false
          break
        } else {
          fieldValid = true
        }
      }
      if (fieldValid) {
        delete errors[key]
      }
    }
    return valid
  }

  function reset(): void {
    Object.assign(fields, initial)
    Object.keys(errors).forEach((k) => delete errors[k])
  }

  function clearErrors(): void {
    Object.keys(errors).forEach((k) => delete errors[k])
  }

  return { fields, errors, isSubmitting, validate, reset, clearErrors }
}
