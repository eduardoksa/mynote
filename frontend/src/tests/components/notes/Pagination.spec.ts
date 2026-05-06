import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from '@/components/notes/Pagination.vue'
import type { Pagination as PaginationType } from '@/types'

function makePagination(overrides: Partial<PaginationType> = {}): PaginationType {
  return {
    current_page: 2,
    per_page: 9,
    total_count: 25,
    total_pages: 3,
    next_page: 3,
    prev_page: 1,
    ...overrides,
  }
}

describe('Pagination', () => {
  it('does not render when pagination is null', () => {
    const wrapper = mount(Pagination, { props: { pagination: null } })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('does not render when total_pages <= 1', () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination({ total_pages: 1 }) } })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('renders when total_pages > 1', () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination() } })
    expect(wrapper.find('nav').exists()).toBe(true)
  })

  it('shows current page and total pages', () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination() } })
    expect(wrapper.text()).toContain('Página 2 de 3')
  })

  it('shows total note count', () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination() } })
    expect(wrapper.text()).toContain('25 notas')
  })

  it('disables previous button on first page', () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination({ current_page: 1, prev_page: null }) } })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('disabled')).toBeDefined()
  })

  it('disables next button on last page', () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination({ current_page: 3, next_page: null }) } })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].attributes('disabled')).toBeDefined()
  })

  it('emits page-change with previous page number when Previous is clicked', async () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination() } })
    await wrapper.findAll('button')[0].trigger('click')
    expect(wrapper.emitted('page-change')?.[0]).toEqual([1])
  })

  it('emits page-change with next page number when Next is clicked', async () => {
    const wrapper = mount(Pagination, { props: { pagination: makePagination() } })
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.emitted('page-change')?.[0]).toEqual([3])
  })

  it('shows "1 nota" in singular when total_count is 1', () => {
    const wrapper = mount(Pagination, {
      props: { pagination: makePagination({ total_count: 1, total_pages: 2 }) },
    })
    expect(wrapper.text()).toContain('1 nota')
    expect(wrapper.text()).not.toContain('1 notas')
  })
})
