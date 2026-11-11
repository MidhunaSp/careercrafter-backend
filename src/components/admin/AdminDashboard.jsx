import axios from "axios"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { API_SERVER_URL_DEV } from "../../../config"
import { statusChartColors, statusLabel } from "../../utils/statusColors"
import { getErrorMessage, useToast } from "../../utils/toast"
import Widget from "../common/Widget"
import DoughnutChart from "../common/DoughnutChart"
import BarChart from "../common/HorizontalBarChart"

function AdminDashboard() {

    const navigate = useNavigate()
    const toast = useToast()

    const [admin, setAdmin] = useState(null)
    const [employers, setEmployers] = useState([])
    const [jobSeekers, setJobSeekers] = useState([])
    const [statusStats, setStatusStats] = useState([])
    const [industryStats, setIndustryStats] = useState([])
    const [employerJobStats, setEmployerJobStats] = useState([])

    useEffect(() => {
        const authHeader = {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')

            }
        }

        const loadDashboard = async () => {
            // step 1: check that the user is logged in and has the right role
            if (!localStorage.getItem('token')) {
                navigate("/login")
                return
            }
            try {
                const resp = await axios.get(API_SERVER_URL_DEV + '/api/auth/user-details', authHeader)
                if (resp.data.role !== 'ADMIN') {
                    navigate("/no-access")
                    return
                }
            }
            catch {
                navigate("/no-access")
                return
            }

            // step 2: load the numbers for the widgets and the charts
            try {
                const [adminResp, employerResp, seekerResp, statusResp, industryResp, jobsResp] = await Promise.all([
                    axios.get(`${API_SERVER_URL_DEV}/api/admin/by-username?username=${localStorage.getItem('username')}`, authHeader),
                    axios.get(API_SERVER_URL_DEV + '/api/employer/all', authHeader),
                    axios.get(API_SERVER_URL_DEV + '/api/jobseeker/all', authHeader),
                    axios.get(API_SERVER_URL_DEV + '/api/stats/applications-by-status', authHeader),
                    axios.get(API_SERVER_URL_DEV + '/api/stats/jobs-per-industry', authHeader),
                    axios.get(API_SERVER_URL_DEV + '/api/stats/jobs-per-employer', authHeader)
                ])
                setAdmin(adminResp.data)
                setEmployers(employerResp.data)
                setJobSeekers(seekerResp.data)
                setStatusStats(statusResp.data)
                setIndustryStats(industryResp.data)
                setEmployerJobStats(jobsResp.data)
            }
            catch (err) {
                toast.error(getErrorMessage(err, "Could not load the dashboard data"))
            }
        }
        loadDashboard()

    }, [navigate])

    // widget values
    const pendingEmployers = employers.filter(e => e.verificationStatus === 'PENDING').length
    const suspendedCount = employers.filter(e => !e.active).length + jobSeekers.filter(s => !s.active).length
    const totalAccounts = employers.length + jobSeekers.length
    const totalJobs = employerJobStats.reduce((sum, s) => sum + s.jobs, 0)
    const totalApplications = statusStats.reduce((sum, s) => sum + s.count, 0)

    // a widget that opens a tab of the Users page
    const linkTo = (tab, widget) => (
        <Link to="/admin/users" state={{ tab: tab }} className="text-decoration-none text-reset d-block h-100">
            {widget}
        </Link>
    )

    return (

            <div className="container-fluid px-4 py-4">

                <div className="mb-4">
                    <h3 className="fw-bold mb-0">Welcome, {admin ? admin.fullName : localStorage.getItem('username')}</h3>
                    <p className="text-muted mb-0">Platform overview</p>
                </div>

                {/* Widgets */}
                <div className="row g-3 mb-4">
                    <div className="col-6 col-md-4 col-xl">
                        {linkTo("employers", <Widget title="Employers" value={employers.length} icon="bi-building" color="primary" />)}
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        {linkTo("employers", <Widget title="Pending Verification" value={pendingEmployers} icon="bi-hourglass-split" color="warning" />)}
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        {linkTo("seekers", <Widget title="Job Seekers" value={jobSeekers.length} icon="bi-people" color="info" />)}
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Jobs" value={totalJobs} icon="bi-briefcase" color="success" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        <Widget title="Applications" value={totalApplications} icon="bi-file-earmark-text" color="secondary" />
                    </div>
                    <div className="col-6 col-md-4 col-xl">
                        {linkTo("employers", <Widget title="Suspended Accounts" value={suspendedCount} icon="bi-person-slash" color="danger" />)}
                    </div>
                </div>

                {/* Charts */}
                <div className="row g-3">
                    <div className="col-md-6 col-xl-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Applications by status</div>
                            <div className="card-body">
                                {statusStats.length === 0
                                    ? <p className="text-muted text-center my-5">No applications yet</p>
                                    : <DoughnutChart labels={statusStats.map(s => statusLabel(s.status))}
                                        values={statusStats.map(s => s.count)}
                                        colors={statusStats.map(s => statusChartColors[s.status])}
                                        label="Applications" />
                                }
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-xl-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Jobs by industry</div>
                            <div className="card-body">
                                {industryStats.length === 0
                                    ? <p className="text-muted text-center my-5">No jobs yet</p>
                                    : <DoughnutChart labels={industryStats.map(i => i.industry ? i.industry : "Not specified")}
                                        values={industryStats.map(i => i.jobs)} label="Jobs" />
                                }
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-xl-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Jobs per company</div>
                            <div className="card-body">
                                {employerJobStats.length === 0
                                    ? <p className="text-muted text-center my-5">No jobs yet</p>
                                    : <BarChart labels={employerJobStats.map(e => e.companyName)}
                                        values={employerJobStats.map(e => e.jobs)} label="Jobs" />
                                }
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-xl-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white fw-semibold">Accounts: active vs suspended</div>
                            <div className="card-body">
                                {totalAccounts === 0
                                    ? <p className="text-muted text-center my-5">No users yet</p>
                                    : <DoughnutChart labels={["Active", "Suspended"]}
                                        values={[totalAccounts - suspendedCount, suspendedCount]}
                                        colors={["#198754", "#dc3545"]} label="Accounts" />
                                }
                            </div>
                        </div>
                    </div>
                </div>

            </div>

    )
}

export default AdminDashboard
