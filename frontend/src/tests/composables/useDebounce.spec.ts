import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useDebounce } from '@/composables/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('passes the initial value immediately', () => {
    const source = ref('hello')
    const debounced = useDebounce(source)
    expect(debounced.value).toBe('hello')
  })

  it('updates after default 400ms delay', async () => {
    const source = ref('')
    const debounced = useDebounce(source)
    source.value = 'typed'
    await nextTick()
    vi.advanceTimersByTime(399)
    expect(debounced.value).toBe('')
    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('typed')
  })

  it('respects a custom delay', async () => {
    const source = ref('')
    const debounced = useDebounce(source, 200)
    source.value = 'fast'
    await nextTick()
    vi.advanceTimersByTime(199)
    expect(debounced.value).toBe('')
    vi.advanceTimersByTime(1)
    expect(debounced.value).toBe('fast')
  })

  it('only emits the last value after rapid updates', async () => {
    const source = ref('')
    const debounced = useDebounce(source, 400)
    source.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(200)
    source.value = 'b'
    await nextTick()
    vi.advanceTimersByTime(400)
    expect(debounced.value).toBe('b')
  })

  it('debounces null value correctly', async () => {
    const source = ref<string | null>('initial')
    const debounced = useDebounce(source, 400)
    source.value = null
    await nextTick()
    vi.advanceTimersByTime(400)
    expect(debounced.value).toBeNull()
  })

  it('debounces empty string correctly', async () => {
    const source = ref('non-empty')
    const debounced = useDebounce(source, 400)
    source.value = ''
    await nextTick()
    vi.advanceTimersByTime(400)
    expect(debounced.value).toBe('')
  })
})
