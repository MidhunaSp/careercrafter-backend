import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { getResumes, uploadResume, updateResume, makeDefaultResume, deleteResume, shareResume } from "../../store/actions/ResumeAction"
import ResumeViewer from "../common/ResumeViewer"

function ResumeManager({ jobSeekerId }) {

    const dispatch = useDispatch()
    const resumes = useSelector(state => state.resumes)

    const [label, setLabel] = useState("")
    const [file, setFile] = useState(null)
    const [fileKey, setFileKey] = useState(0)
    const [editId, setEditId] = useState(null)
    const [viewResume, setViewResume] = useState(null)
    const [errMsg, setErrMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    useEffect(() => {
        const loadResumes = async () => {
            try {
                await dispatch(getResumes(jobSeekerId))
            }
            catch {
                setErrMsg("Could not load your resumes")
            }
        }
        loadResumes()
    }, [jobSeekerId, dispatch])

    const handleFile = (e) => {
        const chosen = e.target.files[0]
        setErrMsg("")
        if (chosen && chosen.size > 5 * 1024 * 1024) {
            setErrMsg("Resume file must be 5 MB or smaller")
            e.target.value = ""
            setFile(null)
            return
        }
        setFile(chosen)
    }

    const resetForm = () => {
        setLabel("")
        setFile(null)
        setFileKey(fileKey + 1)
        setEditId(null)
    }

    const saveResume = async (e) => {
        e.preventDefault()
        setErrMsg("")
        setSuccessMsg("")

        if (label.trim() === "") {
            setErrMsg("Please enter a label for your resume")
            return
        }

        try {
            if (editId) {
                const old = resumes.find(r => r.id === editId)
                await dispatch(updateResume(editId, jobSeekerId, {
                    label: label,
                    fileName: old.fileName,
                    filePath: old.filePath,
                    isDefault: old.isDefault
                }))
                setSuccessMsg("Resume updated successfully")
            }
            else {
                await dispatch(uploadResume(jobSeekerId, file, label))
                setSuccessMsg("Resume uploaded successfully")
            }
            resetForm()
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not save the resume"))
        }
    }

    const startEdit = (r) => {
        setEditId(r.id)
        setLabel(r.label)
        setErrMsg("")
        setSuccessMsg("")
    }

    const makeDefault = async (id) => {
        setErrMsg("")
        setSuccessMsg("")
        try {
            await dispatch(makeDefaultResume(id, jobSeekerId))
            setSuccessMsg("Default resume changed")
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not change the default resume"))
        }
    }

    const removeResume = async (id) => {
        if (!window.confirm("Delete this resume?")) {
            return
        }
        setErrMsg("")
        setSuccessMsg("")
        try {
            await dispatch(deleteResume(id, jobSeekerId))
            if (editId === id) {
                resetForm()
            }
            setSuccessMsg("Resume deleted")
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not delete the resume"))
        }
    }

    const toggleShare = async (r) => {
        setErrMsg("")
        try {
            await dispatch(shareResume(r.id, !r.shared, jobSeekerId))
        } catch {
            setErrMsg("Could not change the sharing setting")
        }
    }

    return (
        <div>
            {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}
            {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

            {/* Resume list */}
            <ul className="list-group mb-4">
                {resumes.length === 0 && (
                    <li className="list-group-item text-center text-muted py-4">
                        <i className="bi bi-file-earmark-x fs-3 d-block"></i>No resumes yet. Upload your first resume below.
                    </li>
                )}
                {
                    resumes.map(r => (
                        <li key={r.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <i className="bi bi-file-earmark-pdf text-danger fs-4 me-2"></i>
                                    <span className="fw-semibold">{r.label}</span>
                                    {r.isDefault && <span className="badge text-bg-success ms-2">Default</span>}
                                    <div className="small text-muted">
                                        {r.fileName} &middot; added {new Date(r.uploadedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-nowrap">
                                    <button className="btn btn-sm btn-outline-secondary me-1" title="View"
                                        onClick={() => setViewResume(r)}>
                                        <i className="bi bi-eye"></i>
                                    </button>
                                    {!r.isDefault && (
                                        <button className="btn btn-sm btn-outline-success me-1" title="Make default"
                                            onClick={() => makeDefault(r.id)}>
                                            <i className="bi bi-check2-circle"></i>
                                        </button>
                                    )}
                                    {r.shared && <span className="badge text-bg-info ms-2">Shared with employers</span>}

                                    <button className={`btn btn-sm me-1 ${r.shared ? 'btn-info' : 'btn-outline-info'}`}
                                        title={r.shared ? "Stop sharing" : "Share with employers"}
                                        onClick={() => toggleShare(r)}>
                                        <i className={`bi ${r.shared ? 'bi-eye-slash' : 'bi-share'}`}></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-primary me-1" title="Rename"
                                        onClick={() => startEdit(r)}>
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" title="Delete"
                                        onClick={() => removeResume(r.id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))
                }
            </ul>

            {/* Upload / edit form */}
            <h6 className="fw-bold">{editId ? "Rename resume" : "Upload a new resume"}</h6>
            <form onSubmit={(e) => saveResume(e)}>
                <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Label</label>
                    <input type="text" className="form-control" required maxLength="150"
                        placeholder="e.g. Java Developer Resume"
                        value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>
                {!editId && (
                    <div className="mb-3">
                        <label className="form-label small fw-semibold text-secondary">
                            Resume file (PDF, maximum 5 MB)
                        </label>
                        <input key={fileKey} type="file" accept="application/pdf"
                            className="form-control" required onChange={handleFile} />
                    </div>
                )}
                <button type="submit" className="btn btn-primary me-2" disabled={!editId && !file}>
                    <i className={`bi ${editId ? 'bi-check2-circle' : 'bi-upload'} me-1`}></i>
                    {editId ? "Update Label" : "Upload Resume"}
                </button>
                {editId && (
                    <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancel</button>
                )}
            </form>

            {/* Preview window */}
            {viewResume && (
                <div>
                    <div className="modal d-block overflow-y-auto" tabIndex="-1">
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{viewResume.label}</h5>
                                    <button type="button" className="btn-close" onClick={() => setViewResume(null)}></button>
                                </div>
                                <div className="modal-body">
                                    <ResumeViewer key={viewResume.id} apiPath={`/api/resume/${viewResume.id}/file`}
                                        fileName={viewResume.fileName} filePath={viewResume.filePath} />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setViewResume(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show"></div>
                </div>
            )}
        </div>
    )
}

export default ResumeManager
