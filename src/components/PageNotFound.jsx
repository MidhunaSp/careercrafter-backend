import { useEffect } from "react"
import { Link } from "react-router"

function PageNotFound() {
    useEffect(() => {
        localStorage.clear()
    }, [])

    return (
        <div className="bg-body-tertiary min-vh-100 d-flex align-items-center justify-content-center">
            <div className="card border-0 shadow-sm text-center p-4">
                <div className="card-body">
                    <i className="bi bi-shield-exclamation display-1 text-danger"></i>
                    <h3 className="fw-bold mt-3">Page not found or access denied</h3>
                    <p className="text-muted">
                        This page does not exist, or your login has expired. Please login again.
                    </p>
                    <Link to="/login" className="btn btn-dark me-2">
                        <i className="bi bi-box-arrow-in-right me-1"></i>Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PageNotFound