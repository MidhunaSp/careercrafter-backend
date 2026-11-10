import axios from "axios"
import { useEffect, useState } from "react"
import { API_SERVER_URL_DEV } from "../../../config"
import { statusColors, statusLabel } from "../../utils/statusColors"
import CandidateProfile from "../common/CandidateProfile"
import ResumeViewer from "../common/ResumeViewer"
import ChatBox from "../common/ChatBox"

// window opened by the employer to review one application:
function ApplicationReview({ application, employerUserId, onStatusChanged, onClose }) {

    const [tab, setTab] = useState("profile")
    const [profile, setProfile] = useState(null)
    const [resume, setResume] = useState(null)
    const [resumeLoading, setResumeLoading] = useState(true)
    const [resumeErr, setResumeErr] = useState(false)
    const [timeline, setTimeline] = useState([])
    const [newStatus, setNewStatus] = useState("UNDER_REVIEW")
    const [note, setNote] = useState("")
    const [errMsg, setErrMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    const timelineUrl = `${API_SERVER_URL_DEV}/api/applicationStatusHistory/${application.id}`

    // load the candidate profile, the resume details and the status timeline.
    // each request is separate, so one failing does not stop the others
    useEffect(() => {
        const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        let cancelled = false

        setResumeLoading(true)
        setResumeErr(false)

        axios.get(`${API_SERVER_URL_DEV}/api/jobseeker/${application.applicantId}`, { headers })
            .then(r => { if (!cancelled) setProfile(r.data) })
            .catch(() => { if (!cancelled) setErrMsg("Could not load the candidate profile") })

        axios.get(timelineUrl, { headers })
            .then(r => { if (!cancelled) setTimeline(r.data) })
            .catch(() => { if (!cancelled) setErrMsg("Could not load the status timeline") })

        axios.get(`${API_SERVER_URL_DEV}/api/resume/application/${application.id}`, { headers })
            .then(r => { if (!cancelled) setResume(r.data) })
            .catch(() => { if (!cancelled) setResumeErr(true) })
            .finally(() => { if (!cancelled) setResumeLoading(false) })

        return () => { cancelled = true }
    }, [application.id, application.applicantId, timelineUrl])

    const updateStatus = async (e) => {
        e.preventDefault()
        setErrMsg("")
        setSuccessMsg("")

        try {
            await axios.post(
                `${API_SERVER_URL_DEV}/api/applicationStatusHistory/add/${application.id}`,
                { 'status': newStatus, 'note': note },
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setSuccessMsg("Status updated to " + statusLabel(newStatus))
            setNote("")

            // load the timeline again so the new entry shows up
            const timelineResp = await axios.get(timelineUrl,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setTimeline(timelineResp.data)

            onStatusChanged(newStatus)
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not update the status"))
        }
    }

    const tabs = [
        { key: "profile", icon: "bi-person-lines-fill", label: "Profile & Resume" },
        { key: "status", icon: "bi-clock-history", label: "Status" },
        { key: "chat", icon: "bi-chat-dots", label: "Messages" }
    ]

    return (
        <div>
            <div className="modal d-block overflow-y-auto" tabIndex="-1">
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">

                        <div className="modal-header">
                            <div>
                                <h5 className="modal-title">{application.applicantName}</h5>
                                <small className="text-muted">
                                    Applied for <span className="fw-semibold">{application.jobTitle}</span> on {new Date(application.appliedAt).toLocaleDateString()}
                                </small>
                            </div>
                            <div className="ms-auto me-3">
                                <span className={`badge fs-6 text-bg-${statusColors[application.status]}`}>
                                    {statusLabel(application.status)}
                                </span>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">

                            {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}

                            <ul className="nav nav-tabs mb-4">
                                {
                                    tabs.map(t => (
                                        <li className="nav-item" key={t.key}>
                                            <button className={`nav-link ${tab === t.key ? 'active' : ''}`}
                                                onClick={() => setTab(t.key)}>
                                                <i className={`bi ${t.icon} me-1`}></i>{t.label}
                                            </button>
                                        </li>
                                    ))
                                }
                            </ul>

                            {/* Tab 1: profile and resume side by side */}
                            {tab === "profile" && (
                                <div className="row g-4">
                                    <div className="col-lg-5">
                                        <div className="card border-0 bg-body-tertiary h-100">
                                            <div className="card-body">
                                                {profile
                                                    ? <CandidateProfile profile={profile} />
                                                    : <div className="text-muted">Loading profile...</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-7">
                                        <h6 className="fw-bold"><i className="bi bi-file-earmark-pdf me-1"></i>Resume submitted with this application</h6>
                                        {resume ? (
                                            <div>
                                                <p className="mb-2 text-muted small">
                                                    <span className="fw-semibold text-body">{resume.label}</span> &middot; {resume.fileName}
                                                </p>
                                                <ResumeViewer key={resume.id}
                                                    apiPath={`/api/resume/application/${application.id}/file`}
                                                    fileName={resume.fileName} filePath={resume.filePath} />
                                            </div>
                                        ) : resumeLoading ? (
                                            <p className="text-muted">Loading resume...</p>
                                        ) : resumeErr ? (
                                            <div className="alert alert-warning mb-0">
                                                <i className="bi bi-exclamation-triangle me-2"></i>Could not load the resume for this application.
                                            </div>
                                        ) : (
                                            <p className="text-muted">No resume to show</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: timeline and status update */}
                            {tab === "status" && (
                                <div className="row g-4">
                                    <div className="col-lg-6">
                                        <h6 className="fw-bold"><i className="bi bi-clock-history me-1"></i>Status Timeline</h6>
                                        <ul className="list-group">
                                            {timeline.length === 0 && (
                                                <li className="list-group-item text-muted">No history yet</li>
                                            )}
                                            {
                                                timeline.map(t => (
                                                    <li key={t.id} className="list-group-item">
                                                        <span className={`badge text-bg-${statusColors[t.status]}`}>
                                                            {statusLabel(t.status)}
                                                        </span>
                                                        <div className="small mt-1">{t.note}</div>
                                                        <div className="small text-muted">{new Date(t.changedAt).toLocaleString()}</div>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </div>
                                    <div className="col-lg-6">
                                        <h6 className="fw-bold"><i className="bi bi-pencil-square me-1"></i>Update Status</h6>

                                        {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

                                        <form onSubmit={(e) => updateStatus(e)}>
                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold text-secondary">New Status</label>
                                                <select className="form-select" value={newStatus}
                                                    onChange={(e) => setNewStatus(e.target.value)}>
                                                    <option value="UNDER_REVIEW">Under Review</option>
                                                    <option value="SHORTLISTED">Shortlisted</option>
                                                    <option value="REJECTED">Rejected</option>
                                                    <option value="HIRED">Hired</option>
                                                </select>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small fw-semibold text-secondary">Note</label>
                                                <textarea className="form-control" rows="3" maxLength="500"
                                                    placeholder="Add a note for the candidate (optional)"
                                                    value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                                            </div>
                                            <button type="submit" className="btn btn-primary">
                                                <i className="bi bi-check2-circle me-1"></i>Update Status
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: chat with the candidate */}
                            {tab === "chat" && (
                                <div className="row justify-content-center">
                                    <div className="col-lg-8">
                                        {profile && employerUserId
                                            ? <ChatBox senderId={employerUserId} receiverId={profile.userId}
                                                jobApplicationId={application.id} />
                                            : <p className="text-muted">Loading...</p>}
                                    </div>
                                </div>
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

export default ApplicationReview