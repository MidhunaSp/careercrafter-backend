import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV, PAGE_SIZE } from "../../../config"
import { statusChartColors, statusLabel } from "../../utils/statusColors"
import Widget from "../common/Widget"
import DoughnutChart from "../common/DoughnutChart"
import BarChart from "../common/HorizontalBarChart"
import Pagination from "../common/Pagination"
import AppNavbar from "../common/AppNavbar"
import AddJob from "./AddJob"

const size = PAGE_SIZE

function EmployerDashboard() {

    const navigate = useNavigate()

    const [employer, setEmployer] = useState(null)
    const [statusStats, setStatusStats] = useState([])
    const [jobStats, setJobStats] = useState([])
    const [jobs, setJobs] = useState([])
    const [allJobs, setAllJobs] = useState([])
    const [page, setPage] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
    const [errMsg, setErrMsg] = useState("")
    const [showForm, setShowForm] = useState(false)
    const [refresh, setRefresh] = useState(0)
    const [editJob, setEditJob] = useState(null)

    // loads the employer, the stats and all the jobs of this employer
    useEffect(() => {
        const loadDashboard = async () => {
            // step 1: check that the user is logged in and has the right role
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

            // step 2: employer details, stats for the widgets / charts and the jobs
            try {
                const empResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/employer/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setEmployer(empResp.data)

                const statusResp = await axios.get(
                    API_SERVER_URL_DEV + '/api/stats/employer/applications-by-status',
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setStatusStats(statusResp.data)

                const jobStatResp = await axios.get(
                    API_SERVER_URL_DEV + '/api/stats/employer/applicants-per-job',
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setJobStats(jobStatResp.data)

                const jobResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/job/employer/${empResp.data.id}?page=0&size=1000`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })

                setAllJobs(jobResp.data.content)
            }
            catch {
                setErrMsg("Could not load the dashboard data")
            }
        }
        loadDashboard()
    }, [refresh, navigate])

    const employerId = employer ? employer.id : null
    useEffect(() => {
        if (employerId === null) {
            return
        }
        const getJobs = async () => {
            try {
                const response = await axios.get(
                    `${API_SERVER_URL_DEV}/api/job/employer/${employerId}?page=${page}&size=${size}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                // the last job of the last page was deleted -> go to the previous page
                if (response.data.content.length === 0 && page > 0) {
                    setPage(Math.max(response.data.paginationInfo.totalPages - 1, 0))
                    return
                }
                setJobs(response.data.content)
                setPaginationInfo(response.data.paginationInfo)
            }
            catch {
                setErrMsg("Could not load the jobs")
            }
        }
        getJobs()
    }, [employerId, page, refresh])

    const onJobSaved = () => {
        setPage(0)
        setRefresh(refresh + 1)
    }

    const changeJobState = async (id, action) => {
        setErrMsg("")
        try {
            await axios.put(`${API_SERVER_URL_DEV}/api/job/${id}/${action}`, {},
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setJobs(jobs.map(j => j.id === id ? { ...j, active: action === 'reopen' } : j))
            setAllJobs(allJobs.map(j => j.id === id ? { ...j, active: action === 'reopen' } : j))
        }
        catch {
            setErrMsg(action === 'close' ? "Could not close the job" : "Could not reopen the job")
        }
    }

    const startEdit = (job) => {
        setEditJob(job)
        setShowForm(true)
        window.scrollTo(0, 0)
    }

    const deleteJob = async (id) => {
        if (!window.confirm("Delete this job permanently?")) {
            return
        }
        setErrMsg("")
        try {
            await axios.delete(`${API_SERVER_URL_DEV}/api/job/${id}`,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setRefresh(refresh + 1)
        }
        catch {
            setErrMsg("Could not delete the job. If it already has applicants, close it instead.")
        }
    }

    // widget values
    const countOf = (status) => {
        const found = statusStats.find(s => s.status === status)
        return found ? found.count : 0
    }
    const totalApplications = statusStats.reduce((sum, s) => sum + s.count, 0)
    const activeJobs = allJobs.filter(j => j.active).length
    const toReview = countOf('APPLIED') + countOf('UNDER_REVIEW')
    

    const applicantsOf = (jobId) => {
        const found = jobStats.find(s => s.jobId === jobId)
        return found ? found.applicants : 0
    }

    const isVerified = employer && employer.verificationStatus === 'VERIFIED'

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="EMPLOYER" />

            <div className="container-fluid px-4 py-4">

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                {/* Welcome */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                    <div>
                        <h3 className="fw-bold mb-0">Welcome, {employer ? employer.fullName : localStorage.getItem('username')}</h3>
                        <p className="text-muted mb-0"><i className="bi bi-building me-1"></i>{employer ? employer.companyName : ""}</p>
                    </div>
                    <div className="d-flex align-items-center">
                        {employer && (
                            <span className={`badge fs-6 ${isVerified ? 'text-bg-success' : 'text-bg-warning'}`}>
                                <i className={`bi ${isVerified ? 'bi-patch-check-fill' : 'bi-hourglass-split'} me-1`}></i>
                                {isVerified ? 'Verified' : 'Pending verification'}
                            </span>
                        )}
                        <button className="btn btn-primary ms-3" onClick={() => { setEditJob(null); setShowForm(!showForm) }}
                            disabled={!isVerified}>
                            <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-1`}></i>{showForm ? "Hide Form" : "Post New Job"}
                        </button>
                    </div>
                </div>

                {employer && !isVerified && (
                    <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Your account is not verified yet. You can post jobs only after the admin verifies it.
                    </div>
                )}

                {/* Post / edit job form */}
                {showForm && employer && (
                    <div className="mb-4">
                        <AddJob key={editJob ? editJob.id : "new"} employerId={employer.id}
                            job={editJob} onJobAdded={onJobSaved} />
                    </div>
                )}

                {/* Widgets */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Total Jobs" value={paginationInfo.totalRecords} icon="bi-briefcase" color="primary" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Active Jobs" value={activeJobs} icon="bi-broadcast" color="success" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Applications" value={totalApplications} icon="bi-file-earmark-text" color="info" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="To Review" value={toReview} icon="bi-hourglass-split" color="secondary" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Shortlisted" value={countOf('SHORTLISTED')} icon="bi-star" color="warning" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Hired" value={countOf('HIRED')} icon="bi-check-circle" color="success" />
                    </div>
                </div>

                {/* Charts */}
                <div className="row g-3 mb-4">
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Applications by status</div>
                            <div className="card-body">
                                {statusStats.length === 0
                                    ? <p className="text-muted text-center my-5">No applications yet</p>
                                    : <DoughnutChart labels={statusStats.map(s => statusLabel(s.status))}
                                        values={statusStats.map(s => s.count)}
                                        colors={statusStats.map(s => statusChartColors[s.status])}
                                        label="Applications" />
                                }
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Applicants per job</div>
                            <div className="card-body">
                                {jobStats.length === 0
                                    ? <p className="text-muted text-center my-5">No jobs posted yet</p>
                                    : <BarChart labels={jobStats.map(j => j.jobTitle)}
                                        values={jobStats.map(j => j.applicants)} label="Applicants" />
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* My jobs table */}
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white fw-semibold">My Jobs</div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">Title</th>
                                        <th scope="col">Location</th>
                                        <th scope="col">Type</th>
                                        <th scope="col" className="text-center">Applicants</th>
                                        <th scope="col">Posted On</th>
                                        <th scope="col">Status</th>
                                        <th scope="col" className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center text-muted py-4">
                                                <i className="bi bi-inbox fs-3 d-block"></i>No jobs to show
                                            </td>
                                        </tr>
                                    )}
                                    {
                                        jobs.map((j, index) => (
                                            <tr key={j.id}>
                                                <th scope="row">{page * size + index + 1}</th>
                                                <td className="fw-semibold">{j.title}</td>
                                                <td>{j.location}</td>
                                                <td>{statusLabel(j.employmentType)}</td>
                                                <td className="text-center">
                                                    <span className="badge text-bg-light border">{applicantsOf(j.id)}</span>
                                                </td>
                                                <td>{j.createdAt.split("T")[0]}</td>
                                                <td>
                                                    <span className={`badge ${j.active ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                                        {j.active ? 'Active' : 'Closed'}
                                                    </span>
                                                </td>
                                                <td className="text-end text-nowrap">
                                                    <button className="btn btn-sm btn-outline-primary me-1" title="Edit"
                                                        onClick={() => startEdit(j)}>
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    {j.active ? (
                                                        <button className="btn btn-sm btn-outline-warning me-1" title="Close job"
                                                            onClick={() => changeJobState(j.id, 'close')}>
                                                            <i className="bi bi-lock"></i>
                                                        </button>
                                                    ) : (
                                                        <button className="btn btn-sm btn-outline-success me-1" title="Reopen job"
                                                            onClick={() => changeJobState(j.id, 'reopen')}>
                                                            <i className="bi bi-unlock"></i>
                                                        </button>
                                                    )}
                                                    <button className="btn btn-sm btn-outline-danger" title="Delete"
                                                        onClick={() => deleteJob(j.id)}>
                                                        <i className="bi bi-trash"></i>
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

            </div>
        </div>
    )
}

export default EmployerDashboard