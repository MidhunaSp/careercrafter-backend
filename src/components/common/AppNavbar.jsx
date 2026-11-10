import axios from "axios"
import { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router"
import { API_SERVER_URL_DEV } from "../../../config"

const menus = {
    JOB_SEEKER: [
        { to: "", icon: "bi-speedometer2", label: "Dashboard", end: true },
        { to: "/jobs", icon: "bi-search", label: "Find Jobs" },
        { to: "/recommended", icon: "bi-stars", label: "Recommended" },
        { to: "/saved", icon: "bi-bookmark-heart", label: "Saved" },
        { to: "/messages", icon: "bi-chat-dots", label: "Messages", badge: "messages" },
        { to: "/notifications", icon: "bi-bell", label: "Notifications", badge: "notifications" },
        { to: "/profile", icon: "bi-person-gear", label: "Profile" }
    ],
    EMPLOYER: [
        { to: "", icon: "bi-speedometer2", label: "Dashboard", end: true },
        { to: "/applicants", icon: "bi-people", label: "Applicants" },
        { to: "/candidates", icon: "bi-search", label: "Candidates" },
        { to: "/notifications", icon: "bi-bell", label: "Notifications", badge: "notifications" },
        { to: "/profile", icon: "bi-person-gear", label: "Profile" }
    ],
    ADMIN: [
        { to: "", icon: "bi-speedometer2", label: "Dashboard", end: true },
        { to: "/users", icon: "bi-people", label: "Users" },
        { to: "/jobs", icon: "bi-briefcase", label: "Jobs" }
    ]
}

const profileUrls = {
    JOB_SEEKER: '/api/jobseeker/by-username?username=',
    EMPLOYER: '/api/employer/by-username?username='
}

function AppNavbar({ role }) {
    const navigate = useNavigate()
    const rolePath = role === 'JOB_SEEKER' ? 'jobseeker' : role.toLowerCase()

    const [unread, setUnread] = useState({ notifications: 0, messages: 0 })

    useEffect(() => {
        if (role === 'ADMIN') {
            return
        }
        const loadCounts = async () => {
            try {
                const profile = await axios.get(
                    API_SERVER_URL_DEV + profileUrls[role] + localStorage.getItem('username'),
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                const userId = profile.data.userId

                const notificationResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/notification/user/${userId}`,
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                let messageCount = 0
                if (role === 'JOB_SEEKER') {
                    const inboxResp = await axios.get(
                        `${API_SERVER_URL_DEV}/api/message/inbox/${userId}`,
                        { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                    messageCount = inboxResp.data.filter(m => !m.isRead).length
                }
                setUnread({
                    notifications: notificationResp.data.filter(n => !n.isRead).length,
                    messages: messageCount
                })
            }
            catch {
                console.log("Could not load the unread counts")
            }
        }
        loadCounts()
        const timer = setInterval(loadCounts, 30000)
        return () => clearInterval(timer)
    }, [role])

    const logout = () => {
        localStorage.clear()
        navigate("/")
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
            <div className="container-fluid px-4">
                <span className="navbar-brand fw-bold">
                    <i className="bi bi-briefcase-fill me-2"></i>CareerCrafter
                    {role === 'ADMIN' && <span className="badge text-bg-warning ms-2 fs-6">Admin</span>}
                    {role === 'EMPLOYER' && <span className="badge text-bg-info ms-2 fs-6">Employer</span>}
                </span>
                <button className="navbar-toggler" type="button"
                    data-bs-toggle="collapse" data-bs-target="#mainNav" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="mainNav">
                    <ul className="navbar-nav me-auto">
                        {
                            menus[role].map(m => (
                                <li className="nav-item" key={m.label}>
                                    <NavLink className="nav-link" end={m.end}
                                        to={`/${rolePath}${m.to}`}>
                                        <i className={`bi ${m.icon} me-1`}></i>{m.label}
                                        {m.badge && unread[m.badge] > 0 &&
                                            <span className="badge text-bg-danger ms-1">{unread[m.badge]}</span>}
                                    </NavLink>
                                </li>
                            ))
                        }
                    </ul>
                    <div className="d-flex align-items-center text-white">
                        <span className="me-3">
                            <i className="bi bi-person-circle me-1"></i>
                            {localStorage.getItem('username')}
                        </span>
                        <button className="btn btn-outline-light btn-sm" onClick={() => logout()}>
                            <i className="bi bi-box-arrow-right me-1"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default AppNavbar