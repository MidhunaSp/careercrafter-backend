import { getInitials, splitSkills } from "../../utils/profile"

const formatMoney = (n) => (n === null || n === undefined || n === "") ? null : Number(n).toLocaleString("en-IN")

// skills shown as chips: the job's own skills when the backend sends them, otherwise the skills that matched (recommended tab)
const chipsOf = (job, matchedSkills) => {
    const own = Array.isArray(job.skills) ? job.skills : splitSkills(job.skills || job.requiredSkills)
    return (own.length > 0 ? own : (matchedSkills || [])).slice(0, 5)
}

// one job as a bootstrap card (used by the Jobs tab and the Recommended tab)
// the parent puts these inside <div className="row g-4"> -> 2 cards per row on large screens
function JobCard({ job, applied, saved, onView, onToggleSave, score, matchedSkills }) {

    const min = formatMoney(job.minSalary)
    const max = formatMoney(job.maxSalary)
    const salary = min && max ? `₹${min} - ₹${max}` : (min ? `From ₹${min}` : (max ? `Up to ₹${max}` : "Not disclosed"))
    const chips = chipsOf(job, matchedSkills)
    const fromJob = Array.isArray(job.skills) || !!job.skills || !!job.requiredSkills
    const applicants = job.applicants ?? job.applicantCount ?? job.applicationCount
    const posted = job.createdAt ? job.createdAt.split("T")[0] : null
    const description = job.description && job.description.length > 110 ? job.description.slice(0, 110) + "…" : job.description

    return (
        <div className="col-12 col-lg-6">
            {/* shadow + no border + big rounded corners = the soft shadow look */}
            <div className="card border-0 shadow rounded-4 h-100">
                <div className="card-body p-4 d-flex flex-column">

                    {/* header */}
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-body-secondary border rounded-3 fw-bold fs-5 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 56, height: 56 }}>
                            {getInitials(job.companyName)}
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                            <h5 className="fw-bold mb-0 text-truncate" title={job.title}>{job.title}</h5>
                            <div className="text-muted small text-truncate">
                                <i className="bi bi-building me-1"></i>{job.companyName}
                            </div>
                        </div>
                        {score !== undefined
                            ? <span className="badge rounded-pill text-bg-primary align-self-start"><i className="bi bi-stars me-1"></i>{score}% match</span>
                            : job.industry && <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis align-self-start">{job.industry}</span>}
                    </div>

                    {/* type / location / salary */}
                    <div className="d-flex bg-body-tertiary border rounded-3 py-2 my-3">
                        <div className="flex-fill px-3 overflow-hidden">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.7rem" }}>Type</div>
                            <div className="fw-semibold small text-truncate">{(job.employmentType || "").replaceAll("_", " ")}</div>
                        </div>
                        <div className="flex-fill px-3 border-start overflow-hidden">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.7rem" }}>Location</div>
                            <div className="fw-semibold small text-truncate" title={job.location}>{job.location}</div>
                        </div>
                        <div className="flex-fill px-3 border-start overflow-hidden">
                            <div className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.7rem" }}>Salary</div>
                            <div className="fw-bold small text-success text-truncate" title={salary}>{salary}</div>
                        </div>
                    </div>

                    <p className="text-secondary mb-3">{description}</p>

                    {/* skill chips */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        {chips.map(s => (
                            <span key={s} className={`badge border fw-normal px-3 py-2 ${fromJob ? "bg-light text-dark" : "bg-success-subtle text-success-emphasis"}`}>{s}</span>
                        ))}
                    </div>

                    {/* footer */}
                    <div className="border-top pt-3 mt-auto d-flex justify-content-between align-items-center gap-2 flex-wrap">
                        <div className="text-muted small">
                            {posted && <span><i className="bi bi-calendar3 me-1"></i>{posted}</span>}
                            {posted && applicants !== undefined && <span className="mx-2">•</span>}
                            {applicants !== undefined && <span><i className="bi bi-people me-1"></i>{applicants} applicants</span>}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button className="btn btn-outline-warning" title={saved ? "Remove from saved" : "Save job"} onClick={onToggleSave}>
                                <i className={`bi ${saved ? "bi-bookmark-fill" : "bi-bookmark"}`}></i>
                            </button>
                            {applied
                                ? <button className="btn btn-outline-success rounded-pill px-3" onClick={onView}><i className="bi bi-check2 me-1"></i>Applied</button>
                                : <button className="btn btn-primary rounded-pill px-3" onClick={onView}>Apply Now <i className="bi bi-chevron-right"></i></button>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default JobCard
