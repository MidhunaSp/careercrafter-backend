import axios from "axios"
import { useEffect, useState } from "react"
import { API_SERVER_URL_DEV } from "../../../config"

// shows the pdf of a resume inside the page.
function ResumeViewer({ apiPath, fileName, filePath }) {

    const [url, setUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errMsg, setErrMsg] = useState("")

    const isWebLink = filePath && filePath.startsWith("http")

    useEffect(() => {
        if (isWebLink) {
            return
        }
        let objectUrl = null
        let cancelled = false

        const loadPdf = async () => {
            try {
                const response = await axios.get(API_SERVER_URL_DEV + apiPath,
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }, responseType: 'blob' })
                if (cancelled) {
                    return
                }
                objectUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
                setUrl(objectUrl)
            }
            catch (err) {
                if (cancelled) {
                    return
                }
                // with responseType blob, the error body also comes as a blob, so read it as text
                let msg = "The resume file could not be loaded."
                const status = err?.response?.status
                try {
                    const text = await err.response.data.text()
                    const body = JSON.parse(text)
                    if (body.message) {
                        msg = body.message
                    }
                }
                catch {
                    if (status === 403) {
                        msg = "You are not allowed to view this resume."
                    }
                }
                if (!cancelled) {
                    setErrMsg(status ? `${msg} (error ${status})` : msg)
                }
            }
            if (!cancelled) {
                setLoading(false)
            }
        }
        loadPdf()

        return () => {
            cancelled = true
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [apiPath, isWebLink])

    if (isWebLink) {
        return (
            <a href={filePath} target="_blank" rel="noreferrer" className="btn btn-outline-primary">
                <i className="bi bi-box-arrow-up-right me-1"></i>Open resume link
            </a>
        )
    }

    if (loading) {
        return (
            <div className="text-center text-muted py-5">
                <div className="spinner-border spinner-border-sm me-2"></div>Loading resume...
            </div>
        )
    }

    if (errMsg) {
        return <div className="alert alert-warning mb-0"><i className="bi bi-exclamation-triangle me-2"></i>{errMsg}</div>
    }

    return (
        <div>
            <div className="mb-2">
                <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary me-2">
                    <i className="bi bi-box-arrow-up-right me-1"></i>Open in new tab
                </a>
                <a href={url} download={fileName} className="btn btn-sm btn-outline-secondary">
                    <i className="bi bi-download me-1"></i>Download
                </a>
            </div>
            <div className="ratio ratio-4x3">
                <iframe src={url} title="Resume preview" className="border rounded"></iframe>
            </div>
        </div>
    )
}

export default ResumeViewer