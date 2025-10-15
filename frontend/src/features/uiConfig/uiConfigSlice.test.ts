import { describe, it, expect } from 'vitest'
import reducer, { updateLayout, markClean, loadUserUIConfig, saveUserUIConfig, type UIConfigState } from './uiConfigSlice'

describe('uiConfigSlice', () => {
  const initial: UIConfigState = {
    layouts: {},
    dirty: false,
    lastSyncedAt: null,
    error: null,
  }

  it('returns initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any)
    expect(state.layouts).toEqual({})
    expect(state.dirty).toBe(false)
  })

  it('updateLayout sets layout and dirty', () => {
    const next = reducer(initial, updateLayout({ key: 'dashboard_layout_v1', layout: { order: ['a','b'], visibility: { a: true, b: false } } }))
    expect(next.layouts['dashboard_layout_v1']).toEqual({ order: ['a','b'], visibility: { a: true, b: false } })
    expect(next.dirty).toBe(true)
  })

  it('markClean resets dirty', () => {
    const dirty: UIConfigState = { ...initial, dirty: true }
    const next = reducer(dirty, markClean())
    expect(next.dirty).toBe(false)
  })

  it('loadUserUIConfig.fulfilled hydrates state', () => {
    const payload = { dashboard_layout_v1: { order: ['x'], visibility: { x: true } } }
    const action = { type: loadUserUIConfig.fulfilled.type, payload }
    const next = reducer(initial, action)
    expect(next.layouts).toEqual(payload)
  })

  it('saveUserUIConfig.fulfilled marks clean and sets lastSyncedAt', () => {
    const dirty: UIConfigState = { ...initial, dirty: true }
    const action = { type: saveUserUIConfig.fulfilled.type }
    const next = reducer(dirty, action)
    expect(next.dirty).toBe(false)
    expect(next.lastSyncedAt).toBeTruthy()
  })
})

