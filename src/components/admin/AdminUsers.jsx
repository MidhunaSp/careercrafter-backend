import axios from "axios"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { API_SERVER_URL_DEV, PAGE_SIZE } from "../../../config"
import { splitSkills } from "../../utils/profile"
import { getErrorMessage, useToast } from "../../utils/toast"
import AppNavbar from "../common/AppNavbar"
import Pagination from "../common/Pagination"
import ReasonModal from "../common/ReasonModal"

const size = PAGE_SIZE

const suspendPresets = [
    "Repeated failed login attempts on other accounts",
    "Suspicious activity: tried to access another user's data",
    "Fake or misleading company / profile details",
    "Spam or abusive messages to other users",
    "Violation of the platform terms of use"
]

function AdminUsers() {

    const navigate = useNavigate()
    const location = useLocation()
    const toast = useToast()

    const authHeader = () => ({ headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })

    const [tab, setTab] = useState(location.state?.tab ? location.state.tab : "employers")
    const [admin, setAdmin] = useState(null)

    const [employers, setEmployers] = useState([])
    const [jobSeekers, setJobSeekers] = useState([])
    const [employerPaginationInfo, setEmployerPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
    const [seekerPaginationInfo, setSeekerPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })

    const [statusFilter, setStatusFilter] = useState("")
    const [companySearch, setCompanySearch] = useState("")
    const [seekerSearch, setSeekerSearch] = useState("")
    const [employerPage, setEmployerPage] = useState(0)
    const [seekerPage, setSeekerPage] = useState(0)
    const [refresh, setRefresh] = useState(0)

    const [notifyTarget, setNotifyTarget] = useState(null)
    const [notifyMsg, setNotifyMsg] = useState("")

    // the open reason dialog: { kind: 'suspend' | 'activate', username }
    const [dialog, setDialog] = useState(null)

    useEffect(() => {
        const loadAdmin = async () => {
            // step 1: check that the user is logged in and has the right role
            if (!localStorage.getItem('token')) {
                navigate("/login")
                return
            }
            try {
                const resp = await axios.get(API_SERVER_URL_DEV + '/api/auth/user-details', authHeader())
                if (resp.data.role !== 'ADMIN') {
                    navigate("/no-access")
                    return
                }
            }
            catch {
                navigate("/no-access")
                return
            }

            // step 2: the admin id is needed to verify employers
            try {
                const adminResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/admin/by-username?username=${localStorage.getItem('username')}`, authHeader())
                setAdmin(adminResp.data)
            }
            catch (err) {
                toast.error(getErrorMessage(err, "Could not load the admin details"))
            }
        }
        loadAdmin()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate])

    // employers: runs when the filters, the page or refresh changes
    useEffect(() => {
        const getEmployers = async () => {
            const query = new URLSearchParams({ page: employerPage, size: size })
            if (statusFilter !== "") {
                query.append("status", statusFilter)
            }
            if (companySearch !== "") {
                query.append("companyName", companySearch)
            }
            try {
                const response = await axios.get(`${API_SERVER_URL_DEV}/api/employer/filter?${query.toString()}`, authHeader())
                setEmployers(response.data.content)
                setEmployerPaginationInfo(response.data.paginationInfo)
            }
            catch (err) {
                toast.error(getErrorMessage(err, "Could not load the employers"))
            }
        }
        getEmployers()
    }, [statusFilter, companySearch, employerPage, refresh])

    // job seekers
    useEffect(() => {
        const getJobSeekers = async () => {
            const query = new URLSearchParams({ page: seekerPage, size: size })
            if (seekerSearch !== "") {
                query.append("fullName", seekerSearch)
            }
            try {
                const response = await axios.get(`${API_SERVER_URL_DEV}/api/jobseeker/filter?${query.toString()}`, authHeader())
                setJobSeekers(response.data.content)
                setSeekerPaginationInfo(response.data.paginationInfo)
            }
            catch (err) {
                toast.error(getErrorMessage(err, "Could not load the job seekers"))
            }
        }
        getJobSeekers()
    
    }, [seekerSearch, seekerPage, refresh])

    const verifyEmployer = async (employer) => {
        try {
            await axios.put(`${API_SERVER_URL_DEV}/api/employer/verify/${admin.id}/${employer.id}`, {}, authHeader())
            toast.success(`${employer.companyName} verified`)
            setRefresh(refresh + 1)
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Could not verify the employer"))
        }
    }

    const sendNotification = async (e) => {
        e.preventDefault()
        try {
            await axios.post(`${API_SERVER_URL_DEV}/api/notification/add/${notifyTarget.userId}`,
                { 'message': notifyMsg, 'type': 'SYSTEM' }, authHeader())
            toast.success("Notification sent to " + notifyTarget.fullName)
            setNotifyTarget(null)
            setNotifyMsg("")
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Could not send the notification"))
        }
    }

    // called by the reason dialog: suspending needs a reason, activating a note is optional
    const confirmDialog = async (text) => {
        try {
            const active = dialog.kind === 'activate'
            await axios.put(`${API_SERVER_URL_DEV}/api/admin/user-status`,
                { username: dialog.username, active: active, reason: text }, authHeader())
            toast.success(active ? `${dialog.username} reactivated` : `${dialog.username} suspended`)
            setDialog(null)
            setRefresh(refresh + 1)
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Could not complete the action"))
        }
    }

    const accountBadge = (active) => (
        <span className={`badge ${active ? 'text-bg-success' : 'text-bg-danger'}`}>{active ? 'Active' : 'Suspended'}</span>
    )

    const statusButton = (username, active) => (
        <button className={`btn btn-sm ${active ? 'btn-outline-danger' : 'btn-outline-success'}`}
            onClick={() => setDialog({ kind: active ? 'suspend' : 'activate', username })}>
            <i className={`bi ${active ? 'bi-person-slash' : 'bi-person-check'} me-1`}></i>
            {active ? 'Suspend' : 'Activate'}
        </button>
    )

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="ADMIN" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-3">Users</h3>

                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button className={`nav-link ${tab === 'employers' ? 'active' : ''}`} onClick={() => setTab('employers')}>
                            <i className="bi bi-building me-1"></i>Employers
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${tab === 'seekers' ? 'active' : ''}`} onClick={() => setTab('seekers')}>
                            <i className="bi bi-person-lines-fill me-1"></i>Job Seekers
                        </button>
                    </li>
                </ul>

                {/* ---------------- EMPLOYERS ---------------- */}
                {tab === 'employers' && (
                    <>
                        {notifyTarget && (
                            <div className="card border-0 shadow-sm mb-3">
                                <div className="card-header bg-white fw-semibold">
                                    Send notification to {notifyTarget.fullName} ({notifyTarget.companyName})
                                </div>
                                <div className="card-body">
                                    <form onSubmit={sendNotification}>
                                        <textarea className="form-control mb-3" rows="3" maxLength="1000" required
                                            placeholder="Type the message..."
                                            value={notifyMsg} onChange={(e) => setNotifyMsg(e.target.value)}></textarea>
                                        <button type="submit" className="btn btn-primary me-2">
                                            <i className="bi bi-send me-1"></i>Send
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary"
                                            onClick={() => setNotifyTarget(null)}>Cancel</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="row g-3 mb-3">
                                    <div className="col-md-4">
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="bi bi-search"></i></span>
                                            <input type="text" className="form-control" placeholder="Search company..."
                                                value={companySearch}
                                                onChange={(e) => { setCompanySearch(e.target.value); setEmployerPage(0) }} />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <select className="form-select" value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setEmployerPage(0) }}>
                                            <option value="">All verification status</option>
                                            <option value="PENDING">Pending</option>
                                            <option value="VERIFIED">Verified</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th scope="col">#</th>
                                                <th scope="col">Company</th>
                                                <th scope="col">Contact Person</th>
                                                <th scope="col">Phone</th>
                                                <th scope="col">Username</th>
                                                <th scope="col">Verification</th>
                                                <th scope="col">Account</th>
                                                <th scope="col" className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employers.length === 0 && (
                                                <tr>
                                                    <td colSpan="8" className="text-center text-muted py-4">
                                                        <i className="bi bi-building-x fs-3 d-block"></i>No employers to show
                                                    </td>
                                                </tr>
                                            )}
                                            {employers.map((e, index) => (
                                                <tr key={e.id}>
                                                    <th scope="row">{employerPage * size + index + 1}</th>
                                                    <td className="fw-semibold">{e.companyName}</td>
                                                    <td>{e.fullName}</td>
                                                    <td>{e.phone}</td>
                                                    <td>{e.username}</td>
                                                    <td>
                                                        <span className={`badge ${e.verificationStatus === 'VERIFIED' ? 'text-bg-success' : 'text-bg-warning'}`}>
                                                            {e.verificationStatus}
                                                        </span>
                                                    </td>
                                                    <td>{accountBadge(e.active)}</td>
                                                    <td className="text-end text-nowrap">
                                                        {e.verificationStatus === 'PENDING' && (
                                                            <button className="btn btn-sm btn-success me-1"
                                                                disabled={!admin} onClick={() => verifyEmployer(e)}>
                                                                <i className="bi bi-patch-check me-1"></i>Verify
                                                            </button>
                                                        )}
                                                        <button className="btn btn-sm btn-outline-primary me-1" title="Send notification"
                                                            onClick={() => setNotifyTarget(e)}>
                                                            <i className="bi bi-bell"></i>
                                                        </button>
                                                        {statusButton(e.username, e.active)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination page={employerPage} setPage={setEmployerPage} paginationInfo={employerPaginationInfo} />
                            </div>
                        </div>
                    </>
                )}

                {/* ---------------- JOB SEEKERS ---------------- */}
                {tab === 'seekers' && (
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="row g-3 mb-3">
                                <div className="col-md-4">
                                    <div className="input-group">
                                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                                        <input type="text" className="form-control" placeholder="Search name or username..."
                                            value={seekerSearch}
                                            onChange={(e) => { setSeekerSearch(e.target.value); setSeekerPage(0) }} />
                                    </div>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">Name</th>
                                            <th scope="col">Phone</th>
                                            <th scope="col">Location</th>
                                            <th scope="col">Skills</th>
                                            <th scope="col">Username</th>
                                            <th scope="col">Account</th>
                                            <th scope="col" className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobSeekers.length === 0 && (
                                            <tr>
                                                <td colSpan="8" className="text-center text-muted py-4">
                                                    <i className="bi bi-person-x fs-3 d-block"></i>No job seekers to show
                                                </td>
                                            </tr>
                                        )}
                                        {jobSeekers.map((s, index) => (
                                            <tr key={s.id}>
                                                <th scope="row">{seekerPage * size + index + 1}</th>
                                                <td className="fw-semibold">{s.fullName}</td>
                                                <td>{s.phone}</td>
                                                <td>{s.location}</td>
                                                <td>
                                                    {splitSkills(s.skills).slice(0, 4).map(skill => (
                                                        <span key={skill} className="badge text-bg-light border me-1">{skill}</span>
                                                    ))}
                                                </td>
                                                <td>{s.username}</td>
                                                <td>{accountBadge(s.active)}</td>
                                                <td className="text-end text-nowrap">{statusButton(s.username, s.active)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination page={seekerPage} setPage={setSeekerPage} paginationInfo={seekerPaginationInfo} />
                        </div>
                    </div>
                )}

            </div>

            {/* reason dialogs */}
            {dialog && dialog.kind === 'suspend' && (
                <ReasonModal title={`Suspend ${dialog.username}`}
                    description="The user will be logged out at once and will see this reason when they try to log in."
                    confirmText="Suspend account" confirmClass="btn-danger" minLength={10}
                    presets={suspendPresets} placeholder="Why is this account being suspended?"
                    onConfirm={confirmDialog} onClose={() => setDialog(null)} />
            )}
            {dialog && dialog.kind === 'activate' && (
                <ReasonModal title={`Reactivate ${dialog.username}`}
                    description="The user will be able to log in again. You can add a note for the records."
                    confirmText="Reactivate account" confirmClass="btn-success" minLength={0}
                    placeholder="Note (optional)"
                    onConfirm={confirmDialog} onClose={() => setDialog(null)} />
            )}
        </div>
    )
}

export default AdminUsers
