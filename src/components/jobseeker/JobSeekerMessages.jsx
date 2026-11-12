import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV } from "../../../config"
import AppNavbar from "../common/AppNavbar"
import ChatBox from "../common/ChatBox"

function JobSeekerMessages() {

    const navigate = useNavigate()

    const [userId, setUserId] = useState(null)
    const [conversations, setConversations] = useState([])
    const [selected, setSelected] = useState(null)
    const [errMsg, setErrMsg] = useState("")

    useEffect(() => {
        const loadPage = async () => {
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

            // step 2: the message apis need the user id
            try {
                const jsResp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/jobseeker/by-username?username=${localStorage.getItem('username')}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const js = jsResp.data
                setUserId(js.userId)

                const inbox = await axios.get(`${API_SERVER_URL_DEV}/api/message/inbox/${js.userId}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                const sent = await axios.get(`${API_SERVER_URL_DEV}/api/message/sent/${js.userId}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })

                const map = {}
                const all = [...inbox.data, ...sent.data]
                all.forEach(m => {
                    const mine = m.senderId === js.userId
                    const otherId = mine ? m.receiverId : m.senderId
                    const otherName = mine ? m.receiverUsername : m.senderUsername

                    if (!map[otherId]) {
                        map[otherId] = { otherId: otherId, otherName: otherName, unread: 0, last: m }
                    }
                    if (new Date(m.sentAt) > new Date(map[otherId].last.sentAt)) {
                        map[otherId].last = m
                    }
                    if (!mine && !m.isRead) {
                        map[otherId].unread = map[otherId].unread + 1
                    }
                })

                const list = Object.values(map)
                list.sort((a, b) => new Date(b.last.sentAt) - new Date(a.last.sentAt))
                setConversations(list)
            }
            catch {
                setErrMsg("Could not load the messages")
            }
        }
        loadPage()
    }, [navigate])

    const openChat = (conv) => {
        setSelected(conv)
        setConversations(conversations.map(c => c.otherId === conv.otherId ? { ...c, unread: 0 } : c))
    }

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="JOB_SEEKER" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-1">Messages</h3>
                <p className="text-muted mb-4">Conversations with employers. To start a new one, open an application on your dashboard and use Track.</p>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                <div className="row g-3">

                    {/* Conversation list */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white fw-semibold">Employers</div>
                            <div className="list-group list-group-flush">
                                {conversations.length === 0 && (
                                    <div className="list-group-item text-center text-muted py-4">
                                        <i className="bi bi-chat-dots fs-3 d-block"></i>No messages yet
                                    </div>
                                )}
                                {
                                    conversations.map(c => (
                                        <button key={c.otherId}
                                            className={`list-group-item list-group-item-action ${selected && selected.otherId === c.otherId ? 'active' : ''}`}
                                            onClick={() => openChat(c)}>
                                            <div className="d-flex justify-content-between">
                                                <span className="fw-semibold">
                                                    <i className="bi bi-building me-1"></i>{c.otherName}
                                                </span>
                                                {c.unread > 0 && <span className="badge text-bg-danger">{c.unread}</span>}
                                            </div>
                                            <div className="small text-truncate">{c.last.content}</div>
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Chat */}
                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white fw-semibold">
                                {selected ? `Chat with ${selected.otherName}` : "Select a conversation"}
                            </div>
                            <div className="card-body">
                                {selected && userId
                                    ? <ChatBox key={selected.otherId} senderId={userId} receiverId={selected.otherId} />
                                    : <p className="text-muted text-center my-4">Pick an employer on the left to read the messages.</p>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default JobSeekerMessages