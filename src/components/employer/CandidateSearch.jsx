import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { API_SERVER_URL_DEV, PAGE_SIZE } from "../../../config"
import { splitSkills } from "../../utils/profile"
import AppNavbar from "../common/AppNavbar"
import Pagination from "../common/Pagination"
import CandidateProfile from "../common/CandidateProfile"
import ResumeViewer from "../common/ResumeViewer"

const size = PAGE_SIZE

function CandidateSearch() {

    const navigate = useNavigate()

    const [candidates, setCandidates] = useState([])
    const [name, setName] = useState("")
    const [location, setLocation] = useState("")
    const [skill, setSkill] = useState("")
    const [page, setPage] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
    const [selected, setSelected] = useState(null)
    const [errMsg, setErrMsg] = useState("")
    const [sharedResumes, setSharedResumes] = useState([])
    const [loadingResumes, setLoadingResumes] = useState(false)
    const [openResume, setOpenResume] = useState(null)

    useEffect(() => {
        const checkAccess = async () => {
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
        }
        checkAccess()
    }, [navigate])

    useEffect(() => {
        const getCandidates = async () => {
            const query = new URLSearchParams({ page: page, size: size })
            if (name !== "") {
                query.append("fullName", name)
            }
            if (location !== "") {
                query.append("location", location)
            }
            if (skill !== "") {
                query.append("skills", skill)
            }
            try {
                const response = await axios.get(`${API_SERVER_URL_DEV}/api/jobseeker/filter?${query.toString()}`,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })
                setCandidates(response.data.content)
                setPaginationInfo(response.data.paginationInfo)
                setErrMsg("")
            }
            catch {
                setErrMsg("Could not load the candidates")
            }
        }
        getCandidates()
    }, [name, location, skill, page])

    // when a candidate is opened, load the resumes he has chosen to share with employers
    useEffect(() => {
        setSharedResumes([])
        setOpenResume(null)
        if (!selected) {
            return
        }
        let cancelled = false

        const loadShared = async () => {
            setLoadingResumes(true)
            try {
                const resp = await axios.get(
                    `${API_SERVER_URL_DEV}/api/resume/shared/jobseeker/${selected.id}`,
                    { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
                if (!cancelled) {
                    setSharedResumes(resp.data)
                }
            }
            catch {
                if (!cancelled) {
                    setSharedResumes([])
                }
            }
            if (!cancelled) {
                setLoadingResumes(false)
            }
        }
        loadShared()

        // ignore the response if the modal is closed or another candidate is opened
        return () => {
            cancelled = true
        }
    }, [selected])

    return (
        <div className="bg-body-tertiary min-vh-100">

            <AppNavbar role="EMPLOYER" />

            <div className="container-fluid px-4 py-4">

                <h3 className="fw-bold mb-4">Search Candidates</h3>

                {errMsg && <div className="alert alert-danger">{errMsg}</div>}

                <div className="card border-0 shadow-sm">
                    <div className="card-body">

                        {/* Filters */}
                        <div className="row g-3 mb-3">
                            <div className="col-md-4">
                                <div className="input-group">
                                    <span className="input-group-text"><i className="bi bi-person"></i></span>
                                    <input type="text" className="form-control" placeholder="Name"
                                        value={name} onChange={(e) => { setName(e.target.value); setPage(0) }} />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="input-group">
                                    <span className="input-group-text"><i className="bi bi-geo-alt"></i></span>
                                    <input type="text" className="form-control" placeholder="Location"
                                        value={location} onChange={(e) => { setLocation(e.target.value); setPage(0) }} />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="input-group">
                                    <span className="input-group-text"><i className="bi bi-tools"></i></span>
                                    <input type="text" className="form-control" placeholder="Skill (e.g. java)"
                                        value={skill} onChange={(e) => { setSkill(e.target.value); setPage(0) }} />
                                </div>
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">Name</th>
                                        <th scope="col">Location</th>
                                        <th scope="col">Skills</th>
                                        <th scope="col" className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">
                                                <i className="bi bi-person-x fs-3 d-block"></i>No candidates to show
                                            </td>
                                        </tr>
                                    )}
                                    {
                                        candidates.map((c, index) => (
                                            <tr key={c.id}>
                                                <th scope="row">{page * size + index + 1}</th>
                                                <td className="fw-semibold">{c.fullName}</td>
                                                <td>{c.location}</td>
                                                <td>
                                                    {splitSkills(c.skills).slice(0, 5).map(s => (
                                                        <span key={s} className="badge text-bg-light border me-1">{s}</span>
                                                    ))}
                                                </td>
                                                <td className="text-end text-nowrap">
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => setSelected(c)}>
                                                        <i className="bi bi-person-lines-fill me-1"></i>View profile
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>

                        <Pagination page={page} setPage={setPage} paginationInfo={paginationInfo} />
                    </div>
                </div>

            </div>

            {selected && (
                <div>
                    <div className="modal d-block" tabIndex="-1">
                        <div className="modal-dialog modal-lg modal-dialog-scrollable">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Candidate profile</h5>
                                    <button type="button" className="btn-close" onClick={() => setSelected(null)}></button>
                                </div>
                                <div className="modal-body">
                                    <CandidateProfile profile={selected} />

                                    {/* Resumes the candidate has chosen to share with employers */}
                                    <hr />
                                    <h6 className="fw-bold">
                                        <i className="bi bi-file-earmark-pdf me-1"></i>Shared resumes
                                    </h6>

                                    {loadingResumes && (
                                        <div className="text-muted small">
                                            <span className="spinner-border spinner-border-sm me-2"></span>Loading resumes...
                                        </div>
                                    )}

                                    {!loadingResumes && sharedResumes.length === 0 && (
                                        <p className="text-muted small mb-0">
                                            This candidate has not shared a resume with employers.
                                        </p>
                                    )}

                                    {sharedResumes.map(r => (
                                        <div key={r.id} className="mb-2">
                                            <button type="button"
                                                className={`btn btn-sm ${openResume?.id === r.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setOpenResume(openResume?.id === r.id ? null : r)}>
                                                <i className="bi bi-file-earmark-text me-1"></i>{r.label}
                                            </button>
                                            <span className="text-muted small ms-2">{r.fileName}</span>

                                            {openResume?.id === r.id && (
                                                <div className="mt-2">
                                                    <ResumeViewer key={r.id}
                                                        apiPath={`/api/resume/shared/${r.id}/file`}
                                                        fileName={r.fileName} filePath={r.filePath} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setSelected(null)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show"></div>
                </div>
            )}
        </div>
    )
}

export default CandidateSearch