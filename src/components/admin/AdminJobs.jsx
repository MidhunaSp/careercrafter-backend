import axios from "axios"
import { useEffect, useState } from "react"
import { API_SERVER_URL_DEV, PAGE_SIZE } from "../../../config"
import { statusLabel } from "../../utils/statusColors"
import { getErrorMessage, useToast } from "../../utils/toast"
import Pagination from "../common/Pagination"

const size = PAGE_SIZE

function AdminJobs() {

    const toast = useToast()

    const [jobs, setJobs] = useState([])
    const [keyword, setKeyword] = useState("")
    const [page, setPage] = useState(0)
    const [paginationInfo, setPaginationInfo] = useState({ totalPages: 0, totalRecords: 0, numRecordsInPage: 0 })
    const [refresh, setRefresh] = useState(0)

    useEffect(() => {
        const getJobs = async () => {
            let url = `${API_SERVER_URL_DEV}/api/job/filter/v1?page=${page}&size=${size}`
            if (keyword !== "") {
                url = url + `&keyword=${encodeURIComponent(keyword)}`
            }
            try {
                const response = await axios.get(url,
                    {
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                    })


                if (response.data.content.length === 0 && page > 0) {
                    setPage(Math.max(response.data.paginationInfo.totalPages - 1, 0))
                    return
                }
                setJobs(response.data.content)
                setPaginationInfo(response.data.paginationInfo)
            }
            catch (err) {
                toast.error(getErrorMessage(err, "Could not load the jobs"))
            }
        }
        getJobs()
    }, [keyword, page, refresh])

    const closeJob = async (job) => {
        if (!window.confirm(`Close the job "${job.title}"? The employer will be notified.`)) {
            return
        }
        try {
            await axios.put(`${API_SERVER_URL_DEV}/api/admin/job/${job.id}/close`, {},
                {
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
                })
            toast.success(`Job "${job.title}" closed`)
            setRefresh(refresh + 1)
        }
        catch (err) {
            toast.error(getErrorMessage(err, "Could not close the job"))
        }
    }

    return (
        <div className="container-fluid px-4 py-4">

            <h3 className="fw-bold mb-4">Job Listings</h3>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white fw-semibold">Active jobs on the platform</div>
                <div className="card-body">

                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-search"></i></span>
                                <input type="text" className="form-control" placeholder="Search by keyword..."
                                    value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(0) }} />
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Title</th>
                                    <th scope="col">Company</th>
                                    <th scope="col">Location</th>
                                    <th scope="col">Industry</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">Posted On</th>
                                    <th scope="col" className="text-end">Moderate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            <i className="bi bi-inbox fs-3 d-block"></i>No jobs to show
                                        </td>
                                    </tr>
                                )}
                                {
                                    jobs.map((j, index) => (
                                        <tr key={j.id}>
                                            <th scope="row">{page * size + index + 1}</th>
                                            <td className="fw-semibold">{j.title}</td>
                                            <td>{j.companyName}</td>
                                            <td>{j.location}</td>
                                            <td>{j.industry}</td>
                                            <td>{statusLabel(j.employmentType)}</td>
                                            <td>{j.createdAt ? j.createdAt.split("T")[0] : "-"}</td>
                                            <td className="text-end text-nowrap">
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => closeJob(j)}>
                                                    <i className="bi bi-lock me-1"></i>Close job
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
    )
}

export default AdminJobs