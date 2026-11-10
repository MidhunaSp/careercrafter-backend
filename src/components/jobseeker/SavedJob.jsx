import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV, PAGE_SIZE } from "../../../config"
import AppNavbar from "../common/AppNavbar"
import Pagination from "../common/Pagination"
import JobDetailsModal from "./JobDetailsModal"

const size = PAGE_SIZE

function SavedJob() {

    const navigate = useNavigate()

    const [jobSeeker, setJobSeeker] = useState(null)
    const [applications, setApplications] = useState([])
    const [savedJobs, setSavedJobs] = useState([])
    const [page, setPage] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
    const [refresh, setRefresh] = useState(0)
    const [selectedJob, setSelectedJob] = useState(null)
    const [errMsg, setErrMsg] = useState("")

    useEffect(() => {
        const loadPage = async () => {
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

            // step 2: job seeker and applications (to block a second apply), the saved jobs load page by page below
            try {
                const jsResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobseeker/by-username?username=${localStorage.getItem('username')}`,
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                const js = jsResp.data
                setJobSeeker(js)

                const appResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobApplication/applicant/${js.id}?page=0&size=1000`,
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                setApplications(appResp.data.content)
            }
            catch {
                setErrMsg("Could not load your saved jobs")
            }
        }
        loadPage()
    }, [navigate])

    // runs when the job seeker, the page or refresh changes: load only one page of saved jobs from the backend
    const jobSeekerId = jobSeeker ? jobSeeker.id : null
    useEffect(() => {
        if (jobSeekerId === null) {
            return
        }
        const getSavedJobs = async () => {
            try {
                const response = await axios.get(
                    `${API_SERVER_URL_DEV}/api/savedJob/jobseeker/${jobSeekerId}?page=${page}&size=${size}`,
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                // the last saved job of the last page was removed -> go to the previous page
                if (response.data.content.length === 0 && page > 0) {
                    setPage(Math.max(response.data.paginationInfo.totalPages - 1, 0))
                    return
                }
                setSavedJobs(response.data.content)
                setPaginationInfo(response.data.paginationInfo)
            }
            catch {
                setErrMsg("Could not load your saved jobs")
            }
        }
        getSavedJobs()
    }, [jobSeekerId, page, refresh])

    // the saved job has only a few fields, so fetch the full job before opening it
    const openJob = async (jobId) => {
        setErrMsg("")
        try {
            const response = await axios.get(`${API_SERVER_URL_DEV}/api/job/${jobId}`,
                { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
            setSelectedJob(response.data)
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not load the job"))
        }
    }

    const remove = async (id) => {
        setErrMsg("")
        try {
            await axios.delete(`${API_SERVER_URL_DEV}/api/savedJob/${id}`,
                { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
            // load the page again from the backend
            setRefresh(refresh + 1)
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not remove the saved job"))
        }
    }

    const onApplied = async () => {
        const appResp = await axios.get(
            `${API_SERVER_URL_DEV}/api/jobApplication/applicant/${jobSeeker.id}?page=0&size=1000`,
            { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
        setApplications(appResp.data.content)
    }

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="JOB_SEEKER" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-4">Saved Jobs</h3>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                <div className="card border-0 shadow-sm">
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">Job</th>
                                        <th scope="col">Company</th>
                                        <th scope="col">Location</th>
                                        <th scope="col">Saved On</th>
                                        <th scope="col" className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {savedJobs.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted py-4">
                                                <i className="bi bi-bookmark fs-3 d-block"></i>No saved jobs yet
                                            </td>
                                        </tr>
                                    )}
                                    {
                                        savedJobs.map((s, index) => (
                                            <tr key={s.id}>
                                                <th scope="row">{page * size + index + 1}</th>
                                                <td>
                                                    <span className="fw-semibold">{s.jobTitle}</span>
                                                    {applications.some(a => a.jobId === s.jobId) &&
                                                        <span className="badge text-bg-success ms-2">Applied</span>}
                                                </td>
                                                <td>{s.companyName}</td>
                                                <td>{s.location}</td>
                                                <td>{new Date(s.savedAt).toLocaleDateString()}</td>
                                                <td className="text-end text-nowrap">
                                                    <button className="btn btn-sm btn-primary me-1" onClick={() => openJob(s.jobId)}>
                                                        <i className="bi bi-eye me-1"></i>View
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" title="Remove"
                                                        onClick={() => remove(s.id)}>
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

            {selectedJob && jobSeeker && (
                <JobDetailsModal job={selectedJob} jobSeekerId={jobSeeker.id}
                    alreadyApplied={applications.some(a => a.jobId === selectedJob.id)}
                    onApplied={onApplied} onClose={() => setSelectedJob(null)} />
            )}
        </div>
    )
}

export default SavedJob