import { useState } from "react"
import axios from "axios"
import { API_SERVER_URL_DEV } from "../../../config"

const emptyForm = {
    title: "",
    description: "",
    qualifications: "",
    location: "",
    industry: "",
    employmentType: "FULL_TIME",
    minSalary: "",
    maxSalary: "",
    applicationInstructions: ""
}

function AddJob({ employerId, job, onJobAdded }) {

    const [form, setForm] = useState(job ? {
        title: job.title,
        description: job.description,
        qualifications: job.qualifications || "",
        location: job.location,
        industry: job.industry || "",
        employmentType: job.employmentType,
        minSalary: job.minSalary ?? "",
        maxSalary: job.maxSalary ?? "",
        applicationInstructions: job.applicationInstructions || ""
    } : emptyForm)
    
    const [errMsg, setErrMsg] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [jdFile, setJdFile] = useState(null)
    const [fileKey, setFileKey] = useState(0)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleJdFile = (e) => {
        const file = e.target.files[0]
        if (!file) { setJdFile(null); return }
        if (file.type !== "application/pdf") {
            setErrMsg("JD must be a PDF file")
            e.target.value = ""
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrMsg("JD file must be 5 MB or smaller")
            e.target.value = ""
            return
        }
        setErrMsg("")
        setJdFile(file)
    }

    const uploadJd = async (jobId, headers) => {
        const formData = new FormData()
        formData.append("file", jdFile)
        await axios.post(`${API_SERVER_URL_DEV}/api/job/${jobId}/jd`, formData, headers)
    }

    const postJob = async (e) => {
        e.preventDefault()
        setErrMsg("")
        setSuccessMsg("")

        let jobDto = {
            title: form.title,
            description: form.description,
            qualifications: form.qualifications,
            location: form.location,
            industry: form.industry,
            employmentType: form.employmentType,
            minSalary: form.minSalary === "" ? null : Number(form.minSalary),
            maxSalary: form.maxSalary === "" ? null : Number(form.maxSalary),
            applicationInstructions: form.applicationInstructions
        }

        try {
            const headers = {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            }
            let jobId = job?.id
            if (job) {
                await axios.put(`${API_SERVER_URL_DEV}/api/job/${job.id}`, jobDto, headers)
                setSuccessMsg("Job updated successfully")
            }
            else {
                const res = await axios.post(`${API_SERVER_URL_DEV}/api/job/add/${employerId}`, jobDto, headers)
                jobId = res.data.id
                setSuccessMsg("Job posted successfully")
                setForm(emptyForm)
            }

            if (jdFile) {
                try {
                    await uploadJd(jobId, headers)
                    setSuccessMsg((job ? "Job updated" : "Job posted") + " with JD successfully")
                    setJdFile(null)
                    setFileKey(fileKey + 1)
                }
                catch (uploadErr) {
                    setSuccessMsg("")
                    setErrMsg((job ? "Job updated" : "Job posted") + ", but the JD upload failed: "
                        + (uploadErr?.response?.data?.message || "please try again"))
                }
            }
            onJobAdded()
        }
        catch (err) {
            const data = err?.response?.data
            setErrMsg(data?.message ? data.message : (data && typeof data === 'object' ? Object.values(data).join(", ") : "Something went wrong"))
        }
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold">{job ? "Edit job" : "Post a new job"}</div>
            <div className="card-body">

                {errMsg && <div className="alert alert-danger py-2">{errMsg}</div>}
                {successMsg && <div className="alert alert-success py-2">{successMsg}</div>}

                <form onSubmit={(e) => postJob(e)}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">Job Title</label>
                            <input type="text" name="title" className="form-control" required
                                value={form.title} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">Location</label>
                            <input type="text" name="location" className="form-control" required
                                value={form.location} onChange={handleChange} />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">Industry</label>
                            <input type="text" name="industry" className="form-control"
                                value={form.industry} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">Employment Type</label>
                            <select name="employmentType" className="form-select"
                                value={form.employmentType} onChange={handleChange}>
                                <option value="FULL_TIME">Full Time</option>
                                <option value="PART_TIME">Part Time</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="INTERNSHIP">Internship</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">Min Salary</label>
                            <input type="number" name="minSalary" className="form-control" min="0"
                                value={form.minSalary} onChange={handleChange} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label small fw-semibold text-secondary">Max Salary</label>
                            <input type="number" name="maxSalary" className="form-control" min="0"
                                value={form.maxSalary} onChange={handleChange} />
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-semibold text-secondary">Qualifications</label>
                            <input type="text" name="qualifications" className="form-control"
                                value={form.qualifications} onChange={handleChange} />
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-semibold text-secondary">Description</label>
                            <textarea name="description" className="form-control" rows="3" required
                                value={form.description} onChange={handleChange}></textarea>
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-semibold text-secondary">
                                Job Description (PDF, optional, max 5 MB)
                            </label>
                            <input type="file" key={fileKey} accept="application/pdf" className="form-control"
                                onChange={handleJdFile} />
                        </div>

                        <div className="col-12">
                            <label className="form-label small fw-semibold text-secondary">Application Instructions</label>
                            <input type="text" name="applicationInstructions" className="form-control" maxLength="200"
                                value={form.applicationInstructions} onChange={handleChange} />
                        </div>

                        <div className="col-12">
                            <button type="submit" className="btn btn-primary">
                                <i className="bi bi-send me-1"></i>{job ? "Update Job" : "Post Job"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddJob