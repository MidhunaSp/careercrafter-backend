import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV } from "../../../config"
import { getInitials } from "../../utils/profile"
import AppNavbar from "../common/AppNavbar"

function EmployerProfile() {

    const navigate = useNavigate()

    const [employer, setEmployer] = useState(null)
    const [form, setForm] = useState({ fullName: "", companyName: "", phone: "" })
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
                if (resp.data.role !== 'EMPLOYER') {
                    navigate("/no-access")
                    return
                }
            }
            catch {
                navigate("/no-access")
                return
            }

            // step 2: load the employer details and fill the form
            try {
                const empResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/employer/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setEmployer(empResp.data)
                setForm({
                    fullName: empResp.data.fullName,
                    companyName: empResp.data.companyName,
                    phone: empResp.data.phone
                })
            }
            catch {
                toast.error("Could not load your profile")
            }
        }
        loadProfile()
    }, [navigate])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const updateProfile = async (e) => {
        e.preventDefault()
        setErrMsg("")
        setSuccessMsg("")

        try {
            await axios.put(`${API_SERVER_URL_DEV}/api/employer/${employer.id}`, form,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setEmployer({ ...employer, ...form })
            toast.success("Profile updated successfully")
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not update the profile"))
        }
    }

    const isVerified = employer && employer.verificationStatus === 'VERIFIED'

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="EMPLOYER" />

            <div className="container px-4 py-4">

                <h3 className="fw-bold mb-4">My Profile</h3>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                {employer && (
                    <div className="row g-4">

                        {/* Summary */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm text-center">
                                <div className="card-body p-4">
                                    <div className="rounded-circle bg-primary text-white fw-bold fs-1 d-inline-block px-4 py-3 mb-3">
                                        {getInitials(employer.companyName)}
                                    </div>
                                    <h5 className="fw-bold mb-0">{employer.companyName}</h5>
                                    <p className="text-muted">@{employer.username}</p>
                                    <span className={`badge fs-6 ${isVerified ? 'text-bg-success' : 'text-bg-warning'}`}>
                                        <i className={`bi ${isVerified ? 'bi-patch-check-fill' : 'bi-hourglass-split'} me-1`}></i>
                                        {isVerified ? 'Verified employer' : 'Pending verification'}
                                    </span>
                                    <hr />
                                    <p className="mb-1"><i className="bi bi-person me-2 text-primary"></i>{employer.fullName}</p>
                                    <p className="mb-0"><i className="bi bi-telephone me-2 text-primary"></i>{employer.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Edit form */}
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white fw-semibold">Edit profile</div>
                                <div className="card-body">

                                    {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

                                    <form onSubmit={(e) => updateProfile(e)}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold text-secondary">Contact Person</label>
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
                                                <label className="form-label small fw-semibold text-secondary">Company Name</label>
                                                <input type="text" name="companyName" className="form-control" required maxLength="200"
                                                    value={form.companyName} onChange={handleChange} />
                                            </div>
                                            <div className="col-12">
                                                <button type="submit" className="btn btn-primary">
                                                    <i className="bi bi-check2-circle me-1"></i>Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    )
}

export default EmployerProfile