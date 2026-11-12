import axios from "axios"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { API_SERVER_URL_DEV } from "../../../config"
import AppNavbar from "../common/AppNavbar"
import JobDetailsModal from "./JobDetailsModal"
import { splitSkills } from "../../utils/profile"


const normalize = (data, js) => {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : [])
    const items = list.map(item => item.job
        ? { job: item.job, score: Number(item.score) || 0, matchedSkills: item.matchedSkills || [], locationMatch: !!item.locationMatch }
        : { job: item, score: 0, matchedSkills: [], locationMatch: false })

    const total = splitSkills(js.skills).length
    return items.map(i => ({
        ...i,
        score: total > 0 ? Math.min(100, Math.round(i.matchedSkills.length * 100 / total)) : 0
    }))
}

// used when the backend gives no recommendations
const scoreJobs = (jobs, js, industry, type) => {
    const skills = splitSkills(js.skills)
    const place = (js.location || "").trim().toLowerCase()
    return jobs
        .filter(j => j.active !== false)
        .map(job => {
            const text = [job.title, job.description, job.qualifications, job.industry, job.skills, job.requiredSkills]
                .filter(Boolean).join(" ").toLowerCase()
            const matchedSkills = skills.filter(sk => text.includes(sk.toLowerCase()))
            const jobPlace = (job.location || "").toLowerCase()
            const jobCity = jobPlace.split(",")[0].trim()
            const locationMatch = place !== "" && jobCity !== "" && (jobPlace.includes(place) || place.includes(jobCity))
            const skillPart = skills.length === 0 ? 0 : (matchedSkills.length * 60) / skills.length
            const industryMatch = industry.trim() !== "" && (job.industry || "").toLowerCase().includes(industry.trim().toLowerCase())
            const typeMatch = type !== "" && job.employmentType === type
            const total = skillPart + (locationMatch ? 30 : 0) + (industryMatch ? 5 : 0) + (typeMatch ? 5 : 0)
            return { job, matchedSkills, locationMatch, score: Math.min(100, Math.round(total)) }
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
}

const loadRecommended = async (js, industry, type) => {
    let result
    let backendGaveJobs = false
    try {
        const response = await axios.get(
            `${API_SERVER_URL_DEV}/api/job/recommended/${js.id}`,
            {
                params: { limit: 10, industry: industry.trim() || undefined, type: type || undefined },
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            })
        result = normalize(response.data, js)
        backendGaveJobs = result.length > 0
        result = result.filter(r =>
            (type === "" || r.job.employmentType === type) &&
            (industry.trim() === "" || (r.job.industry || "").toLowerCase().includes(industry.trim().toLowerCase()))
        )
    }
    catch {
        result = []
    }
    // only use the browser scoring when the backend itself returned nothing
    if (!backendGaveJobs) {
        const jobsResp = await axios.get(`${API_SERVER_URL_DEV}/api/job/filter/v1?page=0&size=200`)
        result = scoreJobs(jobsResp.data.content || [], js, industry, type)
    }
    return result
}

function RecommendedJobs() {

    const navigate = useNavigate()

    const [jobSeeker, setJobSeeker] = useState(null)
    const [applications, setApplications] = useState([])
    const [savedJobs, setSavedJobs] = useState([])
    const [recommended, setRecommended] = useState([])
    const [selectedJob, setSelectedJob] = useState(null)
    const [loaded, setLoaded] = useState(false)
    const [errMsg, setErrMsg] = useState("")

    const [industry, setIndustry] = useState(localStorage.getItem('prefIndustry') || "")
    const [type, setType] = useState(localStorage.getItem('prefType') || "")

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

            try {
                const jsResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobseeker/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const js = jsResp.data
                setJobSeeker(js)

                setRecommended(await loadRecommended(js,
                    localStorage.getItem('prefIndustry') || "", localStorage.getItem('prefType') || ""))

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

                setLoaded(true)
            }
            catch (err) {
                const data = err?.response?.data
                setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not load the recommended jobs"))
            }
        }
        loadPage()
    }, [navigate])

    const applyPreferences = async () => {
        setErrMsg("")
        localStorage.setItem('prefIndustry', industry)
        localStorage.setItem('prefType', type)
        try {
            setRecommended(await loadRecommended(jobSeeker, industry, type))
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : "Could not load the recommended jobs")
        }
    }

    const clearPreferences = async () => {
        setIndustry("")
        setType("")
        localStorage.removeItem('prefIndustry')
        localStorage.removeItem('prefType')
        setErrMsg("")
        try {
            setRecommended(await loadRecommended(jobSeeker, "", ""))
        }
        catch {
            setErrMsg("Could not load the recommended jobs")
        }
    }

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

    const onApplied = async () => {
        const appResp = await axios.get(
            `${API_SERVER_URL_DEV}/api/jobApplication/applicant/${jobSeeker.id}?page=0&size=1000`,
            {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            })
        setApplications(appResp.data.content)
    }

    const formatSalary = (job) => {
        const f = (n) => (n === null || n === undefined || n === "") ? null : Number(n).toLocaleString("en-IN")
        const min = f(job.minSalary)
        const max = f(job.maxSalary)
        return min && max ? `₹${min} - ₹${max}` : (min ? `From ₹${min}` : (max ? `Up to ₹${max}` : "Not disclosed"))
    }

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="JOB_SEEKER" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-1">Recommended Jobs</h3>
                <p className="text-muted mb-4">Jobs matched with the skills and location in your profile. Industry and job type add extra points.</p>

                <div className="row g-2 mb-4">
                    <div className="col-md-5">
                        <input className="form-control" maxLength="100" placeholder="Preferred industry (e.g. IT)"
                            value={industry} onChange={e => setIndustry(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                        <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                            <option value="">Any job type</option>
                            <option value="FULL_TIME">Full Time</option>
                            <option value="PART_TIME">Part Time</option>
                            <option value="CONTRACT">Contract</option>
                            <option value="INTERNSHIP">Internship</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-primary w-100" onClick={applyPreferences} disabled={!jobSeeker}>Apply</button>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-outline-secondary w-100" onClick={clearPreferences} disabled={!jobSeeker}>Clear</button>
                    </div>
                </div>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                {loaded && recommended.length === 0 && (
                    <div className="alert alert-info">
                        No recommendations yet. Add your skills and location in your{" "}
                        <Link to={`/jobseeker/profile`}>profile</Link> to get matching jobs.
                    </div>
                )}

                {recommended.length > 0 && (
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
                                        <th>Match</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recommended.map(r => {
                                        const j = r.job
                                        const applied = applications.some(a => a.jobId === j.id)
                                        const saved = savedJobs.some(s => s.jobId === j.id)
                                        return (
                                            <tr key={j.id}>
                                                <td className="fw-semibold">{j.title}</td>
                                                <td>{j.companyName}</td>
                                                <td>{j.location}</td>
                                                <td>{(j.employmentType || "").replaceAll("_", " ")}</td>
                                                <td className="text-nowrap">{formatSalary(j)}</td>
                                                <td><span className="badge text-bg-primary">{r.score}%</span></td>
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

            </div>

            {selectedJob && jobSeeker && (
                <JobDetailsModal job={selectedJob} jobSeekerId={jobSeeker.id}
                    alreadyApplied={applications.some(a => a.jobId === selectedJob.id)}
                    onApplied={onApplied} onClose={() => setSelectedJob(null)} />
            )}
        </div>
    )
}

export default RecommendedJobs