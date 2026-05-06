import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteCard from '@/components/notes/NoteCard.vue'

const baseNote = {
  id: 1,
  title: 'Minha nota',
  content: 'Conteúdo da nota',
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
}

describe('NoteCard', () => {
  it('renders the note title', () => {
    const wrapper = mount(NoteCard, { props: { note: baseNote } })
    expect(wrapper.find('.card__title').text()).toBe('Minha nota')
  })

  it('truncates content to 120 chars with ellipsis', () => {
    const note = { ...baseNote, content: 'a'.repeat(150) }
    const wrapper = mount(NoteCard, { props: { note } })
    const text = wrapper.find('.card__excerpt').text()
    expect(text).toHaveLength(121)
    expect(text.endsWith('…')).toBe(true)
  })

  it('shows full content when under 120 chars', () => {
    const wrapper = mount(NoteCard, { props: { note: { ...baseNote, content: 'curto' } } })
    expect(wrapper.find('.card__excerpt').text()).toBe('curto')
  })

  it('shows "Sem conteúdo" when content is empty', () => {
    const wrapper = mount(NoteCard, { props: { note: { ...baseNote, content: '' } } })
    expect(wrapper.text()).toContain('Sem conteúdo')
  })

  it('renders date in pt-BR locale', () => {
    const wrapper = mount(NoteCard, { props: { note: baseNote } })
    const dateText = wrapper.find('.card__date').text().toLowerCase()
    expect(dateText).toMatch(/jan/)
  })

  it('emits edit when edit button is clicked', async () => {
    const wrapper = mount(NoteCard, { props: { note: baseNote } })
    await wrapper.find('[title="Editar"]').trigger('click')
    expect(wrapper.emitted('edit')).toHaveLength(1)
  })

  it('emits delete when delete button is clicked', async () => {
    const wrapper = mount(NoteCard, { props: { note: baseNote } })
    await wrapper.find('[title="Excluir"]').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('does not truncate content at exactly 120 characters', () => {
    const note = { ...baseNote, content: 'a'.repeat(120) }
    const wrapper = mount(NoteCard, { props: { note } })
    const text = wrapper.find('.card__excerpt').text()
    expect(text).toBe('a'.repeat(120))
    expect(text.endsWith('…')).toBe(false)
  })
})
