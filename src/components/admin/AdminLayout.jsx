import axios from "axios"
import { useEffect } from "react"
import { Outlet, useNavigate } from "react-router"
import { API_SERVER_URL_DEV } from "../../../config"
import AppNavbar from "../common/AppNavbar"

function AdminLayout() {
    const navigate = useNavigate()

    useEffect(() => {
        const checkAccess = async () => {
            if (!localStorage.getItem('token')) {
                navigate("/login")
                return
            }
            try {
                const resp = await axios.get(API_SERVER_URL_DEV + '/api/auth/user-details',
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                if (resp.data.role !== 'ADMIN') {
                    navigate("/no-access")
                }
            }
            catch {
                navigate("/no-access")
            }
        }
        checkAccess()
    }, [navigate])

    return (
        <div className="bg-body-tertiary min-vh-100">
            <AppNavbar role="ADMIN" />
            <Outlet />
        </div>
    )
}
export default AdminLayout