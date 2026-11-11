import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV, PAGE_SIZE } from "../../../config"
import AppNavbar from "../common/AppNavbar"
import Pagination from "../common/Pagination"
import JobDetailsModal from "./JobDetailsModal"

const size = PAGE_SIZE

function JobSearch() {

    const navigate = useNavigate()

    const [jobSeeker, setJobSeeker] = useState(null)
    const [applications, setApplications] = useState([])
    const [savedJobs, setSavedJobs] = useState([])
    const [jobs, setJobs] = useState([])
    const [title, setTitle] = useState("")
    const [location, setLocation] = useState("")
    const [industry, setIndustry] = useState("")
    const [employmentType, setEmploymentType] = useState("")
    const [minSalary, setMinSalary] = useState("")
    const [page, setPage] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
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

            // step 2: job seeker, saved jobs and applications , the jobs load page by page below
            try {
                const jsResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobseeker/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const js = jsResp.data
                setJobSeeker(js)

                const savedResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/savedJob/jobseeker/${js.id}?page=0&size=1000`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setSavedJobs(savedResp.data.content)

                const appResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobApplication/applicant/${js.id}?page=0&size=1000`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setApplications(appResp.data.content)
            }
            catch {
                setErrMsg("Could not load the jobs")
            }
        }
        loadPage()
    }, [navigate])


    const formatSalary = (job) => {
        const f = (n) => (n === null || n === undefined || n === "") ? null : Number(n).toLocaleString("en-IN")
        const min = f(job.minSalary)
        const max = f(job.maxSalary)
        return min && max ? `₹${min} - ₹${max}` : (min ? `From ₹${min}` : (max ? `Up to ₹${max}` : "Not disclosed"))
    }

    useEffect(() => {
        const getJobs = async () => {
            const query = new URLSearchParams({ page: page, size: size })
            if (title !== "") {
                query.append("keyword", title)
            }
            if (location !== "") {
                query.append("location", location)
            }
            if (industry !== "") {
                query.append("industry", industry)
            }
            if (employmentType !== "") {
                query.append("employmentType", employmentType)
            }
            if (minSalary !== "") {
                query.append("minSalary", minSalary)
            }
            try {
                const response = await axios.get(`${API_SERVER_URL_DEV}/api/job/filter/v1?${query.toString()}`)
                setJobs(response.data.content)
                setPaginationInfo(response.data.paginationInfo)
                setErrMsg("")
            }
            catch {
                setErrMsg("Could not load the jobs")
            }
        }
        getJobs()
    }, [title, location, industry, employmentType, minSalary, page])

    const toggleSave = async (job) => {
        setErrMsg("")
        const saved = savedJobs.find(s => s.jobId === job.id)
        try {
            if (saved) {
                await axios.delete(`${API_SERVER_URL_DEV}/api/savedJob/${saved.id}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
            }
            else {
                await axios.post(`${API_SERVER_URL_DEV}/api/savedJob/add/${jobSeeker.id}/${job.id}`, {},
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
            }
            const savedResp = await axios.get(
                `${API_SERVER_URL_DEV}/api/savedJob/jobseeker/${jobSeeker.id}?page=0&size=1000`,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setSavedJobs(savedResp.data.content)
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not update the saved jobs"))
        }
    }

    // the job gets the Applied mark without loading the page again
    const onApplied = async () => {
        const appResp = await axios.get(
            `${API_SERVER_URL_DEV}/api/jobApplication/applicant/${jobSeeker.id}?page=0&size=1000`,
            {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            })
        setApplications(appResp.data.content)
    }

    const clearFilters = () => {
        setTitle("")
        setLocation("")
        setIndustry("")
        setEmploymentType("")
        setMinSalary("")
        setPage(0)
    }

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="JOB_SEEKER" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-4">Find Jobs</h3>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                <div className="card border-0 shadow-sm">
                    <div className="card-body">

                        {/* Filters */}
                        <div className="row g-3 mb-3">
                            <div className="col-md-3">
                                <div className="input-group">
                                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                                    <input type="text" className="form-control" placeholder="Job title or company"
                                        value={title} onChange={(e) => { setTitle(e.target.value); setPage(0) }} />
                                </div>
                            </div>
                            <div className="col-md-2">
                                <input type="text" className="form-control" placeholder="Location"
                                    value={location} onChange={(e) => { setLocation(e.target.value); setPage(0) }} />
                            </div>
                            <div className="col-md-2">
                                <input type="text" className="form-control" placeholder="Industry"
                                    value={industry} onChange={(e) => { setIndustry(e.target.value); setPage(0) }} />
                            </div>
                            <div className="col-md-2">
                                <select className="form-select" value={employmentType}
                                    onChange={(e) => { setEmploymentType(e.target.value); setPage(0) }}>
                                    <option value="">All types</option>
                                    <option value="FULL_TIME">Full time</option>
                                    <option value="PART_TIME">Part time</option>
                                    <option value="CONTRACT">Contract</option>
                                    <option value="INTERNSHIP">Internship</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <input type="number" min="0" className="form-control" placeholder="Min salary"
                                    value={minSalary} onChange={(e) => { setMinSalary(e.target.value); setPage(0) }} />
                            </div>
                            <div className="col-md-1">
                                <button className="btn btn-outline-secondary w-100" title="Clear filters"
                                    onClick={() => clearFilters()}>
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            </div>
                        </div>

                        {jobs.length === 0 && (
                            <div className="text-center text-muted py-4">
                                <i className="bi bi-search fs-3 d-block"></i>No jobs to show
                            </div>
                        )}

                        {/* jobs */}
                        {jobs.length > 0 && (
                            <div className="card border-0 shadow-sm">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Job title</th>
                                                <th>Company</th>
                                                <th>Location</th>
                                                <th>Type</th>
                                                <th>Salary</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {jobs.map(j => {
                                                const applied = applications.some(a => a.jobId === j.id)
                                                const saved = savedJobs.some(s => s.jobId === j.id)
                                                return (
                                                    <tr key={j.id}>
                                                        <td className="fw-semibold">{j.title}</td>
                                                        <td>{j.companyName}</td>
                                                        <td>{j.location}</td>
                                                        <td>{(j.employmentType || "").replaceAll("_", " ")}</td>
                                                        <td className="text-nowrap">{formatSalary(j)}</td>
                                                        <td className="text-end text-nowrap">
                                                            <button className="btn btn-sm btn-outline-warning me-2"
                                                                title={saved ? "Remove from saved" : "Save job"}
                                                                onClick={() => toggleSave(j)}>
                                                                <i className={`bi ${saved ? "bi-bookmark-fill" : "bi-bookmark"}`}></i>
                                                            </button>
                                                            {applied
                                                                ? <button className="btn btn-sm btn-outline-success" onClick={() => setSelectedJob(j)}>Applied</button>
                                                                : <button className="btn btn-sm btn-primary" onClick={() => setSelectedJob(j)}>Apply</button>}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

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

export default JobSearch