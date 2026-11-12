import axios from "axios"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { useDispatch, useSelector } from "react-redux"
import { API_SERVER_URL_DEV, PAGE_SIZE } from "../../../config"
import { statusChartColors, statusColors, statusList, statusLabel } from "../../utils/statusColors"
import { getProfileStrength } from "../../utils/profile"
import { getResumes } from "../../store/actions/ResumeAction"
import Widget from "../common/Widget"
import DoughnutChart from "../common/DoughnutChart"
import HorizontalBarChart from "../common/HorizontalBarChart"
import Pagination from "../common/Pagination"
import AppNavbar from "../common/AppNavbar"
import ApplicationTimeline from "./ApplicationTimeline"

const size = PAGE_SIZE

function JobSeekerDashboard() {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const resumes = useSelector(state => state.resumes)

    const [jobSeeker, setJobSeeker] = useState(null)
    const [applications, setApplications] = useState([])
    const [tableApplications, setTableApplications] = useState([])
    const [savedCount, setSavedCount] = useState(0)
    const [page, setPage] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
    const [refresh, setRefresh] = useState(0)
    const [errMsg, setErrMsg] = useState("")
    const [trackApp, setTrackApp] = useState(null)

    useEffect(() => {
        const loadDashboard = async () => {
            // step 1: check that the user is logged in and has the right role
            if (!localStorage.getItem('token')) {
                navigate("/login")
                return
            }
            try {
                const resp = await axios.get(API_SERVER_URL_DEV + '/api/auth/user-details',
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                if (resp.data.role !== 'JOB_SEEKER') {
                    navigate("/no-access")
                    return
                }
            }
            catch {
                navigate("/no-access")
                return
            }

            try {
                const jsResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobseeker/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const js = jsResp.data
                setJobSeeker(js)

                const appResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobApplication/applicant/${js.id}?page=0&size=1000`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })

                setApplications(appResp.data.content)

                const savedResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/savedJob/jobseeker/${js.id}?page=0&size=1`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setSavedCount(savedResp.data.paginationInfo.totalRecords)

                await dispatch(getResumes(js.id))
            }
            catch {
                setErrMsg("Could not load the dashboard data")
            }
        }
        loadDashboard()
    }, [navigate, dispatch])

    const jobSeekerId = jobSeeker ? jobSeeker.id : null
    useEffect(() => {
        if (jobSeekerId === null) {
            return
        }
        const getApplications = async () => {
            try {
                const response = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobApplication/applicant/${jobSeekerId}?page=${page}&size=${size}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })

                if (response.data.content.length === 0 && page > 0) {
                    setPage(Math.max(response.data.paginationInfo.totalPages - 1, 0))
                    return
                }
                setTableApplications(response.data.content)
                setPaginationInfo(response.data.paginationInfo)
            }
            catch {
                setErrMsg("Could not load your applications")
            }
        }
        getApplications()
    }, [jobSeekerId, page, refresh])

    const withdraw = async (id) => {
        if (!window.confirm("Withdraw this application?")) {
            return
        }
        setErrMsg("")
        try {
            await axios.delete(`${API_SERVER_URL_DEV}/api/jobApplication/${id}`,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })

            setApplications(applications.filter(a => a.id !== id))
            setRefresh(refresh + 1)
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not withdraw the application"))
        }
    }

    const countOf = (status) => applications.filter(a => a.status === status).length
    const inProgress = countOf('APPLIED') + countOf('UNDER_REVIEW')

    const statusLabels = statusList.filter(s => countOf(s) > 0)
    const statusValues = statusLabels.map(s => countOf(s))

    const strength = jobSeeker ? getProfileStrength(jobSeeker, resumes.length) : null
    const missing = strength ? strength.checks.filter(c => !c.done) : []

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="JOB_SEEKER" />

            <div className="container-fluid px-4 py-4">

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                {/* Welcome */}
                <div className="mb-4">
                    <h3 className="fw-bold mb-0">Welcome, {jobSeeker ? jobSeeker.fullName : localStorage.getItem('username')}</h3>
                    <p className="text-muted mb-0">
                        {jobSeeker && jobSeeker.location && <><i className="bi bi-geo-alt me-1"></i>{jobSeeker.location}</>}
                    </p>
                </div>

                {/* Profile strength reminder */}
                {strength && strength.percent < 100 && (
                    <div className="alert alert-warning d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <i className="bi bi-person-exclamation me-2"></i>
                            Your profile is <strong>{strength.percent}%</strong> complete. Still missing: {missing.map(m => m.label).join(", ")}.
                        </div>
                        <Link to={`/jobseeker/profile`} className="btn btn-sm btn-warning">
                            <i className="bi bi-person-gear me-1"></i>Complete profile
                        </Link>
                    </div>
                )}

                {/* Widgets */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Applications" value={applications.length} icon="bi-file-earmark-text" color="primary" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="In Progress" value={inProgress} icon="bi-hourglass-split" color="info" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Shortlisted" value={countOf('SHORTLISTED')} icon="bi-star" color="warning" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Hired" value={countOf('HIRED')} icon="bi-check-circle" color="success" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Saved Jobs" value={savedCount} icon="bi-bookmark-heart" color="secondary" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Resumes" value={resumes.length} icon="bi-file-earmark-person" color="danger" />
                    </div>
                </div>

                {/* Charts */}
                <div className="row g-3 mb-4">
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Applications by status</div>
                            <div className="card-body">
                                {statusLabels.length === 0
                                    ? <p className="text-muted text-center my-5">No applications yet</p>
                                    : <DoughnutChart labels={statusLabels.map(s => statusLabel(s))} values={statusValues}
                                        colors={statusLabels.map(s => statusChartColors[s])} label="Applications" />
                                }
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Application pipeline</div>
                            <div className="card-body">
                                {applications.length === 0
                                    ? <p className="text-muted text-center my-5">No applications yet</p>
                                    : <HorizontalBarChart labels={statusList.map(s => statusLabel(s))}
                                        values={statusList.map(s => countOf(s))}
                                        colors={statusList.map(s => statusChartColors[s])} label="Applications" />
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* My applications table */}
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white fw-semibold">My Applications</div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">Job</th>
                                        <th scope="col">Company</th>
                                        <th scope="col">Applied On</th>
                                        <th scope="col">Status</th>
                                        <th scope="col" className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableApplications.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted py-4">
                                                <i className="bi bi-inbox fs-3 d-block"></i>
                                                No applications yet.{" "}
                                                <Link to={`/jobseeker/jobs`}>Find a job to apply</Link>
                                            </td>
                                        </tr>
                                    )}
                                    {
                                        tableApplications.map((a, index) => (
                                            <tr key={a.id}>
                                                <th scope="row">{page * size + index + 1}</th>
                                                <td className="fw-semibold">{a.jobTitle}</td>
                                                <td>{a.companyName}</td>
                                                <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`badge text-bg-${statusColors[a.status]}`}>
                                                        {statusLabel(a.status)}
                                                    </span>
                                                </td>
                                                <td className="text-end text-nowrap">
                                                    <button className="btn btn-sm btn-outline-primary me-1"
                                                        onClick={() => setTrackApp(a)}>
                                                        <i className="bi bi-clock-history me-1"></i>Track
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" title="Withdraw application"
                                                        onClick={() => withdraw(a.id)}>
                                                        <i className="bi bi-x-circle me-1"></i>Withdraw
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

            {/* Status history + message the employer */}
            {trackApp && jobSeeker && (
                <ApplicationTimeline application={trackApp} userId={jobSeeker.userId}
                    onClose={() => setTrackApp(null)} />
            )}
        </div>
    )
}

export default JobSeekerDashboard