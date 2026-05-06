import { describe, it, expect, vi } from 'vitest'
import { useForm } from '@/composables/useForm'

describe('useForm', () => {
  it('initializes fields from the initial object', () => {
    const { fields } = useForm({ name: '', email: '' })
    expect(fields.name).toBe('')
    expect(fields.email).toBe('')
  })

  it('initializes with empty errors and isSubmitting=false', () => {
    const { errors, isSubmitting } = useForm({ name: '' })
    expect(Object.keys(errors)).toHaveLength(0)
    expect(isSubmitting.value).toBe(false)
  })

  it('validate() returns true when all rules pass', () => {
    const { validate } = useForm({ name: 'Alice' }, { name: [() => true] })
    expect(validate()).toBe(true)
  })

  it('validate() populates errors when a rule fails', () => {
    const { errors, validate } = useForm(
      { name: '' },
      { name: [(v) => (v ? true : 'Obrigatório')] },
    )
    const result = validate()
    expect(result).toBe(false)
    expect(errors.name).toBe('Obrigatório')
  })

  it('validate() clears previous errors when the rule now passes', () => {
    const { fields, errors, validate } = useForm(
      { name: '' },
      { name: [(v) => (v ? true : 'Obrigatório')] },
    )
    validate()
    expect(errors.name).toBe('Obrigatório')
    fields.name = 'Alice'
    validate()
    expect(errors.name).toBeUndefined()
  })

  it('reset() restores initial values', () => {
    const { fields, reset } = useForm({ name: 'Alice' })
    fields.name = 'Bob'
    reset()
    expect(fields.name).toBe('Alice')
  })

  it('reset() clears errors', () => {
    const { errors, validate, reset } = useForm(
      { name: '' },
      { name: [() => 'Erro'] },
    )
    validate()
    expect(errors.name).toBe('Erro')
    reset()
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('clearErrors() empties errors without resetting fields', () => {
    const { fields, errors, validate, clearErrors } = useForm(
      { name: '' },
      { name: [() => 'Erro'] },
    )
    validate()
    fields.name = 'changed'
    clearErrors()
    expect(Object.keys(errors)).toHaveLength(0)
    expect(fields.name).toBe('changed')
  })

  // Multiple rules per field
  it('validate() stops at the first failing rule and does not call subsequent rules', () => {
    const secondRule = vi.fn((_v: string): string | true => true)
    const { validate, errors } = useForm(
      { name: '' },
      { name: [(v) => (v ? true : 'Obrigatório'), secondRule] },
    )
    validate()
    expect(errors.name).toBe('Obrigatório')
    expect(secondRule).not.toHaveBeenCalled()
  })

  it('validate() evaluates the second rule when the first passes and the second fails', () => {
    const { fields, errors, validate } = useForm(
      { email: 'noemail' },
      {
        email: [
          (v) => ((v as string).length > 0 ? true : 'Obrigatório'),
          (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v as string) ? true : 'Email inválido'),
        ],
      },
    )
    validate()
    expect(errors.email).toBe('Email inválido')
  })

  // Field without rule entry
  it('validate() ignores fields not present in rules object', () => {
    const { fields, errors, validate } = useForm(
      { email: '', phone: '123' },
      { email: [(v) => ((v as string).length > 0 ? true : 'Obrigatório')] },
    )
    fields.email = 'valid@test.com'
    const result = validate()
    expect(result).toBe(true)
    expect(errors.phone).toBeUndefined()
  })

  it('validate() returns true immediately when rules object is empty', () => {
    const { validate } = useForm({ name: '' }, {})
    expect(validate()).toBe(true)
  })

  // reset() edge cases
  it('reset() works correctly when called multiple times in sequence', () => {
    const { fields, reset } = useForm({ count: 0 })
    fields.count = 5
    reset()
    expect(fields.count).toBe(0)
    fields.count = 10
    reset()
    expect(fields.count).toBe(0)
  })

  it('reset() clears errors that were assigned externally', () => {
    const { errors, reset } = useForm({ name: '' }, {})
    errors.name = 'Erro injetado'
    reset()
    expect(Object.keys(errors)).toHaveLength(0)
  })
})
