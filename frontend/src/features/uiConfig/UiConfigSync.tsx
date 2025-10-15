import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loadUserUIConfig, saveUserUIConfig } from './uiConfigSlice'
import { useAuth } from '@/context/AuthContext'

export function UiConfigSync() {
  const dispatch = useAppDispatch()
  const { dirty } = useAppSelector((s) => s.uiConfig)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(loadUserUIConfig())
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    const id = setInterval(() => {
      if (dirty) {
        dispatch(saveUserUIConfig())
      }
    }, 60000) // every 60s
    return () => clearInterval(id)
  }, [dispatch, dirty, isAuthenticated])

  return null
}

