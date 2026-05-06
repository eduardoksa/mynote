import { ref, watch } from 'vue'
import type { Ref } from 'vue'

export function useDebounce<T>(source: Ref<T>, delay = 400): Ref<T> {
  const debounced = ref<T>(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout>

  watch(source, (val) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = val
    }, delay)
  })

  return debounced
}
