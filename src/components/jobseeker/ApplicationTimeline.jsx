import axios from "axios"
import { useEffect, useState } from "react"
import { API_SERVER_URL_DEV } from "../../../config"
import { statusColors, statusLabel } from "../../utils/statusColors"
import ChatBox from "../common/ChatBox"

function ApplicationTimeline({ application, userId, onClose }) {

    const [timeline, setTimeline] = useState([])
    const [employerUserId, setEmployerUserId] = useState(null)
    const [errMsg, setErrMsg] = useState("")

    useEffect(() => {
        const loadDetails = async () => {
            try {
                const response = await axios.get(
                    `${API_SERVER_URL_DEV}/api/applicationStatusHistory/${application.id}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setTimeline(response.data)

                // job -> employer -> user id of the employer
                const jobResp = await axios.get(`${API_SERVER_URL_DEV}/api/job/v1/${application.jobId}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const empResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/employer/v1/${jobResp.data.employerId}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setEmployerUserId(empResp.data.userId)
            }
            catch {
                setErrMsg("Could not load the application details")
            }
        }
        loadDetails()
    }, [application.id, application.jobId])

    return (
        <div>
            <div className="modal d-block overflow-y-auto" tabIndex="-1">
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">

                        <div className="modal-header">
                            <div>
                                <h5 className="modal-title">{application.jobTitle}</h5>
                                <small className="text-muted"><i className="bi bi-building me-1"></i>{application.companyName}</small>
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

                            <div className="row g-4">
                                <div className="col-lg-6">
                                    <h6 className="fw-bold"><i className="bi bi-clock-history me-1"></i>Status history</h6>
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
                                    <h6 className="fw-bold"><i className="bi bi-chat-dots me-1"></i>Message the employer</h6>
                                    {employerUserId
                                        ? <ChatBox senderId={userId} receiverId={employerUserId}
                                            jobApplicationId={application.id} />
                                        : <p className="text-muted">Loading...</p>}
                                </div>
                            </div>
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

export default ApplicationTimeline