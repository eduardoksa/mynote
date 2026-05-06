import { beforeEach } from 'vitest'
import { config } from '@vue/test-utils'
import i18n from '@/i18n'

config.global.plugins = [i18n]

beforeEach(() => localStorage.clear())
