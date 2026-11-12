export const splitSkills = (skills) => {
    if (!skills) {
        return []
    }
    return skills.split(",").map(s => s.trim()).filter(s => s !== "")
}


export const getInitials = (name) => {
    if (!name) {
        return "?"
    }
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join("")
}

export const getProfileStrength = (jobSeeker, resumeCount) => {
    const checks = [
        { label: "Full name", done: !!jobSeeker.fullName },
        { label: "Phone number", done: !!jobSeeker.phone },
        { label: "Location", done: !!jobSeeker.location },
        { label: "Education", done: !!jobSeeker.education },
        { label: "Experience", done: !!jobSeeker.experience },
        { label: "Skills", done: !!jobSeeker.skills },
        { label: "At least one resume", done: resumeCount > 0 }
    ]
    const done = checks.filter(c => c.done).length
    return {
        percent: Math.round((done * 100) / checks.length),
        checks: checks
    }
}