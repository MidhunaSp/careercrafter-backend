import axios from "axios"
import { useEffect, useState } from "react"
import { API_SERVER_URL_DEV } from "../../../config"

function ChatBox({ senderId, receiverId, jobApplicationId }) {

    const [messages, setMessages] = useState([])
    const [content, setContent] = useState("")
    const [errMsg, setErrMsg] = useState("")

    const conversationUrl = `${API_SERVER_URL_DEV}/api/message/conversation?user1=${senderId}&user2=${receiverId}`

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const response = await axios.get(conversationUrl,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setMessages(response.data)

                const unread = response.data.filter(m => m.receiverId === senderId && !m.isRead)
                for (const m of unread) {
                    await axios.put(`${API_SERVER_URL_DEV}/api/message/${m.id}/read`, {},
                        {
                            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                        })
                }
            }
            catch {
                setErrMsg("Could not load the messages")
            }
        }
        loadMessages()
    }, [conversationUrl, senderId])

    const sendMessage = async (e) => {
        e.preventDefault()
        setErrMsg("")

        let url = `${API_SERVER_URL_DEV}/api/message/add/${senderId}/${receiverId}`
        if (jobApplicationId) {
            url = url + `?jobApplicationId=${jobApplicationId}`
        }

        try {
            await axios.post(url, { 'content': content },
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setContent("")

            const response = await axios.get(conversationUrl,
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            setMessages(response.data)
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Could not send the message"))
        }
    }

    const shown = messages.slice(-8)

    return (
        <div>
            {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}

            <div className="d-flex flex-column gap-2 mb-3">
                {messages.length > shown.length &&
                    <small className="text-muted text-center">Showing the latest {shown.length} of {messages.length} messages</small>}
                {messages.length === 0 && (
                    <div className="text-center text-muted py-3">
                        <i className="bi bi-chat-dots fs-3 d-block"></i>No messages yet. Say hello!
                    </div>
                )}
                {
                    shown.map(m => {
                        const mine = m.senderId === senderId
                        return (
                            <div key={m.id}
                                className={`w-75 rounded-3 px-3 py-2 ${mine ? 'align-self-end bg-primary text-white' : 'align-self-start bg-light border'}`}>
                                <div>{m.content}</div>
                                <div className={`small ${mine ? 'text-white-50' : 'text-muted'}`}>
                                    {mine ? "You" : m.senderUsername} &middot; {new Date(m.sentAt).toLocaleString()}
                                </div>
                            </div>
                        )
                    })
                }
            </div>

            <form onSubmit={(e) => sendMessage(e)}>
                <div className="input-group">
                    <input type="text" className="form-control" placeholder="Type a message..."
                        maxLength="2000" required value={content}
                        onChange={(e) => setContent(e.target.value)} />
                    <button type="submit" className="btn btn-primary">
                        <i className="bi bi-send me-1"></i>Send
                    </button>
                </div>
            </form>
        </div>
    )
}

export default ChatBox