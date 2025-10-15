import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api'
import { RefreshCw, Send, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updateLayout } from '@/features/uiConfig/uiConfigSlice'
import type { LayoutState } from '@/features/uiConfig/uiConfigSlice'

export default function LayoutAdmin() {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pushing, setPushing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminStatus, setAdminStatus] = useState<string>('')
  const serverLayouts = useAppSelector((s) => s.uiConfig.layouts)

  const DEFAULTS: Record<string, LayoutState> = useMemo(() => ({
    dashboard_layout_v1: {
      order: ['stats', 'quick-actions', 'market-leaders', 'featured-stocks', 'top-holdings', 'market-info'],
      visibility: {
        'stats': true,
        'quick-actions': true,
        'market-leaders': true,
        'featured-stocks': true,
        'top-holdings': true,
        'market-info': true,
      },
    },
    portfolio_layout_v1: {
      order: ['summary-cards', 'allocation', 'holdings'],
      visibility: {
        'summary-cards': true,
        'allocation': true,
        'holdings': true,
      },
    },
    browse_layout_v1: {
      order: ['market-stats', 'search-filters', 'stocks-display'],
      visibility: {
        'market-stats': true,
        'search-filters': true,
        'stocks-display': true,
      },
    },
  }), [])

  const COMPONENT_LABELS: Record<string, Record<string, string>> = {
    dashboard_layout_v1: {
      'stats': 'Quick Stats',
      'quick-actions': 'Quick Actions',
      'market-leaders': 'Market Leaders',
      'featured-stocks': 'Featured Stocks',
      'top-holdings': 'Top Holdings',
      'market-info': 'Market Info',
    },
    portfolio_layout_v1: {
      'summary-cards': 'Summary Cards',
      'allocation': 'Portfolio Allocation',
      'holdings': 'Holdings Table',
    },
    browse_layout_v1: {
      'market-stats': 'Market Statistics',
      'search-filters': 'Search & Filters',
      'stocks-display': 'Stocks Display',
    },
  }

  const [activeTab, setActiveTab] = useState<'dashboard_layout_v1' | 'portfolio_layout_v1' | 'browse_layout_v1'>('dashboard_layout_v1')
  const [layouts, setLayouts] = useState<Record<string, LayoutState>>({})

  const loadConfig = async () => {
    setLoading(true)
    setError(null)
    try {
      // Pull from the store (synced from server by UiConfigSync); fall back to defaults
      const merged: Record<string, LayoutState> = {
        dashboard_layout_v1: serverLayouts.dashboard_layout_v1 || DEFAULTS.dashboard_layout_v1,
        portfolio_layout_v1: serverLayouts.portfolio_layout_v1 || DEFAULTS.portfolio_layout_v1,
        browse_layout_v1: serverLayouts.browse_layout_v1 || DEFAULTS.browse_layout_v1,
      }
      setLayouts(merged)
      setAdminStatus('Reloaded current user layout config')
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const dispatch = useAppDispatch()

  const handlePush = async () => {
    setPushing(true)
    setError(null)
    setAdminStatus('')
    try {
      const payload = {
        dashboard_layout_v1: layouts.dashboard_layout_v1 || DEFAULTS.dashboard_layout_v1,
        portfolio_layout_v1: layouts.portfolio_layout_v1 || DEFAULTS.portfolio_layout_v1,
        browse_layout_v1: layouts.browse_layout_v1 || DEFAULTS.browse_layout_v1,
      }
      const resp = await apiClient.pushUserConfigToAll(payload)
      if (typeof setAdminStatus === 'function') {
        setAdminStatus(`Pushed to ${resp.updated_users} users`)
      }

      // Update local store and localStorage so current user sees changes immediately
      (Object.keys(payload) as Array<keyof typeof payload>).forEach((key) => {
        const layout = payload[key]
        dispatch(updateLayout({ key, layout }))
        // Sync localStorage used by DynamicLayout on mount
        localStorage.setItem(key as string, JSON.stringify(layout))
      })
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to push config')
    } finally {
      setPushing(false)
    }
  }

  if (!isAuthenticated) {
    return <div className="text-center text-red-600">Please login to access admin tools.</div>
  }

  const TABS: Array<{ key: 'dashboard_layout_v1' | 'portfolio_layout_v1' | 'browse_layout_v1'; label: string }> = [
    { key: 'dashboard_layout_v1', label: 'Dashboard' },
    { key: 'portfolio_layout_v1', label: 'Portfolio' },
    { key: 'browse_layout_v1', label: 'Browse Stocks' },
  ]

  const currentLayout: LayoutState = layouts[activeTab] || DEFAULTS[activeTab]
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const move = (index: number, dir: -1 | 1) => {
    const newOrder = [...currentLayout.order]
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= newOrder.length) return
    const [item] = newOrder.splice(index, 1)
    newOrder.splice(newIndex, 0, item)
    const newLayout = { ...currentLayout, order: newOrder }
    const nextLayouts = { ...layouts, [activeTab]: newLayout }
    setLayouts(nextLayouts)
    // reflect immediately in current user UI
    dispatch(updateLayout({ key: activeTab, layout: newLayout }))
    localStorage.setItem(activeTab, JSON.stringify(newLayout))
  }

  const toggle = (id: string) => {
    const newLayout = {
      ...currentLayout,
      visibility: { ...currentLayout.visibility, [id]: currentLayout.visibility[id] !== false ? false : true },
    }
    const nextLayouts = { ...layouts, [activeTab]: newLayout }
    setLayouts(nextLayouts)
    // reflect immediately in current user UI
    dispatch(updateLayout({ key: activeTab, layout: newLayout }))
    localStorage.setItem(activeTab, JSON.stringify(newLayout))
  }

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (overId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const sourceId = draggingId || e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === overId) return
    const order = [...currentLayout.order]
    const fromIdx = order.indexOf(sourceId)
    const toIdx = order.indexOf(overId)
    if (fromIdx === -1 || toIdx === -1) return
    order.splice(fromIdx, 1)
    order.splice(toIdx, 0, sourceId)
    setDraggingId(null)
    setLayouts({
      ...layouts,
      [activeTab]: { ...currentLayout, order },
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Layout Admin</h1>
        <button onClick={loadConfig} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Reload
        </button>
      </div>

      {error && <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>}
      {adminStatus && <div className="p-3 rounded border border-green-300 bg-green-50 text-green-700">{adminStatus}</div>}

      {/* Tabs for screens */}
      <div className="bg-gray-100 rounded-xl p-2 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-6 py-3 rounded-lg text-sm md:text-base font-semibold transition-colors ${
              activeTab === t.key
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Layout list */}
      <div className="bg-white rounded shadow p-4 space-y-4">
        <h2 className="text-lg font-semibold">Components</h2>
        <ul className="divide-y divide-gray-200">
          {currentLayout.order.map((id, idx) => (
            <li
              key={id}
              className={`flex items-center justify-between py-2 ${draggingId === id ? 'opacity-75' : ''}`}
              draggable
              onDragStart={onDragStart(id)}
              onDragOver={onDragOver}
              onDrop={onDrop(id)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2 py-1 border rounded-md text-gray-500 bg-gray-50"><GripVertical className="w-4 h-4" /></span>
                <input type="checkbox" checked={currentLayout.visibility[id] !== false} onChange={() => toggle(id)} />
                <span className="font-medium text-gray-800">{COMPONENT_LABELS[activeTab][id] || id}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(idx, -1)} className="p-1 rounded hover:bg-gray-100" aria-label="Move up"><ChevronUp className="w-5 h-5" /></button>
                <button onClick={() => move(idx, 1)} className="p-1 rounded hover:bg-gray-100" aria-label="Move down"><ChevronDown className="w-5 h-5" /></button>
              </div>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <button onClick={handlePush} disabled={pushing} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            <Send className="w-4 h-4" /> Force Push To All Users
          </button>
        </div>
      </div>
    </div>
  )
}
