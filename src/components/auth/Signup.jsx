import { useState } from "react"
import { Link, useNavigate } from "react-router"
import axios from "axios"
import { API_SERVER_URL_DEV } from "../../../config"

function Signup() {
    const [role, setRole] = useState("JOB_SEEKER")
    const [fullName, setFullName] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [phone, setPhone] = useState("")
    const [location, setLocation] = useState("")
    const [education, setEducation] = useState("")
    const [experience, setExperience] = useState("")
    const [skills, setSkills] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const [errMsg, setErrMsg] = useState("")
    const navigate = useNavigate()

    const jobSeekerUrl = API_SERVER_URL_DEV + "/api/jobseeker/add"
    const employerUrl = API_SERVER_URL_DEV + "/api/employer/add"

    const processSignup = async (e) => {
        e.preventDefault()
        setErrMsg("")

        try {
            if (role === "JOB_SEEKER") {
                let jobSeekerDto = {
                    'fullName': fullName,
                    'phone': phone,
                    'location': location,
                    'education': education,
                    'experience': experience,
                    'skills': skills,
                    'username': username,
                    'password': password
                }
                await axios.post(jobSeekerUrl, jobSeekerDto)
            }
            else {
                let employerDto = {
                    'fullName': fullName,
                    'companyName': companyName,
                    'phone': phone,
                    'username': username,
                    'password': password
                }
                await axios.post(employerUrl, employerDto)
            }
            navigate("/login")
        }
        catch (err) {
            setErrMsg(err?.response?.data?.message)
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center py-4 bg-pink">
            <div className="card border-0 shadow-lg signup-card">

                <div className="card-header bg-dark text-white text-center py-3">
                    <h4 className="mb-0"><i className="bi bi-briefcase-fill me-2"></i>CareerCrafter</h4>
                </div>

                <div className="card-body p-4">
                    <h5 className="text-center mb-3">Create your account</h5>

                    {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}

                    <form onSubmit={(e) => processSignup(e)}>

                        {/* Role */}
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-people"></i></span>
                            <select className="form-select" onChange={(e) => setRole(e.target.value)}>
                                <option value="JOB_SEEKER">I am a Job Seeker</option>
                                <option value="EMPLOYER">I am an Employer</option>
                            </select>
                        </div>

                        {/* Full name */}
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-person"></i></span>
                            <input type="text" className="form-control" placeholder="Full name"
                                onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        {/* Company name (employer only) */}
                        {role === "EMPLOYER" && (
                            <div className="input-group mb-3">
                                <span className="input-group-text"><i className="bi bi-building"></i></span>
                                <input type="text" className="form-control" placeholder="Company name"
                                    onChange={(e) => setCompanyName(e.target.value)} />
                            </div>
                        )}

                        {/* Phone */}
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                            <input type="text" className="form-control" placeholder="Phone (10 digits)"
                                onChange={(e) => setPhone(e.target.value)} />
                        </div>

                        {/* Job seeker only fields */}
                        {role === "JOB_SEEKER" && (
                            <>
                                <div className="input-group mb-3">
                                    <span className="input-group-text"><i className="bi bi-geo-alt"></i></span>
                                    <input type="text" className="form-control" placeholder="Location"
                                        onChange={(e) => setLocation(e.target.value)} />
                                </div>

                                <div className="input-group mb-3">
                                    <span className="input-group-text"><i className="bi bi-mortarboard"></i></span>
                                    <input type="text" className="form-control" placeholder="Education"
                                        onChange={(e) => setEducation(e.target.value)} />
                                </div>

                                <div className="input-group mb-3">
                                    <span className="input-group-text"><i className="bi bi-briefcase"></i></span>
                                    <input type="text" className="form-control" placeholder="Experience"
                                        onChange={(e) => setExperience(e.target.value)} />
                                </div>

                                <div className="input-group mb-3">
                                    <span className="input-group-text"><i className="bi bi-tools"></i></span>
                                    <input type="text" className="form-control" placeholder="Skills (Java, Spring Boot, React)"
                                        onChange={(e) => setSkills(e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* Username */}
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-person-badge"></i></span>
                            <input type="text" className="form-control" placeholder="Username"
                                onChange={(e) => setUsername(e.target.value)} />
                        </div>

                        {/* Password */}
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-lock"></i></span>
                            <input type="password" className="form-control" placeholder="••••••••"
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>

                        <button type="submit" className="btn btn-dark w-100">Sign up</button>
                    </form>
                </div>

                <div className="card-footer text-center bg-light">
                    Already have an account? <Link to="/login">Login</Link>
                </div>

            </div>
        </div>
    )
}

export default Signup