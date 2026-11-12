import axios from "axios"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { API_SERVER_URL_DEV } from "../../../config"
import { getResumes, uploadResume } from "../../store/actions/ResumeAction"

function JobDetailsModal({ job, jobSeekerId, alreadyApplied, onApplied, onClose }) {

    const dispatch = useDispatch()
    const resumes = useSelector(state => state.resumes)

    const [chosen, setChosen] = useState("")
    const [file, setFile] = useState(null)
    const [fileKey, setFileKey] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [applied, setApplied] = useState(alreadyApplied)
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

    const defaultResume = resumes.find(r => r.isDefault)
    const choice = chosen !== "" ? chosen : (defaultResume ? String(defaultResume.id) : "new")

    const handleFile = (e) => {
        setErrMsg("")
        const picked = e.target.files[0]
        if (picked && picked.size > 5 * 1024 * 1024) {
            setErrMsg("Resume file must be 5 MB or smaller")
            e.target.value = ""
            setFile(null)
            return
        }
        setFile(picked)
    }

    const apply = async (e) => {
        e.preventDefault()
        setErrMsg("")
        setSuccessMsg("")

        setSubmitting(true)
        try {
            let resumeId = choice

            // step 1: upload the resume pdf (it is also saved in the job seeker's resumes)
            if (choice === "new") {
                const label = file.name.replace(/\.pdf$/i, "").slice(0, 150)
                resumeId = await dispatch(uploadResume(jobSeekerId, file, label))
            }

            // step 2: apply with that resume
            await axios.post(
                `${API_SERVER_URL_DEV}/api/jobApplication/add/${job.id}/${jobSeekerId}?resumeId=${resumeId}`, {},
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setSuccessMsg("Application submitted successfully")
            setApplied(true)
            setFile(null)
            setFileKey(fileKey + 1)
            onApplied(job.id)
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not submit the application"))
        }
        setSubmitting(false)
    }

    return (
        <div>
            <div className="modal d-block overflow-y-auto" tabIndex="-1">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title">{job.title}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">
                            <p className="text-muted mb-3">
                                <i className="bi bi-building me-1"></i>{job.companyName}
                                <span className="mx-2">|</span>
                                <i className="bi bi-geo-alt me-1"></i>{job.location}
                            </p>

                            <div className="mb-3">
                                <span className="badge text-bg-secondary me-2">{job.employmentType.replaceAll("_", " ")}</span>
                                {job.industry && <span className="badge text-bg-info me-2">{job.industry}</span>}
                                <span className="badge text-bg-success">
                                    <i className="bi bi-currency-rupee"></i>
                                    {job.minSalary} - {job.maxSalary}
                                </span>
                            </div>

                            <h6 className="fw-bold">Description</h6>
                            <p>{job.description}</p>

                            <h6 className="fw-bold">Qualifications</h6>
                            <p>{job.qualifications}</p>

                            {job.applicationInstructions && (
                                <div>
                                    <h6 className="fw-bold">Application Instructions</h6>
                                    <p>{job.applicationInstructions}</p>
                                </div>
                            )}

                            <hr />

                            {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}
                            {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

                            {/* Application form */}
                            {applied ? (
                                !successMsg && (
                                    <div className="alert alert-info py-2 mb-0">
                                        <i className="bi bi-check-circle me-1"></i>You have already applied for this job
                                    </div>
                                )
                            ) : (
                                <form onSubmit={(e) => apply(e)}>
                                    <h6 className="fw-bold">Apply for this job</h6>

                                    <div className="mb-3">
                                        <label className="form-label small fw-semibold text-secondary">Resume</label>
                                        <select className="form-select" value={choice}
                                            onChange={(e) => { setChosen(e.target.value); setErrMsg("") }}>
                                            <option value="new">Upload a new resume (PDF)</option>
                                            {
                                                resumes.map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        Use saved resume: {r.label}{r.isDefault ? " (default)" : ""}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {choice === "new" && (
                                        <div className="mb-3">
                                            <label className="form-label small fw-semibold text-secondary">
                                                Resume file (PDF, maximum 5 MB)
                                            </label>
                                            <input key={fileKey} type="file" accept="application/pdf"
                                                className="form-control" required onChange={handleFile} />
                                            <div className="form-text">
                                                The resume is also saved in your profile, so you can reuse it for other jobs.
                                            </div>
                                        </div>
                                    )}

                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        <i className="bi bi-send me-1"></i>
                                        {submitting ? "Submitting..." : "Submit Application"}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show"></div>
        </div>
    )
}

export default JobDetailsModal