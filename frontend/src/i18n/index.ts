import { createI18n } from 'vue-i18n'
import ptBR from '@/locales/pt-BR.json'

const i18n = createI18n({
  locale: 'pt-BR',
  fallbackLocale: 'pt-BR',
  messages: {
    'pt-BR': ptBR,
  },
})

export default i18n
