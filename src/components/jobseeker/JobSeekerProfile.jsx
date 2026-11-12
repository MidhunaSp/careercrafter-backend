import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useDispatch, useSelector } from "react-redux"
import { API_SERVER_URL_DEV } from "../../../config"
import { getInitials, splitSkills } from "../../utils/profile"
import { getResumes } from "../../store/actions/ResumeAction"
import AppNavbar from "../common/AppNavbar"
import ResumeManager from "./ResumeManager"

function JobSeekerProfile() {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const resumes = useSelector(state => state.resumes)

    const [jobSeeker, setJobSeeker] = useState(null)
    const [tab, setTab] = useState("profile")
    const [form, setForm] = useState({
        fullName: "", phone: "", location: "", education: "", experience: "", skills: ""
    })
    const [errMsg, setErrMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")

    useEffect(() => {
        const loadProfile = async () => {
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
                if (resp.data.role !== 'JOB_SEEKER') {
                    navigate("/no-access")
                    return
                }
            }
            catch {
                navigate("/no-access")
                return
            }

            // step 2: load the job seeker and the resumes
            try {
                const jsResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobseeker/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const js = jsResp.data
                setJobSeeker(js)
                setForm({
                    fullName: js.fullName || "",
                    phone: js.phone || "",
                    location: js.location || "",
                    education: js.education || "",
                    experience: js.experience || "",
                    skills: js.skills || ""
                })
                await dispatch(getResumes(js.id))
            }
            catch {
                setErrMsg("Could not load your profile")
            }
        }
        loadProfile()
    }, [navigate, dispatch])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const updateProfile = async (e) => {
        e.preventDefault()
        setErrMsg("")
        setSuccessMsg("")

        try {
            await axios.put(`${API_SERVER_URL_DEV}/api/jobseeker/${jobSeeker.id}`, form,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setJobSeeker({ ...jobSeeker, ...form })
            setSuccessMsg("Profile updated successfully")
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not update the profile"))
        }
    }

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="JOB_SEEKER" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-4">My Profile</h3>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                {jobSeeker && (
                    <div className="row g-4">

                        {/* Left: how the employers see the profile */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm">
                                <div className="card-body p-4 text-center">
                                    <div className="rounded-circle bg-primary text-white fw-bold fs-1 d-inline-block px-4 py-3 mb-3">
                                        {getInitials(jobSeeker.fullName)}
                                    </div>
                                    <h5 className="fw-bold mb-0">{jobSeeker.fullName}</h5>
                                    <p className="text-muted mb-2">@{jobSeeker.username}</p>
                                    <p className="mb-1"><i className="bi bi-geo-alt text-primary me-2"></i>{jobSeeker.location || "Location not added"}</p>
                                    <p className="mb-3"><i className="bi bi-telephone text-primary me-2"></i>{jobSeeker.phone}</p>

                                    <div className="text-start">
                                        <div className="fw-semibold small text-secondary mb-1">Skills</div>
                                        {splitSkills(jobSeeker.skills).length === 0 && <span className="text-muted small">No skills added</span>}
                                        {splitSkills(jobSeeker.skills).map(s => (
                                            <span key={s} className="badge text-bg-primary-subtle border border-primary-subtle text-primary-emphasis me-1 mb-1">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: edit profile and resumes */}
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white">
                                    <ul className="nav nav-tabs card-header-tabs">
                                        <li className="nav-item">
                                            <button className={`nav-link ${tab === 'profile' ? 'active' : ''}`}
                                                onClick={() => setTab("profile")}>
                                                <i className="bi bi-person-gear me-1"></i>Edit profile
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button className={`nav-link ${tab === 'resumes' ? 'active' : ''}`}
                                                onClick={() => setTab("resumes")}>
                                                <i className="bi bi-file-earmark-person me-1"></i>My resumes
                                                <span className="badge text-bg-secondary ms-2">{resumes.length}</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-body p-4">

                                    {tab === "profile" && (
                                        <form onSubmit={(e) => updateProfile(e)}>

                                            {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                                                    <input type="text" name="fullName" className="form-control" required maxLength="255"
                                                        value={form.fullName} onChange={handleChange} />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-semibold text-secondary">Phone</label>
                                                    <input type="text" name="phone" className="form-control" required
                                                        pattern="[0-9]{10}" title="Phone number must be 10 digits"
                                                        value={form.phone} onChange={handleChange} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-semibold text-secondary">Location</label>
                                                    <input type="text" name="location" className="form-control" maxLength="150"
                                                        placeholder="Chennai" value={form.location} onChange={handleChange} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-semibold text-secondary">Education</label>
                                                    <textarea name="education" className="form-control" rows="3"
                                                        placeholder="B.E. Computer Science, Anna University, 2024"
                                                        value={form.education} onChange={handleChange}></textarea>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-semibold text-secondary">Experience</label>
                                                    <textarea name="experience" className="form-control" rows="3"
                                                        placeholder="Intern at XYZ (6 months): built REST APIs with Spring Boot"
                                                        value={form.experience} onChange={handleChange}></textarea>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small fw-semibold text-secondary">Skills</label>
                                                    <input type="text" name="skills" className="form-control" maxLength="1000"
                                                        placeholder="Java, Spring Boot, React"
                                                        value={form.skills} onChange={handleChange} />
                                                    <div className="form-text">Separate skills with commas. Job recommendations use these.</div>
                                                </div>
                                                <div className="col-12">
                                                    <button type="submit" className="btn btn-primary">
                                                        <i className="bi bi-check2-circle me-1"></i>Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}

                                    {tab === "resumes" && <ResumeManager jobSeekerId={jobSeeker.id} />}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    )
}

export default JobSeekerProfile