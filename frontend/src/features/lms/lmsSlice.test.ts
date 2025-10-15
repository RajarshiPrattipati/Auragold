import { describe, it, expect } from 'vitest'
import reducer, { updateConfig, fetchLMSConfig } from './lmsSlice'

describe('lmsSlice', () => {
  it('initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any)
    expect(state.config).toBeNull()
    expect(state.loading).toBe(false)
  })

  it('updateConfig sets config and caches', () => {
    const cfg = { buy_screen: { show_price_chart: true, theme: 'light', fields: ['stock'], layout: 'grid' }, portfolio_screen: { show_gain_loss: true, show_graph: false, refresh_interval: 300 }, dashboard_screen: { show_all_stocks: true, sort_by: 'price', card_layout: 'compact' }, version: '1.0.0' }
    const next = reducer(undefined, updateConfig(cfg as any))
    expect(next.config).toEqual(cfg)
  })

  it('fetchLMSConfig.fulfilled sets config', () => {
    const cfg = { buy_screen: { show_price_chart: true, theme: 'light', fields: ['stock'], layout: 'grid' }, portfolio_screen: { show_gain_loss: true, show_graph: false, refresh_interval: 300 }, dashboard_screen: { show_all_stocks: true, sort_by: 'price', card_layout: 'compact' }, version: '1.0.0' }
    const next = reducer(undefined, { type: fetchLMSConfig.fulfilled.type, payload: cfg })
    expect(next.config).toEqual(cfg)
    expect(next.loading).toBe(false)
  })
})

