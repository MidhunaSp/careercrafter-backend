import axios from "axios"
import { useEffect, useState } from "react"
import { Link } from "react-router"
import { API_SERVER_URL_DEV } from "../../config"
import { getErrorMessage, useToast } from "../utils/toast";


function Home() {

    const [jobs, setJobs] = useState([])
    const [errMsg, setErrMsg] = useState("")

    const toast = useToast()

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const response = await axios.get(`${API_SERVER_URL_DEV}/api/job/all?page=0&size=6`)
                const jobList = response.data?.list || response.data?.content || (Array.isArray(response.data) ? response.data : [])
                setJobs(jobList)
            }
            catch {
                toast.error("Could not load the latest jobs")
            }
        }
        loadJobs()
    }, [])

    return (
        <div>

            {/* Navbar */}
            <nav className="navbar navbar-dark bg-dark px-4 shadow-sm">
                <span className="navbar-brand fw-bold">
                    <i className="bi bi-briefcase-fill me-2"></i>CareerCrafter
                </span>
                <div>
                    <Link to="/login" className="btn btn-outline-light btn-sm me-2">
                        <i className="bi bi-box-arrow-in-right me-1"></i>Login
                    </Link>
                    <Link to="/signup" className="btn btn-light btn-sm">
                        <i className="bi bi-person-plus me-1"></i>Sign up
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="d-flex align-items-center" style={{ backgroundColor: "#FFD1DC", minHeight: "80vh" }}>
                <div className="container py-5">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-6 text-center text-lg-start">
                            <h1 className="display-4 fw-bold">
                                Find the job you love, or the people you need!
                            </h1>
                            <p className="lead text-muted mt-3 mb-4">
                                CareerCrafter connects job seekers and employers in one place.
                            </p>
                            <Link to="/signup" className="btn btn-dark btn-lg px-5 me-2">Get started</Link>
                            <Link to="/login" className="btn btn-outline-dark btn-lg px-5">Login</Link>
                        </div>
                        <div className="col-lg-6 text-center">
                            <img src="/images/hero.png" alt="Job seeker and employer shaking hands"
                                className="img-fluid" style={{ maxHeight: "420px", mixBlendMode: "multiply" }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* What you can do */}
            <div className="bg-body-tertiary">
                <div className="container py-5">
                    <h2 className="fw-bold text-center mb-5">What you can do</h2>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm border-0 text-center">
                                <div className="card-body p-4">
                                    <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-inline-flex align-items-center justify-content-center mb-3 fs-2 p-3">
                                        <i className="bi bi-search"></i>
                                    </div>
                                    <h5 className="fw-bold">Search jobs</h5>
                                    <p className="text-muted mb-0">
                                        Find jobs by title, location, industry and salary, and apply with your resume.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm border-0 text-center">
                                <div className="card-body p-4">
                                    <div className="rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center mb-3 fs-2 p-3">
                                        <i className="bi bi-file-earmark-person"></i>
                                    </div>
                                    <h5 className="fw-bold">Manage resumes</h5>
                                    <p className="text-muted mb-0">
                                        Keep more than one resume and pick the right one for each job.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm border-0 text-center">
                                <div className="card-body p-4">
                                    <div className="rounded-circle bg-warning bg-opacity-10 text-warning d-inline-flex align-items-center justify-content-center mb-3 fs-2 p-3">
                                        <i className="bi bi-people"></i>
                                    </div>
                                    <h5 className="fw-bold">Hire talent</h5>
                                    <p className="text-muted mb-0">
                                        Employers post jobs, review applicants and update their application status.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* For job seekers */}
            <div className="bg-white border-top border-bottom">
                <div className="container py-5">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-6 text-center">
                            <img src="/images/jobseeker.png" alt="Job seeker using a laptop"
                                className="img-fluid w-75" />
                        </div>
                        <div className="col-lg-6">
                            <h2 className="fw-bold mb-3">For job seekers</h2>
                            <p className="text-muted">Land your next role without the chasing.</p>
                            <ul className="list-unstyled mb-4">
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Build a profile with your education, experience and skills</li>
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Keep several resumes and choose a default</li>
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Track every application from applied to hired</li>
                            </ul>
                            <Link to="/signup" className="btn btn-dark">Join as a job seeker</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* For employers */}
            <div className="bg-white">
                <div className="container py-5">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-6">
                            <h2 className="fw-bold mb-3">For employers</h2>
                            <p className="text-muted">Reach the right people and hire faster.</p>
                            <ul className="list-unstyled mb-4">
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Post jobs and attach a job description</li>
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Review applicants and their resumes in one place</li>
                                <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Update the status and message candidates directly</li>
                            </ul>
                            <Link to="/signup" className="btn btn-dark">Join as an employer</Link>
                        </div>
                        <div className="col-lg-6 text-center">
                            <img src="/images/employer.png" alt="Resumes being reviewed"
                                className="img-fluid w-75" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Latest jobs */}
            <div className="py-5 bg-body-tertiary">
                <div className="container">
                    <h2 className="fw-bold text-center mb-5">Latest jobs</h2>

                    {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                    <div className="row g-3">
                        {jobs.length === 0 && !errMsg && (
                            <p className="text-center text-muted">No jobs to show yet</p>
                        )}
                        {
                            jobs.map(j => (
                                <div className="col-md-6 col-lg-4" key={j.id}>
                                    <div className="card h-100 shadow-sm border-0">
                                        <div className="card-body">
                                            <h5 className="card-title mb-1">{j.title}</h5>
                                            <p className="text-muted mb-2">{j.companyName}</p>
                                            <p className="small mb-3">
                                                <i className="bi bi-geo-alt me-1"></i>{j.location}
                                                <span className="badge text-bg-secondary ms-2">
                                                    {j.employmentType.replace("_", " ")}
                                                </span>
                                            </p>
                                            <Link to="/login" className="btn btn-sm btn-outline-primary">
                                                Login to apply
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* Closing call to action */}
            <div style={{ backgroundColor: "#FFD1DC" }}>
                <div className="container py-5">
                    <div className="row align-items-center g-4">
                        <div className="col-lg-6 text-center text-lg-start">
                            <h2 className="fw-bold">Ready to get started?</h2>
                            <p className="text-muted mb-4">
                                Join CareerCrafter today, it only takes a minute to create your account.
                            </p>
                            <Link to="/signup" className="btn btn-dark btn-lg px-5 me-2">Sign up</Link>
                            <Link to="/login" className="btn btn-outline-dark btn-lg px-5">Login</Link>
                        </div>
                        <div className="col-lg-6 text-center">
                            <img src="/images/cta.png" alt="A team working together"
                                className="img-fluid" style={{ maxHeight: "260px", mixBlendMode: "multiply" }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-dark text-white-50 text-center py-3">
                <small>&copy; CareerCrafter, The Job Portal</small>
            </footer>

        </div>
    )
}

export default Home