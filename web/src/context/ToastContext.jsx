import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let idSeq = 0

/**
 * Lightweight global toast/notification system (no dependency).
 * Usage: const toast = useToast(); toast.success('เพิ่มลงตะกร้าแล้ว')
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message, { type = 'info', duration = 2600 } = {}) => {
      const id = ++idSeq
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const api = {
    show,
    dismiss,
    success: (m, o) => show(m, { ...o, type: 'success' }),
    error: (m, o) => show(m, { ...o, type: 'error' }),
    info: (m, o) => show(m, { ...o, type: 'info' })
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

const STYLES = {
  success: { bg: 'bg-green-600', icon: '✓' },
  error: { bg: 'bg-red-600', icon: '✕' },
  info: { bg: 'bg-slate-800', icon: 'ℹ' }
}

function Toaster({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const s = STYLES[t.type] || STYLES.info
        return (
          <button
            key={t.id}
            onClick={() => onDismiss(t.id)}
            className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl ${s.bg} px-4 py-3 text-sm font-medium text-white shadow-lg ring-1 ring-black/5 animate-[toastIn_.2s_ease-out]`}
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-xs">
              {s.icon}
            </span>
            <span className="text-left">{t.message}</span>
          </button>
        )
      })}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
