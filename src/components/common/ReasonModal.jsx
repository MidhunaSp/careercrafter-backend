import { useState } from "react"

function ReasonModal({ title, description, confirmText, confirmClass = "btn-danger", minLength = 10,
    presets = [], placeholder = "Type the reason...", onConfirm, onClose }) {

    const [text, setText] = useState("")
    const [saving, setSaving] = useState(false)

    const trimmed = text.trim()
    const valid = trimmed.length >= minLength

    const submit = async (e) => {
        e.preventDefault()
        if (!valid) {
            return
        }
        setSaving(true)
        await onConfirm(trimmed)
        setSaving(false)
    }

    return (
        <>
            <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <form className="modal-content" onSubmit={submit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {description && <p className="text-muted">{description}</p>}

                            {presets.length > 0 && (
                                <select className="form-select mb-2" value=""
                                    onChange={(e) => setText(e.target.value)}>
                                    <option value="">Pick a common reason (optional)</option>
                                    {presets.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            )}

                            <textarea className={`form-control ${text !== "" && !valid ? 'is-invalid' : ''}`}
                                rows="3" maxLength="500" autoFocus
                                placeholder={placeholder} value={text}
                                onChange={(e) => setText(e.target.value)}></textarea>
                            <div className="d-flex justify-content-between small mt-1">
                                <span className={text !== "" && !valid ? "text-danger" : "text-muted"}>
                                    {minLength > 0 ? `At least ${minLength} characters` : "Optional"}
                                </span>
                                <span className="text-muted">{trimmed.length}/500</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className={`btn ${confirmClass}`} disabled={!valid || saving}>
                                {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
                                {confirmText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </>
    )
}

export default ReasonModal
