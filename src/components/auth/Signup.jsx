import { useState } from "react"
import { Link, useNavigate } from "react-router"
import axios from "axios"
import { API_SERVER_URL_DEV } from "../../../config"

// password rules
const passwordRules = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One number", test: (p) => /[0-9]/.test(p) },
    { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) }
]

const strengthLevels = [
    { text: "Very weak", color: "danger", width: "w-25" },
    { text: "Weak", color: "danger", width: "w-25" },
    { text: "Fair", color: "warning", width: "w-50" },
    { text: "Good", color: "info", width: "w-75" },
    { text: "Strong", color: "success", width: "w-100" },
    { text: "Very strong", color: "success", width: "w-100" }
]

function Signup() {
    const [role, setRole] = useState("JOB_SEEKER")
    const [form, setForm] = useState({
        fullName: "",
        companyName: "",
        phone: "",
        location: "",
        education: "",
        experience: "",
        skills: "",
        username: "",
        password: "",
        confirmPassword: ""
    })
    const [touched, setTouched] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const [errMsg, setErrMsg] = useState("")
    const navigate = useNavigate()

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleBlur = (e) => {
        setTouched({ ...touched, [e.target.name]: true })
    }

    const errors = {
        fullName: form.fullName.trim() === "" ? "Full name is required" : "",
        companyName: role === "EMPLOYER" && form.companyName.trim() === "" ? "Company name is required" : "",
        phone: /^[0-9]{10}$/.test(form.phone) ? "" : "Phone number must be 10 digits",
        username: form.username.length >= 3 ? "" : "Username must have at least 3 characters",
        password: passwordRules.every(r => r.test(form.password)) ? "" : "Password does not meet all the rules",
        confirmPassword: form.confirmPassword === form.password && form.confirmPassword !== ""
            ? "" : "Passwords do not match"
    }
    const hasErrors = Object.values(errors).some(e => e !== "")

    const score = passwordRules.filter(r => r.test(form.password)).length
    const strength = strengthLevels[score]

    const fieldClass = (name) => {
        if (!touched[name]) {
            return "form-control"
        }
        return errors[name] ? "form-control is-invalid" : "form-control is-valid"
    }

    const processSignup = async (e) => {
        e.preventDefault()
        setErrMsg("")

        if (hasErrors) {
            // show every error at once
            setTouched({ fullName: true, companyName: true, phone: true, username: true, password: true, confirmPassword: true })
            return
        }

        setSubmitting(true)
        try {
            if (role === "JOB_SEEKER") {
                const jobSeekerDto = {
                    fullName: form.fullName,
                    phone: form.phone,
                    location: form.location,
                    education: form.education,
                    experience: form.experience,
                    skills: form.skills,
                    username: form.username,
                    password: form.password
                }
                await axios.post(API_SERVER_URL_DEV + "/api/jobseeker/add", jobSeekerDto)
            }
            else {
                const employerDto = {
                    fullName: form.fullName,
                    companyName: form.companyName,
                    phone: form.phone,
                    username: form.username,
                    password: form.password
                }
                await axios.post(API_SERVER_URL_DEV + "/api/employer/add", employerDto)
            }
            // Signup done, go to login page
            navigate("/login")
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Something went wrong"))
        }
        setSubmitting(false)
    }

    return (
        <div className="min-vh-100 d-flex align-items-center py-4" style={{ backgroundColor: "#FFD1DC" }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">

                        <div className="card border-0 shadow-lg">

                            <div className="card-header bg-dark text-white text-center py-3">
                                <h4 className="mb-0"><i className="bi bi-briefcase-fill me-2"></i>CareerCrafter</h4>
                            </div>

                            <div className="card-body p-4">
                                <h5 className="text-center mb-3">Create your account</h5>

                                {errMsg && (
                                    <div className="alert alert-danger py-2">
                                        <i className="bi bi-exclamation-circle me-1"></i>{errMsg}
                                    </div>
                                )}

                                <form onSubmit={processSignup} noValidate>

                                    {/* Role */}
                                    <div className="btn-group w-100 mb-3">
                                        <button type="button"
                                            className={`btn ${role === 'JOB_SEEKER' ? 'btn-dark' : 'btn-outline-dark'}`}
                                            onClick={() => setRole("JOB_SEEKER")}>
                                            <i className="bi bi-person-workspace me-1"></i>Job Seeker
                                        </button>
                                        <button type="button"
                                            className={`btn ${role === 'EMPLOYER' ? 'btn-dark' : 'btn-outline-dark'}`}
                                            onClick={() => setRole("EMPLOYER")}>
                                            <i className="bi bi-building me-1"></i>Employer
                                        </button>
                                    </div>

                                    {role === "EMPLOYER" && (
                                        <div className="alert alert-warning py-2 small">
                                            <i className="bi bi-patch-check me-1"></i>
                                            Employer accounts are verified by the admin before jobs can be posted.
                                        </div>
                                    )}

                                    {/* Full Name */}
                                    <div className="mb-3">
                                        <div className="input-group has-validation">
                                            <span className="input-group-text"><i className="bi bi-person"></i></span>
                                            <input type="text" name="fullName" className={fieldClass("fullName")}
                                                placeholder="Full name" maxLength={255}
                                                value={form.fullName} onChange={handleChange} onBlur={handleBlur} />
                                            <div className="invalid-feedback">{errors.fullName}</div>
                                        </div>
                                    </div>

                                    {/* Company Name (employer only) */}
                                    {role === "EMPLOYER" && (
                                        <div className="mb-3">
                                            <div className="input-group has-validation">
                                                <span className="input-group-text"><i className="bi bi-building"></i></span>
                                                <input type="text" name="companyName" className={fieldClass("companyName")}
                                                    placeholder="Company name" maxLength={200}
                                                    value={form.companyName} onChange={handleChange} onBlur={handleBlur} />
                                                <div className="invalid-feedback">{errors.companyName}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone */}
                                    <div className="mb-3">
                                        <div className="input-group has-validation">
                                            <span className="input-group-text"><i className="bi bi-telephone"></i></span>
                                            <input type="text" name="phone" className={fieldClass("phone")}
                                                placeholder="Phone (10 digits)" maxLength={10}
                                                value={form.phone} onChange={handleChange} onBlur={handleBlur} />
                                            <div className="invalid-feedback">{errors.phone}</div>
                                        </div>
                                    </div>

                                    {/* Job seeker only fields */}
                                    {role === "JOB_SEEKER" && (
                                        <>
                                            <div className="input-group mb-3">
                                                <span className="input-group-text"><i className="bi bi-geo-alt"></i></span>
                                                <input type="text" name="location" className="form-control" placeholder="Location (city)"
                                                    maxLength={150} value={form.location} onChange={handleChange} />
                                            </div>

                                            <div className="input-group mb-3">
                                                <span className="input-group-text"><i className="bi bi-mortarboard"></i></span>
                                                <input type="text" name="education" className="form-control" placeholder="Education"
                                                    value={form.education} onChange={handleChange} />
                                            </div>

                                            <div className="input-group mb-3">
                                                <span className="input-group-text"><i className="bi bi-briefcase"></i></span>
                                                <input type="text" name="experience" className="form-control" placeholder="Experience"
                                                    value={form.experience} onChange={handleChange} />
                                            </div>

                                            <div className="input-group mb-3">
                                                <span className="input-group-text"><i className="bi bi-tools"></i></span>
                                                <input type="text" name="skills" className="form-control"
                                                    placeholder="Skills (Java, Spring Boot, React)" maxLength={1000}
                                                    value={form.skills} onChange={handleChange} />
                                            </div>
                                        </>
                                    )}

                                    {/* Username */}
                                    <div className="mb-3">
                                        <div className="input-group has-validation">
                                            <span className="input-group-text"><i className="bi bi-person-badge"></i></span>
                                            <input type="text" name="username" className={fieldClass("username")}
                                                placeholder="Username" maxLength={150}
                                                value={form.username} onChange={handleChange} onBlur={handleBlur} />
                                            <div className="invalid-feedback">{errors.username}</div>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="mb-2">
                                        <div className="input-group has-validation">
                                            <span className="input-group-text"><i className="bi bi-lock"></i></span>
                                            <input type="password" name="password" className={fieldClass("password")}
                                                placeholder="Password"
                                                value={form.password} onChange={handleChange} onBlur={handleBlur} />
                                            <div className="invalid-feedback">{errors.password}</div>
                                        </div>
                                    </div>

                                    {/* Password strength and rules */}
                                    {form.password !== "" && (
                                        <div className="mb-3">
                                            <div className="progress" role="progressbar" aria-label="Password strength">
                                                <div className={`progress-bar bg-${strength.color} ${strength.width}`}></div>
                                            </div>
                                            <small className={`text-${strength.color}`}>Password strength: {strength.text}</small>
                                        </div>
                                    )}
                                    <ul className="list-unstyled small mb-3">
                                        {
                                            passwordRules.map(r => (
                                                <li key={r.label} className={r.test(form.password) ? 'text-success' : 'text-muted'}>
                                                    <i className={`bi ${r.test(form.password) ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                                                    {r.label}
                                                </li>
                                            ))
                                        }
                                    </ul>

                                    {/* Confirm password */}
                                    <div className="mb-3">
                                        <div className="input-group has-validation">
                                            <span className="input-group-text"><i className="bi bi-shield-lock"></i></span>
                                            <input type="password" name="confirmPassword" className={fieldClass("confirmPassword")}
                                                placeholder="Confirm password"
                                                value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} />
                                            <div className="invalid-feedback">{errors.confirmPassword}</div>
                                        </div>
                                    </div>

                                    <button type="submit" className="btn btn-dark w-100" disabled={submitting}>
                                        {submitting
                                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating account...</>
                                            : <><i className="bi bi-person-plus me-1"></i>Sign up</>}
                                    </button>
                                </form>
                            </div>

                            <div className="card-footer text-center bg-light">
                                Already have an account? <Link to="/login">Login</Link>
                                <div><Link to="/" className="small">Back to home</Link></div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default Signup
