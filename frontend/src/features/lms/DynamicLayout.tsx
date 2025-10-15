import { useEffect, useMemo, useState } from 'react'
import { Settings, GripVertical, Eye, EyeOff, RotateCcw, X } from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { useFlipList } from '@/hooks/useFlipList'

type LayoutItem = {
  id: string
  title: string
  render: () => JSX.Element
  defaultVisible?: boolean
}

type StoredState = {
  order: string[]
  visibility: Record<string, boolean>
}

interface DynamicLayoutProps {
  items: LayoutItem[]
  storageKey?: string
  onChange?: (state: { order: string[]; visibility: Record<string, boolean> }) => void
}

export function DynamicLayout({ items, storageKey = 'dashboard_layout_v1', onChange }: DynamicLayoutProps) {
  const defaults = useMemo(() => {
    const order = items.map((i) => i.id)
    const visibility: Record<string, boolean> = {}
    items.forEach((i) => (visibility[i.id] = i.defaultVisible !== false))
    return { order, visibility }
  }, [items])

  const [state, setState] = useState<StoredState>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as StoredState
        const validOrder = parsed.order?.filter?.((id: string) => items.find((i) => i.id === id)) || []
        const missing = items.map((i) => i.id).filter((id) => !validOrder.includes(id))
        const order = [...validOrder, ...missing]
        const visibility: Record<string, boolean> = { ...defaults.visibility, ...(parsed.visibility || {}) }
        return { order, visibility }
      }
    } catch {
      /* ignore */
    }
    return defaults
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const externalLayout = useAppSelector((s) => (s as any)?.uiConfig?.layouts?.[storageKey]) as
    | { order: string[]; visibility: Record<string, boolean> }
    | undefined

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  // Adopt external layout updates from Redux (e.g., after Force Push)
  useEffect(() => {
    if (externalLayout && externalLayout.order && externalLayout.visibility) {
      const next = { order: externalLayout.order, visibility: externalLayout.visibility }
      setState(next)
      localStorage.setItem(storageKey, JSON.stringify(next))
    }
  }, [externalLayout, storageKey])

  const { register, capture, animate } = useFlipList()

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const onDragOver = (overId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverId((prev) => (prev === overId ? prev : overId))
  }

  const onDrop = (overId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const sourceId = draggingId || e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === overId) return
    // Capture positions for FLIP before reorder
    capture()
    const newOrder = [...state.order]
    const fromIdx = newOrder.indexOf(sourceId)
    const toIdx = newOrder.indexOf(overId)
    if (fromIdx === -1 || toIdx === -1) return
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, sourceId)
    const next = { ...state, order: newOrder }
    setState(next)
    onChange?.(next)
    setDraggingId(null)
    setOverId(null)
    // Animate next frame so DOM has new order
    requestAnimationFrame(() => animate())
  }

  const onDragEnd = () => {
    setDraggingId(null)
    setOverId(null)
  }

  const toggleVisibility = (id: string) => {
    const next = { ...state, visibility: { ...state.visibility, [id]: state.visibility[id] !== false ? false : true } }
    setState(next)
    onChange?.(next)
  }

  const resetLayout = () => {
    setState(defaults)
    onChange?.(defaults)
  }

  return (
    <div className="relative">
      {/* Invisible spacer so the settings button can sit slightly above */}
      <div className="h-6" aria-hidden="true"></div>
      {/* Settings Button (icon only) */}
      <button
        aria-label="Layout settings"
        className="absolute -top-6 right-0 z-20 inline-flex items-center px-2.5 py-2 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50"
        onClick={() => setShowSettings((s) => !s)}
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute right-0 top-8 z-30 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-800">Visible components</div>
            <button
              aria-label="Close settings"
              className="p-1 rounded hover:bg-gray-100"
              onClick={() => setShowSettings(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-64 overflow-auto space-y-1">
            {items.map((it) => (
              <label key={it.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={state.visibility[it.id] !== false}
                  onChange={() => toggleVisibility(it.id)}
                />
                <span className="text-sm text-gray-700">{it.title}</span>
                <span className="ml-auto text-gray-400">
                  {state.visibility[it.id] !== false ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </span>
              </label>
            ))}
          </div>
          <button
            className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
            onClick={resetLayout}
          >
            <RotateCcw className="w-4 h-4" /> Reset layout
          </button>
        </div>
      )}

      {/* Draggable items */}
      <div className="grid grid-cols-1 gap-6">
        {state.order.map((id) => {
          const def = items.find((i) => i.id === id)
          if (!def) return null
          const visible = state.visibility[id] !== false
          if (!visible) return null
          return (
            <div
              key={id}
              draggable
              onDragStart={onDragStart(id)}
              onDragOver={onDragOver(id)}
              onDrop={onDrop(id)}
              onDragEnd={onDragEnd}
              ref={register(id)}
              className={`relative border border-transparent rounded-xl transition-shadow ${
                draggingId === id ? 'opacity-80 scale-[0.99] shadow-lg' : 'transition-transform'
              }`}
            >
              {/* Drag handle (icon only) */}
              <div className="absolute -top-3 left-0 z-10 inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded-md shadow">
                <GripVertical className="w-4 h-4 text-gray-500" />
              </div>
              {/* Snap placeholder when hovering this cell */}
              {overId === id && draggingId && (
                <div className="absolute -inset-1 rounded-xl border-2 border-dashed border-blue-400/80 pointer-events-none"></div>
              )}
              {def.render()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
