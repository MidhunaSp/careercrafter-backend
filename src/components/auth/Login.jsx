import { Link, useNavigate } from "react-router"
import { useState } from "react"
import { API_SERVER_URL_DEV } from "../../../config"
import axios from "axios"

function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showForgot, setShowForgot] = useState(false)
    const [loggingIn, setLoggingIn] = useState(false)
    const [errMsg, setErrMsg] = useState("")
    const [errComment, setErrComment] = useState("")

    const apiUrl = API_SERVER_URL_DEV + '/api/auth/login'
    const userDetailsUrl = API_SERVER_URL_DEV + '/api/auth/user-details'

    const navigate = useNavigate()

    const processLogin = async (e) => {
        e.preventDefault()
        setErrMsg("")
        setErrComment("")
        setLoggingIn(true)

        // Step 1. Get the jwt token using Basic auth
        const token = 'Basic ' + window.btoa(username + ':' + password)

        try {
            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': token }
            })
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('username', username)

            // Step 2. Get user details (role) using the jwt token
            const resp = await axios.get(userDetailsUrl, {
                headers: { 'Authorization': 'Bearer ' + response.data.token }
            })

            // Step 3. Open the dashboard based on role
            switch (resp.data.role) {
                case 'JOB_SEEKER':
                    navigate(`/jobseeker`)
                    break
                case 'EMPLOYER':
                    navigate(`/employer`)
                    break
                case 'ADMIN':
                    navigate(`/admin`)
                    break
                default:
                    setErrMsg('Something went wrong')
                    break
            }
        }
        catch (err) {
            if (err?.response?.data?.message) {
                setErrMsg(err.response.data.message)
                setErrComment(err.response.data.comments)
            }
            else {
                setErrMsg("Invalid username or password")
            }
        }
        setLoggingIn(false)
    }

    return (
        <div className="min-vh-100 d-flex align-items-center py-4" style={{ backgroundColor: "#FFD1DC" }}>
            <div className="container">
                <div className="row align-items-center justify-content-center g-5">

                    {/* Illustration (hidden on small screens) */}
                    <div className="col-lg-6 d-none d-lg-block text-center">
                        <img src="/images/hero.png" alt="Job seeker and employer shaking hands"
                            className="img-fluid" style={{ mixBlendMode: "multiply" }} />
                        <h3 className="fw-bold mt-3">Find the job you love, or the people you need</h3>
                        <p className="text-secondary">One place for job seekers and employers.</p>
                    </div>

                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
                        <div className="card border-0 shadow-lg">

                            <div className="card-header bg-dark text-white text-center py-3">
                                <h4 className="mb-0"><i className="bi bi-briefcase-fill me-2"></i>CareerCrafter</h4>
                            </div>

                            <div className="card-body p-4">
                                <h5 className="text-center mb-3">Login to your account</h5>

                                {errMsg && (
                                    <div className="alert alert-danger py-2">
                                        <i className="bi bi-exclamation-circle me-1"></i>{errMsg}
                                        {errComment && <div className="small">{errComment}</div>}
                                    </div>
                                )}

                                <form onSubmit={processLogin}>
                                    <div className="input-group mb-3">
                                        <span className="input-group-text"><i className="bi bi-person"></i></span>
                                        <input type="text" className="form-control" placeholder="Username" required
                                            autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
                                    </div>

                                    <div className="input-group mb-2">
                                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                                        <input type={showPassword ? "text" : "password"} className="form-control"
                                            placeholder="Password" required
                                            value={password} onChange={(e) => setPassword(e.target.value)} />
                                        <button type="button" className="btn btn-outline-secondary"
                                            title={showPassword ? "Hide password" : "Show password"}
                                            onClick={() => setShowPassword(!showPassword)}>
                                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                    </div>

                                    <div className="text-end mb-3">
                                        <button type="button" className="btn btn-link btn-sm p-0"
                                            onClick={() => setShowForgot(!showForgot)}>
                                            Forgot password?
                                        </button>
                                    </div>

                                    {showForgot && (
                                        <div className="alert alert-info py-2 small">
                                            <i className="bi bi-info-circle me-1"></i>
                                            Passwords cannot be reset on this page yet. Please contact the
                                            CareerCrafter admin and ask for a password reset.
                                        </div>
                                    )}

                                    <button type="submit" className="btn btn-dark w-100" disabled={loggingIn}>
                                        {loggingIn
                                            ? <><span className="spinner-border spinner-border-sm me-2"></span>Logging in...</>
                                            : <><i className="bi bi-box-arrow-in-right me-1"></i>Login</>}
                                    </button>
                                </form>
                            </div>

                            <div className="card-footer text-center bg-light">
                                New here? <Link to="/signup">Create an account</Link>
                                <div><Link to="/" className="small">Back to home</Link></div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Login