import { getInitials, splitSkills } from "../../utils/profile"

function CandidateProfile({ profile }) {
    const skills = splitSkills(profile.skills)

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-primary text-white fw-bold fs-3 px-4 py-3 me-3">
                    {getInitials(profile.fullName)}
                </div>
                <div>
                    <h5 className="fw-bold mb-0">{profile.fullName}</h5>
                    <div className="text-muted small">@{profile.username}</div>
                </div>
            </div>

            <ul className="list-unstyled mb-3">
                <li className="mb-1"><i className="bi bi-geo-alt text-primary me-2"></i>{profile.location || "Location not added"}</li>
                <li><i className="bi bi-telephone text-primary me-2"></i>{profile.phone}</li>
            </ul>

            <h6 className="fw-bold"><i className="bi bi-mortarboard me-1"></i>Education</h6>
            <p className="text-secondary text-break">{profile.education}</p>

            <h6 className="fw-bold"><i className="bi bi-briefcase me-1"></i>Experience</h6>
            <p className="text-secondary text-break">{profile.experience}</p>

            <h6 className="fw-bold"><i className="bi bi-tools me-1"></i>Skills</h6>
            <div>
                {skills.length === 0 && <span className="text-muted">Not added</span>}
                {skills.map(s => (
                    <span key={s} className="badge text-bg-primary-subtle border border-primary-subtle text-primary-emphasis me-1 mb-1">{s}</span>
                ))}
            </div>
        </div>
    )
}

export default CandidateProfile