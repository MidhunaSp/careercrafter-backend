import { createContext, useContext } from "react"

// the provider (components/common/ToastProvider.jsx) gives { success, error, info, warning }
export const ToastContext = createContext(null)

export const useToast = () => {
    const toast = useContext(ToastContext)
    if (!toast) {
        throw new Error("useToast must be used inside <ToastProvider>")
    }
    return toast
}

export const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data
    if (data?.message) {
        return data.message
    }
    
    if (data && typeof data === 'object') {
        return Object.values(data).join(", ")
    }
    return fallback
}
