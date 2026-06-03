import { describe, expect, it, vi } from 'vitest'

const createAppMock = vi.hoisted(() => vi.fn(() => ({
  use: vi.fn().mockReturnThis(),
  mount: vi.fn()
})))

const createPiniaMock = vi.hoisted(() => vi.fn(() => ({ name: 'pinia' })))

const pageAgentMock = vi.hoisted(() => ({
  initPageAgent: vi.fn(),
  initPageAgentSystem: vi.fn()
}))

vi.mock('vue', () => ({
  createApp: createAppMock
}))

vi.mock('pinia', () => ({
  createPinia: createPiniaMock,
  defineStore: vi.fn()
}))

vi.mock('../App.vue', () => ({
  default: {}
}))

vi.mock('../router', () => ({
  default: {}
}))

vi.mock('../pageAgent', () => pageAgentMock)

describe('main bootstrap', () => {
  it('uses guarded PageAgent initialization on startup', async () => {
    await import('../main')

    expect(pageAgentMock.initPageAgentSystem).toHaveBeenCalledTimes(1)
    expect(pageAgentMock.initPageAgent).not.toHaveBeenCalled()
  })
})
