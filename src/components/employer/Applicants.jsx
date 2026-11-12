import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV,PAGE_SIZE } from "../../../config"
import { statusColors, statusList, statusLabel } from "../../utils/statusColors"
import AppNavbar from "../common/AppNavbar"
import Pagination from "../common/Pagination"
import ApplicationReview from "./ApplicationReview"

const size = PAGE_SIZE

function Applicants() {

    const navigate = useNavigate()

    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [jobId, setJobId] = useState("")
    const [status, setStatus] = useState("")
    const [applications, setApplications] = useState([])
    const [page, setPage] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
    const [selected, setSelected] = useState(null)
    const [errMsg, setErrMsg] = useState("")
    const [employerUserId, setEmployerUserId] = useState(null)

    useEffect(() => {
        const loadJobs = async () => {
            
            if (!localStorage.getItem('token')) {
                navigate("/login")
                return
            }
            try {
                const resp = await axios.get(API_SERVER_URL_DEV + '/api/auth/user-details',
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                if (resp.data.role !== 'EMPLOYER') {
                    navigate("/no-access")
                    return
                }
            }
            catch {
                navigate("/no-access")
                return
            }

            try {
                const empResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/employer/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setEmployerUserId(empResp.data.userId)
                const jobResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/job/employer/${empResp.data.id}?page=0&size=1000`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })

                setJobs(jobResp.data.content)
                if (jobResp.data.content.length > 0) {
                    setJobId(jobResp.data.content[0].id)
                }
            }
            catch {
                setErrMsg("Could not load your jobs")
            }
            setLoading(false)
        }
        loadJobs()
    }, [navigate])

    useEffect(() => {
        if (jobId === "") {
            return
        }
        const getApplications = async () => {
            let url = `${API_SERVER_URL_DEV}/api/jobApplication/job/${jobId}?page=${page}&size=${size}`
            if (status !== "") {
                url = url + `&status=${status}`
            }
            try {
                const response = await axios.get(url,
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                setApplications(response.data.content)
                setPaginationInfo(response.data.paginationInfo)
                setErrMsg("")
            }
            catch {
                setErrMsg("Could not load the applicants")
            }
        }
        getApplications()
    }, [jobId, status, page])

    const onJobChange = (e) => {
        setJobId(e.target.value)
        setPage(0)
    }

    const onStatusChange = (e) => {
        setStatus(e.target.value)
        setPage(0)
    }

    const onStatusChanged = (newStatus) => {
        setApplications(applications.map(a => a.id === selected.id ? { ...a, status: newStatus } : a))
        setSelected({ ...selected, status: newStatus })
    }

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="EMPLOYER" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-4">Applicants</h3>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                {!loading && jobs.length === 0 && (
                    <div className="alert alert-info">
                        You have not posted any jobs yet. Post a job from the dashboard to receive applicants.
                    </div>
                )}

                {jobs.length > 0 && (
                    <>
                        {/* Filters */}
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold text-secondary">Job</label>
                                        <select className="form-select" value={jobId} onChange={(e) => onJobChange(e)}>
                                            {
                                                jobs.map(j => (
                                                    <option key={j.id} value={j.id}>
                                                        {j.title} {j.active ? "" : "(Closed)"}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold text-secondary">Status</label>
                                        <select className="form-select" value={status} onChange={(e) => onStatusChange(e)}>
                                            <option value="">All</option>
                                            {statusList.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Applicants table */}
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white fw-semibold">Applicants</div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th scope="col">#</th>
                                                <th scope="col">Applicant</th>
                                                <th scope="col">Applied On</th>
                                                <th scope="col">Last Updated</th>
                                                <th scope="col">Status</th>
                                                <th scope="col" className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="text-center text-muted py-4">
                                                        <i className="bi bi-people fs-3 d-block"></i>No applicants to show
                                                    </td>
                                                </tr>
                                            )}
                                            {
                                                applications.map((a, index) => (
                                                    <tr key={a.id}>
                                                        <th scope="row">{page * size + index + 1}</th>
                                                        <td className="fw-semibold">
                                                            <i className="bi bi-person-circle text-secondary me-2"></i>{a.applicantName}
                                                        </td>
                                                        <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                                                        <td>{a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "-"}</td>
                                                        <td>
                                                            <span className={`badge text-bg-${statusColors[a.status]}`}>
                                                                {statusLabel(a.status)}
                                                            </span>
                                                        </td>
                                                        <td className="text-end text-nowrap">
                                                            <button className="btn btn-sm btn-primary" onClick={() => setSelected(a)}>
                                                                <i className="bi bi-eye me-1"></i>Review
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination page={page} setPage={setPage} paginationInfo={paginationInfo} />
                            </div>
                        </div>
                    </>
                )}

            </div>

            {/* Review window for the selected applicant */}
            {selected && (
                <ApplicationReview key={selected.id} application={selected} employerUserId={employerUserId}
                    onStatusChanged={onStatusChanged} onClose={() => setSelected(null)} />
            )}
        </div>
    )
}

export default Applicants