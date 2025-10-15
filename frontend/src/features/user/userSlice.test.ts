import { describe, it, expect } from 'vitest'
import reducer, { setUser, updateBalance, logout } from './userSlice'

describe('userSlice', () => {
  it('setUser authenticates and sets fields', () => {
    const next = reducer(undefined, setUser({ id: 2, name: 'alice', balance: 500 }))
    expect(next.id).toBe(2)
    expect(next.name).toBe('alice')
    expect(next.balance).toBe(500)
    expect(next.isAuthenticated).toBe(true)
  })

  it('updateBalance sets balance', () => {
    const start = reducer(undefined, { type: '@@INIT' } as any)
    const next = reducer(start, updateBalance(1234))
    expect(next.balance).toBe(1234)
  })

  it('logout clears user', () => {
    const start = reducer(undefined, setUser({ id: 2, name: 'alice', balance: 500 }))
    const next = reducer(start, logout())
    expect(next.id).toBeNull()
    expect(next.name).toBeNull()
    expect(next.isAuthenticated).toBe(false)
  })
})

