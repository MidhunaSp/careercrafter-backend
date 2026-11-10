import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV } from "../../../config"
import AppNavbar from "./AppNavbar"

const profileUrls = {
    JOB_SEEKER: '/api/jobseeker/by-username?username=',
    EMPLOYER: '/api/employer/by-username?username='
}

// icon for each notification type
const typeIcons = {
    APPLICATION_STATUS_CHANGE: 'bi-arrow-repeat',
    NEW_JOB_MATCH: 'bi-stars',
    NEW_APPLICATION_RECEIVED: 'bi-file-earmark-person',
    NEW_MESSAGE: 'bi-chat-dots',
    SYSTEM: 'bi-megaphone'
}

function Notifications({ role }) {

    const navigate = useNavigate()

    const [notifications, setNotifications] = useState([])
    const [errMsg, setErrMsg] = useState("")

    useEffect(() => {
        const loadNotifications = async () => {
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
                if (resp.data.role !== role) {
                    navigate("/no-access")
                    return
                }
            }
            catch {
                navigate("/no-access")
                return
            }

            // step 2: the notification api needs the user id, so load the profile first
            try {
                const profile = await axios.get(
                    API_SERVER_URL_DEV + profileUrls[role] + localStorage.getItem('username'),
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const response = await axios.get(
                    `${API_SERVER_URL_DEV}/api/notification/user/${profile.data.userId}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setNotifications(response.data)
            }
            catch {
                setErrMsg("Could not load the notifications")
            }
        }
        loadNotifications()
    }, [role, navigate])

    const markRead = async (id) => {
        try {
            await axios.put(`${API_SERVER_URL_DEV}/api/notification/${id}/read`, {},
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n))
        }
        catch {
            setErrMsg("Could not mark the notification as read")
        }
    }

    const markAllRead = async () => {
        try {
            const unread = notifications.filter(n => !n.isRead)
            for (const n of unread) {
                await axios.put(`${API_SERVER_URL_DEV}/api/notification/${n.id}/read`, {},
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
            }
            setNotifications(notifications.map(n => ({ ...n, isRead: true })))
        }
        catch {
            setErrMsg("Could not mark the notifications as read")
        }
    }

    const remove = async (id) => {
        try {
            await axios.delete(`${API_SERVER_URL_DEV}/api/notification/${id}`,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setNotifications(notifications.filter(n => n.id !== id))
        }
        catch {
            setErrMsg("Could not delete the notification")
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role={role} />

            <div className="container-fluid px-4 py-4">

                <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                    <h3 className="fw-bold mb-0">
                        Notifications {unreadCount > 0 && <span className="badge text-bg-danger ms-2">{unreadCount} new</span>}
                    </h3>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => markAllRead()}
                        disabled={unreadCount === 0}>
                        <i className="bi bi-check2-all me-1"></i>Mark all as read
                    </button>
                </div>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                <div className="card border-0 shadow-sm">
                    <ul className="list-group list-group-flush">
                        {notifications.length === 0 && (
                            <li className="list-group-item text-center text-muted py-5">
                                <i className="bi bi-bell-slash fs-2 d-block mb-1"></i>No notifications to show
                            </li>
                        )}
                        {
                            notifications.map(n => (
                                <li key={n.id}
                                    className={`list-group-item d-flex justify-content-between align-items-center gap-3 ${n.isRead ? '' : 'bg-primary-subtle'}`}>
                                    <div className="d-flex align-items-center">
                                        <i className={`bi ${typeIcons[n.type]} fs-4 text-primary me-3`}></i>
                                        <div>
                                            <div className={n.isRead ? '' : 'fw-semibold'}>{n.message}</div>
                                            <div className="small text-muted">
                                                {n.type.replaceAll("_", " ")} &middot; {new Date(n.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-nowrap">
                                        {!n.isRead && (
                                            <button className="btn btn-sm btn-outline-primary me-2" title="Mark as read"
                                                onClick={() => markRead(n.id)}>
                                                <i className="bi bi-check2"></i>
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-outline-danger" title="Delete"
                                            onClick={() => remove(n.id)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            ))
                        }
                    </ul>
                </div>

            </div>
        </div>
    )
}

export default Notifications