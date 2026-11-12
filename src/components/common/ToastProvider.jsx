import { useCallback, useMemo, useRef, useState } from "react"
import { ToastContext } from "../../utils/toast"

const kinds = {
    success: { icon: "bi-check-circle-fill", bg: "text-bg-success", time: 3500 },
    error: { icon: "bi-x-octagon-fill", bg: "text-bg-danger", time: 6000 },
    warning: { icon: "bi-exclamation-triangle-fill", bg: "text-bg-warning", time: 5000 },
    info: { icon: "bi-info-circle-fill", bg: "text-bg-info", time: 4000 }
}

function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const nextId = useRef(1)

    const remove = useCallback((id) => {
        setToasts(current => current.filter(t => t.id !== id))
    }, [])

    const show = useCallback((kind, message) => {
        const id = nextId.current++
        setToasts(current => [...current.slice(-4), { id, kind, message }])
        setTimeout(() => remove(id), kinds[kind].time)
    }, [remove])

    const api = useMemo(() => ({
        success: (message) => show("success", message),
        error: (message) => show("error", message),
        warning: (message) => show("warning", message),
        info: (message) => show("info", message)
    }), [show])

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div className="toast-container position-fixed top-0 end-0 p-3"
                aria-live="polite" aria-atomic="true">
                {toasts.map(t => (
                    <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'}
                        className={`toast show align-items-center border-0 mb-2 ${kinds[t.kind].bg}`}>
                        <div className="d-flex">
                            <div className="toast-body">
                                <i className={`bi ${kinds[t.kind].icon} me-2`}></i>{t.message}
                            </div>
                            <button type="button"
                                className={`btn-close me-2 m-auto ${t.kind === 'warning' || t.kind === 'info' ? '' : 'btn-close-white'}`}
                                aria-label="Close" onClick={() => remove(t.id)}></button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export default ToastProvider
