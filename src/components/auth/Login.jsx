import { Link, useNavigate } from "react-router"
import { useState } from "react"
import { API_SERVER_URL_DEV } from "../../../config"
import axios from "axios"

function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [errMsg, setErrMsg] = useState("")

    const apiUrl = API_SERVER_URL_DEV + '/api/auth/login'
    const userDetailsUrl = API_SERVER_URL_DEV + '/api/auth/user-details'

    const navigate = useNavigate()

    const processLogin = async (e) => {
        e.preventDefault()
        setErrMsg("")

        const token = 'Basic ' + window.btoa(username + ':' + password)

        try {
            const response = await axios.get(apiUrl, {
                headers: { 'Authorization': token }
            })
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('username', username)

            const resp = await axios.get(userDetailsUrl, {
                headers: { 'Authorization': 'Bearer ' + response.data.token }
            })

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
            }
            else {
                setErrMsg("Invalid username or password")
            }
        }
    }

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-pink">
            <div className="card border-0 shadow-lg login-card">

                <div className="card-header bg-dark text-white text-center py-3">
                    <h4 className="mb-0"><i className="bi bi-briefcase-fill me-2"></i>CareerCrafter</h4>
                </div>

                <div className="card-body p-4">
                    <h5 className="text-center mb-3">Login to your account</h5>

                    {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}

                    <form onSubmit={processLogin}>
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-person"></i></span>
                            <input type="text" className="form-control" placeholder="Username" required
                                value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>

                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-lock"></i></span>
                            <input type="password" className="form-control" placeholder="Password" required
                                value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>

                        <button type="submit" className="btn btn-dark w-100">Login</button>
                    </form>
                </div>

                <div className="card-footer text-center bg-light">
                    New here? <Link to="/signup">Create an account</Link>
                </div>

            </div>
        </div>
    )
}

export default Login